"""Typed records for the AI hinting pipeline.

We flatten the raw exam JSON (which is exam-centric, possibly multi-subject)
into exercise-centric records so retrieval and prompting can operate on a
single unit.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Optional, Union


SourcePage = Union[int, list[int]]


@dataclass(frozen=True)
class PartRecord:
    id: str
    label: Optional[str]
    sub_label: Optional[str]
    statement: str
    solution: Optional[str]
    depends_on: tuple[str, ...]
    marks: Optional[float]
    has_figure: bool
    ordering: int
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_solved(self) -> bool:
        return bool(self.solution and self.solution.strip())

    @property
    def key(self) -> str:
        """e.g. "1-أ" — matches the depends_on / part_ref convention."""
        if self.sub_label:
            return f"{self.label}-{self.sub_label}"
        return str(self.label or "")


@dataclass(frozen=True)
class FigureRecord:
    id: str
    exercise_ref: Optional[int]
    part_ref: Optional[str]
    figure_type: Optional[str]
    description: str
    source_page: Optional[int]
    bounding_box: Optional[tuple[float, float, float, float]]  # [ymin, xmin, ymax, xmax] in [0..1000]
    context: Optional[str]                                     # "question" | "solution"

    @property
    def is_question(self) -> bool:
        return (self.context or "question") == "question"


@dataclass(frozen=True)
class ExerciseRecord:
    """A single exercise, denormalised with its parent exam metadata."""

    # exam-level identity
    exam_id: str
    exam_source_file: str         # e.g. "2023.pdf" — used to locate the source PDF
    exam_year: Optional[int]
    exam_type: Optional[str]
    session: Optional[str]
    sujet: Optional[int]
    filiere: Optional[str]
    language: Optional[str]
    subject: Optional[str]

    # exercise-level
    id: str
    number: int
    title: Optional[str]
    statement: str
    topic: Optional[str]
    concepts: tuple[str, ...]
    difficulty: Optional[str]
    marks: Optional[float]
    has_figure: bool
    source_page: Optional[SourcePage]
    exercise_solution: Optional[str]      # exercise-level solution (rare)
    parts: tuple[PartRecord, ...]
    figures: tuple[FigureRecord, ...]
    metadata: dict[str, Any] = field(default_factory=dict)

    # ── derived ────────────────────────────────────────────────────────────
    @property
    def is_fully_solved(self) -> bool:
        """True iff we have a complete teacher solution (either exercise-level
        or every part solved)."""
        if self.exercise_solution and self.exercise_solution.strip():
            return True
        if not self.parts:
            return False
        return all(p.is_solved for p in self.parts)

    @property
    def key(self) -> str:
        """Stable cross-run identifier suitable for filenames."""
        year = self.exam_year if self.exam_year is not None else "unknown"
        suffix = f"_s{self.sujet}" if self.sujet else ""
        return f"{year}{suffix}_ex{self.number}_{self.id[:8]}"

    @property
    def question_figures(self) -> tuple[FigureRecord, ...]:
        """Figures attached to the question (not the solution)."""
        return tuple(f for f in self.figures if f.is_question)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class RetrievalHit:
    """A solved exercise retrieved as a few-shot example."""

    exercise: ExerciseRecord
    score: float
    matched_concepts: tuple[tuple[str, str, int], ...]

    def summary(self) -> dict[str, Any]:
        return {
            "exam_year": self.exercise.exam_year,
            "exam_source_file": self.exercise.exam_source_file,
            "exercise_number": self.exercise.number,
            "sujet": self.exercise.sujet,
            "topic": self.exercise.topic,
            "filiere": self.exercise.filiere,
            "score": round(self.score, 4),
            "matched_concepts": [
                {"target": t, "hit": h, "fuzz": s}
                for (t, h, s) in self.matched_concepts
            ],
        }


@dataclass
class SolutionStep:
    index: int
    explanation: str
    math: Optional[str] = None


@dataclass
class SolvedPart:
    label: Optional[str]
    sub_label: Optional[str]
    depends_on: list[str] = field(default_factory=list)
    steps: list[SolutionStep] = field(default_factory=list)
    final_answer: Optional[str] = None


@dataclass
class SolutionOutput:
    """The pipeline's structured solution for one exercise."""

    exercise_id: str
    exercise_key: str
    language: str
    provider: Optional[str] = None
    parts: list[SolvedPart] = field(default_factory=list)
    exercise_level_solution: Optional[str] = None
    notes: Optional[str] = None

    # bookkeeping
    model: Optional[str] = None
    retrieval: list[dict[str, Any]] = field(default_factory=list)
    attachments: list[dict[str, Any]] = field(default_factory=list)
    elapsed_ms: Optional[int] = None
    usage: dict[str, Any] = field(default_factory=dict)
    raw_response: Optional[str] = None
    parse_error: Optional[str] = None
