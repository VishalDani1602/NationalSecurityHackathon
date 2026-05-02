import { CircleAlert, RadioReceiver, Signal, WifiOff } from "lucide-react";
import type { Sensor } from "./types";

type SensorStatusPanelProps = {
  sensors: Sensor[];
  recommendedSensorId: string;
};

function statusIcon(status: Sensor["status"]) {
  if (status === "offline") return <WifiOff size={15} aria-hidden="true" />;
  if (status === "degraded") return <CircleAlert size={15} aria-hidden="true" />;
  return <Signal size={15} aria-hidden="true" />;
}

export function SensorStatusPanel({
  sensors,
  recommendedSensorId,
}: SensorStatusPanelProps) {
  return (
    <section className="panel sensor-panel" aria-labelledby="sensor-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Sensors</p>
          <h2 id="sensor-title">Network Status</h2>
        </div>
        <div className="header-metric">
          <RadioReceiver size={16} aria-hidden="true" />
          <span>{sensors.filter((sensor) => sensor.status !== "offline").length}/{sensors.length} online</span>
        </div>
      </div>

      <div className="sensor-list">
        {sensors.map((sensor) => (
          <div
            className={`sensor-row row-${sensor.status} ${
              sensor.id === recommendedSensorId ? "recommended" : ""
            }`}
            key={sensor.id}
          >
            <div className="sensor-row-main">
              <span className="status-icon">{statusIcon(sensor.status)}</span>
              <div>
                <strong>{sensor.name}</strong>
                <span>{sensor.kind} / {sensor.mode}</span>
              </div>
            </div>
            <div className="sensor-telemetry">
              <span>{sensor.health}% health</span>
              <span>{sensor.latency}</span>
              <span>{sensor.custodyContribution}% custody</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
