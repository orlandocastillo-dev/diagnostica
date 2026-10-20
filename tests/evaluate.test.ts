import { describe, expect, it } from "vitest";
import {
  evaluateDisk,
  evaluateLatency,
  evaluateMemory,
  evaluateUptime,
  formatBytes,
  formatUptime,
  isApipa,
  worst,
} from "../src/evaluate.js";
import { DEFAULT_THRESHOLDS as t } from "../src/types.js";

describe("umbrales", () => {
  it("memoria: avisa desde 85 % y falla desde 95 %", () => {
    expect(evaluateMemory(60, t)).toBe("ok");
    expect(evaluateMemory(85, t)).toBe("warn");
    expect(evaluateMemory(97, t)).toBe("fail");
  });

  it("disco: avisa con menos de 15 % libre y falla con menos de 5 %", () => {
    expect(evaluateDisk(40, t)).toBe("ok");
    expect(evaluateDisk(14, t)).toBe("warn");
    expect(evaluateDisk(3, t)).toBe("fail");
  });

  it("tiempo encendido: avisa a partir de 7 días", () => {
    expect(evaluateUptime(2, t)).toBe("ok");
    expect(evaluateUptime(9, t)).toBe("warn");
  });

  it("latencia: avisa por encima de 250 ms", () => {
    expect(evaluateLatency(40, t)).toBe("ok");
    expect(evaluateLatency(400, t)).toBe("warn");
  });
});

describe("isApipa", () => {
  it("detecta las IP automáticas sin DHCP", () => {
    expect(isApipa("169.254.12.7")).toBe(true);
    expect(isApipa("192.168.1.20")).toBe(false);
  });
});

describe("worst", () => {
  it("devuelve el estado más grave", () => {
    expect(worst(["ok", "warn", "ok"])).toBe("warn");
    expect(worst(["warn", "fail"])).toBe("fail");
    expect(worst([])).toBe("ok");
  });
});

describe("formatos", () => {
  it("bytes en la unidad adecuada", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(256 * 1024 ** 3)).toBe("256 GB");
  });

  it("tiempo encendido legible", () => {
    expect(formatUptime(125)).toBe("2 min");
    expect(formatUptime(3 * 3600 + 600)).toBe("3 h 10 min");
    expect(formatUptime(9 * 86400 + 4 * 3600)).toBe("9 d 4 h");
  });
});
