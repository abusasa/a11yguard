import { ShieldCheck } from "lucide-react";

interface LogoProps {
  compact?: boolean;
  variant?: "light" | "dark";
}

export function Logo({ compact = false, variant = "light" }: LogoProps) {
  const text = variant === "dark" ? "text-paper" : "text-ink";
  const accent = variant === "dark" ? "text-lime" : "text-forest-soft";

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-forest text-lime shadow-sm shadow-forest/20">
        <ShieldCheck className="size-5" strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compact && (
        <span
          className={`text-[17px] font-extrabold tracking-[-0.04em] ${text}`}
        >
          A11y<span className={accent}>Guard</span>
        </span>
      )}
    </span>
  );
}
