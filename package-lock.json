/**
 * User preferences + local history, persisted in the browser (localStorage).
 * No backend or database needed - this is a single-visitor demo app, so
 * "their" settings and history just live on their own device.
 */

const SETTINGS_KEY = "sheo:settings";
const HISTORY_KEY = "sheo:daily-history";

export const DEFAULT_SETTINGS = {
  dailyBudgetDollars: 3.0,
  totalLoadAlertWatts: 3000,
  autoOffEnabled: false,
  autoOffAfterHour: 23, // 24h clock; devices below auto-shut past this hour
  autoOffDeviceIds: ["ac", "heater"],
  speechEnabled: true,
  emailEnabled: false,
  emailAddress: "",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Daily history, for the comparison tab ---

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Call periodically with the current total watts reading. Keeps a running
// kWh estimate per day, and trims anything older than 14 days.
export function recordSample(totalWatts, intervalSeconds) {
  const history = loadHistory();
  const key = todayKey();
  const kwhDelta = (totalWatts / 1000) * (intervalSeconds / 3600);

  if (!history[key]) history[key] = { kwh: 0, peakWatts: 0 };
  history[key].kwh += kwhDelta;
  history[key].peakWatts = Math.max(history[key].peakWatts, totalWatts);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  Object.keys(history).forEach((k) => {
    if (new Date(k) < cutoff) delete history[k];
  });

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}
