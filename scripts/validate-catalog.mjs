#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "../packages/validation/catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await validateCatalog(root);

if (result.ok) {
  console.log(`Catalog validation passed (${result.count} products).`);
  for (const w of result.warnings) console.warn(`WARN: ${w}`);
  process.exit(0);
}

console.error("Catalog validation failed.");
for (const e of result.errors) console.error(`FAIL: ${e}`);
process.exit(1);
