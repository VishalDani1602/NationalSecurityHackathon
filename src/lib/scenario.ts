import type {
  Detection as DemoDetection,
  Point as DemoPoint,
  Scenario as DemoScenario,
  ScenarioEvent as DemoScenarioEvent,
  Sensor as DemoSensor,
  SensorType as DemoSensorType,
  Target as DemoTarget,
  TruthPoint as DemoTruthPoint,
  Vector as DemoVector,
} from "./types";

export type SensorKind = "radar" | "eo" | "rf" | "ais";

export type TrackRole = "primary" | "decoy" | "ghost";

export type DetectionClassification =
  | "surface-contact"
  | "visual-contact"
  | "rf-emitter"
  | "ais-report"
  | "false-positive";

export type EventSeverity = "info" | "warning" | "critical";

export type CustodyState = "held" | "degraded" | "lost" | "reacquired";

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface ScenarioBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface TrackWaypoint extends GeoPoint {
  timeSec: number;
  speedKt: number;
  headingDeg: number;
}

export interface TrackState extends GeoPoint {
  timeSec: number;
  speedKt: number;
  headingDeg: number;
}

export interface ScenarioTrack {
  id: string;
  name: string;
  role: TrackRole;
  hull: string;
  notes: string;
  mmsi?: string;
  radioCallsign?: string;
  waypoints: TrackWaypoint[];
  states: TrackState[];
}

export interface ScenarioSensor {
  id: string;
  name: string;
  kind: SensorKind;
  platform: "shore" | "airborne" | "space" | "feed";
  position?: GeoPoint;
  rangeNm?: number;
  refreshSec: number;
  accuracyMeters: number;
  notes: string;
}

export interface SensorDetection extends GeoPoint {
  id: string;
  timeSec: number;
  sensorId: string;
  sensorKind: SensorKind;
  trueTrackId?: string;
  reportedTrackId: string;
  classification: DetectionClassification;
  confidence: number;
  rangeNm?: number;
  bearingDeg?: number;
  noiseMeters: number;
  spoofed: boolean;
  falsePositive: boolean;
  annotation?: string;
}

export interface MissedDetection {
  id: string;
  timeSec: number;
  sensorId: string;
  sensorKind: SensorKind;
  expectedTrackId: string;
  reason: string;
}

export interface ScenarioEvent {
  id: string;
  timeSec: number;
  title: string;
  description: string;
  severity: EventSeverity;
  relatedTrackIds: string[];
  relatedSensorIds: string[];
  tags: string[];
}

export interface CustodyAssessment {
  timeSec: number;
  state: CustodyState;
  primaryTrackId: string;
  confidence: number;
  rationale: string;
  contributingDetectionIds: string[];
}

export interface CustodyScenario {
  id: string;
  name: string;
  version: string;
  seed: string;
  startsAt: string;
  durationSec: number;
  timeStepSec: number;
  bounds: ScenarioBounds;
  tracks: ScenarioTrack[];
  sensors: ScenarioSensor[];
  detections: SensorDetection[];
  missedDetections: MissedDetection[];
  events: ScenarioEvent[];
  custody: CustodyAssessment[];
}

export interface CustodyScenarioOptions {
  seed?: string;
  startsAt?: string;
  durationSec?: number;
  timeStepSec?: number;
}

export const DEFAULT_CUSTODY_SCENARIO_SEED = "custodyos-maritime-contested-v1";

const PRIMARY_TRACK_ID = "primary-meridian-star";
const DEMO_PRIMARY_TARGET_ID = "vessel-kestrel";
const DEMO_DURATION_TICKS = 32;
const DEMO_CHART = { width: 1100, height: 680 };

const DEMO_SENSOR_IDS: Record<string, string> = {
  "radar-talon-shore": "radar-north",
  "eo-kestrel-uav": "eo-drone",
  "rf-cobra-baseline": "rf-array",
  "ais-openwater-feed": "ais-feed",
};

const DEMO_TARGET_IDS: Record<string, string> = {
  [PRIMARY_TRACK_ID]: DEMO_PRIMARY_TARGET_ID,
  "decoy-coral-merchant": "decoy-coral",
  "decoy-sable-clone": "decoy-sable",
  "decoy-quiet-dhow": "decoy-quiet",
};

const TRACK_PROFILES: Array<Omit<ScenarioTrack, "states">> = [
  {
    id: PRIMARY_TRACK_ID,
    name: "MV Meridian Star",
    role: "primary",
    hull: "gray-market coastal freighter",
    mmsi: "538009471",
    radioCallsign: "MERIDIAN-41",
    notes:
      "Primary vessel. Maintains a plausible merchant course before cutting across a busy lane during spoofing.",
    waypoints: [
      { timeSec: 0, lat: 18.84, lon: 118.18, speedKt: 17.6, headingDeg: 76 },
      { timeSec: 240, lat: 18.88, lon: 118.32, speedKt: 18.2, headingDeg: 72 },
      { timeSec: 480, lat: 18.94, lon: 118.49, speedKt: 19.1, headingDeg: 69 },
      { timeSec: 720, lat: 18.99, lon: 118.65, speedKt: 22.4, headingDeg: 69 },
      { timeSec: 960, lat: 19.04, lon: 118.83, speedKt: 20.8, headingDeg: 72 },
      { timeSec: 1200, lat: 19.08, lon: 119.0, speedKt: 18.9, headingDeg: 78 },
    ],
  },
  {
    id: "decoy-coral-merchant",
    name: "FV Coral Merchant",
    role: "decoy",
    hull: "small trawler with radar reflector",
    mmsi: "412778203",
    radioCallsign: "CORAL-12",
    notes:
      "Decoy one. Crosses behind the primary to create a radar merge in sea clutter.",
    waypoints: [
      { timeSec: 0, lat: 18.75, lon: 118.41, speedKt: 9.4, headingDeg: 24 },
      { timeSec: 240, lat: 18.83, lon: 118.45, speedKt: 10.2, headingDeg: 26 },
      { timeSec: 480, lat: 18.91, lon: 118.51, speedKt: 12.5, headingDeg: 35 },
      { timeSec: 720, lat: 19.01, lon: 118.62, speedKt: 15.3, headingDeg: 51 },
      { timeSec: 960, lat: 19.08, lon: 118.75, speedKt: 13.2, headingDeg: 62 },
      { timeSec: 1200, lat: 19.13, lon: 118.87, speedKt: 11.1, headingDeg: 69 },
    ],
  },
  {
    id: "decoy-sable-clone",
    name: "Sable Clone",
    role: "decoy",
    hull: "fast craft broadcasting cloned AIS",
    mmsi: "538009471",
    radioCallsign: "MERIDIAN-41",
    notes:
      "Decoy two. Broadcasts the primary identity during the contested interval, then splits south.",
    waypoints: [
      { timeSec: 0, lat: 18.91, lon: 118.13, speedKt: 16.2, headingDeg: 84 },
      { timeSec: 240, lat: 18.93, lon: 118.29, speedKt: 17.1, headingDeg: 82 },
      { timeSec: 480, lat: 18.96, lon: 118.48, speedKt: 21.8, headingDeg: 88 },
      { timeSec: 720, lat: 18.93, lon: 118.69, speedKt: 28.6, headingDeg: 111 },
      { timeSec: 960, lat: 18.85, lon: 118.91, speedKt: 30.4, headingDeg: 116 },
      { timeSec: 1200, lat: 18.75, lon: 119.12, speedKt: 26.7, headingDeg: 120 },
    ],
  },
  {
    id: "decoy-quiet-dhow",
    name: "Quiet Dhow",
    role: "decoy",
    hull: "wooden dhow with AIS silent",
    notes:
      "Decoy three. Low radar cross section and AIS silent; produces intermittent EO-only ambiguity.",
    waypoints: [
      { timeSec: 0, lat: 19.05, lon: 118.3, speedKt: 7.6, headingDeg: 161 },
      { timeSec: 240, lat: 19.0, lon: 118.34, speedKt: 7.9, headingDeg: 150 },
      { timeSec: 480, lat: 18.96, lon: 118.39, speedKt: 8.4, headingDeg: 138 },
      { timeSec: 720, lat: 18.93, lon: 118.46, speedKt: 9.0, headingDeg: 123 },
      { timeSec: 960, lat: 18.93, lon: 118.56, speedKt: 9.8, headingDeg: 96 },
      { timeSec: 1200, lat: 18.94, lon: 118.67, speedKt: 10.1, headingDeg: 86 },
    ],
  },
];

const SENSORS: ScenarioSensor[] = [
  {
    id: "radar-talon-shore",
    name: "Talon Shore Radar",
    kind: "radar",
    platform: "shore",
    position: { lat: 18.62, lon: 117.96 },
    rangeNm: 82,
    refreshSec: 60,
    accuracyMeters: 85,
    notes:
      "Wide-area maritime radar. Degrades during the merge and throws deterministic sea-clutter false positives.",
  },
  {
    id: "eo-kestrel-uav",
    name: "Kestrel UAV EO",
    kind: "eo",
    platform: "airborne",
    position: { lat: 19.18, lon: 118.72 },
    rangeNm: 44,
    refreshSec: 120,
    accuracyMeters: 32,
    notes:
      "Electro-optical camera from an unmanned orbit. Weather and wake clutter drive misses in the middle act.",
  },
  {
    id: "rf-cobra-baseline",
    name: "Cobra RF Baseline",
    kind: "rf",
    platform: "shore",
    position: { lat: 18.48, lon: 118.82 },
    rangeNm: 95,
    refreshSec: 60,
    accuracyMeters: 240,
    notes:
      "Passive RF geolocation. Sparse emitter bursts provide reacquisition cues when AIS is untrusted.",
  },
  {
    id: "ais-openwater-feed",
    name: "Openwater AIS Feed",
    kind: "ais",
    platform: "feed",
    refreshSec: 60,
    accuracyMeters: 18,
    notes:
      "Commercial AIS-style track feed. Includes cloned identity and ghost track reports.",
  },
];

const SCENARIO_EVENTS: ScenarioEvent[] = [
  {
    id: "evt-start",
    timeSec: 0,
    title: "Custody handoff begins",
    description:
      "The primary vessel is held by radar, AIS, and intermittent RF in a congested exercise box.",
    severity: "info",
    relatedTrackIds: [PRIMARY_TRACK_ID],
    relatedSensorIds: ["radar-talon-shore", "ais-openwater-feed", "rf-cobra-baseline"],
    tags: ["handoff", "baseline"],
  },
  {
    id: "evt-decoys-enter",
    timeSec: 240,
    title: "Decoy screen enters lane",
    description:
      "Two cooperative decoys shape a crossing geometry while a low-signature dhow remains AIS silent.",
    severity: "warning",
    relatedTrackIds: ["decoy-coral-merchant", "decoy-sable-clone", "decoy-quiet-dhow"],
    relatedSensorIds: ["radar-talon-shore", "eo-kestrel-uav", "ais-openwater-feed"],
    tags: ["decoy", "traffic-density"],
  },
  {
    id: "evt-ais-spoof-start",
    timeSec: 420,
    title: "AIS identity clone starts",
    description:
      "The fast decoy begins broadcasting the primary MMSI and callsign while the primary emits inconsistent AIS positions.",
    severity: "critical",
    relatedTrackIds: [PRIMARY_TRACK_ID, "decoy-sable-clone"],
    relatedSensorIds: ["ais-openwater-feed"],
    tags: ["spoofing", "identity-clone"],
  },
  {
    id: "evt-sensor-gap",
    timeSec: 540,
    title: "Radar and EO custody gap",
    description:
      "Sea clutter, crossing geometry, and a low cloud deck produce simultaneous radar and EO misses on the primary.",
    severity: "critical",
    relatedTrackIds: [PRIMARY_TRACK_ID, "decoy-coral-merchant", "decoy-sable-clone"],
    relatedSensorIds: ["radar-talon-shore", "eo-kestrel-uav"],
    tags: ["missed-detection", "custody-lost"],
  },
  {
    id: "evt-ais-ghost",
    timeSec: 660,
    title: "AIS ghost appears",
    description:
      "A non-physical AIS report appears north of the track fan and temporarily competes with the primary hypothesis.",
    severity: "warning",
    relatedTrackIds: ["ghost-ais-meridian"],
    relatedSensorIds: ["ais-openwater-feed"],
    tags: ["spoofing", "ghost-track"],
  },
  {
    id: "evt-rf-reacquire",
    timeSec: 780,
    title: "RF burst enables reacquisition",
    description:
      "A short VHF push-to-talk burst aligns with the radar contact east of the clutter merge and rejects the cloned AIS path.",
    severity: "info",
    relatedTrackIds: [PRIMARY_TRACK_ID],
    relatedSensorIds: ["rf-cobra-baseline", "radar-talon-shore"],
    tags: ["reacquisition", "rf-cue"],
  },
  {
    id: "evt-decoy-split",
    timeSec: 960,
    title: "Decoys split away",
    description:
      "The cloned AIS decoy accelerates south while the primary resumes a merchant-like speed profile.",
    severity: "warning",
    relatedTrackIds: [PRIMARY_TRACK_ID, "decoy-sable-clone"],
    relatedSensorIds: ["radar-talon-shore", "ais-openwater-feed"],
    tags: ["decoy", "track-split"],
  },
  {
    id: "evt-end",
    timeSec: 1200,
    title: "Scenario complete",
    description:
      "Custody remains with the radar/RF-supported primary track while the spoofed AIS path is marked as a decoy.",
    severity: "info",
    relatedTrackIds: [PRIMARY_TRACK_ID, "decoy-sable-clone"],
    relatedSensorIds: ["radar-talon-shore", "rf-cobra-baseline", "ais-openwater-feed"],
    tags: ["end-state", "custody-held"],
  },
];

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCustodyScenario(
  options: CustodyScenarioOptions = {},
): CustodyScenario {
  const seed = options.seed ?? DEFAULT_CUSTODY_SCENARIO_SEED;
  const startsAt = options.startsAt ?? "2026-05-02T16:00:00.000Z";
  const durationSec = options.durationSec ?? 1200;
  const timeStepSec = options.timeStepSec ?? 60;
  const rng = createSeededRandom(seed);

  const tracks = TRACK_PROFILES.map((track) => ({
    ...track,
    states: createTrackStates(track.waypoints, durationSec, timeStepSec),
  }));

  const detections: SensorDetection[] = [];
  const missedDetections: MissedDetection[] = [];

  for (let timeSec = 0; timeSec <= durationSec; timeSec += timeStepSec) {
    for (const sensor of SENSORS) {
      if (timeSec % sensor.refreshSec !== 0) {
        continue;
      }

      for (const track of tracks) {
        const state = getTrackState(track, timeSec);
        const decision = evaluateDetection(sensor, track, timeSec, rng);

        if (decision.detected) {
          detections.push(
            createDetection({
              scenarioSeed: seed,
              sensor,
              track,
              state,
              timeSec,
              rng,
              spoofed: decision.spoofed,
              reportedTrackId: decision.reportedTrackId,
              confidence: decision.confidence,
              annotation: decision.annotation,
            }),
          );
        } else if (decision.reason) {
          missedDetections.push({
            id: makeId("miss", sensor.id, track.id, timeSec),
            timeSec,
            sensorId: sensor.id,
            sensorKind: sensor.kind,
            expectedTrackId: track.id,
            reason: decision.reason,
          });
        }
      }
    }

    detections.push(...createFalseDetections(timeSec, rng));
  }

  return {
    id: "custodyos-maritime-contested",
    name: "CustodyOS Maritime Contested Reacquisition",
    version: "1.0.0",
    seed,
    startsAt,
    durationSec,
    timeStepSec,
    bounds: {
      north: 19.24,
      south: 18.42,
      east: 119.2,
      west: 117.9,
    },
    tracks,
    sensors: SENSORS,
    detections: detections.sort(sortByTimeThenId),
    missedDetections: missedDetections.sort(sortByTimeThenId),
    events: SCENARIO_EVENTS,
    custody: createCustodyAssessments(detections),
  };
}

export function createScenario(options: CustodyScenarioOptions = {}): DemoScenario {
  return adaptToDemoScenario(createCustodyScenario(options));
}

export function buildScenario(options: CustodyScenarioOptions = {}): DemoScenario {
  return createScenario(options);
}

export const scenario = createScenario();

function adaptToDemoScenario(custodyScenario: CustodyScenario): DemoScenario {
  return {
    name: "Maritime contested custody",
    duration: DEMO_DURATION_TICKS,
    sensors: createDemoSensors(custodyScenario),
    targets: createDemoTargets(custodyScenario),
    detections: createDemoDetections(custodyScenario),
    events: createDemoEvents(custodyScenario),
  };
}

function createDemoSensors(custodyScenario: CustodyScenario): DemoSensor[] {
  return custodyScenario.sensors.map((sensor) => {
    const position = sensor.position
      ? geoToDemoPoint(sensor.position, custodyScenario.bounds)
      : getFeedPosition(sensor.kind);

    return {
      id: DEMO_SENSOR_IDS[sensor.id] ?? sensor.id,
      name: getDemoSensorName(sensor),
      type: sensor.kind as DemoSensorType,
      position,
      range: getDemoSensorRange(sensor.kind),
      bearing: getDemoSensorBearing(sensor.kind),
      fov: getDemoSensorFov(sensor.kind),
      reliability: getDemoSensorReliability(sensor.kind),
      latencySec: sensor.refreshSec,
      color: getDemoSensorColor(sensor.kind),
    };
  });
}

function createDemoTargets(custodyScenario: CustodyScenario): DemoTarget[] {
  return custodyScenario.tracks.map((track, index) => ({
    id: DEMO_TARGET_IDS[track.id] ?? track.id,
    name: track.name,
    role: track.role === "primary" ? "primary" : "decoy",
    color: getDemoTargetColor(track.role, index),
    truth: createDemoTruth(custodyScenario, track),
  }));
}

function createDemoTruth(
  custodyScenario: CustodyScenario,
  track: ScenarioTrack,
): DemoTruthPoint[] {
  const truth: DemoTruthPoint[] = [];

  for (let time = 0; time <= DEMO_DURATION_TICKS; time += 1) {
    const sourceTimeSec = demoTickToScenarioSeconds(time, custodyScenario.durationSec);
    const state = interpolateWaypoint(track.waypoints, sourceTimeSec);
    const position = geoToDemoPoint(state, custodyScenario.bounds);
    const previous = truth.at(-1);

    truth.push({
      time,
      targetId: DEMO_TARGET_IDS[track.id] ?? track.id,
      position,
      velocity: previous
        ? {
            vx: roundValue(position.x - previous.position.x, 2),
            vy: roundValue(position.y - previous.position.y, 2),
          }
        : initialDemoVelocity(track, custodyScenario.bounds),
      heading: state.headingDeg,
    });
  }

  return truth;
}

function createDemoDetections(custodyScenario: CustodyScenario): DemoDetection[] {
  const selected = custodyScenario.detections.filter((detection) => {
    if (detection.falsePositive) {
      return true;
    }

    if (detection.trueTrackId === PRIMARY_TRACK_ID) {
      return true;
    }

    if (detection.spoofed || detection.reportedTrackId === PRIMARY_TRACK_ID) {
      return true;
    }

    return (
      detection.trueTrackId === "decoy-coral-merchant" ||
      detection.trueTrackId === "decoy-sable-clone" ||
      detection.trueTrackId === "decoy-quiet-dhow"
    );
  });

  return selected.map((detection) => ({
    id: detection.id,
    time: scenarioSecondsToDemoTick(detection.timeSec, custodyScenario.durationSec),
    sensorId: DEMO_SENSOR_IDS[detection.sensorId] ?? detection.sensorId,
    sensorType: detection.sensorKind as DemoSensorType,
    position: geoToDemoPoint(detection, custodyScenario.bounds),
    uncertainty: getDemoUncertainty(detection),
    confidence: detection.confidence,
    label: getDemoDetectionLabel(detection),
    targetHint: getDemoTargetHint(detection),
    spoofed: detection.spoofed || detection.falsePositive,
  }));
}

function createDemoEvents(custodyScenario: CustodyScenario): DemoScenarioEvent[] {
  return custodyScenario.events.map((event) => ({
    time: scenarioSecondsToDemoTick(event.timeSec, custodyScenario.durationSec),
    title: event.title,
    severity: event.id === "evt-rf-reacquire" ? "success" : event.severity,
    description: event.description,
  }));
}

function geoToDemoPoint(point: GeoPoint, bounds: ScenarioBounds): DemoPoint {
  const marginX = 70;
  const marginY = 58;
  const usableWidth = DEMO_CHART.width - marginX * 2;
  const usableHeight = DEMO_CHART.height - marginY * 2;
  const x = marginX + ((point.lon - bounds.west) / (bounds.east - bounds.west)) * usableWidth;
  const y = marginY + ((bounds.north - point.lat) / (bounds.north - bounds.south)) * usableHeight;

  return {
    x: roundValue(x, 2),
    y: roundValue(y, 2),
  };
}

function getFeedPosition(sensorKind: SensorKind): DemoPoint {
  if (sensorKind === "ais") {
    return { x: 1014, y: 112 };
  }

  return { x: 60, y: 620 };
}

function getDemoSensorName(sensor: ScenarioSensor): string {
  if (sensor.kind === "radar") {
    return "North radar";
  }

  if (sensor.kind === "eo") {
    return "Kestrel EO";
  }

  if (sensor.kind === "rf") {
    return "RF array";
  }

  return "AIS feed";
}

function getDemoSensorRange(sensorKind: SensorKind): number {
  if (sensorKind === "radar") {
    return 390;
  }

  if (sensorKind === "eo") {
    return 255;
  }

  if (sensorKind === "rf") {
    return 360;
  }

  return 820;
}

function getDemoSensorBearing(sensorKind: SensorKind): number {
  if (sensorKind === "radar") {
    return 332;
  }

  if (sensorKind === "eo") {
    return 205;
  }

  if (sensorKind === "rf") {
    return 286;
  }

  return 180;
}

function getDemoSensorFov(sensorKind: SensorKind): number {
  if (sensorKind === "radar") {
    return 112;
  }

  if (sensorKind === "eo") {
    return 64;
  }

  if (sensorKind === "rf") {
    return 88;
  }

  return 359;
}

function getDemoSensorReliability(sensorKind: SensorKind): number {
  if (sensorKind === "radar") {
    return 0.8;
  }

  if (sensorKind === "eo") {
    return 0.62;
  }

  if (sensorKind === "rf") {
    return 0.72;
  }

  return 0.54;
}

function getDemoSensorColor(sensorKind: SensorKind): string {
  if (sensorKind === "radar") {
    return "#6ee7b7";
  }

  if (sensorKind === "eo") {
    return "#f8c76d";
  }

  if (sensorKind === "rf") {
    return "#7dd3fc";
  }

  return "#f472b6";
}

function getDemoTargetColor(role: TrackRole, index: number): string {
  if (role === "primary") {
    return "#e6f2ff";
  }

  return ["#f59e0b", "#fb7185", "#a7f3d0"][index % 3];
}

function initialDemoVelocity(track: ScenarioTrack, bounds: ScenarioBounds): DemoVector {
  const first = interpolateWaypoint(track.waypoints, 0);
  const next = interpolateWaypoint(track.waypoints, 60);
  const firstPoint = geoToDemoPoint(first, bounds);
  const nextPoint = geoToDemoPoint(next, bounds);

  return {
    vx: roundValue(nextPoint.x - firstPoint.x, 2),
    vy: roundValue(nextPoint.y - firstPoint.y, 2),
  };
}

function demoTickToScenarioSeconds(time: number, durationSec: number): number {
  return roundValue((time / DEMO_DURATION_TICKS) * durationSec, 0);
}

function scenarioSecondsToDemoTick(timeSec: number, durationSec: number): number {
  return Math.min(
    DEMO_DURATION_TICKS,
    Math.max(0, Math.round((timeSec / durationSec) * DEMO_DURATION_TICKS)),
  );
}

function getDemoUncertainty(detection: SensorDetection): number {
  const baseBySensor: Record<SensorKind, number> = {
    radar: 28,
    eo: 20,
    rf: 72,
    ais: 24,
  };
  const spoofPenalty = detection.spoofed ? 26 : 0;
  const falsePositivePenalty = detection.falsePositive ? 34 : 0;

  return baseBySensor[detection.sensorKind] + spoofPenalty + falsePositivePenalty;
}

function getDemoDetectionLabel(detection: SensorDetection): string {
  const sensorLabel = detection.sensorKind.toUpperCase();

  if (detection.falsePositive) {
    return `${sensorLabel} false report`;
  }

  if (detection.spoofed) {
    return `${sensorLabel} spoof candidate`;
  }

  if (detection.trueTrackId === PRIMARY_TRACK_ID) {
    return `${sensorLabel} primary vessel`;
  }

  return `${sensorLabel} decoy contact`;
}

function getDemoTargetHint(detection: SensorDetection): string | undefined {
  if (
    detection.reportedTrackId === PRIMARY_TRACK_ID ||
    detection.reportedTrackId === "ais-inconsistent-meridian"
  ) {
    return DEMO_PRIMARY_TARGET_ID;
  }

  if (detection.trueTrackId) {
    return DEMO_TARGET_IDS[detection.trueTrackId] ?? detection.trueTrackId;
  }

  return undefined;
}

function createTrackStates(
  waypoints: TrackWaypoint[],
  durationSec: number,
  timeStepSec: number,
): TrackState[] {
  const states: TrackState[] = [];

  for (let timeSec = 0; timeSec <= durationSec; timeSec += timeStepSec) {
    states.push(interpolateWaypoint(waypoints, timeSec));
  }

  return states;
}

function interpolateWaypoint(
  waypoints: TrackWaypoint[],
  timeSec: number,
): TrackState {
  const lastWaypoint = waypoints[waypoints.length - 1];

  if (timeSec <= waypoints[0].timeSec) {
    return { ...waypoints[0], timeSec };
  }

  if (timeSec >= lastWaypoint.timeSec) {
    return { ...lastWaypoint, timeSec };
  }

  const nextIndex = waypoints.findIndex((point) => point.timeSec >= timeSec);
  const start = waypoints[nextIndex - 1];
  const end = waypoints[nextIndex];
  const segmentDurationSec = end.timeSec - start.timeSec;
  const progress = (timeSec - start.timeSec) / segmentDurationSec;

  return {
    timeSec,
    lat: roundCoordinate(lerp(start.lat, end.lat, progress)),
    lon: roundCoordinate(lerp(start.lon, end.lon, progress)),
    speedKt: roundValue(lerp(start.speedKt, end.speedKt, progress), 1),
    headingDeg: roundValue(interpolateHeading(start.headingDeg, end.headingDeg, progress), 1),
  };
}

function evaluateDetection(
  sensor: ScenarioSensor,
  track: ScenarioTrack,
  timeSec: number,
  rng: () => number,
):
  | {
      detected: true;
      spoofed: boolean;
      reportedTrackId: string;
      confidence: number;
      annotation?: string;
    }
  | { detected: false; reason?: string } {
  const randomDrop = rng();

  if (sensor.kind === "ais") {
    return evaluateAisDetection(track, timeSec);
  }

  if (sensor.kind === "rf") {
    return evaluateRfDetection(track, timeSec);
  }

  if (sensor.kind === "eo") {
    return evaluateEoDetection(track, timeSec, randomDrop);
  }

  return evaluateRadarDetection(track, timeSec, randomDrop);
}

function evaluateAisDetection(
  track: ScenarioTrack,
  timeSec: number,
):
  | {
      detected: true;
      spoofed: boolean;
      reportedTrackId: string;
      confidence: number;
      annotation?: string;
    }
  | { detected: false; reason?: string } {
  if (track.id === "decoy-quiet-dhow") {
    return {
      detected: false,
      reason: "Target is AIS silent; no cooperative broadcast available.",
    };
  }

  if (track.id === PRIMARY_TRACK_ID && timeSec >= 420 && timeSec <= 720) {
    return {
      detected: true,
      spoofed: true,
      reportedTrackId: "ais-inconsistent-meridian",
      confidence: 0.48,
      annotation: "Primary AIS report is intentionally offset during spoofing window.",
    };
  }

  if (track.id === "decoy-sable-clone" && timeSec >= 420 && timeSec <= 900) {
    return {
      detected: true,
      spoofed: true,
      reportedTrackId: PRIMARY_TRACK_ID,
      confidence: 0.57,
      annotation: "Decoy is broadcasting the primary vessel MMSI and callsign.",
    };
  }

  return {
    detected: true,
    spoofed: false,
    reportedTrackId: track.id,
    confidence: track.role === "primary" ? 0.86 : 0.78,
  };
}

function evaluateRfDetection(
  track: ScenarioTrack,
  timeSec: number,
):
  | {
      detected: true;
      spoofed: boolean;
      reportedTrackId: string;
      confidence: number;
      annotation?: string;
    }
  | { detected: false; reason?: string } {
  const primaryBurstTimes = new Set([0, 300, 780, 1020]);
  const decoyBurstTimes = new Set([480, 900]);

  if (track.id === PRIMARY_TRACK_ID && primaryBurstTimes.has(timeSec)) {
    return {
      detected: true,
      spoofed: false,
      reportedTrackId: track.id,
      confidence: timeSec === 780 ? 0.84 : 0.72,
      annotation:
        timeSec === 780
          ? "Short VHF burst aligns with radar track after custody gap."
          : undefined,
    };
  }

  if (track.id === "decoy-sable-clone" && decoyBurstTimes.has(timeSec)) {
    return {
      detected: true,
      spoofed: false,
      reportedTrackId: track.id,
      confidence: 0.53,
      annotation: "Weak decoy radio burst; does not match primary RF fingerprint.",
    };
  }

  if (track.id === PRIMARY_TRACK_ID && [540, 600, 660, 720].includes(timeSec)) {
    return {
      detected: false,
      reason: "Primary is RF silent during the custody gap.",
    };
  }

  return { detected: false };
}

function evaluateEoDetection(
  track: ScenarioTrack,
  timeSec: number,
  randomDrop: number,
):
  | {
      detected: true;
      spoofed: boolean;
      reportedTrackId: string;
      confidence: number;
      annotation?: string;
    }
  | { detected: false; reason?: string } {
  if (track.id === PRIMARY_TRACK_ID && timeSec >= 480 && timeSec <= 720) {
    return {
      detected: false,
      reason: "Primary masked by low cloud deck, sun glint, and wake clutter.",
    };
  }

  if (track.id === "decoy-quiet-dhow" && [240, 600, 840].includes(timeSec)) {
    return {
      detected: true,
      spoofed: false,
      reportedTrackId: track.id,
      confidence: 0.49,
      annotation: "Intermittent visual contact on AIS-silent low-signature decoy.",
    };
  }

  if (timeSec % 120 !== 0) {
    return { detected: false };
  }

  if (randomDrop < 0.08) {
    return {
      detected: false,
      reason: "Deterministic EO miss from haze and platform vibration.",
    };
  }

  return {
    detected: true,
    spoofed: false,
    reportedTrackId: track.id,
    confidence: track.role === "primary" ? 0.74 : 0.63,
  };
}

function evaluateRadarDetection(
  track: ScenarioTrack,
  timeSec: number,
  randomDrop: number,
):
  | {
      detected: true;
      spoofed: boolean;
      reportedTrackId: string;
      confidence: number;
      annotation?: string;
    }
  | { detected: false; reason?: string } {
  if (track.id === PRIMARY_TRACK_ID && [540, 600].includes(timeSec)) {
    return {
      detected: false,
      reason: "Primary radar return merged with decoy and sea clutter.",
    };
  }

  if (track.id === "decoy-coral-merchant" && [540, 600].includes(timeSec)) {
    return {
      detected: true,
      spoofed: false,
      reportedTrackId: "merged-radar-contact",
      confidence: 0.58,
      annotation: "Radar merge contact: decoy geometry overlaps primary gate.",
    };
  }

  if (track.id === "decoy-quiet-dhow" && randomDrop < 0.35) {
    return {
      detected: false,
      reason: "Low radar cross section decoy below detection threshold.",
    };
  }

  if (randomDrop < 0.04) {
    return {
      detected: false,
      reason: "Deterministic sea-clutter miss.",
    };
  }

  return {
    detected: true,
    spoofed: false,
    reportedTrackId: track.id,
    confidence: track.role === "primary" ? 0.82 : 0.69,
  };
}

function createDetection(input: {
  scenarioSeed: string;
  sensor: ScenarioSensor;
  track: ScenarioTrack;
  state: TrackState;
  timeSec: number;
  rng: () => number;
  spoofed: boolean;
  reportedTrackId: string;
  confidence: number;
  annotation?: string;
}): SensorDetection {
  const { sensor, track, state, timeSec, rng, spoofed, reportedTrackId, confidence, annotation } =
    input;
  const effectiveState =
    sensor.kind === "ais" && spoofed
      ? createSpoofedAisPosition(track, state, timeSec)
      : state;
  const noise = createSensorNoise(sensor, rng);
  const noisyPoint = offsetPointMeters(effectiveState, noise.eastMeters, noise.northMeters);
  const rangeBearing =
    sensor.position === undefined
      ? undefined
      : calculateRangeBearing(sensor.position, noisyPoint);

  return {
    id: makeId("det", input.scenarioSeed, sensor.id, track.id, timeSec, reportedTrackId),
    timeSec,
    sensorId: sensor.id,
    sensorKind: sensor.kind,
    trueTrackId: track.id,
    reportedTrackId,
    classification: classifyDetection(sensor.kind),
    lat: roundCoordinate(noisyPoint.lat),
    lon: roundCoordinate(noisyPoint.lon),
    confidence: roundValue(confidence, 2),
    rangeNm: rangeBearing?.rangeNm,
    bearingDeg: rangeBearing?.bearingDeg,
    noiseMeters: roundValue(noise.magnitudeMeters, 1),
    spoofed,
    falsePositive: false,
    annotation,
  };
}

function createFalseDetections(timeSec: number, rng: () => number): SensorDetection[] {
  const falseDetections: SensorDetection[] = [];

  if ([360, 600, 660].includes(timeSec)) {
    const point = offsetPointMeters(
      { lat: 18.88, lon: 118.55 },
      (rng() - 0.5) * 7200,
      (rng() - 0.5) * 5400,
    );
    falseDetections.push({
      id: makeId("false", "radar-talon-shore", timeSec),
      timeSec,
      sensorId: "radar-talon-shore",
      sensorKind: "radar",
      reportedTrackId: "radar-sea-clutter",
      classification: "false-positive",
      lat: roundCoordinate(point.lat),
      lon: roundCoordinate(point.lon),
      confidence: 0.28,
      rangeNm: undefined,
      bearingDeg: undefined,
      noiseMeters: 0,
      spoofed: false,
      falsePositive: true,
      annotation: "Sea-state clutter cell promoted to a tentative track.",
    });
  }

  if ([660, 720].includes(timeSec)) {
    falseDetections.push({
      id: makeId("ghost", "ais-openwater-feed", timeSec),
      timeSec,
      sensorId: "ais-openwater-feed",
      sensorKind: "ais",
      reportedTrackId: "ghost-ais-meridian",
      classification: "ais-report",
      lat: roundCoordinate(19.12 + (rng() - 0.5) * 0.03),
      lon: roundCoordinate(118.74 + (rng() - 0.5) * 0.04),
      confidence: 0.31,
      noiseMeters: 0,
      spoofed: true,
      falsePositive: true,
      annotation: "Non-physical AIS report with the primary callsign but no radar support.",
    });
  }

  return falseDetections;
}

function createCustodyAssessments(detections: SensorDetection[]): CustodyAssessment[] {
  return [0, 240, 420, 540, 660, 780, 960, 1200].map((timeSec) => {
    const contributingDetectionIds = detections
      .filter((detection) => {
        if (detection.timeSec !== timeSec) {
          return false;
        }

        return (
          detection.trueTrackId === PRIMARY_TRACK_ID ||
          detection.reportedTrackId === PRIMARY_TRACK_ID ||
          detection.reportedTrackId === "ais-inconsistent-meridian" ||
          detection.reportedTrackId === "merged-radar-contact"
        );
      })
      .map((detection) => detection.id);

    const state = getCustodyState(timeSec);

    return {
      timeSec,
      state,
      primaryTrackId: PRIMARY_TRACK_ID,
      confidence: getCustodyConfidence(timeSec),
      rationale: getCustodyRationale(timeSec),
      contributingDetectionIds,
    };
  });
}

function createSpoofedAisPosition(
  track: ScenarioTrack,
  state: TrackState,
  timeSec: number,
): TrackState {
  if (track.id === PRIMARY_TRACK_ID) {
    return {
      ...state,
      lat: roundCoordinate(state.lat + 0.045),
      lon: roundCoordinate(state.lon - 0.055),
    };
  }

  if (track.id === "decoy-sable-clone" && timeSec >= 420 && timeSec <= 900) {
    return {
      ...state,
      lat: roundCoordinate(state.lat + 0.018),
      lon: roundCoordinate(state.lon - 0.02),
    };
  }

  return state;
}

function createSensorNoise(
  sensor: ScenarioSensor,
  rng: () => number,
): { eastMeters: number; northMeters: number; magnitudeMeters: number } {
  const angle = rng() * Math.PI * 2;
  const distance = sensor.accuracyMeters * Math.sqrt(rng());
  const eastMeters = Math.cos(angle) * distance;
  const northMeters = Math.sin(angle) * distance;

  return {
    eastMeters,
    northMeters,
    magnitudeMeters: Math.hypot(eastMeters, northMeters),
  };
}

function getTrackState(track: ScenarioTrack, timeSec: number): TrackState {
  const state = track.states.find((candidate) => candidate.timeSec === timeSec);

  if (state === undefined) {
    return interpolateWaypoint(track.waypoints, timeSec);
  }

  return state;
}

function getCustodyState(timeSec: number): CustodyState {
  if (timeSec >= 540 && timeSec < 780) {
    return "lost";
  }

  if (timeSec >= 420 && timeSec < 540) {
    return "degraded";
  }

  if (timeSec >= 780 && timeSec < 960) {
    return "reacquired";
  }

  return "held";
}

function getCustodyConfidence(timeSec: number): number {
  if (timeSec >= 540 && timeSec < 660) {
    return 0.34;
  }

  if (timeSec >= 660 && timeSec < 780) {
    return 0.29;
  }

  if (timeSec >= 420 && timeSec < 540) {
    return 0.56;
  }

  if (timeSec >= 780 && timeSec < 960) {
    return 0.78;
  }

  return timeSec >= 960 ? 0.88 : 0.83;
}

function getCustodyRationale(timeSec: number): string {
  if (timeSec >= 540 && timeSec < 660) {
    return "Primary radar and EO detections are both missing while cloned AIS remains active.";
  }

  if (timeSec >= 660 && timeSec < 780) {
    return "AIS ghost and cloned identity compete with the last reliable primary track.";
  }

  if (timeSec >= 420 && timeSec < 540) {
    return "AIS identity conflict degrades custody, but radar still supports the primary hypothesis.";
  }

  if (timeSec >= 780 && timeSec < 960) {
    return "RF burst and renewed radar contact reacquire the primary east of the merge.";
  }

  if (timeSec >= 960) {
    return "Decoy split and multi-sensor agreement stabilize custody on the primary.";
  }

  return "Radar, AIS, and sparse RF agree on the primary track.";
}

function classifyDetection(sensorKind: SensorKind): DetectionClassification {
  if (sensorKind === "eo") {
    return "visual-contact";
  }

  if (sensorKind === "rf") {
    return "rf-emitter";
  }

  if (sensorKind === "ais") {
    return "ais-report";
  }

  return "surface-contact";
}

function calculateRangeBearing(origin: GeoPoint, point: GeoPoint): {
  rangeNm: number;
  bearingDeg: number;
} {
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(point.lat);
  const deltaLat = toRadians(point.lat - origin.lat);
  const deltaLon = toRadians(point.lon - origin.lon);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const distanceMeters = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const bearingDeg = (toDegrees(Math.atan2(y, x)) + 360) % 360;

  return {
    rangeNm: roundValue(distanceMeters / 1852, 1),
    bearingDeg: roundValue(bearingDeg, 1),
  };
}

function offsetPointMeters(point: GeoPoint, eastMeters: number, northMeters: number): GeoPoint {
  const lat = point.lat + northMeters / 111320;
  const lon = point.lon + eastMeters / (111320 * Math.cos(toRadians(point.lat)));

  return {
    lat: roundCoordinate(lat),
    lon: roundCoordinate(lon),
  };
}

function interpolateHeading(startDeg: number, endDeg: number, progress: number): number {
  const delta = ((((endDeg - startDeg) % 360) + 540) % 360) - 180;
  return (startDeg + delta * progress + 360) % 360;
}

function sortByTimeThenId<T extends { timeSec: number; id: string }>(a: T, b: T): number {
  if (a.timeSec !== b.timeSec) {
    return a.timeSec - b.timeSec;
  }

  return a.id.localeCompare(b.id);
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function makeId(...parts: Array<string | number>): string {
  return parts
    .map((part) =>
      String(part)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    )
    .filter(Boolean)
    .join("-");
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function roundCoordinate(value: number): number {
  return roundValue(value, 6);
}

function roundValue(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
