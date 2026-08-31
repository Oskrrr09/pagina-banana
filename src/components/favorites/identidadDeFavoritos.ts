import type { Model } from '../../data/types'

// ============================================================================
// QUÉ MODELO ES UN FAVORITO.
//
// EL CONTRATO DE `banana:fav`
//
// Un favorito se guarda como `familia/modelo`, dos segmentos y ninguno más.
// Lo escriben seis sitios —la tarjeta del catálogo, la compacta, la ficha, la
// de modelo, el comparador y el buscador de Apple— y los seis componen el
// mismo identificador; `toggleFavorite` lo almacena tal cual y `isFavorite`
// compara por igualdad. Nunca se persiste el color ni la capacidad.
//
// POR QUÉ NO `startsWith`
//
// La lista se reconstruía con `favoritos.some((f) => f.startsWith(id))`. Eso
// no pregunta «¿está guardado este modelo?» sino «¿empieza algún favorito por
// su identificador?», y en un catálogo donde un modelo se llama como otro más
// una palabra, eso es que un favorito arrastra a sus vecinos:
//
//   guardado `iphone/17-pro`      → salía también `iphone/17`
//   guardado `iphone/17-pro-max`  → salían también `iphone/17-pro` y `iphone/17`
//   guardado `airpods/airpods-4-anc` → salía también `airpods/airpods-4`
//
// Con igualdad exacta no hay nada que confundir, y no hace falta ninguna lista
// de excepciones: cualquier modelo futuro cuyo identificador sea prefijo de
// otro queda cubierto por construcción. El censo del catálogo entero vive en
// `tests/unit/favoritos-identidad.test.ts`.
//
// El defecto es anterior a la Fase D1 —estaba igual en `FavoritesPage`—, pero
// se corrige aquí porque la validación física de D1 lo encontró en la
// superficie que se estaba cambiando, y porque lo consumen las dos
// plataformas: la web pintaba el mismo modelo fantasma.
// ============================================================================

/** El identificador con el que se guarda un modelo en favoritos. */
export function idDeFavorito(model: Pick<Model, 'family' | 'slug'>): string {
  return `${model.family}/${model.slug}`
}

/**
 * Los modelos del catálogo que están guardados.
 *
 * El orden es el del catálogo, no el de guardado: es el que la lista ya usaba
 * y el que mantiene estable la pantalla entre visitas.
 */
export function modelosFavoritos(modelos: readonly Model[], favoritos: readonly string[]): Model[] {
  return modelos.filter((m) => favoritos.includes(idDeFavorito(m)))
}
