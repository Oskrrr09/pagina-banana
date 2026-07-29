import { test, expect } from '@playwright/test'

// Estas dos suites recorren la interfaz real: no se preseleccionan favoritos
// ni items del comparador en localStorage. Playwright crea un contexto de
// navegador nuevo por cada prueba, así que el `localStorage` empieza vacío
// sin necesidad de `addInitScript` (que se dispararía en cada navegación y
// borraría también el estado creado por la propia prueba).

test('favoritos: añadir desde /iphone, verlo en /favoritos y quitarlo', async ({ page }) => {
  await page.goto('./iphone')

  // Estado inicial: el corazón del catálogo dice "Añadir" y no está presionado.
  const add = page.getByRole('button', { name: 'Añadir iPhone 17 Pro a favoritos' })
  await expect(add).toBeVisible()
  await expect(add).toHaveAttribute('aria-pressed', 'false')

  await add.click()

  // Tras pulsar, el mismo botón cambia su nombre accesible y su estado.
  const remove = page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' })
  await expect(remove).toBeVisible()
  await expect(remove).toHaveAttribute('aria-pressed', 'true')

  // La página de favoritos muestra la tarjeta del modelo (heading H3).
  await page.goto('./favoritos')
  const favHeading = page.getByRole('heading', { name: 'iPhone 17 Pro', level: 3 })
  await expect(favHeading).toBeVisible()

  // Quitar desde /favoritos (el mismo ProductCard aparece aquí también).
  await page.getByRole('button', { name: 'Quitar iPhone 17 Pro de favoritos' }).click()

  // Estado vacío explícito de /favoritos.
  await expect(page.getByText('Aún no has guardado ningún producto.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'iPhone 17 Pro', level: 3 })).toHaveCount(0)
})

test('comparador: añadir dos productos desde /iphone/17-pro y vaciarlo', async ({ page }) => {
  await page.goto('./iphone/17-pro')

  // El modelo iPhone 17 Pro presenta un ModelPage con una tarjeta por color;
  // cada tarjeta expone un checkbox "Añadir a comparar". Verificamos que
  // existen varias antes de marcar dos.
  const compareChecks = page.getByRole('checkbox', { name: /Añadir a comparar/ })
  const total = await compareChecks.count()
  expect(total).toBeGreaterThanOrEqual(2)

  await compareChecks.nth(0).check()
  await expect(compareChecks.nth(0)).toBeChecked()

  await compareChecks.nth(1).check()
  await expect(compareChecks.nth(1)).toBeChecked()

  await page.goto('./comparar')

  // Aparecen exactamente dos columnas con "iPhone 17 Pro" en la cabecera
  // de la tabla (el resumen superior también menciona el modelo, así que
  // acotamos la búsqueda al <thead>).
  const cards = page.getByRole('group', { name: /^Modelos comparados/ })
  await expect(cards.getByText('iPhone 17 Pro', { exact: true })).toHaveCount(2)

  // El botón "Quitar iPhone 17 Pro de la comparación" existe una vez por
  // columna. Se elimina el primero; queda uno.
  const removeLabel = /Quitar iPhone 17 Pro de la comparación/
  const remove = page.getByRole('button', { name: removeLabel })
  await expect(remove).toHaveCount(2)
  await remove.first().click()
  await expect(page.getByRole('button', { name: removeLabel })).toHaveCount(1)

  // Se elimina la última; la tabla desaparece y vuelve el selector de familia.
  await page.getByRole('button', { name: removeLabel }).click()
  await expect(page.getByText('Tipo de producto:')).toBeVisible()
  await expect(page.getByRole('button', { name: removeLabel })).toHaveCount(0)
})
