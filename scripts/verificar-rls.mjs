// Analiza el informe JSON de Playwright de las pruebas RLS y decide si el
// bloque de seguridad puede considerarse verificado.
//
// Antes esto se hacía buscando `"status":"skipped"` con una expresión regular
// sobre el JSON entero, lo que confunde una prueba omitida con la palabra
// apareciendo dentro de un mensaje de error. Y el comando llevaba `|| true`,
// así que un fallo de Playwright se tragaba en silencio.
import { readFileSync } from 'node:fs'

const ruta = process.argv[2]
const codigoPlaywright = Number(process.argv[3] ?? '0')

let informe
try {
  informe = JSON.parse(readFileSync(ruta, 'utf8'))
} catch (e) {
  console.error(`No se pudo leer el informe de Playwright en «${ruta}»: ${e.message}`)
  console.error('Sin informe no se puede afirmar nada sobre las pruebas RLS.')
  process.exit(1)
}

/** Recorre la estructura real del reporter y cuenta por estado. */
function contar(informe) {
  const cuenta = { total: 0, esperadas: 0, fallidas: 0, omitidas: 0, inestables: 0 }
  const visitar = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const prueba of spec.tests ?? []) {
        cuenta.total += 1
        if (prueba.status === 'skipped') cuenta.omitidas += 1
        else if (prueba.status === 'expected') cuenta.esperadas += 1
        else if (prueba.status === 'flaky') cuenta.inestables += 1
        else cuenta.fallidas += 1
      }
    }
    for (const hija of suite.suites ?? []) visitar(hija)
  }
  for (const suite of informe.suites ?? []) visitar(suite)
  return cuenta
}

const c = contar(informe)
console.log(
  `RLS → descubiertas ${c.total} · ejecutadas ${c.esperadas + c.fallidas + c.inestables} · ` +
    `aprobadas ${c.esperadas} · fallidas ${c.fallidas} · inestables ${c.inestables} · ` +
    `omitidas ${c.omitidas}`,
)

const problemas = []
if (c.total === 0) problemas.push('el informe no contiene ninguna prueba')
if (c.esperadas === 0) problemas.push('no se ha aprobado ninguna prueba')
if (c.omitidas > 0) problemas.push(`${c.omitidas} omitidas: son comprobaciones que nadie ha hecho`)
if (c.fallidas > 0) problemas.push(`${c.fallidas} fallidas`)
if (c.inestables > 0) problemas.push(`${c.inestables} inestables`)
if (codigoPlaywright !== 0) problemas.push(`Playwright terminó con código ${codigoPlaywright}`)

if (problemas.length > 0) {
  console.error('Las pruebas RLS NO verifican el bloque de seguridad:')
  for (const p of problemas) console.error(`  · ${p}`)
  process.exit(1)
}
console.log('Pruebas RLS ejecutadas y aprobadas en su totalidad.')
