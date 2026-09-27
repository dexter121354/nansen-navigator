interface GaugeProps {
  label: string;
  sublabel: string;
  value: number; // 0-1
  tone: "brand" | "signal";
}

export function Gauge({ label, sublabel, value, tone }: GaugeProps) {
  const pct = Math.round(value * 100);
  const radius = 68;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - value);
  const stroke = tone === "brand" ? "var(--brand)" : pct >= 50 ? "var(--pos)" : "var(--neg)";

  return (
    <div className="flex flex-col items-center gap-3 surface px-6 py-5">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <svg viewBox="0 0 160 92" className="h-[92px] w-[160px]">
        <path
          d="M 12 84 A 68 68 0 0 1 148 84"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 12 84 A 68 68 0 0 1 148 84"
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="-mt-6 text-center">
        <div className="font-mono text-4xl font-semibold tabular-nums" style={{ color: stroke }}>
          {pct}%
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  );
}
