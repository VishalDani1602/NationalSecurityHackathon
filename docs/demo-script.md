# CustodyOS Demo Script

## Goal

Show judges a repeatable three-minute story: CustodyOS acquires a target, fuses multiple simulated sensor feeds, detects custody degradation, recommends a reacquisition action, and confirms reacquisition with an auditable timeline.

## Setup

From the repository root:

```bash
npm install
npm run dev
```

Open the local dev URL, expected to be:

```text
http://localhost:5173
```

For a production build check:

```bash
npm run build
npm run preview
```

Keep the browser on the main operator view with the fused track, sensor status, custody score, recommendation panel, and event timeline visible. The deterministic scenario should be driven from the UI unless a later implementation adds a dedicated scenario script.

## Three-Minute Run Of Show

**0:00-0:25 - Open with the mission problem**

"CustodyOS is a software-only target custody and reacquisition demo. The mission problem is that operators cannot depend on a single sensor in contested conditions. CustodyOS fuses multiple imperfect feeds, tracks confidence, and tells the operator where to look next when custody starts to degrade."

Point to the active sensor list and fused target track.

**0:25-1:00 - Show initial custody**

"The target is entering the area of interest. Radar, EO/IR, RF, and open-source-style detections arrive with different confidence levels and timestamps. CustodyOS normalizes those reports and associates them into one fused custody track."

Point out:

- Fused target position.
- Current custody confidence.
- Sensor provenance or contributing detections.
- Event timeline entry for acquisition.

**1:00-1:40 - Trigger disruption**

"Now we simulate the environment getting worse. One feed drops or becomes unreliable. CustodyOS does not hide that uncertainty. The custody score falls and the projected search area expands."

Point out:

- Degraded sensor health.
- Lower custody confidence.
- Larger uncertainty region.
- Timeline entry for custody degradation.

**1:40-2:20 - Explain reacquisition recommendation**

"This is the key behavior. The system predicts where the target should be next and ranks the available sensors by reacquisition value. Instead of manually searching everywhere, the operator gets a concrete next best action."

Point out:

- Recommended sensor or sector.
- Predicted search area.
- Reason for recommendation, such as coverage, confidence, or proximity.

**2:20-2:50 - Confirm reacquisition**

"A later detection appears inside the predicted area. CustodyOS associates it back to the track, raises confidence, and marks the target reacquired."

Point out:

- Reacquired status.
- Confidence recovery.
- Timeline entries from acquisition to disruption to reacquisition.

**2:50-3:00 - Close**

"CustodyOS proves the core workflow for Problem Statement 1: resilient custody across degraded sensors, explainable confidence, and fast reacquisition. It is software-only for the hackathon, but the adapter architecture is ready for real feeds."

## Technical Architecture Talking Points

- Sensor adapters normalize heterogeneous detections into a common observation model.
- Fusion logic correlates detections into a single custody track.
- Custody scoring combines sensor confidence, recency, agreement, and uncertainty.
- Reacquisition planning projects likely target motion and ranks sensors or sectors.
- The UI keeps the operator focused on track state, confidence, next action, and auditability.

## Judging Criteria Mapping

- **Mission relevance:** Directly targets multi-sensor custody and reacquisition under degradation.
- **Technical merit:** Demonstrates fusion, uncertainty, confidence scoring, and action recommendation.
- **Demo quality:** Uses a deterministic scenario that judges can understand in one pass.
- **Feasibility:** Requires only software simulation and browser-based interaction.
- **Extensibility:** Adapter boundary supports future real sensor feeds or C2 integration.

## Backup Pitch

"CustodyOS is the custody layer between noisy sensors and operator decisions. It fuses detections into a single track, measures how much confidence we actually have, and when the track is at risk it predicts where to search and recommends the best sensor for reacquisition. The demo is software-only, but it shows the behavior that matters: acquire, degrade, recommend, reacquire, and explain the chain of custody."
