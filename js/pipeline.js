/**
 * pipeline.js — Renders the CryptoSquawk processing-pipeline SVG diagram and
 * exposes helpers to animate a "pulse" traveling through the stages a given
 * squawk's trace actually visited (including guardrail-blocked traces).
 *
 * Pure vanilla DOM/SVG manipulation, no charting libraries.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const BOX_W = 118;
  const BOX_H = 80;
  const GAP = 14;
  const TOP = 34;
  const MAX_CHARS_PER_LINE = 20;

  let stageOrder = [];
  let resetTimer = null;

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /** Greedy word-wrap into at most `maxLines` lines, each roughly
   *  `maxChars` characters wide. Kept deliberately simple (no canvas
   *  text-measurement) since the label set is small and fixed. */
  function wrapText(text, maxChars, maxLines) {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? current + " " + word : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
      return kept;
    }
    return lines;
  }

  function render(stages, svgEl) {
    stageOrder = stages.map((s) => s.id);
    svgEl.innerHTML = "";

    // Arrowhead marker definition.
    const defs = el("defs", {});
    const marker = el("marker", {
      id: "arrowhead", markerWidth: "8", markerHeight: "8",
      refX: "6", refY: "4", orient: "auto"
    });
    const arrowPath = el("path", { d: "M0,0 L8,4 L0,8 Z", fill: "#223145" });
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    svgEl.appendChild(defs);

    stages.forEach((stage, i) => {
      const x = 10 + i * (BOX_W + GAP);
      const y = TOP;

      if (i > 0) {
        const prevX = 10 + (i - 1) * (BOX_W + GAP) + BOX_W;
        const line = el("line", {
          x1: prevX, y1: y + BOX_H / 2,
          x2: x, y2: y + BOX_H / 2,
          class: "stage-arrow",
          "data-from": stages[i - 1].id,
          "data-to": stage.id
        });
        svgEl.appendChild(line);
      }

      const g = el("g", { class: "stage-group", "data-stage": stage.id });

      const rect = el("rect", {
        x, y, width: BOX_W, height: BOX_H, rx: 8, ry: 8,
        class: "stage-box",
        id: "stage-box-" + stage.id
      });
      g.appendChild(rect);

      const label = el("text", {
        x: x + BOX_W / 2, y: y + 22, "text-anchor": "middle", class: "stage-label"
      });
      label.textContent = stage.label;
      g.appendChild(label);

      const detail = el("text", {
        x: x + BOX_W / 2, y: y + 38, "text-anchor": "middle", class: "stage-detail"
      });
      const lines = wrapText(stage.detail, MAX_CHARS_PER_LINE, 3);
      lines.forEach((line, li) => {
        const tspan = el("tspan", { x: x + BOX_W / 2, dy: li === 0 ? "0" : "11" });
        tspan.textContent = line;
        detail.appendChild(tspan);
      });
      g.appendChild(detail);

      const pulse = el("circle", {
        cx: x + BOX_W / 2, cy: y - 10, r: 4, class: "pipeline-pulse",
        id: "pulse-" + stage.id
      });
      g.appendChild(pulse);

      svgEl.appendChild(g);
    });
  }

  /**
   * Animate (or instantly show, under reduced motion) the path a squawk's
   * trace took through the pipeline. `traceStages` is an ordered array of
   * stage ids; `blockedStageId` (optional) marks the stage where a guardrail
   * stopped the squawk from proceeding further.
   */
  function animateTrace(traceStages, blockedStageId) {
    reset();
    const reduced = prefersReducedMotion();
    const stepDelay = reduced ? 0 : 180;

    traceStages.forEach((stageId, i) => {
      const show = () => {
        const box = document.getElementById("stage-box-" + stageId);
        const pulse = document.getElementById("pulse-" + stageId);
        const isBlocked = blockedStageId && stageId === blockedStageId;
        if (box) box.classList.add(isBlocked ? "blocked" : "active");
        if (pulse) pulse.classList.add("show");
        // Highlight the arrow leading into this stage.
        if (i > 0) {
          const prev = traceStages[i - 1];
          const arrow = document.querySelector(
            '.stage-arrow[data-from="' + prev + '"][data-to="' + stageId + '"]'
          );
          if (arrow) arrow.classList.add("active");
        }
      };
      if (reduced) show();
      else setTimeout(show, i * stepDelay);
    });

    const holdMs = reduced ? 1400 : traceStages.length * stepDelay + 1600;
    resetTimer = setTimeout(reset, holdMs);
  }

  function reset() {
    if (resetTimer) clearTimeout(resetTimer);
    document.querySelectorAll(".stage-box").forEach((n) => n.classList.remove("active", "blocked"));
    document.querySelectorAll(".pipeline-pulse").forEach((n) => n.classList.remove("show"));
    document.querySelectorAll(".stage-arrow").forEach((n) => n.classList.remove("active"));
  }

  window.CSPipeline = { render, animateTrace, reset };
})();
