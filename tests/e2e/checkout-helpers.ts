import { expect, type Page } from '@playwright/test'

// ============================================================================
// Cómo se llega legítimamente a cada paso del checkout.
//
// POR QUÉ EXISTE ESTE MÓDULO
//
// Los tres pasos están GUARDADOS, y no de la misma forma:
//
// - el paso 3 exige un pedido demostrativo creado en esta sesión y, si no lo
//   hay, `CheckoutPage` hace `<Navigate replace />` a `/carrito` o `/iphone`;
// - los pasos 1 y 2 sin carrito no redirigen: pintan el estado vacío, que es
//   otra pantalla;
// - el paso 2 exige además que el paso 1 sea válido, y si no lo es vuelve al 1.
//
// Abrir esas rutas «a pelo» no lleva a la pantalla que se cree: lleva a un
// redirect o a un estado vacío. Cuando una prueba mide algo de la pantalla
// —estilos, composición— eso es una carrera: puede medir el nodo correcto o
// puede medirlo mientras la guarda lo está desmontando. Ver la nota de sesión
// del 2026-08-22.
//
// `sembrarCarrito` sale de `checkout.spec.ts` y `checkout-flow.spec.ts`, donde
// vivía duplicada literalmente. `llegarAlPaso` recorre el flujo real por la
// interfaz —la misma secuencia que ya usaba `checkout.spec.ts`— en vez de
// fabricar un `DemoOrder` en `sessionStorage`: ese objeto tiene once campos y
// una lista de líneas, y un molde escrito a mano se queda viejo sin que nadie
// se entere.
// ============================================================================

/**
 * Deja el carrito con una línea de iPhone usando la API que la aplicación ya
 * expone (`localStorage`). Más estable que perseguir botones de la ficha, que
 * dependen del scroll y de las cantidades.
 */
export async function sembrarCarrito(page: Page) {
  await page.addInitScript(() => {
    const line = {
      id: 'iphone/17-pro/plata/256GB',
      modelSlug: '17-pro',
      family: 'iphone',
      name: 'iPhone 17 Pro',
      color: 'Plata',
      capacity: '256GB',
      price: 1229,
      previousPrice: null,
      qty: 1,
      insured: false,
    }
    localStorage.setItem('banana:cart', JSON.stringify([line]))
  })
}

/**
 * Deja la pantalla en el paso indicado, con sus precondiciones cumplidas, y
 * comprueba que se llegó antes de devolver el control.
 *
 * Hay que llamarla ANTES del primer `goto`: siembra el carrito con un
 * `addInitScript`.
 */
export async function llegarAlPaso(page: Page, paso: 1 | 2 | 3) {
  await sembrarCarrito(page)
  await page.goto('./checkout/1')
  await expect(page, 'con carrito, el paso 1 se abre directo').toHaveURL(/\/checkout\/1$/)
  if (paso === 1) return

  await rellenarPaso1(page)
  await avanzar(page)
  await expect(page, 'el paso 1 válido abre el paso 2').toHaveURL(/\/checkout\/2$/)
  if (paso === 2) return

  await avanzar(page)
  await expect(page, 'confirmar crea el pedido y abre el paso 3').toHaveURL(/\/checkout\/3$/)
  // El número de pedido sólo se pinta cuando `confirmedOrder` existe, así que
  // verlo demuestra que la precondición del paso 3 se cumple de verdad y que
  // la guarda no va a redirigir. Se acepta el formato nuevo y el antiguo, como
  // en `checkout.spec.ts`.
  await expect(
    page.getByText(/BC-([0-9A-F]{12}|\d{6})/),
    'el paso 3 enseña el número del pedido demostrativo',
  ).toBeVisible()
}

// ----------------------------------------------------------------------------
// POR QUÉ EL RECORRIDO DEJÓ DE USAR RÓTULOS
//
// `llegarAlPaso` rellenaba con `getByLabel('Nombre y apellidos')` y pulsaba
// «Continuar». Eso ata el recorrido al castellano, y AUD-002 necesita hacerlo
// en inglés, alemán, francés e italiano. Duplicar el flujo en un helper
// paralelo habría dejado dos caminos al mismo sitio que divergen en cuanto uno
// de los dos cambie, así que se cambia el de dentro y todos los consumidores
// —las suites españolas incluidas— siguen usando la misma función.
//
// Los campos se buscan por `autocomplete`, que no es un gancho puesto para la
// prueba: es el atributo que hace que un gestor de contraseñas o el autorrelleno
// del navegador funcionen. Si desapareciera, el formulario tendría un problema
// de verdad y esta prueba debe enterarse.
// ----------------------------------------------------------------------------

/** Los datos mínimos del paso 1, sin depender de cómo se rotulen los campos. */
export async function rellenarPaso1(page: Page) {
  await page.locator('input[autocomplete="name"]').fill('Elena R.')
  await page.locator('input[autocomplete="email"]').fill('elena@example.test')
  await page.locator('input[autocomplete="street-address"]').fill('Calle Mayor 1')
}

/**
 * Pulsa el control que lleva al paso siguiente.
 *
 * El rótulo cambia con el idioma y con el paso —«Continuar», «Confirmar
 * pedido»—, así que se localiza por estructura: es el único botón de la barra
 * inferior de navegación, que tiene marca propia. El detalle estructural vive
 * aquí y no se repite por la suite.
 */
export async function avanzar(page: Page) {
  await page.locator('[data-checkout-nav] button').click()
}
