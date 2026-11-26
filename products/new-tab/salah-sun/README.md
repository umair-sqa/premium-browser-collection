# Salah & Sun Companion — Aurevia Studio

Premium Chrome Manifest V3 New Tab extension with Islamic prayer times, algorithmic Hijri date, Qibla bearing, and optional prayer reminders.

## Install

**From source (development):**

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `products/new-tab/salah-sun`

**After monorepo build copy:**

- Load unpacked from `dist/extensions/salah-sun` when the catalog `extension-copy` build has been run.

## What it does

- Replaces the New Tab page with a calm astronomical dashboard
- Live digital clock, Gregorian date, and algorithmic Hijri date
- Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, plus Sunset
- Current / next prayer with countdown
- Configurable calculation method (MWL, ISNA, Egypt, Makkah, Karachi, and more)
- Configurable Asr madhab (Standard/Shafi vs Hanafi) and high-latitude rule
- Manual lat/lng (optional place name) or opt-in browser geolocation
- Qibla mathematical bearing toward the Kaaba
- Optional daily reminders via `chrome.alarms` + notifications

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Persist location and calculation preferences locally (`chrome.storage.local`) |
| `alarms` | Schedule prayer reminder wake-ups |
| `notifications` | Show reminder notifications when the user enables them |

**Geolocation** is not declared as a manifest permission. The UI uses `navigator.geolocation.getCurrentPosition`, which prompts the user when they click **Use my location**.

## Prayer calculation

Times are computed locally with the [adhan](https://github.com/batoulapps/adhan-js) library (vendored UMD build under `vendor/adhan.umd.min.js`, MIT). Adhan implements high-precision astronomical algorithms (Jean Meeus, *Astronomical Algorithms*). A thin facade in `src/prayer-times.js` configures methods, madhab, high-latitude rules, and Qibla bearing.

Prayer times are **never hardcoded**; they are always derived from coordinates, date, and selected method.

## Limitations

- **Hijri date** uses a simple algorithmic civil conversion. It is an approximation and **not** the official Umm al-Qura calendar. The UI labels it as approximate.
- **Qibla** is a mathematical geographic bearing (degrees from true north toward 21.4225°N, 39.8262°E). The on-screen arrow is not a magnetic compass. DeviceOrientation-based compass UI is not required for v1.
- **Notifications** require the user to enable reminders and grant notification permission.
- Polar / extreme high-latitude edge cases follow adhan’s high-latitude / polar resolution behaviour; local authorities may differ.

## Privacy

- Location is optional.
- Coordinates and preferences are stored only on this device via `chrome.storage.local`.
- No analytics, no remote API calls for prayer times, no invented hadith or Quran quotes.

## Files

```
manifest.json       MV3 extension manifest
newtab.html/css/js  New Tab UI
background.js       Alarm + notification service worker
storage.js          chrome.storage.local helpers + defaults
src/prayer-times.js Facade over adhan + Hijri helper
vendor/adhan*.js    Vendored adhan UMD build (local only)
assets/             Background artwork
icons/              Extension icons
store/              Store listing artwork
```

## Brand

- **Aurevia Studio** — Salah & Sun Companion
- Palette: midnight `#0B1A24`, gold `#C9A227`, teal `#1A6B6B`
- Typography: elegant serif stack for display (`Georgia`, `Times New Roman`, serif); `system-ui` for body. No remote Google Fonts scripts.
