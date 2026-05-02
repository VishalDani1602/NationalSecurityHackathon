import { ArrowUpRight, ClipboardCheck, Radar } from "lucide-react";
import type { CustodyFrame, Sensor } from "./types";

type NextBestSensorProps = {
  frame: CustodyFrame;
  sensor?: Sensor;
};

export function NextBestSensor({ frame, sensor }: NextBestSensorProps) {
  return (
    <section className="panel recommendation-panel" aria-labelledby="recommendation-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Recommendation</p>
          <h2 id="recommendation-title">Next Best Sensor</h2>
        </div>
        <div className="header-metric gain">
          <ArrowUpRight size={16} aria-hidden="true" />
          <span>+{frame.recommendation.expectedGain}%</span>
        </div>
      </div>

      <div className="recommendation-primary">
        <div className="recommendation-icon">
          <Radar size={22} aria-hidden="true" />
        </div>
        <div>
          <span>{sensor?.id ?? frame.recommendation.sensorId}</span>
          <strong>{sensor?.name ?? "Sensor tasking"}</strong>
          <p>{frame.recommendation.action}</p>
        </div>
      </div>

      <div className="recommendation-details">
        <div>
          <span>ETA to cue</span>
          <strong>{frame.recommendation.eta}</strong>
        </div>
        <div>
          <span>Reason</span>
          <strong>{frame.recommendation.reason}</strong>
        </div>
      </div>

      <div className="tasking-line">
        <ClipboardCheck size={16} aria-hidden="true" />
        <span>{frame.recommendation.command}</span>
      </div>
    </section>
  );
}
