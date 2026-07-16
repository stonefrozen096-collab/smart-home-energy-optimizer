import React, { useEffect, useRef, useState } from "react";
import DeviceCard from "./components/DeviceCard.jsx";
import PowerChart from "./components/PowerChart.jsx";
import VoiceControl from "./components/VoiceControl.jsx";
import { getMqttClient, TELEMETRY_TOPIC } from "./mqttClient.js";
import { startDigitalTwin } from "./digitalTwin.js";

const DEVICE_ORDER = ["ac", "heater", "fridge", "washer", "tv"];

const INITIAL_DEVICES = Object.fromEntries(
  DEVICE_ORDER.map((id) => [
    id,
    { device_id: id, name: id, on: false, watts: 0 },
  ])
);

export default function App() {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState(Array(30).fill(0));
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  useEffect(() => {
    const client = getMqttClient();

    client.on("connect", () => {
      setConnected(true);
      client.subscribe(TELEMETRY_TOPIC);
      startDigitalTwin(client);
    });
    client.on("close", () => setConnected(false));

    client.on("message", (_topic, payload) => {
      try {
        const reading = JSON.parse(payload.toString());
        setDevices((prev) => ({
          ...prev,
          [reading.device_id]: {
            device_id: reading.device_id,
            name: reading.name,
            on: reading.on,
            watts: reading.watts,
          },
        }));
      } catch (err) {
        console.error("bad telemetry payload", err);
      }
    });

    return () => client.end(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const total = Object.values(devicesRef.current)
        .filter((d) => d.on)
        .reduce((sum, d) => sum + (d.watts || 0), 0);
      setHistory((prev) => [...prev.slice(1), Math.round(total)]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const deviceList = DEVICE_ORDER.map((id) => devices[id]);
  const totalWatts = deviceList.filter((d) => d.on).reduce((s, d) => s + (d.watts || 0), 0);
  const onCount = deviceList.filter((d) => d.on).length;
  const estCostToday = ((totalWatts / 1000) * (new Date().getHours() || 1) * 0.15).toFixed(2);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>
          Smart home energy <span style={{ color: "var(--accent-teal)" }}>optimizer</span>
        </h1>
        <span style={{ fontSize: "13px", color: connected ? "var(--accent-teal)" : "var(--accent-warn)" }}>
          {connected ? "Connected to broker" : "Connecting to broker..."}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "1.5rem" }}>
        <StatCard label="Total load" value={`${totalWatts.toFixed(0)} W`} />
        <StatCard label="Devices on" value={`${onCount} / ${deviceList.length}`} />
        <StatCard label="Est. cost today" value={`$${estCostToday}`} />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <PowerChart history={history} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "10px",
          marginBottom: "1.5rem",
        }}
      >
        {deviceList.map((device) => (
          <DeviceCard key={device.device_id} device={device} />
        ))}
      </div>

      <VoiceControl devices={deviceList} />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem" }}>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: "24px", fontWeight: 500, margin: 0, fontFamily: "var(--font-mono)" }}>{value}</p>
    </div>
  );
}
