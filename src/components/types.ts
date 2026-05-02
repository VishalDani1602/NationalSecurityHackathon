export type SensorStatus = "tracking" | "searching" | "degraded" | "offline";

export type Sensor = {
  id: string;
  name: string;
  kind: "EO" | "SAR" | "SIGINT" | "UAS" | "AIS";
  status: SensorStatus;
  x: number;
  y: number;
  coverage: number;
  bearing: number;
  health: number;
  latency: string;
  mode: string;
  custodyContribution: number;
};

export type TrackPoint = {
  x: number;
  y: number;
};

export type DetectionMarker = TrackPoint & {
  id: string;
  sensorId: string;
  kind: Sensor["kind"];
  uncertainty: number;
  accepted: boolean;
  spoofed: boolean;
  label: string;
  score: number;
};

export type CustodyFrame = {
  id: string;
  time: string;
  label: string;
  target: TrackPoint;
  prediction: TrackPoint;
  uncertainty: number;
  confidence: number;
  state: "Firm" | "At Risk" | "Reacquiring";
  velocity: string;
  ambiguity: string;
  detections: DetectionMarker[];
  explanation: string[];
  supportingSensors: string[];
  contestedFactors: string[];
  metrics: {
    accepted: number;
    rejected: number;
    totalDetections: number;
    confidenceDelta: number;
    bestSensor: string;
  };
  eventCallout?: {
    title: string;
    description: string;
    severity: "info" | "warning" | "critical" | "success";
  };
  recommendation: {
    sensorId: string;
    action: string;
    eta: string;
    expectedGain: number;
    reason: string;
    command: string;
  };
};

export type JudgeDemoMoment = {
  id: string;
  frameIndex: number;
  label: string;
  cue: string;
  kind: "handoff" | "identity" | "gap" | "recovery" | "end-state";
};
