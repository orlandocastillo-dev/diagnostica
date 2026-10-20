# diagnostica: CLI de diagnóstico para soporte técnico

Herramienta de línea de comandos en **Node.js y TypeScript** que revisa en pocos segundos lo que un técnico de soporte mira primero cuando un usuario dice "mi computador no funciona": sistema, CPU, memoria, discos, red y salida a internet. Muestra el resultado con colores en la terminal, una recomendación por cada problema y puede generar un **informe HTML para adjuntar al ticket**.

Salida real en un servidor Linux sin DNS (en Windows las unidades aparecen como `C:`, `D:`):

```text
Diagnóstico de vm  Linux 6.18.44-fc-v139
19/10/2026, 6:39:58 p. m.

Sistema
   OK   Sistema operativo              #1 SMP PREEMPT_DYNAMIC @0 (6.18.44-fc-v139, x64)
   OK   Tiempo encendido               31 min

Recursos
   OK   Procesador                     2 % de uso, 2 núcleos lógicos (Intel(R) Xeon(R) Processor @ 2.10GHz)
   OK   Memoria RAM                    10 % en uso (800 MB de 7.8 GB)

Almacenamiento
 AVISO  Unidad /                       11 % libre (28.4 GB de 252 GB)
                                       -> Liberar espacio: Configuración > Sistema > Almacenamiento > Archivos temporales. Mantener al menos 15 % libre.

Red
   OK   IP en eth0                     192.0.2.2 (MAC 02:fc:00:00:00:01)

Conectividad
 FALLA  Resolución DNS                 No se pudo resolver www.microsoft.com (ENOTFOUND)
                                       -> Ejecutar ipconfig /flushdns y revisar los servidores DNS del adaptador.
   OK   Internet por IP (1.1.1.1:443)  10 ms
 FALLA  HTTPS (microsoft.com:443)      Sin respuesta (ENOTFOUND)
                                       -> Si la IP responde pero el dominio no, el problema es DNS. Si ninguno responde, revisar proxy, firewall o la red.

Resumen: 6 correctos, 1 avisos, 2 fallas
```

El mismo diagnóstico como informe HTML:

![Informe HTML](docs/captura-informe.png)

## Qué revisa

| Grupo | Revisión | Aviso | Falla |
| --- | --- | --- | --- |
| Sistema | Versión del SO y tiempo encendido | 7 días o más sin reiniciar | |
| Recursos | Uso de CPU (muestreo de 500 ms) | 85 % o más | |
| Recursos | Memoria RAM en uso | 85 % o más | 95 % o más |
| Almacenamiento | Espacio libre por unidad (C:, D:...) | Menos de 15 % | Menos de 5 % |
| Red | Adaptadores con IPv4 | | Sin IP o IP 169.254.x.x (sin DHCP) |
| Conectividad | Resolución DNS | | No resuelve |
| Conectividad | Conexión TCP a internet por IP y por dominio | Latencia > 250 ms | Sin respuesta |

Comparar la conexión **por IP** con la conexión **por dominio** separa en un solo paso un problema de DNS de un problema de red, que es la primera pregunta de la guía de diagnóstico de red.

## Uso

Es una herramienta de **terminal**: no abre una ventana propia, escribe el resultado en la consola. Para verlo como página web, usa el informe HTML.

**La forma más rápida** (Windows, en PowerShell, dentro de esta carpeta):

```powershell
npm.cmd install
npm.cmd run informe
```

Hace el diagnóstico, muestra el resumen en la terminal y abre el informe en el navegador.

Otras opciones (requiere Node.js 20 o superior y haber ejecutado `npm run build`):

```bash
node dist/cli.js                      # diagnóstico completo en la terminal
node dist/cli.js --abrir              # además abre el informe en el navegador
node dist/cli.js --html informe.html  # guarda el informe sin abrirlo
node dist/cli.js --solo red,conectividad
node dist/cli.js --json > equipo.json # para inventarios o automatización
node dist/cli.js --sin-red            # solo revisiones locales
```

Para usarlo como comando global en el equipo: `npm link` y después `diagnostica` desde cualquier carpeta.

**Código de salida:** `0` sin fallas, `1` si alguna revisión falló, `2` si hubo un error en las opciones. Permite usarlo desde scripts o tareas programadas.

## Diseño

```
src/
├── cli.ts             # argumentos (node:util parseArgs), salida y código de salida
├── open.ts            # abre el informe con el navegador predeterminado
├── runner.ts          # ejecuta revisiones en paralelo con tiempo límite
├── evaluate.ts        # reglas puras: números + umbrales -> ok / aviso / falla
├── types.ts           # contrato Check / CheckResult y umbrales por defecto
├── checks/            # una revisión por archivo: sistema, disco, red
└── report/            # salida para consola y para HTML
tests/                 # Vitest: reglas, ejecutor, selección de grupos, HTML
```

- **Sin dependencias en producción.** Solo módulos nativos de Node: `os`, `fs`, `dns`, `net`, `util`.
- **Cada revisión implementa la misma interfaz `Check`**, así agregar una nueva (por ejemplo, estado de la batería o servicios de Windows) no toca el resto del código.
- **Las reglas de evaluación están separadas de la lectura del sistema**, por eso se pueden probar sin depender del equipo donde corren las pruebas.
- **Tolerante a fallos:** las revisiones corren en paralelo con un límite de 8 segundos cada una. Si una falla o se cuelga, se reporta como falla y el resto del informe sale igual.
- **Latencia por TCP en vez de ping:** ICMP suele estar bloqueado en redes corporativas y en algunos sistemas requiere permisos; abrir una conexión al puerto 443 mide lo que de verdad le importa al usuario.
- El informe HTML es un único archivo sin scripts ni recursos externos, con los datos escapados, y se puede imprimir.

## Desarrollo

```bash
npm test          # pruebas unitarias
npm run typecheck
```

El repositorio incluye integración continua con GitHub Actions que corre las pruebas en Windows y en Linux.

## Ideas para seguir

- Revisar servicios críticos de Windows (Spooler, Windows Update, cliente DNS).
- Estado de batería en portátiles.
- Enviar el informe directamente a la API de la mesa de ayuda.

---

Proyecto de portafolio de Orlando Castillo.
