"""End-to-end pipeline: target → retrieve → crop figures → prompt → solve → persist.

Sequential by design. The "bulk" commands are just iteration helpers — no
threading.
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Sequence

from .config import PipelineConfig
from .corpus import Corpus
from .figures import CroppedFigure, FigureCropper
from .prompts import build_user_prompt, system_prompt_for
from .providers import (
    Attachment,
    LLMProvider,
    LLMResponse,
    ProviderConfig,
    extract_json,
    make_provider,
)
from .retrieval import find_similar
from .schema import ExerciseRecord, SolutionOutput, SolutionStep, SolvedPart

log = logging.getLogger(__name__)


class SolverPipeline:
    """One-shot and convenience-bulk solver."""

    def __init__(
        self,
        corpus: Corpus,
        config: PipelineConfig,
        *,
        provider: LLMProvider | None = None,
        cropper: FigureCropper | None = None,
    ) -> None:
        self.corpus = corpus
        self.config = config
        self.provider = provider or _build_provider(config)
        self.cropper = cropper or FigureCropper(
            pdf_roots=config.pdf_roots,
            figures_dir=config.figures_dir,
        )

    # ── single ───────────────────────────────────────────────────────────
    def solve_exercise(self, target: ExerciseRecord) -> SolutionOutput:
        cfg = self.config

        similar = find_similar(
            target, self.corpus,
            k=cfg.k,
            concept_fuzzy_threshold=cfg.concept_fuzzy_threshold,
            min_concept_score=cfg.min_concept_score,
        )
        cropped: list[CroppedFigure] = []
        if cfg.use_figures and target.has_figure:
            cropped = self.cropper.attachments_for_exercise(target)
        log.info(
            "Target %s | topic=%s | filiere=%s | refs=%d/%d | figures=%d",
            target.key, target.topic, target.filiere,
            len(similar), cfg.k, len(cropped),
        )

        system = system_prompt_for(target.subject or "mathematics")
        user = build_user_prompt(target, similar, cropped_figures=cropped)
        attachments = FigureCropper.to_attachments(cropped)

        out = SolutionOutput(
            exercise_id=target.id,
            exercise_key=target.key,
            language=target.language or "ar",
            provider=self.provider.name,
            model=cfg.resolved_model(),
            retrieval=[h.summary() for h in similar],
            attachments=[{"label": a.label, "path": str(a.path), "mime": a.mime_type} for a in attachments],
        )

        t0 = time.perf_counter()
        try:
            resp: LLMResponse = self.provider.generate(
                system=system, user=user, attachments=attachments,
            )
        except Exception as e:                # noqa: BLE001
            log.exception("LLM call failed for %s", target.key)
            out.parse_error = f"llm_error: {e}"
            out.elapsed_ms = int((time.perf_counter() - t0) * 1000)
            return out

        out.elapsed_ms = int((time.perf_counter() - t0) * 1000)
        out.model = resp.model
        out.usage = resp.usage
        out.raw_response = resp.text

        try:
            parsed = extract_json(resp.text)
        except ValueError as e:
            out.parse_error = str(e)
            return out

        out.exercise_level_solution = parsed.get("exercise_level_solution")
        out.notes = parsed.get("notes")
        out.language = parsed.get("language") or out.language
        out.parts = _materialize_parts(parsed.get("parts") or [])
        out.raw_response = None                 # drop on success
        return out

    # ── convenience bulk ─────────────────────────────────────────────────
    def solve_iter(
        self,
        targets: Iterable[ExerciseRecord],
        *,
        out_dir: Path | None = None,
        rest_seconds: float = 0.0,
    ) -> list[Path]:
        """Iterate targets sequentially and persist results.

        `rest_seconds` is a polite delay between API calls (useful when
        you're brushing up against rate limits).
        """
        out_dir = out_dir or self._timestamped_run_dir()
        out_dir.mkdir(parents=True, exist_ok=True)
        log.info("Run output: %s", out_dir)

        targets_list = list(targets)
        results: list[Path] = []
        for idx, target in enumerate(targets_list, start=1):
            log.info("[%d/%d] solving %s", idx, len(targets_list), target.key)
            try:
                solution = self.solve_exercise(target)
            except Exception as e:            # noqa: BLE001
                log.exception("solve crashed for %s", target.key)
                solution = SolutionOutput(
                    exercise_id=target.id,
                    exercise_key=target.key,
                    language=target.language or "ar",
                    provider=self.provider.name,
                    model=self.config.resolved_model(),
                    parse_error=f"crash: {e}",
                )
            results.append(self._persist(solution, target, out_dir))
            if rest_seconds and idx < len(targets_list):
                time.sleep(rest_seconds)
        return results

    def solve_exam(self, year: int, *, sujet: int | None = None, **kwargs) -> list[Path]:
        targets = self.corpus.exam(year, sujet=sujet)
        if not targets:
            raise ValueError(f"no exercises found for year={year} sujet={sujet}")
        return self.solve_iter(targets, **kwargs)

    def solve_exams(self, years: Sequence[int], **kwargs) -> list[Path]:
        targets: list[ExerciseRecord] = []
        for y in years:
            targets.extend(self.corpus.exam(y))
        if not targets:
            raise ValueError(f"no exercises found for years={list(years)}")
        return self.solve_iter(targets, **kwargs)

    def cleanup(self) -> None:
        self.provider.cleanup()

    # ── helpers ──────────────────────────────────────────────────────────
    def _timestamped_run_dir(self) -> Path:
        ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        return self.config.output_dir / ts

    def _persist(self, solution: SolutionOutput, target: ExerciseRecord, out_dir: Path) -> Path:
        path = out_dir / f"{target.key}.json"
        payload = {
            "target": {
                "exam_id": target.exam_id,
                "exam_source_file": target.exam_source_file,
                "exam_year": target.exam_year,
                "sujet": target.sujet,
                "exercise_id": target.id,
                "exercise_number": target.number,
                "topic": target.topic,
                "concepts": list(target.concepts),
                "filiere": target.filiere,
                "language": target.language,
                "difficulty": target.difficulty,
                "has_figure": target.has_figure,
            },
            "solution": _dump_solution(solution),
            "ground_truth": _ground_truth(target),
        }
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        return path


def _build_provider(cfg: PipelineConfig) -> LLMProvider:
    p_cfg = ProviderConfig(
        model=cfg.resolved_model(),
        max_tokens=cfg.max_tokens,
        temperature=cfg.temperature,
        timeout_s=cfg.request_timeout_s,
        max_retries=cfg.max_retries,
    )
    return make_provider(cfg.provider, p_cfg)


# ── parsing helpers ────────────────────────────────────────────────────────
def _materialize_parts(raw_parts: list[dict]) -> list[SolvedPart]:
    out: list[SolvedPart] = []
    for rp in raw_parts:
        if not isinstance(rp, dict):
            continue
        steps_raw = rp.get("steps") or []
        steps: list[SolutionStep] = []
        for i, s in enumerate(steps_raw, start=1):
            if not isinstance(s, dict):
                continue
            steps.append(
                SolutionStep(
                    index=int(s.get("index") or i),
                    explanation=str(s.get("explanation") or ""),
                    math=s.get("math") or None,
                )
            )
        out.append(
            SolvedPart(
                label=rp.get("label"),
                sub_label=rp.get("sub_label"),
                depends_on=list(rp.get("depends_on") or []),
                steps=steps,
                final_answer=rp.get("final_answer"),
            )
        )
    return out


def _dump_solution(solution: SolutionOutput) -> dict:
    return {
        "exercise_id": solution.exercise_id,
        "exercise_key": solution.exercise_key,
        "language": solution.language,
        "provider": solution.provider,
        "model": solution.model,
        "elapsed_ms": solution.elapsed_ms,
        "usage": solution.usage,
        "retrieval": solution.retrieval,
        "attachments": solution.attachments,
        "exercise_level_solution": solution.exercise_level_solution,
        "notes": solution.notes,
        "parts": [asdict(p) for p in solution.parts],
        "parse_error": solution.parse_error,
        "raw_response": solution.raw_response,
    }


def _ground_truth(target: ExerciseRecord) -> dict:
    return {
        "exercise_level_solution": target.exercise_solution,
        "parts": [
            {
                "label": p.label,
                "sub_label": p.sub_label,
                "statement": p.statement,
                "solution": p.solution,
                "marks": p.marks,
            }
            for p in target.parts
        ],
    }
