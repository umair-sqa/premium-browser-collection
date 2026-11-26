# Aurevia Studio design system

Shared tokens live in `packages/design-tokens/`.

## Principles

- Premium collection cohesion without identical product UIs.
- Strong hierarchy, readable contrast, deliberate whitespace.
- Motion supports presence (fade/transform); honour `prefers-reduced-motion`.
- Avoid generic AI dashboard tropes (purple-on-white kits, excessive glow, emoji clutter).

## Token categories

- Colour neutrals + semantic status colours
- Product accent/background pairs
- Typography: display serif, UI sans, mono
- Spacing, radius, shadow, surface hierarchy
- Accessibility minima (contrast, focus ring, hit targets)

## Product identity

Each product owns its palette and artwork. Shared panel primitives in `packages/shared-ui/panel.css` may be copied into extensions when useful; Chrome packages remain self-contained.
