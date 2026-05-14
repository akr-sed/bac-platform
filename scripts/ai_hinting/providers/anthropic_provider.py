"""Anthropic Claude strategy.

Claude has no separate file upload step for images — they are inlined as
base64 in the user message. PDFs use the `document` content block, also
base64. `upload()` just reads bytes into the handle so we don't re-read
the file on every retry.
"""

from __future__ import annotations

import base64
import logging
import os
from pathlib import Path
from typing import Any, ClassVar, Sequence

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from .base import Attachment, LLMProvider, LLMResponse, ProviderConfig

log = logging.getLogger(__name__)


_API_KEY_ENV = "ANTHROPIC_API_KEY"


class AnthropicProvider(LLMProvider):
    name: ClassVar[str] = "anthropic"

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        try:
            import anthropic
        except ImportError as e:
            raise RuntimeError(
                "anthropic SDK not installed. Run `pip install -r requirements.txt`."
            ) from e

        key = os.environ.get(_API_KEY_ENV)
        if not key:
            raise RuntimeError(
                f"Missing {_API_KEY_ENV}. Set it in the environment or .env.local."
            )

        self._sdk = anthropic
        self._client = anthropic.Anthropic(api_key=key, timeout=config.timeout_s)

    # ── upload ───────────────────────────────────────────────────────────
    def upload(self, attachment: Attachment) -> Attachment:
        if attachment.handle is not None:
            return attachment
        path = Path(attachment.path)
        if not path.exists():
            raise FileNotFoundError(f"attachment not found: {path}")
        data = base64.standard_b64encode(path.read_bytes()).decode("ascii")
        return attachment.with_handle({"b64": data, "mime": attachment.mime_type})

    # ── generate ─────────────────────────────────────────────────────────
    def generate(
        self,
        *,
        system: str,
        user: str,
        attachments: Sequence[Attachment] = (),
    ) -> LLMResponse:
        content_blocks: list[dict[str, Any]] = []
        for att in attachments:
            handle = att.handle
            if handle is None:
                handle = self.upload(att).handle
            mime = handle["mime"]
            if mime.startswith("image/"):
                content_blocks.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime,
                            "data": handle["b64"],
                        },
                    }
                )
            elif mime == "application/pdf":
                content_blocks.append(
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": mime,
                            "data": handle["b64"],
                        },
                        "title": att.label,
                    }
                )
            else:
                log.warning(
                    "Anthropic: unsupported mime %s for %s, skipping",
                    mime, att.label,
                )

        content_blocks.append({"type": "text", "text": user})

        sdk = self._sdk
        cfg = self.config

        @retry(
            reraise=True,
            stop=stop_after_attempt(cfg.max_retries),
            wait=wait_exponential(multiplier=1, min=2, max=20),
            retry=retry_if_exception_type(
                (
                    sdk.APIConnectionError,
                    sdk.RateLimitError,
                    sdk.InternalServerError,
                )
            ),
            before_sleep=lambda rs: log.warning(
                "Anthropic retry %d/%d: %s",
                rs.attempt_number, cfg.max_retries,
                rs.outcome.exception() if rs.outcome else "?",
            ),
        )
        def _call() -> LLMResponse:
            msg = self._client.messages.create(
                model=cfg.model,
                max_tokens=cfg.max_tokens,
                temperature=cfg.temperature,
                system=system,
                messages=[{"role": "user", "content": content_blocks}],
            )
            text = "".join(
                blk.text for blk in msg.content if getattr(blk, "type", None) == "text"
            )
            return LLMResponse(
                text=text,
                model=msg.model,
                usage={
                    "input_tokens": getattr(msg.usage, "input_tokens", None),
                    "output_tokens": getattr(msg.usage, "output_tokens", None),
                },
                raw=msg,
            )

        return _call()
