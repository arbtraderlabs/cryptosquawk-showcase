# Shadow Mode

**Shadow mode** is the safety pattern the "Shadow-Mode Health" panel is built
to demonstrate: running a second, non-authoritative inference engine
alongside the live one, purely to observe how it *would have* behaved,
without ever letting it affect a real user until it has proven itself.

This document describes the concept as depicted in the showcase. It is a
narrative device for the demo, not a description of any production system.

## The idea

- The **Live Engine** is the one whose output actually reaches the
  `Guardrail` and `Squawk Synth` stages and gets delivered to subscribers.
- The **Shadow Engine** runs the same event through a candidate model (a
  newer version, a different feature set, a different threshold policy —
  whatever is being evaluated) and records what it *would have* produced,
  purely for comparison.
- Because the shadow engine's output is never delivered, a regression in the
  shadow model can never reach an end user. This lets a team gain confidence
  in a new model against real traffic patterns before it's ever promoted to
  live.

## What the panel shows

| Field | Meaning |
|---|---|
| **Live Engine / Shadow Engine status** | `HEALTHY` or `DEGRADED` for each engine independently. |
| **Parity** | The percentage of recent events where live and shadow agreed (same squawk / same suppression decision). High parity means the shadow candidate is behaving like the incumbent. |
| **Drift score** | A rough measure of how far shadow output has diverged from live on the events where they disagree. Rising drift is worth investigating even if it isn't yet an outage. |
| **Replay lag** | How far behind (in ms) the shadow engine is in processing the same event stream — useful for spotting a shadow engine that's falling behind under load. |

## How the scenarios exercise it

- **Normal / Whale Alert / Volatility Spike / Suppressed** — both engines
  report `HEALTHY`, parity is high (97–99%), and drift/replay-lag stay low.
  This is the steady state: the shadow engine is quietly keeping pace and
  agreeing with live.
- **Degraded / Outage** — a simulated feed-adapter fault trips the live
  engine into a `DEGRADED` state (parity drops to ~88%, drift rises, replay
  lag balloons past 2 seconds), while the **Shadow Engine stays `HEALTHY`**.
  In the accompanying event stream you can see the (fictional) circuit
  breaker trip and route read traffic to the shadow engine to preserve
  continuity, then reconcile and hand control back once the feed recovers.
  This is the core "blast-radius isolation" story: a fault in the primary
  path doesn't have to mean total downtime if a healthy secondary path
  exists to fail over to.

## Why this matters for a product like CryptoSquawk

A system that generates automated commentary about live markets has to earn
trust incrementally. Shadow mode is one of the standard patterns for doing
that safely:

1. Ship a new model or policy to shadow only.
2. Watch parity/drift against the live engine over real traffic.
3. Only promote shadow → live once confidence is high, ideally with a
   gradual rollout rather than a hard cutover.
4. Keep the ability to fail *back* to whichever engine is currently healthier
   if something goes wrong in production.

None of this is a substitute for correctness — it's a way to reduce the
blast radius of the inevitable mistake.
