import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { isNonEmptyString, isSemverLike, rgbTripletValid, hslTintValid } from "../shared-utils/index.js";

/**
 * Validate a native Chrome theme package directory.
 * @returns {Promise<{ ok: boolean, errors: string[], warnings: string[], name?: string, version?: string }>}
 */
export async function validateThemePackage(productDir) {
  const errors = [];
  const warnings = [];
  const fail = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  let manifest;
  const manifestPath = path.join(productDir, "manifest.json");
  try {
    const { readFile } = await import("node:fs/promises");
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    return { ok: false, errors: [`Unable to parse manifest.json: ${error.message}`], warnings };
  }

  if (manifest.manifest_version !== 3) fail("Native Chrome theme must use manifest_version 3.");
  if (!isNonEmptyString(manifest.name)) fail("manifest.name must be a non-empty string.");
  if (!isSemverLike(manifest.version)) fail("manifest.version must be a valid dotted numeric version.");
  if (!manifest.theme || typeof manifest.theme !== "object") fail("manifest.theme object is required.");

  if (manifest.action || manifest.background || manifest.chrome_url_overrides) {
    fail("Native themes must not include extension-only keys (action/background/chrome_url_overrides).");
  }

  const images = manifest.theme?.images ?? {};
  for (const [key, relativePath] of Object.entries(images)) {
    if (typeof relativePath !== "string" || !relativePath.toLowerCase().endsWith(".png")) {
      fail(`Theme image "${key}" must reference a PNG path.`);
      continue;
    }
    const resolved = path.resolve(productDir, relativePath);
    if (!resolved.startsWith(path.resolve(productDir) + path.sep)) {
      fail(`Theme image "${key}" resolves outside the product directory.`);
      continue;
    }
    try {
      await access(resolved, constants.R_OK);
    } catch {
      fail(`Referenced image does not exist: ${relativePath}`);
    }
  }

  if (!images.theme_frame) warn("theme_frame image is recommended.");
  if (!images.theme_ntp_background) warn("theme_ntp_background image is recommended.");

  for (const [key, rgb] of Object.entries(manifest.theme?.colors ?? {})) {
    if (!rgbTripletValid(rgb)) fail(`Theme color "${key}" must be an RGB integer triplet (0–255).`);
  }

  for (const [key, hsl] of Object.entries(manifest.theme?.tints ?? {})) {
    if (!hslTintValid(hsl)) fail(`Theme tint "${key}" must be an HSL triplet in the 0–1 range.`);
  }

  const requiredColors = ["frame", "toolbar", "tab_text", "ntp_background", "ntp_text"];
  for (const key of requiredColors) {
    if (!manifest.theme?.colors?.[key]) warn(`Missing recommended color: ${key}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    name: manifest.name,
    version: manifest.version,
  };
}
