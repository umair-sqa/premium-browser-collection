/**
 * Prayer reminder scheduler. Alarms are created only when the user enables reminders.
 */
const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "salah-sun-schedule") return;
  schedule(message.settings, message.times)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith("salah-")) return;
  const prayer = alarm.name.replace("salah-", "");
  const label = prayer.charAt(0).toUpperCase() + prayer.slice(1);
  try {
    await chrome.notifications.create("salah-" + prayer + "-" + Date.now(), {
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: "Salah & Sun Companion",
      message: label + " is approaching.",
      priority: 1,
    });
  } catch {
    /* notifications may be unavailable */
  }
});

async function schedule(settings, times) {
  const existing = await chrome.alarms.getAll();
  await Promise.all(
    existing.filter((a) => a.name.startsWith("salah-")).map((a) => chrome.alarms.clear(a.name)),
  );
  if (!settings?.remindersEnabled || !times) return;
  const lead = Math.max(1, Number(settings.reminderMinutes) || 10) * 60 * 1000;
  const now = Date.now();
  for (const prayer of PRAYERS) {
    const iso = times[prayer];
    if (!iso) continue;
    const when = new Date(iso).getTime() - lead;
    if (when > now) {
      await chrome.alarms.create("salah-" + prayer, { when });
    }
  }
}
