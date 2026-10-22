import { promises as dns } from "node:dns";
import net from "node:net";
import os from "node:os";
import { evaluateLatency, isApipa } from "../evaluate.js";
import type { Check } from "../types.js";

export const interfacesCheck: Check = {
  id: "interfaces",
  group: "Red",
  title: "Adaptadores de red",
  async run() {
    const active = Object.entries(os.networkInterfaces()).flatMap(([name, addrs]) =>
      (addrs ?? []).filter((a) => a.family === "IPv4" && !a.internal).map((a) => ({ name, ...a })),
    );

    if (active.length === 0) {
      return [
        {
          id: "ip",
          title: "Dirección IP",
          status: "fail",
          detail: "Ningún adaptador tiene dirección IPv4",
          hint: "Revisar cable de red, Wi-Fi o modo avión. Ver guía 01 de soporte.",
        },
      ];
    }

    return active.map((a) => {
      const apipa = isApipa(a.address);
      return {
        id: `ip-${a.name}`,
        title: `IP en ${a.name}`,
        status: apipa ? ("fail" as const) : ("ok" as const),
        detail: `${a.address} (MAC ${a.mac})`,
        hint: apipa
          ? "IP automática 169.254.x.x: el equipo no recibió dirección del DHCP. Ejecutar ipconfig /release y /renew."
          : undefined,
      };
    });
  },
};

export const dnsCheck: Check = {
  id: "dns",
  group: "Conectividad",
  title: "Resolución DNS",
  async run() {
    const host = "www.microsoft.com";
    try {
      const addresses = await withTimeout(dns.resolve4(host), 4000);
      return [{ id: "dns", title: "Resolución DNS", status: "ok", detail: `${host} -> ${addresses[0]}` }];
    } catch (err) {
      return [
        {
          id: "dns",
          title: "Resolución DNS",
          status: "fail",
          detail: `No se pudo resolver ${host} (${errorCode(err)})`,
          hint: "Ejecutar ipconfig /flushdns y revisar los servidores DNS del adaptador.",
        },
      ];
    }
  },
};

// Abre una conexión TCP y mide cuánto tarda
export function tcpLatency(host: string, port: number, timeoutMs = 4000): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const socket = net.connect({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      const ms = Math.round(performance.now() - start);
      socket.destroy();
      resolve(ms);
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("ETIMEDOUT"));
    });
    socket.once("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

export const internetCheck: Check = {
  id: "internet",
  group: "Conectividad",
  title: "Salida a internet",
  async run(t) {
    const targets = [
      { id: "tcp-ip", title: "Internet por IP (1.1.1.1:443)", host: "1.1.1.1", port: 443 },
      { id: "tcp-https", title: "HTTPS (microsoft.com:443)", host: "www.microsoft.com", port: 443 },
    ];

    return Promise.all(
      targets.map(async (target) => {
        try {
          const ms = await tcpLatency(target.host, target.port);
          const status = evaluateLatency(ms, t);
          return {
            id: target.id,
            title: target.title,
            status,
            detail: `${ms} ms`,
            hint: status === "ok" ? undefined : "Latencia alta: probar por cable o revisar el consumo de la red.",
          };
        } catch (err) {
          return {
            id: target.id,
            title: target.title,
            status: "fail" as const,
            detail: `Sin respuesta (${errorCode(err)})`,
            hint: "Si la IP responde pero el dominio no, el problema es DNS. Si ninguno responde, revisar proxy, firewall o la red.",
          };
        }
      }),
    );
  },
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("ETIMEDOUT")), ms)),
  ]);
}

function errorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && typeof err.code === "string") return err.code;
  return err instanceof Error ? err.message : "error desconocido";
}
