import { useEffect, useMemo, useState } from "react";
import { Layers, LockKeyhole, ScanLine } from "lucide-react";
import "./App.css";
import { CustodyConfidence } from "./components/CustodyConfidence";
import { MapSituationPanel } from "./components/MapSituationPanel";
import { NextBestSensor } from "./components/NextBestSensor";
import { SensorStatusPanel } from "./components/SensorStatusPanel";
import { TimelineReplay } from "./components/TimelineReplay";
import type { CustodyFrame, DetectionMarker, Sensor, SensorStatus, TrackPoint } from "./components/types";
import { runFusion } from "./lib/fusion";
import { scenario } from "./lib/scenario";
import type { FusionFrame, Sensor as ScenarioSensor } from "./lib/types";

const chart = { width: 1100, height: 680 };

function toPercentPoint(point: { x: number; y: number }): TrackPoint {
  return {
    x: Math.max(2, Math.min(98, (point.x / chart.width) * 100)),
    y: Math.max(2, Math.min(98, (point.y / chart.height) * 100)),
  };
}

function sensorKind(sensor: ScenarioSensor): Sensor["kind"] {
  if (sensor.type === "radar") return "SAR";
  if (sensor.type === "eo") return "EO";
  if (sensor.type === "rf") return "SIGINT";
  return "AIS";
}

function sensorKindById(sensorId: string): Sensor["kind"] {
  const sensor = scenario.sensors.find((candidate) => candidate.id === sensorId);
  return sensor ? sensorKind(sensor) : "AIS";
}

function sensorStatus(sensor: ScenarioSensor, time: number): SensorStatus {
  if (sensor.type === "radar" && time >= 9 && time <= 13) return "offline";
  if (sensor.type === "radar" && time >= 14 && time <= 16) return "degraded";
  if (sensor.type === "ais" && time >= 7 && time <= 15) return "degraded";
  if (sensor.type === "eo" && time >= 9 && time <= 14) return "searching";
  return "tracking";
}

function modeForSensor(sensor: ScenarioSensor, status: SensorStatus): string {
  if (status === "offline") return "masked";
  if (sensor.type === "radar") return status === "degraded" ? "clutter gate" : "wide area";
  if (sensor.type === "eo") return status === "searching" ? "slew search" : "visual ID";
  if (sensor.type === "rf") return "bearing fix";
  return status === "degraded" ? "spoof check" : "identity feed";
}

function makeSensors(frame: FusionFrame): Sensor[] {
  return scenario.sensors.map((sensor) => {
    const status = sensorStatus(sensor, frame.time);
    const recommended = frame.recommendation.sensorId === sensor.id;

    return {
      id: sensor.id,
      name: sensor.name,
      kind: sensorKind(sensor),
      status,
      x: toPercentPoint(sensor.position).x,
      y: toPercentPoint(sensor.position).y,
      coverage: Math.round(Math.max(76, Math.min(156, sensor.range / 3))),
      bearing: sensor.bearing,
      health:
        status === "offline"
          ? 0
          : status === "degraded"
            ? 61
            : recommended
              ? 96
              : Math.round(sensor.reliability * 100),
      latency: `${Math.max(1, Math.round(sensor.latencySec * 0.7))}s`,
      mode: modeForSensor(sensor, status),
      custodyContribution: recommended
        ? Math.round(frame.recommendation.probability * 100)
        : Math.round(sensor.reliability * 18),
    };
  });
}

function frameState(frame: FusionFrame): CustodyFrame["state"] {
  if (frame.track.mode === "lost") return "Reacquiring";
  if (frame.track.confidence < 0.65 || frame.track.mode === "degraded") return "At Risk";
  return "Firm";
}

function velocityLabel(frame: FusionFrame): string {
  const speed = Math.hypot(frame.track.velocity.vx, frame.track.velocity.vy);
  if (frame.track.mode === "lost") return "model-only";
  return `${Math.round(speed)} px/tick`;
}

function ambiguityLabel(frame: FusionFrame): string {
  if (frame.track.uncertainty > 110) return "High";
  if (frame.track.uncertainty > 56) return "Medium";
  return "Low";
}

function makeDetectionMarkers(frame: FusionFrame): DetectionMarker[] {
  return frame.associations.map((association) => ({
    id: association.detection.id,
    sensorId: association.detection.sensorId,
    kind: sensorKindById(association.detection.sensorId),
    ...toPercentPoint(association.detection.position),
    uncertainty: Math.max(1.5, Math.min(8.5, (association.detection.uncertainty / chart.width) * 100)),
    accepted: association.accepted,
    spoofed: Boolean(association.detection.spoofed),
    label: association.detection.label,
    score: Math.round(association.score),
  }));
}

function makeFrame(frame: FusionFrame, previousFrame?: FusionFrame): CustodyFrame {
  const accepted = frame.associations.filter((association) => association.accepted);
  const rejected = frame.associations.filter((association) => !association.accepted);
  const event = frame.activeEvents.at(-1);
  const recommendedSensor = scenario.sensors.find(
    (sensor) => sensor.id === frame.recommendation.sensorId,
  );
  const confidence = Math.round(frame.track.confidence * 100);
  const explanation =
    accepted.length > 0
      ? accepted.slice(0, 3).map((association) => association.reason)
      : [
          `Prediction-only update; belief radius expanded to ${Math.round(
            frame.track.uncertainty,
          )}px.`,
          frame.track.mode === "lost"
            ? "Custody is being carried by motion model and search-tasking logic."
            : "No detection met the association gate this tick.",
        ];
  const contestedFactors =
    rejected.length > 0
      ? rejected.slice(0, 3).map((association) => association.reason)
      : event
        ? [event.description]
        : ["No rejected detections in the current gate."];

  return {
    id: `t-${frame.time}`,
    time: `T+${String(frame.time).padStart(2, "0")}`,
    label: event?.title ?? (accepted.length > 0 ? "Multi-sensor update" : "Prediction update"),
    target: toPercentPoint(frame.track.position),
    prediction: toPercentPoint(frame.prediction),
    uncertainty: Math.round(frame.track.uncertainty),
    confidence,
    state: frameState(frame),
    velocity: velocityLabel(frame),
    ambiguity: ambiguityLabel(frame),
    detections: makeDetectionMarkers(frame),
    supportingSensors: accepted.map((association) => association.detection.sensorId),
    explanation,
    contestedFactors,
    metrics: {
      accepted: accepted.length,
      rejected: rejected.length,
      totalDetections: frame.detections.length,
      confidenceDelta: previousFrame
        ? Math.round((frame.track.confidence - previousFrame.track.confidence) * 100)
        : 0,
      bestSensor: frame.recommendation.sensorId,
    },
    eventCallout: event
      ? {
          title: event.title,
          description: event.description,
          severity: event.severity,
        }
      : undefined,
    recommendation: {
      sensorId: frame.recommendation.sensorId,
      action: `Task ${
        recommendedSensor?.name ?? frame.recommendation.sensorId
      } into the highest-probability custody region.`,
      eta: `${Math.max(5, Math.round((recommendedSensor?.latencySec ?? 2) * 0.7))} sec`,
      expectedGain: Math.round(Math.max(4, frame.recommendation.probability * 22)),
      reason: frame.recommendation.reason,
      command: `TASK ${frame.recommendation.sensorId.toUpperCase()} / CUSTODY-GATE / SCORE ${
        frame.recommendation.score
      }`,
    },
  };
}

function App() {
  const fusionFrames = useMemo(() => runFusion(scenario), []);
  const frames = useMemo(
    () => fusionFrames.map((frame, index) => makeFrame(frame, fusionFrames[index - 1])),
    [fusionFrames],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= frames.length - 1) {
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 1300 / speed);

    return () => window.clearInterval(interval);
  }, [frames.length, isPlaying, speed]);

  const activeFrame = frames[activeIndex];
  const activeFusionFrame = fusionFrames[activeIndex];
  const sensors = useMemo(() => makeSensors(activeFusionFrame), [activeFusionFrame]);
  const trackHistory = useMemo(
    () => frames.slice(0, activeIndex + 1).map((frame) => frame.target),
    [activeIndex, frames],
  );
  const recommendedSensor = sensors.find(
    (sensor) => sensor.id === activeFrame.recommendation.sensorId,
  );

  const handleStep = (delta: number) => {
    setIsPlaying(false);
    setActiveIndex((current) => {
      const next = current + delta;
      return Math.min(Math.max(next, 0), frames.length - 1);
    });
  };

  return (
    <div className="app-shell">
      <header className="command-bar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <LockKeyhole size={18} aria-hidden="true" />
          </div>
          <div>
            <span>CustodyOS</span>
            <strong>Multi-sensor target custody</strong>
          </div>
        </div>
        <div className="mission-strip" aria-label="Mission status">
          <span>
            <Layers size={15} aria-hidden="true" /> Problem Statement 1
          </span>
          <span>
            <ScanLine size={15} aria-hidden="true" /> Track VX-2047
          </span>
          <span>{scenario.name}</span>
        </div>
      </header>

      <main className="operations-layout">
        <MapSituationPanel frame={activeFrame} sensors={sensors} trackHistory={trackHistory} />

        <aside className="right-rail" aria-label="Custody decision panels">
          <CustodyConfidence frame={activeFrame} />
          <NextBestSensor frame={activeFrame} sensor={recommendedSensor} />
          <SensorStatusPanel
            sensors={sensors}
            recommendedSensorId={activeFrame.recommendation.sensorId}
          />
        </aside>

        <TimelineReplay
          frames={frames}
          activeIndex={activeIndex}
          isPlaying={isPlaying}
          speed={speed}
          onSelectFrame={(index) => {
            setIsPlaying(false);
            setActiveIndex(index);
          }}
          onPlayToggle={() => setIsPlaying((current) => !current)}
          onReset={() => {
            setIsPlaying(false);
            setActiveIndex(0);
          }}
          onStep={handleStep}
          onSpeedChange={setSpeed}
        />
      </main>
    </div>
  );
}

export default App;
