"""Strategy interface for LLM providers.

A provider is an opaque backend that knows how to:
  • upload a file (image/PDF) and produce a handle the model can read
  • set runtime config (model, temperature, max tokens)
  • generate a completion from system + user + zero-or-more attachments

The pipeline never touches a vendor SDK directly — it only talks to
LLMProvider. Adding a new vendor = one new file in this package.
"""

from __future__ import annotations

import json
import logging
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any, ClassVar, Sequence

log = logging.getLogger(__name__)


# ── Shared value types ─────────────────────────────────────────────────────
@dataclass(frozen=True)
class Attachment:
    """A file the model should see alongside the prompt.

    `handle` is set by `LLMProvider.upload()` and is opaque — providers stuff
    whatever they need there (Gemini File object, base64 bytes, etc.).
    """

    path: Path
    mime_type: str
    label: str = "attachment"
    handle: Any = None

    def with_handle(self, handle: Any) -> "Attachment":
        return replace(self, handle=handle)


@dataclass(frozen=True)
class LLMResponse:
    text: str
    model: str
    usage: dict[str, Any] = field(default_factory=dict)
    raw: Any = None


@dataclass
class ProviderConfig:
    """Per-call config. Providers translate these into vendor-specific kwargs."""

    model: str
    max_tokens: int = 8000
    temperature: float = 0.2
    timeout_s: float = 120.0
    max_retries: int = 3


# ── Strategy interface ────────────────────────────────────────────────────
class LLMProvider(ABC):
    name: ClassVar[str]

    def __init__(self, config: ProviderConfig) -> None:
        self.config = config

    def configure(self, **overrides: Any) -> None:
        """Override config fields in place. Unknown keys raise."""
        for k, v in overrides.items():
            if not hasattr(self.config, k):
                raise ValueError(f"Unknown config key '{k}' for provider {self.name}")
            setattr(self.config, k, v)

    @abstractmethod
    def upload(self, attachment: Attachment) -> Attachment:
        """Upload (or load) a file. Returns a new Attachment with `handle` set.

        Idempotent: if `attachment.handle` is already populated, return as-is.
        """

    @abstractmethod
    def generate(
        self,
        *,
        system: str,
        user: str,
        attachments: Sequence[Attachment] = (),
    ) -> LLMResponse:
        """Send one round-trip. Implementations should retry on transient errors."""

    def cleanup(self) -> None:
        """Optional: release uploaded handles. Default = no-op."""
        return None


# ── JSON extraction (shared) ───────────────────────────────────────────────
_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)\s*```", re.DOTALL)


def extract_json(text: str) -> dict[str, Any]:
    """Parse JSON from a model response. Tolerant of fences and prefixes."""
    candidate = text.strip()
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        pass
    m = _FENCE_RE.search(candidate)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(candidate[start : end + 1])
        except json.JSONDecodeError as e:
            raise ValueError(f"json parse failed after fallback: {e}") from e
    raise ValueError("no JSON object found in model response")
