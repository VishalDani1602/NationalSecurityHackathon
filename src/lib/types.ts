export type SensorType = "radar" | "eo" | "rf" | "ais";

export type TrackMode = "nominal" | "degraded" | "lost" | "reacquired";

export type Severity = "info" | "warning" | "critical" | "success";

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  vx: number;
  vy: number;
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  position: Point;
  range: number;
  bearing: number;
  fov: number;
  reliability: number;
  latencySec: number;
  color: string;
}

export interface TruthPoint {
  time: number;
  targetId: string;
  position: Point;
  velocity: Vector;
  heading: number;
}

export interface Target {
  id: string;
  name: string;
  role: "primary" | "decoy";
  color: string;
  truth: TruthPoint[];
}

export interface Detection {
  id: string;
  time: number;
  sensorId: string;
  sensorType: SensorType;
  position: Point;
  uncertainty: number;
  confidence: number;
  label: string;
  targetHint?: string;
  spoofed?: boolean;
}

export interface ScenarioEvent {
  time: number;
  title: string;
  severity: Severity;
  description: string;
}

export interface Scenario {
  name: string;
  duration: number;
  sensors: Sensor[];
  targets: Target[];
  detections: Detection[];
  events: ScenarioEvent[];
}

export interface Association {
  detection: Detection;
  accepted: boolean;
  score: number;
  residual: number;
  reason: string;
}

export interface TrackState {
  time: number;
  position: Point;
  velocity: Vector;
  uncertainty: number;
  confidence: number;
  mode: TrackMode;
}

export interface SensorRecommendation {
  sensorId: string;
  score: number;
  probability: number;
  reason: string;
}

export interface FusionFrame {
  time: number;
  track: TrackState;
  prediction: Point;
  detections: Detection[];
  associations: Association[];
  recommendation: SensorRecommendation;
  activeEvents: ScenarioEvent[];
}
