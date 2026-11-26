# Quality assurance

## Automated

| Layer | Command | Covers |
| --- | --- | --- |
| Lint | `npm run lint` | JS style / undef |
| Typecheck | `npm run typecheck` | packages + scripts |
| Catalogue | `npm run validate:catalog` | `products/catalog.json` |
| Themes | `npm run validate:themes` | manifests, colours, assets |
| Extensions | `npm run validate:extensions` | MV3, overrides, icons, scripts, credential heuristics |
| Unit / architecture | `npm test` | utils + catalogue/theme integrity |
| Build | `npm run build` | `dist/` copies + re-validation |

## Manual (required for release)

- Load each theme in Chrome; verify frame, tabs, NTP background.
- Load each extension; verify New Tab UI, settings persistence, keyboard Escape, responsive layout.
- Deny geolocation for Salah & Sun and confirm manual location path.
- Toggle Cosmos weather off/on and confirm offline/error messaging.

Do not claim Chrome rendering is verified solely because static validation passed.
