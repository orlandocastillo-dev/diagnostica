import { describe, expect, it } from "vitest";
import { selectChecks } from "../src/checks/index.js";
import { buildReport, runChecks, summarize } from "../src/runner.js";
import { DEFAULT_THRESHOLDS, type Check } from "../src/types.js";

const fake = (id: string, run: Check["run"]): Check => ({ id, group: "Sistema", title: id, run });

describe("runChecks", () => {
  it("agrega grupo y duración a cada resultado", async () => {
    const results = await runChecks(
      [fake("a", async () => [{ id: "a", title: "A", status: "ok", detail: "bien" }])],
      DEFAULT_THRESHOLDS,
    );
    expect(results[0]).toMatchObject({ id: "a", group: "Sistema", status: "ok" });
    expect(results[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("si una revisión lanza un error, se reporta como falla y las demás siguen", async () => {
    const results = await runChecks(
      [
        fake("rota", async () => {
          throw new Error("sin permisos");
        }),
        fake("sana", async () => [{ id: "sana", title: "Sana", status: "ok", detail: "" }]),
      ],
      DEFAULT_THRESHOLDS,
    );
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ status: "fail", detail: "No se pudo ejecutar: sin permisos" });
    expect(results[1].status).toBe("ok");
  });

  it("una revisión puede devolver varios resultados", async () => {
    const results = await runChecks(
      [
        fake("discos", async () => [
          { id: "c", title: "C:", status: "ok", detail: "" },
          { id: "d", title: "D:", status: "warn", detail: "" },
        ]),
      ],
      DEFAULT_THRESHOLDS,
    );
    expect(results.map((r) => r.id)).toEqual(["c", "d"]);
  });
});

describe("summarize y buildReport", () => {
  it("cuenta resultados por estado", async () => {
    const results = await runChecks(
      [
        fake("x", async () => [
          { id: "1", title: "1", status: "ok", detail: "" },
          { id: "2", title: "2", status: "fail", detail: "" },
          { id: "3", title: "3", status: "warn", detail: "" },
          { id: "4", title: "4", status: "ok", detail: "" },
        ]),
      ],
      DEFAULT_THRESHOLDS,
    );
    expect(summarize(results)).toEqual({ ok: 2, warn: 1, fail: 1 });
    const report = buildReport(results, new Date("2026-10-19T12:00:00Z"));
    expect(report.generatedAt).toBe("2026-10-19T12:00:00.000Z");
    expect(report.hostname).toBeTruthy();
  });
});

describe("selectChecks", () => {
  it("filtra por grupos sin importar mayúsculas", () => {
    const groups = new Set(selectChecks("Red,conectividad", false).map((c) => c.group));
    expect([...groups].sort()).toEqual(["Conectividad", "Red"]);
  });

  it("--sin-red quita las pruebas de conectividad", () => {
    expect(selectChecks(undefined, true).some((c) => c.group === "Conectividad")).toBe(false);
  });

  it("rechaza grupos que no existen", () => {
    expect(() => selectChecks("impresoras", false)).toThrow(/desconocido/);
  });
});
