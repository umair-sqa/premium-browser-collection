/**
 * Salah & Sun Companion — New Tab UI controller.
 */
(function () {
  "use strict";

  const els = {
    clock: document.getElementById("clock"),
    gregorian: document.getElementById("gregorian-date"),
    hijri: document.getElementById("hijri-date"),
    location: document.getElementById("location-display"),
    loading: document.getElementById("loading-state"),
    error: document.getElementById("error-state"),
    empty: document.getElementById("empty-location"),
    openSettingsHint: document.getElementById("open-settings-from-hint"),
    prayerFocus: document.getElementById("prayer-focus"),
    currentPrayer: document.getElementById("current-prayer"),
    nextPrayer: document.getElementById("next-prayer"),
    countdown: document.getElementById("countdown"),
    methodBadge: document.getElementById("method-badge"),
    timesGrid: document.getElementById("times-grid"),
    qiblaPanel: document.getElementById("qibla-panel"),
    qiblaArrow: document.getElementById("qibla-arrow"),
    qiblaDegrees: document.getElementById("qibla-degrees"),
    settingsToggle: document.getElementById("settings-toggle"),
    settingsClose: document.getElementById("settings-close"),
    settingsCancel: document.getElementById("settings-cancel"),
    settingsPanel: document.getElementById("settings-panel"),
    settingsBackdrop: document.getElementById("settings-backdrop"),
    settingsForm: document.getElementById("settings-form"),
    placeName: document.getElementById("place-name"),
    latitude: document.getElementById("latitude"),
    longitude: document.getElementById("longitude"),
    calculationMethod: document.getElementById("calculation-method"),
    asrMethod: document.getElementById("asr-method"),
    highLatitudeRule: document.getElementById("high-latitude-rule"),
    remindersEnabled: document.getElementById("reminders-enabled"),
    reminderMinutes: document.getElementById("reminder-minutes"),
    useGeolocation: document.getElementById("use-geolocation"),
    geoStatus: document.getElementById("geo-status"),
    reminderStatus: document.getElementById("reminder-status"),
  };

  const timeEls = {
    fajr: document.getElementById("time-fajr"),
    sunrise: document.getElementById("time-sunrise"),
    dhuhr: document.getElementById("time-dhuhr"),
    asr: document.getElementById("time-asr"),
    sunset: document.getElementById("time-sunset"),
    maghrib: document.getElementById("time-maghrib"),
    isha: document.getElementById("time-isha"),
  };

  let settings = { ...SalahSunStorage.DEFAULTS };
  let computed = null;
  let clockTimer = null;
  let lastFocusEl = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function formatClock(date) {
    return pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function formatTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
    } catch (_) {
      return pad(date.getHours()) + ":" + pad(date.getMinutes());
    }
  }

  function formatGregorian(date) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (_) {
      return date.toDateString();
    }
  }

  function formatCountdown(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return pad(h) + ":" + pad(m) + ":" + pad(s);
    return pad(m) + ":" + pad(s);
  }

  function populateMethodSelect() {
    const select = els.calculationMethod;
    select.innerHTML = "";
    Object.keys(SalahSunStorage.METHOD_LABELS).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = SalahSunStorage.METHOD_LABELS[key];
      select.appendChild(opt);
    });
  }

  function fillForm(s) {
    els.placeName.value = s.placeName || "";
    els.latitude.value = s.latitude != null ? s.latitude : "";
    els.longitude.value = s.longitude != null ? s.longitude : "";
    els.calculationMethod.value = s.calculationMethod || "MuslimWorldLeague";
    els.asrMethod.value = s.asrMethod || "Shafi";
    els.highLatitudeRule.value = s.highLatitudeRule || "MiddleOfTheNight";
    els.remindersEnabled.checked = !!s.remindersEnabled;
    els.reminderMinutes.value = s.reminderMinutesBefore != null ? s.reminderMinutesBefore : 10;
  }

  function readForm() {
    const lat = parseFloat(els.latitude.value);
    const lng = parseFloat(els.longitude.value);
    return {
      placeName: (els.placeName.value || "").trim(),
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      calculationMethod: els.calculationMethod.value,
      asrMethod: els.asrMethod.value,
      highLatitudeRule: els.highLatitudeRule.value,
      remindersEnabled: els.remindersEnabled.checked,
      reminderMinutesBefore: Math.min(
        60,
        Math.max(0, parseInt(els.reminderMinutes.value, 10) || 0)
      ),
    };
  }

  function setSettingsOpen(open) {
    els.settingsPanel.hidden = !open;
    els.settingsBackdrop.hidden = !open;
    els.settingsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    els.settingsToggle.setAttribute("aria-label", open ? "Close settings" : "Open settings");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocusEl = document.activeElement;
      fillForm(settings);
      els.geoStatus.textContent = "";
      els.reminderStatus.textContent = "";
      const first = els.settingsPanel.querySelector("input, select, button");
      if (first) first.focus();
    } else if (lastFocusEl && typeof lastFocusEl.focus === "function") {
      lastFocusEl.focus();
    }
  }

  function showError(message) {
    els.error.hidden = !message;
    els.error.textContent = message || "";
  }

  function updateLocationDisplay(s) {
    if (!SalahSunStorage.hasLocation(s)) {
      els.location.textContent = "Location not set";
      return;
    }
    const coords =
      s.latitude.toFixed(4) + "°, " + s.longitude.toFixed(4) + "°";
    els.location.textContent = s.placeName
      ? s.placeName + " · " + coords
      : coords;
  }

  function highlightCards(current, next) {
    document.querySelectorAll(".time-card").forEach((card) => {
      const key = card.getAttribute("data-key");
      card.classList.toggle("is-current", key === current && current !== "none");
      card.classList.toggle("is-next", key === next && next !== "none");
    });
  }

  function resolveNextDate(times, nextKey, now) {
    if (!nextKey || nextKey === "none") {
      // After Isha → tomorrow Fajr
      try {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const t2 = SalahSunPrayer.computePrayerTimes(
          settings.latitude,
          settings.longitude,
          tomorrow,
          {
            calculationMethod: settings.calculationMethod,
            asrMethod: settings.asrMethod,
            highLatitudeRule: settings.highLatitudeRule,
          }
        );
        return { key: "fajr", date: t2.fajr };
      } catch (_) {
        return null;
      }
    }
    const date = times[nextKey];
    if (date && date.getTime() > now.getTime()) {
      return { key: nextKey, date };
    }
    return null;
  }

  function refreshComputed(now) {
    if (!SalahSunStorage.hasLocation(settings)) {
      computed = null;
      els.loading.hidden = true;
      els.empty.hidden = false;
      els.prayerFocus.hidden = true;
      els.timesGrid.hidden = true;
      els.qiblaPanel.hidden = true;
      showError("");
      return;
    }

    els.empty.hidden = true;
    els.loading.hidden = false;

    try {
      const times = SalahSunPrayer.computePrayerTimes(
        settings.latitude,
        settings.longitude,
        now,
        {
          calculationMethod: settings.calculationMethod,
          asrMethod: settings.asrMethod,
          highLatitudeRule: settings.highLatitudeRule,
        }
      );
      computed = times;
      showError("");

      Object.keys(timeEls).forEach((key) => {
        timeEls[key].textContent = formatTime(times[key]);
      });

      const labels = SalahSunPrayer.PRAYER_LABELS;
      let currentKey = times.current;
      // Treat sunrise as not a "current prayer" for the Now label
      if (currentKey === "sunrise") currentKey = "fajr";
      const currentLabel =
        currentKey && currentKey !== "none" ? labels[currentKey] : "—";

      let nextInfo = resolveNextDate(times, times.next, now);
      // Prefer next salah (skip sunrise for "Next" if desired — keep sunrise as next when it is)
      const nextLabel = nextInfo ? labels[nextInfo.key] : "—";

      els.currentPrayer.textContent = currentLabel;
      els.nextPrayer.textContent = nextLabel;

      const methodLabel =
        SalahSunStorage.METHOD_LABELS[settings.calculationMethod] ||
        settings.calculationMethod;
      const asrLabel = settings.asrMethod === "Hanafi" ? "Hanafi Asr" : "Standard Asr";
      els.methodBadge.textContent =
        "Method: " + methodLabel + " · " + asrLabel;

      highlightCards(
        times.current === "sunrise" ? "sunrise" : times.current,
        nextInfo ? nextInfo.key : times.next
      );

      const bearing = SalahSunPrayer.qiblaBearing(
        settings.latitude,
        settings.longitude
      );
      els.qiblaDegrees.textContent = bearing.toFixed(1) + "°";
      els.qiblaArrow.style.transform = "rotate(" + bearing + "deg)";

      els.prayerFocus.hidden = false;
      els.timesGrid.hidden = false;
      els.qiblaPanel.hidden = false;
      els.loading.hidden = true;

      updateCountdown(now, nextInfo);
    } catch (err) {
      els.loading.hidden = true;
      els.prayerFocus.hidden = true;
      els.timesGrid.hidden = true;
      els.qiblaPanel.hidden = true;
      showError("Could not calculate prayer times. " + (err && err.message ? err.message : String(err)));
      computed = null;
    }
  }

  function updateCountdown(now, nextInfo) {
    if (!nextInfo || !nextInfo.date) {
      els.countdown.textContent = "—";
      return;
    }
    els.countdown.textContent = "in " + formatCountdown(nextInfo.date.getTime() - now.getTime());
  }

  function tick() {
    const now = new Date();
    els.clock.textContent = formatClock(now);
    els.gregorian.textContent = formatGregorian(now);

    const hijri = SalahSunPrayer.toHijri(now);
    els.hijri.textContent = hijri.formatted + " (approx.)";

    if (SalahSunStorage.hasLocation(settings) && computed) {
      // Recalculate at midnight or when next prayer passes
      const nextInfo = resolveNextDate(computed, computed.next, now);
      if (!nextInfo || nextInfo.date.getTime() <= now.getTime()) {
        refreshComputed(now);
      } else {
        updateCountdown(now, nextInfo);
        // Soft-update current/next labels mid-day
        const live = SalahSunPrayer.computePrayerTimes(
          settings.latitude,
          settings.longitude,
          now,
          {
            calculationMethod: settings.calculationMethod,
            asrMethod: settings.asrMethod,
            highLatitudeRule: settings.highLatitudeRule,
          }
        );
        if (live.current !== computed.current || live.next !== computed.next) {
          computed = live;
          refreshComputed(now);
        }
      }
    }
  }

  async function ensureNotificationPermission() {
    if (!("Notification" in window)) {
      throw new Error("Notifications are not available in this browser.");
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
      throw new Error("Notification permission was denied. Enable it in Chrome settings.");
    }
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async function saveFromForm(event) {
    event.preventDefault();
    const next = readForm();

    if (next.latitude == null || next.longitude == null) {
      els.geoStatus.textContent = "Enter valid latitude and longitude.";
      els.geoStatus.classList.add("is-error");
      return;
    }
    if (next.latitude < -90 || next.latitude > 90 || next.longitude < -180 || next.longitude > 180) {
      els.geoStatus.textContent = "Coordinates out of range.";
      els.geoStatus.classList.add("is-error");
      return;
    }

    els.geoStatus.classList.remove("is-error");

    if (next.remindersEnabled) {
      try {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          next.remindersEnabled = false;
          els.remindersEnabled.checked = false;
          els.reminderStatus.textContent =
            "Reminders stay off until notification permission is granted.";
          els.reminderStatus.classList.add("is-error");
        } else {
          els.reminderStatus.textContent = "Reminders enabled.";
          els.reminderStatus.classList.remove("is-error");
        }
      } catch (err) {
        next.remindersEnabled = false;
        els.remindersEnabled.checked = false;
        els.reminderStatus.textContent = err.message || String(err);
        els.reminderStatus.classList.add("is-error");
      }
    }

    try {
      settings = await SalahSunStorage.saveSettings(next);
      updateLocationDisplay(settings);
      refreshComputed(new Date());
      try {
        chrome.runtime.sendMessage({ type: "salah-sun-reschedule" });
      } catch (_) {
        /* ignore when not in extension context */
      }
      setSettingsOpen(false);
    } catch (err) {
      showError("Failed to save settings: " + (err.message || String(err)));
    }
  }

  function useGeolocation() {
    els.geoStatus.classList.remove("is-error");
    els.geoStatus.textContent = "Requesting location…";

    if (!navigator.geolocation) {
      els.geoStatus.textContent = "Geolocation is not supported.";
      els.geoStatus.classList.add("is-error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        els.latitude.value = pos.coords.latitude.toFixed(6);
        els.longitude.value = pos.coords.longitude.toFixed(6);
        els.geoStatus.textContent =
          "Location captured. Save to apply. Stored locally only.";
      },
      (err) => {
        els.geoStatus.textContent =
          "Could not get location: " + (err.message || "permission denied or unavailable");
        els.geoStatus.classList.add("is-error");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  }

  function trapFocus(event) {
    if (els.settingsPanel.hidden || event.key !== "Tab") return;
    const focusable = els.settingsPanel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function init() {
    populateMethodSelect();

    try {
      settings = await SalahSunStorage.getSettings();
    } catch (err) {
      showError("Could not load settings: " + (err.message || String(err)));
      settings = { ...SalahSunStorage.DEFAULTS };
    }

    updateLocationDisplay(settings);
    refreshComputed(new Date());
    tick();
    clockTimer = setInterval(tick, 1000);

    els.settingsToggle.addEventListener("click", () => {
      setSettingsOpen(els.settingsPanel.hidden);
    });
    els.settingsClose.addEventListener("click", () => setSettingsOpen(false));
    els.settingsCancel.addEventListener("click", () => setSettingsOpen(false));
    els.settingsBackdrop.addEventListener("click", () => setSettingsOpen(false));
    els.openSettingsHint.addEventListener("click", () => setSettingsOpen(true));
    els.settingsForm.addEventListener("submit", saveFromForm);
    els.useGeolocation.addEventListener("click", useGeolocation);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.settingsPanel.hidden) {
        event.preventDefault();
        setSettingsOpen(false);
      }
      trapFocus(event);
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[SalahSunStorage.STORAGE_KEY]) return;
      settings = {
        ...SalahSunStorage.DEFAULTS,
        ...(changes[SalahSunStorage.STORAGE_KEY].newValue || {}),
      };
      updateLocationDisplay(settings);
      refreshComputed(new Date());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
