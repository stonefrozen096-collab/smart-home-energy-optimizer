import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function HistoryTab({ history }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const days = Object.keys(history).sort().slice(-7);
  const kwhValues = days.map((d) => Math.round(history[d].kwh * 100) / 100);
  const costValues = kwhValues.map((kwh) => Math.round(kwh * 0.15 * 100) / 100);
  const labels = days.map((d) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "kWh",
            data: kwhValues,
            backgroundColor: "#38bdf8",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#24304a" }, ticks: { color: "#5c6b85" } },
          x: { grid: { display: false }, ticks: { color: "#5c6b85" } },
        },
      },
    });
    return () => chartRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(days)]);

  if (days.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        No history yet - leave the dashboard open for a while and daily usage will start showing up here.
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 12px" }}>
        Estimated energy use per day (last {days.length} day{days.length > 1 ? "s" : ""})
      </p>
      <div style={{ position: "relative", width: "100%", height: "220px", marginBottom: "1.5rem" }}>
        <canvas ref={canvasRef} role="img" aria-label="Bar chart comparing energy use across recent days" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {days.map((d, i) => (
          <div key={d} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.75rem" }}>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 4px" }}>{labels[i]}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "16px", margin: 0 }}>{kwhValues[i]} kWh</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>${costValues[i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
