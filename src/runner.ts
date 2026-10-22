import os from "node:os";
import type { Check, CheckResult, Report, Status, Thresholds } from "./types.js";

const CHECK_TIMEOUT_MS = 8000;

// Ejecuta todas las revisiones en paralelo
export async function runChecks(checks: Check[], thresholds: Thresholds): Promise<CheckResult[]> {
  const settled = await Promise.all(
    checks.map(async (check) => {
      const start = performance.now();
      try {
        const results = await Promise.race([
          check.run(thresholds),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`superó ${CHECK_TIMEOUT_MS / 1000} s`)), CHECK_TIMEOUT_MS).unref(),
          ),
        ]);
        const durationMs = Math.round(performance.now() - start);
        return results.map((r) => ({ ...r, group: check.group, durationMs }));
      } catch (err) {
        return [
          {
            id: check.id,
            group: check.group,
            title: check.title,
            status: "fail" as const,
            detail: `No se pudo ejecutar: ${err instanceof Error ? err.message : String(err)}`,
            durationMs: Math.round(performance.now() - start),
          },
        ];
      }
    }),
  );
  return settled.flat();
}

export function summarize(results: CheckResult[]): Record<Status, number> {
  const summary: Record<Status, number> = { ok: 0, warn: 0, fail: 0 };
  for (const r of results) summary[r.status]++;
  return summary;
}

export function buildReport(results: CheckResult[], now = new Date()): Report {
  return {
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    generatedAt: now.toISOString(),
    results,
    summary: summarize(results),
  };
}
