import type { Grade, Severity } from "@/lib/types";

export const severityMeta: Record<
  Severity,
  {
    label: string;
    kk: string;
    badge: string;
    border: string;
    bg: string;
    dot: string;
    text: string;
  }
> = {
  blocker: {
    label: "Блокер",
    kk: "Сыни",
    badge: "bg-red text-white",
    border: "border-red/25",
    bg: "bg-[#fdf1ef]",
    dot: "bg-red",
    text: "text-red",
  },
  critical: {
    label: "Критично",
    kk: "Жоғары",
    badge: "bg-amber text-white",
    border: "border-amber/25",
    bg: "bg-[#fff8eb]",
    dot: "bg-amber",
    text: "text-amber",
  },
  warning: {
    label: "Важно",
    kk: "Орташа",
    badge: "bg-[#f2d38b] text-ink",
    border: "border-[#d9b25e]/40",
    bg: "bg-[#fdf9ed]",
    dot: "bg-[#b7791f]",
    text: "text-[#8a5a12]",
  },
  info: {
    label: "Улучшение",
    kk: "Төмен",
    badge: "bg-[#dbe9f4] text-forest",
    border: "border-[#9bbdd4]/50",
    bg: "bg-[#f4f9fc]",
    dot: "bg-[#3b7a9e]",
    text: "text-[#2f6583]",
  },
};

export const gradeMeta: Record<
  Grade,
  {
    label: string;
    note: string;
    ring: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  good: {
    label: "Жақсы",
    note: "База в порядке",
    ring: "#067647",
    text: "text-green",
    bg: "bg-[#eaf7ef]",
    border: "border-green/20",
  },
  fair: {
    label: "Орташа",
    note: "Есть что исправить",
    ring: "#b54708",
    text: "text-amber",
    bg: "bg-[#fff8eb]",
    border: "border-amber/20",
  },
  poor: {
    label: "Нашар",
    note: "Много барьеров",
    ring: "#c2410c",
    text: "text-[#c2410c]",
    bg: "bg-[#fff1e8]",
    border: "border-[#c2410c]/20",
  },
  critical: {
    label: "Сыни",
    note: "Сайт трудно использовать",
    ring: "#b42318",
    text: "text-red",
    bg: "bg-[#fdf1ef]",
    border: "border-red/20",
  },
};

export const severityOrder: Severity[] = [
  "blocker",
  "critical",
  "warning",
  "info",
];
