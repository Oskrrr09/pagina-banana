---
tipo: sesion
fecha: 2026-07-29
tema: comparador esencial (PR1 del bloque diferencial)
---

# Comparador esencial

## Objetivo

Rehacer `/comparar` para que la comparación sea directa, visual y
esté enfocada en las diferencias importantes por familia,
inspirándose en la claridad del comparador oficial de Apple **sin
copiar CSS, textos ni componentes**.

## Comportamiento nuevo

- Encabezado "Compara tus opciones" + descripción.
- Estado vacío con selector de familia y CTA "Necesito ayuda para
  elegir" (deshabilitado hasta la PR2 del asistente).
- Cada columna funciona como una tarjeta con imagen, nombre,
  variante (capacidad · color), precio demostrativo, `<select>`
  "Sustituir por" con los modelos restantes de la familia y
  botones "Ver producto", "Favorito" y "Comprar", además de
  "Quitar de la comparación".
- Cabecera sticky reducida (`sticky top-16 sm:top-[6.25rem]`)
  mostrando nombre + miniatura + precio de cada columna, oculta
  con `aria-hidden` para lectores de pantalla (que ya reciben la
  tabla completa).
- Chip switch **"Solo diferencias" (por defecto)** vs "Mostrar
  todas", con anuncio `aria-live`.
- Resumen calculado sólo cuando hay dos productos o más
  ("Opción más económica", "Mayor capacidad inicial", "Mayor
  pantalla" y "Más ligero"), etiquetado como *Orientación
  demostrativa*.
- Badge visual "Más económico"/"Mayor capacidad"/"Más ligero"/
  "Mayor pantalla" sobre la columna correspondiente.

## Datos

- Nuevo módulo `src/data/productDecisionData.ts` con:
  - `ESSENTIAL_FIELDS` por familia (los campos que el brief
    exigía por familia).
  - `FIELD_ALIASES` con equivalencias normalizadas para mapear
    `model.specs.label` (p. ej. "Batería" → "Autonomía").
  - `getEssentialValue`, `resolvePrice`, `parseWeightGrams`,
    `parseScreenInches`, `parseCapacityGB`.
  - `buildDecisionRows({onlyDifferences})` que omite filas
    totalmente vacías y (opcionalmente) las que son idénticas
    entre todas las columnas.
  - `buildDecisionSummary` para el resumen superior.
  - `MODEL_META` con `usoRecomendado` demostrativo por slug.
- Nunca se inventan especificaciones: si el catálogo no tiene el
  dato, la celda muestra "No especificado" o se omite toda la
  fila.

## Compatibilidad

- **No se cambia el shape de `CompareItem`** en
  `src/lib/store.tsx`. Los usuarios con `banana:compare`
  guardado ven la nueva UI sin necesidad de migración: los datos
  esenciales se derivan al vuelo a partir de `modelSlug` mediante
  `getFamilyModels(family)`.

## Accesibilidad

- Tabla semántica con `<thead>` y `<tbody>`; filas de datos con
  `<th scope="row">`.
- Chips como `<button>` con `aria-pressed` (patrón `Chip`).
- Selector `<select>` con `aria-label` explícito ("Sustituir X
  por otro modelo").
- Botones de acción con nombre accesible ("Quitar X de la
  comparación", "Añadir/Quitar X de favoritos").
- Cabecera sticky decorativa (`aria-hidden`) para no duplicar
  información en lectores de pantalla.
- Sin nuevas excepciones en axe (probado con
  `tests/e2e/comparator.spec.ts`).

## Tests

- Nueva `tests/e2e/comparator.spec.ts` (8 pruebas):
  1. Encabezado + estado vacío con CTA deshabilitado.
  2. "Solo diferencias" por defecto; "Mostrar todas" pinta ≥
     filas.
  3. Resumen con "Opción más económica" para dos productos.
  4. Sustitución en columna con `<select>`.
  5. Añadir a favoritos y a la cesta desde la columna.
  6. Persistencia tras recargar.
  7. Sin scroll horizontal a 375 px.
  8. axe limpio.
- `tests/e2e/favorites-compare.spec.ts`: actualizado para el
  nuevo `aria-label` "Quitar iPhone 17 Pro de la comparación"
  y el scope del `<thead>`.

## Resultados

- `npm run build`: correcto (~495 kB gzip ~144 kB).
- `npm run test:e2e`: 73/73 en verde (71 chromium + 2 mobile).
- `npx playwright test tests/e2e/comparator.spec.ts
  tests/e2e/favorites-compare.spec.ts
  tests/e2e/accessibility.spec.ts --project=chromium`: 19/19.

## Archivos

- `src/data/productDecisionData.ts` (nuevo)
- `src/pages/ComparePage.tsx` (rehecha)
- `tests/e2e/comparator.spec.ts` (nueva)
- `tests/e2e/favorites-compare.spec.ts`
- `README.md`, `docs/03-roadmap.md`,
  `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-29--comparador-esencial.md` (este
  archivo)

## Fuera de esta PR

- Asistente "Encuentra tu Apple" (PR2).
- Tienda favorita (PR3).
- Favoritos + avisos (PR4).
- No se toca seguro, checkout, Plan Renove, Servicio Técnico
  ni catálogo.
