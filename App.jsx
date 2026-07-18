import React from "react";

export default function AlertBanner({ alerts }) {
  if (!alerts.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.5rem" }}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            background: alert.level === "danger" ? "rgba(242,74,74,0.1)" : "rgba(242,163,60,0.1)",
            border: `1px solid ${alert.level === "danger" ? "#f24a4a" : "var(--accent-warn)"}`,
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "13px",
            color: alert.level === "danger" ? "#f24a4a" : "var(--accent-warn)",
          }}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
