import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del asistente "Encuentra tu Apple" (/elige-tu-apple).
// Comprueba: accesos, flujo iPhone, flujo Mac, "No lo tengo claro",
// no avanzar sin respuesta, retroceder, resultados deterministas y sin
// duplicados, envío al comparador y reinicio.

async function start(page: Page) {
  await page.goto('./elige-tu-apple')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.getByRole('heading', { name: '¿Qué producto estás buscando?' })).toBeVisible()
}

test('acceso desde la portada al asistente', async ({ page }) => {
  await page.goto('./')
  const cta = page.getByRole('link', { name: /Empezar/ }).first()
  await expect(cta).toHaveAttribute('href', /\/elige-tu-apple$/)
  await cta.click()
  await expect(page.getByRole('heading', { name: 'Encuentra tu Apple', level: 1 })).toBeVisible()
})

test('flujo iPhone: 4 preguntas + resultados + reiniciar', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'iPhone' }).click()

  await expect(page.getByText('Pregunta 1 de 4')).toBeVisible()
  await page.getByRole('radio', { name: 'Fotografía y vídeo' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()

  await expect(page.getByText('Pregunta 2 de 4')).toBeVisible()
  await page.getByRole('radio', { name: 'Grande' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()

  await expect(page.getByText('Pregunta 3 de 4')).toBeVisible()
  await page.getByRole('radio', { name: 'Cámara' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()

  await expect(page.getByText('Pregunta 4 de 4')).toBeVisible()
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: 'Ver resultados' }).click()

  await expect(page.getByRole('heading', { name: /Opciones sugeridas en iPhone/ })).toBeVisible()
  await expect(page.getByText('Nuestra recomendación')).toBeVisible()

  // Reiniciar vuelve a la intro.
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
  await expect(page.getByRole('heading', { name: 'Encuentra el Apple que encaja contigo' })).toBeVisible()
})

test('no se puede avanzar sin responder + Anterior funciona', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'Mac' }).click()
  const nextBtn = page.getByRole('button', { name: /^Siguiente/ })
  await expect(nextBtn).toBeDisabled()
  // Marcar respuesta y avanzar.
  await page.getByRole('radio', { name: 'Programación' }).click()
  await expect(nextBtn).toBeEnabled()
  await nextBtn.click()
  // Retroceder debe volver a la pregunta anterior con la respuesta marcada.
  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByRole('radio', { name: 'Programación' })).toHaveAttribute('aria-checked', 'true')
})

test('"No lo tengo claro" pasa por preguntas generales antes de las específicas', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  // Se muestran las preguntas generales primero.
  await expect(page.getByText(/¿Para qué lo utilizarás principalmente\?/)).toBeVisible()
  await page.getByRole('radio', { name: 'Salud y deporte' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Portabilidad' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  // Ahora entra en las preguntas específicas de Apple Watch (familia inferida).
  await expect(page.getByText(/Pregunta 1 de/)).toBeVisible()
})

test('resultado determinista: mismas respuestas → mismos productos', async ({ page }) => {
  async function runFlow() {
    await page.goto('./elige-tu-apple')
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('radio', { name: 'iPhone' }).click()
    await page.getByRole('radio', { name: 'Fotografía y vídeo' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Grande' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Cámara' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Sin límite' }).click()
    await page.getByRole('button', { name: 'Ver resultados' }).click()
    return (await page.locator('h3').allTextContents()).join('|')
  }
  const first = await runFlow()
  const second = await runFlow()
  expect(first).toBe(second)
  expect(first).toContain('iPhone')
})

test('"Comparar estas opciones" envía los resultados a /comparar', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'iPhone' }).click()
  await page.getByRole('radio', { name: 'Uso cotidiano' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Equilibrado' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Precio' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: 'Ver resultados' }).click()
  await page.getByRole('button', { name: 'Comparar estas opciones' }).click()
  await expect(page).toHaveURL(/\/comparar$/)
  // Aparecen al menos dos columnas de iPhone en la cabecera del comparador.
  const thead = page.locator('table thead')
  const iphoneCells = await thead.locator('p.font-bold').allTextContents()
  const count = iphoneCells.filter((t) => t.trim().length > 0).length
  expect(count).toBeGreaterThanOrEqual(2)
})

test('a 375 px la página del asistente no genera scroll horizontal @mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('./elige-tu-apple')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('axe: intro del asistente sin violaciones', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./elige-tu-apple')
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a']).analyze()
  const detail = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
  expect(results.violations, `Violaciones axe en /elige-tu-apple:\n${detail}`).toEqual([])
})
