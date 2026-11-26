import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateThemePackage } from "../../packages/validation/theme.js";
import { validateCatalog } from "../../packages/validation/catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("theme validation integration", () => {
  it("validates every theme package in the catalogue", async () => {
    const { catalog } = await validateCatalog(root);
    const themes = catalog.products.filter((p) => p.type === "theme");
    expect(themes.length).toBe(6);
    for (const theme of themes) {
      const result = await validateThemePackage(path.join(root, theme.directory));
      expect(result.ok, `${theme.id}: ${result.errors.join("; ")}`).toBe(true);
    }
  });
});
