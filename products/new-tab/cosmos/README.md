# Cosmos — Aurevia Studio

Astronomy-inspired Chrome **Manifest V3** New Tab page. Local clocks, calendar, algorithmic moon phase and approximate sunrise/sunset, plus curated educational celestial content. Optional weather via Open-Meteo when you turn it on.

**Brand:** Aurevia Studio · **Palette:** `#050814`, `#7B6CF6`, `#1B2340`

## Install (unpacked)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this folder:

   `products/new-tab/cosmos`

4. Open a new tab to use Cosmos

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persist settings (widgets, cities, location, background, weather toggle) |
| Host: `https://api.open-meteo.com/*` | Used **only** when Weather (Open-Meteo) is enabled and lat/lng are set |

No other remote executable scripts are loaded. There is no analytics, accounts, or tracking.

## What is computed vs static vs optional network

### Computed locally (no network)

- **Digital clock & date** — device local time
- **World clocks** — `Intl.DateTimeFormat` with IANA time zones (default: UTC, New York, London, Tokyo, Dubai)
- **Mini calendar** — month grid with prev/next
- **Moon phase** — synodic-month algorithm from Julian day (approximate illumination & named phase)
- **Sunrise / sunset** — simplified solar position for configurable lat/lng (zenith ≈ 90.833°). Documented in the UI as **approximate educational**, not for navigation or observing plans
- **Day of year** and **Northern-hemisphere meteorological season** heuristic

### Static educational content (bundled arrays)

- **Solar system blurbs** — distance-order notes for the eight planets
- **Celestial notes** — curated facts

These are clearly labeled as **educational / static**. They are **not** live telescope observations, ephemerides feeds, or real-time sky events.

### Optional external API (default OFF)

- **Weather (Open-Meteo)** — when the settings toggle is enabled **and** latitude/longitude are set, Cosmos fetches current conditions from `https://api.open-meteo.com` (no API key). Loading, error, and offline states are shown explicitly; **no weather values are invented**.

## Settings

- Show/hide widgets
- Background: default nebula image, deep void gradient, or polar aurora gradient
- Location (lat/lng + optional place label) for sun times and optional weather
- World clock city list: `Label | IANA/TimeZone` per line
- Escape closes the settings panel

Preferences persist in `chrome.storage.local` under `cosmosSettings`.

## Privacy

- Preferences stay on the device via Chrome storage
- No personal data is sent anywhere unless you enable weather, in which case only the lat/lng you entered are requested from Open-Meteo
- Geolocation API is **not** used; you enter coordinates manually

## Limitations

- Moon phase and sun times are **approximate educational models**, not observatory-grade
- Season label uses a simple Northern-hemisphere month heuristic
- Planetary and celestial panels are **static education**, never live positions or telescope feeds
- Weather requires network access and a valid location; it is off by default
- Host permission for Open-Meteo is declared so the optional fetch can work when enabled

## Files

```
manifest.json      MV3 new-tab override
newtab.html        Markup
newtab.css         Deep-space UI
newtab.js          Clocks, calendar, astronomy, weather, settings
storage.js         chrome.storage.local helper
assets/            background.jpg
icons/             16 / 32 / 48 / 128
store/             listing artwork
README.md          this file
```

## Version

1.0.0
