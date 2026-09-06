# Showcase Data

All content rendered by this dashboard — every tick, alert, squawk, health
metric, and log line — comes from a single local file:
[`data/scenarios.json`](../data/scenarios.json). There is no other data
source, no network call to anything but this file, and nothing here is real
market data.

## Top-level shape

```jsonc
{
  "meta": { "product": "CryptoSquawk", "vendor": "ArbTrader Labs", "dataType": "synthetic", ... },
  "pipelineStages": [ { "id": "ingest", "label": "Ingest", "detail": "..." }, ... ],
  "showcase": { "loopMs": 54000, "order": ["normal", "whale", "volatile", "suppressed", "degraded"] },
  "scenarios": {
    "normal":     { ...scenario... },
    "whale":      { ...scenario... },
    "volatile":   { ...scenario... },
    "suppressed": { ...scenario... },
    "degraded":   { ...scenario... }
  }
}
```

### `pipelineStages`

An ordered list of the 7 stages drawn in the Processing Pipeline panel.
Each has `id` (used to cross-reference from a squawk's `trace`), `label`
(short title), and `detail` (one-line description, word-wrapped by
`pipeline.js` at render time).

### `showcase`

- `order` — the sequence of scenario ids Showcase Mode cycles through.
- `loopMs` — informational; the *actual* loop length used by the app is the
  sum of each listed scenario's own `durationMs` (see `js/app.js
  startShowcase()`), which currently totals 55,000ms — within the requested
  45–60 second range.

## Per-scenario shape

Each entry under `scenarios` has:

| Field | Type | Purpose |
|---|---|---|
| `id`, `label`, `tagline` | string | Identity and the one-line description shown in the UI. |
| `accent` | string | One of `cyan`/`violet`/`amber`/`red`/`slate` — sets `body[data-accent]`, which retints `--accent` in CSS. |
| `durationMs` | number | How long this scenario's timeline runs before looping (manual mode) or advancing to the next scenario (Showcase Mode). |
| `systemHealth` | object | Snapshot rendered into the System Health panel. |
| `shadowHealth` | object | Snapshot rendered into the Shadow-Mode Health panel. |
| `funnel` | object | `{ ingested, filtered, scored, aboveThreshold, published, delivered }` counts for the Signal Funnel panel. |
| `observability` | object | `{ rps, errorRatePct, p50Ms, p95Ms, p99Ms, activeTraces, logs[] }`. |
| `cost` | object | `{ perSquawkUsd, tokensPerSquawk, monthlyProjectionUsd, trend[] }`. `trend` feeds the cost sparkline. |
| `events` | array | Timeline items for the Event Stream panel. |
| `squawks` | array | Timeline items for the AI Squawk Output panel. |

### `events[]` items

```jsonc
{ "t": 1400, "type": "tick", "symbol": "ETH-USD", "text": "ETH-USD tick $3,041.55 (-0.05%)", "severity": "info" }
```

`t` is a millisecond offset from the scenario's start; `severity` is
`info` | `warn` | `error` and controls the left border color in the event
list.

### `squawks[]` items

```jsonc
{
  "t": 900, "id": "n1", "symbol": "BTC-USD",
  "confidence": 0.71, "suppressed": false,
  "text": "BTC holding above short-term support near $63.1k amid contracting realized volatility.",
  "latencyMs": 402, "costUsd": 0.0040,
  "trace": [
    { "stage": "ingest", "ms": 18 },
    { "stage": "normalize", "ms": 9 },
    { "stage": "features", "ms": 41 },
    { "stage": "infer", "ms": 210 },
    { "stage": "guardrail", "ms": 12 },
    { "stage": "synth", "ms": 98 },
    { "stage": "deliver", "ms": 14 }
  ]
}
```

For a suppressed squawk, add `"suppressed": true` and a human-readable
`"suppressReason"`, and end the `trace` array at the `guardrail` stage with
`"blocked": true` on that entry (no `synth`/`deliver` steps, since it never
reached them):

```jsonc
{
  "suppressed": true,
  "suppressReason": "confidence 0.42 below 0.65 publish threshold",
  "trace": [
    { "stage": "ingest", "ms": 14 },
    { "stage": "normalize", "ms": 8 },
    { "stage": "features", "ms": 36 },
    { "stage": "infer", "ms": 140 },
    { "stage": "guardrail", "ms": 12, "blocked": true }
  ]
}
```

## Writing style constraints (important)

Squawk `text` (and `suppressReason`) must stay **descriptive/observational**,
never **prescriptive**. Good: "liquidity depth steady across top-5 venues",
"dispersion now 2.3x the 7-day baseline". Not acceptable: anything resembling
"buy", "sell", "enter a position", "take profit", or similar trading
instructions. This is enforced only by review/convention in this repo (there
is no automated linter for it) — please keep it that way in any additions.

## Extending or remixing this data

Because everything is driven from this one JSON file:

- You can add a new scenario by adding a new key under `scenarios` and, if
  you want it in the automatic loop, appending its id to `showcase.order`.
- You can lengthen/shorten a scenario by changing its `durationMs` and
  adjusting the `t` offsets of its `events`/`squawks` to fit.
- You can add pipeline stages by adding entries to `pipelineStages` and
  referencing their `id` from a squawk's `trace` — `pipeline.js` lays out
  and sizes the SVG boxes generically based on however many stages are
  provided.

No JavaScript changes are required for most content edits.
