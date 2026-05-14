"""LLM provider strategies.

Default = Gemini (the user's preferred backend); Anthropic available too.
"""

from __future__ import annotations

from typing import Any

from .base import Attachment, LLMProvider, LLMResponse, ProviderConfig, extract_json


DEFAULT_PROVIDER = "gemini"

# Free-tier defaults. Override per-call via make_provider(name, model=...).
DEFAULT_MODELS: dict[str, str] = {
    "gemini": "gemini-2.5-flash",
    "anthropic": "claude-sonnet-4-6",
}


def make_provider(name: str, config: ProviderConfig | None = None, **overrides: Any) -> LLMProvider:
    """Instantiate a provider by name. Lazy imports keep optional SDKs optional."""
    name = (name or DEFAULT_PROVIDER).lower()
    if config is None:
        config = ProviderConfig(model=DEFAULT_MODELS.get(name, ""))
    if overrides:
        for k, v in overrides.items():
            if hasattr(config, k):
                setattr(config, k, v)

    if name == "gemini":
        from .gemini_provider import GeminiProvider
        return GeminiProvider(config)
    if name == "anthropic":
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider(config)
    raise ValueError(f"Unknown provider '{name}'. Available: gemini, anthropic.")


__all__ = [
    "Attachment",
    "LLMProvider",
    "LLMResponse",
    "ProviderConfig",
    "extract_json",
    "make_provider",
    "DEFAULT_PROVIDER",
    "DEFAULT_MODELS",
]
