# Salah & Sun Companion — Aurevia Studio

Islamic prayer times and astronomical companion for Chrome New Tab.

## Install

```text
products/new-tab/salah-sun
```

Or after build: `dist/extensions/salah-sun`

Load unpacked from `chrome://extensions` with Developer mode enabled.

## Features

- Clock, Gregorian date, algorithmic Hijri date (approximation)
- Location-based prayer times via vendored [adhan](https://github.com/batoulapps/adhan-js) (MWL, ISNA, and other methods)
- Configurable Asr madhab and high-latitude rule
- Sunrise / sunset
- Qibla bearing (mathematical)
- Optional prayer reminders (`alarms` + `notifications`)
- Optional geolocation — requested only on button click

## Permissions

- `storage` — preferences
- `alarms` / `notifications` — optional reminders

## Privacy

Location is optional and stored locally. No analytics. No remote prayer APIs.

## Limitations

- Hijri date is algorithmic, not an official religious calendar authority.
- Qibla is a geodesic bearing, not a live magnetic compass UI.
- High-latitude edge cases follow the selected adhan rule; verify with a trusted local source when needed.
- This product does not invent hadith or Qur’anic quotations.
