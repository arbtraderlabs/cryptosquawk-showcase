# Video Script

A ~55–60 second narration script timed to one full **Showcase Mode** loop
(`Normal → Whale Alert → Volatility Spike → Suppressed → Degraded/Outage`,
11 seconds each). Use this as a voiceover guide when recording a demo video
or GIF of the dashboard; timestamps assume you start recording the instant
you click **▶ Showcase Mode**.

---

**[0:00 – 0:03] (cold open, full dashboard visible, Showcase Mode just started)**

> "This is CryptoSquawk — an AI market-commentary squawk box, shown here in
> a fully synthetic public showcase. Everything you're about to see is
> fabricated demo data. No real market, no real trades, no advice."

**[0:03 – 0:11] Normal Market**

> "In steady state, ticks and news flow into the event stream on the left,
> and the AI's commentary — descriptive, never prescriptive — comes out the
> other side. Notice the processing pipeline up top: every squawk's exact
> path through it is fully traceable."

*(Optional action: click a squawk card here to show the trace modal opening
and the pipeline lighting up green.)*

**[0:11 – 0:22] Whale Alert**

> "Now a large on-chain transfer trips a whale alert. Throughput ticks up,
> the funnel widens at the top, and the system keeps pace — parity between
> the live and shadow inference engines stays high the whole time."

**[0:22 – 0:33] Volatility Spike**

> "Under a volatility spike, request rate and queue depth climb sharply —
> you can see it reflected live in System Health — while latency percentiles
> and inference cost both shift up accordingly in the panels on the right."

**[0:33 – 0:44] Suppressed**

> "This is the guardrail layer in action. Low-confidence candidates and
> policy-blocked signals — quiet hours, duplicate suppression — are
> generated but deliberately withheld. Watch the signal funnel: most
> candidates never make it past the guardrail stage, and you can click any
> withheld entry to see exactly why."

**[0:44 – 0:55] Degraded / Outage**

> "Finally, a simulated feed adapter fault. The live engine degrades — but
> the shadow engine stays healthy and picks up the read traffic, isolating
> the blast radius until the feed recovers and the two reconcile."

**[0:55 – 0:58] (loop restarts to Normal Market)**

> "And the loop starts again. Thanks for watching — this is a static,
> open, no-backend showcase; check the README for the source and the docs
> folder for how every panel works."

---

## Tips for recording

- Reduce browser chrome / use a clean full-screen capture at 1600×1000 or
  larger so the 3-column layout has room to breathe.
- If you want a completely hands-off recording, just click **▶ Showcase
  Mode** once and let it run — the loop is fully deterministic and will
  repeat identically every ~55 seconds.
- To highlight the squawk-trace interaction instead of Showcase Mode, pause
  on a manually-selected scenario and click through 2–3 squawk cards,
  including at least one `SUPPRESSED` one, to show the red guardrail-blocked
  state.
- If recording with `prefers-reduced-motion` enabled (e.g. for an
  accessibility-focused cut), mention that panels still update in real time
  — only the decorative motion (pulses, staggered reveals, transitions) is
  removed.
