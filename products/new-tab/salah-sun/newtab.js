(function () {
  "use strict";

  const Storage = globalThis.SalahSunStorage;
  const Prayer = globalThis.SalahSunPrayer;
  let settings = null;
  let times = null;

  const $ = (id) => document.getElementById(id);
  const prayerNames = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    none: "—",
  };

  function fmtTime(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
  }

  function openSettings() {
    $("settings-panel").hidden = false;
    $("settings-backdrop").hidden = false;
    $("settings-toggle").setAttribute("aria-expanded", "true");
    $("place-name").value = settings.placeName || "";
    $("latitude").value = settings.latitude ?? "";
    $("longitude").value = settings.longitude ?? "";
    $("calculation-method").value = settings.calculationMethod;
    $("asr-method").value = settings.asrMethod;
    $("high-latitude-rule").value = settings.highLatitudeRule;
    $("reminders-enabled").checked = !!settings.remindersEnabled;
    $("reminder-minutes").value = settings.reminderMinutes || 10;
    $("settings-close").focus();
  }

  function closeSettings() {
    $("settings-panel").hidden = true;
    $("settings-backdrop").hidden = true;
    $("settings-toggle").setAttribute("aria-expanded", "false");
  }

  function hasLocation() {
    return (
      typeof settings.latitude === "number" &&
      typeof settings.longitude === "number" &&
      !Number.isNaN(settings.latitude) &&
      !Number.isNaN(settings.longitude)
    );
  }

  function renderClock() {
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString(undefined, { hour12: false });
    $("gregorian-date").textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const hijri = Prayer.gregorianToHijri(now);
    $("hijri-date").textContent = hijri.formatted + " (approx.)";
    if (times) {
      const nextKey = times.next;
      const nextDate = times.timeFor(nextKey);
      if (nextDate) $("countdown").textContent = fmtCountdown(nextDate - now);
      $("current-prayer").textContent = prayerNames[times.current] || times.current || "—";
      $("next-prayer").textContent = prayerNames[nextKey] || nextKey || "—";
    }
  }

  function renderTimes() {
    $("loading-state").hidden = true;
    $("error-state").hidden = true;
    if (!hasLocation()) {
      $("empty-location").hidden = false;
      $("prayer-focus").hidden = true;
      $("qibla-panel").hidden = true;
      $("location-display").textContent = "Location not set";
      return;
    }
    $("empty-location").hidden = true;
    try {
      times = Prayer.compute({
        latitude: settings.latitude,
        longitude: settings.longitude,
        calculationMethod: settings.calculationMethod,
        asrMethod: settings.asrMethod,
        highLatitudeRule: settings.highLatitudeRule,
      });
      $("time-fajr").textContent = fmtTime(times.fajr);
      $("time-sunrise").textContent = fmtTime(times.sunrise);
      $("time-dhuhr").textContent = fmtTime(times.dhuhr);
      $("time-asr").textContent = fmtTime(times.asr);
      $("time-sunset").textContent = fmtTime(times.sunset);
      $("time-maghrib").textContent = fmtTime(times.maghrib);
      $("time-isha").textContent = fmtTime(times.isha);
      $("method-badge").textContent = "Method: " + times.methodLabel + " · Asr: " + settings.asrMethod;
      $("prayer-focus").hidden = false;
      $("qibla-panel").hidden = false;
      $("qibla-arrow").style.transform = "rotate(" + times.qibla + "deg)";
      $("qibla-degrees").textContent = times.qibla.toFixed(1) + "° from north";
      $("location-display").textContent = settings.placeName
        ? settings.placeName + " · " + settings.latitude.toFixed(4) + ", " + settings.longitude.toFixed(4)
        : settings.latitude.toFixed(4) + ", " + settings.longitude.toFixed(4);
      renderClock();
      scheduleReminders();
    } catch (err) {
      $("error-state").hidden = false;
      $("error-state").textContent = "Could not calculate prayer times: " + (err.message || err);
      $("prayer-focus").hidden = true;
    }
  }

  function scheduleReminders() {
    if (!chrome?.runtime?.sendMessage) return;
    chrome.runtime.sendMessage({
      type: "salah-sun-schedule",
      settings,
      times: times
        ? {
            fajr: times.fajr?.toISOString(),
            dhuhr: times.dhuhr?.toISOString(),
            asr: times.asr?.toISOString(),
            maghrib: times.maghrib?.toISOString(),
            isha: times.isha?.toISOString(),
          }
        : null,
    });
  }

  function bind() {
    $("settings-toggle").addEventListener("click", openSettings);
    $("settings-close").addEventListener("click", closeSettings);
    $("settings-cancel").addEventListener("click", closeSettings);
    $("settings-backdrop").addEventListener("click", closeSettings);
    $("open-settings-from-hint").addEventListener("click", openSettings);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("settings-panel").hidden) closeSettings();
    });

    $("use-geolocation").addEventListener("click", () => {
      const status = $("geo-status");
      if (!navigator.geolocation) {
        status.textContent = "Geolocation is not available in this browser.";
        return;
      }
      status.textContent = "Requesting location…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          $("latitude").value = String(pos.coords.latitude);
          $("longitude").value = String(pos.coords.longitude);
          status.textContent = "Location captured. Save to apply.";
        },
        (err) => {
          status.textContent = "Location denied or unavailable: " + err.message;
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    });

    $("settings-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const lat = Number($("latitude").value);
      const lng = Number($("longitude").value);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      const remindersEnabled = $("reminders-enabled").checked;
      if (remindersEnabled && globalThis.Notification && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      $("reminder-status").textContent =
        remindersEnabled && Notification.permission !== "granted"
          ? "Notifications permission not granted — reminders will not appear until allowed."
          : "";
      settings = await Storage.saveSettings({
        placeName: $("place-name").value.trim(),
        latitude: lat,
        longitude: lng,
        calculationMethod: $("calculation-method").value,
        asrMethod: $("asr-method").value,
        highLatitudeRule: $("high-latitude-rule").value,
        remindersEnabled,
        reminderMinutes: Math.max(1, Math.min(60, Number($("reminder-minutes").value) || 10)),
      });
      closeSettings();
      renderTimes();
    });
  }

  async function init() {
    settings = await Storage.getSettings();
    bind();
    renderTimes();
    setInterval(renderClock, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
