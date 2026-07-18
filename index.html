import mqtt from "mqtt";

// Local dev default: Mosquitto's websockets listener (port 9001, no TLS).
// For a hosted broker (e.g. HiveMQ Cloud), set these in frontend/.env:
//   VITE_BROKER_URL=wss://<your-cluster>.hivemq.cloud:8884/mqtt
//   VITE_BROKER_USERNAME=...
//   VITE_BROKER_PASSWORD=...
const BROKER_URL = import.meta.env.VITE_BROKER_URL || "ws://localhost:9001";
const BROKER_USERNAME = import.meta.env.VITE_BROKER_USERNAME;
const BROKER_PASSWORD = import.meta.env.VITE_BROKER_PASSWORD;

export const TELEMETRY_TOPIC = "home/energy/telemetry/+";
export const commandTopic = (deviceId) => `home/energy/command/${deviceId}`;

let client = null;

export function getMqttClient() {
  if (client) return client;

  client = mqtt.connect(BROKER_URL, {
    reconnectPeriod: 2000,
    connectTimeout: 4000,
    username: BROKER_USERNAME,
    password: BROKER_PASSWORD,
  });

  return client;
}

export function sendCommand(deviceId, action) {
  const c = getMqttClient();
  c.publish(commandTopic(deviceId), JSON.stringify({ action }));
}
