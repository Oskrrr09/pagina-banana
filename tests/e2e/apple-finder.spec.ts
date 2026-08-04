import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Suite del asistente "Encuentra tu Apple" (v2 — recomendaciones con filtros
// duros, preferencias blandas y roles nuevos: Mejor encaje / Mejor relación
// calidad-precio / Otra opción que también encaja).

async function start(page: Page) {
  await page.goto('./elige-tu-apple')
  await page.getByRole('button', { name: 'Empezar' }).click()
  await expect(page.getByRole('heading', { name: '¿Qué producto estás buscando?' })).toBeVisible()
}

async function answerAndNext(page: Page, radio: string, nextText: RegExp = /^Siguiente/) {
  await page.getByRole('radio', { name: radio }).click()
  await page.getByRole('button', { name: nextText }).click()
}

async function runIphoneFlow(
  page: Page,
  opts: {
    use: string
    size: string
    priority: string
    budget: string
    flex: string
  },
) {
  await start(page)
  await page.getByRole('radio', { name: 'iPhone' }).click()
  await answerAndNext(page, opts.use)
  await answerAndNext(page, opts.size)
  await answerAndNext(page, opts.priority, /Continuar|Siguiente/)
  // budget
  await page.getByRole('radio', { name: opts.budget }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  // budgetFlex
  await page.getByRole('radio', { name: opts.flex }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  // summary
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  await expect(page.getByRole('heading', { name: /Opciones sugeridas en iPhone/ })).toBeVisible()
}

// ---------------------------- accesos y flujo básico ------------------------

test('acceso desde la portada al asistente', async ({ page }) => {
  await page.goto('./')
  const cta = page.getByRole('link', { name: /Empezar/ }).first()
  await expect(cta).toHaveAttribute('href', /\/elige-tu-apple$/)
  await cta.click()
  await expect(page.getByRole('heading', { name: 'Encuentra tu Apple', level: 1 })).toBeVisible()
})

test('flujo iPhone completo: preguntas → presupuesto → resumen editable → resultados', async ({ page }) => {
  await runIphoneFlow(page, {
    use: 'Fotografía y vídeo',
    size: 'Grande',
    priority: 'Cámara',
    budget: 'Sin límite',
    flex: 'Solo es una referencia',
  })
  // "Mejor encaje" siempre aparece.
  await expect(page.getByText('Mejor encaje')).toBeVisible()
  // Reiniciar vuelve a la intro.
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
  await expect(page.getByRole('heading', { name: 'Encuentra el Apple que encaja contigo' })).toBeVisible()
})

test('no se puede avanzar sin responder + Anterior conserva la respuesta', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'Mac' }).click()
  const nextBtn = page.getByRole('button', { name: /^Siguiente/ })
  await expect(nextBtn).toBeDisabled()
  await page.getByRole('radio', { name: 'Programación' }).click()
  await expect(nextBtn).toBeEnabled()
  await nextBtn.click()
  await page.getByRole('button', { name: 'Anterior' }).click()
  await expect(page.getByRole('radio', { name: 'Programación' })).toHaveAttribute('aria-checked', 'true')
})

// ---------------------------- "No lo tengo claro" -----------------------

// Helper: recorre las preguntas generales del flujo "No lo tengo claro".
// Incluye la nueva pregunta productRole (siempre) y workType (solo si el
// uso principal es "Trabajo").
async function answerGeneralFlow(
  page: Page,
  opts: {
    use: string
    productRole: string
    workType?: string
    priority: string
    portability: string
  },
) {
  await answerAndNext(page, opts.use)
  await answerAndNext(page, opts.productRole)
  if (opts.use === 'Trabajo' && opts.workType) {
    await answerAndNext(page, opts.workType)
  }
  await answerAndNext(page, opts.priority)
  await answerAndNext(page, opts.portability, /Continuar|Siguiente/)
}

test('"No lo tengo claro" muestra confirmación de familia con dos candidatas', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Salud y deporte',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  await expect(
    page.getByRole('heading', {
      name: /Por lo que nos cuentas, creemos que estas categorías pueden encajar/,
    }),
  ).toBeVisible()
  await expect(page.getByText('Recomendación principal')).toBeVisible()
  const primaryCard = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primaryCard.getByRole('heading', { name: 'Watch' })).toBeVisible()
})

test('desde la confirmación se puede "Ver todas las categorías" sin perder respuestas', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'Un equipo principal para realizar mis tareas.',
    workType: 'Ofimática, correo y videollamadas.',
    priority: 'Potencia',
    portability: 'Sí, lo llevaré siempre encima',
  })
  await page.getByRole('button', { name: 'Ver todas las categorías' }).click()
  await expect(page.getByRole('heading', { name: '¿Qué producto estás buscando?' })).toBeVisible()
})

// --------------------- ranking de familias (bug reportado) ---------------

async function readFamilyConfirmCards(page: Page): Promise<string[]> {
  // Devuelve los nombres de las familias en las tarjetas (por orden).
  await expect(
    page.getByRole('heading', {
      name: /Por lo que nos cuentas, creemos que estas categorías pueden encajar/,
    }),
  ).toBeVisible()
  return await page.locator('h3').allTextContents()
}

test('BUG: trabajo + primary + portabilidad → Mac primero, iPad segundo (NO AirPods/Watch)', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'Un equipo principal para realizar mis tareas.',
    workType: 'Ofimática, correo y videollamadas.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const names = await readFamilyConfirmCards(page)
  const joined = names.join('|')
  expect(joined).toContain('Mac')
  expect(joined).toContain('iPad')
  expect(joined).not.toContain('AirPods')
  expect(joined).not.toContain('Watch')
  // Recomendación principal = Mac.
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'Mac' })).toBeVisible()
})

test('trabajo + primary + desktop-apps → Mac como primera opción', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'Un equipo principal para realizar mis tareas.',
    workType: 'Programación o aplicaciones de escritorio.',
    priority: 'Potencia',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'Mac' })).toBeVisible()
  const names = (await page.locator('h3').allTextContents()).join('|')
  expect(names).not.toContain('AirPods')
  expect(names).not.toContain('Watch')
  expect(names).not.toContain('iPhone')
})

test('trabajo + mobile + mobile-tasks → iPad + iPhone (Mac queda fuera del top 2)', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'Un dispositivo móvil para llevar siempre conmigo.',
    workType: 'Gestiones rápidas mientras me desplazo.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const names = (await page.locator('h3').allTextContents()).join('|')
  expect(names).toContain('iPad')
  expect(names).toContain('iPhone')
  expect(names).not.toContain('AirPods')
  expect(names).not.toContain('Watch')
})

test('estudio + primary + portabilidad → iPad + Mac', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Estudio',
    productRole: 'Un equipo principal para realizar mis tareas.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const names = (await page.locator('h3').allTextContents()).join('|')
  expect(names).toContain('iPad')
  expect(names).toContain('Mac')
  expect(names).not.toContain('AirPods')
  expect(names).not.toContain('Watch')
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'iPad' })).toBeVisible()
})

test('foto + primary + cámara → iPhone primero, Mac o iPad segundo', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Fotografía y vídeo',
    productRole: 'Un equipo principal para realizar mis tareas.',
    priority: 'Cámara',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'iPhone' })).toBeVisible()
  const names = (await page.locator('h3').allTextContents()).join('|')
  expect(names).not.toContain('AirPods')
  expect(names).not.toContain('Watch')
})

test('audio + accessory → AirPods primero', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Escuchar música o podcasts',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'AirPods' })).toBeVisible()
})

test('salud + accessory → Apple Watch primero', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Salud y deporte',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'Watch' })).toBeVisible()
})

test('uso cotidiano + mobile → iPhone primero', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Uso cotidiano',
    productRole: 'Un dispositivo móvil para llevar siempre conmigo.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'iPhone' })).toBeVisible()
})

test('desempate NO alfabético: para trabajo AirPods no desplaza a Mac aunque empatasen', async ({ page }) => {
  // Con role=unknown y sin workType, con priority "Precio" y portabilidad
  // "Sí" — antes del fix: Mac(12) empataba con AirPods e iPhone en 4/12
  // y el desempate alfabético dejaba AirPods delante. Ahora Mac tiene
  // score claramente mayor y AirPods queda fuera del top 2.
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'No estoy seguro.',
    workType: 'Todavía no lo sé.',
    priority: 'Precio',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primary.getByRole('heading', { name: 'Mac' })).toBeVisible()
  const names = (await page.locator('h3').allTextContents()).join('|')
  // AirPods NO puede quedar por delante de iPad para trabajo aunque
  // alfabéticamente sea antes.
  expect(names).not.toContain('AirPods')
})

// ------------------------- casos límite -----------------------------------

test('workType se limpia al cambiar el uso a un valor distinto de Trabajo', async ({ page }) => {
  // Flujo completo: Trabajo + Ofimática + Portabilidad → Mac primary → primer
  // resumen (con workType visible). Cambiamos el uso a Estudio → family-confirm
  // → iPad primary → segundo resumen. En el segundo resumen NO debe aparecer
  // la pregunta ni el valor de workType, y sí "Estudio".
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Trabajo',
    productRole: 'Un equipo principal para realizar mis tareas.',
    workType: 'Ofimática, correo y videollamadas.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  // Confirma familia principal (Mac, según el ranking probado).
  const primaryMac = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primaryMac.getByRole('heading', { name: 'Mac' })).toBeVisible()
  await primaryMac.getByRole('button', { name: /Continuar con esta categoría/ }).click()
  // Responder las preguntas específicas de Mac.
  await answerAndNext(page, 'Estudio y ofimática')
  await answerAndNext(page, 'Portátil (imprescindible)')
  await answerAndNext(page, 'Ligereza y batería', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
  // Primer resumen: la pregunta y valor de workType están presentes.
  await expect(page.getByText('¿Qué tipo de trabajo realizarás principalmente?')).toBeVisible()
  await expect(page.getByText('Ofimática, correo y videollamadas.')).toBeVisible()

  // Cambiamos el uso a Estudio desde el resumen.
  await page.getByRole('button', { name: /Cambiar: ¿Para qué lo utilizarás principalmente\?/ }).click()
  await page.getByRole('radio', { name: 'Estudio' }).click()
  // Estudio tiene 4 preguntas (use, productRole, priority, portability —
  // sin workType). Recorremos hasta family-confirm; cada respuesta previa
  // se conserva.
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole('button', { name: /Continuar|Siguiente/ })
      .first()
      .click()
  }
  // Confirmamos familia principal (iPad, según 'estudio + primary + portabilidad').
  const primaryIpad = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await expect(primaryIpad.getByRole('heading', { name: 'iPad' })).toBeVisible()
  await primaryIpad.getByRole('button', { name: /Continuar con esta categoría/ }).click()
  // Responder las preguntas específicas de iPad.
  await answerAndNext(page, 'Estudio')
  await answerAndNext(page, 'Sí (imprescindible)')
  await answerAndNext(page, 'Sí (imprescindible)', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()

  // Segundo resumen: aparece Estudio, NO aparece workType.
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
  // "Estudio" aparece dos veces en el resumen: como uso general y como
  // uso específico de iPad.
  await expect(page.getByText('Estudio', { exact: true })).toHaveCount(2)
  await expect(page.getByText('¿Qué tipo de trabajo realizarás principalmente?')).toHaveCount(0)
  await expect(page.getByText('Ofimática, correo y videollamadas.')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: /Cambiar: ¿Qué tipo de trabajo realizarás principalmente\?/ }),
  ).toHaveCount(0)
  // Se puede continuar a resultados.
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  await expect(page.getByRole('heading', { name: /Opciones sugeridas en iPad/ })).toBeVisible()
})

test('SummaryStep no muestra "¿Qué tipo de trabajo?" cuando el uso no es Trabajo', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  // Con Estudio + primary + Portabilidad, la primera familia es iPad.
  await answerGeneralFlow(page, {
    use: 'Estudio',
    productRole: 'Un equipo principal para realizar mis tareas.',
    priority: 'Portabilidad',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const primary = page.locator('div').filter({ hasText: 'Recomendación principal' }).first()
  await primary.getByRole('button', { name: /Continuar con esta categoría/ }).click()
  // Responder específicas de iPad.
  await answerAndNext(page, 'Estudio')
  await answerAndNext(page, 'Sí (imprescindible)')
  await answerAndNext(page, 'Sí (imprescindible)', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
  // No hay fila de tipo de trabajo.
  await expect(page.getByText('¿Qué tipo de trabajo realizarás principalmente?')).toHaveCount(0)
  await expect(page.getByText('Programación o aplicaciones de escritorio.')).toHaveCount(0)
})

test('Estado sin coincidencias: el foco llega al encabezado principal', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Fotografía y vídeo',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Cámara',
    portability: 'Sí, lo llevaré siempre encima',
  })
  const heading = page.getByRole('heading', {
    name: 'No encontramos una categoría que encaje con todo',
  })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  await expect(heading).toHaveAttribute('tabindex', '-1')
})

test('Fotografía + complemento muestra estado sin coincidencias (sin recomendaciones)', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Fotografía y vídeo',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Cámara',
    portability: 'Sí, lo llevaré siempre encima',
  })
  await expect(page.getByRole('heading', { name: 'No encontramos una categoría que encaje con todo' })).toBeVisible()
  await expect(page.getByText(/No encontramos una categoría de accesorio fotográfico/)).toBeVisible()
  // No hay recomendación principal ni tarjetas candidatas.
  await expect(page.getByText('Recomendación principal')).toHaveCount(0)
  await expect(page.getByText('Segunda posibilidad')).toHaveCount(0)
  // Los CTA de revisar y ver todas están presentes.
  await expect(page.getByRole('button', { name: /Revisar respuestas/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver todas las categorías' })).toBeVisible()
})

test('Revisar respuestas: conserva respuestas y permite cambiar el rol para volver a tener candidatas', async ({
  page,
}) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Fotografía y vídeo',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Cámara',
    portability: 'Sí, lo llevaré siempre encima',
  })
  await page.getByRole('button', { name: /Revisar respuestas/ }).click()
  // Estamos de vuelta en la pregunta de productRole con "complemento" marcado.
  await expect(page.getByText('¿Qué tipo de producto necesitas?')).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Un complemento, como auriculares o reloj.' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  // Cambiamos a "Un dispositivo móvil...".
  await page.getByRole('radio', { name: 'Un dispositivo móvil para llevar siempre conmigo.' }).click()
  // Continuamos el flujo hasta llegar de nuevo a la confirmación de familia.
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole('button', { name: /Continuar|Siguiente/ })
      .first()
      .click()
  }
  // Con foto + mobile SÍ hay familias válidas (iPhone al menos).
  await expect(page.getByText('Recomendación principal')).toBeVisible()
})

test('Ver todas las categorías desde estado sin coincidencias abre el selector manual', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'No lo tengo claro' }).click()
  await answerGeneralFlow(page, {
    use: 'Fotografía y vídeo',
    productRole: 'Un complemento, como auriculares o reloj.',
    priority: 'Cámara',
    portability: 'Sí, lo llevaré siempre encima',
  })
  await page.getByRole('button', { name: 'Ver todas las categorías' }).click()
  await expect(page.getByRole('heading', { name: '¿Qué producto estás buscando?' })).toBeVisible()
  // Ninguna familia está pre-seleccionada (todas los radios aria-checked=false).
  const radios = page.getByRole('radio')
  const total = await radios.count()
  for (let i = 0; i < total; i++) {
    await expect(radios.nth(i)).toHaveAttribute('aria-checked', 'false')
  }
})

// ---------------------------- filtros duros --------------------------------

test('Mac portátil estricto: nunca devuelve iMac, Mac mini ni Mac Studio', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'Mac' }).click()
  await answerAndNext(page, 'Estudio y ofimática')
  await answerAndNext(page, 'Portátil (imprescindible)')
  await answerAndNext(page, 'Ligereza y batería', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  const names = await page.locator('h3').allTextContents()
  const joined = names.join('|')
  expect(joined).not.toContain('iMac')
  expect(joined).not.toContain('Mac mini')
  expect(joined).not.toContain('Mac Studio')
})

test('Mac sobremesa estricto: nunca devuelve MacBook', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'Mac' }).click()
  await answerAndNext(page, 'Trabajo profesional exigente')
  await answerAndNext(page, 'Sobremesa (imprescindible)')
  await answerAndNext(page, 'Potencia', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  const names = await page.locator('h3').allTextContents()
  expect(names.join('|')).not.toContain('MacBook')
})

test('AirPods formato abierto: no devuelve Pro ni Max', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'AirPods' }).click()
  await answerAndNext(page, 'Música')
  await answerAndNext(page, 'Abiertos, sin almohadilla', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  const names = await page.locator('h3').allTextContents()
  const joined = names.join('|')
  expect(joined).not.toContain('AirPods Pro')
  expect(joined).not.toContain('AirPods Max')
})

test('AirPods de diadema: solo devuelve AirPods Max', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'AirPods' }).click()
  await answerAndNext(page, 'Música')
  await answerAndNext(page, 'De diadema', /Continuar|Siguiente/)
  await page.getByRole('radio', { name: 'Sin límite' }).click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Solo es una referencia' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  const names = await page.locator('h3').allTextContents()
  const joined = names.join('|')
  expect(joined).toContain('AirPods Max')
  expect(joined).not.toContain('AirPods 4')
  expect(joined).not.toContain('AirPods Pro')
})

// ---------------------------- presupuesto ----------------------------------

test('presupuesto estricto excluye modelos por encima del máximo', async ({ page }) => {
  await start(page)
  await page.getByRole('radio', { name: 'iPhone' }).click()
  await answerAndNext(page, 'Uso cotidiano')
  await answerAndNext(page, 'Me da igual')
  await answerAndNext(page, 'Precio', /Continuar|Siguiente/)
  // Elige el tramo más bajo disponible (primer botón radio en el paso presupuesto).
  const budgetRadios = page.getByRole('radio')
  await budgetRadios.first().click()
  await page.getByRole('button', { name: /^Siguiente/ }).click()
  await page.getByRole('radio', { name: 'Es mi máximo' }).click()
  await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
  await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
  // No debe haber ninguna caveat "por encima": el estricto ya filtra.
  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toMatch(/por encima del presupuesto/)
})

// ---------------------------- resumen editable + navegación ----------------

test('resumen editable: cambiar la respuesta del tamaño desde la ficha', async ({ page }) => {
  await runIphoneFlow(page, {
    use: 'Fotografía y vídeo',
    size: 'Grande',
    priority: 'Cámara',
    budget: 'Sin límite',
    flex: 'Solo es una referencia',
  })
  // Volver al resumen.
  await page.getByRole('button', { name: 'Cambiar respuestas' }).click()
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
  // Cambiar el tamaño.
  await page.getByRole('button', { name: /Cambiar: ¿Qué tamaño prefieres\?/ }).click()
  await page.getByRole('radio', { name: 'Compacto' }).click()
  // Siguiente hasta llegar de nuevo al resumen (specific→specific→budget→flex→summary).
  // Cada paso conserva la respuesta previa, así que Siguiente/Continuar avanzan.
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole('button', { name: /Continuar|Siguiente/ })
      .first()
      .click()
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que buscas' })).toBeVisible()
})

// ---------------------------- resultados: labels nuevos --------------------

test('roles nuevos: no aparecen las etiquetas antiguas', async ({ page }) => {
  await runIphoneFlow(page, {
    use: 'Fotografía y vídeo',
    size: 'Grande',
    priority: 'Cámara',
    budget: 'Sin límite',
    flex: 'Solo es una referencia',
  })
  await expect(page.getByText('Alternativa más económica')).toHaveCount(0)
  await expect(page.getByText('Alternativa más avanzada')).toHaveCount(0)
  await expect(page.getByText('Nuestra recomendación')).toHaveCount(0)
  await expect(page.getByText('Mejor encaje')).toBeVisible()
})

// ---------------------------- determinismo ---------------------------------

test('resultado determinista: mismas respuestas → mismos productos', async ({ page }) => {
  async function runFlow() {
    await page.goto('./elige-tu-apple')
    await page.getByRole('button', { name: 'Empezar' }).click()
    await page.getByRole('radio', { name: 'iPhone' }).click()
    await answerAndNext(page, 'Fotografía y vídeo')
    await answerAndNext(page, 'Grande')
    await answerAndNext(page, 'Cámara', /Continuar|Siguiente/)
    await page.getByRole('radio', { name: 'Sin límite' }).click()
    await page.getByRole('button', { name: /^Siguiente/ }).click()
    await page.getByRole('radio', { name: 'Es mi máximo' }).click()
    await page.getByRole('button', { name: /Continuar|Siguiente/ }).click()
    await page.getByRole('button', { name: /Ver recomendaciones/ }).click()
    return (await page.locator('h3').allTextContents()).join('|')
  }
  const first = await runFlow()
  const second = await runFlow()
  expect(first).toBe(second)
  expect(first).toContain('iPhone')
})

// ---------------------------- comparar --------------------------------------

test('"Comparar estas opciones" envía los resultados a /comparar', async ({ page }) => {
  await runIphoneFlow(page, {
    use: 'Uso cotidiano',
    size: 'Equilibrado',
    priority: 'Precio',
    budget: 'Sin límite',
    flex: 'Solo es una referencia',
  })
  // Espera al render completo antes de comparar (el ResultsStep monta cards).
  await expect(page.locator('h3').first()).toBeVisible()
  await page.getByRole('button', { name: 'Comparar estas opciones' }).click()
  await expect(page).toHaveURL(/\/comparar$/)
  // Al menos un iPhone aparece en la cabecera del comparador y como mucho tres.
  const cards = page.getByRole('group', { name: /^Modelos comparados/ })
  const boldCount = await cards.locator('p.font-bold').count()
  expect(boldCount).toBeGreaterThanOrEqual(1)
  expect(boldCount).toBeLessThanOrEqual(3)
})

// ---------------------------- móvil + axe ----------------------------------

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
