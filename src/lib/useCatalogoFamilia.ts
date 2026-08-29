import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Model } from '../data/types'
import { useStore } from './store'
import { aplicarFiltros, escribirFiltrosEnUrl, leerFiltrosDeUrl, type FiltrosCatalogo } from './catalogFilters'

/**
 * Estado del catálogo de una familia: filtros, resultado y comparación.
 *
 * QUÉ HACE AQUÍ ESTE HOOK
 *
 * Web y app montan dos composiciones distintas de la página de familia, pero el
 * catálogo se comporta igual en las dos: los mismos filtros, el mismo orden, el
 * mismo estado en la URL y la misma cuenta de modelos en comparación. Eso es
 * dominio, no presentación, así que vive una sola vez y lo consumen las dos.
 *
 * Lo que **no** se comparte es cómo se pinta: los controles de filtro, la
 * rejilla y el escaparate son de cada plataforma. Ver `FamilyPage`.
 *
 * EL ESTADO VIVE EN LA URL, NO EN `useState`
 *
 * Así Atrás y Adelante recuperan lo que se estaba viendo y un enlace compartido
 * llega filtrado igual. Se navega con `replace` para no llenar el historial con
 * una entrada por cada toque en un filtro — si no, salir de la página exigiría
 * pulsar Atrás tantas veces como filtros se hubieran tocado.
 */
export function useCatalogoFamilia(models: Model[]) {
  const [params, setParams] = useSearchParams()
  const filtros = useMemo(() => leerFiltrosDeUrl(params), [params])
  const visibles = useMemo(() => aplicarFiltros(models, filtros), [models, filtros])

  // SE CUENTA SÓLO LO DE ESTA FAMILIA
  //
  // El comparador guarda una familia a la vez, y enseñar «3 modelos» en /mac
  // porque hay tres iPhone guardados sería un resumen falso de lo que hay en
  // pantalla.
  const { compare } = useStore()
  const familia = models[0]?.family
  const enComparacion = compare.filter((c) => c.family === familia).length

  const cambiar = (siguiente: FiltrosCatalogo) => {
    setParams(escribirFiltrosEnUrl(siguiente), { replace: true })
  }

  return { filtros, visibles, cambiar, familia, enComparacion }
}
