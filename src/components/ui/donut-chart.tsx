import { cn } from "@/lib/utils";

interface DonutChartProps {
  score: number;
  className?: string;
}

export function DonutChart({ score, className }: DonutChartProps) {
  const R = 80;
  const STROKE = 15;
  const circumference = 2 * Math.PI * R;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clamped / 100);
  const arcColor =
    clamped >= 70 ? "var(--green)" : clamped >= 40 ? "var(--orange)" : "var(--red)";

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("w-44 h-44", className)}
      aria-label={`${score}% readiness score`}
    >
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke="var(--line)"
        strokeWidth={STROKE}
      />
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke={arcColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
      />
      <text
        x="100"
        y="94"
        textAnchor="middle"
        fill="var(--ink)"
        fontSize="40"
        fontWeight="700"
        fontFamily="var(--font-geist-sans)"
      >
        {score}%
      </text>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        fill="var(--muted)"
        fontSize="13"
        fontFamily="var(--font-geist-sans)"
      >
        readiness
      </text>
    </svg>
  );
}
