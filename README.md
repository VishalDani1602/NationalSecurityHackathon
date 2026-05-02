# CustodyOS

CustodyOS is a software-only multi-sensor target custody and reacquisition demo for National Security Hackathon Problem Statement 1. It shows how an operator can maintain custody of a moving target when individual sensors are intermittent, degraded, spoofed, or denied.

## Problem Fit

Problem Statement 1 asks for resilient target custody across contested sensing conditions. CustodyOS addresses that by treating every sensor report as probabilistic evidence, not ground truth. The demo fuses synthetic radar, EO/IR, RF, and open-source-style detections into one custody timeline, then explains when custody is strong, degrading, lost, or reacquired.

The core operational value is speed: when confidence drops, CustodyOS predicts where the target should be next, ranks available sensors by expected reacquisition value, and presents the next best action before the operator fully loses the track.

## Demo Story

1. A target enters the area of interest and is detected by multiple simulated sensors.
2. CustodyOS correlates those detections into one fused track with confidence, uncertainty, and sensor provenance.
3. A scripted disruption removes or degrades one sensor feed, causing the custody score to fall.
4. The system projects a search area, recommends the best reacquisition sensor, and marks the decision in the event log.
5. A later detection lands inside the predicted area, the target is reacquired, and the timeline shows the full custody chain.

## Technical Architecture

- **Sensor adapters:** Normalize detections from simulated radar, EO/IR, RF, and open-source feeds into timestamped observations with confidence, location, and provenance.
- **Fusion and custody engine:** Associates observations to tracks, updates the fused target state, maintains uncertainty, and computes custody status.
- **Reacquisition planner:** Projects target motion under uncertainty, generates likely search areas, and ranks sensors or sectors by expected reacquisition value.
- **Operator UI:** Displays the fused track, sensor health, custody confidence, recommended action, and audit timeline.
- **Scenario runner:** Replays a deterministic disruption scenario so judges can see custody loss and reacquisition in under three minutes.

## Judging Criteria Mapping

| Criterion | CustodyOS Evidence |
| --- | --- |
| Mission relevance | Directly demonstrates resilient custody and reacquisition under sensor degradation. |
| Technical execution | Uses probabilistic fusion, confidence scoring, uncertainty projection, and explainable sensor recommendations. |
| Demo clarity | Scripted scenario shows target acquisition, disruption, custody degradation, recommended reacquisition, and successful reacquisition. |
| Feasibility | Runs as a software-only simulation, requiring no hardware, classified data, or external sensor access. |
| Transition potential | Adapter-based architecture can connect to real sensor feeds, C2 systems, or after-action analysis tools. |

## Run Commands

From the repository root:

```bash
npm install
npm run dev
```

Open the local URL printed by the dev server. The expected default is:

```text
http://localhost:5173
```

Useful validation and production-preview commands:

```bash
npm run build
npm run preview
```

The current package scripts are `dev`, `build`, and `preview`. The demo scenario is expected to run in the browser UI; if a later implementation adds a dedicated scenario script, keep it as a thin wrapper around the same deterministic flow.

## 3-Minute Pitch

CustodyOS solves a simple operational problem: in contested environments, one sensor is never enough. A camera can lose line of sight, radar can be degraded, RF can be noisy, and the target keeps moving. Operators need a system that preserves custody across those gaps and tells them where to look next.

Our demo starts with a target detected by multiple simulated sensors. CustodyOS fuses those reports into one track, shows confidence and uncertainty, and records which sensors contributed. Then we trigger a disruption. One feed drops out, the confidence score falls, and the system projects the target's likely search area instead of pretending it still has perfect knowledge.

The important part is reacquisition. CustodyOS ranks the available sensors and recommends the highest-value cue. When a later detection appears inside the predicted area, the system marks the target as reacquired and shows the full custody chain from first detection through loss risk to recovery.

This is software-only, repeatable, and extensible. The same architecture can accept real sensor adapters later, but the hackathon demo proves the core behavior now: preserve target custody, explain confidence, and accelerate reacquisition when the environment gets messy.
