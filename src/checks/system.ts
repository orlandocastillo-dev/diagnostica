import os from "node:os";
import { evaluateCpu, evaluateMemory, evaluateUptime, formatBytes, formatUptime } from "../evaluate.js";
import type { Check } from "../types.js";

export const systemCheck: Check = {
  id: "sistema",
  group: "Sistema",
  title: "Sistema operativo",
  async run(t) {
    const uptimeDays = os.uptime() / 86400;
    const status = evaluateUptime(uptimeDays, t);
    return [
      {
        id: "so",
        title: "Sistema operativo",
        status: "ok",
        detail: `${os.version()} (${os.release()}, ${os.arch()})`,
      },
      {
        id: "uptime",
        title: "Tiempo encendido",
        status,
        detail: formatUptime(os.uptime()),
        hint:
          status === "ok"
            ? undefined
            : "Reiniciar el equipo: muchas actualizaciones y fugas de memoria se resuelven así.",
      },
    ];
  },
};

export const memoryCheck: Check = {
  id: "memoria",
  group: "Recursos",
  title: "Memoria RAM",
  async run(t) {
    const total = os.totalmem();
    const free = os.freemem();
    const usedPct = Math.round(((total - free) / total) * 100);
    const status = evaluateMemory(usedPct, t);
    return [
      {
        id: "ram",
        title: "Memoria RAM",
        status,
        detail: `${usedPct} % en uso (${formatBytes(total - free)} de ${formatBytes(total)})`,
        hint:
          status === "ok"
            ? undefined
            : "Revisar en el Administrador de tareas qué proceso consume más memoria; si es habitual, evaluar ampliar la RAM.",
      },
    ];
  },
};

/** Mide el uso de CPU comparando dos muestras de os.cpus() separadas por un intervalo. */
async function sampleCpuLoad(intervalMs = 500): Promise<number> {
  const snapshot = () =>
    os.cpus().reduce(
      (acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        return { idle: acc.idle + cpu.times.idle, total: acc.total + total };
      },
      { idle: 0, total: 0 },
    );

  const a = snapshot();
  await new Promise((r) => setTimeout(r, intervalMs));
  const b = snapshot();
  const total = b.total - a.total;
  return total === 0 ? 0 : Math.round((1 - (b.idle - a.idle) / total) * 100);
}

export const cpuCheck: Check = {
  id: "cpu",
  group: "Recursos",
  title: "Procesador",
  async run(t) {
    const cpus = os.cpus();
    const load = await sampleCpuLoad();
    const status = evaluateCpu(load, t);
    return [
      {
        id: "cpu",
        title: "Procesador",
        status,
        detail: `${load} % de uso, ${cpus.length} núcleos lógicos (${cpus[0]?.model.trim() ?? "desconocido"})`,
        hint: status === "ok" ? undefined : "Uso de CPU alto en reposo: revisar procesos en segundo plano o antivirus en ejecución.",
      },
    ];
  },
};
