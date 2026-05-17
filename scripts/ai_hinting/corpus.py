"""Corpus loader: parse exam JSONs into flat ExerciseRecord objects.

Accepts both layouts:
  • Flat (legacy):     {"exam_metadata": {...}, "exercises": [...], "figures": [...]}
  • Wrapped (new):     {"exams": [{"exam_metadata": {...}, ...}, ...]}

Skips `*.error.json` and any malformed files (with a logged warning) rather
than failing the whole run.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Iterable, Iterator

from .schema import ExerciseRecord, FigureRecord, PartRecord

log = logging.getLogger(__name__)


class Corpus:
    """Indexed collection of exercises with light lookups."""

    def __init__(self, exercises: list[ExerciseRecord]) -> None:
        self._all: list[ExerciseRecord] = list(exercises)
        self._by_id: dict[str, ExerciseRecord] = {e.id: e for e in self._all}

    def __len__(self) -> int:
        return len(self._all)

    def __iter__(self) -> Iterator[ExerciseRecord]:
        return iter(self._all)

    @property
    def all(self) -> list[ExerciseRecord]:
        return list(self._all)

    def get(self, exercise_id: str) -> ExerciseRecord | None:
        return self._by_id.get(exercise_id)

    def by_year_and_number(
        self,
        year: int,
        number: int,
        *,
        sujet: int | None = None,
    ) -> ExerciseRecord | None:
        for e in self._all:
            if e.exam_year != year or e.number != number:
                continue
            if sujet is not None and e.sujet != sujet:
                continue
            return e
        return None

    def exam(self, year: int, *, sujet: int | None = None) -> list[ExerciseRecord]:
        """All exercises from one exam (one PDF / one year + optional sujet)."""
        out = [e for e in self._all if e.exam_year == year]
        if sujet is not None:
            out = [e for e in out if e.sujet == sujet]
        return sorted(out, key=lambda e: (e.sujet or 0, e.number))

    def solved(self) -> list[ExerciseRecord]:
        return [e for e in self._all if e.is_fully_solved]

    def filter(
        self,
        *,
        filiere: str | None = None,
        topic: str | None = None,
        exclude_exam_id: str | None = None,
        solved_only: bool = False,
    ) -> list[ExerciseRecord]:
        out = self._all
        if filiere is not None:
            out = [e for e in out if e.filiere == filiere]
        if topic is not None:
            out = [e for e in out if e.topic == topic]
        if exclude_exam_id is not None:
            out = [e for e in out if e.exam_id != exclude_exam_id]
        if solved_only:
            out = [e for e in out if e.is_fully_solved]
        return out


# ── parsing ────────────────────────────────────────────────────────────────
def _parse_part(raw: dict) -> PartRecord:
    return PartRecord(
        id=raw.get("id", ""),
        label=raw.get("label"),
        sub_label=raw.get("sub_label"),
        statement=raw.get("statement", ""),
        solution=raw.get("solution"),
        depends_on=tuple(raw.get("depends_on") or ()),
        marks=raw.get("marks"),
        has_figure=bool(raw.get("has_figure", False)),
        ordering=int(raw.get("ordering") or 0),
        metadata=dict(raw.get("metadata") or {}),
    )


def _parse_figure(raw: dict) -> FigureRecord:
    bb = raw.get("bounding_box")
    bb_tuple: tuple[float, float, float, float] | None = None
    if isinstance(bb, (list, tuple)) and len(bb) == 4 and all(
        isinstance(v, (int, float)) for v in bb
    ):
        bb_tuple = (float(bb[0]), float(bb[1]), float(bb[2]), float(bb[3]))

    return FigureRecord(
        id=raw.get("id", ""),
        exercise_ref=raw.get("exercise_ref"),
        part_ref=(str(raw["part_ref"]) if raw.get("part_ref") is not None else None),
        figure_type=raw.get("figure_type"),
        description=raw.get("description", ""),
        source_page=raw.get("source_page"),
        bounding_box=bb_tuple,
        context=raw.get("context"),
    )


def _parse_exam_object(exam_obj: dict, source_path: Path) -> list[ExerciseRecord]:
    em = exam_obj.get("exam_metadata") or {}
    figures_by_ex: dict[int, list[FigureRecord]] = {}
    for fig in exam_obj.get("figures") or []:
        fr = _parse_figure(fig)
        if fr.exercise_ref is not None:
            figures_by_ex.setdefault(int(fr.exercise_ref), []).append(fr)

    out: list[ExerciseRecord] = []
    for ex in exam_obj.get("exercises") or []:
        try:
            parts = tuple(
                sorted((_parse_part(p) for p in ex.get("parts") or []), key=lambda p: p.ordering)
            )
        except Exception as e:                # noqa: BLE001
            log.warning("Skipping exercise %s in %s: bad parts (%s)", ex.get("id"), source_path.name, e)
            continue

        record = ExerciseRecord(
            exam_id=em.get("id", ""),
            exam_source_file=em.get("source_file") or source_path.name,
            exam_year=em.get("year"),
            exam_type=em.get("exam_type"),
            session=em.get("session"),
            sujet=em.get("sujet"),
            filiere=em.get("filiere"),
            language=em.get("language"),
            subject=em.get("subject"),
            id=ex.get("id", ""),
            number=int(ex.get("number") or 0),
            title=ex.get("title"),
            statement=ex.get("statement") or "",
            topic=ex.get("topic"),
            concepts=tuple(ex.get("concepts") or ()),
            difficulty=ex.get("difficulty"),
            marks=ex.get("marks"),
            has_figure=bool(ex.get("has_figure", False)),
            source_page=ex.get("source_page"),
            exercise_solution=ex.get("solution"),
            parts=parts,
            figures=tuple(figures_by_ex.get(int(ex.get("number") or 0), ())),
            metadata=dict(ex.get("metadata") or {}),
        )
        out.append(record)
    return out


def _parse_doc(doc: dict, source_path: Path) -> list[ExerciseRecord]:
    """Handle both root layouts: wrapped `{exams: [...]}` and flat."""
    if isinstance(doc.get("exams"), list):
        out: list[ExerciseRecord] = []
        for exam in doc["exams"]:
            out.extend(_parse_exam_object(exam, source_path))
        return out
    return _parse_exam_object(doc, source_path)


def _iter_json_files(roots: Iterable[Path]) -> Iterator[Path]:
    seen: set[Path] = set()
    for root in roots:
        if not root.exists():
            log.warning("Corpus root does not exist: %s", root)
            continue
        for path in sorted(root.glob("**/*.json")):
            if path.name.endswith(".error.json"):
                continue
            if path in seen:
                continue
            seen.add(path)
            yield path


def load_corpus(*roots: Path) -> Corpus:
    """Load every exam JSON under `roots` and return a flat Corpus."""
    exercises: list[ExerciseRecord] = []
    for path in _iter_json_files(roots):
        try:
            with path.open("r", encoding="utf-8") as fh:
                doc = json.load(fh)
            exercises.extend(_parse_doc(doc, path))
        except json.JSONDecodeError as e:
            log.warning("Skipping %s: invalid JSON (%s)", path, e)
        except Exception as e:                # noqa: BLE001
            log.warning("Skipping %s: %s", path, e)
    log.info("Loaded %d exercises from %d roots", len(exercises), len(roots))
    return Corpus(exercises)
