import { expect, test, type Page } from '@playwright/test'

// ============================================================================
// Las preferencias de cuenta no sobreviven al cierre de sesión.
//
// La tienda favorita, los seguimientos de disponibilidad y sus notificaciones
// se guardaban en claves generales de `localStorage`, sin separar por usuario.
// Al cerrar sesión se quedaban ahí: la siguiente persona que usara el mismo
// navegador seguía viendo la tienda habitual, los seguimientos y los avisos de
// quien acababa de salir.
//
// Se prueba contra los proveedores reales, en un navegador real y con el
// `localStorage` real; ver `fixture.tsx` para por qué no se monta también el
// proveedor de sesión.
// ============================================================================

const CLAVES_DE_CUENTA = [
  'banana:favorite-store',
  'banana:favorite-store-prompt',
  'banana:favorite-alerts',
  'banana:favorite-notifications',
] as const

/**
 * Claves que NO son de la cuenta y deben sobrevivir al cierre de sesión.
 *
 * EL CHAT ANÓNIMO SALIÓ DE ESTA LISTA — CAMBIO DE PRODUCTO
 *
 * Aquí estaban también `bananito:guest` y `bananito:conversation_id`, porque la
 * regla de entonces era que un visitante era «un navegador» y no se le volvían
 * a pedir nombre y correo. Esa regla cambió: la persistencia duradera del chat
 * exige ahora una cuenta, y sin ella cada inicialización empieza una identidad
 * nueva.
 *
 * Lo que esta prueba protege sigue siendo válido y no se toca: que cerrar
 * sesión NO haga un borrado indiscriminado. El carrito y el idioma no son de la
 * cuenta y tienen que seguir ahí.
 *
 * La garantía nueva —que el siguiente visitante no herede la identidad del
 * chat— es FUNCIONAL y no se puede comprobar en este fixture, que monta los
 * proveedores de preferencias sin el módulo del chat. Vive donde puede
 * demostrarse de verdad, contra Supabase real:
 * `tests/integration/chat-anonimo-efimero.spec.ts` y `chat-identidad-cuentas.spec.ts`.
 */
const CLAVES_AJENAS = {
  'banana:cart': '[{"id":"iphone/17-pro/plata/256GB","qty":1}]',
  'banana:idioma': 'es',
}

async function claves(page: Page): Promise<Record<string, string | null>> {
  return page.evaluate(
    (lista) => Object.fromEntries(lista.map((k) => [k, localStorage.getItem(k)])),
    [...CLAVES_DE_CUENTA, ...Object.keys(CLAVES_AJENAS)],
  )
}

/** Deja el escenario de una cuenta que eligió tienda y siguió un producto. */
async function cuentaConPreferencias(page: Page) {
  await page.addInitScript((ajenas) => {
    for (const [clave, valor] of Object.entries(ajenas)) localStorage.setItem(clave, valor as string)
  }, CLAVES_AJENAS)
  await page.goto('')

  await page.getByRole('button', { name: 'Elegir tienda favorita' }).click()
  await page.getByRole('button', { name: 'Activar aviso' }).click()
  await page.getByRole('button', { name: 'Simular llegada' }).click()

  await expect(page.getByTestId('favorite-slug')).toHaveText('triana')
  await expect(page.getByTestId('alerts-count')).toHaveText('1')
  await expect(page.getByTestId('notifications-count')).toHaveText('1')
  await expect(page.getByTestId('unread-count')).toHaveText('1')
}

test('las cuatro claves quedan guardadas mientras la sesión sigue abierta', async ({ page }) => {
  await cuentaConPreferencias(page)

  const guardadas = await claves(page)
  for (const clave of CLAVES_DE_CUENTA) {
    expect(guardadas[clave], `${clave} debe existir con la sesión abierta`).not.toBeNull()
  }
  expect(guardadas['banana:favorite-store']).toBe('triana')
  expect(guardadas['banana:favorite-store-prompt']).toBe('dismissed')
})

test('al cerrar sesión desaparecen las cuatro claves y los proveedores se vacían', async ({ page }) => {
  await cuentaConPreferencias(page)

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  // Sin recargar: el estado en memoria de los proveedores tiene que haberse
  // reiniciado solo. Es la mitad del fallo que no se arregla borrando claves.
  await expect(page.getByTestId('favorite-slug')).toHaveText('ninguna')
  await expect(page.getByTestId('prompt-dismissed')).toHaveText('no')
  await expect(page.getByTestId('alerts-count')).toHaveText('0')
  await expect(page.getByTestId('notifications-count')).toHaveText('0')
  await expect(page.getByTestId('unread-count')).toHaveText('0')

  const despues = await claves(page)
  for (const clave of CLAVES_DE_CUENTA) {
    expect(despues[clave], `${clave} debe haberse borrado`).toBeNull()
  }
})

test('el carrito y el idioma sobreviven al cierre de sesión', async ({ page }) => {
  await cuentaConPreferencias(page)

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByTestId('favorite-slug')).toHaveText('ninguna')

  const despues = await claves(page)
  for (const [clave, valor] of Object.entries(CLAVES_AJENAS)) {
    expect(despues[clave], `${clave} no es de la cuenta y no debe tocarse`).toBe(valor)
  }
})

test('quien entre después en el mismo navegador no hereda nada', async ({ page }) => {
  await cuentaConPreferencias(page)
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page.getByTestId('favorite-slug')).toHaveText('ninguna')

  // La siguiente cuenta abre la web de cero: los proveedores vuelven a leer
  // `localStorage` al montarse, así que aquí se ve lo que heredaría de verdad.
  await page.reload()

  await expect(page.getByTestId('favorite-slug')).toHaveText('ninguna')
  await expect(page.getByTestId('prompt-dismissed'), 'el bottom sheet debe volver a ofrecerse').toHaveText('no')
  await expect(page.getByTestId('alerts-count')).toHaveText('0')
  await expect(page.getByTestId('notifications-count')).toHaveText('0')
  await expect(page.getByTestId('unread-count')).toHaveText('0')
})

test('el cierre de sesión no se bloquea si localStorage rechaza los borrados', async ({ page }) => {
  await cuentaConPreferencias(page)

  await page.getByRole('button', { name: 'Romper almacenamiento' }).click()
  await expect(page.locator('body')).toHaveAttribute('data-storage', 'roto')

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()

  // Lo que importa: el cierre llega hasta el final...
  await expect(page.locator('body')).toHaveAttribute('data-cierre', 'completado')
  // ...y la interfaz deja de enseñar los datos de la cuenta anterior, aunque
  // las claves no se hayan podido borrar del disco.
  await expect(page.getByTestId('favorite-slug')).toHaveText('ninguna')
  await expect(page.getByTestId('alerts-count')).toHaveText('0')
  await expect(page.getByTestId('notifications-count')).toHaveText('0')
  await expect(page.getByTestId('unread-count')).toHaveText('0')
})

test('con la sesión abierta las preferencias siguen funcionando igual', async ({ page }) => {
  // La corrección no puede haberse llevado por delante el uso normal.
  await page.goto('')

  await page.getByRole('button', { name: 'Elegir tienda favorita' }).click()
  await expect(page.getByTestId('favorite-slug')).toHaveText('triana')
  await expect(page.getByTestId('prompt-dismissed'), 'elegir tienda descarta el aviso inicial').toHaveText('si')

  await page.getByRole('button', { name: 'Activar aviso' }).click()
  await page.getByRole('button', { name: 'Simular llegada' }).click()
  await expect(page.getByTestId('unread-count')).toHaveText('1')

  // Y sobreviven a una recarga, que es para lo que se guardan.
  await page.reload()
  await expect(page.getByTestId('favorite-slug')).toHaveText('triana')
  await expect(page.getByTestId('alerts-count')).toHaveText('1')
  await expect(page.getByTestId('unread-count')).toHaveText('1')
})
