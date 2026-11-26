import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "../../packages/validation/catalog.js";
import { validateThemePackage } from "../../packages/validation/theme.js";
import { validateExtensionPackage } from "../../packages/validation/extension.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("architecture", () => {
  it("catalogue lists ten products with valid directories", async () => {
    const result = await validateCatalog(root);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.count).toBe(10);
  });

  it("keeps themes and extensions isolated by type rules", async () => {
    const { catalog } = await validateCatalog(root);
    for (const product of catalog.products) {
      const dir = path.join(root, product.directory);
      if (product.type === "theme") {
        const r = await validateThemePackage(dir);
        expect(r.ok, `${product.id}: ${r.errors.join("; ")}`).toBe(true);
      } else {
        const ext = await validateExtensionPackage(dir);
        expect(ext.ok, `${product.id}: ${ext.errors.join("; ")}`).toBe(true);
        expect(product.category).toBe("new-tab");
        expect(dir).toContain("new-tab");
      }
    }
  });

  it("does not place extension packages under themes/", async () => {
    const { catalog } = await validateCatalog(root);
    for (const product of catalog.products) {
      if (product.type === "extension") {
        expect(product.directory.startsWith("products/new-tab/")).toBe(true);
      }
      if (product.type === "theme") {
        expect(product.directory.startsWith("products/themes/")).toBe(true);
      }
    }
  });
});
