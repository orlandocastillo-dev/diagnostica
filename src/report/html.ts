import type { CheckResult, Report, Status } from "../types.js";

const LABEL: Record<Status, string> = { ok: "Correcto", warn: "Aviso", fail: "Falla" };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(r: CheckResult): string {
  return `
      <tr class="${r.status}">
        <td><span class="badge">${LABEL[r.status]}</span></td>
        <th scope="row">${escapeHtml(r.title)}</th>
        <td>${escapeHtml(r.detail)}${r.hint ? `<p class="hint">${escapeHtml(r.hint)}</p>` : ""}</td>
      </tr>`;
}

/** Informe en un único archivo HTML, sin dependencias externas, listo para adjuntar a un ticket. */
export function renderHtml(report: Report): string {
  const groups = [...new Set(report.results.map((r) => r.group))];
  const date = new Date(report.generatedAt).toLocaleString("es-CO");
  const { ok, warn, fail } = report.summary;
  const overall: Status = fail ? "fail" : warn ? "warn" : "ok";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Diagnóstico de ${escapeHtml(report.hostname)}</title>
<style>
  :root { --ink:#1b2420; --muted:#5e6a64; --line:#dde2dc; --ok:#2c7346; --warn:#8f5400; --fail:#b42318; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 2rem 1rem; background: #f3f4f1; color: var(--ink); font: 15px/1.5 system-ui, "Segoe UI", sans-serif; }
  main { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 2rem; }
  h1 { margin: 0; font-size: 1.5rem; }
  h2 { margin: 2rem 0 .5rem; font-size: 1rem; }
  .meta { color: var(--muted); margin: .25rem 0 1.5rem; }
  .summary { display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem; border-radius: 8px; background: #f7f8f6; }
  .summary strong { font-size: 1.4rem; display: block; }
  .summary .overall { margin-left: auto; align-self: center; font-weight: 600; }
  .overall.ok { color: var(--ok); } .overall.warn { color: var(--warn); } .overall.fail { color: var(--fail); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: .6rem .5rem; border-top: 1px solid var(--line); }
  th { font-weight: 500; width: 32%; }
  td:first-child { width: 90px; }
  .badge { display: inline-block; padding: .05rem .5rem; border-radius: 99px; font-size: .8rem; font-weight: 600; }
  .ok .badge { background: #e2f2e7; color: var(--ok); }
  .warn .badge { background: #fbefd9; color: var(--warn); }
  .fail .badge { background: #fde8e6; color: var(--fail); }
  .hint { margin: .25rem 0 0; color: var(--muted); font-size: .875rem; }
  footer { margin-top: 2rem; color: var(--muted); font-size: .8rem; }
  @media print { body { background: #fff; padding: 0; } main { border: 0; } }
</style>
</head>
<body>
<main>
  <h1>Diagnóstico de ${escapeHtml(report.hostname)}</h1>
  <p class="meta">${escapeHtml(report.platform)}, generado el ${escapeHtml(date)}</p>

  <section class="summary" aria-label="Resumen">
    <div><strong>${ok}</strong>correctos</div>
    <div><strong>${warn}</strong>avisos</div>
    <div><strong>${fail}</strong>fallas</div>
    <p class="overall ${overall}">${overall === "ok" ? "Sin problemas detectados" : overall === "warn" ? "Revisar los avisos" : "Requiere atención"}</p>
  </section>
${groups
  .map(
    (g) => `
  <h2>${escapeHtml(g)}</h2>
  <table>
    <tbody>${report.results
      .filter((r) => r.group === g)
      .map(row)
      .join("")}
    </tbody>
  </table>`,
  )
  .join("")}

  <footer>Generado con diagnostica. Adjunta este archivo al ticket de soporte.</footer>
</main>
</body>
</html>
`;
}
