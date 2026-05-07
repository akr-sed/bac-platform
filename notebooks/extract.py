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
import datetime
import json
import os
import sys
import time
import uuid
from pathlib import Path

from google import genai
from google.genai import types


# ── Config ────────────────────────────────────────────────────────────────────

MODEL      = "gemini-3-flash-preview"  # or "gemini-2.0-flash" for a smaller model with faster response and lower cost
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


# ── Filière fallback list ─────────────────────────────────────────────────────
# Used when --filiere is not passed by the user.
# Replace this function body to load from DB, config, or any other source.
def get_default_filiere_list() -> list[str]:
    return [
        "sciences_experimentales",
        "mathematiques",
        "technique_mathematiques",
        "gestion_economie",
        "lettres_philosophie",
    ]


def build_filiere_instruction(filiere: str | None, subject: str, metadata: dict) -> str:
    """
    Build the {filiere_instruction} text injected into the system prompt.

    - If the user passed --filiere: tell the LLM the value is already known,
      just copy it into the output.
    - If not: give the LLM the full allowed list and ask it to read the PDF.
    """
    if filiere:
        return (
            f'The filiere for this exam is already known: "{filiere}". '
            'Copy this value exactly into the output — do not read it from the PDF.'
        )

    # Build allowed list: prefer subjects_metadata.json, fall back to hardcoded list
    subject_data = metadata.get(subject, {})
    filieres_from_meta = list(subject_data.get("filieres", {}).keys())
    allowed = filieres_from_meta if filieres_from_meta else get_default_filiere_list()

    allowed_str = " | ".join(allowed)
    arabic_map = (
        '  "علوم تجريبية" → sciences_experimentales\n'
        '  "رياضيات" → mathematiques\n'
        '  "تقني رياضي" → technique_mathematiques\n'
        '  "تسيير واقتصاد" → gestion_economie\n'
        '  "آداب وفلسفة" → lettres_philosophie'
    )
    return (
        f"Allowed values: {allowed_str}\n"
        f"Read the filiere from the exam header and map it:\n"
        f"{arabic_map}\n"
        "If the filiere is not printed or not recognizable, set to null."
    )


def build_topics_and_concepts_block(subject: str, filiere: str | None, metadata: dict) -> str:
    """
    Build the {topics_and_concepts} block to inject into the system prompt.

    If filiere is known, use only that filiere's topics.
    If not, merge topics across all filieres for the subject (deduped).
    Falls back gracefully if subject is not in subjects_metadata.json.
    """
    subject_data = metadata.get(subject)
    if not subject_data:
        return (
            "Choose 'topic' as a short descriptive label for the main chapter "
            "(e.g. 'analyse', 'probabilités', 'géométrie').\n"
            "Choose 'concepts' as a list of short snake_case skill labels "
            "(e.g. ['limites', 'derivation', 'etude_de_fonction'])."
        )

    filieres     = subject_data.get("filieres", {})
    filiere_data = filieres.get(filiere) if filiere else None

    if filiere_data:
        topics = filiere_data.get("topics", {})
    else:
        # Merge all filieres, dedup concepts per topic
        topics: dict = {}
        for fd in filieres.values():
            for t_key, t_val in fd.get("topics", {}).items():
                if t_key not in topics:
                    topics[t_key] = dict(t_val)
                    topics[t_key]["concepts"] = list(t_val.get("concepts", []))
                else:
                    for c in t_val.get("concepts", []):
                        if c not in topics[t_key]["concepts"]:
                            topics[t_key]["concepts"].append(c)

    if not topics:
        return (
            "Choose 'topic' as a short descriptive label for the main chapter. "
            "Choose 'concepts' as a list of short snake_case skill labels."
        )

    topic_keys = " | ".join(topics.keys())
    lines = [
        'You MUST choose "topic" from this exact list — do not invent new values:',
        f"  {topic_keys}",
        "",
        'You MUST choose "concepts" from this exact list — pick all that apply:',
    ]

    for t_key, t_val in topics.items():
        t_label  = t_val.get("label", t_key)
        concepts = t_val.get("concepts", [])
        c_str    = " | ".join(concepts)
        lines.append(f"\n{t_label.upper()}:")
        lines.append(f"  {c_str}")

    lines += [
        "",
        "If an exercise combines two topics, pick the dominant one as 'topic'",
        "and list concepts from both under 'concepts'.",
        "If a concept is genuinely not in the list, put it in 'metadata' instead.",
    ]

    return "\n".join(lines)


# ── Prompt loading ─────────────────────────────────────────────────────────────

def load_system_prompt(filiere_instruction: str, topics_and_concepts_block: str) -> str:
    """Load system prompt and inject filiere_instruction + topics/concepts block."""
    if not SYSTEM_PROMPT_FILE.exists():
        raise FileNotFoundError(f"System prompt not found: {SYSTEM_PROMPT_FILE}")
    template = SYSTEM_PROMPT_FILE.read_text(encoding="utf-8")
    template = template.replace("{filiere_instruction}", filiere_instruction)
    template = template.replace("{topics_and_concepts}", topics_and_concepts_block)
    return template.strip()


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
    """Extract JSON from model response, handling markdown fences if present.
    Uses iterative parsing to catch and fix common LLM escaping errors (e.g. unescaped \\ in LaTeX).
    """
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if text.endswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines[1:]).strip()
    
    max_retries = 500
    retries = 0
    while retries < max_retries:
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            err_msg = str(e)
            pos = e.pos
            if "Invalid \\escape" in err_msg and text[pos] == '\\':
                text = text[:pos] + '\\\\' + text[pos+1:]
            elif "Invalid control character" in err_msg:
                char = text[pos]
                if char == '\n':
                    text = text[:pos] + '\\n' + text[pos+1:]
                elif char == '\t':
                    text = text[:pos] + '\\t' + text[pos+1:]
                elif char == '\r':
                    text = text[:pos] + '\\r' + text[pos+1:]
                else:
                    raise
            else:
                raise
        retries += 1
    
    # If we hit max retries, try one last time and let it naturally throw the exception
    return json.loads(text)


def validate_output(data: dict) -> None:
    """Basic sanity checks on the extracted JSON."""
    # ── exam_metadata
    if "exam_metadata" not in data:
        raise ValueError("Response missing 'exam_metadata' key.")
    meta = data["exam_metadata"]
    for required in ("id", "subject", "exam_type", "language"):
        if required not in meta:
            raise ValueError(f"exam_metadata missing required field: '{required}'")
    if meta.get("exam_type") not in {"bac", "bac_blanc", "trimestre", None}:
        raise ValueError(f"Invalid exam_type: '{meta.get('exam_type')}'")
    if meta.get("session") not in {"principal", "rattrapage", None}:
        raise ValueError(f"Invalid session: '{meta.get('session')}'")
    if meta.get("language") not in {"ar", "fr", "ar_fr", None}:
        raise ValueError(f"Invalid language: '{meta.get('language')}'")

    # ── exercises
    if "exercises" not in data:
        raise ValueError("Response missing 'exercises' key.")
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

def save_error_result(
    output_path: Path,
    exam_metadata: dict,
    error: Exception,
    response_text: str | None = None,
) -> None:
    """Save a JSON file with error details when extraction fails.
    
    Error files use .error.json suffix to avoid conflicts with success files.
    """
    error_file = output_path.with_stem(output_path.stem + ".error")
    error_data = {
        "error": True,
        "exam_id": exam_metadata.get("exam_id"),
        "subject": exam_metadata.get("subject"),
        "filiere": exam_metadata.get("filiere"),
        "source_file": exam_metadata.get("source_file"),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "response_text": response_text,
        "timestamp": datetime.datetime.now().isoformat(),
    }
    error_file.parent.mkdir(parents=True, exist_ok=True)
    error_file.write_text(
        json.dumps(error_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def extract(pdf_path: Path, exam_metadata: dict, output_path: Path | None = None) -> dict:
    """
    Full extraction pipeline:
      1. Load subjects_metadata and build topics/concepts block
      2. Load and render system + user prompts
      3. Upload PDF to Gemini File API
      4. Call the model
      5. Parse, validate, inject IDs
      6. Save output JSON

    On failure, saves an error JSON file with metadata and error details.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GOOGLE_API_KEY is not set.\n"
            "Export it with: export GOOGLE_API_KEY='your-key-here'"
        )

    # ── 1. Build prompt injections from curriculum config
    subjects_meta    = load_subjects_metadata()
    subject          = exam_metadata["subject"]
    filiere          = exam_metadata.get("filiere")
    filiere_instr    = build_filiere_instruction(filiere, subject, subjects_meta)
    tc_block         = build_topics_and_concepts_block(subject, filiere, subjects_meta)

    # ── 2. Render prompts
    system_prompt = load_system_prompt(filiere_instr, tc_block)
    user_prompt   = load_user_prompt(exam_metadata)

    # ── 3. Upload PDF
    client = genai.Client(api_key=api_key)
    uploaded_file = upload_pdf(client, pdf_path)

    # ── 4. Call the model
    print(f"  Sending to {MODEL} …")
    raw_text = None
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
                max_output_tokens=64_000,
            ),
        )
        raw_text = response.text
        print(f"  Response received ({len(raw_text)} chars)")
    except genai.errors.APIError as e:
        print(f"\nAPI error: {e.message}", file=sys.stderr)
        client.files.delete(name=uploaded_file.name)
        if output_path:
            save_error_result(output_path, exam_metadata, e, raw_text)
        raise

    # ── 5. Parse + patch IDs
    try:
        data = parse_response(raw_text)
    except json.JSONDecodeError as e:
        if output_path:
            save_error_result(output_path, exam_metadata, e, raw_text)
        raise
    except Exception as e:
        if output_path:
            save_error_result(output_path, exam_metadata, e, raw_text)
        raise

    exam_id = exam_metadata["exam_id"]
    data["exam_id"] = exam_id

    # Patch exam_metadata id and any CLI-known fields the LLM may have missed
    if "exam_metadata" in data:
        data["exam_metadata"]["id"]      = exam_id
        data["exam_metadata"]["subject"] = exam_metadata["subject"]
        data["exam_metadata"]["source_file"] = exam_metadata.get("source_file")
        # If filiere was passed via CLI, it overrides what the LLM read
        if exam_metadata.get("filiere"):
            data["exam_metadata"]["filiere"] = exam_metadata["filiere"]

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
    try:
        validate_output(data)
    except ValueError as e:
        if output_path:
            save_error_result(output_path, exam_metadata, e, raw_text)
        raise

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  Saved → {output_path}")

    return data


# ── Batch extraction ────────────────────────────────────────────────────────────

def batch_extract(
    input_dir: Path,
    output_dir: Path,
    exam_metadata_template: dict,
    rest_time: float = 2.0,
    max_pdfs: int | None = None,
) -> dict:
    """
    Extract all PDFs from input_dir and save results to output_dir.

    Args:
        input_dir: Directory containing PDF files
        output_dir: Directory to save JSON outputs
        exam_metadata_template: Base metadata dict (must include 'subject' and optionally 'filiere')
        rest_time: Seconds to wait between API requests (default: 2.0)
        max_pdfs: Maximum number of PDFs to process (None = all)

    Returns:
        Summary dict with 'processed', 'skipped', 'failed', 'errors'
    """
    if not input_dir.is_dir():
        raise ValueError(f"Input directory not found: {input_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)

    # Find all PDFs in the input directory
    pdf_files = sorted(input_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {input_dir}")
        return {"processed": [], "skipped": [], "failed": [], "errors": []}

    # Determine which PDFs need processing
    to_process = []
    already_processed = []

    for pdf_path in pdf_files:
        # Only skip if a success file exists (not error files)
        json_output = output_dir / pdf_path.with_suffix(".json").name
        if json_output.exists():
            already_processed.append(pdf_path.name)
        else:
            to_process.append(pdf_path)

    # Respect max_pdfs limit
    if max_pdfs is not None:
        to_process = to_process[:max_pdfs]

    print(f"\nBatch Extraction Summary:")
    print(f"  Input directory:  {input_dir}")
    print(f"  Output directory: {output_dir}")
    print(f"  Total PDFs found: {len(pdf_files)}")
    print(f"  Already processed: {len(already_processed)}")
    print(f"  To process: {len(to_process)}")
    if max_pdfs:
        print(f"  Max limit: {max_pdfs}")
    print(f"  Rest time between requests: {rest_time}s")
    print()

    results = {
        "processed": [],
        "skipped": already_processed,
        "failed": [],
        "errors": [],
    }

    # Process each PDF
    for idx, pdf_path in enumerate(to_process, start=1):
        print(f"[{idx}/{len(to_process)}] Processing: {pdf_path.name}")

        try:
            # Build exam metadata for this specific PDF
            exam_id = str(uuid.uuid4())
            exam_metadata = {**exam_metadata_template}
            exam_metadata["exam_id"] = exam_id
            exam_metadata["source_file"] = pdf_path.name

            output_path = output_dir / pdf_path.with_suffix(".json").name

            # Extract
            extract(pdf_path, exam_metadata, output_path)
            results["processed"].append(pdf_path.name)
            print(f"  ✓ Success → {output_path.name}\n")

            # Rest between requests (except for the last one)
            if idx < len(to_process):
                print(f"  Waiting {rest_time}s before next request...")
                time.sleep(rest_time)

        except Exception as e:
            error_msg = f"{pdf_path.name}: {str(e)}"
            results["failed"].append(pdf_path.name)
            results["errors"].append(error_msg)
            print(f"  ✗ Failed: {str(e)}")
            
            # Check if an error JSON was saved
            output_path = output_dir / pdf_path.with_suffix(".json").name
            error_file = output_path.with_stem(output_path.stem + ".error")
            if error_file.exists():
                print(f"  Error details saved → {error_file.name}\n")
            else:
                print()
            
            # Still rest even on failure
            if idx < len(to_process):
                time.sleep(rest_time)

    # Print summary
    print("\n" + "=" * 70)
    print("BATCH EXTRACTION COMPLETE")
    print("=" * 70)
    print(f"Processed: {len(results['processed'])}")
    print(f"Skipped (already done): {len(results['skipped'])}")
    print(f"Failed: {len(results['failed'])}")
    print()

    if results["processed"]:
        print("Processed files:")
        for f in results["processed"]:
            print(f"  ✓ {f}")
        print()

    if results["skipped"]:
        print("Skipped files:")
        for f in results["skipped"]:
            print(f"  ⊘ {f}")
        print()

    if results["failed"]:
        print("Failed files:")
        for f in results["failed"]:
            print(f"  ✗ {f}")
        print()

    if results["errors"]:
        print("Errors:")
        for err in results["errors"]:
            print(f"  • {err}")
        print()

    return results


# ── CLI ────────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Extract BAC exam exercises from PDF(s) using Gemini.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single PDF - BAC sciences experimentales
  python extract.py \\
      --pdf exams/bac_math_2023_s1.pdf \\
      --subject mathematics \\
      --filiere sciences_experimentales \\
      --year 2023 --session principal --language fr

  # Single PDF - trimester exam
  python extract.py \\
      --pdf exams/trim1_math_2023.pdf \\
      --subject mathematics \\
      --filiere mathematiques \\
      --year 2023 --trimester 1 --language ar

  # Batch extraction - process all PDFs in a directory
  python extract.py \\
      --batch-input exams/bac_2023_math \\
      --batch-output results/bac_2023_math \\
      --subject mathematics \\
      --filiere sciences_experimentales \\
      --year 2023 --session principal \\
      --rest-time 3.0 --max-pdfs 10

  # Batch with limit and rest time
  python extract.py \\
      --batch-input exams/ \\
      --batch-output results/ \\
      --subject mathematics \\
      --rest-time 5.0 --max-pdfs 5

  # List available topics for a subject/filiere (dry run)
  python extract.py --list-topics --subject mathematics --filiere gestion_economie
        """,
    )
    # Single PDF mode
    p.add_argument("--pdf", default=None, help="Path to the exam PDF")
    
    # Batch mode
    p.add_argument("--batch-input", default=None, 
                   help="Directory containing PDF files to process")
    p.add_argument("--batch-output", default=None,
                   help="Directory to save extracted JSON files")
    p.add_argument("--rest-time", type=float, default=2.0,
                   help="Seconds to wait between API requests (default: 2.0)")
    p.add_argument("--max-pdfs", type=int, default=None,
                   help="Maximum number of PDFs to process (None = all)")
    
    # Exam metadata
    p.add_argument("--subject", default="mathematics")
    p.add_argument("--filiere", default=None,
                   help="sciences_experimentales | mathematiques | technique_mathematiques | gestion_economie | lettres_philosophie")
    p.add_argument("--year", type=int, default=None, help="Exam year (e.g. 2023)")
    p.add_argument("--session", default=None, help="principal | rattrapage")
    p.add_argument("--trimester", type=int, default=None, help="1 | 2 | 3")
    p.add_argument("--language", default="ar", help="ar | fr | ar_fr")
    p.add_argument("--region", default="national")
    p.add_argument("--output", default=None, help="Path to save the JSON output (single PDF mode)")
    p.add_argument("--exam-id", default=None, help="UUID for this exam (auto-generated if omitted)")
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

    # ── Batch mode
    if args.batch_input:
        if not args.batch_output:
            parser.error("--batch-output is required when using --batch-input")

        input_dir = Path(args.batch_input)
        output_dir = Path(args.batch_output)

        exam_metadata_template = {
            "subject": args.subject,
            "filiere": args.filiere,
            "year": args.year,
            "session": args.session,
            "trimester": args.trimester,
            "language": args.language,
            "region": args.region,
        }

        try:
            batch_extract(
                input_dir=input_dir,
                output_dir=output_dir,
                exam_metadata_template=exam_metadata_template,
                rest_time=args.rest_time,
                max_pdfs=args.max_pdfs,
            )
        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Unexpected error: {e}", file=sys.stderr)
            raise

        sys.exit(0)

    # ── Single PDF mode
    if not args.pdf:
        parser.error("--pdf is required unless using --batch-input (or --list-topics)")

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

    meta      = result.get("exam_metadata", {})
    exercises = result.get("exercises", [])
    figures   = result.get("figures", [])
    parts     = sum(len(ex.get("parts", [])) for ex in exercises)

    print(f"\nDone.")
    print(f"  exam_type  : {meta.get('exam_type')}")
    print(f"  filiere    : {meta.get('filiere')}")
    print(f"  year       : {meta.get('year')}")
    print(f"  session    : {meta.get('session')}")
    print(f"  trimester  : {meta.get('trimester')}")
    print(f"  language   : {meta.get('language')}")
    print(f"  duration   : {meta.get('duration_minutes')} min")
    print(f"  total marks: {meta.get('total_marks')}")
    print(f"  {len(exercises)} exercise(s), {parts} part(s), {len(figures)} figure(s)")
    print(f"  Output: {output_path}\n")


if __name__ == "__main__":
    main()