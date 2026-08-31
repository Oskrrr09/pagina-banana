import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { families, getFamilyModels, familyInfo, developedFamilies } from '../../data/products'
import { buildDecisionSections, buildDecisionSummary, type FamilySlug } from '../../data/productDecisionData'
import type { Model } from '../../data/types'

/**
 * Todo lo que el comparador necesita **saber y hacer**, sin decidir nada de
 * cómo se ve.
 *
 * POR QUÉ EXISTE
 *
 * `/comparar` tiene dos composiciones —la tabla histórica de la web y la
 * comparación vertical de la app— y comparten hasta la última regla: qué
 * familia se compara, qué modelos entran, qué atributos difieren, quién gana
 * cada uno y qué pasa al añadir, sustituir o quitar. Escrito dos veces
 * divergiría en cuanto una de las dos cambiase.
 *
 * Es D-085 aplicado a lo que no se ve: aquí vive el dominio entero y las dos
 * superficies consumen el mismo objeto. Nada de esto se reimplementa —
 * `useStore`, `MAX_COMPARE`, la restricción de familia, la persistencia y
 * `productDecisionData` siguen siendo los de siempre—.
 */
export const MAX_SLOTS = 3

export function useComparador() {
  const { compare, toggleCompare, removeCompare, replaceCompareItem, addToCart, toggleFavorite, isFavorite } =
    useStore()
  const [params, setParams] = useSearchParams()
  const [soloDiferencias, setSoloDiferencias] = useState(true)

  const paramFamily = params.get('familia') ?? ''
  const familiaActiva = (
    compare.length > 0 ? compare[0].family : developedFamilies.includes(paramFamily) ? paramFamily : 'iphone'
  ) as FamilySlug
  const familia = familyInfo(familiaActiva)
  const modelos = getFamilyModels(familiaActiva)
  const familiasComparables = families.filter(
    (f) => developedFamilies.includes(f.slug) && getFamilyModels(f.slug).length > 1,
  )

  const slugsUsados = useMemo(() => compare.map((c) => c.modelSlug), [compare])

  /** El `CompareItem` de un modelo, con su configuración de entrada. */
  function itemDe(model: Model) {
    const color = model.colors[0]
    const capacity = color.capacities[0]
    return {
      id: `${model.family}/${model.slug}/${color.color}/${capacity.capacity}`,
      modelSlug: model.slug,
      family: model.family,
      name: model.name,
      color: color.name,
      capacity: capacity.capacity,
      price: capacity.price,
      specs: model.specs,
    }
  }

  const contextos = useMemo(() => {
    const out: { model: Model; capacity: string | null; color: string | null }[] = []
    for (const c of compare) {
      const model = modelos.find((m) => m.slug === c.modelSlug)
      if (!model) continue
      out.push({ model, capacity: c.capacity ?? null, color: c.color ?? null })
    }
    return out
  }, [compare, modelos])

  const secciones = useMemo(
    () =>
      contextos.length > 0 ? buildDecisionSections(contextos, familiaActiva, { onlyDifferences: soloDiferencias }) : [],
    [contextos, familiaActiva, soloDiferencias],
  )

  const resumen = useMemo(() => buildDecisionSummary(contextos), [contextos])

  /** Los «Destaca por…» de un modelo, como máximo dos. */
  function destacadosDe(modelSlug: string): string[] {
    const out: string[] = []
    if (resumen.cheapestSlug === modelSlug) out.push('Más económico')
    if (resumen.lightestSlug === modelSlug) out.push('Más ligero')
    if (resumen.largestScreenSlug === modelSlug) out.push('Mayor pantalla')
    if (resumen.largestCapacitySlug === modelSlug) out.push('Mayor capacidad')
    return out.slice(0, 2)
  }

  // Compat: si algún accesorio quedó persistido con la family antigua
  // `accessory:<category>`, se retira en silencio — el comparador es sólo para
  // dispositivos.
  useEffect(() => {
    compare.forEach((c) => {
      if (c.family?.startsWith('accessory:')) removeCompare(c.id)
    })
  }, [compare, removeCompare])

  return {
    compare,
    familiaActiva,
    familia,
    modelos,
    familiasComparables,
    slugsUsados,
    contextos,
    secciones,
    resumen,
    soloDiferencias,
    setSoloDiferencias,
    destacadosDe,
    itemDe,
    vacio: compare.length === 0,
    lleno: compare.length >= MAX_SLOTS,
    cambiarFamilia(slug: string) {
      setParams(slug === 'iphone' ? {} : { familia: slug })
    },
    anadir(model: Model) {
      toggleCompare(itemDe(model))
    },
    sustituir(model: Model, idActual: string) {
      replaceCompareItem(idActual, itemDe(model))
    },
    quitar: removeCompare,
    addToCart,
    toggleFavorite,
    isFavorite,
  }
}
