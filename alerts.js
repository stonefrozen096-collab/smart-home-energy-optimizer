import React, { useEffect, useRef, useState } from "react";
import DeviceCard from "./components/DeviceCard.jsx";
import PowerChart from "./components/PowerChart.jsx";
import VoiceControl from "./components/VoiceControl.jsx";
import AlertBanner from "./components/AlertBanner.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import HistoryTab from "./components/HistoryTab.jsx";
import { getMqttClient, TELEMETRY_TOPIC, sendCommand } from "./mqttClient.js";
import { startDigitalTwin } from "./digitalTwin.js";
import { loadSettings, saveSettings, loadHistory, recordSample } from "./settingsStore.js";
import { detectAlerts, speak } from "./alerts.js";
import { sendAlertEmail } from "./emailAlerts.js";

const DEVICE_ORDER = ["ac", "heater", "fridge", "washer", "tv"];

const INITIAL_DEVICES = Object.fromEntries(
  DEVICE_ORDER.map((id) => [id, { device_id: id, name: id, on: false, watts: 0, nominalWatts: 0 }])
);

const SAMPLE_INTERVAL_MS = 1500;
const HOUR_CHECK_INTERVAL_MS = 30_000;

export default function App() {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState(Array(30).fill(0));
  const [dailyHistory, setDailyHistory] = useState(() => loadHistory());
  const [settings, setSettings] = useState(() => loadSettings());
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [tab, setTab] = useState("dashboard"); // dashboard | history | settings
  const [autoOffFiredToday, setAutoOffFiredToday] = useState(false);

  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const seenAlertIds = useRef(new Set());

  useEffect(() => saveSettings(settings), [settings]);

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
            nominalWatts: reading.nominalWatts ?? prev[reading.device_id]?.nominalWatts ?? 0,
          },
        }));
      } catch (err) {
        console.error("bad telemetry payload", err);
      }
    });

    return () => client.end(true);
  }, []);

  // Rolling chart history + daily kWh accumulation + alert detection
  useEffect(() => {
    const interval = setInterval(() => {
      const deviceList = Object.values(devicesRef.current);
      const total = deviceList.filter((d) => d.on).reduce((sum, d) => sum + (d.watts || 0), 0);

      setHistory((prev) => [...prev.slice(1), Math.round(total)]);

      const updatedDaily = recordSample(total, SAMPLE_INTERVAL_MS / 1000);
      setDailyHistory(updatedDaily);

      const todayKey = new Date().toISOString().slice(0, 10);
      const todayKwh = updatedDaily[todayKey]?.kwh || 0;

      const alerts = detectAlerts({
        deviceList,
        totalWatts: total,
        settings: settingsRef.current,
        todayKwh,
      });
      setActiveAlerts(alerts);

      alerts.forEach((alert) => {
        if (seenAlertIds.current.has(alert.id)) return;
        seenAlertIds.current.add(alert.id);
        speak(alert.message, settingsRef.current.speechEnabled);
        if (settingsRef.current.emailEnabled) {
          sendAlertEmail({
            toEmail: settingsRef.current.emailAddress,
            alertId: alert.id,
            message: alert.message,
          });
        }
      });
      // Clear "seen" state for alerts that are no longer active, so they can re-fire later
      seenAlertIds.current.forEach((id) => {
        if (!alerts.find((a) => a.id === id)) seenAlertIds.current.delete(id);
      });
    }, SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Auto turn-off automation, checked periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const s = settingsRef.current;
      if (!s.autoOffEnabled) return;
      const hour = new Date().getHours();
      if (hour < s.autoOffAfterHour) {
        setAutoOffFiredToday(false);
        return;
      }
      if (autoOffFiredToday) return;

      s.autoOffDeviceIds.forEach((id) => {
        if (devicesRef.current[id]?.on) sendCommand(id, "off");
      });
      speak(`Auto turn-off ran for ${s.autoOffDeviceIds.length} device${s.autoOffDeviceIds.length === 1 ? "" : "s"}.`, s.speechEnabled);
      setAutoOffFiredToday(true);
    }, HOUR_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOffFiredToday]);

  const deviceList = DEVICE_ORDER.map((id) => devices[id]);
  const totalWatts = deviceList.filter((d) => d.on).reduce((s, d) => s + (d.watts || 0), 0);
  const onCount = deviceList.filter((d) => d.on).length;
  const estCostToday = ((totalWatts / 1000) * (new Date().getHours() || 1) * 0.15).toFixed(2);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>
          Smart home energy <span style={{ color: "var(--accent-teal)" }}>optimizer</span>
        </h1>
        <span style={{ fontSize: "13px", color: connected ? "var(--accent-teal)" : "var(--accent-warn)" }}>
          {connected ? "Connected to broker" : "Connecting to broker..."}
        </span>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        {[
          ["dashboard", "Dashboard"],
          ["history", "History"],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: tab === key ? "2px solid var(--accent-teal)" : "2px solid transparent",
              color: tab === key ? "var(--text-primary)" : "var(--text-secondary)",
              padding: "8px 4px",
              marginRight: "16px",
              fontSize: "14px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <AlertBanner alerts={activeAlerts} />

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
        </>
      )}

      {tab === "history" && <HistoryTab history={dailyHistory} />}

      {tab === "settings" && <SettingsPanel settings={settings} onChange={setSettings} />}
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
