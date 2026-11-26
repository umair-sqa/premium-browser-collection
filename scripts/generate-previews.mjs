#!/usr/bin/env node
/**
 * Regenerate store preview tiles from product NTP / background artwork when present.
 * Does not invent missing source artwork.
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { validateCatalog } from "../packages/validation/catalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { catalog, ok, errors } = await validateCatalog(root);
if (!ok) {
  for (const e of errors) console.error(e);
  process.exit(1);
}

for (const product of catalog.products) {
  const dir = path.join(root, product.directory);
  const source =
    product.type === "theme"
      ? path.join(dir, "images/theme_ntp_background.png")
      : path.join(dir, "assets/background.jpg");
  try {
    await access(source);
  } catch {
    console.warn(`SKIP previews for ${product.id}: source artwork missing`);
    continue;
  }
  const storeDir = path.join(dir, "store");
  await sharp(source).resize(1280, 800, { fit: "cover" }).png().toFile(path.join(storeDir, product.type === "theme" ? "preview-1280x800.png" : "screenshot-1280x800.png"));
  await sharp(source).resize(440, 280, { fit: "cover" }).png().toFile(path.join(storeDir, product.type === "theme" ? "tile-440x280.png" : "promo-small.png"));
  console.log(`Previews refreshed: ${product.id}`);
}
