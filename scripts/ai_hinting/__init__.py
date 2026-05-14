"""AI hinting pipeline (v1): few-shot LLM solver for BAC exercises.

Public entry points:
    from scripts.ai_hinting.pipeline import SolverPipeline
    from scripts.ai_hinting.corpus import load_corpus
    from scripts.ai_hinting.providers import make_provider
"""

from .corpus import Corpus, load_corpus
from .figures import CroppedFigure, FigureCropper
from .pipeline import SolverPipeline
from .providers import (
    Attachment,
    LLMProvider,
    LLMResponse,
    ProviderConfig,
    make_provider,
)
from .retrieval import find_similar
from .schema import (
    ExerciseRecord,
    FigureRecord,
    PartRecord,
    RetrievalHit,
    SolutionOutput,
)

__all__ = [
    "Attachment",
    "Corpus",
    "CroppedFigure",
    "ExerciseRecord",
    "FigureCropper",
    "FigureRecord",
    "LLMProvider",
    "LLMResponse",
    "PartRecord",
    "ProviderConfig",
    "RetrievalHit",
    "SolutionOutput",
    "SolverPipeline",
    "find_similar",
    "load_corpus",
    "make_provider",
]
