"""Command-line entry: `python -m scripts.ai_hinting --help`."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from .config import (
    DEFAULT_CONCEPT_FUZZY_THRESHOLD,
    DEFAULT_DATA_DIR,
    DEFAULT_K,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MIN_CONCEPT_SCORE,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_PDF_ROOTS,
    DEFAULT_PROVIDER,
    DEFAULT_TEMPERATURE,
    PipelineConfig,
    ensure_provider_key,
)
from .corpus import load_corpus
from .figures import FigureCropper
from .pipeline import SolverPipeline
from .retrieval import find_similar


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m scripts.ai_hinting",
        description="AI hinting v1: few-shot LLM solver for BAC exercises.",
    )
    # ── corpus / output
    p.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR,
                   help="Root with exam JSONs. Default: %(default)s")
    p.add_argument("--extra-data-dir", type=Path, action="append", default=[],
                   help="Additional corpus root(s) (repeatable).")
    p.add_argument("--no-legacy", action="store_true",
                   help="Don't auto-include the legacy bac-results dir alongside the default.")
    p.add_argument("--pdf-root", type=Path, action="append", default=[],
                   help="Directories with source PDFs (repeatable). "
                        f"Default: {[str(r) for r in DEFAULT_PDF_ROOTS]}")
    p.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)

    # ── provider
    p.add_argument("--provider", choices=("gemini", "anthropic"),
                   default=DEFAULT_PROVIDER,
                   help="LLM backend strategy (default: %(default)s).")
    p.add_argument("--model", default=None,
                   help="Override provider's default model.")
    p.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS)
    p.add_argument("--temperature", type=float, default=DEFAULT_TEMPERATURE)

    # ── retrieval
    p.add_argument("-k", "--k", type=int, default=DEFAULT_K)
    p.add_argument("--fuzzy-threshold", type=int, default=DEFAULT_CONCEPT_FUZZY_THRESHOLD)
    p.add_argument("--min-concept-score", type=float, default=DEFAULT_MIN_CONCEPT_SCORE)

    # ── figures
    p.add_argument("--no-figures", action="store_true",
                   help="Skip figure cropping; use text descriptions only.")

    # ── flow
    p.add_argument("--rest", type=float, default=0.0,
                   help="Seconds to sleep between API calls in bulk modes.")
    p.add_argument("--dry-run", action="store_true",
                   help="Run retrieval + figure cropping but skip the LLM call.")
    p.add_argument("-v", "--verbose", action="count", default=0)

    sub = p.add_subparsers(dest="cmd", required=True)

    one = sub.add_parser("solve", help="Solve a single exercise.")
    one.add_argument("--year", type=int, required=True)
    one.add_argument("--number", type=int, required=True)
    one.add_argument("--sujet", type=int, default=None)

    exam_cmd = sub.add_parser("exam", help="Solve every exercise of one exam.")
    exam_cmd.add_argument("--year", type=int, required=True)
    exam_cmd.add_argument("--sujet", type=int, default=None)

    exams_cmd = sub.add_parser("exams", help="Solve every exercise of a list of exams.")
    exams_cmd.add_argument("--years", required=True,
                           help="Comma-separated list, e.g. 2018,2019,2020.")

    bulk_cmd = sub.add_parser("bulk", help="Solve every exercise in the corpus (or a sample).")
    bulk_cmd.add_argument("--sample", type=int, default=None)
    bulk_cmd.add_argument("--seed", type=int, default=42)
    bulk_cmd.add_argument("--topic", default=None)
    bulk_cmd.add_argument("--filiere", default=None)

    crop_cmd = sub.add_parser("crop-all",
                              help="Pre-crop every figure in the corpus to bac-figures/.")
    crop_cmd.add_argument("--year", type=int, default=None,
                          help="Restrict to one exam year (all sujets).")
    crop_cmd.add_argument("--force", action="store_true",
                          help="Re-render even when the PNG already exists.")
    crop_cmd.add_argument("--no-solutions", action="store_true",
                          help="Skip solution-context figures (default is to crop both).")

    inspect = sub.add_parser("inspect",
                             help="Print retrieval results + figure crops without solving.")
    inspect.add_argument("--year", type=int, required=True)
    inspect.add_argument("--number", type=int, required=True)
    inspect.add_argument("--sujet", type=int, default=None)
    return p


def _setup_logging(verbosity: int) -> None:
    level = logging.WARNING
    if verbosity == 1:
        level = logging.INFO
    elif verbosity >= 2:
        level = logging.DEBUG
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)-7s %(name)s | %(message)s",
        datefmt="%H:%M:%S",
    )


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    _setup_logging(args.verbose)

    # Include the legacy data dir automatically so retrieval has a real pool
    # while bac-results-new is being filled in. Pass --no-legacy to skip.
    from .config import LEGACY_DATA_DIR
    extras = list(args.extra_data_dir)
    if not args.no_legacy and args.data_dir == DEFAULT_DATA_DIR:
        extras.append(LEGACY_DATA_DIR)
    corpus = load_corpus(args.data_dir, *extras)
    if len(corpus) == 0:
        print(f"error: no exercises loaded from {args.data_dir}", file=sys.stderr)
        return 2

    pdf_roots = tuple(args.pdf_root) if args.pdf_root else DEFAULT_PDF_ROOTS
    cfg = PipelineConfig(
        data_dir=args.data_dir,
        pdf_roots=pdf_roots,
        output_dir=args.output_dir,
        provider=args.provider,
        model=args.model or "",
        max_tokens=args.max_tokens,
        temperature=args.temperature,
        k=args.k,
        concept_fuzzy_threshold=args.fuzzy_threshold,
        min_concept_score=args.min_concept_score,
        use_figures=not args.no_figures,
        extra_corpus_dirs=tuple(args.extra_data_dir),
    )

    # ── read-only paths ──────────────────────────────────────────────────
    if args.cmd == "inspect" or args.dry_run:
        return _read_only(args, corpus, cfg)

    # crop-all needs no API key
    if args.cmd == "crop-all":
        exercises = corpus.all
        if args.year is not None:
            exercises = [e for e in exercises if e.exam_year == args.year]
        if not exercises:
            print(f"error: no exercises selected (year={args.year})", file=sys.stderr)
            return 2
        cropper = FigureCropper(pdf_roots=cfg.pdf_roots, figures_dir=cfg.figures_dir)
        report = cropper.crop_all(
            exercises,
            include_solutions=not args.no_solutions,
            force=args.force,
        )
        print(report.summary())
        for exam_key, buckets in sorted(report.by_exam.items()):
            print(f"  {exam_key}: {buckets}")
        return 0 if report.failed == 0 else 1

    # ── pipelines that hit the API ───────────────────────────────────────
    try:
        ensure_provider_key(cfg.provider)
    except RuntimeError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    pipeline = SolverPipeline(corpus, cfg)
    try:
        if args.cmd == "solve":
            target = corpus.by_year_and_number(args.year, args.number, sujet=args.sujet)
            if target is None:
                print(f"error: no exercise found year={args.year} number={args.number} "
                      f"sujet={args.sujet}", file=sys.stderr)
                return 2
            out_paths = pipeline.solve_iter([target], rest_seconds=args.rest)
            print("\n".join(str(p) for p in out_paths))
            return 0

        if args.cmd == "exam":
            out_paths = pipeline.solve_exam(args.year, sujet=args.sujet, rest_seconds=args.rest)
            print(f"wrote {len(out_paths)} files to {out_paths[0].parent}")
            return 0

        if args.cmd == "exams":
            years = [int(y) for y in args.years.split(",") if y.strip()]
            out_paths = pipeline.solve_exams(years, rest_seconds=args.rest)
            print(f"wrote {len(out_paths)} files to {out_paths[0].parent}")
            return 0

        if args.cmd == "bulk":
            return _bulk(args, corpus, pipeline)
    finally:
        pipeline.cleanup()

    return 1


# ── subcommands ─────────────────────────────────────────────────────────────
def _read_only(args, corpus, cfg) -> int:
    target = corpus.by_year_and_number(args.year, args.number,
                                       sujet=getattr(args, "sujet", None))
    if target is None:
        print(f"error: no exercise found year={args.year} number={args.number}",
              file=sys.stderr)
        return 2

    hits = find_similar(
        target, corpus,
        k=cfg.k,
        concept_fuzzy_threshold=cfg.concept_fuzzy_threshold,
        min_concept_score=cfg.min_concept_score,
    )
    print(f"target: year={target.exam_year} ex{target.number}  topic={target.topic}  "
          f"sujet={target.sujet}  concepts={list(target.concepts)}")

    if cfg.use_figures and target.has_figure:
        cropper = FigureCropper(pdf_roots=cfg.pdf_roots, figures_dir=cfg.figures_dir)
        cropped = cropper.attachments_for_exercise(target)
        print(f"figures: {len(cropped)} crop(s) (from {len(target.figures)} entries)")
        for cf in cropped:
            print(f"  • {cf.label}  ->  {cf.image_path}")

    print(f"retrieved {len(hits)} hits:")
    for h in hits:
        ex = h.exercise
        matched = [f"{a}~{b}({s})" for a, b, s in h.matched_concepts]
        print(f"  score={h.score:.3f}  year={ex.exam_year}  ex{ex.number}  "
              f"diff={ex.difficulty}  matched={matched}")
    return 0


def _bulk(args, corpus, pipeline) -> int:
    import random
    targets = corpus.all
    if args.topic is not None:
        targets = [t for t in targets if t.topic == args.topic]
    if args.filiere is not None:
        targets = [t for t in targets if t.filiere == args.filiere]
    if args.sample is not None:
        random.Random(args.seed).shuffle(targets)
        targets = targets[: args.sample]
    if not targets:
        print("error: filter produced empty target set", file=sys.stderr)
        return 2
    out_paths = pipeline.solve_iter(targets, rest_seconds=args.rest)
    print(f"wrote {len(out_paths)} files to {out_paths[0].parent}")
    return 0


if __name__ == "__main__":   # pragma: no cover
    sys.exit(main())
