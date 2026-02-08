import React from "react";

type Tone = "neutral" | "warning" | "success";

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function ProgressBar({ value, tone = "neutral", label }: { value: number; tone?: Tone; label?: string }) {
  const v = clamp(value);
  const fillClass =
    tone === "success" ? "progress-fill progress-fill-success" : tone === "warning" ? "progress-fill progress-fill-warning" : "progress-fill";

  return (
    <div>
      {label ? <div className="mb-1 text-xs text-muted">{label}</div> : null}
      <div className="progress-track" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} role="progressbar">
        <div className={fillClass} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
