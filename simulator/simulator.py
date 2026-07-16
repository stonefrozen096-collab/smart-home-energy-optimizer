"""
Smart Home Energy Optimizer - Digital Twin Simulator

Simulates a set of household appliances as a "digital twin": each device
has a nominal power draw, publishes noisy telemetry on an interval, and
listens for on/off commands published by the frontend (typed or spoken
through the Web Speech API).

No physical hardware involved - this is the 100% software digital twin
described in the PBL proposal.

Topics:
  home/energy/telemetry/<device_id>   (simulator -> frontend, published)
  home/energy/command/<device_id>     (frontend -> simulator, subscribed)

Run:
  pip install -r requirements.txt --break-system-packages
  python simulator.py
"""

import asyncio
import json
import os
import random
import time
from dataclasses import dataclass

import paho.mqtt.client as mqtt

# Defaults work for local Mosquitto (docker-compose up). For a hosted broker
# like HiveMQ Cloud, set these env vars instead - see README "Deploying".
BROKER_HOST = os.environ.get("BROKER_HOST", "localhost")
BROKER_PORT = int(os.environ.get("BROKER_PORT", "1883"))
BROKER_USERNAME = os.environ.get("BROKER_USERNAME")
BROKER_PASSWORD = os.environ.get("BROKER_PASSWORD")
BROKER_USE_TLS = os.environ.get("BROKER_USE_TLS", "false").lower() == "true"

TELEMETRY_TOPIC_PREFIX = "home/energy/telemetry"
COMMAND_TOPIC_PREFIX = "home/energy/command"
PUBLISH_INTERVAL_SECONDS = 2.0


@dataclass
class Device:
    device_id: str
    name: str
    nominal_watts: float
    on: bool = False
    jitter_pct: float = 0.06  # +/- realistic sensor noise

    def sample_watts(self) -> float:
        if not self.on:
            return 0.0
        noise = 1 + random.uniform(-self.jitter_pct, self.jitter_pct)
        return round(self.nominal_watts * noise, 1)


DEVICES: dict[str, Device] = {
    d.device_id: d
    for d in [
        Device("ac", "Air conditioner", 1450, on=True),
        Device("heater", "Water heater", 2200, on=False),
        Device("fridge", "Refrigerator", 150, on=True, jitter_pct=0.15),  # compressor cycling
        Device("washer", "Washing machine", 500, on=False),
        Device("tv", "Television", 120, on=True),
    ]
}


def on_connect(client, userdata, flags, rc):
    print(f"[simulator] connected to broker (rc={rc})")
    for device_id in DEVICES:
        topic = f"{COMMAND_TOPIC_PREFIX}/{device_id}"
        client.subscribe(topic)
        print(f"[simulator] subscribed to {topic}")


def on_message(client, userdata, msg):
    device_id = msg.topic.rsplit("/", 1)[-1]
    device = DEVICES.get(device_id)
    if device is None:
        print(f"[simulator] command for unknown device: {msg.topic}")
        return

    payload = msg.payload.decode("utf-8").strip()
    try:
        parsed = json.loads(payload)
        action = parsed.get("action", "").lower()
    except (json.JSONDecodeError, AttributeError):
        action = payload.lower()

    if action in ("on", "turn_on", "true"):
        device.on = True
    elif action in ("off", "turn_off", "false"):
        device.on = False
    else:
        print(f"[simulator] unrecognized command payload: {payload!r}")
        return

    print(f"[simulator] {device.name} -> {'ON' if device.on else 'OFF'}")


async def publish_loop(client: mqtt.Client):
    while True:
        timestamp = time.time()
        for device in DEVICES.values():
            reading = {
                "device_id": device.device_id,
                "name": device.name,
                "on": device.on,
                "watts": device.sample_watts(),
                "timestamp": timestamp,
            }
            client.publish(
                f"{TELEMETRY_TOPIC_PREFIX}/{device.device_id}",
                json.dumps(reading),
                qos=0,
            )
        await asyncio.sleep(PUBLISH_INTERVAL_SECONDS)


async def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    if BROKER_USERNAME and BROKER_PASSWORD:
        client.username_pw_set(BROKER_USERNAME, BROKER_PASSWORD)
    if BROKER_USE_TLS:
        client.tls_set()
    client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)

    # paho's network loop runs in its own thread; our asyncio loop just
    # handles the periodic telemetry publish on a clean schedule.
    client.loop_start()
    try:
        await publish_loop(client)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    print("[simulator] starting smart home digital twin...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[simulator] stopped.")
