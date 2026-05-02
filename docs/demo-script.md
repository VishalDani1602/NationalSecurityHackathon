# CustodyOS Demo Run Of Show

## Goal

Run a crisp three-minute proof that CustodyOS can hold custody through degraded sensing:

1. Accept good detections into a fused track.
2. Reject bad or spoofed detections instead of corrupting the track.
3. Make uncertainty growth visible when custody degrades.
4. Recommend the next-best sensor for reacquisition.
5. Reacquire with RF and leave an auditable timeline.

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

Keep the browser on the main operator view. Before the judges arrive, make sure these panes are visible without scrolling:

- Fused track map with uncertainty region.
- Detection stream with accepted and rejected status.
- Sensor health/status, including RF.
- Custody confidence score.
- Next-best-sensor recommendation panel.
- Event timeline or audit log.

The deterministic scenario should be driven from the UI unless a later implementation adds a dedicated scenario script.

## Three-Minute Run Of Show

### 0:00-0:20 - Mission Frame

"CustodyOS is a software-only target custody and reacquisition demo. The mission problem is that operators cannot depend on a single sensor in contested conditions. CustodyOS fuses multiple imperfect feeds, tracks confidence, and tells the operator where to look next when custody starts to degrade."

Visible proof:

- Active sensor list is populated.
- Fused track exists or is ready to acquire.
- Detection stream and timeline are visible.

### 0:20-0:55 - Accept Valid Detections

"The target is entering the area of interest. Radar, EO/IR, RF, and open-source-style detections arrive with different confidence levels and timestamps. CustodyOS normalizes those reports and accepts the detections that agree into one fused custody track."

Action:

- Start or reset the scenario.
- Let the first matching detections arrive.

Visible proof:

- Detection stream marks matching reports as accepted.
- Fused track moves to the accepted cluster.
- Custody confidence rises.
- Timeline records initial acquisition with sensor provenance.

### 0:55-1:25 - Reject Bad Detections And Spoof

"Now a bad report appears. It could be stale, outside the motion gate, or a spoof. CustodyOS should not blindly average it into the track. It rejects the detection, explains why, and keeps the fused track stable."

Action:

- Trigger or wait for the outlier/spoof detection.
- Hover or select the rejected detection if the UI exposes the reason.

Visible proof:

- Detection stream marks the report as rejected.
- Rejection reason is visible, such as "outside gate", "low confidence", "stale", or "spoof suspected".
- Fused track does not jump to the spoof.
- Timeline records spoof/outlier rejection.

### 1:25-1:55 - Show Uncertainty Growth

"Now the environment gets worse. A primary feed drops or becomes unreliable. CustodyOS does not hide the uncertainty. Confidence falls, the search area expands, and the operator can see custody degrading before the track is lost."

Action:

- Trigger sensor degradation or wait for the scripted drop.

Visible proof:

- Sensor health changes to degraded/offline.
- Custody confidence falls.
- Uncertainty region grows around the predicted track.
- Timeline records custody degradation.

### 1:55-2:25 - Next-Best-Sensor Recommendation

"This is the decision support moment. CustodyOS predicts where the target should be next and ranks the available sensors by reacquisition value. The operator gets a concrete next-best-sensor recommendation instead of manually searching everywhere."

Visible proof:

- Recommendation panel names the next-best sensor.
- Recommended sector overlaps the predicted search area.
- Recommendation includes a reason, such as coverage, confidence, recency, or proximity.
- Timeline records the recommendation.

### 2:25-2:50 - RF Reacquisition

"RF comes back with a detection inside the predicted area. CustodyOS associates it to the existing track, raises confidence, and marks the target reacquired. The point is not just that a dot appeared. The point is that the system predicted where to look, chose RF, and confirmed custody when RF matched."

Action:

- Trigger the RF reacquisition step or let the scenario continue.

Visible proof:

- RF detection is accepted.
- Fused track updates inside the predicted uncertainty area.
- Custody confidence recovers.
- Track status changes to reacquired or stable custody.
- Timeline shows: acquisition, accepted detections, spoof rejection, degradation, next-best-sensor recommendation, RF reacquisition.

### 2:50-3:00 - Close

"CustodyOS proves the core workflow for Problem Statement 1: resilient custody across degraded sensors, explainable confidence, and fast reacquisition. It is software-only for the hackathon, but the adapter architecture is ready for real feeds."

## Operator Checklist

Do not end the demo until these technical proof points are visible on screen:

- At least one accepted detection contributing to the fused track.
- At least one rejected detection with a visible rejection reason.
- Spoof or outlier rejection that does not move the fused track.
- Uncertainty region growing after sensor degradation.
- Next-best-sensor recommendation with a reason.
- RF detection accepted during reacquisition.
- Timeline entries that preserve the custody chain.

## Technical Architecture Talking Points

- Sensor adapters normalize heterogeneous detections into a common observation model.
- Fusion logic gates detections, accepts consistent reports, rejects outliers, and maintains one custody track.
- Spoof rejection prevents a single suspicious report from pulling the fused track away from the plausible path.
- Custody scoring combines sensor confidence, recency, agreement, and uncertainty growth.
- Reacquisition planning projects likely target motion and ranks sensors or sectors by expected value.
- The UI keeps the operator focused on track state, confidence, next-best-sensor, and auditability.

## Judging Criteria Mapping

- **Mission relevance:** Directly targets multi-sensor custody and reacquisition under degradation.
- **Technical merit:** Demonstrates detection gating, spoof rejection, fusion, uncertainty growth, confidence scoring, and next-best-sensor recommendation.
- **Demo quality:** Uses a deterministic scenario that judges can understand in one pass.
- **Feasibility:** Requires only software simulation and browser-based interaction.
- **Extensibility:** Adapter boundary supports future real sensor feeds or C2 integration.

## Backup Pitch

"CustodyOS is the custody layer between noisy sensors and operator decisions. It accepts detections that agree, rejects detections that look wrong or spoofed, measures uncertainty as custody degrades, and recommends the next-best sensor for reacquisition. The demo is software-only, but it shows the behavior that matters: acquire, reject spoof, degrade, recommend RF, reacquire, and explain the chain of custody."
