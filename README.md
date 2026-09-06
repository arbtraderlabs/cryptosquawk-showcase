# CryptoSquawk — Public Showcase

**A clean-room, static, single-page demo of an AI market-commentary "squawk box"
with shadow-mode safety, guardrails, and full observability — by ArbTrader Labs.**

> ⚠️ **This is a synthetic demo.** Every price, alert, log line, metric, and
> AI "squawk" on this page is fabricated for illustration. There is **no**
> backend, **no** API keys, **no** real accounts, and **no** live market data.
> Nothing in this repository is, or should be interpreted as, financial
> advice or a trading recommendation.

---

## What is this?

CryptoSquawk (as depicted here) is a hypothetical system that listens to
crypto market events (price ticks, on-chain transfers, news) and produces
short, descriptive natural-language commentary ("squawks") — similar in
spirit to a trading-floor squawk box, but for observational market color,
never instructions to buy or sell.

This repository is a **public-facing showcase** of what that product's
operational dashboard could look like: a dark, information-dense control
room view that highlights the interesting *engineering* story — dual
live/shadow inference, guardrails that can suppress low-confidence or
policy-blocked output, an observable pipeline, and cost/latency tracking —
using entirely local, synthetic, deterministic data.

It is a **from-scratch, clean-room implementation**. No private CryptoSquawk
source, configuration, or proprietary assets were inspected or reused in
building it.

## Features

- **Top bar** — brand, live clock, connection/health indicator, scenario
  switcher, and a one-click **Showcase Mode** toggle.
- **Event stream** — a scrolling feed of synthetic market ticks, on-chain
  flow alerts, and news blips.
- **AI squawk output** — natural-language commentary cards, clearly marked
  `PUBLISHED` or `SUPPRESSED`, each **clickable to reveal its full decision
  trace**.
- **Processing pipeline visual** — a hand-drawn SVG diagram of the 7-stage
  pipeline (Ingest → Normalize → Feature Extract → Model Infer → Guardrail →
  Squawk Synth → Deliver). Clicking a squawk animates the exact stages it
  traversed, and highlights in red the stage where a guardrail blocked it.
- **Signal funnel** — Ingested → Filtered → Scored → Above Threshold →
  Published → Delivered, so you can see guardrails/outages narrow the funnel.
- **System health & Shadow-Mode health** — CPU/memory/queue/uptime, plus a
  side-by-side Live Engine vs. Shadow Engine comparison (status, parity %,
  drift score, replay lag) that visibly diverges during the Degraded/Outage
  scenario.
- **Observability panel** — request rate, error rate, active traces, and a
  tiny synthetic log tail.
- **Latency panel** — p50 / p95 / p99 bars per scenario.
- **Cost panel** — per-squawk cost, tokens/squawk, monthly cost projection,
  and a hand-drawn SVG sparkline trend.
- **Scenario switcher** — `Normal`, `Whale Alert`, `Volatility Spike`,
  `Suppressed`, and `Degraded / Outage` — each with its own scripted event
  timeline, funnel, health, and cost/latency snapshot.
- **Showcase Mode** — a fully deterministic ~55 second loop that cycles
  through all five scenarios automatically, with a visible progress bar,
  ideal for demo recordings or an unattended kiosk display.
- **`prefers-reduced-motion` support** — animations, transitions, and the
  stepwise pipeline "pulse" are disabled/collapsed when the user (or their
  OS) requests reduced motion; content still updates, just without motion
  effects.
- **Responsive** — a 3-column desktop layout that gracefully stacks down to
  a single column on mobile.

## Tech stack

Plain **HTML5 + CSS3 + vanilla JavaScript (ES2017)**. No frameworks, no
build step, no bundler, no npm dependencies at runtime. All charts (funnel
bars, latency bars, cost sparkline, pipeline diagram) are hand-drawn SVG/DOM,
not a charting library.

```
index.html          Single-page app shell
css/styles.css       Dark "ArbTrader Labs" theme, all layout & animation
js/data.js           Loads data/scenarios.json, small accessor API
js/pipeline.js       Renders the pipeline SVG + trace playback/highlighting
js/charts.js         Tiny dependency-free SVG sparkline helper
js/app.js            Main controller: rendering, scheduling, Showcase Mode
data/scenarios.json  All synthetic scenario data (see docs/SHOWCASE_DATA.md)
docs/                Architecture, shadow-mode, observability & data docs
```

## Running locally

No build step is required. Because the app `fetch()`es its local JSON data
file, you do need to serve it over HTTP (not `file://`) so the browser
allows the request:

```bash
cd cryptosquawk-showcase
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

Any static file server works equally well (`npx serve`, `php -S`, etc.).

## Validation

This showcase was manually validated with a local static server and a
headless-browser pass (Playwright/Chromium) that: loaded the page with zero
console/network errors, exercised every scenario switch, opened and closed
the squawk trace modal, verified pipeline stage highlighting (including the
guardrail-blocked red state), ran a full Showcase Mode cycle, and confirmed
`prefers-reduced-motion` correctly suppresses animation. Desktop (1600px)
and mobile (420px) viewports were both visually inspected.

## Deploying

A GitHub Pages workflow is included at
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). It deploys the
repository root as a static site on every push to `main`. Enable it by
setting the repository's **Settings → Pages → Source** to **GitHub Actions**.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the illustrative system
  this dashboard visualizes, and how the showcase front-end itself is built.
- [`docs/SHADOW_MODE.md`](docs/SHADOW_MODE.md) — what shadow-mode means here
  and why it matters.
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) — the metrics, logs, cost
  and latency panels explained.
- [`docs/SHOWCASE_DATA.md`](docs/SHOWCASE_DATA.md) — the `scenarios.json`
  schema and how to extend it.
- [`docs/VIDEO_SCRIPT.md`](docs/VIDEO_SCRIPT.md) — a ~60s narration script
  timed to the Showcase Mode loop, for recording a demo video.

## Disclaimer

CryptoSquawk, as shown here, is a **product concept demonstration**. All
data is synthetic and hand-authored. This project does not execute trades,
connect to any exchange or wallet, store credentials, or offer financial,
investment, or trading advice of any kind. Commentary strings were
deliberately written to be descriptive/observational (e.g. "liquidity
depth steady", "dispersion above baseline") and never prescriptive
(no "buy", "sell", "enter", or similar instructions).

## License

MIT — see [`LICENSE`](LICENSE).
