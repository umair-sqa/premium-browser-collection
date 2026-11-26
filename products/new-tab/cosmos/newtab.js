/**
 * Cosmos — Aurevia Studio new tab logic.
 * All astronomy here is approximate / educational and computed locally
 * except optional Open-Meteo weather when explicitly enabled.
 */
(function () {
  "use strict";

  const PLANETS = Object.freeze([
    {
      name: "Mercury",
      blurb:
        "Innermost planet. Educational note: mean distance ≈ 0.39 AU from the Sun; no thick atmosphere.",
    },
    {
      name: "Venus",
      blurb:
        "Second from the Sun ≈ 0.72 AU. Educational: dense CO₂ atmosphere and a slow retrograde rotation.",
    },
    {
      name: "Earth",
      blurb:
        "Third planet ≈ 1 AU. Educational: the only world known to host abundant liquid water and life.",
    },
    {
      name: "Mars",
      blurb:
        "Fourth ≈ 1.52 AU. Educational: thin atmosphere, polar ice, and a day length near Earth’s.",
    },
    {
      name: "Jupiter",
      blurb:
        "Fifth ≈ 5.2 AU. Educational: largest planet; a gas giant with a strong magnetic field.",
    },
    {
      name: "Saturn",
      blurb:
        "Sixth ≈ 9.5 AU. Educational: famous ring system of ice and rock particles.",
    },
    {
      name: "Uranus",
      blurb:
        "Seventh ≈ 19.2 AU. Educational: ice giant tilted on its side relative to its orbit.",
    },
    {
      name: "Neptune",
      blurb:
        "Eighth ≈ 30.1 AU. Educational: distant ice giant with the strongest sustained winds.",
    },
  ]);

  const CELESTIAL_FACTS = Object.freeze([
    {
      text: "A light-year is the distance light travels in one Julian year — about 9.46 trillion kilometres. Educational context only; not a live ranging measurement.",
      tag: "Educational · distance scales",
    },
    {
      text: "The Moon’s synodic month (new moon to new moon) averages about 29.53 days. Phase shown here is computed locally from that cycle.",
      tag: "Educational · lunar cycle",
    },
    {
      text: "Polaris sits near the north celestial pole today, but precession slowly shifts which star marks that point over millennia.",
      tag: "Educational · celestial poles",
    },
    {
      text: "The ecliptic is the Sun’s apparent yearly path against the background stars — the plane of Earth’s orbit projected on the sky.",
      tag: "Educational · ecliptic",
    },
    {
      text: "Auroras occur when charged particles from the solar wind excite gases in Earth’s upper atmosphere near the magnetic poles.",
      tag: "Educational · space weather concepts",
    },
    {
      text: "There are 88 officially recognised constellations. Their shapes are cultural sky maps, not physical groupings of stars.",
      tag: "Educational · constellations",
    },
    {
      text: "Meteor showers happen when Earth crosses dusty debris streams left by comets; rates vary year to year.",
      tag: "Educational · meteors",
    },
    {
      text: "Saturn’s rings are broad but thin — typically only tens of metres thick in many regions, despite spanning hundreds of thousands of kilometres.",
      tag: "Educational · planetary rings",
    },
  ]);

  const WMO = Object.freeze({
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  });

  const els = {
    body: document.body,
    clockTime: document.getElementById("clock-time"),
    clockDate: document.getElementById("clock-date"),
    clockMeta: document.getElementById("clock-meta"),
    worldList: document.getElementById("world-clocks-list"),
    calLabel: document.getElementById("cal-label"),
    calGrid: document.getElementById("cal-grid"),
    calPrev: document.getElementById("cal-prev"),
    calNext: document.getElementById("cal-next"),
    moonVisual: document.getElementById("moon-visual"),
    moonName: document.getElementById("moon-name"),
    moonDetail: document.getElementById("moon-detail"),
    sunTimes: document.getElementById("sun-times"),
    sunNote: document.getElementById("sun-note"),
    seasonValue: document.getElementById("season-value"),
    doyValue: document.getElementById("doy-value"),
    planetsList: document.getElementById("planets-list"),
    factText: document.getElementById("fact-text"),
    factTag: document.getElementById("fact-tag"),
    factNext: document.getElementById("fact-next"),
    weatherBody: document.getElementById("weather-body"),
    settingsOpen: document.getElementById("settings-open"),
    settingsClose: document.getElementById("settings-close"),
    settingsPanel: document.getElementById("settings-panel"),
    settingsBackdrop: document.getElementById("settings-backdrop"),
    settingsForm: document.getElementById("settings-form"),
    settingsReset: document.getElementById("settings-reset"),
    settingsCities: document.getElementById("settings-cities"),
    settingsLat: document.getElementById("settings-lat"),
    settingsLng: document.getElementById("settings-lng"),
    settingsPlace: document.getElementById("settings-place"),
    settingsWeather: document.getElementById("settings-weather"),
  };

  let settings = null;
  let viewYear;
  let viewMonth;
  let factIndex = 0;
  let clockTimer = null;
  let lastFocused = null;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function toRad(d) {
    return (d * Math.PI) / 180;
  }

  function toDeg(r) {
    return (r * 180) / Math.PI;
  }

  /** Julian Day Number (UTC) for a Date. */
  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  /**
   * Approximate moon phase from synodic month.
   * Reference new moon: 2000-01-06 18:14 UTC (JD ≈ 2451550.1).
   */
  function getMoonPhase(date) {
    const synodic = 29.530588853;
    const knownNew = 2451550.1;
    const jd = julianDay(date);
    const age = ((jd - knownNew) % synodic + synodic) % synodic;
    const illumination = 0.5 * (1 - Math.cos((2 * Math.PI * age) / synodic));
    const pct = Math.round(illumination * 100);
    let phaseKey;
    let name;
    if (age < 1.84566) {
      phaseKey = "new";
      name = "New Moon";
    } else if (age < 5.53699) {
      phaseKey = "waxing-crescent";
      name = "Waxing Crescent";
    } else if (age < 9.22831) {
      phaseKey = "first-quarter";
      name = "First Quarter";
    } else if (age < 12.91963) {
      phaseKey = "waxing-gibbous";
      name = "Waxing Gibbous";
    } else if (age < 16.61096) {
      phaseKey = "full";
      name = "Full Moon";
    } else if (age < 20.30228) {
      phaseKey = "waning-gibbous";
      name = "Waning Gibbous";
    } else if (age < 23.99361) {
      phaseKey = "last-quarter";
      name = "Last Quarter";
    } else if (age < 27.68493) {
      phaseKey = "waning-crescent";
      name = "Waning Crescent";
    } else {
      phaseKey = "new";
      name = "New Moon";
    }
    return { age, pct, phaseKey, name };
  }

  /**
   * Approximate sunrise/sunset using a simplified solar position algorithm
   * (educational / NOAA-style zenith 90.833°). Not for navigation.
   */
  function getSunTimes(date, lat, lng) {
    const rad = Math.PI / 180;
    const day =
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        Date.UTC(date.getFullYear(), 0, 0)) /
      86400000;

    function calc(isRise) {
      const lngHour = lng / 15;
      const t = isRise ? day + (6 - lngHour) / 24 : day + (18 - lngHour) / 24;
      const M = 0.9856 * t - 3.289;
      let L =
        M +
        1.916 * Math.sin(M * rad) +
        0.02 * Math.sin(2 * M * rad) +
        282.634;
      L = ((L % 360) + 360) % 360;
      let RA = toDeg(Math.atan(0.91764 * Math.tan(L * rad)));
      RA = ((RA % 360) + 360) % 360;
      const Lquadrant = Math.floor(L / 90) * 90;
      const RAquadrant = Math.floor(RA / 90) * 90;
      RA = (RA + (Lquadrant - RAquadrant)) / 15;
      const sinDec = 0.39782 * Math.sin(L * rad);
      const cosDec = Math.cos(Math.asin(sinDec));
      const cosH =
        (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) /
        (cosDec * Math.cos(lat * rad));
      if (cosH > 1 || cosH < -1) {
        return null;
      }
      let H = isRise
        ? 360 - toDeg(Math.acos(cosH))
        : toDeg(Math.acos(cosH));
      H /= 15;
      const T = H + RA - 0.06571 * t - 6.622;
      let UT = ((T - lngHour) % 24 + 24) % 24;
      const hours = Math.floor(UT);
      const minutes = Math.round((UT - hours) * 60);
      const local = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes)
      );
      return local;
    }

    return { sunrise: calc(true), sunset: calc(false) };
  }

  function dayOfYear(date) {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((now - start) / 86400000);
  }

  /** Northern-hemisphere meteorological season heuristic. */
  function northernSeason(date) {
    const m = date.getMonth();
    if (m >= 2 && m <= 4) return "Spring (Northern hemisphere heuristic)";
    if (m >= 5 && m <= 7) return "Summer (Northern hemisphere heuristic)";
    if (m >= 8 && m <= 10) return "Autumn (Northern hemisphere heuristic)";
    return "Winter (Northern hemisphere heuristic)";
  }

  function formatLocalTime(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  function formatLocalDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function formatInZone(date, timeZone, opts) {
    try {
      return new Intl.DateTimeFormat(undefined, { timeZone, ...opts }).format(date);
    } catch {
      return "Invalid zone";
    }
  }

  function applyBackground(bg) {
    const allowed = ["image", "void", "aurora"];
    els.body.dataset.bg = allowed.includes(bg) ? bg : "image";
  }

  function applyWidgetVisibility(widgets) {
    document.querySelectorAll("[data-widget]").forEach((panel) => {
      const key = panel.getAttribute("data-widget");
      const show = widgets[key] !== false;
      panel.hidden = !show;
      panel.classList.toggle("is-hidden", !show);
    });
  }

  function renderClock(now) {
    els.clockTime.textContent = formatLocalTime(now);
    els.clockDate.textContent = formatLocalDate(now);
    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "local time zone";
    els.clockMeta.textContent = tz;
  }

  function renderWorldClocks(now, cities) {
    els.worldList.replaceChildren();
    cities.forEach((city) => {
      const li = document.createElement("li");
      li.className = "world-item";
      const label = document.createElement("span");
      label.className = "world-label";
      label.textContent = city.label;
      const time = document.createElement("span");
      time.className = "world-time";
      time.textContent = formatInZone(now, city.timeZone, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const date = document.createElement("p");
      date.className = "world-date";
      date.textContent =
        formatInZone(now, city.timeZone, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
        " · " +
        city.timeZone;
      li.append(label, time, date);
      els.worldList.appendChild(li);
    });
  }

  function renderCalendar(now) {
    const label = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(new Date(viewYear, viewMonth, 1));
    els.calLabel.textContent = label;

    els.calGrid.replaceChildren();
    const dows = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    dows.forEach((d) => {
      const cell = document.createElement("div");
      cell.className = "cal-dow";
      cell.textContent = d;
      cell.setAttribute("role", "columnheader");
      els.calGrid.appendChild(cell);
    });

    const first = new Date(viewYear, viewMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement("div");
      cell.className = "cal-cell";
      cell.setAttribute("role", "gridcell");
      let dayNum;
      let inMonth = false;
      if (i < startPad) {
        dayNum = prevDays - startPad + i + 1;
      } else if (i >= startPad + daysInMonth) {
        dayNum = i - (startPad + daysInMonth) + 1;
      } else {
        dayNum = i - startPad + 1;
        inMonth = true;
        cell.classList.add("in-month");
        if (
          dayNum === now.getDate() &&
          viewMonth === now.getMonth() &&
          viewYear === now.getFullYear()
        ) {
          cell.classList.add("today");
          cell.setAttribute("aria-current", "date");
        }
      }
      cell.textContent = String(dayNum);
      if (!inMonth) cell.setAttribute("aria-disabled", "true");
      els.calGrid.appendChild(cell);
    }
  }

  function renderAstronomy(now) {
    const moon = getMoonPhase(now);
    els.moonVisual.dataset.phase = moon.phaseKey;
    els.moonName.textContent = moon.name;
    els.moonDetail.textContent =
      "≈ " +
      moon.pct +
      "% illuminated · age ≈ " +
      moon.age.toFixed(1) +
      " d (algorithmic, educational)";

    els.seasonValue.textContent = northernSeason(now);
    const doy = dayOfYear(now);
    const leap =
      (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) ||
      now.getFullYear() % 400 === 0;
    els.doyValue.textContent =
      "Day " + doy + " of " + (leap ? 366 : 365) + " · " + now.getFullYear();

    if (CosmosStorage.hasLocation(settings)) {
      const sun = getSunTimes(now, settings.latitude, settings.longitude);
      if (!sun.sunrise || !sun.sunset) {
        els.sunTimes.textContent =
          "Polar day/night region — algorithm could not compute rise/set for this date.";
      } else {
        const place = settings.placeName ? " · " + settings.placeName : "";
        els.sunTimes.textContent =
          "Rise " +
          formatLocalTime(sun.sunrise).slice(0, 5) +
          " · Set " +
          formatLocalTime(sun.sunset).slice(0, 5) +
          place;
      }
      els.sunNote.textContent =
        "Approximate educational solar times for " +
        settings.latitude.toFixed(4) +
        ", " +
        settings.longitude.toFixed(4) +
        " — not a navigation or observing aid.";
    } else {
      els.sunTimes.textContent = "Set latitude & longitude in settings";
      els.sunNote.textContent =
        "Approximate solar algorithm for education — not a navigation aid.";
    }
  }

  function renderPlanets() {
    els.planetsList.replaceChildren();
    PLANETS.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = "planet-item";
      const name = document.createElement("span");
      name.className = "planet-name";
      name.textContent = i + 1 + ". " + p.name;
      const order = document.createElement("span");
      order.className = "world-time";
      order.style.fontSize = "0.75rem";
      order.textContent = "from Sun";
      const blurb = document.createElement("p");
      blurb.className = "planet-blurb";
      blurb.textContent = p.blurb;
      li.append(name, order, blurb);
      els.planetsList.appendChild(li);
    });
  }

  function renderFact() {
    const fact = CELESTIAL_FACTS[factIndex % CELESTIAL_FACTS.length];
    els.factText.textContent = fact.text;
    els.factTag.textContent = fact.tag;
  }

  async function renderWeather() {
    const weatherPanel = document.getElementById("widget-weather");
    if (!settings.widgets.weather) {
      return;
    }
    if (!settings.weatherEnabled) {
      weatherPanel.hidden = settings.widgets.weather === false;
      els.weatherBody.innerHTML =
        '<p class="weather-status">Weather is off. Enable “Weather (Open-Meteo)” in settings and set lat/lng.</p>';
      return;
    }
    if (!CosmosStorage.hasLocation(settings)) {
      els.weatherBody.innerHTML =
        '<p class="weather-status error">Weather enabled, but latitude/longitude are missing or invalid.</p>';
      return;
    }
    if (!navigator.onLine) {
      els.weatherBody.innerHTML =
        '<p class="weather-status error">Offline — cannot reach Open-Meteo. Showing no invented weather data.</p>';
      return;
    }

    els.weatherBody.innerHTML =
      '<p class="weather-status">Loading current conditions from Open-Meteo…</p>';

    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      encodeURIComponent(settings.latitude) +
      "&longitude=" +
      encodeURIComponent(settings.longitude) +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&timezone=auto";

    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      const data = await res.json();
      const cur = data.current;
      if (!cur) {
        throw new Error("Unexpected response");
      }
      const codeLabel = WMO[cur.weather_code] || "Code " + cur.weather_code;
      const place = settings.placeName || "Selected location";
      els.weatherBody.innerHTML =
        '<div class="weather-grid">' +
        '<div class="weather-stat"><span>Temperature</span><strong>' +
        cur.temperature_2m +
        "°</strong></div>" +
        '<div class="weather-stat"><span>Humidity</span><strong>' +
        cur.relative_humidity_2m +
        "%</strong></div>" +
        '<div class="weather-stat"><span>Wind</span><strong>' +
        cur.wind_speed_10m +
        "</strong></div>" +
        '<div class="weather-stat"><span>Conditions</span><strong>' +
        codeLabel +
        "</strong></div>" +
        "</div>" +
        '<p class="weather-status ok-note">Live data from Open-Meteo for ' +
        place +
        ". Units as returned by the API.</p>";
    } catch (err) {
      els.weatherBody.innerHTML =
        '<p class="weather-status error">Could not load weather (' +
        (err && err.message ? err.message : "error") +
        "). No fallback values are invented.</p>";
    }
  }

  function tick() {
    const now = new Date();
    renderClock(now);
    if (settings.widgets.worldClocks) renderWorldClocks(now, settings.cities);
    if (settings.widgets.astronomy) renderAstronomy(now);
  }

  function fillSettingsForm() {
    const bgInputs = els.settingsForm.querySelectorAll('input[name="background"]');
    bgInputs.forEach((input) => {
      input.checked = input.value === settings.background;
    });
    Object.keys(settings.widgets).forEach((key) => {
      const input = els.settingsForm.querySelector(
        'input[name="widget-' + key + '"]'
      );
      if (input) input.checked = settings.widgets[key] !== false;
    });
    els.settingsLat.value =
      typeof settings.latitude === "number" ? settings.latitude : "";
    els.settingsLng.value =
      typeof settings.longitude === "number" ? settings.longitude : "";
    els.settingsPlace.value = settings.placeName || "";
    els.settingsWeather.checked = !!settings.weatherEnabled;
    els.settingsCities.value = settings.cities
      .map((c) => c.label + " | " + c.timeZone)
      .join("\n");
  }

  function parseCities(text) {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const cities = [];
    lines.forEach((line, idx) => {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) return;
      try {
        new Intl.DateTimeFormat(undefined, { timeZone: parts[1] }).format(
          new Date()
        );
      } catch {
        return;
      }
      cities.push({
        id: "city-" + idx + "-" + parts[1].replace(/[^a-z0-9]/gi, "-"),
        label: parts[0].slice(0, 40),
        timeZone: parts[1],
      });
    });
    return cities.length
      ? cities
      : CosmosStorage.DEFAULT_CITIES.map((c) => ({ ...c }));
  }

  function openSettings() {
    lastFocused = document.activeElement;
    fillSettingsForm();
    els.settingsPanel.hidden = false;
    els.settingsBackdrop.hidden = false;
    els.settingsBackdrop.setAttribute("aria-hidden", "false");
    els.settingsOpen.setAttribute("aria-expanded", "true");
    els.body.classList.add("settings-open");
    els.settingsClose.focus();
  }

  function closeSettings() {
    els.settingsPanel.hidden = true;
    els.settingsBackdrop.hidden = true;
    els.settingsBackdrop.setAttribute("aria-hidden", "true");
    els.settingsOpen.setAttribute("aria-expanded", "false");
    els.body.classList.remove("settings-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    } else {
      els.settingsOpen.focus();
    }
  }

  function applySettings(next) {
    settings = next;
    applyBackground(settings.background);
    applyWidgetVisibility(settings.widgets);
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    renderCalendar(now);
    renderPlanets();
    renderFact();
    tick();
    renderWeather();
  }

  async function onSave(event) {
    event.preventDefault();
    const form = new FormData(els.settingsForm);
    const background = form.get("background") || "image";
    const latRaw = String(form.get("latitude") || "").trim();
    const lngRaw = String(form.get("longitude") || "").trim();
    const latitude = latRaw === "" ? null : Number(latRaw);
    const longitude = lngRaw === "" ? null : Number(lngRaw);
    const widgets = {
      worldClocks: !!form.get("widget-worldClocks"),
      calendar: !!form.get("widget-calendar"),
      astronomy: !!form.get("widget-astronomy"),
      planets: !!form.get("widget-planets"),
      facts: !!form.get("widget-facts"),
      weather: !!form.get("widget-weather"),
    };
    const partial = {
      background: String(background),
      latitude:
        latitude !== null && Number.isFinite(latitude) ? latitude : null,
      longitude:
        longitude !== null && Number.isFinite(longitude) ? longitude : null,
      placeName: String(form.get("placeName") || "").trim().slice(0, 80),
      weatherEnabled: !!form.get("weatherEnabled"),
      widgets,
      cities: parseCities(els.settingsCities.value),
    };
    const saved = await CosmosStorage.saveSettings(partial);
    applySettings(saved);
    closeSettings();
  }

  async function onReset() {
    const saved = await CosmosStorage.saveSettings({
      ...CosmosStorage.DEFAULTS,
      cities: CosmosStorage.DEFAULT_CITIES.map((c) => ({ ...c })),
      widgets: { ...CosmosStorage.DEFAULTS.widgets },
    });
    applySettings(saved);
    fillSettingsForm();
  }

  function bindEvents() {
    els.settingsOpen.addEventListener("click", openSettings);
    els.settingsClose.addEventListener("click", closeSettings);
    els.settingsBackdrop.addEventListener("click", closeSettings);
    els.settingsForm.addEventListener("submit", onSave);
    els.settingsReset.addEventListener("click", onReset);
    els.factNext.addEventListener("click", () => {
      factIndex = (factIndex + 1) % CELESTIAL_FACTS.length;
      renderFact();
    });
    els.calPrev.addEventListener("click", () => {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderCalendar(new Date());
    });
    els.calNext.addEventListener("click", () => {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderCalendar(new Date());
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.settingsPanel.hidden) {
        e.preventDefault();
        closeSettings();
      }
    });
    window.addEventListener("online", () => {
      if (settings && settings.weatherEnabled) renderWeather();
    });
  }

  async function init() {
    bindEvents();
    factIndex = Math.floor(Math.random() * CELESTIAL_FACTS.length);
    try {
      settings = await CosmosStorage.getSettings();
    } catch {
      settings = {
        ...CosmosStorage.DEFAULTS,
        cities: CosmosStorage.DEFAULT_CITIES.map((c) => ({ ...c })),
        widgets: { ...CosmosStorage.DEFAULTS.widgets },
      };
    }
    applySettings(settings);
    clockTimer = setInterval(tick, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
