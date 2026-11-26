(function () {
  "use strict";

  const S = globalThis.DevSpaceStorage;
  if (!S) {
    showFatal("Storage module failed to load.");
    return;
  }

  const WIDGET_LABELS = {
    clock: "Clock & date",
    search: "Search",
    github: "GitHub shortcuts",
    bookmarks: "Bookmarks",
    snippets: "Snippets",
    notes: "Notes",
    workspace: "Workspace",
    devtools: "Dev tools",
    customLinks: "Custom links",
  };

  /** @type {ReturnType<typeof S.getSettings> extends Promise<infer T> ? T : never} */
  let settings = null;
  let notesTimer = null;
  let toastTimer = null;
  let clockTimer = null;
  let lastFocusBeforeSettings = null;

  const els = {
    boot: document.getElementById("boot"),
    fatal: document.getElementById("fatal"),
    fatalMsg: document.getElementById("fatal-msg"),
    fatalRetry: document.getElementById("fatal-retry"),
    app: document.getElementById("app"),
    clockTime: document.getElementById("clock-time"),
    clockDate: document.getElementById("clock-date"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchEngineLabel: document.getElementById("search-engine-label"),
    githubLinks: document.getElementById("github-links"),
    githubProfile: document.getElementById("github-profile"),
    devtoolsLinks: document.getElementById("devtools-links"),
    workspaceList: document.getElementById("workspace-list"),
    workspaceForm: document.getElementById("workspace-form"),
    workspaceLabel: document.getElementById("workspace-label"),
    workspaceUrl: document.getElementById("workspace-url"),
    bookmarksList: document.getElementById("bookmarks-list"),
    bookmarksForm: document.getElementById("bookmarks-form"),
    bookmarkName: document.getElementById("bookmark-name"),
    bookmarkUrl: document.getElementById("bookmark-url"),
    customList: document.getElementById("custom-list"),
    customForm: document.getElementById("custom-form"),
    customName: document.getElementById("custom-name"),
    customUrl: document.getElementById("custom-url"),
    notesBody: document.getElementById("notes-body"),
    notesStatus: document.getElementById("notes-status"),
    snippetsList: document.getElementById("snippets-list"),
    snippetNew: document.getElementById("snippet-new"),
    snippetForm: document.getElementById("snippet-form"),
    snippetId: document.getElementById("snippet-id"),
    snippetTitle: document.getElementById("snippet-title"),
    snippetLang: document.getElementById("snippet-lang"),
    snippetBody: document.getElementById("snippet-body"),
    snippetCancel: document.getElementById("snippet-cancel"),
    settingsOpen: document.getElementById("settings-open"),
    settingsClose: document.getElementById("settings-close"),
    settingsPanel: document.getElementById("settings-panel"),
    settingsBackdrop: document.getElementById("settings-backdrop"),
    settingsGithubUser: document.getElementById("settings-github-user"),
    widgetToggles: document.getElementById("widget-toggles"),
    toast: document.getElementById("toast"),
  };

  function showFatal(message) {
    const boot = document.getElementById("boot");
    const fatal = document.getElementById("fatal");
    const fatalMsg = document.getElementById("fatal-msg");
    const app = document.getElementById("app");
    if (boot) boot.hidden = true;
    if (app) app.hidden = true;
    if (fatal) fatal.hidden = false;
    if (fatalMsg) fatalMsg.textContent = message || "Unknown error";
  }

  function normalizeUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value) || /^localhost(:\d+)?(\/|$)/i.test(value)) {
      if (/^localhost/i.test(value)) return `http://${value}`;
      return value;
    }
    if (/^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(value) || /^localhost/i.test(value)) {
      return `https://${value}`;
    }
    return value;
  }

  function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 1800);
  }

  function tickClock() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const date = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    els.clockTime.textContent = time;
    els.clockTime.setAttribute("datetime", now.toISOString());
    els.clockDate.textContent = date;
  }

  function applyWidgetVisibility() {
    const widgets = settings.widgets || S.DEFAULT_WIDGETS;
    Object.keys(S.DEFAULT_WIDGETS).forEach((key) => {
      const node = document.querySelector(`[data-widget="${key}"]`);
      if (node) node.hidden = widgets[key] === false;
    });
  }

  function renderLinkChips(container, items) {
    container.innerHTML = "";
    items.forEach((item) => {
      const a = document.createElement("a");
      a.className = "chip";
      a.href = item.url;
      a.textContent = item.label;
      a.rel = "noopener noreferrer";
      container.appendChild(a);
    });
  }

  function renderManagedList(container, items, onRemove) {
    container.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nothing here yet.";
      container.appendChild(empty);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "link-row";
      const a = document.createElement("a");
      a.href = item.url;
      a.textContent = item.label || item.name;
      a.title = item.url;
      a.rel = "noopener noreferrer";
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn-icon";
      del.setAttribute("aria-label", `Remove ${item.label || item.name}`);
      del.textContent = "×";
      del.addEventListener("click", () => onRemove(item.id));
      li.appendChild(a);
      li.appendChild(del);
      container.appendChild(li);
    });
  }

  function renderGithub() {
    els.githubLinks.innerHTML = "";
    S.CURATED_GITHUB.forEach((item) => {
      const li = document.createElement("li");
      li.className = "link-row";
      const a = document.createElement("a");
      a.href = item.url;
      a.textContent = item.label;
      a.rel = "noopener noreferrer";
      li.appendChild(a);
      els.githubLinks.appendChild(li);
    });

    const profileLinks = S.buildGithubProfileUrls(settings.githubUsername);
    if (profileLinks.length) {
      els.githubProfile.hidden = false;
      els.githubProfile.innerHTML = "";
      profileLinks.forEach((item) => {
        const a = document.createElement("a");
        a.className = "chip";
        a.href = item.url;
        a.textContent = item.label;
        a.rel = "noopener noreferrer";
        els.githubProfile.appendChild(a);
      });
    } else {
      els.githubProfile.hidden = true;
      els.githubProfile.innerHTML = "";
    }
  }

  function renderSnippets() {
    els.snippetsList.innerHTML = "";
    const snippets = settings.snippets || [];
    if (!snippets.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No snippets yet. Save reusable code locally.";
      els.snippetsList.appendChild(empty);
      return;
    }

    snippets.forEach((snip) => {
      const li = document.createElement("li");
      li.className = "snippet";

      const bar = document.createElement("div");
      bar.className = "snippet__bar";

      const title = document.createElement("h3");
      title.className = "snippet__title";
      title.textContent = snip.title;

      bar.appendChild(title);

      if (snip.language) {
        const lang = document.createElement("span");
        lang.className = "snippet__lang";
        lang.textContent = snip.language;
        bar.appendChild(lang);
      }

      const actions = document.createElement("div");
      actions.className = "snippet__actions";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn--ghost";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(snip.body || "");
          showToast("Copied to clipboard");
        } catch {
          showToast("Copy failed");
        }
      });

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn--ghost";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => openSnippetForm(snip));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn btn--ghost";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", async () => {
        settings.snippets = (settings.snippets || []).filter((s) => s.id !== snip.id);
        await persist({ snippets: settings.snippets });
        renderSnippets();
        showToast("Snippet deleted");
      });

      actions.append(copyBtn, editBtn, delBtn);
      bar.appendChild(actions);

      const pre = document.createElement("pre");
      pre.className = "snippet__code";
      pre.textContent = snip.body || "";

      li.append(bar, pre);
      els.snippetsList.appendChild(li);
    });
  }

  function openSnippetForm(snip) {
    els.snippetForm.hidden = false;
    els.snippetId.value = snip ? snip.id : "";
    els.snippetTitle.value = snip ? snip.title : "";
    els.snippetLang.value = snip ? snip.language || "" : "";
    els.snippetBody.value = snip ? snip.body || "" : "";
    els.snippetTitle.focus();
  }

  function closeSnippetForm() {
    els.snippetForm.hidden = true;
    els.snippetForm.reset();
    els.snippetId.value = "";
  }

  function refreshManaged() {
    renderGithub();
    renderLinkChips(els.devtoolsLinks, S.CURATED_DEVTOOLS);
    renderManagedList(els.workspaceList, settings.workspace || [], removeWorkspace);
    renderManagedList(els.bookmarksList, settings.bookmarks || [], removeBookmark);
    renderManagedList(els.customList, settings.customLinks || [], removeCustom);
    renderSnippets();
  }

  async function removeWorkspace(id) {
    settings.workspace = (settings.workspace || []).filter((w) => w.id !== id);
    await persist({ workspace: settings.workspace });
    refreshManaged();
  }

  async function removeBookmark(id) {
    settings.bookmarks = (settings.bookmarks || []).filter((b) => b.id !== id);
    await persist({ bookmarks: settings.bookmarks });
    refreshManaged();
  }

  async function removeCustom(id) {
    settings.customLinks = (settings.customLinks || []).filter((c) => c.id !== id);
    await persist({ customLinks: settings.customLinks });
    refreshManaged();
  }

  async function persist(partial) {
    try {
      settings = await S.saveSettings(partial);
      return settings;
    } catch (err) {
      showToast("Save failed");
      throw err;
    }
  }

  function syncSearchLabel() {
    const engine = settings.searchEngine === "duckduckgo" ? "DuckDuckGo" : "Google";
    els.searchEngineLabel.textContent = engine;
    els.searchInput.placeholder = `Search ${engine}…`;
  }

  function buildSettingsUi() {
    const engine = settings.searchEngine === "duckduckgo" ? "duckduckgo" : "google";
    document.querySelectorAll('input[name="searchEngine"]').forEach((input) => {
      input.checked = input.value === engine;
    });
    els.settingsGithubUser.value = settings.githubUsername || "";

    els.widgetToggles.innerHTML = "";
    Object.keys(S.DEFAULT_WIDGETS).forEach((key) => {
      const label = document.createElement("label");
      label.className = "toggle";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.widgetKey = key;
      input.checked = settings.widgets[key] !== false;
      const span = document.createElement("span");
      span.textContent = WIDGET_LABELS[key] || key;
      label.append(input, span);
      els.widgetToggles.appendChild(label);
    });
  }

  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
  }

  function openSettings() {
    lastFocusBeforeSettings = document.activeElement;
    els.settingsPanel.hidden = false;
    els.settingsBackdrop.hidden = false;
    els.settingsOpen.setAttribute("aria-expanded", "true");
    buildSettingsUi();
    const focusables = getFocusable(els.settingsPanel);
    (focusables[0] || els.settingsClose).focus();
  }

  function closeSettings() {
    if (els.settingsPanel.hidden) return;
    els.settingsPanel.hidden = true;
    els.settingsBackdrop.hidden = true;
    els.settingsOpen.setAttribute("aria-expanded", "false");
    if (lastFocusBeforeSettings && typeof lastFocusBeforeSettings.focus === "function") {
      lastFocusBeforeSettings.focus();
    } else {
      els.settingsOpen.focus();
    }
  }

  function wireEvents() {
    els.fatalRetry.addEventListener("click", () => {
      location.reload();
    });

    els.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = els.searchInput.value.trim();
      if (!q) {
        els.searchInput.focus();
        return;
      }
      location.href = S.searchUrl(settings.searchEngine, q);
    });

    els.workspaceForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const label = els.workspaceLabel.value.trim();
      const url = normalizeUrl(els.workspaceUrl.value);
      if (!label || !url) return;
      settings.workspace = [
        ...(settings.workspace || []),
        { id: S.uid("ws"), label, url },
      ];
      await persist({ workspace: settings.workspace });
      els.workspaceForm.reset();
      refreshManaged();
    });

    els.bookmarksForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = els.bookmarkName.value.trim();
      const url = normalizeUrl(els.bookmarkUrl.value);
      if (!name || !url) return;
      settings.bookmarks = [
        ...(settings.bookmarks || []),
        { id: S.uid("bm"), name, label: name, url },
      ];
      await persist({ bookmarks: settings.bookmarks });
      els.bookmarksForm.reset();
      refreshManaged();
    });

    els.customForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = els.customName.value.trim();
      const url = normalizeUrl(els.customUrl.value);
      if (!name || !url) return;
      settings.customLinks = [
        ...(settings.customLinks || []),
        { id: S.uid("cl"), name, label: name, url },
      ];
      await persist({ customLinks: settings.customLinks });
      els.customForm.reset();
      refreshManaged();
    });

    els.notesBody.addEventListener("input", () => {
      els.notesStatus.textContent = "Saving…";
      els.notesStatus.classList.remove("is-saved");
      clearTimeout(notesTimer);
      notesTimer = setTimeout(async () => {
        try {
          await persist({ notes: els.notesBody.value });
          els.notesStatus.textContent = "Saved";
          els.notesStatus.classList.add("is-saved");
        } catch {
          els.notesStatus.textContent = "Error saving";
          els.notesStatus.classList.remove("is-saved");
        }
      }, 400);
    });

    els.snippetNew.addEventListener("click", () => openSnippetForm(null));
    els.snippetCancel.addEventListener("click", closeSnippetForm);

    els.snippetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = els.snippetId.value || S.uid("snip");
      const next = {
        id,
        title: els.snippetTitle.value.trim(),
        language: els.snippetLang.value.trim(),
        body: els.snippetBody.value,
      };
      if (!next.title || !next.body) return;
      const list = [...(settings.snippets || [])];
      const idx = list.findIndex((s) => s.id === id);
      if (idx >= 0) list[idx] = next;
      else list.unshift(next);
      settings.snippets = list;
      await persist({ snippets: list });
      closeSnippetForm();
      renderSnippets();
      showToast("Snippet saved");
    });

    els.settingsOpen.addEventListener("click", openSettings);
    document.querySelectorAll("[data-close-settings]").forEach((node) => {
      node.addEventListener("click", closeSettings);
    });

    document.querySelectorAll('input[name="searchEngine"]').forEach((input) => {
      input.addEventListener("change", async () => {
        if (!input.checked) return;
        await persist({ searchEngine: input.value });
        syncSearchLabel();
      });
    });

    els.settingsGithubUser.addEventListener("change", async () => {
      const githubUsername = els.settingsGithubUser.value.trim().replace(/^@/, "");
      await persist({ githubUsername });
      renderGithub();
    });

    els.widgetToggles.addEventListener("change", async (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement) || !target.dataset.widgetKey) return;
      const key = target.dataset.widgetKey;
      const widgets = { ...settings.widgets, [key]: target.checked };
      await persist({ widgets });
      applyWidgetVisibility();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!els.settingsPanel.hidden) {
          e.preventDefault();
          closeSettings();
          return;
        }
        if (!els.snippetForm.hidden) {
          e.preventDefault();
          closeSnippetForm();
        }
      }

      if (e.key === "Tab" && !els.settingsPanel.hidden) {
        const focusables = getFocusable(els.settingsPanel);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  async function init() {
    try {
      settings = await S.getSettings();
      els.boot.hidden = true;
      els.fatal.hidden = true;
      els.app.hidden = false;

      tickClock();
      clearInterval(clockTimer);
      clockTimer = setInterval(tickClock, 1000);

      els.notesBody.value = settings.notes || "";
      syncSearchLabel();
      applyWidgetVisibility();
      refreshManaged();
      buildSettingsUi();
      wireEvents();
    } catch (err) {
      showFatal(err && err.message ? err.message : "Failed to read local storage.");
    }
  }

  init();
})();
