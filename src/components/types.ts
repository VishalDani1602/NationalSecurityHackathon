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

export type CustodyFrame = {
  id: string;
  time: string;
  label: string;
  target: TrackPoint;
  confidence: number;
  state: "Firm" | "At Risk" | "Reacquiring";
  velocity: string;
  ambiguity: string;
  explanation: string[];
  supportingSensors: string[];
  contestedFactors: string[];
  recommendation: {
    sensorId: string;
    action: string;
    eta: string;
    expectedGain: number;
    reason: string;
    command: string;
  };
};
