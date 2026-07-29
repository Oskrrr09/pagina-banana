---
tipo: sesion
fecha: 2026-07-29
tema: casos límite del asistente Encuentra tu Apple
---

# Casos límite del asistente

## Objetivo

Cerrar los siete casos límite pendientes tras la PR #22 sin rediseñar el
asistente:

1. `workType` puede conservarse tras cambiar el uso a algo distinto de
   Trabajo.
2. El resumen puede pintar preguntas ya no aplicables.
3. Fotografía + complemento puede recomendar dispositivos principales.
4. Sin candidatas, se inyecta iPhone arbitrariamente
   (`{ family: 'iphone', score: 0, reasons: [] }`).
5. `FAMILY_ROLE_TAGS` es código muerto (definido y con `void` inalcanzable
   tras `return`).
6. El registro sigue marcando como "PR pendiente" cosas ya fusionadas
   (#20, #21, #22).
7. Faltan pruebas E2E de regresión para todos los puntos anteriores.

## Estado inicial

- Base `714769b` (main). Suite base: **116/116**.
- `setGeneral` fusionaba respuestas sin limpiar dependencias.
- `SummaryStep.generalRows` iteraba `Object.keys(answers.general)`.
- `isFamilyEligibleForIntent` para `use='foto'` con `role='accessory'`
  caía en `return true`.
- `computeFamilyCandidates` sin fallback pero `AppleFinderPage.goNext`
  lo agregaba: `cands.length > 0 ? cands : [{ family: 'iphone', ... }]`.
- `FAMILY_ROLE_TAGS` definido en `productDecisionData.ts` y referenciado
  como `void FAMILY_ROLE_TAGS` después del `return` de
  `computeFamilyCandidates`.

## Trabajo realizado

### `src/pages/AppleFinderPage.tsx`

- `setGeneral` reescrita: al cambiar `use` a un valor distinto de
  `'trabajo'`, se hace `delete nextGeneral.workType`. Sin `any`, sin
  segunda actualización de estado. La clave desaparece del objeto (no
  queda como `undefined`).
- `SummaryStep.generalRows`: se construye a partir de
  `getGeneralQuestionFlow(answers.general)` — respeta orden real,
  oculta preguntas no aplicables, filtra filas sin respuesta.
- `goNext` en la transición `general → family-confirm`: se elimina el
  fallback. Ahora `setCandidates(computeFamilyCandidates(...))`
  directamente, sin ternario.
- `FamilyConfirmStep` recibe `general` y `onReviewAnswers`. Con 0
  candidatas pinta el estado sin coincidencias (título "No encontramos
  una categoría que encaje con todo", mensaje específico para
  foto+accessory, `aria-live="polite"`, botones "Revisar respuestas",
  "Ver todas las categorías" y "← Atrás"). Con 1 candidata pinta una
  única `CandidateCard` sin placeholder. Con 2 mantiene el layout de
  antes.
- `onReviewAnswers` en `AppleFinderPage` calcula el índice de
  `general.productRole` mediante `getGeneralQuestionFlow(answers.general).findIndex`
  y navega a esa pregunta preservando todas las respuestas.
- Import de `GENERAL_QUESTIONS` retirado (ya no se usa).

### `src/data/productDecisionData.ts`

- `isFamilyEligibleForIntent`: para `use === 'foto'` +
  `role === 'accessory'`, devuelve `false` para todas las familias.
- `FAMILY_ROLE_TAGS` (constante) eliminada.
- `void FAMILY_ROLE_TAGS` (referencia inalcanzable tras `return`)
  eliminada.

### `tests/e2e/apple-finder.spec.ts`

- 5 tests nuevos:
  - `workType se limpia al cambiar el uso a un valor distinto de
    Trabajo` — recorre el flujo completo con workType, cambia el uso
    desde el resumen y valida que la fila de workType ya no aparece.
  - `SummaryStep no muestra "¿Qué tipo de trabajo?" cuando el uso no
    es Trabajo` — flujo Estudio con confirmación de familia y llegada
    al resumen.
  - `Fotografía + complemento muestra estado sin coincidencias`.
  - `Revisar respuestas: conserva respuestas y permite cambiar el rol
    para volver a tener candidatas`.
  - `Ver todas las categorías desde estado sin coincidencias abre el
    selector manual` — comprueba además que ninguna familia queda
    pre-marcada.

### Documentación

- `docs/05-registro-de-cambios.md`:
  - PRs #20, #21 y #22 pasan de "PR pendiente" a "PR #NN".
  - Nueva entrada "Casos límite del recomendador (PR pendiente)"
    resumiendo los siete cambios.
- Esta nota de sesión.

## Decisiones tomadas

- **Delete vs undefined**. Motivo: si dejamos `workType: undefined`
  hay riesgo de que futuras búsquedas por `key in general` fallen. Con
  `delete` la clave desaparece por completo del objeto persistente.
- **SummaryStep basado en el flujo, no en `Object.keys`**. Motivo:
  respetar el orden real, evitar filas de respuestas antiguas y
  centralizar la fuente de la verdad en `getGeneralQuestionFlow`.
- **`foto + accessory` devuelve `false` para todas las familias**.
  Motivo: el catálogo del prototipo no incluye accesorios fotográficos.
  Preferimos ser honestos con un estado sin coincidencias antes que
  inflar AirPods o Watch como "accesorios fotográficos".
- **Sin fallback silencioso a iPhone**. Motivo: el fallback ocultaba
  el problema y presentaba una "Recomendación principal" con score 0
  y sin razones. Ahora el estado sin coincidencias es explícito.
- **`FAMILY_ROLE_TAGS` fuera**. Motivo: no participa en elegibilidad,
  scoring, razones ni interfaz. Su comentario decía "queda implícita"
  y estaba después de un `return`. Es código muerto por definición.

## Comportamiento verificado

- **0 candidatas** (`foto + accessory`): estado sin coincidencias con
  mensaje específico y CTAs Revisar / Ver todas / Atrás. Sin tarjetas.
  Sin "Recomendación principal".
- **1 candidata**: única `CandidateCard` como "Recomendación
  principal", ancho `md:max-w-md`, sin placeholder de segunda.
- **2 candidatas**: layout `md:grid-cols-2` de siempre.
- **Cambiar `use` desde el resumen** a un valor distinto de Trabajo:
  `workType` desaparece del estado y del resumen.

## Casos que se han preservado

- Trabajo + primary + portable + ofimática → Mac + iPad.
- Trabajo + primary + programación → Mac.
- Trabajo + mobile + mobile-tasks → iPad + iPhone.
- Estudio + primary + portable → iPad + Mac.
- Foto + primary + cámara → iPhone.
- Audio + accessory → AirPods.
- Salud + accessory → Watch.
- Diario + mobile → iPhone.
- Desempate no alfabético.

## Comprobaciones

- `npm run build` verde.
- `npm run test:e2e`: **121/121** (chromium + mobile). 116 base + 5
  nuevos.
- `git diff --check` limpio.
- `grep FAMILY_ROLE_TAGS src` sin resultados.
- `grep "family: 'iphone', score: 0" src tests` sin resultados.
- `grep "PR pendiente" docs/05-registro-de-cambios.md` solo aparece
  la entrada en curso.

## Archivos afectados

- `src/data/productDecisionData.ts` — eligibilidad foto+accessory +
  eliminación de código muerto.
- `src/pages/AppleFinderPage.tsx` — `setGeneral`, `goNext`,
  `SummaryStep`, `FamilyConfirmStep`, `onReviewAnswers`.
- `tests/e2e/apple-finder.spec.ts` — 5 tests nuevos.
- `docs/05-registro-de-cambios.md`.
- `docs/sesiones/2026-07-29--casos-limite-recomendador.md`.

## Cierre

- PR **#23** — `fix/finder-edge-cases-cleanup`.
- Commit funcional `fe07b40d8bcd2b2a38430c24fb9cc68902297158`.
- Merge `67d26b9f5e5065a1e30d04e5c49f2e91c42996a8`.
- Workflow E2E correcto (`pass 3m44s` en el commit de merge).
- Suite estable en **121/121** (chromium + mobile).

## Pendientes reales

- Runner de tests unitarios (Vitest) para cubrir la matriz completa
  de `isFamilyEligibleForIntent` y `computeFamilyCandidates` sin
  necesidad de conducir la UI. Añadirlo implicaría una dependencia
  nueva, fuera del alcance de esta PR.
