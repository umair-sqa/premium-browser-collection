/**
 * chrome.storage.local helper with defaults for Cosmos — Aurevia Studio.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "cosmosSettings";

  const DEFAULT_CITIES = Object.freeze([
    { id: "utc", label: "UTC", timeZone: "UTC" },
    { id: "nyc", label: "New York", timeZone: "America/New_York" },
    { id: "lon", label: "London", timeZone: "Europe/London" },
    { id: "tyo", label: "Tokyo", timeZone: "Asia/Tokyo" },
    { id: "dxb", label: "Dubai", timeZone: "Asia/Dubai" },
  ]);

  const DEFAULTS = Object.freeze({
    background: "image",
    latitude: null,
    longitude: null,
    placeName: "",
    weatherEnabled: false,
    cities: DEFAULT_CITIES.map((c) => ({ ...c })),
    widgets: {
      worldClocks: true,
      calendar: true,
      astronomy: true,
      planets: true,
      facts: true,
      weather: true,
    },
  });

  const BACKGROUND_PRESETS = Object.freeze({
    image: {
      id: "image",
      label: "Default nebula image",
      type: "image",
    },
    void: {
      id: "void",
      label: "Deep void gradient",
      type: "gradient",
    },
    aurora: {
      id: "aurora",
      label: "Polar aurora gradient",
      type: "gradient",
    },
  });

  async function getSettings() {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          const stored = result[STORAGE_KEY] || {};
          const merged = {
            ...DEFAULTS,
            ...stored,
            widgets: { ...DEFAULTS.widgets, ...(stored.widgets || {}) },
            cities:
              Array.isArray(stored.cities) && stored.cities.length > 0
                ? stored.cities
                : DEFAULTS.cities.map((c) => ({ ...c })),
          };
          resolve(merged);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function saveSettings(partial) {
    const current = await getSettings();
    const next = {
      ...current,
      ...partial,
      widgets: {
        ...current.widgets,
        ...(partial.widgets || {}),
      },
    };
    if (partial.cities) {
      next.cities = partial.cities;
    }
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
      Number.isFinite(settings.longitude) &&
      settings.latitude >= -90 &&
      settings.latitude <= 90 &&
      settings.longitude >= -180 &&
      settings.longitude <= 180
    );
  }

  global.CosmosStorage = {
    STORAGE_KEY,
    DEFAULTS,
    DEFAULT_CITIES,
    BACKGROUND_PRESETS,
    getSettings,
    saveSettings,
    hasLocation,
  };
})(typeof self !== "undefined" ? self : globalThis);
