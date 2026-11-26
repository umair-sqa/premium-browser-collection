(function (global) {
  "use strict";
  const KEY = "salahSunSettings";
  const DEFAULTS = Object.freeze({
    placeName: "",
    latitude: null,
    longitude: null,
    calculationMethod: "MuslimWorldLeague",
    asrMethod: "Shafi",
    highLatitudeRule: "MiddleOfTheNight",
    remindersEnabled: false,
    reminderMinutes: 10,
  });

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  async function getSettings() {
    return new Promise((resolve) => {
      if (!global.chrome?.storage?.local) {
        resolve(clone(DEFAULTS));
        return;
      }
      chrome.storage.local.get([KEY], (res) => {
        resolve({ ...clone(DEFAULTS), ...(res[KEY] || {}) });
      });
    });
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const next = { ...current, ...partial };
    return new Promise((resolve) => {
      if (!global.chrome?.storage?.local) {
        resolve(next);
        return;
      }
      chrome.storage.local.set({ [KEY]: next }, () => resolve(next));
    });
  }

  global.SalahSunStorage = { KEY, DEFAULTS, getSettings, saveSettings };
})(typeof self !== "undefined" ? self : globalThis);
