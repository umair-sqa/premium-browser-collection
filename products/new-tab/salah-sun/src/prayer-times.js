/**
 * Prayer-time facade over vendored adhan (Batoul Apps algorithm).
 * Calculation methods are documented astronomical conventions — not fatwa.
 */
(function (global) {
  "use strict";

  const METHOD_LABELS = {
    MuslimWorldLeague: "Muslim World League",
    Egyptian: "Egyptian General Authority",
    Karachi: "University of Islamic Sciences, Karachi",
    UmmAlQura: "Umm al-Qura, Makkah",
    Dubai: "Dubai",
    MoonsightingCommittee: "Moonsighting Committee",
    NorthAmerica: "ISNA (North America)",
    Kuwait: "Kuwait",
    Qatar: "Qatar",
    Singapore: "Singapore",
    Tehran: "Tehran",
    Turkey: "Turkey / Diyanet",
  };

  function paramsFor(methodName, asrMethod, highLatitudeRule) {
    const adhan = global.adhan;
    if (!adhan) throw new Error("adhan library missing");
    const factory = adhan.CalculationMethod[methodName] || adhan.CalculationMethod.MuslimWorldLeague;
    const params = factory();
    params.madhab = asrMethod === "Hanafi" ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
    const rule = adhan.HighLatitudeRule[highLatitudeRule] || adhan.HighLatitudeRule.MiddleOfTheNight;
    params.highLatitudeRule = rule;
    return params;
  }

  function compute({ latitude, longitude, date, calculationMethod, asrMethod, highLatitudeRule }) {
    const adhan = global.adhan;
    const coordinates = new adhan.Coordinates(Number(latitude), Number(longitude));
    const params = paramsFor(calculationMethod, asrMethod, highLatitudeRule);
    const d = date || new Date();
    const times = new adhan.PrayerTimes(coordinates, d, params);
    const qibla = adhan.Qibla(coordinates);
    return {
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      sunset: times.sunset,
      maghrib: times.maghrib,
      isha: times.isha,
      qibla,
      methodLabel: METHOD_LABELS[calculationMethod] || calculationMethod,
      current: times.currentPrayer(),
      next: times.nextPrayer(),
      timeFor: (name) => times.timeForPrayer(name),
    };
  }

  /** Algorithmic Hijri approximation (Kuwaiti). Not an official religious calendar. */
  function gregorianToHijri(date) {
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
    const l3 =
      l2 -
      Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
      29;
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
      formatted: hd + " " + (months[hm - 1] || hm) + " " + hy + " AH",
      approximation: true,
    };
  }

  global.SalahSunPrayer = { compute, gregorianToHijri, METHOD_LABELS };
})(typeof self !== "undefined" ? self : globalThis);
