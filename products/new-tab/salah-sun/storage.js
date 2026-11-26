/**
 * chrome.storage.local helper with defaults for Salah & Sun Companion.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "salahSunSettings";

  const DEFAULTS = Object.freeze({
    latitude: null,
    longitude: null,
    placeName: "",
    calculationMethod: "MuslimWorldLeague",
    asrMethod: "Shafi",
    highLatitudeRule: "MiddleOfTheNight",
    remindersEnabled: false,
    reminderMinutesBefore: 10,
  });

  const METHOD_LABELS = Object.freeze({
    MuslimWorldLeague: "Muslim World League (MWL)",
    NorthAmerica: "ISNA (North America)",
    Egyptian: "Egyptian General Authority",
    UmmAlQura: "Umm al-Qura (Makkah)",
    Karachi: "University of Islamic Sciences, Karachi",
    Dubai: "Dubai",
    Qatar: "Qatar",
    Kuwait: "Kuwait",
    MoonsightingCommittee: "Moonsighting Committee",
    Singapore: "Singapore",
    Turkey: "Turkey (Diyanet approx.)",
    Tehran: "Tehran",
  });

  const HIGH_LAT_LABELS = Object.freeze({
    MiddleOfTheNight: "Middle of the night",
    SeventhOfTheNight: "1/7 of the night",
    TwilightAngle: "Twilight angle",
  });

  async function getSettings() {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve({ ...DEFAULTS, ...(result[STORAGE_KEY] || {}) });
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const next = { ...current, ...partial };
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(next);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  function hasLocation(settings) {
    return (
      settings &&
      typeof settings.latitude === "number" &&
      typeof settings.longitude === "number" &&
      Number.isFinite(settings.latitude) &&
      Number.isFinite(settings.longitude)
    );
  }

  global.SalahSunStorage = {
    STORAGE_KEY,
    DEFAULTS,
    METHOD_LABELS,
    HIGH_LAT_LABELS,
    getSettings,
    saveSettings,
    hasLocation,
  };
})(typeof self !== "undefined" ? self : globalThis);
