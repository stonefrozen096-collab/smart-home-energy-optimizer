/**
 * Alert detection + speech feedback.
 *
 * Alerts are plain objects: { id, level: 'warn'|'danger', message }.
 * `id` is used to avoid re-firing the same alert every tick.
 */

export function speak(text, enabled) {
  if (!enabled) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Individual device is drawing meaningfully more than its own nominal
// wattage - a simple proxy for "something's wrong / wasting energy."
const SPIKE_MULTIPLIER = 1.25;

export function detectAlerts({ deviceList, totalWatts, settings, todayKwh }) {
  const alerts = [];

  if (settings.totalLoadAlertWatts && totalWatts > settings.totalLoadAlertWatts) {
    alerts.push({
      id: "total-load",
      level: "danger",
      message: `Total load (${Math.round(totalWatts)} W) is above your ${settings.totalLoadAlertWatts} W limit.`,
    });
  }

  const estCostToday = todayKwh * 0.15;
  if (settings.dailyBudgetDollars && estCostToday > settings.dailyBudgetDollars) {
    alerts.push({
      id: "budget",
      level: "danger",
      message: `Today's estimated cost ($${estCostToday.toFixed(2)}) has passed your $${settings.dailyBudgetDollars.toFixed(2)} budget.`,
    });
  }

  deviceList.forEach((d) => {
    if (!d.on || !d.nominalWatts) return;
    if (d.watts > d.nominalWatts * SPIKE_MULTIPLIER) {
      alerts.push({
        id: `spike-${d.device_id}`,
        level: "warn",
        message: `${d.name} is drawing more than usual (${Math.round(d.watts)} W) - possible energy waste.`,
      });
    }
  });

  return alerts;
}
