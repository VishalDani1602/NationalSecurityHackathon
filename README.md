# CustodyOS

CustodyOS is a browser-based multi-sensor custody and reacquisition simulator. It models a moving maritime target, degraded sensor coverage, spoofed cooperative reports, and explainable fusion logic for maintaining custody when no single sensor is fully reliable.

The app runs entirely locally. It does not require live sensor feeds, cloud services, maps, or external APIs.

## Features

- Deterministic maritime scenario with one primary vessel, decoys, spoofed AIS-style reports, missed detections, and false positives.
- Simulated radar, EO, RF, and AIS-style sensor feeds.
- Fusion engine with prediction, detection association, uncertainty growth, confidence scoring, and reacquisition states.
- Operator dashboard with a map-style situation view, target uncertainty, sensor coverage beams, replay controls, and sensor health.
- Explainable custody panel showing accepted/rejected detection rationale and next-best-sensor tasking.

## How It Works

CustodyOS treats each sensor report as probabilistic evidence. The fusion loop predicts the target state, scores incoming detections against an association gate, updates the fused track when evidence is credible, and expands uncertainty when detections are missing or rejected.

When custody degrades, the app ranks available sensors by expected reacquisition value and presents a tasking recommendation. The replay timeline shows how confidence changes as the target is lost, spoofed reports appear, and later detections restore custody.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide icons
- SVG-based local situation map

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the local URL printed by Vite. The default is usually:

```text
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```text
src/
  App.tsx                     Main application wiring
  App.css                     Dashboard styling
  components/                 UI panels and replay controls
  data/custodyScenario.ts     Default generated scenario export
  lib/fusion.ts               Fusion, association, scoring, and track logic
  lib/scenario.ts             Deterministic scenario generator
  lib/types.ts                Shared scenario and fusion types
docs/
  demo-script.md              Demo run-of-show and talking points
```

## Core Concepts

**Custody:** The system's current confidence that the fused track still represents the target.

**Association gate:** The spatial and confidence threshold used to decide whether a detection belongs to the existing track.

**Uncertainty:** The expanding region where the target is likely to be when sensor evidence is weak or missing.

**Reacquisition:** The process of using new evidence inside the predicted region to restore confidence in the track.

**Next-best sensor:** The sensor with the strongest expected value for reducing uncertainty or confirming the target.

## Current Status

CustodyOS is a working local prototype. The scenario, fusion logic, UI, and replay controls are implemented and can be run from the repository root with the commands above.
