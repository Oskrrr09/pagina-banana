import { expect, test } from '@playwright/test'

test('no ofrece borrar ni abre un diálogo de eliminación', async ({ page }) => {
  await page.goto('?rol=supervisor&owner=mine')
  await expect(page.getByRole('heading', { name: 'Conversación de prueba' })).toBeVisible()
  await expect(page.getByRole('button', { name: /eliminar|borrar/i })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: /eliminar|borrar/i })).toHaveCount(0)
  await expect(page.getByText(/eliminar conversación|borrar conversación/i)).toHaveCount(0)
})

test('un agente normal no gestiona una conversación ajena', async ({ page }) => {
  await page.goto('?rol=agente&owner=other')
  await expect(page.getByRole('button', { name: 'Asignada a otro agente' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Cerrar' })).toBeDisabled()
})

test('un supervisor libera una asignación ajena con una etiqueta explícita', async ({ page }) => {
  await page.goto('?rol=supervisor&owner=other')
  const release = page.getByRole('button', { name: 'Liberar asignación' })
  await expect(release).toBeEnabled()
  await release.click()
  await expect(page.getByTestId('state')).toContainText('libre')
  await expect(page.getByTestId('last-operation')).toHaveText('release')
  await expect(page.getByRole('button', { name: 'Cerrar' })).toBeEnabled()
})

test('un error de cierre se anuncia, conserva el diálogo y desbloquea los botones', async ({ page }) => {
  await page.goto('?rol=agente&owner=mine&failure=state')
  await page.getByRole('button', { name: 'Cerrar' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cerrar conversación' })
  await expect(dialog).toBeVisible()
  const confirm = dialog.getByRole('button', { name: 'Cerrar y pedir valoración' })
  await confirm.click()
  await expect(dialog.getByRole('alert')).toHaveText('Servidor rechazó state')
  await expect(dialog).toBeVisible()
  await expect(confirm).toBeEnabled()

  await confirm.click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByTestId('last-operation')).toHaveText('close')
})

test('una excepción de asignación también deja el control utilizable', async ({ page }) => {
  await page.goto('?rol=agente&owner=free&failure=assign&throw=1')
  const assign = page.getByRole('button', { name: 'Asignarme' })
  await assign.click()
  await expect(page.getByRole('alert')).toHaveText('Excepción al assign')
  await expect(assign).toBeEnabled()
  await assign.click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByTestId('last-operation')).toHaveText('assign')
})

test('un error de envío conserva el texto y el siguiente éxito limpia el aviso', async ({ page }) => {
  await page.goto('?rol=agente&owner=mine&failure=send')
  const input = page.getByRole('textbox', { name: 'Responder al visitante' })
  const send = page.getByRole('button', { name: 'Enviar' })
  await input.fill('Mensaje que no debe perderse')
  await send.click()
  await expect(page.getByRole('alert')).toHaveText('Servidor rechazó send')
  await expect(input).toHaveValue('Mensaje que no debe perderse')
  await expect(send).toBeEnabled()

  await send.click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(input).toHaveValue('')
  await expect(page.getByTestId('sent-count')).toHaveText('1')
})
