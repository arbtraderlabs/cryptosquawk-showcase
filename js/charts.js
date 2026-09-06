/**
 * charts.js — Tiny dependency-free SVG chart helpers (sparkline only).
 * Kept intentionally minimal: this showcase does not pull in any charting
 * library, everything is hand-drawn SVG paths driven by scenario data.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  /**
   * Draws a simple sparkline into `svgEl` (a <svg viewBox="0 0 W H">) from
   * an array of numeric values. Adds a trailing dot to mark the latest point.
   */
  function sparkline(svgEl, values, opts) {
    opts = opts || {};
    svgEl.innerHTML = "";
    if (!values || values.length < 2) return;

    const vb = svgEl.viewBox.baseVal;
    const W = vb.width || 200;
    const H = vb.height || 50;
    const pad = 4;
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = max - min || 1;

    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return [x, y];
    });

    const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const path = el("path", { d });
    svgEl.appendChild(path);

    const last = pts[pts.length - 1];
    const dot = el("circle", { cx: last[0], cy: last[1], r: 3 });
    svgEl.appendChild(dot);
  }

  window.CSCharts = { sparkline };
})();
