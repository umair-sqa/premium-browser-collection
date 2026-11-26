/**
 * Prayer-times facade over the vendored adhan UMD build (vendor/adhan.umd.min.js).
 * Exposes calculation helpers, Qibla bearing, and a simple algorithmic Hijri date.
 *
 * Hijri conversion is algorithmic (Kuwaiti/algorithmic civil calendar style) —
 * an approximation, not official Umm al-Qura calendar dates.
 */
(function (global) {
  "use strict";

  const KAABA = { latitude: 21.4225, longitude: 39.8262 };

  const METHOD_MAP = {
    MuslimWorldLeague: "MuslimWorldLeague",
    NorthAmerica: "NorthAmerica",
    Egyptian: "Egyptian",
    UmmAlQura: "UmmAlQura",
    Karachi: "Karachi",
    Dubai: "Dubai",
    Qatar: "Qatar",
    Kuwait: "Kuwait",
    MoonsightingCommittee: "MoonsightingCommittee",
    Singapore: "Singapore",
    Turkey: "Turkey",
    Tehran: "Tehran",
  };

  function requireAdhan() {
    if (!global.adhan) {
      throw new Error("adhan library not loaded. Include vendor/adhan.umd.min.js first.");
    }
    return global.adhan;
  }

  function buildParams(methodKey, asrMethod, highLatitudeRule) {
    const adhan = requireAdhan();
    const key = METHOD_MAP[methodKey] || "MuslimWorldLeague";
    const factory = adhan.CalculationMethod[key];
    if (typeof factory !== "function") {
      throw new Error("Unknown calculation method: " + methodKey);
    }
    const params = factory();
    params.madhab =
      asrMethod === "Hanafi" ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

    const hl = highLatitudeRule || "MiddleOfTheNight";
    if (adhan.HighLatitudeRule[hl]) {
      params.highLatitudeRule = adhan.HighLatitudeRule[hl];
    }
    return params;
  }

  /**
   * Compute prayer + sun times for a local calendar day.
   * Times are Date objects in the user's local timezone (via Intl/Date).
   */
  function asDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    // Cross-realm Date objects (e.g. tests) still expose getTime
    if (value && typeof value.getTime === "function") {
      const t = value.getTime();
      if (typeof t === "number" && !Number.isNaN(t)) return new Date(t);
    }
    return new Date();
  }

  function computePrayerTimes(latitude, longitude, date, options) {
    const adhan = requireAdhan();
    const opts = options || {};
    const coordinates = new adhan.Coordinates(latitude, longitude);
    const params = buildParams(
      opts.calculationMethod,
      opts.asrMethod,
      opts.highLatitudeRule
    );
    const day = asDate(date);
    const prayerTimes = new adhan.PrayerTimes(coordinates, day, params);

    return {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      sunset: prayerTimes.sunset,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      current: prayerTimes.currentPrayer(day),
      next: prayerTimes.nextPrayer(day),
      method: opts.calculationMethod || "MuslimWorldLeague",
      asrMethod: opts.asrMethod || "Shafi",
      highLatitudeRule: opts.highLatitudeRule || "MiddleOfTheNight",
      _raw: prayerTimes,
    };
  }

  /** Bearing in degrees from observer to Kaaba (0–360, clockwise from north). */
  function qiblaBearing(latitude, longitude) {
    const adhan = requireAdhan();
    const coordinates = new adhan.Coordinates(latitude, longitude);
    if (typeof adhan.Qibla === "function") {
      return adhan.Qibla(coordinates);
    }
    // Fallback spherical formula (same as adhan)
    const φ1 = (latitude * Math.PI) / 180;
    const φ2 = (KAABA.latitude * Math.PI) / 180;
    const Δλ = ((KAABA.longitude - longitude) * Math.PI) / 180;
    const y = Math.sin(Δλ);
    const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  /**
   * Algorithmic Gregorian → Hijri (civil / Kuwaiti algorithm).
   * Approximate — not official Umm al-Qura. Documented as such in the UI.
   */
  function toHijri(date) {
    const d = asDate(date);
    let day = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();

    let jd;
    if (
      year > 1582 ||
      (year === 1582 && month > 10) ||
      (year === 1582 && month === 10 && day > 14)
    ) {
      jd =
        Math.trunc((1461 * (year + 4800 + Math.trunc((month - 14) / 12))) / 4) +
        Math.trunc((367 * (month - 2 - 12 * Math.trunc((month - 14) / 12))) / 12) -
        Math.trunc(
          (3 *
            Math.trunc(
              (year + 4900 + Math.trunc((month - 14) / 12)) / 100
            )) /
            4
        ) +
        day -
        32075;
    } else {
      jd =
        367 * year -
        Math.trunc((7 * (year + 5001 + Math.trunc((month - 9) / 7))) / 4) +
        Math.trunc((275 * month) / 9) +
        day +
        1729777;
    }

    const l = jd - 1948440 + 10632;
    const n = Math.trunc((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j =
      Math.trunc((10985 - l2) / 5316) * Math.trunc((50 * l2) / 17719) +
      Math.trunc(l2 / 5670) * Math.trunc((43 * l2) / 15238);
    const l3 =
      l2 -
      Math.trunc((30 - j) / 15) * Math.trunc((17719 * j) / 50) -
      Math.trunc(j / 16) * Math.trunc((15238 * j) / 43) +
      29;
    const m = Math.trunc((24 * l3) / 709);
    const hijriDay = l3 - Math.trunc((709 * m) / 24);
    const hijriMonth = m;
    const hijriYear = 30 * n + j - 30;

    const monthNames = [
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
      "Dhū al-Qaʻdah",
      "Dhū al-Ḥijjah",
    ];

    return {
      day: hijriDay,
      month: hijriMonth,
      year: hijriYear,
      monthName: monthNames[hijriMonth - 1] || "",
      formatted:
        hijriDay +
        " " +
        (monthNames[hijriMonth - 1] || "") +
        " " +
        hijriYear +
        " AH",
      approximate: true,
    };
  }

  const PRAYER_ORDER = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  const SALAH_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

  const PRAYER_LABELS = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    sunset: "Sunset",
    maghrib: "Maghrib",
    isha: "Isha",
    none: "—",
  };

  global.SalahSunPrayer = {
    KAABA,
    METHOD_MAP,
    PRAYER_ORDER,
    SALAH_ORDER,
    PRAYER_LABELS,
    computePrayerTimes,
    qiblaBearing,
    toHijri,
  };
})(typeof self !== "undefined" ? self : globalThis);
