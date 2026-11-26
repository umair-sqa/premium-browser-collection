# Contributing

## Development setup

1. Use Node.js 20+.
2. Run `npm install`.
3. Prefer small, reviewable commits on feature branches.

## Product rules

- Native themes use Chrome's theme manifest schema only — never add New Tab overrides to a theme.
- New Tab products are Manifest V3 extensions with `chrome_url_overrides.newtab`.
- Do not request permissions until needed; prefer `storage` and local computation.
- Never commit secrets, tokens, or API keys.
- Do not invent religious quotations or live astronomical observations.

## Validation before PR

```bash
npm run lint
npm run typecheck
npm run validate
npm test
npm run build
```

## Artwork

Original product artwork belongs under each product's `images/`, `assets/`, or `store/` directory. Document provenance in `docs/branding/artwork-provenance.md`.
