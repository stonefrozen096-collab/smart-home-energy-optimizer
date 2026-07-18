/**
 * Client-side digital twin.
 *
 * This runs the same simulation logic as simulator/simulator.py, but in the
 * browser, so the deployed site has no backend process to host, keep awake,
 * or pay for. It publishes real telemetry to the MQTT broker (HiveMQ Cloud)
 * and listens for the same command topics - the wire protocol is identical,
 * only *where* the simulation runs has changed.
 *
 * If you want the literal Python process from the proposal for a local demo
 * or code walkthrough, simulator/simulator.py still works standalone against
 * a local Mosquitto broker (see README "Local development").
 */

import { commandTopic } from "./mqttClient.js";

const TELEMETRY_PREFIX = "home/energy/telemetry";
const COMMAND_TOPIC_WILDCARD = "home/energy/command/+";
const PUBLISH_INTERVAL_MS = 2000;

const DEVICES = {
  ac: { device_id: "ac", name: "Air conditioner", nominalWatts: 1450, on: true, jitter: 0.06 },
  heater: { device_id: "heater", name: "Water heater", nominalWatts: 2200, on: false, jitter: 0.06 },
  fridge: { device_id: "fridge", name: "Refrigerator", nominalWatts: 150, on: true, jitter: 0.15 },
  washer: { device_id: "washer", name: "Washing machine", nominalWatts: 500, on: false, jitter: 0.06 },
  tv: { device_id: "tv", name: "Television", nominalWatts: 120, on: true, jitter: 0.06 },
};

function sampleWatts(device) {
  if (!device.on) return 0;
  const noise = 1 + (Math.random() * 2 - 1) * device.jitter;
  return Math.round(device.nominalWatts * noise * 10) / 10;
}

let started = false;

export function startDigitalTwin(client) {
  if (started) return; // guard against double-start in React StrictMode
  started = true;

  client.subscribe(COMMAND_TOPIC_WILDCARD);

  client.on("message", (topic, payload) => {
    if (!topic.startsWith("home/energy/command/")) return;
    const deviceId = topic.split("/").pop();
    const device = DEVICES[deviceId];
    if (!device) return;

    let action;
    try {
      action = JSON.parse(payload.toString()).action;
    } catch {
      action = payload.toString();
    }
    if (action === "on") device.on = true;
    else if (action === "off") device.on = false;
  });

  setInterval(() => {
    const timestamp = Date.now() / 1000;
    Object.values(DEVICES).forEach((device) => {
      const reading = {
        device_id: device.device_id,
        name: device.name,
        on: device.on,
        watts: sampleWatts(device),
        nominalWatts: device.nominalWatts,
        timestamp,
      };
      client.publish(`${TELEMETRY_PREFIX}/${device.device_id}`, JSON.stringify(reading));
    });
  }, PUBLISH_INTERVAL_MS);
}
