/**
 * @aurevia/shared-utils — small helpers shared by build tooling and tests.
 * Extensions vendor their own copies where needed (Chrome cannot import packages at runtime).
 */

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSemverLike(version) {
  return typeof version === "string" && /^\d+(\.\d+){0,3}$/.test(version);
}

export function rgbTripletValid(rgb) {
  return (
    Array.isArray(rgb) &&
    rgb.length === 3 &&
    rgb.every((c) => Number.isInteger(c) && c >= 0 && c <= 255)
  );
}

export function hslTintValid(hsl) {
  return (
    Array.isArray(hsl) &&
    hsl.length === 3 &&
    hsl.every((c) => typeof c === "number" && c >= 0 && c <= 1)
  );
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatTime(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function formatDate(date = new Date(), locale = undefined) {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/**
 * Approximate algorithmic Hijri date (Kuwaiti algorithm).
 * Educational approximation — not an official religious calendar authority.
 */
export function gregorianToHijri(date = new Date()) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const jul =
    Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
    Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
    gd -
    32075;
  const l = jul - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  const months = [
    "Muharram",
    "Safar",
    "Rabiʻ I",
    "Rabiʻ II",
    "Jumada I",
    "Jumada II",
    "Rajab",
    "Shaʻban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qaʻdah",
    "Dhu al-Hijjah",
  ];
  return {
    year: hy,
    month: hm,
    day: hd,
    monthName: months[hm - 1] ?? String(hm),
    formatted: `${hd} ${months[hm - 1] ?? hm} ${hy} AH`,
    approximation: true,
  };
}

/** Qibla bearing in degrees from north (0–360). */
export function qiblaBearing(lat, lng) {
  const kaabaLat = (21.4225 * Math.PI) / 180;
  const kaabaLng = (39.8262 * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  const Δλ = kaabaLng - (lng * Math.PI) / 180;
  const y = Math.sin(Δλ);
  const x = Math.cos(φ) * Math.tan(kaabaLat) - Math.sin(φ) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

/** Moon illumination fraction 0–1 and phase name (approximate). */
export function moonPhase(date = new Date()) {
  const synodic = 29.53058867;
  const knownNew = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNew) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const fraction = (1 - Math.cos((2 * Math.PI * age) / synodic)) / 2;
  let name = "Waxing Crescent";
  if (age < 1.84566) name = "New Moon";
  else if (age < 5.53699) name = "Waxing Crescent";
  else if (age < 9.22831) name = "First Quarter";
  else if (age < 12.91963) name = "Waxing Gibbous";
  else if (age < 16.61096) name = "Full Moon";
  else if (age < 20.30228) name = "Waning Gibbous";
  else if (age < 23.99361) name = "Last Quarter";
  else if (age < 27.68493) name = "Waning Crescent";
  else name = "New Moon";
  return { age, fraction, name, approximation: true };
}
