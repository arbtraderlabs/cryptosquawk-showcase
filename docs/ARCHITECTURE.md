# Architecture

This document describes two things: (1) the **illustrative system**
CryptoSquawk that this showcase's dashboard visualizes, and (2) how the
**showcase front-end itself** (this repository) is actually built. Everything
in part (1) is a narrative device for the demo — no production code,
infrastructure, or configuration is represented.

---

## 1. The illustrative system

CryptoSquawk (as depicted in this showcase) is a pipeline that turns raw
market signals into short natural-language commentary, with safety rails at
every step. The dashboard's **Processing Pipeline** panel visualizes it as
seven stages:

```
Ingest → Normalize → Feature Extract → Model Infer → Guardrail → Squawk Synth → Deliver
```

1. **Ingest** — Market-data and news adapters (e.g. exchange tick feeds,
   on-chain watchers, headline feeds) normalize their events onto a common
   event bus.
2. **Normalize** — Schema validation, de-duplication, and symbol mapping so
   downstream stages see one consistent event shape.
3. **Feature Extract** — Rolling statistics, liquidity/dispersion features,
   and cross-asset context are computed for the event.
4. **Model Infer** — A **live model** and a **shadow model** both score the
   event in parallel (see [`SHADOW_MODE.md`](SHADOW_MODE.md)).
5. **Guardrail** — Confidence thresholds, quiet-hours policy, duplicate
   suppression, and compliance checks decide whether the candidate squawk
   may proceed. This is the stage most responsible for the `Suppressed`
   scenario.
6. **Squawk Synth** — Approved candidates are turned into a short piece of
   natural-language commentary.
7. **Deliver** — The finished squawk is published to the live stream and any
   subscribers.

Every squawk in the dashboard carries a **trace**: an ordered list of the
stages it actually visited, with a millisecond duration per stage, and — for
suppressed squawks — the stage where it was blocked and why. Clicking any
squawk card opens this trace and replays it on the pipeline diagram.

### Why show this at all?

The point of the showcase isn't the trading commentary — it's the
**engineering posture** around it: dual-engine inference for safety,
explicit guardrails instead of implicit trust in a model's output, full
traceability of every published (or withheld) message, and observability
into cost/latency/health at a glance.

---

## 2. The showcase front-end

This repository is a static, dependency-free single-page app.

```
index.html          Page shell: top bar, panels, modal markup
css/styles.css       Dark theme, grid layout, all animation/transitions
js/data.js           CSData — fetches data/scenarios.json, small accessors
js/pipeline.js       CSPipeline — builds/animates the pipeline SVG
js/charts.js         CSCharts — tiny hand-rolled SVG sparkline helper
js/app.js            Main controller (rendering + scheduling + Showcase Mode)
data/scenarios.json  All scenario data (see SHOWCASE_DATA.md)
```

### Rendering model

Each scenario in `scenarios.json` carries two kinds of data:

- **Snapshot data** — system health, shadow health, funnel counts,
  observability metrics, cost figures. These are rendered immediately and
  in full the instant a scenario starts playing.
- **Timeline data** — an ordered list of `events` and `squawks`, each with a
  millisecond offset (`t`) from the start of the scenario. `app.js` schedules
  one `setTimeout` per timeline item so they appear one at a time, giving the
  event stream and squawk feed a "live" feel while remaining perfectly
  reproducible (no `Math.random()` anywhere in the runtime).

### Scenario playback & Showcase Mode

- **Manual mode** (default): selecting a scenario from the dropdown plays
  its timeline once, then loops it again automatically so the dashboard
  never goes stale while you inspect it.
- **Showcase Mode**: pre-computes the cumulative start offset of every
  scenario in `data.showcase.order`, schedules all of them up front against
  a single loop-start timestamp, and reschedules the whole loop again once
  the total duration elapses. A `requestAnimationFrame` loop drives the
  progress bar fill purely from `performance.now() - loopStart`, so the UI
  timer and the underlying `setTimeout` schedule can never drift apart in a
  way that's visible to the user.
- Total loop length is the sum of each scenario's `durationMs` (currently
  5 × 11s = 55s), which sits inside the requested 45–60 second range.

### Squawk trace modal & pipeline sync

`openTraceModal()` renders the clicked squawk's metadata and its
`trace[]` array as a numbered list, cross-referencing each `stage` id
against `pipelineStages` (loaded from the same JSON) for the human-readable
label/detail text. It then calls `CSPipeline.animateTrace()`, which walks the
same stage ids and lights up the corresponding SVG boxes/arrows in order
(or in one step, under reduced motion), marking the stage a guardrail
blocked in red.

### Accessibility & reduced motion

- Landmarks (`header`, `main`, `footer`), a skip link, `aria-live` regions
  on the event/squawk lists, and a real `role="dialog"`/`aria-modal` trace
  modal with focus movement and `Escape`-to-close.
- A single `matchMedia('(prefers-reduced-motion: reduce)')` listener toggles
  a `reduce-motion` class on `<body>`; CSS keys off that class (and a global
  `@media (prefers-reduced-motion: reduce)` safety net) to remove
  transitions/animations, while `pipeline.js` and `app.js` skip the
  stepwise/staggered reveal in favor of showing the final state immediately.

### No backend, no network calls

The only network request the app makes is a same-origin `fetch()` of
`data/scenarios.json`. There are no API keys, no third-party scripts, and no
analytics.
