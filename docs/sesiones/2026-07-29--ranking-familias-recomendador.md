---
tipo: sesion
fecha: 2026-07-29
tema: corrige la selección de familias del recomendador
---

# Corrige la selección de familias del recomendador

## Objetivo

Reparar el bug reportado en el flujo "No lo tengo claro":

- Uso: Trabajo
- Prioridad: Portabilidad
- Necesidad: Sí, lo llevaré siempre encima

El asistente proponía **AirPods e iPhone**. Debía proponer **Mac e iPad**.

## Estado inicial

- Base `2c645d0` (main tras el fix de tarjetas del comparador).
- `computeFamilyCandidates()` sumaba puntos por uso + prioridad +
  portabilidad, cada dimensión de forma independiente, y desempataba
  alfabéticamente por `family.localeCompare(...)`.

Puntuación del caso reportado (antes):

| Familia | trabajo | portability | portability high | Mac -1 | Total |
|---|---|---|---|---|---|
| Mac | +5 | 0 | 0 | −1 | 4 |
| iPad | +2 | +1 | 0 | 0 | 3 |
| iPhone | 0 | +2 | +2 | 0 | 4 |
| AirPods | 0 | +2 | +2 | 0 | 4 |
| Watch | 0 | 0 | +2 | 0 | 2 |

Empate a 4 entre Mac, iPhone y AirPods → sort alfabético → AirPods, iPhone
delante de Mac. Top 2 = AirPods, iPhone. Bug confirmado.

## Trabajo realizado

### `productDecisionData.ts`

1. **Nuevos tipos**:
   - `ProductRole = 'primary' | 'mobile' | 'accessory' | 'unknown'`.
   - `WorkType = 'office' | 'desktop-apps' | 'creative' | 'mobile-tasks' | 'unknown'`.
2. **`FinderAnswers.general`** extendido con `productRole` y `workType`.
3. **`GENERAL_QUESTIONS`** ampliado a 5 preguntas: use, productRole,
   workType, priority, portability.
4. **`getGeneralQuestionFlow(general)`** filtra dinámicamente el flujo:
   `workType` solo aparece si el uso es `trabajo`.
5. **`isFamilyEligibleForIntent(family, general)`** — clasificación
   semántica. Reglas:
   - Trabajo + primary: sin AirPods ni Watch (iPhone permitido pero
     rankeado abajo).
   - Trabajo + mobile: sin AirPods ni Watch.
   - Trabajo + accessory: solo AirPods.
   - Estudio + primary / mobile: sin AirPods ni Watch.
   - Foto + primary / mobile: sin AirPods ni Watch.
   - Audio y salud fuerzan la aparición de la familia natural aunque
     el rol no sea "accessory".
6. **`scoreFamilyForIntent(family, general)`** — puntuación separada
   con base por uso, modificador por productRole, modificador por
   workType, modificador por priority y modificador por portability
   contextual. La portabilidad ya NO premia AirPods/Watch por ser
   pequeños ni resta −1 a Mac.
7. **`FAMILY_PRIORITY_BY_USE`** — prioridad semántica por uso:
   - trabajo: mac, ipad, iphone, airpods, apple-watch
   - estudio: ipad, mac, iphone, airpods, apple-watch
   - foto: iphone, mac, ipad, airpods, apple-watch
   - audio: airpods, iphone, mac, ipad, apple-watch
   - salud: apple-watch, iphone, airpods, ipad, mac
   - diario: iphone, ipad, apple-watch, airpods, mac
8. **`computeFamilyCandidates`** rehecha: `filter(isEligible)` →
   `map(score)` → sort por `score desc`, desempate por `priorityIndex`
   asc (NO alfabético).

### `AppleFinderPage.tsx`

- `activeQuestions` en fase `general` usa `getGeneralQuestionFlow(answers.general)`.
- Navegación "atrás" desde `family-confirm`: `setStep(getGeneralQuestionFlow(answers.general).length - 1)`.
- `onEditGeneral(key)` en el resumen usa el flow dinámico para calcular
  el índice correcto.

### Tests

- `tests/e2e/apple-finder.spec.ts` — helper `answerGeneralFlow` incluye
  productRole y workType. 9 tests nuevos:
  - `BUG: trabajo + primary + portabilidad → Mac primero, iPad segundo (NO AirPods/Watch)`.
  - `trabajo + primary + desktop-apps → Mac como primera opción`.
  - `trabajo + mobile + mobile-tasks → iPad + iPhone (Mac queda fuera del top 2)`.
  - `estudio + primary + portabilidad → iPad + Mac`.
  - `foto + primary + cámara → iPhone primero, Mac o iPad segundo`.
  - `audio + accessory → AirPods primero`.
  - `salud + accessory → Apple Watch primero`.
  - `uso cotidiano + mobile → iPhone primero`.
  - `desempate NO alfabético: para trabajo AirPods no desplaza a Mac aunque empatasen`.
- Los dos tests previos de "No lo tengo claro" actualizados para
  responder también productRole y workType.

## Decisiones tomadas

- **Eligibility antes que score**. Motivo: la spec pedía que un modelo
  incompatible por rol NUNCA aparezca aunque puntúe alto en otras
  dimensiones. Se cristaliza como filtro previo.
- **Portabilidad contextual**. Motivo: era el bug raíz. Portabilidad
  alta ya no infla AirPods/Watch simplemente por ser pequeños; empuja
  a familias que ya encajan con el uso.
- **Eliminación del −1 a Mac por portabilidad alta**. Motivo: la
  familia Mac incluye portátiles y Mac mini. El filtro duro de
  portátil vs sobremesa llega en `filterEligibleModels` a nivel de
  modelo, no de familia.
- **`FAMILY_PRIORITY_BY_USE` como desempate**. Motivo: el orden
  alfabético dejaba AirPods delante de iPad y Mac en empates; ahora
  el desempate refleja qué familia es más relevante para el uso.
- **`workType` condicional**. Motivo: solo tiene sentido cuando el
  uso es trabajo; añadirlo siempre saturaba el flujo.

## Comprobaciones

- `npm run build` verde.
- `npm run test:e2e`: **116/116** (chromium + mobile). 107 base + 9
  nuevos escenarios de ranking.
- `git diff --check` limpio.
- No se ha tocado comparador, catálogo, precios, carrito, seguro,
  checkout, Plan Renove, Servicio Técnico, guía de preparación, tienda
  favorita, favoritos+avisos ni imágenes.

## Archivos afectados

- `src/data/productDecisionData.ts` — arquitectura del ranking + tipos
  nuevos + `getGeneralQuestionFlow`.
- `src/pages/AppleFinderPage.tsx` — flujo dinámico + navegación
  consistente.
- `tests/e2e/apple-finder.spec.ts` — helper `answerGeneralFlow` +
  9 tests nuevos.
- `docs/05-registro-de-cambios.md`.
- `docs/sesiones/2026-07-29--ranking-familias-recomendador.md`.

## Limitaciones

- Los tests son E2E. La lógica de ranking es determinista y puede
  cubrirse con unitarios cuando se añada un runner de tests unitarios
  (deuda de la PR #21).
- Cuando `general.productRole = 'accessory'` y el uso es "trabajo",
  Apple Watch queda excluido salvo justificación específica que
  actualmente no se recoge. Aceptado por la spec.
