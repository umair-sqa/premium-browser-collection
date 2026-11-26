import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { isNonEmptyString, isSemverLike } from "../shared-utils/index.js";

const ALLOWED_PERMISSIONS = new Set([
  "storage",
  "alarms",
  "notifications",
  "unlimitedStorage",
  "activeTab",
]);

/**
 * Validate a Manifest V3 New Tab extension package directory.
 */
export async function validateExtensionPackage(productDir) {
  const errors = [];
  const warnings = [];
  const fail = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  let manifest;
  try {
    manifest = JSON.parse(await readFile(path.join(productDir, "manifest.json"), "utf8"));
  } catch (error) {
    return { ok: false, errors: [`Unable to parse manifest.json: ${error.message}`], warnings };
  }

  if (manifest.manifest_version !== 3) fail("Extension must use Manifest V3.");
  if (!isNonEmptyString(manifest.name)) fail("manifest.name must be a non-empty string.");
  if (!isSemverLike(manifest.version)) fail("manifest.version must be a valid dotted numeric version.");
  if (manifest.theme) fail("New Tab extensions must not include a native theme object.");

  const override = manifest.chrome_url_overrides?.newtab;
  if (!isNonEmptyString(override)) {
    fail("chrome_url_overrides.newtab is required.");
  } else {
    await ensureReadable(productDir, override, fail);
  }

  for (const [size, iconPath] of Object.entries(manifest.icons ?? {})) {
    await ensureReadable(productDir, iconPath, fail, `icon ${size}`);
  }
  if (!manifest.icons || Object.keys(manifest.icons).length === 0) {
    warn("No icons defined.");
  }

  for (const perm of manifest.permissions ?? []) {
    if (!ALLOWED_PERMISSIONS.has(perm)) {
      warn(`Permission "${perm}" is unusual — justify in privacy docs.`);
    }
  }

  if (manifest.background?.service_worker) {
    await ensureReadable(productDir, manifest.background.service_worker, fail, "service_worker");
  }

  // Scan HTML for remote script tags
  if (override) {
    try {
      const html = await readFile(path.join(productDir, override), "utf8");
      if (/<script[^>]+src=["']https?:/i.test(html)) {
        fail("Remote script tags are not allowed (security/privacy).");
      }
      const scriptSrcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
      for (const src of scriptSrcs) {
        if (src.startsWith("http")) continue;
        await ensureReadable(productDir, src, fail, `script ${src}`);
      }
      const cssHrefs = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/gi)].map((m) => m[1]);
      for (const href of cssHrefs) {
        if (href.startsWith("http")) {
          warn(`Remote stylesheet: ${href}`);
          continue;
        }
        await ensureReadable(productDir, href, fail, `stylesheet ${href}`);
      }
    } catch {
      /* already reported missing override */
    }
  }

  // Credential leak heuristics in JS files
  const { readdir } = await import("node:fs/promises");
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === "store") continue;
        await walk(p);
      } else if (/\.(js|mjs|ts|json|html)$/i.test(e.name)) {
        const text = await readFile(p, "utf8");
        if (/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}/i.test(text)) {
          fail(`Possible credential literal in ${path.relative(productDir, p)}`);
        }
      }
    }
  }
  await walk(productDir);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    name: manifest.name,
    version: manifest.version,
  };
}

async function ensureReadable(root, relativePath, fail, label = relativePath) {
  if (typeof relativePath !== "string") {
    fail(`Invalid path for ${label}`);
    return;
  }
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) {
    fail(`${label} resolves outside the product directory.`);
    return;
  }
  try {
    await access(resolved, constants.R_OK);
  } catch {
    fail(`Missing file for ${label}: ${relativePath}`);
  }
}
