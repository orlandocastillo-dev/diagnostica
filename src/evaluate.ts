// Reglas de evaluación puras: reciben números y umbrales, devuelven un estado
import type { Status, Thresholds } from "./types.js";

export function evaluateMemory(usedPct: number, t: Thresholds): Status {
  if (usedPct >= t.memoryFailPct) return "fail";
  if (usedPct >= t.memoryWarnPct) return "warn";
  return "ok";
}

export function evaluateDisk(freePct: number, t: Thresholds): Status {
  if (freePct < t.diskFailFreePct) return "fail";
  if (freePct < t.diskWarnFreePct) return "warn";
  return "ok";
}

export function evaluateUptime(days: number, t: Thresholds): Status {
  return days >= t.uptimeWarnDays ? "warn" : "ok";
}

export function evaluateLatency(ms: number, t: Thresholds): Status {
  return ms > t.latencyWarnMs ? "warn" : "ok";
}

export function evaluateCpu(loadPct: number, t: Thresholds): Status {
  return loadPct >= t.cpuLoadWarnPct ? "warn" : "ok";
}

/** 169.254.0.0/16: Windows se asigna esta IP cuando no obtiene respuesta del servidor DHCP. */
export function isApipa(ip: string): boolean {
  return ip.startsWith("169.254.");
}

export function worst(statuses: Status[]): Status {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  return "ok";
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}
