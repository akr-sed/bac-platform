"""System and user prompt builders for the math BAC solver.

When figure crops are attached, the prompt references them by the same
label the provider uses for the image part. Without crops, we fall back
to the text description from the extractor.
"""

from __future__ import annotations

import json
from textwrap import dedent
from typing import Iterable, Sequence

from .figures import CroppedFigure
from .schema import ExerciseRecord, FigureRecord, RetrievalHit


# ── System prompt (math-first) ─────────────────────────────────────────────
SYSTEM_PROMPT_MATH = dedent("""
    You are an expert mathematics teacher who has graded thousands of Algerian
    Baccalauréat (BAC) exam papers. You solve BAC math exercises with the same
    rigour, notation, and pedagogical conventions used in official Algerian
    correction grids (نموذج الإجابة الرسمي).

    ## Mission
    Produce a complete, correct, well-explained solution to the TARGET
    exercise. You will be given 1–N similar SOLVED exercises retrieved from
    the official corpus. Treat them as authoritative style references:

    • Follow the SAME demonstration patterns (e.g. *raisonnement par
      récurrence* in the canonical 3-step layout: initialisation /
      hérédité / conclusion).
    • Use the SAME notation (variable names, accented punctuation,
      direction of writing) as the references.
    • Match the granularity: if references prove a monotony claim by
      computing f′(x) and signing it, do that too — don't hand-wave.
    • If a reference solution is wrong on a sub-question (it happens),
      silently produce the correct answer. Do not copy mistakes.

    ## Figures
    Some questions ship with image attachments. When you see a reference
    like `[figure_N · figure_type · ex<n> · part <p>]` in the target
    statement, the corresponding image is attached to this message — read
    it and use the actual contents (coordinates, branch probabilities,
    geometric configuration). Figure descriptions in the prompt are a
    secondary fallback; trust the image when both are present.

    ## Discipline
    • Be rigorous, not exhaustive. One clean justification beats three
      redundant ones.
    • Every numerical or symbolic claim must be derivable from the line
      above it. No magic numbers.
    • Use LaTeX exactly as in the corpus:
        – Inline math: $...$
        – Display math: $$...$$
        – Double-escape backslashes in JSON output: \\\\frac, \\\\lim, etc.
    • Preserve the source language of the target exercise (Arabic with
      LaTeX, French, or mixed). Do not translate into English.
    • If the exercise has parts (questions 1.a, 1.b, …): solve EACH part
      independently in the order given. Use the part labels exactly as
      they appear (including Arabic letters أ ب ج).
    • When a part depends on an earlier result, restate it briefly
      ("d'après la question 1-a, …") before using it.
    • If you cannot finish a part (genuinely stuck or missing info),
      say so explicitly in that part's `notes`. Do not fabricate a result.

    ## Output contract (STRICT)
    Return ONE JSON object, no markdown fences, no commentary.

    {
      "exercise_id": "<copy from target>",
      "language": "<ar|fr|ar_fr>",
      "parts": [
        {
          "label": "1",                # exactly as in the target
          "sub_label": "أ",             # or null
          "depends_on": ["1-أ"],        # from target if present, else []
          "steps": [
            {"index": 1, "explanation": "...", "math": "$...$"},
            {"index": 2, "explanation": "...", "math": null}
          ],
          "final_answer": "$...$"
        }
      ],
      "exercise_level_solution": null,  # use only when the target has
                                        # no `parts` and a single solution
      "notes": null
    }

    `math` is optional per step (use null when a step is purely textual
    reasoning). `final_answer` should be the cleanest closed form of the
    asked-for quantity, or a short conclusion sentence in the source
    language when the question is qualitative (existence, monotony, etc.).
""").strip()


# ── Subject hooks (extensible) ─────────────────────────────────────────────
SUBJECT_HINTS: dict[str, str] = {
    "mathematics": "",   # already covered above
    # "physics": "Always show unit propagation and dimensional checks. ...",
    # "chemistry": "Balance reactions before any stoichiometric calculation. ...",
}


def system_prompt_for(subject: str | None) -> str:
    base = SYSTEM_PROMPT_MATH
    if subject:
        extra = SUBJECT_HINTS.get(subject.lower())
        if extra:
            return f"{base}\n\n## Subject-specific notes\n{extra}"
    return base


# ── User prompt builder ────────────────────────────────────────────────────
def _figures_block(
    figures: Iterable[FigureRecord],
    *,
    cropped_labels: dict[str, str] | None = None,
) -> str:
    figs = list(figures)
    if not figs:
        return ""
    lines = ["", "<figures>"]
    for f in figs:
        ref = (
            f"exercise {f.exercise_ref}"
            + (f", part {f.part_ref}" if f.part_ref else "")
        )
        attrs = [
            f'type="{f.figure_type or "unspecified"}"',
            f'context="{f.context or "question"}"',
            f'ref="{ref}"',
        ]
        if cropped_labels and f.id in cropped_labels:
            attrs.append(f'image="{cropped_labels[f.id]}"')
        lines.append(f'  <figure {" ".join(attrs)}>{f.description}</figure>')
    lines.append("</figures>")
    return "\n".join(lines)


def _parts_block(ex: ExerciseRecord, *, include_solutions: bool) -> str:
    if not ex.parts:
        if include_solutions and ex.exercise_solution:
            return f"\n<solution>{ex.exercise_solution}</solution>"
        return ""
    lines = ["", "<parts>"]
    for p in ex.parts:
        attrs = []
        if p.label:
            attrs.append(f'label="{p.label}"')
        if p.sub_label:
            attrs.append(f'sub_label="{p.sub_label}"')
        if p.depends_on:
            attrs.append(f'depends_on="{",".join(p.depends_on)}"')
        if p.marks is not None:
            attrs.append(f'marks="{p.marks}"')
        if p.has_figure:
            attrs.append('has_figure="true"')
        attr_str = (" " + " ".join(attrs)) if attrs else ""
        lines.append(f"  <part{attr_str}>")
        lines.append(f"    <statement>{p.statement}</statement>")
        if include_solutions and p.solution:
            lines.append(f"    <solution>{p.solution}</solution>")
        lines.append("  </part>")
    lines.append("</parts>")
    return "\n".join(lines)


def _exercise_block(
    ex: ExerciseRecord,
    *,
    tag: str,
    include_solutions: bool,
    cropped: Sequence[CroppedFigure] = (),
) -> str:
    head_attrs = [f'topic="{ex.topic or ""}"', f'filiere="{ex.filiere or ""}"']
    if ex.exam_year:
        head_attrs.append(f'year="{ex.exam_year}"')
    if ex.sujet:
        head_attrs.append(f'sujet="{ex.sujet}"')
    if ex.concepts:
        head_attrs.append(f'concepts="{",".join(ex.concepts)}"')

    body = [
        f'<{tag} {" ".join(head_attrs)}>',
        f"  <statement>{ex.statement}</statement>",
    ]
    body.append(_parts_block(ex, include_solutions=include_solutions))
    cropped_labels = {cf.figure.id: cf.label for cf in cropped}
    body.append(_figures_block(ex.figures, cropped_labels=cropped_labels))
    body.append(f"</{tag}>")
    return "\n".join(b for b in body if b)


def build_user_prompt(
    target: ExerciseRecord,
    similar: Sequence[RetrievalHit],
    *,
    cropped_figures: Sequence[CroppedFigure] = (),
) -> str:
    """Assemble the user-message payload.

    Reference exercises come first (with solutions); the target comes last
    (without solutions). When `cropped_figures` is non-empty, the prompt
    references each crop by its label, and those images should be sent as
    image attachments in the same provider call.
    """
    parts: list[str] = []
    parts.append(
        "You will solve ONE TARGET BAC exercise. First, study the reference "
        "solved exercises below to lock in the demonstration style, then "
        "produce the solution for the target.\n"
    )

    if cropped_figures:
        parts.append(
            f"The following {len(cropped_figures)} figure crop(s) are "
            "attached to this message in order:"
        )
        for cf in cropped_figures:
            parts.append(f"  • [{cf.label}] — {cf.figure.description[:200]}")
        parts.append("")

    if similar:
        parts.append(f'<reference_exercises count="{len(similar)}">')
        for i, hit in enumerate(similar, start=1):
            parts.append(
                f"<!-- ref #{i}: score={hit.score:.3f} "
                f"matched={[m[0] + '~' + m[1] for m in hit.matched_concepts]} -->"
            )
            parts.append(_exercise_block(hit.exercise, tag="reference", include_solutions=True))
        parts.append("</reference_exercises>\n")
    else:
        parts.append("<!-- No reference exercises matched. Solve from first principles. -->\n")

    parts.append("<target_exercise>")
    parts.append(
        _exercise_block(
            target,
            tag="target",
            include_solutions=False,
            cropped=cropped_figures,
        )
    )
    parts.append("</target_exercise>\n")

    parts.append(
        "Return exactly one JSON object that satisfies the contract described "
        "in the system message. The `exercise_id` field MUST be:"
    )
    parts.append(json.dumps({"exercise_id": target.id}, ensure_ascii=False))
    return "\n".join(parts)
