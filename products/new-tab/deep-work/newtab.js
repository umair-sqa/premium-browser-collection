/**
 * Deep Work — Aurevia Studio
 * New Tab interactive dashboard (Manifest V3).
 */
(function () {
  "use strict";

  const S = window.DeepWorkStorage;
  const CIRC = 2 * Math.PI * 52;

  const QUOTES = [
    { text: "Attention is the rarest and purest form of generosity.", author: "Simone Weil" },
    { text: "The shorter way to do many things is to do only one thing at a time.", author: "Mozart (attr.)" },
    { text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart" },
    { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { text: "It is not enough to be busy; so are the ants. The question is: what are we busy about?", author: "Henry David Thoreau" },
    { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
    { text: "Beware the barrenness of a busy life.", author: "Socrates (attr.)" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "One thing at a time, and that done well, is a very good rule, as many can tell.", author: "Traditional rhyme" },
    { text: "Quiet minds cannot be perplexed or frightened.", author: "Robert Louis Stevenson" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci (attr.)" },
    { text: "To pay attention, this is our endless and proper work.", author: "Mary Oliver" },
    { text: "Nothing is particularly hard if you divide it into small jobs.", author: "Henry Ford" },
    { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Laozi" },
    { text: "He who is everywhere is nowhere.", author: "Seneca" },
    { text: "Lose an hour in the morning, and you will spend all day looking for it.", author: "Richard Whately" },
    { text: "Order and simplification are the first steps toward the mastery of a subject.", author: "Thomas Mann" },
    { text: "Depth is the well from which lasting work is drawn.", author: "Aurevia Studio" },
    { text: "Guard your hours as you would a quiet garden.", author: "Aurevia Studio" },
    { text: "Focus is choosing what to leave unfinished.", author: "Aurevia Studio" },
    { text: "Stillness before the work makes the work cleaner.", author: "Aurevia Studio" },
    { text: "Small clear steps outpace restless motion.", author: "Aurevia Studio" },
    { text: "Return to the task as one returns to breath.", author: "Aurevia Studio" },
    { text: "Let the next hour hold only one true aim.", author: "Aurevia Studio" },
    { text: "Absence of distraction is a craft.", author: "Aurevia Studio" },
    { text: "Begin again, gently, without apology.", author: "Aurevia Studio" },
    { text: "The mind that stays becomes a tool.", author: "Aurevia Studio" },
    { text: "Finish the ordinary with uncommon care.", author: "Aurevia Studio" },
    { text: "Clarity grows where noise is refused.", author: "Aurevia Studio" },
    { text: "Work deep; leave shallow for later.", author: "Aurevia Studio" },
  ];

  let state = null;
  let timerInterval = null;
  let clockInterval = null;
  let lastFocusedBeforeSettings = null;

  const els = {
    loading: document.getElementById("loading"),
    bgImage: document.getElementById("bg-image"),
    bgGradient: document.getElementById("bg-gradient"),
    clockTime: document.getElementById("clock-time"),
    clockDate: document.getElementById("clock-date"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    searchError: document.getElementById("search-error"),
    quoteText: document.getElementById("quote-text"),
    quoteAuthor: document.getElementById("quote-author"),
    statTodos: document.getElementById("stat-todos"),
    statGoals: document.getElementById("stat-goals"),
    progressFill: document.getElementById("progress-fill"),
    timerDisplay: document.getElementById("timer-display"),
    timerMode: document.getElementById("timer-mode"),
    timerProgress: document.getElementById("timer-progress"),
    timerStart: document.getElementById("timer-start"),
    timerPause: document.getElementById("timer-pause"),
    timerReset: document.getElementById("timer-reset"),
    timerSwitch: document.getElementById("timer-switch"),
    todoForm: document.getElementById("todo-form"),
    todoInput: document.getElementById("todo-input"),
    todoList: document.getElementById("todo-list"),
    todoEmpty: document.getElementById("todo-empty"),
    goalForm: document.getElementById("goal-form"),
    goalInput: document.getElementById("goal-input"),
    goalList: document.getElementById("goal-list"),
    goalEmpty: document.getElementById("goal-empty"),
    shortcutGrid: document.getElementById("shortcut-grid"),
    shortcutForm: document.getElementById("shortcut-form"),
    shortcutName: document.getElementById("shortcut-name"),
    shortcutUrl: document.getElementById("shortcut-url"),
    shortcutError: document.getElementById("shortcut-error"),
    settingsOpen: document.getElementById("settings-open"),
    settingsClose: document.getElementById("settings-close"),
    settingsPanel: document.getElementById("settings-panel"),
    settingsBackdrop: document.getElementById("settings-backdrop"),
    settingsForm: document.getElementById("settings-form"),
    settingSearchEngine: document.getElementById("setting-search-engine"),
    settingCustomSearch: document.getElementById("setting-custom-search"),
    customSearchField: document.getElementById("custom-search-field"),
    settingFocusMin: document.getElementById("setting-focus-min"),
    settingBreakMin: document.getElementById("setting-break-min"),
    settingBgMode: document.getElementById("setting-bg-mode"),
    settingBgUrl: document.getElementById("setting-bg-url"),
    bgUrlField: document.getElementById("bg-url-field"),
    bgUrlError: document.getElementById("bg-url-error"),
    settingGradient: document.getElementById("setting-gradient"),
    bgGradientField: document.getElementById("bg-gradient-field"),
    toast: document.getElementById("toast"),
  };

  function pad(n) { return String(n).padStart(2, "0"); }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return pad(m) + ":" + pad(s);
  }

  function isValidHttpUrl(value) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  function normalizeUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return "https://" + trimmed;
  }

  function quoteForToday(date) {
    const key = S.todayKey(date);
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return QUOTES[hash % QUOTES.length];
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { els.toast.hidden = true; }, 2400);
  }

  function setError(el, message) {
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function updateClock() {
    const now = new Date();
    els.clockTime.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes());
    els.clockDate.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }

  function applyQuote() {
    const q = quoteForToday(new Date());
    els.quoteText.textContent = q.text;
    els.quoteAuthor.textContent = "— " + q.author;
  }

  function applyWidgetVisibility() {
    const widgets = state.widgets || {};
    document.querySelectorAll("[data-widget]").forEach(function (panel) {
      const key = panel.getAttribute("data-widget");
      const show = widgets[key] !== false;
      panel.hidden = !show;
      panel.classList.toggle("is-hidden", !show);
    });
  }

  function applyBackground() {
    const mode = state.backgroundMode || "default";
    const presets = S.GRADIENT_PRESETS;
    const preset = presets.find(function (p) { return p.id === state.gradientPreset; }) || presets[0];
    setError(els.bgUrlError, "");

    function showGradient() {
      els.bgImage.hidden = true;
      els.bgGradient.hidden = false;
      els.bgGradient.style.backgroundImage = preset.css;
    }

    function showImage(url) {
      els.bgGradient.hidden = true;
      els.bgImage.hidden = false;
      els.bgImage.style.backgroundImage = 'url("' + url.replace(/"/g, '\\"') + '")';
    }

    if (mode === "gradient") { showGradient(); return; }

    if (mode === "url") {
      const url = String(state.backgroundUrl || "").trim();
      if (!isValidHttpUrl(url)) {
        setError(els.bgUrlError, "Invalid image URL — using gradient fallback.");
        showGradient();
        return;
      }
      const probe = new Image();
      probe.onload = function () { showImage(url); };
      probe.onerror = function () {
        setError(els.bgUrlError, "Could not load image — using gradient fallback.");
        showGradient();
      };
      probe.src = url;
      return;
    }

    showImage("assets/background.jpg");
    const probe = new Image();
    probe.onerror = function () { showGradient(); };
    probe.src = "assets/background.jpg";
  }

  function syncTimerFromState() {
    const t = state.timer;
    let remaining = t.remainingMs;
    if (t.running && t.endsAt) {
      remaining = Math.max(0, t.endsAt - Date.now());
      state.timer.remainingMs = remaining;
      if (remaining <= 0) {
        state.timer.running = false;
        state.timer.endsAt = null;
        state.timer.remainingMs = 0;
        persistTimer();
        showToast(t.mode === "focus" ? "Focus session complete." : "Break complete.");
      }
    }

    const total = t.totalMs || 1;
    const ratio = Math.min(1, Math.max(0, remaining / total));
    els.timerDisplay.textContent = formatTime(remaining);
    els.timerMode.textContent = t.mode === "break" ? "Break" : "Focus";
    els.timerProgress.style.strokeDasharray = String(CIRC);
    els.timerProgress.style.strokeDashoffset = String(CIRC * (1 - ratio));
    els.timerStart.hidden = !!t.running;
    els.timerPause.hidden = !t.running;
    els.timerSwitch.textContent = t.mode === "focus" ? "Break" : "Focus";
  }

  async function persistTimer() {
    await S.update({ timer: state.timer });
  }

  function startTimerTick() {
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      if (!state || !state.timer.running) return;
      syncTimerFromState();
    }, 250);
  }

  function durationForMode(mode) {
    const minutes = mode === "break" ? state.breakMinutes || 5 : state.focusMinutes || 25;
    return Math.max(1, Number(minutes)) * 60 * 1000;
  }

  async function startTimer() {
    const t = state.timer;
    if (t.remainingMs <= 0) {
      t.remainingMs = durationForMode(t.mode);
      t.totalMs = t.remainingMs;
    }
    t.running = true;
    t.endsAt = Date.now() + t.remainingMs;
    await persistTimer();
    syncTimerFromState();
    startTimerTick();
  }

  async function pauseTimer() {
    const t = state.timer;
    if (t.running && t.endsAt) {
      t.remainingMs = Math.max(0, t.endsAt - Date.now());
    }
    t.running = false;
    t.endsAt = null;
    await persistTimer();
    syncTimerFromState();
  }

  async function resetTimer() {
    const t = state.timer;
    t.running = false;
    t.endsAt = null;
    t.totalMs = durationForMode(t.mode);
    t.remainingMs = t.totalMs;
    await persistTimer();
    syncTimerFromState();
  }

  async function switchTimerMode() {
    const nextMode = state.timer.mode === "focus" ? "break" : "focus";
    state.timer.mode = nextMode;
    state.timer.running = false;
    state.timer.endsAt = null;
    state.timer.totalMs = durationForMode(nextMode);
    state.timer.remainingMs = state.timer.totalMs;
    await persistTimer();
    syncTimerFromState();
  }

  function renderTodos() {
    const todos = state.todos || [];
    els.todoList.innerHTML = "";
    els.todoEmpty.hidden = todos.length > 0;
    todos.forEach(function (todo) {
      const li = document.createElement("li");
      li.className = "list-item" + (todo.done ? " is-done" : "");
      li.dataset.id = todo.id;

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "list-item__check";
      check.checked = !!todo.done;
      check.setAttribute("aria-label", "Mark complete: " + todo.text);
      check.addEventListener("change", function () { toggleTodo(todo.id, check.checked); });

      const text = document.createElement("span");
      text.className = "list-item__text";
      text.textContent = todo.text;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "list-item__delete";
      del.setAttribute("aria-label", "Delete task: " + todo.text);
      del.textContent = "×";
      del.addEventListener("click", function () { deleteTodo(todo.id); });

      li.append(check, text, del);
      els.todoList.appendChild(li);
    });
    renderProgress();
  }

  async function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    state.todos = [
      { id: S.uid("todo"), text: trimmed, done: false, createdAt: Date.now() },
    ].concat(state.todos || []);
    await S.update({ todos: state.todos });
    renderTodos();
  }

  async function toggleTodo(id, done) {
    const today = S.todayKey();
    const completed = Object.assign({}, state.completedTodoDates || {});
    state.todos = (state.todos || []).map(function (t) {
      if (t.id !== id) return t;
      if (done && !t.done) completed[today] = (completed[today] || 0) + 1;
      return Object.assign({}, t, { done: done });
    });
    state.completedTodoDates = completed;
    await S.update({ todos: state.todos, completedTodoDates: completed });
    renderTodos();
  }

  async function deleteTodo(id) {
    state.todos = (state.todos || []).filter(function (t) { return t.id !== id; });
    await S.update({ todos: state.todos });
    renderTodos();
  }

  function renderGoals() {
    const goals = state.goals || [];
    els.goalList.innerHTML = "";
    els.goalEmpty.hidden = goals.length > 0;
    goals.forEach(function (goal) {
      const li = document.createElement("li");
      li.className = "list-item";
      li.dataset.id = goal.id;

      const text = document.createElement("span");
      text.className = "list-item__text";
      text.textContent = goal.text;

      const range = document.createElement("input");
      range.type = "range";
      range.className = "goal-progress";
      range.min = "0";
      range.max = "100";
      range.step = "5";
      range.value = String(goal.progress || 0);
      range.setAttribute("aria-label", "Progress for " + goal.text);

      const meta = document.createElement("span");
      meta.className = "list-item__meta";
      meta.textContent = (goal.progress || 0) + "%";

      range.addEventListener("input", function () { meta.textContent = range.value + "%"; });
      range.addEventListener("change", function () { updateGoalProgress(goal.id, Number(range.value)); });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "list-item__delete";
      del.setAttribute("aria-label", "Delete goal: " + goal.text);
      del.textContent = "×";
      del.addEventListener("click", function () { deleteGoal(goal.id); });

      li.append(text, range, meta, del);
      els.goalList.appendChild(li);
    });
    renderProgress();
  }

  async function addGoal(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    state.goals = (state.goals || []).concat([{ id: S.uid("goal"), text: trimmed, progress: 0 }]);
    await S.update({ goals: state.goals });
    renderGoals();
  }

  async function updateGoalProgress(id, progress) {
    state.goals = (state.goals || []).map(function (g) {
      return g.id === id
        ? Object.assign({}, g, { progress: Math.min(100, Math.max(0, progress)) })
        : g;
    });
    await S.update({ goals: state.goals });
    renderGoals();
  }

  async function deleteGoal(id) {
    state.goals = (state.goals || []).filter(function (g) { return g.id !== id; });
    await S.update({ goals: state.goals });
    renderGoals();
  }

  function renderProgress() {
    const todos = state.todos || [];
    const done = todos.filter(function (t) { return t.done; }).length;
    const total = todos.length;
    els.statTodos.textContent = done + "/" + total;

    const goals = state.goals || [];
    let goalPct = 0;
    if (goals.length) {
      goalPct = Math.round(
        goals.reduce(function (sum, g) { return sum + (Number(g.progress) || 0); }, 0) / goals.length
      );
    }
    els.statGoals.textContent = goalPct + "%";

    const todoRatio = total ? done / total : 0;
    const combined = goals.length
      ? Math.round(((todoRatio + goalPct / 100) / 2) * 100)
      : Math.round(todoRatio * 100);
    els.progressFill.style.width = combined + "%";
  }

  function renderShortcuts() {
    const shortcuts = state.shortcuts || [];
    els.shortcutGrid.innerHTML = "";
    shortcuts.forEach(function (item) {
      const wrap = document.createElement("div");
      wrap.className = "shortcut";
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "link");
      wrap.setAttribute("aria-label", item.name + " — " + item.url);

      const name = document.createElement("span");
      name.className = "shortcut__name";
      name.textContent = item.name;

      const url = document.createElement("span");
      url.className = "shortcut__url";
      url.textContent = item.url.replace(/^https?:\/\//i, "");

      const del = document.createElement("button");
      del.type = "button";
      del.className = "shortcut__delete";
      del.setAttribute("aria-label", "Remove shortcut " + item.name);
      del.textContent = "×";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteShortcut(item.id);
      });

      function go() { window.location.href = item.url; }
      wrap.addEventListener("click", function (e) {
        if (e.target === del) return;
        go();
      });
      wrap.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });

      wrap.append(name, url, del);
      els.shortcutGrid.appendChild(wrap);
    });
  }

  async function addShortcut(name, rawUrl) {
    setError(els.shortcutError, "");
    const url = normalizeUrl(rawUrl);
    if (!name.trim()) {
      setError(els.shortcutError, "Name is required.");
      return false;
    }
    if (!isValidHttpUrl(url)) {
      setError(els.shortcutError, "Enter a valid http(s) URL.");
      return false;
    }
    state.shortcuts = (state.shortcuts || []).concat([{ id: S.uid("sc"), name: name.trim(), url: url }]);
    await S.update({ shortcuts: state.shortcuts });
    renderShortcuts();
    return true;
  }

  async function deleteShortcut(id) {
    state.shortcuts = (state.shortcuts || []).filter(function (s) { return s.id !== id; });
    await S.update({ shortcuts: state.shortcuts });
    renderShortcuts();
  }

  function getSearchBase() {
    if (state.searchEngine === "custom") {
      return String(state.customSearchUrl || "").trim();
    }
    const engine = S.SEARCH_ENGINES[state.searchEngine] || S.SEARCH_ENGINES.google;
    return engine.url;
  }

  function openSettings() {
    lastFocusedBeforeSettings = document.activeElement;
    fillSettingsForm();
    els.settingsPanel.hidden = false;
    els.settingsBackdrop.hidden = false;
    els.settingsOpen.setAttribute("aria-expanded", "true");
    els.settingsClose.focus();
  }

  function closeSettings() {
    els.settingsPanel.hidden = true;
    els.settingsBackdrop.hidden = true;
    els.settingsOpen.setAttribute("aria-expanded", "false");
    if (lastFocusedBeforeSettings && lastFocusedBeforeSettings.focus) {
      lastFocusedBeforeSettings.focus();
    } else {
      els.settingsOpen.focus();
    }
  }

  function fillSettingsForm() {
    els.settingSearchEngine.value = state.searchEngine || "google";
    els.settingCustomSearch.value = state.customSearchUrl || "";
    els.customSearchField.hidden = els.settingSearchEngine.value !== "custom";
    els.settingFocusMin.value = String(state.focusMinutes || 25);
    els.settingBreakMin.value = String(state.breakMinutes || 5);
    els.settingBgMode.value = state.backgroundMode || "default";
    els.settingBgUrl.value = state.backgroundUrl || "";
    els.settingGradient.value = state.gradientPreset || "misty-sage";
    updateBgFields();
    document.querySelectorAll("[data-widget-toggle]").forEach(function (input) {
      const key = input.getAttribute("data-widget-toggle");
      input.checked = state.widgets[key] !== false;
    });
  }

  function updateBgFields() {
    const mode = els.settingBgMode.value;
    els.bgUrlField.hidden = mode !== "url";
    els.bgGradientField.hidden = mode !== "gradient" && mode !== "url";
  }

  async function saveSettings(event) {
    event.preventDefault();
    setError(els.bgUrlError, "");
    setError(els.searchError, "");

    const searchEngine = els.settingSearchEngine.value;
    const customSearchUrl = els.settingCustomSearch.value.trim();
    if (searchEngine === "custom" && customSearchUrl && !isValidHttpUrl(customSearchUrl)) {
      setError(els.searchError, "Custom search URL must be a valid http(s) URL.");
      showToast("Fix search URL before saving.");
      return;
    }

    const backgroundMode = els.settingBgMode.value;
    const backgroundUrl = els.settingBgUrl.value.trim();
    if (backgroundMode === "url" && backgroundUrl && !isValidHttpUrl(backgroundUrl)) {
      setError(els.bgUrlError, "Background URL must be a valid http(s) URL.");
      showToast("Fix background URL before saving.");
      return;
    }

    const focusMinutes = Math.min(180, Math.max(1, Number(els.settingFocusMin.value) || 25));
    const breakMinutes = Math.min(60, Math.max(1, Number(els.settingBreakMin.value) || 5));

    const widgets = Object.assign({}, state.widgets);
    document.querySelectorAll("[data-widget-toggle]").forEach(function (input) {
      widgets[input.getAttribute("data-widget-toggle")] = input.checked;
    });

    const timerNeedsReset =
      focusMinutes !== state.focusMinutes || breakMinutes !== state.breakMinutes;

    state = await S.update({
      searchEngine: searchEngine,
      customSearchUrl: customSearchUrl,
      backgroundMode: backgroundMode,
      backgroundUrl: backgroundUrl,
      gradientPreset: els.settingGradient.value,
      focusMinutes: focusMinutes,
      breakMinutes: breakMinutes,
      widgets: widgets,
    });

    if (timerNeedsReset && !state.timer.running) {
      state.timer.totalMs = durationForMode(state.timer.mode);
      state.timer.remainingMs = state.timer.totalMs;
      await persistTimer();
    }

    applyAll();
    closeSettings();
    showToast("Settings saved.");
  }

  function applyAll() {
    applyWidgetVisibility();
    applyBackground();
    applyQuote();
    updateClock();
    syncTimerFromState();
    renderTodos();
    renderGoals();
    renderShortcuts();
    renderProgress();
  }

  function bindEvents() {
    els.searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      setError(els.searchError, "");
      const q = els.searchInput.value.trim();
      if (!q) return;
      const base = getSearchBase();
      if (!base || !isValidHttpUrl(base)) {
        setError(
          els.searchError,
          state.searchEngine === "custom"
            ? "Configure a valid custom search URL in settings."
            : "Search engine is not configured."
        );
        return;
      }
      window.location.href = base + encodeURIComponent(q);
    });

    els.todoForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await addTodo(els.todoInput.value);
      els.todoForm.reset();
      els.todoInput.focus();
    });

    els.goalForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      await addGoal(els.goalInput.value);
      els.goalForm.reset();
      els.goalInput.focus();
    });

    els.shortcutForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const ok = await addShortcut(els.shortcutName.value, els.shortcutUrl.value);
      if (ok) {
        els.shortcutForm.reset();
        els.shortcutName.focus();
      }
    });

    els.timerStart.addEventListener("click", function () { startTimer(); });
    els.timerPause.addEventListener("click", function () { pauseTimer(); });
    els.timerReset.addEventListener("click", function () { resetTimer(); });
    els.timerSwitch.addEventListener("click", function () { switchTimerMode(); });

    els.settingsOpen.addEventListener("click", openSettings);
    els.settingsClose.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", closeSettings);
    els.settingsForm.addEventListener("submit", saveSettings);

    els.settingSearchEngine.addEventListener("change", function () {
      els.customSearchField.hidden = els.settingSearchEngine.value !== "custom";
    });
    els.settingBgMode.addEventListener("change", updateBgFields);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !els.settingsPanel.hidden) {
        e.preventDefault();
        closeSettings();
      }
    });

    els.settingsPanel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || els.settingsPanel.hidden) return;
      const focusables = els.settingsPanel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.prototype.filter.call(focusables, function (el) {
        return !el.hasAttribute("disabled") && el.offsetParent !== null;
      });
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  async function init() {
    try {
      state = await S.getAll();
      if (state.timer && state.timer.running && state.timer.endsAt) {
        const remaining = state.timer.endsAt - Date.now();
        if (remaining <= 0) {
          state.timer.running = false;
          state.timer.remainingMs = 0;
          state.timer.endsAt = null;
          await persistTimer();
        } else {
          state.timer.remainingMs = remaining;
        }
      } else if (state.timer && !state.timer.totalMs) {
        state.timer.totalMs = durationForMode(state.timer.mode || "focus");
        state.timer.remainingMs = state.timer.totalMs;
      }

      bindEvents();
      applyAll();
      startTimerTick();
      clockInterval = setInterval(updateClock, 1000);
    } catch (err) {
      console.error(err);
      showToast("Could not load saved data.");
      state = S.mergeDefaults({});
      bindEvents();
      applyAll();
    } finally {
      requestAnimationFrame(function () {
        els.loading.classList.add("is-done");
        setTimeout(function () { els.loading.hidden = true; }, 500);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
