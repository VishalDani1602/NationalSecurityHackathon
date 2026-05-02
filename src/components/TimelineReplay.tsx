import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from "lucide-react";
import type { CustodyFrame } from "./types";

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
  const interval = Math.max(1, Math.ceil(frames.length / 7));
  const visibleIndexes = Array.from(
    new Set([
      0,
      activeIndex,
      frames.length - 1,
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

      <div className="speed-control" aria-label="Replay speed">
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
    </section>
  );
}
