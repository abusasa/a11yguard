export type Severity = "blocker" | "critical" | "warning" | "info";

export type Grade = "good" | "fair" | "poor" | "critical";

export interface IssueExample {
  selector: string;
  snippet: string;
}

export interface Issue {
  id: string;
  rule: string;
  title: string;
  description: string;
  wcag: string;
  severity: Severity;
  count: number;
  examples: IssueExample[];
  fix: string;
  code?: string;
  docs?: string;
}

export interface ScanStats {
  blockers: number;
  critical: number;
  warnings: number;
  infos: number;
  totalViolations: number;
  totalRules: number;
  elementsChecked: number;
}

export interface ScanResult {
  url: string;
  finalUrl: string;
  scannedAt: string;
  title: string;
  lang: string | null;
  score: number;
  grade: Grade;
  stats: ScanStats;
  issues: Issue[];
  manualChecks: string[];
  meta: {
    status: number;
    responseTimeMs: number;
    htmlBytes: number;
  };
}

export interface ScanErrorResponse {
  error: string;
  hint?: string;
}
