#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { selectChecks, UsageError } from "./checks/index.js";
import { openFile } from "./open.js";
import { renderConsole } from "./report/console.js";
import { renderHtml } from "./report/html.js";
import { buildReport, runChecks } from "./runner.js";
import { DEFAULT_THRESHOLDS } from "./types.js";

const HELP = `
diagnostica: revisión rápida de un equipo para soporte técnico

Uso:
  diagnostica [opciones]

Opciones:
  --solo <grupos>     Ejecuta solo algunos grupos, separados por coma:
                      sistema, recursos, almacenamiento, red, conectividad
  --json              Imprime el resultado en JSON (para scripts o inventarios)
  --html <archivo>    Guarda un informe HTML para adjuntar al ticket
  --abrir             Guarda el informe HTML y lo abre en el navegador
  --sin-red           Omite las pruebas que salen a internet
  -h, --help          Muestra esta ayuda
  -v, --version       Muestra la versión

Código de salida: 0 si no hay fallas, 1 si alguna revisión falló, 2 si hubo un error de uso.

Ejemplos:
  diagnostica
  diagnostica --abrir
  diagnostica --html informe.html
  diagnostica --solo red,conectividad --json
`;

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      solo: { type: "string" },
      json: { type: "boolean", default: false },
      html: { type: "string" },
      abrir: { type: "boolean", default: false },
      "sin-red": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    strict: true,
  });

  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values.version) {
    console.log("1.0.0");
    return 0;
  }

  const checks = selectChecks(values.solo, values["sin-red"]);
  const progress = !values.json && process.stdout.isTTY;
  if (progress) process.stdout.write("Ejecutando revisiones...\r");

  const results = await runChecks(checks, DEFAULT_THRESHOLDS);
  const report = buildReport(results);

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    if (progress) process.stdout.write(" ".repeat(30) + "\r");
    console.log(renderConsole(report));
  }

  const htmlPath = values.html ?? (values.abrir ? "informe-diagnostico.html" : undefined);
  if (htmlPath) {
    const path = resolve(htmlPath);
    await writeFile(path, renderHtml(report), "utf8");
    if (!values.json) console.log(`Informe HTML guardado en ${path}\n`);
    if (values.abrir) openFile(path);
  }

  return report.summary.fail > 0 ? 1 : 0;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    const usage = err instanceof UsageError || (err instanceof Error && "code" in err && String(err.code).startsWith("ERR_PARSE_ARGS"));
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    if (usage) console.error("Usa --help para ver las opciones.");
    process.exitCode = usage ? 2 : 1;
  });
