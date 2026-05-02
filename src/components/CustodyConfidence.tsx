import { Gauge, ShieldCheck, TriangleAlert } from "lucide-react";
import type { CustodyFrame } from "./types";

type CustodyConfidenceProps = {
  frame: CustodyFrame;
};

export function CustodyConfidence({ frame }: CustodyConfidenceProps) {
  const riskClass = frame.confidence >= 78 ? "good" : frame.confidence >= 64 ? "watch" : "risk";

  return (
    <section className="panel custody-panel" aria-labelledby="custody-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Custody</p>
          <h2 id="custody-title">Confidence & Rationale</h2>
        </div>
        <div className={`state-pill ${riskClass}`}>
          {riskClass === "risk" ? (
            <TriangleAlert size={15} aria-hidden="true" />
          ) : (
            <ShieldCheck size={15} aria-hidden="true" />
          )}
          <span>{frame.state}</span>
        </div>
      </div>

      <div className="confidence-block">
        <div className={`confidence-gauge ${riskClass}`}>
          <Gauge size={18} aria-hidden="true" />
          <strong>{frame.confidence}%</strong>
          <span>custody confidence</span>
        </div>
        <div className="confidence-bars">
          <div className="bar-row">
            <span>Track continuity</span>
            <div className="bar-track">
              <span style={{ width: `${frame.confidence}%` }} />
            </div>
          </div>
          <div className="bar-row">
            <span>Ambiguity</span>
            <strong>{frame.ambiguity}</strong>
          </div>
          <div className="bar-row">
            <span>Velocity</span>
            <strong>{frame.velocity}</strong>
          </div>
        </div>
      </div>

      <div className="rationale-grid">
        <div>
          <h3>Explanation</h3>
          <ul>
            {frame.explanation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Contested Factors</h3>
          <ul>
            {frame.contestedFactors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
