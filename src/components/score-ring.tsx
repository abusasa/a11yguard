import { gradeMeta } from "@/lib/labels";
import type { Grade } from "@/lib/types";

interface ScoreRingProps {
  score: number;
  grade: Grade;
  size?: "sm" | "lg";
}

export function ScoreRing({ score, grade, size = "lg" }: ScoreRingProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = gradeMeta[grade].ring;

  return (
    <div
      className={`relative shrink-0 ${size === "sm" ? "h-28 w-28" : "h-40 w-40"}`}
      role="img"
      aria-label={`Оценка доступности: ${score} из 100. ${gradeMeta[grade].label}.`}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-paper-deep"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-score"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        <span
          className={`${size === "sm" ? "text-3xl" : "text-5xl"} font-extrabold tracking-[-0.05em]`}
        >
          {score}
        </span>
        <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink-soft">
          из 100
        </span>
      </div>
    </div>
  );
}
