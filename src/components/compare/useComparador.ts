import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MAX_COMPARE, useStore, type CompareItem } from '../../lib/store'
import { families, getFamilyModels, getModel, familyInfo, developedFamilies } from '../../data/products'
import { buildDecisionSections, buildDecisionSummary, type FamilySlug } from '../../data/productDecisionData'
import { etiquetasCortas } from './etiquetaCorta'
import type { Model } from '../../data/types'

// ============================================================================
// TODO LO QUE EL COMPARADOR NECESITA SABER Y HACER.
//
// POR QUÉ EXISTE
//
// `/comparar` tiene dos composiciones —la tabla de la web y la comparación
// vertical de la app— y comparten hasta la última regla: qué familia se
// compara, qué modelos entran, qué atributos difieren, quién gana cada uno y
// qué pasa al añadir, sustituir o quitar. Escrito dos veces divergiría en
// cuanto una de las dos cambiase, y eso fue exactamente lo que pasó: durante
// un tiempo hubo un dominio propio en la web y otro aquí.
//
// LA LISTA RESUELTA, Y POR QUÉ ES UNA SOLA
//
// Lo que se guarda en `banana:compare` no siempre trae todo. La PR #94 dejó
// escrito que un elemento legítimo sólo necesita `id`, `modelSlug` y
// `family`; el resto —`name`, `color`, `capacity`, `price`— son datos de
// presentación que pueden faltar porque se resuelven contra el catálogo vivo.
// Y un `modelSlug` que ya no exista debe ignorarse en silencio.
//
// Antes había DOS listas: los contextos, ya filtrados, y `compare` en crudo,
// con el retirado dentro. Indexar las dos a la vez producía esto —medido—:
//
//   guardado [retirado, iPhone 17, iPhone 17 Pro]
//     productos  Retirado · iPhone 17 · iPhone 17 Pro
//     etiquetas  Retirado · 17        · 17 Pro
//     valores    959 €    · 1229 €    · —
//
// Es decir: un producto fantasma, cada precio junto al modelo equivocado y
// «Más económico» señalando al más caro. Sin lanzar ninguna excepción.
//
// Por eso `comparables` es la ÚNICA colección de la que sale todo: producto,
// nombre, etiqueta corta, valores y destacados. Los contextos se derivan de
// ella, así que secciones y resumen quedan alineados por construcción y no
// por cuidado.
// ============================================================================

/** Un elemento de la comparación, ya casado con su modelo del catálogo. */
export interface ComparableResuelto {
  /** Lo persistido, tal cual: es la identidad para quitar y sustituir. */
  item: CompareItem
  /** El modelo vivo. Si no existe, el elemento no llega hasta aquí. */
  model: Model
  nombre: string
  color: string
  capacidad: string
  precio: number
  /** Identificación corta y sin colisiones dentro de esta comparación. */
  etiqueta: string
  destacados: string[]
}

/** Prefiere lo persistido cuando es utilizable; si no, el catálogo. */
function cadena(valor: unknown, respaldo: string): string {
  return typeof valor === 'string' && valor.length > 0 ? valor : respaldo
}

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

  /** Los elementos que existen de verdad, en el orden en que se guardaron. */
  const parejas = useMemo(() => {
    const out: { item: CompareItem; model: Model }[] = []
    for (const item of compare) {
      // La identidad es `family + modelSlug`, no la posición en la lista de la
      // familia activa: así no depende de qué familia se esté mirando.
      const model = getModel(item.family, item.modelSlug)
      if (!model) continue
      out.push({ item, model })
    }
    return out
  }, [compare])

  // Los contextos SALEN de las mismas parejas: misma longitud y mismo orden
  // que `comparables`, así que secciones y resumen no pueden desalinearse.
  const contextos = useMemo(
    () =>
      parejas.map(({ item, model }) => ({
        model,
        capacity: item.capacity ?? null,
        color: item.color ?? null,
      })),
    [parejas],
  )

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

  const comparables = useMemo<ComparableResuelto[]>(() => {
    // Las etiquetas cortas se calculan sobre los nombres del CATÁLOGO, no
    // sobre `item.name`, que puede no venir. Y sobre los ya resueltos, para
    // que no haya que comprobar colisiones contra un fantasma.
    const cortas = etiquetasCortas(
      parejas.map((p) => p.model.name),
      modelos.map((m) => m.name),
    )
    return parejas.map(({ item, model }, i) => {
      const color = model.colors[0]
      const capacidad = color?.capacities[0]
      return {
        item,
        model,
        nombre: cadena(item.name, model.name),
        color: cadena(item.color, color?.name ?? ''),
        capacidad: cadena(item.capacity, capacidad?.capacity ?? ''),
        precio: typeof item.price === 'number' ? item.price : (capacidad?.price ?? 0),
        etiqueta: cortas[i],
        destacados: destacadosDe(model.slug),
      }
    })
    // `destacadosDe` depende de `resumen`, que depende de `contextos`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parejas, modelos, resumen])

  /** El `CompareItem` de un modelo, con su configuración de entrada. */
  function itemDe(model: Model): CompareItem {
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

  // RECONCILIACIÓN CON EL CATÁLOGO VIVO
  //
  // Ocultar un modelo retirado de lo que se pinta no basta: mientras siguiera
  // dentro de `compare`, `toggleCompare` lo contaría contra `MAX_COMPARE` y el
  // hueco quedaría muerto. Medido antes de esta reconciliación:
  //
  //   [retirado, 17, 17 Pro] → 2 visibles y NINGÚN sitio donde añadir el
  //                            tercero, con 3 entradas guardadas
  //   [r1, r2, r3]           → 0 visibles, sin estado vacío y sin CTA: una
  //                            pantalla de la que no se sale
  //
  // Por eso el elemento se retira del estado, no sólo de la vista. Y por eso
  // esto vive aquí y no en `normalizarComparacion`: aquélla comprueba si la
  // FORMA persistida es utilizable —y no conoce el catálogo, ni debe—; esto
  // comprueba si el modelo TODAVÍA existe, que es dominio.
  //
  // Sólo se afirma que un modelo no existe cuando la familia sí tiene catálogo:
  // si `getFamilyModels` no devuelve nada no podemos concluir nada, y borrar
  // por un falso negativo sería peor que dejar el elemento. Y si no hay nada
  // que retirar no se toca el estado, para no reescribir el almacenamiento en
  // cada render.
  useEffect(() => {
    const aRetirar = compare
      .filter((c) => {
        // Accesorios heredados con la family antigua `accessory:<category>`:
        // el comparador es sólo para dispositivos.
        if (c.family?.startsWith('accessory:')) return true
        if (getFamilyModels(c.family).length === 0) return false
        return !getModel(c.family, c.modelSlug)
      })
      .map((c) => c.id)
    if (aRetirar.length === 0) return
    aRetirar.forEach(removeCompare)
  }, [compare, removeCompare])

  return {
    /** La única colección de la que sale todo lo que se enseña. */
    comparables,
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
    maximo: MAX_COMPARE,
    vacio: compare.length === 0,
    lleno: compare.length >= MAX_COMPARE,
    /** El destacado que corresponde al comparable de esta posición, si lo hay. */
    destacadoEn(campo: string, indice: number): string | null {
      const c = comparables[indice]
      if (!c) return null
      const ganadorDe: Record<string, string | null | undefined> = {
        Precio: resumen.cheapestSlug,
        Peso: resumen.lightestSlug,
        Pantalla: resumen.largestScreenSlug,
        'Capacidad inicial': resumen.largestCapacitySlug,
        'Almacenamiento inicial': resumen.largestCapacitySlug,
      }
      if (ganadorDe[campo] !== c.model.slug) return null
      return {
        Precio: 'Más económico',
        Peso: 'Más ligero',
        Pantalla: 'Mayor pantalla',
        'Capacidad inicial': 'Mayor capacidad',
        'Almacenamiento inicial': 'Mayor capacidad',
      }[campo]!
    },
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
