/**
 * data.js — Loads the local synthetic scenarios.json and exposes a small,
 * dependency-free accessor object on `window.CSData`.
 *
 * This is a public showcase: everything here is fabricated demo data.
 * There is no network call other than fetching this repo's own local file,
 * no API keys, and no backend.
 */
(function () {
  "use strict";

  const CSData = {
    /** @type {object|null} raw parsed JSON */
    raw: null,
    ready: null,

    load() {
      if (this.ready) return this.ready;
      this.ready = fetch("data/scenarios.json", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load scenarios.json: " + res.status);
          return res.json();
        })
        .then((json) => {
          this.raw = json;
          return json;
        });
      return this.ready;
    },

    getScenario(id) {
      return this.raw && this.raw.scenarios[id];
    },

    listScenarioIds() {
      return this.raw ? Object.keys(this.raw.scenarios) : [];
    },

    showcaseOrder() {
      return (this.raw && this.raw.showcase && this.raw.showcase.order) || this.listScenarioIds();
    },

    showcaseLoopMs() {
      return (this.raw && this.raw.showcase && this.raw.showcase.loopMs) || 54000;
    },

    pipelineStages() {
      return (this.raw && this.raw.pipelineStages) || [];
    }
  };

  window.CSData = CSData;
})();
