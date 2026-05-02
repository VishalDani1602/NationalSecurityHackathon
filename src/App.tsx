import { useEffect, useMemo, useState } from "react";
import { Layers, LockKeyhole, ScanLine } from "lucide-react";
import "./App.css";
import { CustodyConfidence } from "./components/CustodyConfidence";
import { MapSituationPanel } from "./components/MapSituationPanel";
import { NextBestSensor } from "./components/NextBestSensor";
import { SensorStatusPanel } from "./components/SensorStatusPanel";
import { TimelineReplay } from "./components/TimelineReplay";
import type { CustodyFrame, Sensor } from "./components/types";

const sensors: Sensor[] = [
  {
    id: "S1",
    name: "Sentinel SAR-3",
    kind: "SAR",
    status: "tracking",
    x: 23,
    y: 22,
    coverage: 132,
    bearing: 38,
    health: 96,
    latency: "1.8s",
    mode: "stripmap",
    custodyContribution: 28,
  },
  {
    id: "S2",
    name: "Raven UAS-11",
    kind: "UAS",
    status: "searching",
    x: 78,
    y: 34,
    coverage: 112,
    bearing: 238,
    health: 88,
    latency: "3.2s",
    mode: "EO slew",
    custodyContribution: 18,
  },
  {
    id: "S3",
    name: "Mesa SIGINT",
    kind: "SIGINT",
    status: "tracking",
    x: 66,
    y: 72,
    coverage: 144,
    bearing: 304,
    health: 91,
    latency: "0.9s",
    mode: "bearing fix",
    custodyContribution: 21,
  },
  {
    id: "S4",
    name: "Coast AIS Fusion",
    kind: "AIS",
    status: "degraded",
    x: 14,
    y: 80,
    coverage: 104,
    bearing: 18,
    health: 64,
    latency: "14s",
    mode: "spoof check",
    custodyContribution: 9,
  },
  {
    id: "S5",
    name: "Overwatch EO",
    kind: "EO",
    status: "offline",
    x: 87,
    y: 78,
    coverage: 92,
    bearing: 280,
    health: 0,
    latency: "--",
    mode: "maintenance",
    custodyContribution: 0,
  },
];

const frames: CustodyFrame[] = [
  {
    id: "t0",
    time: "14:02:10Z",
    label: "Initial custody",
    target: { x: 31, y: 68 },
    confidence: 84,
    state: "Firm",
    velocity: "18 kt NE",
    ambiguity: "Low",
    supportingSensors: ["S1", "S3", "S4"],
    explanation: [
      "SAR return matches prior target size and course.",
      "SIGINT bearing intersects predicted corridor.",
      "AIS anomaly remains inside the uncertainty gate.",
    ],
    contestedFactors: ["Civilian traffic density rising west of track."],
    recommendation: {
      sensorId: "S2",
      action: "Pre-position EO gimbal ahead of predicted turn point.",
      eta: "00:42",
      expectedGain: 7,
      reason: "Clears shoreline clutter before the track crosses traffic.",
      command: "TASK S2 / SLEW 044 / HOLD WIDE-FOV / AUTO-ID ON",
    },
  },
  {
    id: "t1",
    time: "14:04:30Z",
    label: "Crossing clutter",
    target: { x: 43, y: 57 },
    confidence: 72,
    state: "At Risk",
    velocity: "21 kt ENE",
    ambiguity: "Medium",
    supportingSensors: ["S1", "S3"],
    explanation: [
      "Two candidate tracks converge near the harbor approach.",
      "SAR continuity holds but class confidence drops.",
      "SIGINT bearing supports the northern candidate.",
    ],
    contestedFactors: ["AIS feed degraded.", "Low cloud ceiling limits passive EO."],
    recommendation: {
      sensorId: "S2",
      action: "Narrow search box and collect three-second EO burst.",
      eta: "00:18",
      expectedGain: 12,
      reason: "Fastest line of sight into the ambiguity gate.",
      command: "TASK S2 / BOX 41-48E 54-60N / BURST 3S / REPORT TOP-2",
    },
  },
  {
    id: "t2",
    time: "14:06:45Z",
    label: "Custody dip",
    target: { x: 56, y: 48 },
    confidence: 58,
    state: "Reacquiring",
    velocity: "Unknown",
    ambiguity: "High",
    supportingSensors: ["S3"],
    explanation: [
      "Primary SAR revisit missed the expected centroid.",
      "SIGINT still brackets the eastern escape route.",
      "Model predicts a short turn behind high-clutter shoreline.",
    ],
    contestedFactors: ["Three decoys entered the gate.", "SAR revisit gap is now 92 seconds."],
    recommendation: {
      sensorId: "S1",
      action: "Retask SAR to spotlight mode over eastern escape gate.",
      eta: "01:05",
      expectedGain: 18,
      reason: "Highest discrimination against decoys in poor visibility.",
      command: "TASK S1 / SPOTLIGHT GATE-E / PRIORITY IMMEDIATE / REVISIT 30S",
    },
  },
  {
    id: "t3",
    time: "14:08:20Z",
    label: "Reacquired",
    target: { x: 68, y: 39 },
    confidence: 81,
    state: "Firm",
    velocity: "24 kt ENE",
    ambiguity: "Low",
    supportingSensors: ["S1", "S2", "S3"],
    explanation: [
      "Spotlight SAR separated target from the decoy group.",
      "EO burst confirms matching heading and wake geometry.",
      "SIGINT bearing remains consistent with the fused track.",
    ],
    contestedFactors: ["EO custody will expire in 56 seconds without another cue."],
    recommendation: {
      sensorId: "S2",
      action: "Trail target at standoff and hand off to next SAR revisit.",
      eta: "00:25",
      expectedGain: 9,
      reason: "Maintains visual custody until the next radar-quality update.",
      command: "TASK S2 / TRACK VX-2047 / STANDOFF 9KM / HANDOFF S1",
    },
  },
  {
    id: "t4",
    time: "14:10:05Z",
    label: "Handoff queued",
    target: { x: 79, y: 31 },
    confidence: 76,
    state: "At Risk",
    velocity: "26 kt E",
    ambiguity: "Medium",
    supportingSensors: ["S1", "S2"],
    explanation: [
      "Target is leaving UAS optimum geometry.",
      "SAR predicts another short revisit gap near the boundary.",
      "SIGINT line is blocked by terrain masking.",
    ],
    contestedFactors: ["Sensor S5 remains offline.", "Boundary handoff requires earlier cueing."],
    recommendation: {
      sensorId: "S3",
      action: "Open wide-area RF scan to recover bearing after terrain mask.",
      eta: "01:20",
      expectedGain: 11,
      reason: "Provides non-visual custody through the boundary handoff.",
      command: "TASK S3 / WIDE RF SCAN / BEARING-ONLY / PUSH TO FUSION",
    },
  },
];

function App() {
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
  const trackHistory = useMemo(
    () => frames.slice(0, activeIndex + 1).map((frame) => frame.target),
    [activeIndex],
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
          <span><Layers size={15} aria-hidden="true" /> Problem Statement 1</span>
          <span><ScanLine size={15} aria-hidden="true" /> Track VX-2047</span>
          <span>Littoral reacquisition drill</span>
        </div>
      </header>

      <main className="operations-layout">
        <MapSituationPanel
          frame={activeFrame}
          sensors={sensors}
          trackHistory={trackHistory}
        />

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
