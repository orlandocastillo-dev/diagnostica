import { existsSync } from "node:fs";
import { statfs } from "node:fs/promises";
import os from "node:os";
import { evaluateDisk, formatBytes } from "../evaluate.js";
import type { Check } from "../types.js";

/** Unidades a revisar: letras de C: a Z: en Windows, la raíz y /home en Linux y macOS. */
export function mountPoints(platform = os.platform()): string[] {
  if (platform === "win32") {
    return "CDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .map((l) => `${l}:\\`)
      .filter((p) => existsSync(p));
  }
  return ["/", "/home"].filter((p) => existsSync(p));
}

export const diskCheck: Check = {
  id: "discos",
  group: "Almacenamiento",
  title: "Espacio en disco",
  async run(t) {
    const results = [];
    const seen = new Set<string>();

    for (const mount of mountPoints()) {
      try {
        const s = await statfs(mount);
        const total = s.blocks * s.bsize;
        const free = s.bavail * s.bsize;
        if (total === 0) continue; // lectores de tarjetas vacíos, unidades de CD

        // En Linux /home suele estar en la misma partición que /: se evita repetirla.
        const key = `${total}-${s.type}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const freePct = Math.round((free / total) * 100);
        const status = evaluateDisk(freePct, t);
        results.push({
          id: `disco-${mount}`,
          title: `Unidad ${mount.replace(/\\$/, "")}`,
          status,
          detail: `${freePct} % libre (${formatBytes(free)} de ${formatBytes(total)})`,
          hint:
            status === "ok"
              ? undefined
              : "Liberar espacio: Configuración > Sistema > Almacenamiento > Archivos temporales. Mantener al menos 15 % libre.",
        });
      } catch {
        // Unidad no disponible (de red desconectada, sin permisos): se omite.
      }
    }

    if (results.length === 0) {
      results.push({ id: "disco", title: "Discos", status: "warn" as const, detail: "No se pudo leer ninguna unidad" });
    }
    return results;
  },
};
