import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  fail(`Unable to parse manifest.json: ${error.message}`);
  process.exit(1);
}

if (manifest.manifest_version !== 3) {
  fail("Native Chrome theme must use manifest_version 3.");
}
if (typeof manifest.name !== "string" || !manifest.name.trim()) {
  fail("manifest.name must be a non-empty string.");
}
if (typeof manifest.version !== "string" || !/^\\d+(\\.\\d+){0,3}$/.test(manifest.version)) {
  fail("manifest.version must be a valid dotted numeric version.");
}
if (!manifest.theme || typeof manifest.theme !== "object") {
  fail("manifest.theme object is required.");
}

const images = manifest.theme?.images ?? {};
for (const [key, relativePath] of Object.entries(images)) {
  if (typeof relativePath !== "string" || !relativePath.toLowerCase().endsWith(".png")) {
    fail(`Theme image "${key}" must reference a PNG path.`);
    continue;
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep)) {
    fail(`Theme image "${key}" resolves outside the repository.`);
    continue;
  }
  try {
    await access(resolved, constants.R_OK);
  } catch {
    fail(`Referenced image does not exist or cannot be read: ${relativePath}`);
  }
}

for (const [key, rgb] of Object.entries(manifest.theme?.colors ?? {})) {
  if (!Array.isArray(rgb) || rgb.length !== 3 ||
      rgb.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
    fail(`Theme color "${key}" must be an RGB integer triplet (0–255).`);
  }
}

for (const [key, hsl] of Object.entries(manifest.theme?.tints ?? {})) {
  if (!Array.isArray(hsl) || hsl.length !== 3 ||
      hsl.some((channel) => typeof channel !== "number" || channel < 0 || channel > 1)) {
    fail(`Theme tint "${key}" must be an HSL triplet in the 0–1 range.`);
  }
}

if (process.exitCode) {
  console.error("Theme validation failed.");
} else {
  console.log(`Theme validation passed: ${manifest.name} v${manifest.version}`);
}
