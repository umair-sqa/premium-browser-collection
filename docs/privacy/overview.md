# Privacy overview

Aurevia Studio products are designed for local-first use.

## Themes

Native themes do not execute scripts and do not access browsing data.

## Extensions

| Product | Permissions | Data stored | Network |
| --- | --- | --- | --- |
| Salah & Sun | `storage`, `alarms`, `notifications` | Location prefs, calculation method, reminder toggle | None required. Geolocation only on explicit user action via browser prompt. |
| Deep Work | `storage` | Todos, goals, timer prefs, shortcuts, layout | Search navigates to the configured search engine when the user submits a query. |
| DevSpace | `storage` | Snippets, notes, bookmarks, layout | Optional navigation to user-entered URLs / curated links. No GitHub API tokens. |
| Cosmos | `storage` (+ optional host permission for Open-Meteo) | Widget prefs, clocks, location for local astronomy math | Optional Open-Meteo weather fetch when enabled by the user. |

## Principles

- No analytics SDKs.
- No remote code execution.
- No committed credentials.
- Permission denial is handled gracefully with manual fallbacks.
