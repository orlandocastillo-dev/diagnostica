export type Status = "ok" | "warn" | "fail";

export interface CheckResult {
  id: string;
  group: "Sistema" | "Recursos" | "Almacenamiento" | "Red" | "Conectividad";
  title: string;
  status: Status;
  /** Texto corto que se muestra junto al resultado. */
  detail: string;
  /** Recomendación para el técnico cuando el estado no es "ok". */
  hint?: string;
  durationMs: number;
}

export interface Thresholds {
  memoryWarnPct: number;
  memoryFailPct: number;
  diskWarnFreePct: number;
  diskFailFreePct: number;
  uptimeWarnDays: number;
  latencyWarnMs: number;
  cpuLoadWarnPct: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  memoryWarnPct: 85,
  memoryFailPct: 95,
  diskWarnFreePct: 15,
  diskFailFreePct: 5,
  uptimeWarnDays: 7,
  latencyWarnMs: 250,
  cpuLoadWarnPct: 85,
};

export interface Check {
  id: string;
  group: CheckResult["group"];
  title: string;
  /** Puede devolver varios resultados (por ejemplo, uno por disco). */
  run(thresholds: Thresholds): Promise<Omit<CheckResult, "durationMs" | "group">[]>;
}

export interface Report {
  hostname: string;
  platform: string;
  generatedAt: string;
  results: CheckResult[];
  summary: Record<Status, number>;
}
