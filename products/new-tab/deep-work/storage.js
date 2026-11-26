/**
 * chrome.storage.local helper with defaults for Deep Work — Aurevia Studio.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "deepWorkData";

  const SEARCH_ENGINES = Object.freeze({
    google: { label: "Google", url: "https://www.google.com/search?q=" },
    duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
    bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
    ecosia: { label: "Ecosia", url: "https://www.ecosia.org/search?q=" },
  });

  const GRADIENT_PRESETS = Object.freeze([
    {
      id: "misty-sage",
      label: "Misty Sage",
      css: "linear-gradient(145deg, #2C3530 0%, #4A5C52 45%, #8FA88A 100%)",
    },
    {
      id: "ivory-dusk",
      label: "Ivory Dusk",
      css: "linear-gradient(160deg, #1A221E 0%, #3D4A42 40%, #C4BEB2 100%)",
    },
    {
      id: "forest-calm",
      label: "Forest Calm",
      css: "linear-gradient(135deg, #1E2A24 0%, #5A6E5E 50%, #A8B8A0 100%)",
    },
  ]);

  const DEFAULTS = Object.freeze({
    searchEngine: "google",
    customSearchUrl: "",
    backgroundMode: "default",
    backgroundUrl: "",
    gradientPreset: "misty-sage",
    focusMinutes: 25,
    breakMinutes: 5,
    widgets: {
      clock: true,
      search: true,
      todos: true,
      timer: true,
      goals: true,
      shortcuts: true,
      progress: true,
      quote: true,
    },
    todos: [],
    goals: [],
    shortcuts: [
      { id: "s1", name: "Docs", url: "https://docs.google.com" },
      { id: "s2", name: "Calendar", url: "https://calendar.google.com" },
      { id: "s3", name: "Notion", url: "https://www.notion.so" },
    ],
    completedTodoDates: {},
    timer: {
      mode: "focus",
      running: false,
      remainingMs: 25 * 60 * 1000,
      totalMs: 25 * 60 * 1000,
      endsAt: null,
    },
  });

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function todayKey(date) {
    const d = date || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function structuredCloneFallback(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDefaults(stored) {
    const base = structuredCloneFallback(DEFAULTS);
    const next = { ...base, ...stored };
    next.widgets = { ...base.widgets, ...(stored.widgets || {}) };
    next.timer = { ...base.timer, ...(stored.timer || {}) };
    next.todos = Array.isArray(stored.todos) ? stored.todos : base.todos;
    next.goals = Array.isArray(stored.goals) ? stored.goals : base.goals;
    next.shortcuts = Array.isArray(stored.shortcuts)
      ? stored.shortcuts
      : base.shortcuts;
    next.completedTodoDates =
      stored.completedTodoDates && typeof stored.completedTodoDates === "object"
        ? stored.completedTodoDates
        : base.completedTodoDates;
    return next;
  }

  async function getAll() {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
          resolve(structuredCloneFallback(DEFAULTS));
          return;
        }
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(mergeDefaults(result[STORAGE_KEY] || {}));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function saveAll(data) {
    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
          resolve(data);
          return;
        }
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function update(partial) {
    const current = await getAll();
    const next = { ...current, ...partial };
    if (partial.widgets) {
      next.widgets = { ...current.widgets, ...partial.widgets };
    }
    if (partial.timer) {
      next.timer = { ...current.timer, ...partial.timer };
    }
    if (partial.completedTodoDates) {
      next.completedTodoDates = {
        ...current.completedTodoDates,
        ...partial.completedTodoDates,
      };
    }
    return saveAll(next);
  }

  global.DeepWorkStorage = {
    STORAGE_KEY,
    DEFAULTS,
    SEARCH_ENGINES,
    GRADIENT_PRESETS,
    uid,
    todayKey,
    getAll,
    saveAll,
    update,
    mergeDefaults,
  };
})(typeof self !== "undefined" ? self : globalThis);
