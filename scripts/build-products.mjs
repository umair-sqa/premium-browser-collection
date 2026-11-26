#!/usr/bin/env node
/**
 * Build products into dist/ without mutating sources.
 * Themes and extensions are copied as independently loadable Chrome packages.
 * ZIP archives are intentionally not generated.
 */
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog } from "../packages/validation/catalog.js";
import { validateThemePackage } from "../packages/validation/theme.js";
import { validateExtensionPackage } from "../packages/validation/extension.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filter = process.argv[2];
const distRoot = path.join(root, "dist");

const { catalog, ok, errors } = await validateCatalog(root);
if (!ok) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

await mkdir(distRoot, { recursive: true });

let failed = false;
const built = [];

for (const product of catalog.products) {
  if (filter && product.id !== filter) continue;
  const src = path.join(root, product.directory);
  const out = path.join(root, product.build.outDir);
  await rm(out, { recursive: true, force: true });
  await mkdir(path.dirname(out), { recursive: true });
  await cp(src, out, {
    recursive: true,
    filter: (p) => !p.includes(`${path.sep}node_modules`) && !p.includes(`${path.sep}provenance`),
  });

  const result =
    product.type === "theme"
      ? await validateThemePackage(out)
      : await validateExtensionPackage(out);

  if (!result.ok) {
    failed = true;
    console.error(`Build validation failed for ${product.id}`);
    for (const e of result.errors) console.error(`  ${e}`);
  } else {
    console.log(`Built ${product.id} → ${product.build.outDir}`);
    built.push({ id: product.id, outDir: product.build.outDir, version: product.version });
  }
}

await writeFile(
  path.join(distRoot, "build-manifest.json"),
  JSON.stringify({ builtAt: new Date().toISOString(), products: built }, null, 2),
);

process.exit(failed ? 1 : 0);
