# Security Policy

## Reporting

If you discover a vulnerability in this repository or a packaged product, please open a private security advisory on GitHub or contact the repository maintainers. Do not file a public issue for exploitable defects that expose user data.

## Principles

- Minimum necessary Chrome permissions.
- Local-first storage (`chrome.storage.local`).
- No remote executable script loading.
- Optional geolocation only after user action.
- No bundled credentials or API secrets.
- Optional network calls (for example Open-Meteo weather in Cosmos) are documented and off by default where applicable.

## Scope

This project ships browser themes and New Tab dashboards. Themes have no executable logic beyond Chrome's theme engine. Extensions run with the permissions declared in each product `manifest.json`.
