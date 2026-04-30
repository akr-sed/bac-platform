
"""
BAC Exam Exercise Extractor
────────────────────────────
Uses Gemini 2.0 Flash to extract exercises from a PDF exam file
and returns structured JSON matching the platform database schema.

Usage:
    python extract.py --pdf path/to/exam.pdf [options]

Setup:
    pip install google-genai
    export GOOGLE_API_KEY="your-key-here"
"""

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

from google import genai
from google.genai import types


# ── Config ────────────────────────────────────────────────────────────────────

MODEL      = "gemini-3-flash-preview"
SCRIPT_DIR = Path(__file__).parent

SYSTEM_PROMPT_FILE  = SCRIPT_DIR / "config/system_prompt.txt"
USER_PROMPT_FILE    = SCRIPT_DIR / "config/user_prompt.txt"
SUBJECTS_META_FILE  = SCRIPT_DIR / "config/subjects_metadata.json"


# ── Curriculum metadata loader ────────────────────────────────────────────────

def load_subjects_metadata() -> dict:
    """Load the full subjects_metadata.json config file."""
    if not SUBJECTS_META_FILE.exists():
        raise FileNotFoundError(f"subjects_metadata.json not found: {SUBJECTS_META_FILE}")
    with open(SUBJECTS_META_FILE, encoding="utf-8") as f:
        return json.load(f)


def build_topics_and_concepts_block(subject: str, filiere: str | None, metadata: dict) -> str:
    """
    Build the {topics_and_concepts} block to inject into the system prompt.

    Looks up subject → filiere → topics in subjects_metadata.json and formats
    the allowed values as a clear, structured instruction block for the LLM.

    Returns a plain-text block ready to be inserted into the prompt.
    Falls back to an open instruction if subject/filiere not found in metadata.
    """
    subject_data = metadata.get(subject)
    if not subject_data:
        return (
            "Choose 'topic' as a short descriptive label for the main chapter "
            "(e.g. 'analyse', 'probabilités', 'géométrie').\n"
            "Choose 'concepts' as a list of short snake_case skill labels "
            "(e.g. ['limites', 'derivation', 'etude_de_fonction'])."
        )

    filieres = subject_data.get("filieres", {})
    filiere_data = filieres.get(filiere) if filiere else None

    # If filiere not found, merge all topics from all filieres as fallback
    if not filiere_data:
        all_topics: dict = {}
        for fd in filieres.values():
            for t_key, t_val in fd.get("topics", {}).items():
                if t_key not in all_topics:
                    all_topics[t_key] = t_val
                else:
                    # Merge concepts, dedup
                    merged = list(dict.fromkeys(
                        all_topics[t_key]["concepts"] + t_val["concepts"]
                    ))
                    all_topics[t_key]["concepts"] = merged
        topics = all_topics
    else:
        topics = filiere_data.get("topics", {})

    if not topics:
        return (
            "Choose 'topic' as a short descriptive label for the main chapter. "
            "Choose 'concepts' as a list of short snake_case skill labels."
        )

    topic_keys   = " | ".join(topics.keys())
    lines = [
        f'You MUST choose "topic" from this exact list — do not invent new values:',
        f"  {topic_keys}",
        "",
        f'You MUST choose "concepts" from this exact list — pick all that apply:',
    ]

    for t_key, t_val in topics.items():
        t_label    = t_val.get("label", t_key)
        concepts   = t_val.get("concepts", [])
        c_str      = " | ".join(concepts)
        lines.append(f"\n{t_label.upper()}:")
        lines.append(f"  {c_str}")

    lines += [
        "",
        "If an exercise clearly combines two topics (e.g. suites + nombres_complexes),",
        "pick the dominant topic and list concepts from both under 'concepts'.",
        "If a concept is genuinely not in the list, add it to 'metadata' instead — do not invent new concept keys.",
    ]

    return "\n".join(lines)


# ── Prompt loading ─────────────────────────────────────────────────────────────

def load_system_prompt(topics_and_concepts_block: str) -> str:
    """Load system prompt and inject the topics/concepts block."""
    if not SYSTEM_PROMPT_FILE.exists():
        raise FileNotFoundError(f"System prompt not found: {SYSTEM_PROMPT_FILE}")
    template = SYSTEM_PROMPT_FILE.read_text(encoding="utf-8")
    return template.replace("{topics_and_concepts}", topics_and_concepts_block).strip()


def load_user_prompt(exam_metadata: dict) -> str:
    """Load user prompt template and fill in exam metadata placeholders."""
    if not USER_PROMPT_FILE.exists():
        raise FileNotFoundError(f"User prompt not found: {USER_PROMPT_FILE}")
    template = USER_PROMPT_FILE.read_text(encoding="utf-8")
    for key, value in exam_metadata.items():
        placeholder = "{" + key + "}"
        template = template.replace(placeholder, str(value) if value is not None else "null")
    return template.strip()


# ── PDF upload ─────────────────────────────────────────────────────────────────

def upload_pdf(client: genai.Client, pdf_path: Path) -> types.File:
    """Upload the PDF to the Gemini File API (valid for 48h)."""
    print(f"  Uploading {pdf_path.name} …")
    with open(pdf_path, "rb") as f:
        uploaded = client.files.upload(
            file=f,
            config=types.UploadFileConfig(
                mime_type="application/pdf",
                display_name=pdf_path.name,
            ),
        )
    print(f"  Uploaded → {uploaded.name}")
    return uploaded


# ── Response parsing ───────────────────────────────────────────────────────────

def parse_response(raw: str) -> dict:
    """Extract JSON from model response, handling markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]).strip()
    return json.loads(text)


def validate_output(data: dict) -> None:
    """Basic sanity checks on the extracted JSON."""
    if "exercises" not in data:
        raise ValueError("Response missing top-level 'exercises' key.")
    if not isinstance(data["exercises"], list):
        raise ValueError("'exercises' must be a list.")
    for ex in data["exercises"]:
        for required in ("id", "number", "statement", "parts"):
            if required not in ex:
                raise ValueError(
                    f"Exercise missing required field '{required}'. Got: {list(ex.keys())}"
                )
    if "figures" not in data:
        data["figures"] = []


# ── Core extraction ────────────────────────────────────────────────────────────

def extract(pdf_path: Path, exam_metadata: dict, output_path: Path | None = None) -> dict:
    """
    Full extraction pipeline:
      1. Load subjects_metadata and build topics/concepts block
      2. Load and render system + user prompts
      3. Upload PDF to Gemini File API
      4. Call the model
      5. Parse, validate, inject IDs
      6. Save output JSON
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GOOGLE_API_KEY is not set.\n"
            "Export it with: export GOOGLE_API_KEY='your-key-here'"
        )

    # ── 1. Build topics/concepts block from curriculum config
    subjects_meta = load_subjects_metadata()
    tc_block = build_topics_and_concepts_block(
        subject=exam_metadata["subject"],
        filiere=exam_metadata.get("filiere"),
        metadata=subjects_meta,
    )

    # ── 2. Render prompts
    system_prompt = load_system_prompt(tc_block)
    user_prompt   = load_user_prompt(exam_metadata)

    # ── 3. Upload PDF
    client = genai.Client(api_key=api_key)
    uploaded_file = upload_pdf(client, pdf_path)

    # ── 4. Call the model
    print(f"  Sending to {MODEL} …")
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=[
                types.Part.from_uri(
                    file_uri=uploaded_file.uri,
                    mime_type="application/pdf",
                ),
                types.Part.from_text(text=user_prompt),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                max_output_tokens=32_000,
            ),
        )
    except genai.errors.APIError as e:
        print(f"\nAPI error: {e.message}", file=sys.stderr)
        client.files.delete(name=uploaded_file.name)
        raise

    raw_text = response.text
    print(f"  Response received ({len(raw_text)} chars)")

    # ── 5. Parse + patch IDs
    data = parse_response(raw_text)

    exam_id = exam_metadata["exam_id"]
    data["exam_id"] = exam_id

    for exercise in data.get("exercises", []):
        exercise["exam_id"] = exam_id
        if not exercise.get("id"):
            exercise["id"] = str(uuid.uuid4())
        for part in exercise.get("parts", []):
            part["exercise_id"] = exercise["id"]
            if not part.get("id"):
                part["id"] = str(uuid.uuid4())

    for figure in data.get("figures", []):
        figure["exam_id"] = exam_id
        if not figure.get("id"):
            figure["id"] = str(uuid.uuid4())

    # ── 6. Validate + save
    validate_output(data)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  Saved → {output_path}")

    return data


# ── CLI ────────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Extract BAC exam exercises from a PDF using Gemini.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # BAC sciences experimentales
  python extract.py \\
      --pdf exams/bac_math_2023_s1.pdf \\
      --subject mathematics \\
      --filiere sciences_experimentales \\
      --year 2023 --session principal --language fr

  # Filiere mathematiques, trimester exam
  python extract.py \\
      --pdf exams/trim1_math_2023.pdf \\
      --subject mathematics \\
      --filiere mathematiques \\
      --year 2023 --trimester 1 --language ar

  # List available topics for a subject/filiere (dry run)
  python extract.py --list-topics --subject mathematics --filiere gestion_economie
        """,
    )
    p.add_argument("--pdf",       default=None, help="Path to the exam PDF")
    p.add_argument("--subject",   default="mathematics")
    p.add_argument("--filiere",   default=None,
                   help="sciences_experimentales | mathematiques | technique_mathematiques | gestion_economie | lettres_philosophie")
    p.add_argument("--year",      type=int, default=None, help="Exam year (e.g. 2023)")
    p.add_argument("--session",   default=None, help="principal | rattrapage")
    p.add_argument("--trimester", type=int, default=None, help="1 | 2 | 3")
    p.add_argument("--language",  default="ar", help="ar | fr | ar_fr")
    p.add_argument("--region",    default="national")
    p.add_argument("--output",    default=None, help="Path to save the JSON output")
    p.add_argument("--exam-id",   default=None, help="UUID for this exam (auto-generated if omitted)")
    p.add_argument("--list-topics", action="store_true",
                   help="Print the topics/concepts block for a subject/filiere and exit")
    return p


def main() -> None:
    parser = build_parser()
    args   = parser.parse_args()

    # ── Dry-run: just print the topics block
    if args.list_topics:
        meta  = load_subjects_metadata()
        block = build_topics_and_concepts_block(args.subject, args.filiere, meta)
        print(f"\nTopics/concepts for subject='{args.subject}' filiere='{args.filiere}':\n")
        print(block)
        print()
        sys.exit(0)

    if not args.pdf:
        parser.error("--pdf is required unless using --list-topics")

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    exam_id = args.exam_id or str(uuid.uuid4())

    exam_metadata = {
        "exam_id":     exam_id,
        "subject":     args.subject,
        "filiere":     args.filiere,
        "year":        args.year,
        "session":     args.session,
        "trimester":   args.trimester,
        "language":    args.language,
        "region":      args.region,
        "source_file": pdf_path.name,
    }

    output_path = Path(args.output) if args.output else pdf_path.with_suffix(".json")

    print(f"\nExtracting: {pdf_path.name}")
    print(f"  exam_id   : {exam_id}")
    print(f"  subject   : {exam_metadata['subject']}")
    print(f"  filiere   : {exam_metadata['filiere']}")
    print(f"  year      : {exam_metadata['year']}")
    print(f"  session   : {exam_metadata['session']}")
    print(f"  trimester : {exam_metadata['trimester']}")
    print(f"  language  : {exam_metadata['language']}")
    print()

    try:
        result = extract(pdf_path, exam_metadata, output_path)
    except json.JSONDecodeError as e:
        print(f"\nJSON parse error: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"\nValidation error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}", file=sys.stderr)
        raise

    exercises = result.get("exercises", [])
    figures   = result.get("figures", [])
    parts     = sum(len(ex.get("parts", [])) for ex in exercises)

    print(f"\nDone.")
    print(f"  {len(exercises)} exercise(s)")
    print(f"  {parts} part(s)")
    print(f"  {len(figures)} figure(s)")
    print(f"  Output: {output_path}\n")


if __name__ == "__main__":
    main()
