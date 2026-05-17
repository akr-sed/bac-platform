"""Defaults and environment for the AI hinting pipeline."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Final

REPO_ROOT: Final[Path] = Path(__file__).resolve().parents[2]

# Corpus
DEFAULT_DATA_DIR: Final[Path] = REPO_ROOT / "data" / "dzexams" / "maths" / "bac" / "bac-results-new"
LEGACY_DATA_DIR: Final[Path] = REPO_ROOT / "data" / "dzexams" / "maths" / "bac" / "bac-results"
DEFAULT_PDF_ROOTS: Final[tuple[Path, ...]] = (
    REPO_ROOT / "data" / "dzexams" / "maths" / "bac" / "bac-sujets",
    REPO_ROOT / "data" / "dzexams" / "maths" / "bac-blanc" / "bac-blanc-sujets",
)

DEFAULT_OUTPUT_DIR: Final[Path] = REPO_ROOT / "runs" / "ai_hinting"
DEFAULT_FIGURES_DIR: Final[Path] = REPO_ROOT / "data" / "dzexams" / "maths" / "bac" / "bac-figures"
DEFAULT_SUBJECTS_METADATA: Final[Path] = REPO_ROOT / "notebooks" / "config" / "subjects_metadata.json"

# Provider
DEFAULT_PROVIDER: Final[str] = "gemini"
# Free-tier Gemini Flash models — no billing required. Vision capable, ~1M
# context. If you have paid access, `--model gemini-2.5-pro` (or any other)
# overrides this at the CLI.
DEFAULT_MODELS: Final[dict[str, str]] = {
    "gemini": "gemini-2.5-flash",
    "anthropic": "claude-sonnet-4-6",
}
DEFAULT_MAX_TOKENS: Final[int] = 8000
DEFAULT_TEMPERATURE: Final[float] = 0.2
DEFAULT_REQUEST_TIMEOUT_S: Final[float] = 180.0
DEFAULT_MAX_RETRIES: Final[int] = 3

# Retrieval
DEFAULT_K: Final[int] = 3
DEFAULT_CONCEPT_FUZZY_THRESHOLD: Final[int] = 80
DEFAULT_MIN_CONCEPT_SCORE: Final[float] = 0.15


@dataclass
class PipelineConfig:
    """Resolved configuration for one solver run."""

    data_dir: Path = DEFAULT_DATA_DIR
    pdf_roots: tuple[Path, ...] = DEFAULT_PDF_ROOTS
    output_dir: Path = DEFAULT_OUTPUT_DIR
    figures_dir: Path = DEFAULT_FIGURES_DIR

    provider: str = DEFAULT_PROVIDER
    model: str = ""                                 # filled by CLI / factory
    max_tokens: int = DEFAULT_MAX_TOKENS
    temperature: float = DEFAULT_TEMPERATURE
    request_timeout_s: float = DEFAULT_REQUEST_TIMEOUT_S
    max_retries: int = DEFAULT_MAX_RETRIES

    k: int = DEFAULT_K
    concept_fuzzy_threshold: int = DEFAULT_CONCEPT_FUZZY_THRESHOLD
    min_concept_score: float = DEFAULT_MIN_CONCEPT_SCORE

    use_figures: bool = True
    extra_corpus_dirs: tuple[Path, ...] = field(default_factory=tuple)

    def resolved_model(self) -> str:
        return self.model or DEFAULT_MODELS.get(self.provider, "")


def _maybe_load_dotenv() -> None:
    """Best-effort .env.local load so users don't need to `export` keys."""
    try:
        from dotenv import load_dotenv
        load_dotenv(REPO_ROOT / ".env.local", override=False)
    except ImportError:
        pass


def ensure_provider_key(provider: str) -> None:
    """Raise a clear error if the API key for the chosen provider is missing.

    Provider classes do their own check, but this gives a nicer CLI error
    before we start loading the corpus.
    """
    _maybe_load_dotenv()
    if provider == "gemini":
        if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")):
            raise RuntimeError(
                "Missing GOOGLE_API_KEY (or GEMINI_API_KEY). Set it in the "
                "environment or .env.local before running the pipeline."
            )
    elif provider == "anthropic":
        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise RuntimeError(
                "Missing ANTHROPIC_API_KEY. Set it in the environment or "
                ".env.local before running the pipeline."
            )
    else:
        raise ValueError(f"Unknown provider '{provider}'. Available: gemini, anthropic.")
