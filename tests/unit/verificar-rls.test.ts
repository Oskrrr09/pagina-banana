import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  leerInformeRls,
  parsearInformeRls,
  validarInformeRls,
} from '../../scripts/lib/verificar-rls.mjs'

function informe(estados: string[]) {
  return {
    suites: [
      {
        specs: estados.map((status, indice) => ({
          title: `RLS ${indice + 1}`,
          tests: [{ status }],
        })),
      },
    ],
  }
}

function validar(estados: string[], codigoPlaywright = 0) {
  return validarInformeRls({
    informe: informe(estados),
    codigoPlaywright,
    cantidadEsperada: 27,
  })
}

describe('verificador estricto del informe RLS', () => {
  it('el workflow invoca Playwright directamente para generar JSON limpio', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(workflow).toMatch(
      /npx playwright test --project=rls --reporter=json > rls\.json/,
    )
    expect(workflow).not.toMatch(/npm run test:rls -- --reporter=json > rls\.json/)
  })

  it('lee un informe JSON válido sin aceptar texto adicional', () => {
    const contenido = JSON.stringify(informe(Array(27).fill('expected')))
    expect(parsearInformeRls(contenido)).toEqual(informe(Array(27).fill('expected')))
  })

  it('rechaza un archivo vacío', () => {
    expect(() => parsearInformeRls('  \n')).toThrow(/informe JSON válido.*vacío/)
  })

  it('rechaza JSON mal formado', () => {
    expect(() => parsearInformeRls('{"suites":[')).toThrow(/informe JSON válido.*no es JSON/)
  })

  it('rechaza el encabezado de npm run antes del JSON', () => {
    const contenido = `> banana-computer-prototipo@0.1.0 test:rls
> playwright test --project=rls --reporter=json

{"suites":[]}`
    expect(() => parsearInformeRls(contenido)).toThrow(/informe JSON válido.*no es JSON/)
  })

  it('rechaza un informe inexistente', () => {
    const ruta = join(tmpdir(), `rls-inexistente-${crypto.randomUUID()}.json`)
    expect(() => leerInformeRls(ruta)).toThrow(/informe JSON válido.*ENOENT/)
  })

  it('acepta exactamente 27 pruebas aprobadas', () => {
    expect(validar(Array(27).fill('expected')).problemas).toEqual([])
  })

  it('rechaza 26 pruebas aunque todas aprueben', () => {
    expect(validar(Array(26).fill('expected')).problemas.join('\n')).toMatch(/exactamente 27/)
  })

  it('rechaza 28 pruebas aunque todas aprueben', () => {
    expect(validar(Array(28).fill('expected')).problemas.join('\n')).toMatch(/exactamente 27/)
  })

  it('rechaza una prueba omitida', () => {
    expect(validar([...Array(26).fill('expected'), 'skipped']).problemas.join('\n')).toMatch(
      /omitida/,
    )
  })

  it('rechaza una prueba inestable', () => {
    expect(validar([...Array(26).fill('expected'), 'flaky']).problemas.join('\n')).toMatch(
      /inestable/,
    )
  })

  it('rechaza un informe vacío', () => {
    expect(validar([]).problemas.join('\n')).toMatch(/ninguna prueba/)
  })

  it('rechaza un código de salida no cero aunque las 27 aprueben', () => {
    expect(validar(Array(27).fill('expected'), 1).problemas.join('\n')).toMatch(/código 1/)
  })
})
