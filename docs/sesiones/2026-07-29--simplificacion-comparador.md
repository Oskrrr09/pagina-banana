---
tipo: sesion
fecha: 2026-07-29
tema: simplificación visual del comparador
---

# Simplificación visual del comparador

## Objetivo

Convertir `/comparar` en una herramienta sencilla para decidir, en línea con
la retroalimentación del usuario:

- menos filas, agrupadas semánticamente;
- menos "adornos" (sin fondo amarillo en todas las diferencias);
- selección de modelos por diálogo, sin bajar hasta una rejilla inferior;
- ganadores marcados con criterio estricto (nunca por defecto ni en empates);
- sticky real, sin cabeceras duplicadas;
- móvil 375 px estable, sin scroll horizontal global.

## Estado inicial

- Base en `main`, commit `89887db`.
- `/comparar` mezclaba resumen superior, cabecera sticky duplicada con
  `aria-hidden`, tabla técnica larga (10–13 filas por familia) con celdas en
  fondo amarillo, columna vacía y una gran rejilla inferior con todos los
  modelos.
- `buildDecisionSummary` marcaba al primer modelo por defecto en empates y
  seleccionaba ganadores aunque a algún candidato le faltara el dato.
- No existía función para sustituir un modelo en la misma columna.

## Trabajo realizado

- `src/data/productDecisionData.ts`:
  - `ESSENTIAL_FIELDS` reducido a máx. 8 por familia (iPhone 8, Mac 8,
    iPad 7, Watch 7, AirPods 6).
  - Nueva lista `EXTENDED_FIELDS` para las 3–4 filas adicionales del modo
    "Mostrar todas".
  - Nueva `FIELD_SECTIONS`: agrupación semántica por familia.
  - Nueva función `buildDecisionSections()` que agrupa `DecisionRow` en
    secciones ("Precio", "Pantalla y diseño", "Rendimiento"…).
  - `buildDecisionSummary`: reglas estrictas (todos deben tener dato + no
    empates). Se implementa con un helper `uniqueExtreme(items, mode)`.
- `src/lib/store.tsx`:
  - Nueva acción `replaceCompareItem(currentId, next)` — sustitución
    atómica, preserva orden, evita duplicados, respeta familia única. No
    cambia `banana:compare`.
- `src/components/compare/ModelPickerDialog.tsx` (nuevo):
  - Reutiliza `<Modal />` (focus trap, Escape, restauración de foco,
    `aria-modal`), campo de búsqueda, listado con badge "Ya añadido" /
    "En esta columna" para los slugs deshabilitados.
- `src/pages/ComparePage.tsx` (reescritura):
  - Tres slots superiores. Slots vacíos: botón "Elegir modelo" que abre
    el diálogo. Slots ocupados: imagen, nombre, capacidad, precio,
    badges "Destaca por…" (máx. 2), "Comprar", "Más información",
    "Cambiar" + favorito + "Quitar" como controles discretos.
  - `<thead>` sticky real, sin copia `aria-hidden`.
  - Tabla en `overflow-x-auto` con `scroll-snap-type: x proximity` y
    `scroll-snap-align` en cada columna.
  - Estado vacío: chip de familia, tres slots visibles, CTA al asistente.
- Tests reescritos en `tests/e2e/comparator.spec.ts` (14 escenarios).
  Baseline 18 → 99 tests verdes (chromium + mobile).

## Decisiones tomadas

- **Sustitución atómica** en lugar de eliminar + añadir. Motivo: la spec
  pedía evitar saltos visuales y duplicados. La API del store se limita a
  ese único caso (no se toca el resto).
- **Modo "Solo diferencias" por defecto** conservado. Si sólo hay un
  producto no se muestra el toggle; en su lugar aparece un aviso
  "Añade otro modelo para ver diferencias.".
- **Ganadores con "Destaca por…"** en la cabecera (máx. 2 badges) en
  lugar del bloque "Diferencias entre las opciones" antiguo, que repetía
  información. Las celdas de las filas ya no se pintan de amarillo.
- **Empate → sin badge** (regla estricta). Preferimos no mostrar ganador
  antes que asignar uno arbitrario.
- **Selector como `<Modal />`** — reutilizamos el patrón existente en
  lugar de crear otro. Focus trap, Escape y restauración de foco son
  requisito del prototipo.

## Comprobaciones

- `npm run build` verde.
- `npm run test:e2e`: **99/99** verdes (chromium + mobile).
- `git diff --check` sin espacios/blancos incorrectos.
- No se ha tocado carrito, seguro, checkout, Plan Renove, Servicio
  Técnico, guía de preparación, tienda favorita, favoritos+avisos,
  inventario demostrativo, precios ni imágenes del catálogo.

## Archivos afectados

- `src/data/productDecisionData.ts`
- `src/lib/store.tsx`
- `src/components/compare/ModelPickerDialog.tsx` (nuevo)
- `src/pages/ComparePage.tsx`
- `tests/e2e/comparator.spec.ts`
- `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-29--simplificacion-comparador.md` (este archivo)

## Siguiente paso

- PR `fix/apple-finder-recommendation-quality`: separar respuestas
  `general/family/specific`, filtros duros vs preferencias blandas,
  presupuesto por familia con flexibilidad, taxonomía AirPods
  `open`/`in-ear`/`over-ear`, nuevas etiquetas de resultado y resumen
  editable.
