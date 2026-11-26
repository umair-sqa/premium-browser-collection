/**
 * chrome.storage.local helper with defaults for DevSpace — Aurevia Studio.
 * All data stays on-device. No network writes. No credentials collected.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "devspaceSettings";

  const CURATED_GITHUB = Object.freeze([
    { label: "GitHub", url: "https://github.com" },
    { label: "Notifications", url: "https://github.com/notifications" },
    { label: "Pull requests", url: "https://github.com/pulls" },
    { label: "Issues", url: "https://github.com/issues" },
  ]);

  const CURATED_DEVTOOLS = Object.freeze([
    { label: "MDN", url: "https://developer.mozilla.org" },
    { label: "Stack Overflow", url: "https://stackoverflow.com" },
    { label: "caniuse", url: "https://caniuse.com" },
    { label: "npm", url: "https://www.npmjs.com" },
    { label: "Node.js docs", url: "https://nodejs.org/docs/latest/api/" },
    { label: "Chrome DevTools", url: "https://developer.chrome.com/docs/devtools/" },
    { label: "web.dev", url: "https://web.dev" },
    { label: "CSS Tricks", url: "https://css-tricks.com" },
  ]);

  const DEFAULT_WIDGETS = Object.freeze({
    clock: true,
    search: true,
    github: true,
    bookmarks: true,
    snippets: true,
    notes: true,
    workspace: true,
    devtools: true,
    customLinks: true,
  });

  const DEFAULTS = Object.freeze({
    searchEngine: "google",
    githubUsername: "",
    bookmarks: [],
    snippets: [],
    notes: "",
    workspace: [
      { id: "ws-default-1", label: "localhost:3000", url: "http://localhost:3000" },
      { id: "ws-default-2", label: "localhost:5173", url: "http://localhost:5173" },
    ],
    customLinks: [],
    widgets: { ...DEFAULT_WIDGETS },
  });

  function deepMergeWidgets(saved) {
    return { ...DEFAULT_WIDGETS, ...(saved || {}) };
  }

  async function getSettings() {
    return new Promise((resolve, reject) => {
      try {
        if (!global.chrome || !chrome.storage || !chrome.storage.local) {
          resolve({
            ...DEFAULTS,
            widgets: { ...DEFAULT_WIDGETS },
            bookmarks: [],
            snippets: [],
            workspace: DEFAULTS.workspace.map((w) => ({ ...w })),
            customLinks: [],
            _offline: true,
          });
          return;
        }
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          const raw = result[STORAGE_KEY] || {};
          resolve({
            ...DEFAULTS,
            ...raw,
            widgets: deepMergeWidgets(raw.widgets),
            bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : [],
            snippets: Array.isArray(raw.snippets) ? raw.snippets : [],
            workspace: Array.isArray(raw.workspace)
              ? raw.workspace
              : DEFAULTS.workspace.map((w) => ({ ...w })),
            customLinks: Array.isArray(raw.customLinks) ? raw.customLinks : [],
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const { _offline, ...clean } = current;
    const next = {
      ...clean,
      ...partial,
      widgets: deepMergeWidgets({
        ...clean.widgets,
        ...(partial.widgets || {}),
      }),
    };
    return new Promise((resolve, reject) => {
      try {
        if (!global.chrome || !chrome.storage || !chrome.storage.local) {
          resolve(next);
          return;
        }
        chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(next);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function buildGithubProfileUrls(username) {
    const u = String(username || "")
      .trim()
      .replace(/^@/, "")
      .replace(/[^a-zA-Z0-9-]/g, "");
    if (!u) return [];
    return [
      { label: `@${u}`, url: `https://github.com/${u}` },
      { label: "Repos", url: `https://github.com/${u}?tab=repositories` },
    ];
  }

  function searchUrl(engine, query) {
    const q = encodeURIComponent(String(query || "").trim());
    if (engine === "duckduckgo") {
      return `https://duckduckgo.com/?q=${q}`;
    }
    return `https://www.google.com/search?q=${q}`;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  global.DevSpaceStorage = {
    STORAGE_KEY,
    DEFAULTS,
    DEFAULT_WIDGETS,
    CURATED_GITHUB,
    CURATED_DEVTOOLS,
    getSettings,
    saveSettings,
    buildGithubProfileUrls,
    searchUrl,
    uid,
  };
})(typeof self !== "undefined" ? self : globalThis);
