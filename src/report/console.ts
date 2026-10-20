import type { CheckResult, Report, Status } from "../types.js";

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (text: string) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);

const green = paint(32);
const yellow = paint(33);
const red = paint(31);
const dim = paint(2);
const bold = paint(1);

const LABEL: Record<Status, string> = {
  ok: green("  OK  "),
  warn: yellow("AVISO "),
  fail: red("FALLA "),
};

export function renderConsole(report: Report): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(bold(`Diagnóstico de ${report.hostname}`) + dim(`  ${report.platform}`));
  lines.push(dim(new Date(report.generatedAt).toLocaleString("es-CO")));

  const groups = new Map<string, CheckResult[]>();
  for (const r of report.results) groups.set(r.group, [...(groups.get(r.group) ?? []), r]);

  const width = Math.max(...report.results.map((r) => r.title.length), 10) + 2;

  for (const [group, results] of groups) {
    lines.push("");
    lines.push(bold(group));
    for (const r of results) {
      lines.push(` ${LABEL[r.status]} ${r.title.padEnd(width)}${r.detail}`);
      if (r.hint) lines.push(`        ${" ".repeat(width)}${dim("-> " + r.hint)}`);
    }
  }

  const { ok, warn, fail } = report.summary;
  lines.push("");
  lines.push(
    `Resumen: ${green(`${ok} correctos`)}, ${yellow(`${warn} avisos`)}, ${red(`${fail} fallas`)}`,
  );
  lines.push("");
  return lines.join("\n");
}
