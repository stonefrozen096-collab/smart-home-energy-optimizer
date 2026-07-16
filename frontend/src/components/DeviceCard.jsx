import React from "react";
import { sendCommand } from "../mqttClient.js";

export default function DeviceCard({ device }) {
  const { device_id, name, on, watts } = device;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span
          aria-hidden="true"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: on ? "var(--accent-teal)" : "var(--text-muted)",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "14px", fontWeight: 500 }}>{name}</span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "22px",
          margin: "0 0 12px",
          color: on ? "var(--accent-cyan)" : "var(--text-muted)",
        }}
      >
        {on ? `${watts?.toFixed(0) ?? 0} W` : "Off"}
      </p>

      <button
        onClick={() => sendCommand(device_id, on ? "off" : "on")}
        style={{
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-primary)",
          fontSize: "13px",
        }}
      >
        Turn {on ? "off" : "on"}
      </button>
    </div>
  );
}
