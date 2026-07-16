import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function PowerChart({ history }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: history.map(() => ""),
        datasets: [
          {
            data: history,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.12)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#24304a" },
            ticks: { color: "#5c6b85" },
          },
          x: { display: false },
        },
      },
    });

    return () => chartRef.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = history.map(() => "");
    chart.data.datasets[0].data = history;
    chart.update("none");
  }, [history]);

  return (
    <div style={{ position: "relative", width: "100%", height: "240px" }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Line chart of total household power draw updating in real time"
      />
    </div>
  );
}
