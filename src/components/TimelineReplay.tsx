import {
  Flag,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { CustodyFrame, JudgeDemoMoment } from "./types";

const DEMO_LABEL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  color: "var(--faint)",
  fontSize: "0.68rem",
  fontWeight: 820,
  textTransform: "uppercase",
} satisfies CSSProperties;

const DEMO_GROUP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  marginRight: "auto",
  minWidth: 0,
} satisfies CSSProperties;

const SPEED_GROUP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
} satisfies CSSProperties;

const SPEED_ROW_STYLE = {
  flexWrap: "wrap",
} satisfies CSSProperties;

type TimelineReplayProps = {
  frames: CustodyFrame[];
  activeIndex: number;
  isPlaying: boolean;
  speed: number;
  onSelectFrame: (index: number) => void;
  onPlayToggle: () => void;
  onReset: () => void;
  onStep: (delta: number) => void;
  onSpeedChange: (speed: number) => void;
};

function findMomentIndex(
  frames: CustodyFrame[],
  predicate: (frame: CustodyFrame, index: number) => boolean,
): number | undefined {
  const index = frames.findIndex(predicate);
  return index >= 0 ? index : undefined;
}

function frameSearchText(frame: CustodyFrame): string {
  return [
    frame.label,
    frame.ambiguity,
    frame.state,
    ...frame.explanation,
    ...frame.contestedFactors,
  ].join(" ");
}

function buildJudgeDemoMoments(frames: CustodyFrame[]): JudgeDemoMoment[] {
  const moments: JudgeDemoMoment[] = [];
  const usedIndexes = new Set<number>();

  const addMoment = (moment: JudgeDemoMoment | undefined) => {
    if (!moment || usedIndexes.has(moment.frameIndex)) return;
    moments.push(moment);
    usedIndexes.add(moment.frameIndex);
  };

  addMoment({
    id: "demo-handoff",
    frameIndex: 0,
    label: "Handoff",
    cue: "Baseline custody picture",
    kind: "handoff",
  });

  const identityIndex = findMomentIndex(frames, (frame) =>
    /spoof|clone|decoy|ghost|identity/i.test(frameSearchText(frame)),
  );
  addMoment(
    identityIndex === undefined
      ? undefined
      : {
          id: "demo-identity",
          frameIndex: identityIndex,
          label: "Spoof",
          cue: "Identity conflict enters the custody logic",
          kind: "identity",
        },
  );

  const gapIndex = findMomentIndex(
    frames,
    (frame) => frame.state === "Reacquiring" || frame.ambiguity === "High" || frame.confidence < 60,
  );
  addMoment(
    gapIndex === undefined
      ? undefined
      : {
          id: "demo-gap",
          frameIndex: gapIndex,
          label: "Gap",
          cue: "Custody risk peaks",
          kind: "gap",
        },
  );

  const recoveryIndex = findMomentIndex(
    frames,
    (frame, index) =>
      index > (gapIndex ?? identityIndex ?? 0) &&
      (frame.state === "Firm" || /reacquisition|rf cue|rf burst/i.test(frameSearchText(frame))),
  );
  addMoment(
    recoveryIndex === undefined
      ? undefined
      : {
          id: "demo-recovery",
          frameIndex: recoveryIndex,
          label: "RF Cue",
          cue: "Sensor tasking restores confidence",
          kind: "recovery",
        },
  );

  if (moments.length < 4 && frames.length > 1) {
    addMoment({
      id: "demo-end-state",
      frameIndex: frames.length - 1,
      label: "End",
      cue: "Final custody state",
      kind: "end-state",
    });
  }

  return moments.slice(0, 4);
}

export function TimelineReplay({
  frames,
  activeIndex,
  isPlaying,
  speed,
  onSelectFrame,
  onPlayToggle,
  onReset,
  onStep,
  onSpeedChange,
}: TimelineReplayProps) {
  const activeFrame = frames[activeIndex];
  const judgeDemoMoments = buildJudgeDemoMoments(frames);
  const interval = Math.max(1, Math.ceil(frames.length / 7));
  const visibleIndexes = Array.from(
    new Set([
      0,
      activeIndex,
      frames.length - 1,
      ...judgeDemoMoments.map((moment) => moment.frameIndex),
      ...frames.map((_, index) => index).filter((index) => index % interval === 0),
    ]),
  ).sort((left, right) => left - right);

  return (
    <section className="panel timeline-panel" aria-labelledby="timeline-title">
      <div className="timeline-topline">
        <div>
          <p className="eyebrow">Replay</p>
          <h2 id="timeline-title">Custody Timeline</h2>
        </div>
        <div className="timeline-clock">
          <span>{activeFrame.time}</span>
          <strong>{activeFrame.label}</strong>
        </div>
      </div>

      <div className="replay-controls" aria-label="Replay controls">
        <button className="icon-button" type="button" onClick={onReset} aria-label="Reset replay">
          <RotateCcw size={17} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => onSelectFrame(0)}
          aria-label="Jump to start"
        >
          <SkipBack size={17} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => onStep(-1)}
          aria-label="Step backward"
        >
          <StepBack size={17} aria-hidden="true" />
        </button>
        <button className="play-button" type="button" onClick={onPlayToggle}>
          {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => onStep(1)}
          aria-label="Step forward"
        >
          <StepForward size={17} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={() => onSelectFrame(frames.length - 1)}
          aria-label="Jump to latest"
        >
          <SkipForward size={17} aria-hidden="true" />
        </button>
      </div>

      <input
        className="timeline-range"
        type="range"
        min="0"
        max={frames.length - 1}
        value={activeIndex}
        onChange={(event) => onSelectFrame(Number(event.target.value))}
        aria-label="Select replay frame"
      />

      <div className="timeline-events">
        {visibleIndexes.map((index) => {
          const frame = frames[index];
          return (
            <button
              key={frame.id}
              className={`timeline-event ${index === activeIndex ? "active" : ""}`}
              type="button"
              onClick={() => onSelectFrame(index)}
            >
              <span>{frame.time}</span>
              <strong>{frame.label}</strong>
            </button>
          );
        })}
      </div>

      <div className="speed-control" style={SPEED_ROW_STYLE} aria-label="Replay speed and demo jumps">
        <div style={DEMO_GROUP_STYLE} role="group" aria-label="Judge demo jumps">
          <span style={DEMO_LABEL_STYLE}>
            <Flag size={13} aria-hidden="true" /> Judge Demo
          </span>
          {judgeDemoMoments.map((moment) => {
            const frame = frames[moment.frameIndex];
            return (
              <button
                key={moment.id}
                className={moment.frameIndex === activeIndex ? "selected" : ""}
                type="button"
                title={`${moment.cue}: ${frame.time} ${frame.label}`}
                onClick={() => onSelectFrame(moment.frameIndex)}
                aria-label={`Jump to ${moment.label}: ${moment.cue}`}
              >
                {moment.label}
              </button>
            );
          })}
        </div>

        <div style={SPEED_GROUP_STYLE} role="group" aria-label="Replay speed">
          {[0.5, 1, 2].map((option) => (
            <button
              key={option}
              className={speed === option ? "selected" : ""}
              type="button"
              onClick={() => onSpeedChange(option)}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
