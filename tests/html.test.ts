import { describe, expect, it } from "vitest";
import { escapeHtml, renderHtml } from "../src/report/html.js";
import type { Report } from "../src/types.js";

const report: Report = {
  hostname: "PC-<CONTABILIDAD>",
  platform: "Windows_NT 10.0.22631",
  generatedAt: "2026-10-19T15:00:00.000Z",
  summary: { ok: 1, warn: 0, fail: 1 },
  results: [
    { id: "ram", group: "Recursos", title: "Memoria RAM", status: "ok", detail: "40 % en uso", durationMs: 1 },
    {
      id: "dns",
      group: "Conectividad",
      title: "Resolución DNS",
      status: "fail",
      detail: "No se pudo resolver",
      hint: "Ejecutar ipconfig /flushdns",
      durationMs: 3,
    },
  ],
};

describe("renderHtml", () => {
  const html = renderHtml(report);

  it("es un documento completo e independiente", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script|<link/);
  });

  it("escapa los datos del equipo", () => {
    expect(html).toContain("PC-&lt;CONTABILIDAD&gt;");
    expect(html).not.toContain("<CONTABILIDAD>");
  });

  it("agrupa e incluye las recomendaciones", () => {
    expect(html).toContain("<h2>Recursos</h2>");
    expect(html).toContain("<h2>Conectividad</h2>");
    expect(html).toContain("Ejecutar ipconfig /flushdns");
  });

  it("indica el estado general según el peor resultado", () => {
    expect(html).toContain("Requiere atención");
  });
});

describe("escapeHtml", () => {
  it("escapa los cinco caracteres especiales", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});
