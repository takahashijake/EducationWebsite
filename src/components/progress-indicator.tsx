"use client";
import { useProgress } from "./progress-provider";
export function ProgressIndicator({ compact = false }: { compact?: boolean }) {
  const { completed, available, percentage, ready } = useProgress();
  return (
    <div className={compact ? "progress-widget compact" : "progress-widget"}>
      <div className="progress-label">
        <span>{compact ? "Your progress" : "Your learning progress"}</span>
        <strong>{ready ? percentage : 0}%</strong>
      </div>
      <div
        role="progressbar"
        aria-label="Available lessons completed"
        aria-valuenow={ready ? percentage : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        className="progress-track"
      >
        <span style={{ width: `${ready ? percentage : 0}%` }} />
      </div>
      <p>
        {ready ? completed : 0} of {available} available lessons completed
      </p>
      {!compact && (
        <span className="progress-note">
          Saved in this browser. No account needed.
        </span>
      )}
    </div>
  );
}
