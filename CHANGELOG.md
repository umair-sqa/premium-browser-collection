# Changelog

## 1.0.0 — 2026-11-26

### Added

- Monorepo architecture for Aurevia Studio Premium Browser Collection.
- Six native Chrome themes: Obsidian, Shinobi, Aurora, Nebula, Dev Terminal, Noor.
- Four New Tab extensions: Salah & Sun Companion, Deep Work, DevSpace, Cosmos.
- Shared packages: design tokens, shared utils, extension-core, validation.
- Catalogue (`products/catalog.json`) with automated validation.
- Build pipeline copying independently loadable packages to `dist/`.
- CI workflow for lint, typecheck, validate, test, and build.
- Documentation for architecture, privacy, store readiness, and artwork provenance.

### Changed

- Migrated the existing Obsidian theme from the repository root into `products/themes/obsidian`.
- Preserved original Obsidian artwork under `images/provenance/`.
