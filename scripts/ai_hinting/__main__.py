"""Allow `python -m scripts.ai_hinting ...`."""

from .cli import main

if __name__ == "__main__":
    raise SystemExit(main())
