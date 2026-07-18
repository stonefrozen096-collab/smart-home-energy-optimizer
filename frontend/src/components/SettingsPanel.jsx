import React from "react";
import { emailConfigured } from "../emailAlerts.js";

const ALL_DEVICES = [
  { id: "ac", name: "Air conditioner" },
  { id: "heater", name: "Water heater" },
  { id: "fridge", name: "Refrigerator" },
  { id: "washer", name: "Washing machine" },
  { id: "tv", name: "Television" },
];

const inputStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  padding: "6px 10px",
  width: "100px",
};

export default function SettingsPanel({ settings, onChange }) {
  const update = (patch) => onChange({ ...settings, ...patch });

  const toggleAutoOffDevice = (id) => {
    const set = new Set(settings.autoOffDeviceIds);
    set.has(id) ? set.delete(id) : set.add(id);
    update({ autoOffDeviceIds: Array.from(set) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Section title="Budget alerts">
        <Row label="Daily cost budget ($)">
          <input
            type="number"
            step="0.5"
            value={settings.dailyBudgetDollars}
            onChange={(e) => update({ dailyBudgetDollars: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </Row>
        <Row label="Total load alert (W)">
          <input
            type="number"
            step="100"
            value={settings.totalLoadAlertWatts}
            onChange={(e) => update({ totalLoadAlertWatts: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </Row>
      </Section>

      <Section title="Automation">
        <Row label="Auto turn-off after hour (0-23)">
          <input
            type="number"
            min="0"
            max="23"
            value={settings.autoOffAfterHour}
            onChange={(e) => update({ autoOffAfterHour: parseInt(e.target.value, 10) || 0 })}
            disabled={!settings.autoOffEnabled}
            style={inputStyle}
          />
        </Row>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={settings.autoOffEnabled}
            onChange={(e) => update({ autoOffEnabled: e.target.checked })}
          />
          Enable auto turn-off
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
          {ALL_DEVICES.map((d) => (
            <label
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--text-secondary)",
                opacity: settings.autoOffEnabled ? 1 : 0.5,
              }}
            >
              <input
                type="checkbox"
                checked={settings.autoOffDeviceIds.includes(d.id)}
                disabled={!settings.autoOffEnabled}
                onChange={() => toggleAutoOffDevice(d.id)}
              />
              {d.name}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Voice feedback">
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={settings.speechEnabled}
            onChange={(e) => update({ speechEnabled: e.target.checked })}
          />
          Speak alerts and command confirmations out loud
        </label>
      </Section>

      <Section title="Email alerts">
        {!emailConfigured && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px" }}>
            Email isn't configured for this deployment yet (needs EmailJS keys) - this toggle
            will have no effect until then.
          </p>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
          <input
            type="checkbox"
            checked={settings.emailEnabled}
            onChange={(e) => update({ emailEnabled: e.target.checked })}
          />
          Email me when an alert fires
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={settings.emailAddress}
          onChange={(e) => update({ emailAddress: e.target.value })}
          disabled={!settings.emailEnabled}
          style={{ ...inputStyle, width: "220px" }}
        />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 10px" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "320px" }}>
      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </div>
  );
}
