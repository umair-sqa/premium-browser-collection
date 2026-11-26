# Development setup

## Requirements

- Node.js 20 or newer (CI uses Node 22)
- npm 10+
- Google Chrome for manual theme/extension loading

## Install

```bash
npm install
```

## Common commands

```bash
npm run lint
npm run typecheck
npm run validate
npm test
npm run build
```

Validate a single product:

```bash
node scripts/validate-theme.mjs obsidian
node scripts/validate-extension.mjs deep-work
node scripts/build-products.mjs cosmos
```

## Loading products

Always load a **product directory** (or its `dist/` copy), never the monorepo root.

## Testing notes

- Unit tests cover shared utilities and catalogue/theme validation.
- Extension UI behaviour should be verified manually in Chrome after load.
- Playwright is available as a dependency for future browser automation; current CI focuses on static validation, unit tests, and build verification.
