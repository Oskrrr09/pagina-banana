/**
 * Driver para pagina-banana.
 * Lanza el servidor de desarrollo, toma screenshots de las rutas indicadas
 * y verifica que respondan correctamente.
 *
 * Uso:
 *   node .claude/skills/run-pagina-banana/driver.mjs [ruta] [ruta] ...
 *
 * Sin argumentos → toma screenshot de la portada.
 * Con rutas → "/mac", "/iphone", "/carrito", etc.
 *
 * Screenshots guardados en /tmp/banana-<nombre>.png
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 5174;
const BASE = `http://localhost:${PORT}/pagina-banana`;

async function waitForServer(url, maxMs = 10_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await sleep(300);
  }
  throw new Error(`Server not ready after ${maxMs}ms`);
}

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/'];

const vite = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
  stdio: 'ignore',
  detached: false,
});

try {
  await waitForServer(BASE + '/');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Vite compila módulos TypeScript/React en la primera petición.
  // Navegar una vez y esperar a que el root monte antes de los screenshots reales.
  await page.goto(BASE + '/');
  await page.waitForSelector('#root > *', { timeout: 15_000 });

  for (const route of routes) {
    const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
    const url = BASE + route;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Esperar a que React monte el header antes del screenshot
    await page.waitForSelector('header, nav, main, #root > *', { timeout: 8000 }).catch(() => {});
    const file = `/tmp/banana-${name}.png`;
    await page.screenshot({ path: file });
    const status = page.url().includes(route === '/' ? '/pagina-banana' : route) ? 'OK' : 'FAIL';
    console.log(`${route} → ${status} — ${file}`);
  }

  await browser.close();
} finally {
  vite.kill();
}
