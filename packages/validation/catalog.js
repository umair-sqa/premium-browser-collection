import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { isNonEmptyString, isSemverLike } from "../shared-utils/index.js";

const REQUIRED_FIELDS = [
  "id",
  "name",
  "type",
  "category",
  "description",
  "version",
  "directory",
  "brandIdentity",
  "permissions",
  "assets",
  "build",
  "releaseStatus",
];

/**
 * Validate products/catalog.json against the repository tree.
 */
export async function validateCatalog(repoRoot) {
  const errors = [];
  const warnings = [];
  const catalogPath = path.join(repoRoot, "products/catalog.json");
  let catalog;
  try {
    catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`Unable to parse catalog.json: ${error.message}`], warnings };
  }

  if (!Array.isArray(catalog.products) || catalog.products.length === 0) {
    errors.push("catalog.products must be a non-empty array.");
    return { ok: false, errors, warnings };
  }

  const ids = new Set();
  for (const product of catalog.products) {
    for (const field of REQUIRED_FIELDS) {
      if (product[field] === undefined || product[field] === null) {
        errors.push(`Product missing required field "${field}": ${product.id ?? "(unknown)"}`);
      }
    }
    if (!isNonEmptyString(product.id)) errors.push("Product id must be a non-empty string.");
    else if (ids.has(product.id)) errors.push(`Duplicate product id: ${product.id}`);
    else ids.add(product.id);

    if (!isSemverLike(product.version)) {
      errors.push(`Invalid version for ${product.id}: ${product.version}`);
    }

    if (!["theme", "extension"].includes(product.type)) {
      errors.push(`Invalid type for ${product.id}: ${product.type}`);
    }

    const dir = path.join(repoRoot, product.directory);
    try {
      await access(dir, constants.R_OK);
    } catch {
      errors.push(`Directory missing for ${product.id}: ${product.directory}`);
      continue;
    }

    try {
      await access(path.join(dir, "manifest.json"), constants.R_OK);
    } catch {
      errors.push(`manifest.json missing for ${product.id}`);
    }

    if (!product.build?.outDir) {
      warnings.push(`build.outDir missing for ${product.id}`);
    }
  }

  const expected = 10;
  if (catalog.products.length !== expected) {
    warnings.push(`Expected ${expected} products, found ${catalog.products.length}.`);
  }

  return { ok: errors.length === 0, errors, warnings, count: catalog.products.length, catalog };
}
