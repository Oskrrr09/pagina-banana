import { expect, test } from '@playwright/test'

// ============================================================================
// Una conversación que todavía no tenemos NO es una conversación abierta.
//
// `ConversationColumn` recibía `conversation = null` durante el cambio de
// bandeja y lo resolvía con `conversation?.estado ?? 'abierta'` y
// `conversation?.agente_id ?? null`. Eso no era un respaldo: era inventarse el
// dato, y encima en la dirección que ofrece acciones. Sobre una conversación
// recién cerrada, el panel decía «Sin asignar», volvía a ofrecer «Cerrar» y
// dejaba la caja de respuesta a la vista.
//
// El flujo real —cerrar, cambiar de bandeja, reabrir— se prueba con Supabase
// en `tests/integration/panel-agentes-cierre.spec.ts`. Aquí sólo se fija qué
// se pinta sin datos, que es barato de comprobar en aislamiento.
// ============================================================================

const FIXTURE = './columna-fixture.html'

test('sin los datos de la conversación no se inventa que está abierta', async ({ page }) => {
  await page.goto(`${FIXTURE}?caso=sin-datos`)

  // Lo que NO puede hacer va primero: si vuelve el respaldo inventado, el
  // fallo debe nombrar el defecto —una acción de estado ofrecida sobre una
  // conversación que no conocemos— y no un texto que falta.
  await expect(
    page.getByRole('button', { name: 'Cerrar', exact: true }),
    'no puede ofrecer cerrar una conversación cuyo estado no conoce',
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reabrir', exact: true }), 'ni reabrir').toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Asignarme' }), 'ni asignarse').toHaveCount(0)
  await expect(page.getByText('Sin asignar'), 'ni afirmar una asignación que no conoce').toHaveCount(0)
  await expect(
    page.getByRole('textbox', { name: 'Responder al visitante' }),
    'ni dejar escribir en una conversación de estado desconocido',
  ).toHaveCount(0)

  await expect(page.getByText('Actualizando conversación…'), 'y debe declararse en transición').toBeVisible()
})

test('con los datos reales sí se pinta el estado que tienen', async ({ page }) => {
  // El contraste importa: el estado neutro no puede ser la respuesta a todo.
  // Con una conversación cerrada de verdad, la columna la enseña archivada.
  await page.goto(FIXTURE)

  await expect(page.getByText('Actualizando conversación…')).toHaveCount(0)
  await expect(page.locator('main header')).toContainText('Archivada')
  await expect(page.getByText(/Conversación archivada/)).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Responder al visitante' })).toHaveCount(0)
})
