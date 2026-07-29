---
tipo: sesion
fecha: 2026-07-29
tema: asistente "Encuentra tu Apple" (PR2 del bloque diferencial)
---

# Asistente "Encuentra tu Apple"

## Objetivo

Crear una experiencia guiada en `/elige-tu-apple` que ayude a
seleccionar productos del catálogo con reglas + puntuación
determinista, sin IA real, backend ni persistencia obligatoria.

## Cambios

- `src/data/productDecisionData.ts`:
  * `ModelDecisionMeta` amplía niveles y flags.
  * `FINDER_QUESTIONS` por familia (3-4 preguntas + presupuesto).
  * `GENERAL_QUESTIONS` para el flujo "No lo tengo claro".
  * `scoreModel(model, answers)` puro (razones positivas +
    compromisos) con desempate estable.
  * `computeFinderResults(models, answers)` → 3 tarjetas
    etiquetadas.
- Nueva `src/pages/AppleFinderPage.tsx` (3 fases: intro,
  preguntas, resultados) con radiogroups accesibles.
- `src/App.tsx` añade la ruta `/elige-tu-apple`.
- Accesos: portada, `utilityLinks`, comparador, favoritos.

## Metadata añadida por modelo

- **iPhone**: 17 Pro Max, 17 Pro, Air, 17 con niveles y
  strengths.
- **Mac**: 8 modelos (Neo, Air 13/15, Pro 14/16, iMac, mini,
  Studio).
- **iPad**: Pro, Air, mini, A16 con `supportsPencil`/
  `supportsKeyboard`.
- **Apple Watch**: Ultra 3, Series 11, SE 3 con `hasCellular`.
- **AirPods**: Pro 3 (intraural, ANC), Max (circumaural, ANC).

## Puntuación (resumen)

- Prioridad genérica (camera/battery/performance/portability/
  value): score `level × 3` y añade razón cuando `level === 3`.
- Uso: sumandos según pareja uso → nivel más relevante.
- Preguntas específicas: tamaño iPhone, forma Mac (portable/
  desktop), Pencil/Keyboard iPad, Cellular Watch, ajuste
  AirPods.
- Presupuesto: penaliza (-5) precios por encima del límite y
  añade caveat con el máximo formateado; suma +1 si entra.
- Fortalezas declaradas rellenan hasta 3 positives cuando el
  usuario aporta pocas restricciones.

## Comportamiento

- Sin `localStorage`, `sessionStorage`, cookies ni red.
- Determinista: mismas respuestas producen mismos resultados y
  mismo orden (verificado con test dedicado).
- Presupuesto por encima no oculta: se etiqueta como
  "Alternativa más avanzada" con un caveat.

## Tests

- Nueva `tests/e2e/apple-finder.spec.ts` (8):
  1. Acceso desde la portada.
  2. Flujo iPhone completo con reinicio.
  3. "Siguiente" desactivado sin respuesta + "Anterior" restaura.
  4. "No lo tengo claro" pasa por generales antes de específicas.
  5. Determinismo entre ejecuciones.
  6. "Comparar estas opciones" envía al comparador.
  7. Sin scroll horizontal a 375 px.
  8. axe limpio en la intro.
- Actualizado `tests/e2e/comparator.spec.ts` para el CTA activo.
- Total suite: 73 → 82.

## Resultados

- `npm run build`: correcto.
- `npm run test:e2e`: 82/82 en verde.

## Archivos

- `src/data/productDecisionData.ts`
- `src/pages/AppleFinderPage.tsx` (nueva)
- `src/App.tsx`
- `src/data/nav.ts`
- `src/pages/Home.tsx`, `src/pages/ComparePage.tsx`,
  `src/pages/FavoritesPage.tsx`
- `tests/e2e/apple-finder.spec.ts` (nueva)
- `tests/e2e/comparator.spec.ts`
- `README.md`, `docs/03-roadmap.md`,
  `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-29--asistente-elige-tu-apple.md`

## Fuera de alcance

- Tienda favorita (PR3).
- Favoritos + avisos (PR4).
- Sin cambios en seguro, checkout, catálogo, Plan Renove,
  Servicio Técnico ni scripts privados.
