import React, { useState } from "react";
import { sendCommand } from "../mqttClient.js";

const SpeechRecognition =
  typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

function parseCommand(text, devices) {
  const lower = text.toLowerCase();
  const turnOff = lower.includes("off");
  const turnOn = lower.includes("on") && !turnOff;

  const device = devices.find(
    (d) => lower.includes(d.device_id) || lower.includes(d.name.toLowerCase().split(" ")[0])
  );

  if (!device) {
    return { ok: false, message: `No matching device heard in: "${text}"` };
  }
  if (!turnOn && !turnOff) {
    return { ok: false, message: `Could not tell on/off from: "${text}"` };
  }

  sendCommand(device.device_id, turnOff ? "off" : "on");
  return { ok: true, message: `Command sent: turn ${turnOff ? "off" : "on"} ${device.name}` };
}

export default function VoiceControl({ devices }) {
  const [text, setText] = useState("");
  const [log, setLog] = useState('Try: "turn on the heater" or "turn off the fridge"');

  const runCommand = (value) => {
    if (!value.trim()) return;
    const result = parseCommand(value.trim(), devices);
    setLog(result.message);
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      setLog("Voice recognition not supported in this browser, use the text field.");
      return;
    }
    const recognizer = new SpeechRecognition();
    recognizer.lang = "en-US";
    recognizer.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      runCommand(transcript);
    };
    recognizer.onerror = () => setLog("Voice recognition error, try again or use text.");
    recognizer.start();
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 8px" }}>
        Voice / text command
      </p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runCommand(text)}
          placeholder="e.g. turn off the ac"
          style={{
            flex: 1,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            padding: "8px 10px",
          }}
        />
        <button
          onClick={startListening}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--accent-teal)",
            padding: "8px 14px",
          }}
        >
          Speak
        </button>
        <button
          onClick={() => runCommand(text)}
          style={{
            background: "var(--accent-teal-dim)",
            border: "1px solid var(--accent-teal)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            padding: "8px 14px",
          }}
        >
          Send
        </button>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{log}</p>
    </div>
  );
}
