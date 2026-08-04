// Analiza el informe JSON de Playwright de las pruebas RLS y decide si el
// bloque de seguridad puede considerarse verificado.
//
// Antes esto se hacía buscando `"status":"skipped"` con una expresión regular
// sobre el JSON entero, lo que confunde una prueba omitida con la palabra
// apareciendo dentro de un mensaje de error. Y el comando llevaba `|| true`,
// así que un fallo de Playwright se tragaba en silencio.
import { readFileSync } from 'node:fs'
import { validarInformeRls } from './lib/verificar-rls.mjs'

const ruta = process.argv[2]
const codigoPlaywright = Number(process.argv[3] ?? '0')
const cantidadEsperada = Number(process.env.RLS_EXPECTED_TESTS ?? process.argv[4])

let informe
try {
  informe = JSON.parse(readFileSync(ruta, 'utf8'))
} catch (e) {
  console.error(`No se pudo leer el informe de Playwright en «${ruta}»: ${e.message}`)
  console.error('Sin informe no se puede afirmar nada sobre las pruebas RLS.')
  process.exit(1)
}

const { cuenta: c, problemas } = validarInformeRls({
  informe,
  codigoPlaywright,
  cantidadEsperada,
})
console.log(
  `RLS → esperadas ${cantidadEsperada} · descubiertas ${c.total} · ` +
    `ejecutadas ${c.aprobadas + c.fallidas + c.inestables} · ` +
    `aprobadas ${c.aprobadas} · fallidas ${c.fallidas} · inestables ${c.inestables} · ` +
    `omitidas ${c.omitidas}`,
)

if (problemas.length > 0) {
  console.error('Las pruebas RLS NO verifican el bloque de seguridad:')
  for (const p of problemas) console.error(`  · ${p}`)
  process.exit(1)
}
console.log('Pruebas RLS ejecutadas y aprobadas en su totalidad.')
