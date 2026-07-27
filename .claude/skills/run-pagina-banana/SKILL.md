---
name: run-pagina-banana
description: >-
  Arranca, conduce y hace screenshots de pagina-banana. Úsalo para ejecutar
  la app, verificar cambios visuales, tomar capturas de rutas concretas o
  comprobar que el build funciona antes de un PR.
---

# run-pagina-banana

SPA de Vite + React + TypeScript servida bajo `/pagina-banana/`. Se conduce
con el driver en `.claude/skills/run-pagina-banana/driver.mjs`, que arranca
el servidor de desarrollo, toma screenshots con Playwright (Chromium headless)
y cierra limpiamente. Los paths en este documento son relativos a la raíz del
proyecto.

## Prerequisitos

- Node 20+ (hay Node 26 en esta máquina — funciona).
- `playwright` instalado como devDependency (`npm install`).
- Chromium descargado para Playwright (`npx playwright install chromium`).

Verificar:

```bash
node -e "require('playwright'); console.log('ok')"
```

## Build

```bash
npm run build
```

Produce `dist/`. Correcto si termina con `✓ built in …ms`.

## Run — camino del agente

El driver arranca el dev server en el puerto 5174, espera a que responda y
toma un screenshot por cada ruta pasada como argumento. Sin argumentos,
captura la portada.

```bash
# Portada
node .claude/skills/run-pagina-banana/driver.mjs

# Rutas concretas
node .claude/skills/run-pagina-banana/driver.mjs / /mac /iphone /carrito /buscar

# Ruta de variante
node .claude/skills/run-pagina-banana/driver.mjs /mac/macbook-air-m4/gris-espacio-256gb
```

Screenshots en `/tmp/banana-<nombre>.png`. La salida es `<ruta> → OK — <path>`.

## Run — camino humano

```bash
npm run dev
```

Abre `http://localhost:5173/pagina-banana/` en el navegador. `Ctrl-C` para parar.

## Test

No hay suite de tests configurada. La comprobación es `npm run build` (TypeScript
+ Vite) y el driver.

## Gotchas

- **Puerto en uso.** Si 5174 ya está ocupado, el driver falla en `waitForServer`.
  Matar el proceso previo con `pkill -f "vite --port 5174"`.
- **SPA — todas las rutas devuelven 200.** `curl` a `/mac` devuelve el `index.html`
  de React, no 404. La validación real es que `page.url()` contenga la ruta
  después de la carga client-side.
- **Tema oscuro.** La página sigue `prefers-color-scheme` del SO. Playwright en
  headless usa tema claro por defecto; para forzar oscuro:
  ```js
  await ctx.newPage(); // reemplazar por:
  const page = await ctx.newPage();
  await page.emulateMedia({ colorScheme: 'dark' });
  ```
- **Playwright no instalado.** Si `npm install` no trajo playwright, instalarlo
  manualmente: `npm install --save-dev playwright && npx playwright install chromium`.
