import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 5174;
const BASE = `http://localhost:${PORT}/pagina-banana`;

async function waitForServer(url, maxMs = 12_000) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await sleep(300);
  }
  throw new Error(`Server not ready after ${maxMs}ms`);
}

const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];

const vite = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
  cwd: '/Users/oskrrr09/Proyectos/pagina-banana',
  stdio: 'ignore',
  detached: false,
});

try {
  await waitForServer(BASE + '/');
  const browser = await chromium.launch({ headless: true });
  // iPhone 14 Pro
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  await page.goto(BASE + '/');
  await page.waitForSelector('#root > *', { timeout: 15_000 });

  for (const route of routes) {
    const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
    const url = BASE + route;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('header, main, #root > *', { timeout: 8000 }).catch(() => {});
    // Scroll a la mitad para capturar más contenido
    const file = `/tmp/banana-mobile-${name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${route} → /tmp/banana-mobile-${name}.png`);
  }

  await browser.close();
} finally {
  vite.kill();
}
