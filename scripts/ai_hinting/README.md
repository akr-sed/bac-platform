# AI Hinting — v1 (few-shot solver, math)

A small Python module that asks an LLM to solve a BAC math exercise after
showing it a few **similar solved** exercises retrieved from the corpus,
plus image crops of any attached figures. v1 answers: *how good is the
LLM on its own, no curriculum, no hint scaffolding?*

## Pipeline

```
target exercise
   │
   ├──► [ retrieval ]   topic + filière exact, fuzzy-Jaccard over concept tags
   │                    (rapidfuzz token_set_ratio ≥ threshold, dedup, rank)
   │
   ├──► [ figures   ]   PyMuPDF crops question-context figures from the source PDF
   │                    using bounding_box ∈ [0..1000]²; cached on disk
   │
   ├──► [ prompts   ]   math-specialised system prompt
   │                    + few-shot block (references WITH solutions)
   │                    + target block (statement + parts + figure refs, NO solution)
   │
   ├──► [ provider  ]   strategy pattern — Gemini (default) or Anthropic
   │                    uploads images/PDFs, generates content, retries on errors
   │
   ├──► [ parse     ]   strict JSON → parts → steps → final_answer
   │
   └──► [ persist   ]   one JSON per exercise; bundles ground-truth for diffing
```

Bulk modes (`exam`, `exams`, `bulk`) are **convenience iteration** —
sequential, no threads — with an optional `--rest` polite delay.

## Install

```bash
cd ~/Desktop/Projects/bac-platform
pip install -r requirements.txt
```

Set **one** API key, depending on provider:

```bash
# Default: Gemini, free-tier model (gemini-2.5-flash)
export GOOGLE_API_KEY=...           # or GEMINI_API_KEY

# Optional: Anthropic (paid)
export ANTHROPIC_API_KEY=sk-ant-...
```

The pipeline also reads `~/Desktop/Projects/bac-platform/.env.local`
automatically (via python-dotenv), so you can put the key there instead.

### Free-tier Gemini

The default model is **`gemini-2.5-flash`**, which is on Google's free
tier. Vision capable, ~1M token context — enough for the few-shot
references plus figure attachments.

Free-tier rate limits are stricter than paid: roughly **10 requests per
minute** for 2.5-flash at the time of writing. The pipeline retries on
429s automatically (exponential backoff), but for bulk runs you'll save
time by spacing requests:

```bash
python -m scripts.ai_hinting exam --year 2023 --rest 7
python -m scripts.ai_hinting bulk --sample 30 --rest 7
```

If you have a paid Gemini key and want better quality, override the
model:

```bash
python -m scripts.ai_hinting --model gemini-2.5-pro solve --year 2023 --number 2
```

## Usage

```bash
# Inspect retrieval + figure crops without spending API credits.
python -m scripts.ai_hinting -v inspect --year 2023 --number 2

# Pre-crop every figure in the corpus into data/dzexams/maths/bac/bac-figures/
# (question AND solution figures by default). Idempotent — re-runs are cheap.
python -m scripts.ai_hinting crop-all
python -m scripts.ai_hinting crop-all --year 2023 --force

# Solve a single exercise (Gemini default).
python -m scripts.ai_hinting -v solve --year 2023 --number 2

# Same, on Claude.
python -m scripts.ai_hinting --provider anthropic solve --year 2023 --number 2

# Whole exam (every exercise of the 2023 paper).
python -m scripts.ai_hinting -v exam --year 2023

# Multiple exams.
python -m scripts.ai_hinting exams --years 2018,2019,2020 --rest 2

# A random sample of 10 from anywhere in the corpus.
python -m scripts.ai_hinting bulk --sample 10 --seed 7

# No figures (text descriptions only — useful for A/B testing vision impact).
python -m scripts.ai_hinting --no-figures solve --year 2023 --number 2
```

### Output

One JSON per solved exercise in `runs/ai_hinting/<UTC-timestamp>/`:

```json
{
  "target": {"exam_year": 2023, "exercise_number": 2, "topic": "analyse",
             "filiere": "mathematiques", "has_figure": true, "...": "..."},
  "solution": {
    "exercise_id": "...",
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "elapsed_ms": 14210,
    "usage": {"prompt_tokens": 4123, "output_tokens": 1880, "total_tokens": 6003},
    "retrieval": [
      {"exam_year": 2020, "exercise_number": 1, "score": 0.571,
       "matched_concepts": [{"target": "limites", "hit": "limites", "fuzz": 100}, ...]}
    ],
    "attachments": [
      {"label": "figure_1 · graph · ex2 · part 1-أ",
       "path": ".../runs/ai_hinting/_figure_cache/2023_p1_ex2_491f1d05.png",
       "mime": "image/png"}
    ],
    "parts": [
      {
        "label": "1", "sub_label": "أ",
        "depends_on": [],
        "steps": [
          {"index": 1, "explanation": "ندرس إشارة المشتقة على المجال", "math": "$f'(x) = ...$"},
          {"index": 2, "explanation": "بما أن المقام موجب ...", "math": null}
        ],
        "final_answer": "$f$ متزايدة تماما على $[1,4]$"
      }
    ],
    "parse_error": null
  },
  "ground_truth": { "parts": [ { "label": "1", "solution": "..." } ] }
}
```

## Provider strategy

```
providers/
├── base.py              # LLMProvider (abstract), Attachment, LLMResponse, ProviderConfig
├── anthropic_provider.py  # base64 image / document blocks
├── gemini_provider.py     # Files API upload (image/PDF) + Parts.from_uri
└── __init__.py            # make_provider("gemini" | "anthropic", ...)
```

`LLMProvider` exposes three things the pipeline cares about:

| Method | Purpose |
|---|---|
| `configure(**overrides)` | Tweak `model`, `temperature`, `max_tokens` at runtime. |
| `upload(attachment)` | Push a local PNG/PDF; returns an Attachment with a provider-side handle. Idempotent. |
| `generate(system=, user=, attachments=)` | One round-trip with retries. Returns `LLMResponse(text, model, usage)`. |
| `cleanup()` | Optional — Gemini deletes its uploaded Files; Anthropic is a no-op. |

Adding a third provider = one new file:

```python
# providers/openai_provider.py
class OpenAIProvider(LLMProvider):
    name = "openai"
    def upload(self, att): ...
    def generate(self, *, system, user, attachments=()): ...
```

Then register it in `providers/__init__.py::make_provider`. Pipeline code
doesn't change.

## Figure cropping

`figures.py::FigureCropper` opens the source PDF (`bac-sujets/<year>.pdf`
by default) with PyMuPDF and renders the rectangle defined by the
extractor's `bounding_box: [ymin, xmin, ymax, xmax]` in [0..1000]
normalized coords (top-left origin, y-down).

Crops land at a deterministic path:

```
data/dzexams/maths/bac/bac-figures/<source-stem>[__s<sujet>]/ex<N>/<context>__<fig-id-8>.png
```

That path *is* the cache — the PNG's existence means the crop is up to
date. The pure helper `cropper.path_for(exercise, figure)` returns the
path without doing any I/O, so external callers (e.g. the website
backfill in Piece B+C) can read crops without instantiating a real
cropper.

When solving, the LLM sees question-context figures only — solution
figures are cropped to disk too (for the future UI) but never reach the
target prompt because they would leak the answer.

Use `python -m scripts.ai_hinting crop-all` to pre-crop the whole corpus
in one pass before bulk runs.

## Configuration

CLI flags map onto `PipelineConfig`. Highlights:

| Flag | Default | Notes |
|---|---|---|
| `--provider` | `gemini` | `gemini` (free tier) or `anthropic` (paid). |
| `--model` | provider default (`gemini-2.5-flash` free / `claude-sonnet-4-6` paid) | Override with any model the chosen SDK accepts (e.g. `gemini-2.0-flash`, `gemini-2.5-pro`, `claude-opus-4-7`). |
| `-k` | 3 | Few-shot references. |
| `--fuzzy-threshold` | 80 | rapidfuzz token-set ratio for concept matching. |
| `--min-concept-score` | 0.15 | Floor on fuzzy-Jaccard. |
| `--no-figures` | off | Skip PDF cropping. |
| `--rest` | 0.0 | Sleep between API calls in bulk modes. |
| `--data-dir` | `data/.../bac-results-new` | New extractor output. Legacy `bac-results` is auto-included unless `--no-legacy`. |
| `--pdf-root` | `bac-sujets` + `bac-blanc-sujets` | Where to look up source PDFs. |

## Data format support

The loader accepts both layouts the extractor produces:

```jsonc
// Flat (older / single-subject extractions)
{"exam_metadata": {...}, "exercises": [...], "figures": [...]}

// Wrapped (new prompt; multi-subject "Sujet 1 / Sujet 2" exams)
{"exams": [{"exam_metadata": {...}, "exercises": [...], "figures": [...]}, ...]}
```

New fields the loader now picks up:
- `exam_metadata.sujet`
- `exercise.metadata`, `exercise.source_page` (int or list)
- `part.has_figure`, `part.metadata`
- `figure.context`, `figure.bounding_box`, `figure.source_page`,
  and the expanded `figure_type` enum
  (`probability_tree`, `number_line`, `statistical_chart`, `circuit`).

---

## Why math-only prompts

`SUBJECT_HINTS` in `prompts.py` reserves a slot per subject. Math is the
default because:

1. **LaTeX discipline** — generic prompts mix `\mathbb{R}` and `R`.
2. **Demonstration patterns** — *raisonnement par récurrence*,
   *encadrement*, *suite adjacente* have canonical 3-step layouts that
   physics/chemistry don't share.
3. **Granularity** — physics needs unit propagation, chemistry needs
   reaction balancing; both would force the math prompt to be longer
   without helping math quality.

Adding physics is a one-file change: set `SUBJECT_HINTS["physics"] = "..."`
and ensure the corpus's `subject` field routes through
`system_prompt_for()` automatically.

---

## Next versions — improvement roadmap

### v2 — Curriculum-augmented retrieval
The biggest weakness of v1 is that *similar exercises* ≠ *relevant lessons*.
A student who can't differentiate doesn't need three more differentiation
exercises — they need the differentiation rules.
1. Curriculum index: short, dense lesson cards per concept
   (`derivation.md`, `raisonnement_par_recurrence.md`), ~1–2k tokens each.
2. Two-stage retrieval: lessons by concept, then exercises as before.

### v3 — Step-validated hinting (the actual product)
Current pipeline outputs a full solution. The hinting product instead:
1. Generates the full solution internally.
2. A "hinter" model produces a Socratic question per step that doesn't
   reveal the step itself.
3. Validate hints against rules (never reveal answer, single prior step
   reference, ends with a question).
4. Track student progress in the platform.

### v4 — Verifier loop
1. **Symbolic check (sympy)** on closed-form answers vs the ground truth.
2. **LLM-as-judge** scoring correctness, rigor, notation (0–5 rubric per
   part). Track this metric over time, not just "did it produce output".
3. **Critic-then-revise** — if judge < 3, give the original model the
   critique and re-prompt once.

### v5 — Multi-page figure context
Today we crop a single bounding box. Next: when the LLM is uncertain,
pass the **entire source page** so it can read surrounding context.

### v6 — Curriculum-rule grammar
For high-leverage tables (derivation, complex-number forms), encode the
rules as structured prompt sections rather than relying on retrieval.

### Retrieval improvements (any version)
- **Embedding fallback** when fuzzy-Jaccard returns < K hits (Arabic-aware
  embeddings).
- **Difficulty stratification** — for hinting, deliberately retrieve
  *easier* examples so the model bridges the gap rather than parrots.
- **Year balance** — older (≤ 2015) and newer (≥ 2018) curricula differ;
  prefer same-era examples when target year is known.
- **Concept ontology graph** built from `subjects_metadata.json` so
  retrieval can fall back to *prerequisites* of the target concept.

### Evaluation harness (we don't have one yet)
v1 output bundles `ground_truth` per exercise. Turn this into a benchmark:
1. Run v1 on the full corpus once → baseline metrics file.
2. Score each part with LLM-as-judge (1–5 rubric, math-specific).
3. Aggregate by topic / filière / year / difficulty.
4. Commit the metrics file as a regression guard.
