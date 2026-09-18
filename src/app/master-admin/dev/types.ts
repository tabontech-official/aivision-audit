/**
 * Wire types shared by the dev trace endpoint and the dev console client.
 * Kept free of server imports so the client component can use them directly.
 */

export type DevLogEntry = {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  category: string;
  message: string;
  reportId: string | null;
  websiteUrl: string | null;
  stage: string | null;
  durationMs: number | null;
  meta: Record<string, unknown> | null;
  stackTrace: string | null;
  createdAt: string;
};

/** Everything the pipeline has written for one report, as of this poll. */
export type DevReportSnapshot = {
  id: string;
  publicId: string;
  url: string;
  status: string;
  currentStage: string | null;
  progressPercent: number;
  errorMessage: string | null;
  overallScore: number | null;
  grade: string | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Artefacts the pipeline is supposed to leave behind — the honest completion check. */
  artefacts: {
    rawData: boolean;
    screenshot: boolean;
    pageSpeedRows: number;
    auditResults: number;
    sectionResults: number;
    snapshot: boolean;
  };
};

export type DevTraceResponse = {
  serverTime: string;
  report: DevReportSnapshot | null;
  logs: DevLogEntry[];
};

export type DevReportListItem = {
  id: string;
  publicId: string;
  url: string;
  status: string;
  currentStage: string | null;
  progressPercent: number;
  createdAt: string;
};
