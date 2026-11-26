/**
 * Service worker: prayer reminder alarms + notifications.
 * Notification permission is only requested when the user enables reminders
 * (from the New Tab settings UI). This worker schedules/clears alarms and
 * shows notifications when alarms fire.
 */
importScripts("storage.js", "vendor/adhan.umd.min.js", "src/prayer-times.js");

const ALARM_PREFIX = "salah-reminder-";
const SALAH_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

async function clearPrayerAlarms() {
  const alarms = await chrome.alarms.getAll();
  await Promise.all(
    alarms
      .filter((a) => a.name.startsWith(ALARM_PREFIX))
      .map((a) => chrome.alarms.clear(a.name))
  );
}

async function scheduleReminders(settings) {
  await clearPrayerAlarms();

  if (!settings.remindersEnabled) return;
  if (!SalahSunStorage.hasLocation(settings)) return;

  const minutesBefore = Math.max(0, Number(settings.reminderMinutesBefore) || 10);
  const now = Date.now();
  const today = new Date();

  let times;
  try {
    times = SalahSunPrayer.computePrayerTimes(
      settings.latitude,
      settings.longitude,
      today,
      {
        calculationMethod: settings.calculationMethod,
        asrMethod: settings.asrMethod,
        highLatitudeRule: settings.highLatitudeRule,
      }
    );
  } catch (err) {
    console.warn("Salah & Sun: failed to compute times for alarms", err);
    return;
  }

  // Also schedule tomorrow's Fajr so overnight coverage works after Isha.
  let tomorrowTimes = null;
  try {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrowTimes = SalahSunPrayer.computePrayerTimes(
      settings.latitude,
      settings.longitude,
      tomorrow,
      {
        calculationMethod: settings.calculationMethod,
        asrMethod: settings.asrMethod,
        highLatitudeRule: settings.highLatitudeRule,
      }
    );
  } catch (_) {
    /* ignore */
  }

  const scheduleOne = (key, date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    const when = date.getTime() - minutesBefore * 60 * 1000;
    if (when <= now) return;
    chrome.alarms.create(ALARM_PREFIX + key + "-" + date.toISOString().slice(0, 10), {
      when,
    });
  };

  for (const key of SALAH_KEYS) {
    scheduleOne(key, times[key]);
  }
  if (tomorrowTimes) {
    scheduleOne("fajr", tomorrowTimes.fajr);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const settings = await SalahSunStorage.getSettings();
    if (settings.remindersEnabled) {
      await scheduleReminders(settings);
    }
  } catch (err) {
    console.warn("Salah & Sun: onInstalled schedule failed", err);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    const settings = await SalahSunStorage.getSettings();
    if (settings.remindersEnabled) {
      await scheduleReminders(settings);
    }
  } catch (err) {
    console.warn("Salah & Sun: onStartup schedule failed", err);
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes[SalahSunStorage.STORAGE_KEY]) return;
  const settings = {
    ...SalahSunStorage.DEFAULTS,
    ...(changes[SalahSunStorage.STORAGE_KEY].newValue || {}),
  };
  try {
    if (settings.remindersEnabled) {
      await scheduleReminders(settings);
    } else {
      await clearPrayerAlarms();
    }
  } catch (err) {
    console.warn("Salah & Sun: reschedule failed", err);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;

  const settings = await SalahSunStorage.getSettings();
  if (!settings.remindersEnabled) return;

  const parts = alarm.name.slice(ALARM_PREFIX.length).split("-");
  const key = parts[0];
  const label = SalahSunPrayer.PRAYER_LABELS[key] || key;
  const minutes = Math.max(0, Number(settings.reminderMinutesBefore) || 10);
  const body =
    minutes > 0
      ? label + " begins in about " + minutes + " minutes."
      : "It is time for " + label + ".";

  try {
    await chrome.notifications.create("salah-" + alarm.name, {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Salah & Sun — " + label,
      message: body,
      priority: 2,
    });
  } catch (err) {
    console.warn("Salah & Sun: notification failed", err);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "salah-sun-reschedule") return false;
  SalahSunStorage.getSettings()
    .then((settings) => scheduleReminders(settings))
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});
