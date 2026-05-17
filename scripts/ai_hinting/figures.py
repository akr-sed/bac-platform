"""Crop figure regions out of source PDFs and persist them as PNGs.

Each crop lands at a deterministic, browsable path under `bac-figures/`
so both this pipeline and the future website can fetch crops without
re-rendering. The PNG file itself is the cache — there is no manifest.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence

from .providers import Attachment
from .schema import ExerciseRecord, FigureRecord

log = logging.getLogger(__name__)


# 150 DPI is a sweet spot: a typical BAC PDF renders to ~1240px wide at
# 150dpi, so a figure covering 30% of the page is still ~370px wide.
DEFAULT_DPI = 150
DEFAULT_PADDING_PCT = 1.0          # % of page width/height added on each side


@dataclass(frozen=True)
class CroppedFigure:
    figure: FigureRecord
    image_path: Path
    label: str                     # human-readable, used in prompt + attachment


@dataclass
class CropReport:
    cropped: int = 0               # newly rendered
    cached: int = 0                # already existed on disk
    skipped: int = 0               # missing bbox or page
    failed: int = 0                # PDF not found, degenerate bbox, render error
    by_exam: dict[str, dict[str, int]] = field(default_factory=dict)

    def bump(self, exam_key: str, bucket: str) -> None:
        setattr(self, bucket, getattr(self, bucket) + 1)
        self.by_exam.setdefault(exam_key, {"cropped": 0, "cached": 0, "skipped": 0, "failed": 0})
        self.by_exam[exam_key][bucket] += 1

    def summary(self) -> str:
        return (
            f"cropped={self.cropped} cached={self.cached} "
            f"skipped={self.skipped} failed={self.failed}"
        )


class FigureCropper:
    """Crops figures to disk at deterministic paths.

    The path produced by `path_for(exercise, figure)` is the cache key:
    existence at that path means the crop is up to date.
    """

    def __init__(
        self,
        pdf_roots: Sequence[Path],
        figures_dir: Path,
        *,
        dpi: int = DEFAULT_DPI,
        padding_pct: float = DEFAULT_PADDING_PCT,
    ) -> None:
        self.pdf_roots = [Path(r) for r in pdf_roots]
        self.figures_dir = Path(figures_dir)
        self.dpi = dpi
        self.padding_pct = padding_pct
        self._fitz = None                       # lazy import

    # ── PDF lookup ───────────────────────────────────────────────────────
    def find_pdf(self, source_file: str) -> Path | None:
        if not source_file:
            return None
        for root in self.pdf_roots:
            candidate = root / source_file
            if candidate.exists():
                return candidate
        for root in self.pdf_roots:
            if not root.exists():
                continue
            matches = list(root.rglob(source_file))
            if matches:
                return matches[0]
        return None

    # ── path scheme (pure) ────────────────────────────────────────────────
    def path_for(self, exercise: ExerciseRecord, figure: FigureRecord) -> Path:
        """Build the deterministic on-disk path for one figure crop.

        Pure function — no I/O. External callers (e.g. website backfill)
        can use it to derive expected paths without instantiating a real
        cropper.
        """
        stem = Path(exercise.exam_source_file or "unknown").stem or "unknown"
        if exercise.sujet:
            stem = f"{stem}__s{exercise.sujet}"
        context = (figure.context or "question").lower()
        fid = (figure.id or "noid")[:8] or "noid"
        return self.figures_dir / stem / f"ex{exercise.number}" / f"{context}__{fid}.png"

    # ── single-figure crop ───────────────────────────────────────────────
    def crop_figure(
        self,
        figure: FigureRecord,
        exercise: ExerciseRecord,
        *,
        force: bool = False,
    ) -> tuple[Path | None, str]:
        """Render one figure. Returns (path, bucket) where bucket is one of
        'cropped' | 'cached' | 'skipped' | 'failed'.
        """
        if figure.bounding_box is None or figure.source_page is None:
            log.debug("figure %s: missing bbox or page, skipping", figure.id)
            return None, "skipped"

        pdf_path = self.find_pdf(exercise.exam_source_file)
        if pdf_path is None:
            log.warning("figure %s: source PDF not found for %s",
                        figure.id, exercise.exam_source_file)
            return None, "failed"

        out_path = self.path_for(exercise, figure)
        if out_path.exists() and not force:
            return out_path, "cached"

        try:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            self._render(pdf_path, figure, out_path)
        except Exception as e:                  # noqa: BLE001
            log.warning("figure %s: render failed (%s)", figure.id, e)
            return None, "failed"
        return out_path, "cropped"

    # ── per-exercise (for AI hinting) ────────────────────────────────────
    def attachments_for_exercise(
        self,
        exercise: ExerciseRecord,
        *,
        include_solution_figures: bool = False,
    ) -> list[CroppedFigure]:
        """Crop figures attached to the exercise.

        AI-hinting policy: only question-context figures by default,
        because solution figures would leak the answer for the target.
        """
        figs: Iterable[FigureRecord] = exercise.figures
        if not include_solution_figures:
            figs = [f for f in figs if f.is_question]

        out: list[CroppedFigure] = []
        for i, fig in enumerate(figs, start=1):
            path, bucket = self.crop_figure(fig, exercise)
            if path is None:
                continue
            label = self._label_for(exercise, fig, i)
            out.append(CroppedFigure(figure=fig, image_path=path, label=label))
        return out

    # ── corpus-wide pre-crop (for website backfill) ──────────────────────
    def crop_all(
        self,
        exercises: Iterable[ExerciseRecord],
        *,
        include_solutions: bool = True,
        force: bool = False,
    ) -> CropReport:
        """Iterate every figure of every exercise and persist a PNG.

        Defaults to crop EVERYTHING (question + solution) so the website
        has solution figures available too.
        """
        report = CropReport()
        for exercise in exercises:
            exam_key = self._exam_key(exercise)
            for figure in exercise.figures:
                if not include_solutions and not figure.is_question:
                    continue
                _, bucket = self.crop_figure(figure, exercise, force=force)
                report.bump(exam_key, bucket)
        return report

    @staticmethod
    def to_attachments(cropped: Sequence[CroppedFigure]) -> list[Attachment]:
        return [
            Attachment(path=cf.image_path, mime_type="image/png", label=cf.label)
            for cf in cropped
        ]

    # ── internals ────────────────────────────────────────────────────────
    @staticmethod
    def _exam_key(exercise: ExerciseRecord) -> str:
        stem = Path(exercise.exam_source_file or "unknown").stem or "unknown"
        if exercise.sujet:
            return f"{stem}__s{exercise.sujet}"
        return stem

    def _render(self, pdf_path: Path, fig: FigureRecord, out_path: Path) -> None:
        if self._fitz is None:
            import fitz                       # noqa: WPS433
            self._fitz = fitz
        fitz = self._fitz

        with fitz.open(pdf_path) as doc:
            page_idx = max(0, int(fig.source_page) - 1)
            if page_idx >= doc.page_count:
                raise ValueError(f"page {fig.source_page} out of range ({doc.page_count} pages)")
            page = doc[page_idx]

            ymin, xmin, ymax, xmax = fig.bounding_box      # type: ignore[misc]
            pw, ph = page.rect.width, page.rect.height

            # normalized [0..1000] → page points
            x0 = (xmin / 1000.0) * pw
            x1 = (xmax / 1000.0) * pw
            y0 = (ymin / 1000.0) * ph
            y1 = (ymax / 1000.0) * ph

            pad_x = (self.padding_pct / 100.0) * pw
            pad_y = (self.padding_pct / 100.0) * ph
            x0 = max(0.0, x0 - pad_x)
            y0 = max(0.0, y0 - pad_y)
            x1 = min(pw, x1 + pad_x)
            y1 = min(ph, y1 + pad_y)

            if x1 <= x0 or y1 <= y0:
                raise ValueError(f"degenerate bbox after clamping: {(x0, y0, x1, y1)}")

            clip = fitz.Rect(x0, y0, x1, y1)
            zoom = self.dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, clip=clip, alpha=False)
            pix.save(str(out_path))

    @staticmethod
    def _label_for(exercise: ExerciseRecord, fig: FigureRecord, idx: int) -> str:
        bits = [f"figure_{idx}"]
        if fig.figure_type:
            bits.append(fig.figure_type)
        bits.append(f"ex{exercise.number}")
        if fig.part_ref:
            bits.append(f"part {fig.part_ref}")
        return " · ".join(bits)
