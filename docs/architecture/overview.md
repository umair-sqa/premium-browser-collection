# Architecture overview

## Product types

1. **Native Chrome themes** — `manifest.json` with a `theme` object. No service workers, no New Tab overrides, no executable UI.
2. **New Tab extensions** — Manifest V3 extensions that override `chrome://newtab` with a local HTML dashboard.

These types must never be mixed in a single package.

## Monorepo layout

- `products/` — independently loadable packages + `catalog.json`
- `packages/` — reusable tooling and design tokens (not loaded into Chrome directly)
- `scripts/` — validation and build entrypoints
- `tests/` — unit, integration, architecture
- `docs/` — human documentation
- `dist/` — build output (generated; independently loadable copies)

## Catalogue-driven tooling

`products/catalog.json` is the source of truth for product IDs, directories, asset references, permissions summaries, and build output paths. Validation and build scripts read the catalogue rather than hardcoding product lists.

## Build model

`npm run build` copies each product directory to `dist/themes/<id>` or `dist/extensions/<id>`, then re-validates the output. Sources are never mutated. ZIP packaging is intentionally omitted.

## Shared code in extensions

Chrome cannot resolve npm packages at runtime inside unpacked extensions. Shared algorithms used by extensions are either:

- vendored into the product (for example `adhan` UMD for Salah & Sun), or
- reimplemented as local modules under the product `src/` folder, or
- mirrored from `packages/` for tooling/tests only.
