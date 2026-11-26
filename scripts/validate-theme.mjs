#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateThemePackage } from "../packages/validation/theme.js";
import { validateCatalog } from "../packages/validation/catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const filter = process.argv[2];

const { catalog, ok: catalogOk, errors: catalogErrors } = await validateCatalog(root);
if (!catalogOk) {
  for (const e of catalogErrors) console.error(`FAIL: ${e}`);
  process.exit(1);
}

const themes = catalog.products.filter((p) => p.type === "theme");
let failed = false;

for (const product of themes) {
  if (filter && product.id !== filter && !product.directory.includes(filter)) continue;
  const dir = path.join(root, product.directory);
  const result = await validateThemePackage(dir);
  if (result.ok) {
    console.log(`PASS: ${result.name} v${result.version}`);
    for (const w of result.warnings) console.warn(`  WARN: ${w}`);
  } else {
    failed = true;
    console.error(`FAIL: ${product.id}`);
    for (const e of result.errors) console.error(`  ${e}`);
  }
}

process.exit(failed ? 1 : 0);
