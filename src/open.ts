import { spawn } from "node:child_process";

/** Abre un archivo con el programa predeterminado del sistema (el navegador, para un .html). */
export function openFile(path: string, platform = process.platform): void {
  const [command, args] =
    platform === "win32"
      ? ["cmd", ["/c", "start", '""', `"${path}"`]]
      : platform === "darwin"
        ? ["open", [path]]
        : ["xdg-open", [path]];

  try {
    const child = spawn(command, args as string[], {
      detached: true,
      stdio: "ignore",
      windowsVerbatimArguments: platform === "win32",
    });
    child.on("error", () => console.error(`No se pudo abrir el navegador. Abre manualmente: ${path}`));
    child.unref();
  } catch {
    console.error(`No se pudo abrir el navegador. Abre manualmente: ${path}`);
  }
}
