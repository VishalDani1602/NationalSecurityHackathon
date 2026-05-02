import type {
  Association as UiAssociation,
  Detection as UiDetection,
  FusionFrame as UiFusionFrame,
  Point as UiPoint,
  Scenario as UiScenario,
  Sensor as UiSensor,
  SensorRecommendation as UiSensorRecommendation,
  TrackMode as UiTrackMode,
  TrackState as UiTrackState,
} from "./types";

export type FusionDimension = 2 | 3;

export type TrackStatus = "tracking" | "coasting" | "lost";

export type DetectionOutcome = "accepted" | "spawned" | "rejected";

export interface Vector3 {
  x: number;
  y: number;
  z?: number;
}

export interface KinematicState {
  position: Required<Vector3>;
  velocity: Required<Vector3>;
}

export interface AxisCovariance {
  x: number;
  y: number;
  z: number;
}

export interface TrackCovariance {
  position: AxisCovariance;
  velocity: AxisCovariance;
}

export interface SensorCalibration {
  id: string;
  type?: string;
  reliability?: number;
  latencyMs?: number;
  measurementStdDevM?: number;
  velocityStdDevMps?: number;
}

export interface FusionDetection {
  id?: string;
  sensorId: string;
  timestampMs: number;
  position: Vector3;
  velocity?: Vector3;
  confidence?: number;
  positionStdDevM?: number;
  velocityStdDevMps?: number;
  classification?: string;
  targetHint?: string;
  attributes?: Record<string, unknown>;
}

export interface FusionConfig {
  dimensions: FusionDimension;
  maxTracks: number;
  maxTrackAgeMs: number;
  reacquisitionWindowMs: number;
  maxDetectionsPerStep: number;
  maxDetectionAgeMs: number;
  maxFutureSkewMs: number;
  historyLimit: number;
  rationaleLimit: number;
  maxSensorIdsPerTrack: number;
  processNoiseMps2: number;
  defaultPositionStdDevM: number;
  defaultVelocityStdDevMps: number;
  covarianceFloor: number;
  maxVelocityMps: number;
  baseGateSigma: number;
  reacquisitionGateMultiplier: number;
  minAssociationScore: number;
  minDetectionConfidence: number;
  newTrackMinConfidence: number;
  custodyRadiusM: number;
  sensorReliabilityFloor: number;
  classificationBoost: number;
  classificationPenalty: number;
  coastingConfidenceDecay: number;
  missedDetectionDecay: number;
}

export interface RationaleTest {
  name: string;
  passed: boolean;
  value: number | string | boolean;
  threshold?: number | string;
}

export interface DetectionRationale {
  detectionId: string;
  trackId?: string;
  sensorId: string;
  outcome: DetectionOutcome;
  reason: string;
  score: number;
  timestampMs: number;
  distanceM?: number;
  normalizedDistance?: number;
  gateSigma?: number;
  confidence?: number;
  sensorReliability?: number;
  tests: RationaleTest[];
}

export interface TrackHistoryPoint {
  timestampMs: number;
  position: Required<Vector3>;
  velocity: Required<Vector3>;
  confidence: number;
  source: "prediction" | "update" | "spawn";
  detectionId?: string;
}

export interface FusionTrack {
  id: string;
  createdAtMs: number;
  updatedAtMs: number;
  predictedAtMs: number;
  state: KinematicState;
  covariance: TrackCovariance;
  confidence: number;
  evidenceScore: number;
  uncertaintyRadiusM: number;
  status: TrackStatus;
  hitCount: number;
  missCount: number;
  coastCount: number;
  classification?: string;
  targetHint?: string;
  sensorIds: string[];
  history: TrackHistoryPoint[];
  rationales: DetectionRationale[];
}

export interface DetectionScore {
  accepted: boolean;
  score: number;
  distanceM: number;
  normalizedDistance: number;
  gateSigma: number;
  rationale: DetectionRationale;
}

export interface TrackAssociation {
  trackId: string;
  detectionId: string;
  score: number;
  distanceM: number;
  normalizedDistance: number;
  rationale: DetectionRationale;
}

export interface AssociationResult {
  matches: TrackAssociation[];
  unmatchedTrackIds: string[];
  unmatchedDetectionIds: string[];
  rejected: DetectionRationale[];
}

export interface FusionStepResult {
  nowMs: number;
  tracks: FusionTrack[];
  associations: TrackAssociation[];
  accepted: DetectionRationale[];
  rejected: DetectionRationale[];
  droppedTrackIds: string[];
}

interface PreparedDetection extends FusionDetection {
  id: string;
  confidence: number;
  position: Required<Vector3>;
  positionStdDevM: number;
  velocityStdDevMps: number;
}

interface ResolvedSensor {
  id: string;
  reliability: number;
  latencyMs: number;
  measurementStdDevM: number;
  velocityStdDevMps: number;
}

const DEFAULT_CONFIG: FusionConfig = {
  dimensions: 2,
  maxTracks: 24,
  maxTrackAgeMs: 30_000,
  reacquisitionWindowMs: 10_000,
  maxDetectionsPerStep: 128,
  maxDetectionAgeMs: 15_000,
  maxFutureSkewMs: 1_000,
  historyLimit: 48,
  rationaleLimit: 24,
  maxSensorIdsPerTrack: 16,
  processNoiseMps2: 4,
  defaultPositionStdDevM: 18,
  defaultVelocityStdDevMps: 8,
  covarianceFloor: 0.01,
  maxVelocityMps: 130,
  baseGateSigma: 3.25,
  reacquisitionGateMultiplier: 1.8,
  minAssociationScore: 0.42,
  minDetectionConfidence: 0.18,
  newTrackMinConfidence: 0.36,
  custodyRadiusM: 120,
  sensorReliabilityFloor: 0.2,
  classificationBoost: 0.08,
  classificationPenalty: 0.22,
  coastingConfidenceDecay: 0.9,
  missedDetectionDecay: 0.82,
};

const AXES = ["x", "y", "z"] as const;
const EPSILON = 1e-9;

export function createFusionEngine(
  config: Partial<FusionConfig> = {},
  sensors: SensorCalibration[] = [],
): FusionEngine {
  return new FusionEngine(config, sensors);
}

export class FusionEngine {
  private readonly config: FusionConfig;
  private readonly sensors = new Map<string, SensorCalibration>();
  private readonly tracks = new Map<string, FusionTrack>();
  private nextTrackNumber = 1;
  private nextFrameNumber = 1;

  constructor(config: Partial<FusionConfig> = {}, sensors: SensorCalibration[] = []) {
    this.config = normalizeConfig(config);
    for (const sensor of sensors) {
      this.registerSensor(sensor);
    }
  }

  registerSensor(sensor: SensorCalibration): void {
    if (!sensor.id) {
      throw new Error("Sensor calibration requires a stable id.");
    }

    this.sensors.set(sensor.id, { ...sensor });
  }

  reset(): void {
    this.tracks.clear();
    this.nextTrackNumber = 1;
    this.nextFrameNumber = 1;
  }

  getTracks(nowMs?: number): FusionTrack[] {
    const timestamp = nowMs ?? Date.now();
    return sortTracks(
      Array.from(this.tracks.values()).map((track) =>
        predictTrack(track, timestamp, this.config),
      ),
    ).map(cloneTrack);
  }

  ingest(detections: FusionDetection[], nowMs?: number): FusionStepResult {
    return this.step(detections, nowMs);
  }

  step(detections: FusionDetection[], nowMs?: number): FusionStepResult {
    const frameNumber = this.nextFrameNumber++;
    const now = resolveStepTime(detections, nowMs);
    const preparation = prepareDetections(
      detections,
      this.sensors,
      this.config,
      now,
      frameNumber,
    );

    const association = associateDetections(
      Array.from(this.tracks.values()),
      preparation.accepted,
      this.sensors,
      this.config,
      now,
    );

    const accepted: DetectionRationale[] = [];
    const rejected: DetectionRationale[] = [...preparation.rejected, ...association.rejected];
    const droppedTrackIds: string[] = [];
    const nextTracks = new Map<string, FusionTrack>();
    const matchedTrackIds = new Set<string>();
    const matchedDetectionIds = new Set<string>();
    const detectionById = new Map(preparation.accepted.map((detection) => [detection.id, detection]));

    for (const match of association.matches) {
      const sourceTrack = this.tracks.get(match.trackId);
      const detection = detectionById.get(match.detectionId);

      if (!sourceTrack || !detection) {
        continue;
      }

      const fused = fuseDetectionIntoTrack(
        sourceTrack,
        detection,
        match.rationale,
        this.sensors.get(detection.sensorId),
        this.config,
        now,
      );

      nextTracks.set(fused.id, fused);
      matchedTrackIds.add(fused.id);
      matchedDetectionIds.add(detection.id);
      accepted.push(match.rationale);
    }

    for (const track of this.tracks.values()) {
      if (matchedTrackIds.has(track.id)) {
        continue;
      }

      const coasted = coastTrack(track, now, this.config);
      if (now - coasted.updatedAtMs > this.config.maxTrackAgeMs) {
        droppedTrackIds.push(coasted.id);
        continue;
      }

      nextTracks.set(coasted.id, coasted);
    }

    const rejectedByDetectionId = new Map(rejected.map((rationale) => [rationale.detectionId, rationale]));

    for (const detection of preparation.accepted) {
      if (matchedDetectionIds.has(detection.id)) {
        continue;
      }

      const spawnRationale = makeSpawnRationale(detection, this.sensors.get(detection.sensorId), this.config);
      const canSpawn = detection.confidence >= this.config.newTrackMinConfidence;

      const hasSpawnCapacity =
        canSpawn && this.hasSpawnCapacity(nextTracks, detection, droppedTrackIds);

      if (hasSpawnCapacity) {
        const track = this.createTrack(detection, spawnRationale);
        nextTracks.set(track.id, track);
        accepted.push(spawnRationale);
        rejectedByDetectionId.delete(detection.id);
        continue;
      }

      const rationale =
        canSpawn
          ? makeUnmatchedRationale(detection, this.sensors.get(detection.sensorId), this.config, true)
          : (rejectedByDetectionId.get(detection.id) ??
            makeUnmatchedRationale(detection, this.sensors.get(detection.sensorId), this.config, false));

      rejectedByDetectionId.set(detection.id, rationale);
    }

    const boundedTracks = enforceTrackLimit(Array.from(nextTracks.values()), this.config, droppedTrackIds);

    this.tracks.clear();
    for (const track of boundedTracks) {
      this.tracks.set(track.id, track);
    }

    return {
      nowMs: now,
      tracks: sortTracks(boundedTracks).map(cloneTrack),
      associations: association.matches,
      accepted,
      rejected: Array.from(rejectedByDetectionId.values()),
      droppedTrackIds,
    };
  }

  private createTrack(detection: PreparedDetection, rationale: DetectionRationale): FusionTrack {
    const id = `track-${String(this.nextTrackNumber++).padStart(4, "0")}`;
    const sensor = resolveSensor(this.sensors.get(detection.sensorId), this.config);
    const positionVariance = square(Math.max(detection.positionStdDevM, sensor.measurementStdDevM));
    const velocityStdDev = detection.velocity ? detection.velocityStdDevMps : this.config.defaultVelocityStdDevMps;
    const velocityVariance = square(Math.max(velocityStdDev, this.config.defaultVelocityStdDevMps * 0.5));
    const initialConfidence = clamp01(detection.confidence * sensor.reliability);

    const state: KinematicState = {
      position: toRequiredVector(detection.position),
      velocity: clampVelocity(toRequiredVector(detection.velocity ?? { x: 0, y: 0, z: 0 }), this.config),
    };

    const track: FusionTrack = {
      id,
      createdAtMs: detection.timestampMs,
      updatedAtMs: detection.timestampMs,
      predictedAtMs: detection.timestampMs,
      state,
      covariance: {
        position: axisCovariance(positionVariance),
        velocity: axisCovariance(velocityVariance),
      },
      confidence: initialConfidence,
      evidenceScore: initialConfidence,
      uncertaintyRadiusM: Math.sqrt(positionVariance),
      status: "tracking",
      hitCount: 1,
      missCount: 0,
      coastCount: 0,
      classification: detection.classification,
      targetHint: detection.targetHint,
      sensorIds: [detection.sensorId],
      history: [
        {
          timestampMs: detection.timestampMs,
          position: state.position,
          velocity: state.velocity,
          confidence: initialConfidence,
          source: "spawn",
          detectionId: detection.id,
        },
      ],
      rationales: [rationale],
    };

    const predicted = predictTrack(track, Math.max(detection.timestampMs, rationale.timestampMs), this.config);
    return {
      ...predicted,
      confidence: scoreTrackConfidence(predicted, rationale.timestampMs, this.config),
    };
  }

  private hasSpawnCapacity(
    tracks: Map<string, FusionTrack>,
    detection: PreparedDetection,
    droppedTrackIds: string[],
  ): boolean {
    if (tracks.size < this.config.maxTracks) {
      return true;
    }

    const weakest = sortTracks(Array.from(tracks.values())).at(-1);
    if (!weakest) {
      return true;
    }

    const replacementScore = detection.confidence * resolveSensor(this.sensors.get(detection.sensorId), this.config).reliability;
    const staleEnough = weakest.status !== "tracking" || weakest.missCount > 1;

    if (staleEnough && replacementScore > weakest.confidence + 0.08) {
      tracks.delete(weakest.id);
      droppedTrackIds.push(weakest.id);
      return true;
    }

    return false;
  }
}

export function predictTrack(
  track: FusionTrack,
  timestampMs: number,
  config: Partial<FusionConfig> = {},
): FusionTrack {
  const cfg = normalizeConfig(config);
  const targetTime = Number.isFinite(timestampMs) ? timestampMs : track.predictedAtMs;
  const dtSeconds = Math.max(0, (targetTime - track.predictedAtMs) / 1000);
  const q = square(cfg.processNoiseMps2);

  if (dtSeconds <= EPSILON) {
    const unchanged = cloneTrack(track);
    unchanged.confidence = scoreTrackConfidence(unchanged, targetTime, cfg);
    unchanged.uncertaintyRadiusM = uncertaintyRadius(unchanged.covariance, cfg.dimensions);
    return unchanged;
  }

  const next = cloneTrack(track);

  for (const axis of activeAxes(cfg.dimensions)) {
    next.state.position[axis] += next.state.velocity[axis] * dtSeconds;
    next.covariance.position[axis] = Math.max(
      next.covariance.position[axis] +
        next.covariance.velocity[axis] * square(dtSeconds) +
        0.25 * q * Math.pow(dtSeconds, 4),
      cfg.covarianceFloor,
    );
    next.covariance.velocity[axis] = Math.max(
      next.covariance.velocity[axis] + q * square(dtSeconds),
      cfg.covarianceFloor,
    );
  }

  next.predictedAtMs = targetTime;
  next.uncertaintyRadiusM = uncertaintyRadius(next.covariance, cfg.dimensions);
  next.confidence = scoreTrackConfidence(next, targetTime, cfg);
  next.status = statusForTrack(next, targetTime, cfg);

  next.history = appendBounded(
    next.history,
    {
      timestampMs: targetTime,
      position: { ...next.state.position },
      velocity: { ...next.state.velocity },
      confidence: next.confidence,
      source: "prediction",
    },
    cfg.historyLimit,
  );

  return next;
}

export function scoreDetection(
  track: FusionTrack,
  detection: FusionDetection,
  sensor: SensorCalibration | undefined = undefined,
  config: Partial<FusionConfig> = {},
  nowMs = detection.timestampMs,
): DetectionScore {
  const cfg = normalizeConfig(config);
  const prepared = prepareOneDetection(detection, sensor, cfg, nowMs, "score-detection");

  if (prepared.accepted === false) {
    const fallback = prepared.rationale;
    return {
      accepted: false,
      score: 0,
      distanceM: Number.POSITIVE_INFINITY,
      normalizedDistance: Number.POSITIVE_INFINITY,
      gateSigma: cfg.baseGateSigma,
      rationale: { ...fallback, trackId: track.id },
    };
  }

  return scorePreparedDetection(track, prepared.detection, sensor, cfg, nowMs);
}

export function associateDetections(
  tracks: FusionTrack[],
  detections: FusionDetection[],
  sensors: Map<string, SensorCalibration> | SensorCalibration[] = new Map(),
  config: Partial<FusionConfig> = {},
  nowMs = resolveStepTime(detections),
): AssociationResult {
  const cfg = normalizeConfig(config);
  const sensorMap = Array.isArray(sensors) ? new Map(sensors.map((sensor) => [sensor.id, sensor])) : sensors;
  const prepared: PreparedDetection[] = [];
  const rejected: DetectionRationale[] = [];

  for (let index = 0; index < detections.length; index += 1) {
    const detection = detections[index];
    const result = prepareOneDetection(
      detection,
      sensorMap.get(detection.sensorId),
      cfg,
      nowMs,
      detection.id ?? `association-det-${index}`,
    );

    if (result.accepted === true) {
      prepared.push(result.detection);
    } else {
      rejected.push(result.rationale);
    }
  }

  const candidates: TrackAssociation[] = [];
  const bestRejectedByDetection = new Map<string, DetectionRationale>();

  for (const track of tracks) {
    for (const detection of prepared) {
      const score = scorePreparedDetection(track, detection, sensorMap.get(detection.sensorId), cfg, nowMs);

      if (score.accepted) {
        candidates.push({
          trackId: track.id,
          detectionId: detection.id,
          score: score.score,
          distanceM: score.distanceM,
          normalizedDistance: score.normalizedDistance,
          rationale: score.rationale,
        });
      } else {
        const current = bestRejectedByDetection.get(detection.id);
        if (!current || score.score > current.score) {
          bestRejectedByDetection.set(detection.id, score.rationale);
        }
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.normalizedDistance - b.normalizedDistance;
  });

  const matchedTracks = new Set<string>();
  const matchedDetections = new Set<string>();
  const matches: TrackAssociation[] = [];

  for (const candidate of candidates) {
    if (matchedTracks.has(candidate.trackId) || matchedDetections.has(candidate.detectionId)) {
      continue;
    }

    matches.push(candidate);
    matchedTracks.add(candidate.trackId);
    matchedDetections.add(candidate.detectionId);
  }

  for (const detection of prepared) {
    if (matchedDetections.has(detection.id)) {
      continue;
    }

    const rationale =
      bestRejectedByDetection.get(detection.id) ??
      makeUnmatchedRationale(detection, sensorMap.get(detection.sensorId), cfg, false);

    rejected.push(rationale);
  }

  return {
    matches,
    unmatchedTrackIds: tracks
      .map((track) => track.id)
      .filter((trackId) => !matchedTracks.has(trackId)),
    unmatchedDetectionIds: prepared
      .map((detection) => detection.id)
      .filter((detectionId) => !matchedDetections.has(detectionId)),
    rejected,
  };
}

export function fuseDetectionIntoTrack(
  track: FusionTrack,
  detection: FusionDetection,
  rationale: DetectionRationale,
  sensor: SensorCalibration | undefined = undefined,
  config: Partial<FusionConfig> = {},
  nowMs = detection.timestampMs,
): FusionTrack {
  const cfg = normalizeConfig(config);
  const prepared = prepareOneDetection(detection, sensor, cfg, nowMs, detection.id ?? "update-detection");

  if (prepared.accepted === false) {
    return cloneTrack(track);
  }

  const resolvedSensor = resolveSensor(sensor, cfg);
  const predicted = predictTrack(track, prepared.detection.timestampMs, cfg);
  const updated = cloneTrack(predicted);
  const measurementVariance = square(
    Math.max(prepared.detection.positionStdDevM, resolvedSensor.measurementStdDevM),
  );
  const velocityVariance = square(
    Math.max(prepared.detection.velocityStdDevMps, resolvedSensor.velocityStdDevMps),
  );
  const secondsSinceUpdate = Math.max(
    0.25,
    (prepared.detection.timestampMs - track.updatedAtMs) / 1000,
  );

  for (const axis of activeAxes(cfg.dimensions)) {
    const residual = prepared.detection.position[axis] - predicted.state.position[axis];
    const positionVariance = Math.max(predicted.covariance.position[axis], cfg.covarianceFloor);
    const gain = positionVariance / (positionVariance + measurementVariance);

    updated.state.position[axis] = predicted.state.position[axis] + gain * residual;
    updated.covariance.position[axis] = Math.max((1 - gain) * positionVariance, cfg.covarianceFloor);

    if (prepared.detection.velocity) {
      const measuredVelocity = toRequiredVector(prepared.detection.velocity)[axis];
      const velocityStateVariance = Math.max(predicted.covariance.velocity[axis], cfg.covarianceFloor);
      const velocityGain = velocityStateVariance / (velocityStateVariance + velocityVariance);
      updated.state.velocity[axis] = predicted.state.velocity[axis] + velocityGain * (measuredVelocity - predicted.state.velocity[axis]);
      updated.covariance.velocity[axis] = Math.max(
        (1 - velocityGain) * velocityStateVariance,
        cfg.covarianceFloor,
      );
    } else {
      const beta = clamp(gain * 0.35, 0.02, 0.45);
      updated.state.velocity[axis] = predicted.state.velocity[axis] + beta * (residual / secondsSinceUpdate);
      updated.covariance.velocity[axis] = Math.max(
        predicted.covariance.velocity[axis] * (1 - beta * 0.25),
        cfg.covarianceFloor,
      );
    }
  }

  updated.state.velocity = clampVelocity(updated.state.velocity, cfg);
  updated.updatedAtMs = prepared.detection.timestampMs;
  updated.predictedAtMs = prepared.detection.timestampMs;
  updated.hitCount += 1;
  updated.missCount = 0;
  updated.coastCount = 0;
  updated.status = "tracking";
  updated.classification = mergeClassification(updated.classification, prepared.detection.classification);
  updated.targetHint = updated.targetHint ?? prepared.detection.targetHint;
  updated.sensorIds = appendUniqueBounded(
    updated.sensorIds,
    prepared.detection.sensorId,
    cfg.maxSensorIdsPerTrack,
  );
  updated.uncertaintyRadiusM = uncertaintyRadius(updated.covariance, cfg.dimensions);

  const evidence = clamp01(prepared.detection.confidence * resolvedSensor.reliability);
  updated.evidenceScore = clamp01(0.68 * updated.evidenceScore + 0.32 * Math.max(evidence, rationale.score));
  updated.confidence = scoreTrackConfidence(updated, prepared.detection.timestampMs, cfg);
  updated.history = appendBounded(
    updated.history,
    {
      timestampMs: prepared.detection.timestampMs,
      position: { ...updated.state.position },
      velocity: { ...updated.state.velocity },
      confidence: updated.confidence,
      source: "update",
      detectionId: prepared.detection.id,
    },
    cfg.historyLimit,
  );
  updated.rationales = appendBounded(
    updated.rationales,
    { ...rationale, outcome: "accepted", trackId: updated.id },
    cfg.rationaleLimit,
  );

  if (nowMs > updated.predictedAtMs) {
    return predictTrack(updated, nowMs, cfg);
  }

  return updated;
}

export function scoreTrackConfidence(
  track: FusionTrack,
  nowMs: number,
  config: Partial<FusionConfig> = {},
): number {
  const cfg = normalizeConfig(config);
  const ageMs = Math.max(0, nowMs - track.updatedAtMs);
  const uncertainty = uncertaintyRadius(track.covariance, cfg.dimensions);
  const uncertaintyScore = 1 / (1 + uncertainty / Math.max(cfg.custodyRadiusM, EPSILON));
  const continuityScore = track.hitCount / Math.max(track.hitCount + track.missCount + 1, 1);
  const ageScore = Math.exp(-ageMs / Math.max(cfg.maxTrackAgeMs, 1));
  const reacquisitionPenalty = ageMs > cfg.reacquisitionWindowMs ? 0.72 : 1;
  const statusPenalty = track.status === "lost" ? 0.72 : track.status === "coasting" ? 0.88 : 1;
  const confidence =
    (0.62 * track.evidenceScore + 0.28 * uncertaintyScore + 0.1 * continuityScore) *
    ageScore *
    reacquisitionPenalty *
    statusPenalty;

  return clamp01(confidence);
}

function scorePreparedDetection(
  track: FusionTrack,
  detection: PreparedDetection,
  sensor: SensorCalibration | undefined,
  config: FusionConfig,
  nowMs: number,
): DetectionScore {
  const resolvedSensor = resolveSensor(sensor, config);
  const predicted = predictTrack(track, detection.timestampMs, config);
  const residual = subtractVectors(detection.position, predicted.state.position);
  const distanceM = vectorMagnitude(residual, config.dimensions);
  const measurementVariance = square(Math.max(detection.positionStdDevM, resolvedSensor.measurementStdDevM));
  const normalizedDistance = normalizedInnovationDistance(
    residual,
    predicted.covariance.position,
    measurementVariance,
    config.dimensions,
  );
  const gateSigma = dynamicGateSigma(track, detection.timestampMs, config);
  const withinGate = normalizedDistance <= gateSigma;
  const freshEnough = detectionFreshness(detection, resolvedSensor, nowMs, config).fresh;
  const detectionStrongEnough = detection.confidence >= config.minDetectionConfidence;
  const classificationScore = classificationAgreement(track, detection, config);
  const proximityScore = proximityFromGate(normalizedDistance, gateSigma, config.dimensions);
  const recencyScore = detectionRecencyScore(detection, resolvedSensor, nowMs, config);
  const score = clamp01(
    0.46 * proximityScore +
      0.2 * detection.confidence +
      0.14 * resolvedSensor.reliability +
      0.12 * classificationScore +
      0.08 * recencyScore,
  );
  const accepted = freshEnough && detectionStrongEnough && withinGate && score >= config.minAssociationScore;
  const tests: RationaleTest[] = [
    {
      name: "freshness",
      passed: freshEnough,
      value: Math.round(Math.max(0, nowMs - detection.timestampMs - resolvedSensor.latencyMs)),
      threshold: config.maxDetectionAgeMs,
    },
    {
      name: "detection-confidence",
      passed: detectionStrongEnough,
      value: round3(detection.confidence),
      threshold: config.minDetectionConfidence,
    },
    {
      name: "association-gate",
      passed: withinGate,
      value: round3(normalizedDistance),
      threshold: round3(gateSigma),
    },
    {
      name: "association-score",
      passed: score >= config.minAssociationScore,
      value: round3(score),
      threshold: config.minAssociationScore,
    },
    {
      name: "classification",
      passed: classificationScore >= 0.5,
      value: round3(classificationScore),
      threshold: 0.5,
    },
  ];

  return {
    accepted,
    score,
    distanceM,
    normalizedDistance,
    gateSigma,
    rationale: {
      detectionId: detection.id,
      trackId: track.id,
      sensorId: detection.sensorId,
      outcome: accepted ? "accepted" : "rejected",
      reason: associationReason(accepted, freshEnough, detectionStrongEnough, withinGate, score, config),
      score,
      timestampMs: nowMs,
      distanceM,
      normalizedDistance,
      gateSigma,
      confidence: detection.confidence,
      sensorReliability: resolvedSensor.reliability,
      tests,
    },
  };
}

function coastTrack(track: FusionTrack, nowMs: number, config: FusionConfig): FusionTrack {
  const coasted = predictTrack(track, nowMs, config);
  coasted.missCount += 1;
  coasted.coastCount += 1;
  coasted.status = statusForTrack(coasted, nowMs, config);
  const decay = coasted.status === "lost" ? config.missedDetectionDecay : config.coastingConfidenceDecay;
  coasted.evidenceScore = clamp01(coasted.evidenceScore * decay);
  coasted.confidence = scoreTrackConfidence(coasted, nowMs, config);
  return coasted;
}

function prepareDetections(
  detections: FusionDetection[],
  sensors: Map<string, SensorCalibration>,
  config: FusionConfig,
  nowMs: number,
  frameNumber: number,
): { accepted: PreparedDetection[]; rejected: DetectionRationale[] } {
  const accepted: PreparedDetection[] = [];
  const rejected: DetectionRationale[] = [];

  for (let index = 0; index < detections.length; index += 1) {
    const detection = detections[index];
    const result = prepareOneDetection(
      detection,
      sensors.get(detection.sensorId),
      config,
      nowMs,
      detection.id ?? `frame-${frameNumber}-det-${index}`,
    );

    if (result.accepted === true) {
      accepted.push(result.detection);
    } else {
      rejected.push(result.rationale);
    }
  }

  if (accepted.length <= config.maxDetectionsPerStep) {
    return { accepted: accepted.sort(compareDetectionsByTime), rejected };
  }

  const ranked = [...accepted].sort((a, b) => {
    const sensorA = resolveSensor(sensors.get(a.sensorId), config);
    const sensorB = resolveSensor(sensors.get(b.sensorId), config);
    return b.confidence * sensorB.reliability - a.confidence * sensorA.reliability;
  });
  const keptIds = new Set(ranked.slice(0, config.maxDetectionsPerStep).map((detection) => detection.id));
  const kept = accepted.filter((detection) => keptIds.has(detection.id)).sort(compareDetectionsByTime);

  for (const detection of accepted) {
    if (keptIds.has(detection.id)) {
      continue;
    }

    rejected.push({
      detectionId: detection.id,
      sensorId: detection.sensorId,
      outcome: "rejected",
      reason: "rejected: per-step detection bound exceeded",
      score: 0,
      timestampMs: nowMs,
      confidence: detection.confidence,
      sensorReliability: resolveSensor(sensors.get(detection.sensorId), config).reliability,
      tests: [
        {
          name: "detection-bound",
          passed: false,
          value: accepted.length,
          threshold: config.maxDetectionsPerStep,
        },
      ],
    });
  }

  return { accepted: kept, rejected };
}

function prepareOneDetection(
  detection: FusionDetection,
  sensor: SensorCalibration | undefined,
  config: FusionConfig,
  nowMs: number,
  fallbackId: string,
):
  | { accepted: true; detection: PreparedDetection }
  | { accepted: false; rationale: DetectionRationale } {
  const id = detection.id ?? fallbackId;
  const resolvedSensor = resolveSensor(sensor, config, detection.sensorId);
  const confidence = clamp01(detection.confidence ?? 1);
  const freshness = detectionFreshness({ ...detection, id, confidence } as PreparedDetection, resolvedSensor, nowMs, config);
  const tests: RationaleTest[] = [
    {
      name: "timestamp",
      passed: Number.isFinite(detection.timestampMs),
      value: Number.isFinite(detection.timestampMs) ? detection.timestampMs : "invalid",
    },
    {
      name: "position",
      passed: isFiniteVector(detection.position, config.dimensions),
      value: isFiniteVector(detection.position, config.dimensions),
    },
    {
      name: "freshness",
      passed: freshness.fresh,
      value: freshness.ageMs,
      threshold: config.maxDetectionAgeMs,
    },
    {
      name: "future-skew",
      passed: freshness.notTooFuture,
      value: freshness.futureSkewMs,
      threshold: config.maxFutureSkewMs,
    },
    {
      name: "detection-confidence",
      passed: confidence >= config.minDetectionConfidence,
      value: round3(confidence),
      threshold: config.minDetectionConfidence,
    },
  ];

  const valid =
    Number.isFinite(detection.timestampMs) &&
    isFiniteVector(detection.position, config.dimensions) &&
    freshness.fresh &&
    freshness.notTooFuture &&
    confidence >= config.minDetectionConfidence;

  if (!valid) {
    return {
      accepted: false,
      rationale: {
        detectionId: id,
        sensorId: detection.sensorId,
        outcome: "rejected",
        reason: preparationRejectReason(tests),
        score: 0,
        timestampMs: nowMs,
        confidence,
        sensorReliability: resolvedSensor.reliability,
        tests,
      },
    };
  }

  return {
    accepted: true,
    detection: {
      ...detection,
      id,
      confidence,
      position: toRequiredVector(detection.position),
      positionStdDevM: Math.max(
        detection.positionStdDevM ?? resolvedSensor.measurementStdDevM,
        Math.sqrt(config.covarianceFloor),
      ),
      velocityStdDevMps: Math.max(
        detection.velocityStdDevMps ?? resolvedSensor.velocityStdDevMps,
        Math.sqrt(config.covarianceFloor),
      ),
    },
  };
}

function makeSpawnRationale(
  detection: PreparedDetection,
  sensor: SensorCalibration | undefined,
  config: FusionConfig,
): DetectionRationale {
  const resolvedSensor = resolveSensor(sensor, config, detection.sensorId);
  const score = clamp01(detection.confidence * resolvedSensor.reliability);

  return {
    detectionId: detection.id,
    sensorId: detection.sensorId,
    outcome: "spawned",
    reason: "spawned: no existing track accepted detection",
    score,
    timestampMs: detection.timestampMs,
    confidence: detection.confidence,
    sensorReliability: resolvedSensor.reliability,
    tests: [
      {
        name: "new-track-confidence",
        passed: detection.confidence >= config.newTrackMinConfidence,
        value: round3(detection.confidence),
        threshold: config.newTrackMinConfidence,
      },
      {
        name: "sensor-reliability",
        passed: resolvedSensor.reliability >= config.sensorReliabilityFloor,
        value: round3(resolvedSensor.reliability),
        threshold: config.sensorReliabilityFloor,
      },
    ],
  };
}

function makeUnmatchedRationale(
  detection: PreparedDetection,
  sensor: SensorCalibration | undefined,
  config: FusionConfig,
  capacityBlocked: boolean,
): DetectionRationale {
  const resolvedSensor = resolveSensor(sensor, config, detection.sensorId);
  const spawnEligible = detection.confidence >= config.newTrackMinConfidence;

  return {
    detectionId: detection.id,
    sensorId: detection.sensorId,
    outcome: "rejected",
    reason: capacityBlocked
      ? "rejected: track capacity reached"
      : "rejected: no existing track accepted detection and new-track confidence was too low",
    score: 0,
    timestampMs: detection.timestampMs,
    confidence: detection.confidence,
    sensorReliability: resolvedSensor.reliability,
    tests: [
      {
        name: "new-track-confidence",
        passed: spawnEligible,
        value: round3(detection.confidence),
        threshold: config.newTrackMinConfidence,
      },
      {
        name: "capacity",
        passed: !capacityBlocked,
        value: capacityBlocked,
      },
    ],
  };
}

function enforceTrackLimit(
  tracks: FusionTrack[],
  config: FusionConfig,
  droppedTrackIds: string[],
): FusionTrack[] {
  if (tracks.length <= config.maxTracks) {
    return tracks;
  }

  const sorted = sortTracks(tracks);
  const kept = sorted.slice(0, config.maxTracks);
  for (const dropped of sorted.slice(config.maxTracks)) {
    droppedTrackIds.push(dropped.id);
  }

  return kept;
}

function normalizeConfig(config: Partial<FusionConfig>): FusionConfig {
  const merged: FusionConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    ...merged,
    dimensions: merged.dimensions === 3 ? 3 : 2,
    maxTracks: positiveInteger(merged.maxTracks, DEFAULT_CONFIG.maxTracks),
    maxTrackAgeMs: positiveInteger(merged.maxTrackAgeMs, DEFAULT_CONFIG.maxTrackAgeMs),
    reacquisitionWindowMs: positiveInteger(merged.reacquisitionWindowMs, DEFAULT_CONFIG.reacquisitionWindowMs),
    maxDetectionsPerStep: positiveInteger(merged.maxDetectionsPerStep, DEFAULT_CONFIG.maxDetectionsPerStep),
    maxDetectionAgeMs: positiveInteger(merged.maxDetectionAgeMs, DEFAULT_CONFIG.maxDetectionAgeMs),
    maxFutureSkewMs: positiveInteger(merged.maxFutureSkewMs, DEFAULT_CONFIG.maxFutureSkewMs),
    historyLimit: positiveInteger(merged.historyLimit, DEFAULT_CONFIG.historyLimit),
    rationaleLimit: positiveInteger(merged.rationaleLimit, DEFAULT_CONFIG.rationaleLimit),
    maxSensorIdsPerTrack: positiveInteger(merged.maxSensorIdsPerTrack, DEFAULT_CONFIG.maxSensorIdsPerTrack),
    processNoiseMps2: positiveNumber(merged.processNoiseMps2, DEFAULT_CONFIG.processNoiseMps2),
    defaultPositionStdDevM: positiveNumber(merged.defaultPositionStdDevM, DEFAULT_CONFIG.defaultPositionStdDevM),
    defaultVelocityStdDevMps: positiveNumber(merged.defaultVelocityStdDevMps, DEFAULT_CONFIG.defaultVelocityStdDevMps),
    covarianceFloor: positiveNumber(merged.covarianceFloor, DEFAULT_CONFIG.covarianceFloor),
    maxVelocityMps: positiveNumber(merged.maxVelocityMps, DEFAULT_CONFIG.maxVelocityMps),
    baseGateSigma: positiveNumber(merged.baseGateSigma, DEFAULT_CONFIG.baseGateSigma),
    reacquisitionGateMultiplier: positiveNumber(
      merged.reacquisitionGateMultiplier,
      DEFAULT_CONFIG.reacquisitionGateMultiplier,
    ),
    minAssociationScore: clamp01(merged.minAssociationScore),
    minDetectionConfidence: clamp01(merged.minDetectionConfidence),
    newTrackMinConfidence: clamp01(merged.newTrackMinConfidence),
    custodyRadiusM: positiveNumber(merged.custodyRadiusM, DEFAULT_CONFIG.custodyRadiusM),
    sensorReliabilityFloor: clamp(merged.sensorReliabilityFloor, 0, 1),
    classificationBoost: clamp(merged.classificationBoost, 0, 1),
    classificationPenalty: clamp(merged.classificationPenalty, 0, 1),
    coastingConfidenceDecay: clamp(merged.coastingConfidenceDecay, 0, 1),
    missedDetectionDecay: clamp(merged.missedDetectionDecay, 0, 1),
  };
}

function resolveStepTime(detections: FusionDetection[], nowMs?: number): number {
  if (Number.isFinite(nowMs)) {
    return nowMs as number;
  }

  const newestDetection = detections.reduce(
    (newest, detection) => Math.max(newest, Number.isFinite(detection.timestampMs) ? detection.timestampMs : 0),
    0,
  );

  return newestDetection > 0 ? newestDetection : Date.now();
}

function resolveSensor(
  sensor: SensorCalibration | undefined,
  config: FusionConfig,
  fallbackId = "unknown",
): ResolvedSensor {
  return {
    id: sensor?.id ?? fallbackId,
    reliability: clamp(sensor?.reliability ?? 1, config.sensorReliabilityFloor, 1),
    latencyMs: Math.max(0, sensor?.latencyMs ?? 0),
    measurementStdDevM: positiveNumber(sensor?.measurementStdDevM, config.defaultPositionStdDevM),
    velocityStdDevMps: positiveNumber(sensor?.velocityStdDevMps, config.defaultVelocityStdDevMps),
  };
}

function detectionFreshness(
  detection: Pick<FusionDetection, "timestampMs">,
  sensor: ResolvedSensor,
  nowMs: number,
  config: FusionConfig,
): { fresh: boolean; notTooFuture: boolean; ageMs: number; futureSkewMs: number } {
  const adjustedAgeMs = nowMs - detection.timestampMs - sensor.latencyMs;
  const futureSkewMs = Math.max(0, detection.timestampMs - nowMs);

  return {
    fresh: adjustedAgeMs <= config.maxDetectionAgeMs,
    notTooFuture: futureSkewMs <= config.maxFutureSkewMs,
    ageMs: Math.max(0, Math.round(adjustedAgeMs)),
    futureSkewMs: Math.round(futureSkewMs),
  };
}

function detectionRecencyScore(
  detection: PreparedDetection,
  sensor: ResolvedSensor,
  nowMs: number,
  config: FusionConfig,
): number {
  const ageMs = Math.max(0, nowMs - detection.timestampMs - sensor.latencyMs);
  return clamp01(Math.exp(-ageMs / Math.max(config.maxDetectionAgeMs, 1)));
}

function dynamicGateSigma(track: FusionTrack, timestampMs: number, config: FusionConfig): number {
  const ageMs = Math.max(0, timestampMs - track.updatedAtMs);
  const reacquisitionBlend = clamp01(ageMs / Math.max(config.reacquisitionWindowMs, 1));
  return config.baseGateSigma * (1 + (config.reacquisitionGateMultiplier - 1) * reacquisitionBlend);
}

function proximityFromGate(normalizedDistance: number, gateSigma: number, dimensions: FusionDimension): number {
  if (!Number.isFinite(normalizedDistance)) {
    return 0;
  }

  const gateScore = clamp01(1 - normalizedDistance / Math.max(gateSigma, EPSILON));
  const gaussianScore = Math.exp(-0.5 * square(normalizedDistance) / dimensions);
  return clamp01(0.62 * gateScore + 0.38 * gaussianScore);
}

function classificationAgreement(
  track: FusionTrack,
  detection: PreparedDetection,
  config: FusionConfig,
): number {
  const trackLabel = track.classification?.trim().toLowerCase();
  const detectionLabel = detection.classification?.trim().toLowerCase();

  if (detection.targetHint && (detection.targetHint === track.targetHint || detection.targetHint === track.id)) {
    return clamp01(0.92 + config.classificationBoost);
  }

  if (!trackLabel || !detectionLabel) {
    return 0.65;
  }

  if (trackLabel === detectionLabel) {
    return clamp01(0.9 + config.classificationBoost);
  }

  return clamp01(0.58 - config.classificationPenalty);
}

function normalizedInnovationDistance(
  residual: Required<Vector3>,
  positionCovariance: AxisCovariance,
  measurementVariance: number,
  dimensions: FusionDimension,
): number {
  let sum = 0;

  for (const axis of activeAxes(dimensions)) {
    const variance = Math.max(positionCovariance[axis] + measurementVariance, EPSILON);
    sum += square(residual[axis]) / variance;
  }

  return Math.sqrt(sum);
}

function uncertaintyRadius(covariance: TrackCovariance, dimensions: FusionDimension): number {
  const axes = activeAxes(dimensions);
  const averageVariance =
    axes.reduce((sum, axis) => sum + Math.max(covariance.position[axis], 0), 0) / axes.length;

  return Math.sqrt(Math.max(averageVariance, 0));
}

function associationReason(
  accepted: boolean,
  freshEnough: boolean,
  detectionStrongEnough: boolean,
  withinGate: boolean,
  score: number,
  config: FusionConfig,
): string {
  if (accepted) {
    return "accepted: detection passed freshness, gate, and score checks";
  }

  if (!freshEnough) {
    return "rejected: detection was stale for this fusion step";
  }

  if (!detectionStrongEnough) {
    return "rejected: detection confidence below threshold";
  }

  if (!withinGate) {
    return "rejected: detection outside dynamic association gate";
  }

  if (score < config.minAssociationScore) {
    return "rejected: association score below threshold";
  }

  return "rejected: detection failed association checks";
}

function preparationRejectReason(tests: RationaleTest[]): string {
  const failed = tests.find((test) => !test.passed);

  if (!failed) {
    return "rejected: detection failed preparation checks";
  }

  switch (failed.name) {
    case "timestamp":
      return "rejected: detection timestamp was invalid";
    case "position":
      return "rejected: detection position was invalid";
    case "freshness":
      return "rejected: detection was stale for this fusion step";
    case "future-skew":
      return "rejected: detection timestamp was too far in the future";
    case "detection-confidence":
      return "rejected: detection confidence below threshold";
    default:
      return "rejected: detection failed preparation checks";
  }
}

function statusForTrack(track: FusionTrack, nowMs: number, config: FusionConfig): TrackStatus {
  const ageMs = Math.max(0, nowMs - track.updatedAtMs);

  if (ageMs > config.reacquisitionWindowMs) {
    return "lost";
  }

  if (track.missCount > 0 || ageMs > 0) {
    return "coasting";
  }

  return "tracking";
}

function mergeClassification(current: string | undefined, incoming: string | undefined): string | undefined {
  if (!current) {
    return incoming;
  }

  return current;
}

function subtractVectors(a: Required<Vector3>, b: Required<Vector3>): Required<Vector3> {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function vectorMagnitude(vector: Required<Vector3>, dimensions: FusionDimension): number {
  const axes = activeAxes(dimensions);
  return Math.sqrt(axes.reduce((sum, axis) => sum + square(vector[axis]), 0));
}

function clampVelocity(velocity: Required<Vector3>, config: FusionConfig): Required<Vector3> {
  const magnitude = vectorMagnitude(velocity, config.dimensions);

  if (magnitude <= config.maxVelocityMps || magnitude <= EPSILON) {
    return velocity;
  }

  const scale = config.maxVelocityMps / magnitude;
  return {
    x: velocity.x * scale,
    y: velocity.y * scale,
    z: velocity.z * scale,
  };
}

function toRequiredVector(vector: Vector3): Required<Vector3> {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z ?? 0,
  };
}

function isFiniteVector(vector: Vector3 | undefined, dimensions: FusionDimension): boolean {
  if (!vector) {
    return false;
  }

  return activeAxes(dimensions).every((axis) => Number.isFinite(toRequiredVector(vector)[axis]));
}

function axisCovariance(value: number): AxisCovariance {
  return { x: value, y: value, z: value };
}

function activeAxes(dimensions: FusionDimension): Array<(typeof AXES)[number]> {
  return dimensions === 3 ? ["x", "y", "z"] : ["x", "y"];
}

function appendBounded<T>(items: T[], item: T, limit: number): T[] {
  if (limit <= 0) {
    return [];
  }

  const next = [...items, item];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

function appendUniqueBounded(items: string[], item: string, limit: number): string[] {
  const next = items.filter((existing) => existing !== item);
  next.push(item);
  return next.length > limit ? next.slice(next.length - limit) : next;
}

function sortTracks(tracks: FusionTrack[]): FusionTrack[] {
  return [...tracks].sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    if (b.updatedAtMs !== a.updatedAtMs) {
      return b.updatedAtMs - a.updatedAtMs;
    }

    return a.id.localeCompare(b.id);
  });
}

function compareDetectionsByTime(a: PreparedDetection, b: PreparedDetection): number {
  if (a.timestampMs !== b.timestampMs) {
    return a.timestampMs - b.timestampMs;
  }

  return a.id.localeCompare(b.id);
}

function cloneTrack(track: FusionTrack): FusionTrack {
  return {
    ...track,
    state: {
      position: { ...track.state.position },
      velocity: { ...track.state.velocity },
    },
    covariance: {
      position: { ...track.covariance.position },
      velocity: { ...track.covariance.velocity },
    },
    sensorIds: [...track.sensorIds],
    history: track.history.map((point) => ({
      ...point,
      position: { ...point.position },
      velocity: { ...point.velocity },
    })),
    rationales: track.rationales.map((rationale) => ({
      ...rationale,
      tests: rationale.tests.map((test) => ({ ...test })),
    })),
  };
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback;
}

function square(value: number): number {
  return value * value;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function uiDistance(a: UiPoint, b: UiPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function uiSensorById(sensors: UiSensor[], id: string): UiSensor {
  const sensor = sensors.find((candidate) => candidate.id === id);
  if (!sensor) {
    throw new Error(`Unknown sensor: ${id}`);
  }
  return sensor;
}

function uiPredict(track: UiTrackState): UiPoint {
  return {
    x: track.position.x + track.velocity.vx,
    y: track.position.y + track.velocity.vy,
  };
}

function uiScoreDetection(
  detection: UiDetection,
  prediction: UiPoint,
  track: UiTrackState,
  sensor: UiSensor,
): UiAssociation {
  const residual = uiDistance(detection.position, prediction);
  const gate = track.uncertainty + detection.uncertainty + 26;
  const normalizedResidual = residual / gate;
  const spoofPenalty = detection.spoofed ? 28 : 0;
  const score = clamp(
    100 -
      normalizedResidual * 82 +
      detection.confidence * 20 +
      sensor.reliability * 38 -
      spoofPenalty -
      track.uncertainty * 0.18,
    0,
    100,
  );
  const accepted = residual <= gate && score >= 44;

  let reason = `${sensor.name}: ${Math.round(residual)}px residual inside ${Math.round(gate)}px gate`;
  if (detection.spoofed && !accepted) {
    reason = `${sensor.name}: rejected cloned/spoofed report; motion residual breaks custody gate`;
  } else if (!accepted) {
    reason = `${sensor.name}: rejected; residual or confidence failed association gate`;
  } else if (track.mode === "lost") {
    reason = `${sensor.name}: accepted as reacquisition evidence inside expanded belief region`;
  }

  return { detection, accepted, score, residual, reason };
}

function uiUpdateTrack(track: UiTrackState, prediction: UiPoint, accepted: UiAssociation[]): UiTrackState {
  if (accepted.length === 0) {
    const uncertainty = clamp(track.uncertainty + 11, 18, 185);
    const confidence = clamp(track.confidence - 0.078, 0.08, 0.98);
    const mode: UiTrackMode = confidence < 0.34 ? "lost" : "degraded";
    return {
      time: track.time + 1,
      position: prediction,
      velocity: track.velocity,
      uncertainty,
      confidence,
      mode,
    };
  }

  const weighted = accepted.reduce(
    (accumulator, association) => {
      const weight = association.detection.confidence / Math.max(association.detection.uncertainty, 1);
      return {
        x: accumulator.x + association.detection.position.x * weight,
        y: accumulator.y + association.detection.position.y * weight,
        weight: accumulator.weight + weight,
      };
    },
    { x: 0, y: 0, weight: 0 },
  );

  const measurement = {
    x: weighted.x / weighted.weight,
    y: weighted.y / weighted.weight,
  };
  const position = {
    x: prediction.x * 0.42 + measurement.x * 0.58,
    y: prediction.y * 0.42 + measurement.y * 0.58,
  };
  const wasLost = track.mode === "lost" || track.confidence < 0.38;

  return {
    time: track.time + 1,
    position,
    velocity: {
      vx: position.x - track.position.x,
      vy: position.y - track.position.y,
    },
    uncertainty: clamp(track.uncertainty - (accepted.length > 1 ? 18 : 10), 12, 130),
    confidence: clamp(track.confidence + (accepted.length > 1 ? 0.15 : 0.09), 0.12, 0.98),
    mode: wasLost ? "reacquired" : "nominal",
  };
}

function uiRecommendSensor(
  track: UiTrackState,
  sensors: UiSensor[],
  detections: UiDetection[],
): UiSensorRecommendation {
  const candidates = sensors.map((sensor) => {
    const rangeToBelief = uiDistance(sensor.position, track.position);
    const inReach = rangeToBelief < sensor.range + track.uncertainty;
    const hasCurrentDetection = detections.some((detection) => detection.sensorId === sensor.id);
    const geometry = inReach ? 1 - rangeToBelief / (sensor.range + track.uncertainty) : 0;
    const freshness = hasCurrentDetection ? 0.08 : 0.18;
    const probability = clamp(
      sensor.reliability * 0.55 + geometry * 0.34 + freshness - sensor.latencySec * 0.002,
      0.05,
      0.95,
    );
    const score = Math.round(probability * 100);
    const reason = inReach
      ? `${sensor.name} covers the belief region and can collapse uncertainty fastest`
      : `${sensor.name} cannot cover the center yet, but can cue the next handoff`;
    return { sensorId: sensor.id, score, probability, reason };
  });

  return candidates.sort((a, b) => b.score - a.score)[0];
}

export function runFusion(scenario: UiScenario): UiFusionFrame[] {
  const firstDetection =
    scenario.detections.find((detection) => detection.targetHint === "vessel-kestrel" && !detection.spoofed) ??
    scenario.detections[0];

  if (!firstDetection) {
    throw new Error("Scenario requires at least one detection");
  }

  let track: UiTrackState = {
    time: 0,
    position: firstDetection.position,
    velocity: { vx: 18, vy: -10 },
    uncertainty: 30,
    confidence: 0.68,
    mode: "nominal",
  };
  const frames: UiFusionFrame[] = [];

  for (let time = 0; time <= scenario.duration; time += 1) {
    const detections = scenario.detections.filter((detection) => detection.time === time);
    const prediction = uiPredict(track);
    const associations = detections.map((detection) =>
      uiScoreDetection(detection, prediction, track, uiSensorById(scenario.sensors, detection.sensorId)),
    );
    const accepted = associations.filter((association) => association.accepted);
    const nextTrack = time === 0 ? track : uiUpdateTrack(track, prediction, accepted);
    const recommendation = uiRecommendSensor(nextTrack, scenario.sensors, detections);
    const activeEvents = scenario.events.filter((event) => event.time <= time && event.time >= time - 4);

    frames.push({
      time,
      track: nextTrack,
      prediction,
      detections,
      associations,
      recommendation,
      activeEvents,
    });

    track = nextTrack.mode === "reacquired" ? { ...nextTrack, mode: "nominal" } : nextTrack;
  }

  return frames;
}
