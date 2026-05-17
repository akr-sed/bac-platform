"""Retrieve k similar solved exercises by topic + filière + fuzzy concepts.

Concept tags are short snake_case strings ("etude_de_fonction",
"raisonnement_par_recurrence"). We compute fuzzy-Jaccard similarity to
tolerate slight tag drift across years (e.g. "suites_geometriques" vs
"suite_geometrique").
"""

from __future__ import annotations

from typing import Iterable

from rapidfuzz import fuzz

from .schema import ExerciseRecord, RetrievalHit


_DIFFICULTY_RANK = {"easy": 0, "medium": 1, "hard": 2}


def _normalise_concept(c: str) -> str:
    return c.replace("-", "_").strip().lower()


def _best_fuzzy_match(
    needle: str, haystack: Iterable[str], threshold: int
) -> tuple[str, int] | None:
    """Find the highest-scoring fuzzy match for `needle` in `haystack`.

    Returns (matched_string, score 0..100) or None if no candidate clears
    the threshold.
    """
    needle_n = _normalise_concept(needle)
    best: tuple[str, int] | None = None
    for h in haystack:
        score = int(fuzz.token_set_ratio(needle_n, _normalise_concept(h)))
        if score >= threshold and (best is None or score > best[1]):
            best = (h, score)
    return best


def fuzzy_jaccard(
    target_concepts: Iterable[str],
    hit_concepts: Iterable[str],
    *,
    threshold: int,
) -> tuple[float, list[tuple[str, str, int]]]:
    """Fuzzy-Jaccard over concept tag sets.

    A target tag matches a hit tag if their token-set ratio ≥ threshold.
    Each hit tag can match at most once (greedy by score).
    """
    target = list({_normalise_concept(c) for c in target_concepts if c})
    hits = list({_normalise_concept(c) for c in hit_concepts if c})

    if not target or not hits:
        return 0.0, []

    matched: list[tuple[str, str, int]] = []
    remaining_hits = list(hits)

    # Greedy: each target tag claims its best fuzzy match from remaining hits.
    for t in target:
        m = _best_fuzzy_match(t, remaining_hits, threshold)
        if m is None:
            continue
        matched.append((t, m[0], m[1]))
        remaining_hits.remove(m[0])

    union_size = len(target) + len(hits) - len(matched)
    if union_size == 0:
        return 0.0, []
    return len(matched) / union_size, matched


def find_similar(
    target: ExerciseRecord,
    pool: Iterable[ExerciseRecord],
    *,
    k: int = 3,
    concept_fuzzy_threshold: int = 80,
    min_concept_score: float = 0.15,
    require_solved: bool = True,
    exclude_same_exam: bool = True,
) -> list[RetrievalHit]:
    """Return up to `k` few-shot examples ranked by similarity to `target`.

    Filters (in order):
      1. Same filière as target (if target.filiere set).
      2. Same topic as target (if target.topic set).
      3. Different exam (so we never leak the target's own exam back in).
      4. Fully solved (so the few-shot is useful).

    Ranking:
      • Primary: fuzzy-Jaccard concept score, descending.
      • Tie-break: closer difficulty, then earlier year (older exercises
        tend to come from a more stable curriculum baseline).
    """
    candidates: list[ExerciseRecord] = []
    for ex in pool:
        if ex.id == target.id:
            continue
        if exclude_same_exam and ex.exam_id == target.exam_id:
            continue
        if target.filiere and ex.filiere != target.filiere:
            continue
        if target.topic and ex.topic != target.topic:
            continue
        if require_solved and not ex.is_fully_solved:
            continue
        candidates.append(ex)

    scored: list[RetrievalHit] = []
    for c in candidates:
        score, matched = fuzzy_jaccard(
            target.concepts, c.concepts, threshold=concept_fuzzy_threshold
        )
        if score < min_concept_score:
            continue
        scored.append(
            RetrievalHit(exercise=c, score=score, matched_concepts=tuple(matched))
        )

    t_diff = _DIFFICULTY_RANK.get((target.difficulty or "").lower(), 1)

    def _sort_key(h: RetrievalHit) -> tuple:
        c_diff = _DIFFICULTY_RANK.get((h.exercise.difficulty or "").lower(), 1)
        return (
            -h.score,
            abs(c_diff - t_diff),
            -(h.exercise.exam_year or 0),
        )

    scored.sort(key=_sort_key)
    return scored[:k]
