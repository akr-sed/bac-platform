"""Gemini strategy via `google-genai`.

Gemini's File API gives us a real uploaded resource (valid ~48h) which is
worth using for PDFs and any image > a few hundred KB. Small images are
also fine inlined, but uploading them is uniform and lets us reuse the
handle across retries.
"""

from __future__ import annotations

import logging
import os
import time
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


_API_KEY_ENVS = ("GOOGLE_API_KEY", "GEMINI_API_KEY")


def _resolve_key() -> str:
    for env in _API_KEY_ENVS:
        v = os.environ.get(env)
        if v:
            return v
    raise RuntimeError(
        f"Missing Gemini API key. Set one of {' or '.join(_API_KEY_ENVS)} "
        "in the environment or .env.local."
    )


class GeminiProvider(LLMProvider):
    name: ClassVar[str] = "gemini"

    def __init__(self, config: ProviderConfig) -> None:
        super().__init__(config)
        try:
            from google import genai
            from google.genai import types as genai_types
        except ImportError as e:
            raise RuntimeError(
                "google-genai not installed. Run `pip install -r requirements.txt`."
            ) from e

        self._genai = genai
        self._types = genai_types
        self._client = genai.Client(api_key=_resolve_key())
        self._uploaded: list[Any] = []          # for cleanup()

    # ── upload ───────────────────────────────────────────────────────────
    def upload(self, attachment: Attachment) -> Attachment:
        if attachment.handle is not None:
            return attachment
        path = Path(attachment.path)
        if not path.exists():
            raise FileNotFoundError(f"attachment not found: {path}")

        cfg = self._types.UploadFileConfig(
            mime_type=attachment.mime_type,
            display_name=attachment.label,
        )
        with path.open("rb") as fh:
            uploaded = self._client.files.upload(file=fh, config=cfg)

        # Wait until the file is ACTIVE — PDFs can take a second or two.
        deadline = time.time() + 30
        while getattr(uploaded.state, "name", "ACTIVE") != "ACTIVE":
            if time.time() > deadline:
                raise TimeoutError(f"Gemini file not ACTIVE within 30s: {uploaded.name}")
            time.sleep(0.5)
            uploaded = self._client.files.get(name=uploaded.name)

        self._uploaded.append(uploaded)
        return attachment.with_handle(uploaded)

    # ── generate ─────────────────────────────────────────────────────────
    def generate(
        self,
        *,
        system: str,
        user: str,
        attachments: Sequence[Attachment] = (),
    ) -> LLMResponse:
        parts: list[Any] = []
        for att in attachments:
            handle = att.handle
            if handle is None:
                handle = self.upload(att).handle
            parts.append(
                self._types.Part.from_uri(
                    file_uri=handle.uri,
                    mime_type=att.mime_type,
                )
            )
        parts.append(self._types.Part.from_text(text=user))

        cfg = self.config
        genai = self._genai

        @retry(
            reraise=True,
            stop=stop_after_attempt(cfg.max_retries),
            wait=wait_exponential(multiplier=1, min=2, max=20),
            retry=retry_if_exception_type(genai.errors.APIError),
            before_sleep=lambda rs: log.warning(
                "Gemini retry %d/%d: %s",
                rs.attempt_number, cfg.max_retries,
                rs.outcome.exception() if rs.outcome else "?",
            ),
        )
        def _call() -> LLMResponse:
            resp = self._client.models.generate_content(
                model=cfg.model,
                contents=parts,
                config=self._types.GenerateContentConfig(
                    system_instruction=system,
                    temperature=cfg.temperature,
                    max_output_tokens=cfg.max_tokens,
                ),
            )
            usage_meta = getattr(resp, "usage_metadata", None)
            return LLMResponse(
                text=resp.text or "",
                model=cfg.model,
                usage={
                    "prompt_tokens": getattr(usage_meta, "prompt_token_count", None),
                    "output_tokens": getattr(usage_meta, "candidates_token_count", None),
                    "total_tokens": getattr(usage_meta, "total_token_count", None),
                } if usage_meta else {},
                raw=resp,
            )

        return _call()

    # ── cleanup ──────────────────────────────────────────────────────────
    def cleanup(self) -> None:
        for f in self._uploaded:
            try:
                self._client.files.delete(name=f.name)
            except Exception as e:                  # noqa: BLE001
                log.debug("cleanup failed for %s: %s", f.name, e)
        self._uploaded.clear()
