import { describe, expect, it } from 'vitest'
import { validarInformeRls } from '../../scripts/lib/verificar-rls.mjs'

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
