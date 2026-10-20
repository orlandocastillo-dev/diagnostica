import type { Check } from "../types.js";
import { diskCheck } from "./disk.js";
import { dnsCheck, interfacesCheck, internetCheck } from "./network.js";
import { cpuCheck, memoryCheck, systemCheck } from "./system.js";

export const ALL_CHECKS: Check[] = [systemCheck, cpuCheck, memoryCheck, diskCheck, interfacesCheck, dnsCheck, internetCheck];

export function selectChecks(solo: string | undefined, sinRed: boolean): Check[] {
  let checks = ALL_CHECKS;
  if (solo) {
    const wanted = solo.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const valid = new Set(ALL_CHECKS.map((c) => c.group.toLowerCase()));
    const unknown = wanted.filter((w) => !valid.has(w));
    if (unknown.length) throw new UsageError(`Grupo desconocido: ${unknown.join(", ")}`);
    checks = checks.filter((c) => wanted.includes(c.group.toLowerCase()));
  }
  if (sinRed) checks = checks.filter((c) => c.group !== "Conectividad");
  return checks;
}

export class UsageError extends Error {}
