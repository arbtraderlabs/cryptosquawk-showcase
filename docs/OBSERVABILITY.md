# Observability

The right-hand column of the dashboard is dedicated to making the system's
*operational* state legible at a glance: is it healthy, how fast is it, and
what is it costing. This document explains each panel and the synthetic
values behind it.

## System Health

Basic infrastructure vitals for the (fictional) service: overall `status`,
`uptime %`, `CPU %`, `memory %`, queue depth, instance count, and error
rate. These numbers move together in a believable way per scenario — e.g.
the `Volatility Spike` scenario shows CPU/queue depth climbing as an
autoscaler (per its synthetic log line) adds instances to keep up, while
`Degraded / Outage` shows CPU/memory pinned high, a large queue backlog, and
an elevated error rate.

## Shadow-Mode Health

Covered in detail in [`SHADOW_MODE.md`](SHADOW_MODE.md) — a side-by-side
comparison of the live and shadow inference engines, plus parity/drift/replay
lag.

## Observability panel (requests, errors, traces + logs)

- **Req/s** — synthetic request-rate gauge, scaled per scenario (e.g. much
  higher during `Volatility Spike`, lower during `Degraded / Outage` since
  the feed itself is impaired).
- **Errors** — error rate percentage.
- **Traces** — a rough count of concurrently active distributed traces,
  standing in for whatever your real tracing backend (Jaeger, Tempo, Honeycomb,
  etc.) would report.
- **Log tail** — three or four representative synthetic log lines per
  scenario, styled like a terminal, giving a taste of what an engineer
  watching `kubectl logs` or a log aggregator might see at that moment
  (e.g. `circuit-breaker: live engine tripped, routing reads to shadow
  engine`).

These are illustrative numbers hand-authored per scenario, not a live
metrics/logs integration — there is no Prometheus, OpenTelemetry, or logging
backend wired up in this static showcase.

## Latency panel

Three bars — **p50 / p95 / p99** — showing end-to-end pipeline latency in
milliseconds for the current scenario. Bar height is normalized to the
scenario's own p99 so the shape is comparable across scenarios even though
the absolute numbers differ (e.g. `Degraded / Outage` pushes p99 past 1.6s
as retries and backpressure kick in, versus ~480ms in `Normal Market`).

Each individual squawk's trace modal also shows a **per-stage millisecond
breakdown** (ingest/normalize/feature-extract/infer/guardrail/synth/deliver),
so the aggregate p50/p95/p99 figures can be traced back to where time is
actually spent for a specific message.

## Cost panel

- **Per squawk** — synthetic inference cost in USD for a single generated
  squawk (covers the "Model Infer" + "Squawk Synth" stages conceptually).
- **Tokens/squawk** — a rough token-count stand-in for LLM-style commentary
  generation.
- **Monthly est.** — a naive projection (current per-squawk cost × an
  assumed monthly volume for that scenario's traffic level) to make the
  cost/throughput tradeoff visible — e.g. `Volatility Spike`'s much higher
  throughput drives a noticeably higher monthly estimate despite a similar
  per-squawk cost.
- **Trend sparkline** — a small hand-drawn SVG line chart (see
  `js/charts.js`) of the last several per-squawk cost samples, so a viewer
  can see whether cost is drifting up or down over time.

## What this deliberately does *not* do

- No real billing, cloud cost, or usage-metering API is called.
- No real tracing/log backend is queried.
- Nothing here reports on, or is derived from, any real trading account,
  exchange, or on-chain address.
