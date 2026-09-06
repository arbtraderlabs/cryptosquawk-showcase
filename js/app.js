/**
 * app.js — Main controller for the CryptoSquawk showcase.
 *
 * Responsibilities:
 *  - Load synthetic data (data/scenarios.json) via CSData
 *  - Render all panels for the active scenario (health, shadow, funnel,
 *    observability, cost, latency)
 *  - Play back each scenario's scripted event/squawk timeline on a
 *    deterministic schedule (setTimeout keyed off fixed offsets — no
 *    randomness, so behavior is reproducible on every load)
 *  - Drive "Showcase Mode": an automatic 45-60s loop through all scenarios
 *  - Power the clickable squawk trace modal + pipeline visualization
 *  - Respect prefers-reduced-motion throughout
 *
 * No backend, no network calls beyond the local data file, no external
 * dependencies. Everything here is original, clean-room code.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* DOM references                                                      */
  /* ------------------------------------------------------------------ */
  const $ = (sel) => document.querySelector(sel);

  const els = {
    clock: $("#clock"),
    connDot: $("#connDot"),
    connLabel: $("#connLabel"),
    scenarioSelect: $("#scenarioSelect"),
    showcaseToggle: $("#showcaseToggle"),
    showcaseBar: $("#showcaseBar"),
    showcaseBarFill: $("#showcaseBarFill"),
    showcaseBarLabel: $("#showcaseBarLabel"),
    eventList: $("#eventList"),
    scenarioChipEvents: $("#scenarioChipEvents"),
    scenarioChipFunnel: $("#scenarioChipFunnel"),
    pipelineSvg: $("#pipelineSvg"),
    funnel: $("#funnel"),
    squawkList: $("#squawkList"),
    squawkCount: $("#squawkCount"),
    systemHealth: $("#systemHealth"),
    shadowHealth: $("#shadowHealth"),
    obsGrid: $("#obsGrid"),
    logLines: $("#logLines"),
    latencyBars: $("#latencyBars"),
    costGrid: $("#costGrid"),
    costSparkline: $("#costSparkline"),
    traceModalBackdrop: $("#traceModalBackdrop"),
    traceModal: $("#traceModal"),
    traceModalClose: $("#traceModalClose"),
    traceModalTitle: $("#traceModalTitle"),
    traceModalSymbol: $("#traceModalSymbol"),
    traceModalText: $("#traceModalText"),
    traceModalMeta: $("#traceModalMeta"),
    traceSteps: $("#traceSteps")
  };

  /* ------------------------------------------------------------------ */
  /* Reduced-motion handling                                             */
  /* ------------------------------------------------------------------ */
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function applyMotionPref() {
    document.body.classList.toggle("reduce-motion", motionQuery.matches);
  }
  applyMotionPref();
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", applyMotionPref);
  else if (motionQuery.addListener) motionQuery.addListener(applyMotionPref);
  function reduced() { return motionQuery.matches; }

  /* ------------------------------------------------------------------ */
  /* Scheduling state                                                    */
  /* ------------------------------------------------------------------ */
  let playTimers = [];       // timers for the currently playing scenario's events/squawks
  let manualLoopTimer = null; // repeats a single manually-selected scenario
  let showcase = {
    active: false,
    timers: [],
    restartTimer: null,
    rafId: null,
    loopStart: 0,
    total: 0,
    cumulative: [],
    order: []
  };
  let currentScenarioId = "normal";

  function clearPlayTimers() {
    playTimers.forEach(clearTimeout);
    playTimers = [];
  }

  function clearManualLoop() {
    if (manualLoopTimer) clearTimeout(manualLoopTimer);
    manualLoopTimer = null;
  }

  function clearShowcaseTimers() {
    showcase.timers.forEach(clearTimeout);
    showcase.timers = [];
    if (showcase.restartTimer) clearTimeout(showcase.restartTimer);
    showcase.restartTimer = null;
    if (showcase.rafId) cancelAnimationFrame(showcase.rafId);
    showcase.rafId = null;
  }

  /* ------------------------------------------------------------------ */
  /* Formatting helpers                                                  */
  /* ------------------------------------------------------------------ */
  function fmtOffset(ms) {
    return "+" + (ms / 1000).toFixed(1) + "s";
  }
  function fmtPct(n) { return n + "%"; }
  function fmtUsd(n) { return "$" + n.toFixed(4); }
  function fmtUsd2(n) { return "$" + n.toFixed(2); }

  /* ------------------------------------------------------------------ */
  /* Panel renderers (static per-scenario snapshot data)                 */
  /* ------------------------------------------------------------------ */
  function renderSystemHealth(sh) {
    const rows = [
      ["Status", sh.status, "status-" + sh.status],
      ["Uptime", fmtPct(sh.uptimePct), ""],
      ["CPU", fmtPct(sh.cpuPct), ""],
      ["Memory", fmtPct(sh.memPct), ""],
      ["Queue depth", sh.queueDepth, ""],
      ["Instances", sh.instances, ""],
      ["Error rate", fmtPct(sh.errorRatePct), ""]
    ];
    els.systemHealth.innerHTML = rows.map(([label, val, cls]) =>
      `<div class="metric"><dt>${label}</dt><dd class="${cls}">${val}</dd></div>`
    ).join("");

    // Reflect overall status in the top bar connection indicator.
    const state = sh.status === "healthy" ? "live" : (sh.status === "degraded" ? "degraded" : "down");
    els.connDot.dataset.state = state;
    els.connLabel.textContent = sh.status === "healthy"
      ? "Live feed connected"
      : "Live feed degraded — shadow engine active";
  }

  function renderShadowHealth(sh) {
    els.shadowHealth.innerHTML = `
      <div class="shadow-engine">
        <h4>Live Engine</h4>
        <div class="eng-status ${sh.liveStatus === "healthy" ? "healthy" : "degraded"}">${sh.liveStatus.toUpperCase()}</div>
      </div>
      <div class="shadow-engine">
        <h4>Shadow Engine</h4>
        <div class="eng-status ${sh.shadowStatus === "healthy" ? "healthy" : "degraded"}">${sh.shadowStatus.toUpperCase()}</div>
      </div>
      <div class="shadow-parity">
        <span>Parity: <b>${sh.parityPct}%</b></span>
        <span>Drift: <b>${sh.driftScore}</b></span>
        <span>Replay lag: <b>${sh.replayLagMs}ms</b></span>
      </div>`;
  }

  function renderFunnel(funnel) {
    const stages = [
      ["Ingested", funnel.ingested],
      ["Filtered", funnel.filtered],
      ["Scored", funnel.scored],
      ["Above threshold", funnel.aboveThreshold],
      ["Published", funnel.published],
      ["Delivered", funnel.delivered]
    ];
    const max = stages[0][1] || 1;
    els.funnel.innerHTML = stages.map(([label, val]) => `
      <div class="funnel-row">
        <span class="fr-label">${label}</span>
        <span class="funnel-track"><span class="funnel-fill" style="width:${Math.max(2, (val / max) * 100)}%"></span></span>
        <span class="fr-value">${val}</span>
      </div>`).join("");
  }

  function renderObservability(obs) {
    els.obsGrid.innerHTML = `
      <div class="obs-cell"><div class="obs-val">${obs.rps}</div><div class="obs-key">Req/s</div></div>
      <div class="obs-cell"><div class="obs-val">${obs.errorRatePct}%</div><div class="obs-key">Errors</div></div>
      <div class="obs-cell"><div class="obs-val">${obs.activeTraces}</div><div class="obs-key">Traces</div></div>`;
    els.logLines.innerHTML = obs.logs.map((l) => `<li>${escapeHtml(l)}</li>`).join("");
  }

  function renderLatency(obs) {
    const bars = [["p50", obs.p50Ms], ["p95", obs.p95Ms], ["p99", obs.p99Ms]];
    const max = Math.max(...bars.map((b) => b[1])) || 1;
    els.latencyBars.innerHTML = bars.map(([label, val]) => `
      <div class="latency-bar-col">
        <div class="lb-value">${val}</div>
        <div class="bar" style="height:${Math.max(6, (val / max) * 100)}%"></div>
        <div class="lb-label">${label}</div>
      </div>`).join("");
  }

  function renderCost(cost) {
    els.costGrid.innerHTML = `
      <div class="cost-cell"><div class="cc-key">Per squawk</div><div class="cc-val">${fmtUsd(cost.perSquawkUsd)}</div></div>
      <div class="cost-cell"><div class="cc-key">Tokens/squawk</div><div class="cc-val">${cost.tokensPerSquawk}</div></div>
      <div class="cost-cell"><div class="cc-key">Monthly est.</div><div class="cc-val">${fmtUsd2(cost.monthlyProjectionUsd)}</div></div>
      <div class="cost-cell"><div class="cc-key">Trend</div><div class="cc-val">${cost.trend.length}pt</div></div>`;
    CSCharts.sparkline(els.costSparkline, cost.trend);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /* Live-feeling lists: events + squawks                                */
  /* ------------------------------------------------------------------ */
  function appendEvent(ev) {
    const li = document.createElement("li");
    li.dataset.severity = ev.severity;
    li.innerHTML = `<time>${fmtOffset(ev.t)}</time><span class="ev-symbol">${escapeHtml(ev.symbol)}</span><span class="ev-text">${escapeHtml(ev.text)}</span>`;
    els.eventList.appendChild(li);
    // Cap visible history so the list doesn't grow unbounded across loops.
    while (els.eventList.children.length > 40) els.eventList.removeChild(els.eventList.firstChild);
  }

  function appendSquawk(sq, scenario) {
    const btn = document.createElement("li");
    btn.className = "squawk-item";
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.dataset.suppressed = String(!!sq.suppressed);
    const badge = sq.suppressed
      ? `<span class="squawk-item__badge">SUPPRESSED</span>`
      : `<span class="squawk-item__badge">PUBLISHED</span>`;
    btn.innerHTML = `
      <div class="squawk-item__top">
        <span class="squawk-item__symbol">${escapeHtml(sq.symbol)} ${badge}</span>
        <span class="squawk-item__conf">conf ${sq.confidence.toFixed(2)}</span>
      </div>
      <div class="squawk-item__text">${escapeHtml(sq.text)}</div>
      <div class="squawk-item__meta">${sq.latencyMs}ms · ${fmtUsd(sq.costUsd)}${sq.suppressed ? " · " + escapeHtml(sq.suppressReason) : ""}</div>`;
    const open = () => openTraceModal(sq, scenario);
    btn.addEventListener("click", open);
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    els.squawkList.appendChild(btn);
    els.squawkList.scrollTop = els.squawkList.scrollHeight;
    while (els.squawkList.children.length > 30) els.squawkList.removeChild(els.squawkList.firstChild);
  }

  function updateSquawkCount(scenario) {
    const published = scenario.squawks.filter((s) => !s.suppressed).length;
    const suppressed = scenario.squawks.filter((s) => s.suppressed).length;
    els.squawkCount.textContent = suppressed
      ? `${published} published · ${suppressed} suppressed`
      : `${published} published`;
  }

  /* ------------------------------------------------------------------ */
  /* Trace modal                                                         */
  /* ------------------------------------------------------------------ */
  function openTraceModal(sq, scenario) {
    const stageDefs = CSData.pipelineStages();
    const stageMap = {};
    stageDefs.forEach((s) => (stageMap[s.id] = s));

    els.traceModalTitle.textContent = sq.suppressed ? "Squawk Trace — Suppressed" : "Squawk Trace — Published";
    els.traceModalSymbol.textContent = `${sq.symbol} · ${scenario.label}`;
    els.traceModalText.textContent = sq.text;
    els.traceModalMeta.innerHTML = `
      <span>Confidence <b>${sq.confidence.toFixed(2)}</b></span>
      <span>Latency <b>${sq.latencyMs}ms</b></span>
      <span>Cost <b>${fmtUsd(sq.costUsd)}</b></span>
      ${sq.suppressed ? `<span>Reason <b>${escapeHtml(sq.suppressReason)}</b></span>` : ""}`;

    els.traceSteps.innerHTML = sq.trace.map((step) => {
      const def = stageMap[step.stage] || { label: step.stage, detail: "" };
      return `<li data-blocked="${!!step.blocked}">
        <span></span>
        <span class="ts-label">${escapeHtml(def.label)}<div class="ts-detail">${escapeHtml(step.blocked ? "Blocked — " + (sq.suppressReason || "guardrail policy") : def.detail)}</div></span>
        <span class="ts-ms">${step.ms}ms</span>
      </li>`;
    }).join("");

    els.traceModalBackdrop.hidden = false;
    els.traceModalClose.focus();

    const traceStageIds = sq.trace.map((s) => s.stage);
    const blockedStage = (sq.trace.find((s) => s.blocked) || {}).stage;
    CSPipeline.animateTrace(traceStageIds, blockedStage);
  }

  function closeTraceModal() {
    els.traceModalBackdrop.hidden = true;
  }
  els.traceModalClose.addEventListener("click", closeTraceModal);
  els.traceModalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.traceModalBackdrop) closeTraceModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !els.traceModalBackdrop.hidden) closeTraceModal();
  });

  /* ------------------------------------------------------------------ */
  /* Scenario playback                                                   */
  /* ------------------------------------------------------------------ */
  function playScenario(id) {
    const scenario = CSData.getScenario(id);
    if (!scenario) return;
    currentScenarioId = id;

    clearPlayTimers();
    els.eventList.innerHTML = "";
    els.squawkList.innerHTML = "";
    CSPipeline.reset();

    document.body.dataset.accent = scenario.accent;
    els.scenarioChipEvents.textContent = scenario.label;
    els.scenarioChipFunnel.textContent = scenario.label;
    els.scenarioSelect.value = id;

    renderSystemHealth(scenario.systemHealth);
    renderShadowHealth(scenario.shadowHealth);
    renderFunnel(scenario.funnel);
    renderObservability(scenario.observability);
    renderLatency(scenario.observability);
    renderCost(scenario.cost);
    updateSquawkCount(scenario);

    const delayScale = reduced() ? 0.6 : 1; // slightly tighter timing under reduced motion, still deterministic
    scenario.events.forEach((ev) => {
      playTimers.push(setTimeout(() => appendEvent(ev), ev.t * delayScale));
    });
    scenario.squawks.forEach((sq) => {
      playTimers.push(setTimeout(() => appendSquawk(sq, scenario), sq.t * delayScale));
    });
  }

  function playScenarioManualLoop(id) {
    stopShowcase();
    clearManualLoop();
    const scenario = CSData.getScenario(id);
    if (!scenario) return;
    const loop = () => {
      playScenario(id);
      manualLoopTimer = setTimeout(loop, scenario.durationMs);
    };
    loop();
  }

  /* ------------------------------------------------------------------ */
  /* Showcase Mode: deterministic 45-60s loop across all scenarios       */
  /* ------------------------------------------------------------------ */
  function startShowcase() {
    clearManualLoop();
    clearShowcaseTimers();
    showcase.active = true;
    showcase.order = CSData.showcaseOrder();
    let offset = 0;
    showcase.cumulative = showcase.order.map((id) => {
      const start = offset;
      offset += CSData.getScenario(id).durationMs;
      return start;
    });
    showcase.total = offset;

    showcase.order.forEach((id, i) => {
      showcase.timers.push(setTimeout(() => playScenario(id), showcase.cumulative[i]));
    });
    showcase.restartTimer = setTimeout(() => {
      if (showcase.active) startShowcase();
    }, showcase.total);

    showcase.loopStart = performance.now();
    els.showcaseBar.classList.add("active");
    els.showcaseToggle.setAttribute("aria-pressed", "true");
    els.showcaseToggle.textContent = "■ Stop Showcase";
    els.scenarioSelect.disabled = true;
    tickShowcaseProgress();
  }

  function tickShowcaseProgress() {
    if (!showcase.active) return;
    const elapsed = (performance.now() - showcase.loopStart) % Math.max(1, showcase.total);
    const pct = (elapsed / showcase.total) * 100;
    els.showcaseBarFill.style.width = pct.toFixed(2) + "%";
    const totalSec = (showcase.total / 1000).toFixed(0);
    const elapsedSec = (elapsed / 1000).toFixed(0);
    const scenario = CSData.getScenario(currentScenarioId);
    els.showcaseBarLabel.textContent = `${scenario ? scenario.label : ""} — ${elapsedSec}s / ${totalSec}s loop`;
    showcase.rafId = requestAnimationFrame(tickShowcaseProgress);
  }

  function stopShowcase() {
    if (!showcase.active) return;
    showcase.active = false;
    clearShowcaseTimers();
    els.showcaseBar.classList.remove("active");
    els.showcaseToggle.setAttribute("aria-pressed", "false");
    els.showcaseToggle.textContent = "▶ Showcase Mode";
    els.scenarioSelect.disabled = false;
  }

  els.showcaseToggle.addEventListener("click", () => {
    if (showcase.active) {
      stopShowcase();
      playScenarioManualLoop(els.scenarioSelect.value);
    } else {
      startShowcase();
    }
  });

  els.scenarioSelect.addEventListener("change", (e) => {
    playScenarioManualLoop(e.target.value);
  });

  /* ------------------------------------------------------------------ */
  /* Clock                                                               */
  /* ------------------------------------------------------------------ */
  function tickClock() {
    els.clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  CSData.load().then(() => {
    CSPipeline.render(CSData.pipelineStages(), els.pipelineSvg);
    playScenarioManualLoop("normal");
  }).catch((err) => {
    els.eventList.innerHTML = `<li style="color:#ff5d6c">Failed to load demo data: ${escapeHtml(err.message)}</li>`;
    console.error(err);
  });
})();
