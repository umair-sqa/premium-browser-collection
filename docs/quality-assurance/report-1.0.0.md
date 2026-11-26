# QA report — 1.0.0

Date: 2026-11-26

## Automated results

| Check | Result |
| --- | --- |
| `npm run lint` | Pass (warnings only for unused locals in extension UI) |
| `npm run typecheck` | Pass |
| `npm run validate:catalog` | Pass (10 products) |
| `npm run validate:themes` | Pass (6/6) |
| `npm run validate:extensions` | Pass (4/4) |
| `npm test` | Pass (10 tests) |
| `npm run build` | Pass (10 packages → `dist/`) |

## Unverified (manual Chrome required)

- Visual rendering of theme frames/tabs on Windows and macOS
- New Tab UI interaction in Chrome stable
- Geolocation deny path for Salah & Sun
- Notification permission flow
- Cosmos optional Open-Meteo network path in a real browser

## Notes

Static validation and unit tests do not replace manual Chrome installation checks.
