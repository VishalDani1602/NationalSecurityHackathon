import {
  Activity,
  Crosshair,
  Map,
  Navigation,
  RadioTower,
  Satellite,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { CustodyFrame, Sensor, SensorStatus, TrackPoint } from "./types";

type MapSituationPanelProps = {
  frame: CustodyFrame;
  sensors: Sensor[];
  trackHistory: TrackPoint[];
};

const statusLabels: Record<SensorStatus, string> = {
  tracking: "TRK",
  searching: "SRCH",
  degraded: "DGRD",
  offline: "OFF",
};

function SensorIcon({ kind }: { kind: Sensor["kind"] }) {
  if (kind === "SAR") return <Satellite size={15} aria-hidden="true" />;
  if (kind === "SIGINT") return <RadioTower size={15} aria-hidden="true" />;
  if (kind === "UAS") return <Navigation size={15} aria-hidden="true" />;
  return <Activity size={15} aria-hidden="true" />;
}

function pathFromPoints(points: TrackPoint[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function MapSituationPanel({
  frame,
  sensors,
  trackHistory,
}: MapSituationPanelProps) {
  const path = pathFromPoints(trackHistory);
  const recommendedSensorId = frame.recommendation.sensorId;

  return (
    <section className="panel situation-panel" aria-labelledby="situation-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Live Situation</p>
          <h2 id="situation-title">Target Custody Map</h2>
        </div>
        <div className="header-metric">
          <Map size={16} aria-hidden="true" />
          <span>Grid 38S LB</span>
        </div>
      </div>

      <div className="map-shell">
        <div className="map-grid" aria-label="Simulated custody map">
          <svg
            className="map-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="track-gradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#7aa7a1" />
                <stop offset="100%" stopColor="#f6d06f" />
              </linearGradient>
            </defs>
            <path className="corridor" d="M 6 74 C 22 67, 32 54, 42 50 S 62 39, 84 25" />
            <path className="track-path-shadow" d={path} />
            <path className="track-path" d={path} />
            <ellipse
              className="uncertainty-ellipse"
              cx={frame.target.x}
              cy={frame.target.y}
              rx={frame.confidence < 70 ? 8.4 : 5.6}
              ry={frame.confidence < 70 ? 5.8 : 3.9}
              transform={`rotate(-21 ${frame.target.x} ${frame.target.y})`}
            />
            <circle className="target-ring outer" cx={frame.target.x} cy={frame.target.y} r="4.8" />
            <circle className="target-ring inner" cx={frame.target.x} cy={frame.target.y} r="2.2" />
          </svg>

          <div className="map-zone zone-littoral">Restricted waters</div>
          <div className="map-zone zone-urban">Urban clutter</div>
          <div className="map-zone zone-highland">High ground</div>

          {sensors.map((sensor) => {
            const isRecommended = sensor.id === recommendedSensorId;
            return (
              <button
                className={`sensor-node sensor-${sensor.status} ${
                  isRecommended ? "sensor-recommended" : ""
                }`}
                key={sensor.id}
                style={
                  {
                    left: `${sensor.x}%`,
                    top: `${sensor.y}%`,
                    "--coverage": `${sensor.coverage}px`,
                    "--bearing": `${sensor.bearing}deg`,
                  } as CSSProperties & Record<"--coverage" | "--bearing", string>
                }
                aria-label={`${sensor.name}, ${sensor.status}`}
                title={`${sensor.name} ${statusLabels[sensor.status]}`}
              >
                <span className="sensor-beam" />
                <span className="sensor-dot">
                  <SensorIcon kind={sensor.kind} />
                </span>
                <span className="sensor-tag">{sensor.id}</span>
              </button>
            );
          })}

          <div
            className={`target-marker state-${frame.state.toLowerCase().replace(" ", "-")}`}
            style={{ left: `${frame.target.x}%`, top: `${frame.target.y}%` }}
            aria-label={`Target position, confidence ${frame.confidence}%`}
          >
            <Crosshair size={20} aria-hidden="true" />
          </div>

          <div className="map-readout target-readout">
            <span>Track VX-2047</span>
            <strong>{frame.state}</strong>
          </div>
          <div className="map-readout coord-readout">
            <span>Lat / Lon</span>
            <strong>34.62N 58.14E</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
