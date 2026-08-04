/** Recorre la estructura real del reporter JSON de Playwright. */
export function contarPruebasRls(informe) {
  const cuenta = { total: 0, aprobadas: 0, fallidas: 0, omitidas: 0, inestables: 0 }
  const visitar = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const prueba of spec.tests ?? []) {
        cuenta.total += 1
        if (prueba.status === 'skipped') cuenta.omitidas += 1
        else if (prueba.status === 'expected') cuenta.aprobadas += 1
        else if (prueba.status === 'flaky') cuenta.inestables += 1
        else cuenta.fallidas += 1
      }
    }
    for (const hija of suite.suites ?? []) visitar(hija)
  }
  for (const suite of informe?.suites ?? []) visitar(suite)
  return cuenta
}

export function validarInformeRls({ informe, codigoPlaywright, cantidadEsperada }) {
  const cuenta = contarPruebasRls(informe)
  const problemas = []

  if (!Number.isInteger(cantidadEsperada) || cantidadEsperada <= 0) {
    problemas.push(`cantidad esperada inválida: ${cantidadEsperada}`)
  }
  if (cuenta.total === 0) problemas.push('el informe no contiene ninguna prueba')
  if (cuenta.total !== cantidadEsperada) {
    problemas.push(`se esperaban exactamente ${cantidadEsperada} pruebas y se descubrieron ${cuenta.total}`)
  }
  if (cuenta.aprobadas !== cantidadEsperada) {
    problemas.push(`se esperaban exactamente ${cantidadEsperada} aprobadas y hubo ${cuenta.aprobadas}`)
  }
  if (cuenta.omitidas > 0) {
    problemas.push(`${cuenta.omitidas} omitidas: son comprobaciones que nadie ha hecho`)
  }
  if (cuenta.fallidas > 0) problemas.push(`${cuenta.fallidas} fallidas`)
  if (cuenta.inestables > 0) problemas.push(`${cuenta.inestables} inestables`)
  if (codigoPlaywright !== 0) {
    problemas.push(`Playwright terminó con código ${codigoPlaywright}`)
  }

  return { cuenta, problemas }
}
