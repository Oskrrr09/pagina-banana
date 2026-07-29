---
tipo: sesion
fecha: 2026-07-29
tema: calidad del asistente "Encuentra tu Apple"
---

# Calidad del asistente "Encuentra tu Apple"

## Objetivo

Convertir el asistente en una herramienta de decisión útil, no en un
recomendador que devuelva "el más caro / el más barato". Los objetivos
explícitos del usuario:

- respuestas generales y específicas no deben pisarse;
- "No lo tengo claro" debe pedir confirmación de la familia;
- filtrar antes de puntuar los productos incompatibles;
- taxonomía AirPods clara (abierto / in-ear / de diadema);
- presupuesto por familia con flexibilidad;
- alternativas "Mejor relación calidad-precio" y "Otra opción" con
  criterios reales (no simplemente precio);
- razones y compromisos personalizados;
- resumen editable antes de calcular;
- si ninguna opción cumple, explicarlo con transparencia.

## Estado inicial

- Base `acb1670` (merge del PR simplificación comparador).
- Todas las respuestas viajaban en un `Record<string, string>` plano,
  con IDs `use`, `priority`, `size`, etc. Compartidas entre general y
  específica, con solapamientos.
- "No lo tengo claro" inferría silenciosamente la familia con un mapa
  `GENERAL_USE_TO_FAMILY`.
- Presupuesto compartido (500/1000/1500/sin límite) para todas las
  familias.
- `scoreModel()` mezclaba filtro duro y preferencia blanda: modelos
  incompatibles podían aparecer si tenían mucho score en otras
  dimensiones.
- Roles: "Nuestra recomendación", "Alternativa más económica",
  "Alternativa más avanzada". La económica podía ser solo la más
  barata; la avanzada solo la más cara.
- `positives` se rellenaba con `strengths` genéricos.
- AirPods usaban `fitType: 'intraural' | 'circumaural'`, con AirPods 4
  y Pro clasificados como "intraural" pese a que 4 son abiertos.

## Trabajo realizado

### productDecisionData.ts

- Nuevos tipos: `AirPodsFit`, `MacFormFactor`, `FinderAnswers`,
  `BudgetFlex`, `BudgetOption`, `FamilyCandidate`, `FinderComputation`,
  `FinderRole` (`best-fit`/`best-value`/`other`).
- `MODEL_META` ampliado: `airpodsFit`, `macFormFactor`, `sizeCategory`.
  AirPods 4/4 ANC → `open`; AirPods Pro → `in-ear`; AirPods Max →
  `over-ear`. Macs marcados como `portable`/`desktop`. iPhone
  clasificados como `compact`/`balanced`/`large`.
- `FINDER_QUESTIONS` con IDs prefijados por familia (`iphone.use`,
  `mac.form`, `airpods.fit`…). `airpods.fit` con 4 opciones (open /
  in-ear / over-ear / me da igual).
- `GENERAL_QUESTIONS` con prefijo `general.*` y nueva pregunta
  "portabilidad" (`general.portability`).
- `BUDGET_FLEX_QUESTION` (strict / flex / reference).
- `getBudgetOptionsForFamily(family, models)` — bandas calculadas
  desde los precios reales, con paso 25 € (AirPods), 50 € (Watch) o
  100 € (resto). Añade "Sin límite".
- `computeFamilyCandidates(general)` — puntúa las cinco familias en
  función de uso + prioridad + portabilidad. Devuelve las 2 con score
  positivo. No decide sola.
- `filterEligibleModels(models, answers)` — restricciones duras.
  Devuelve `{ eligible, excluded }` con motivo por descarte.
- `scoreEligibleModel(model, answers)` — preferencias blandas.
  Presupuesto de referencia penaliza proporcionalmente en vez de
  restar 5 fijos.
- `buildRecommendationReasons(model, answers)` /
  `buildRecommendationCaveats(model, answers)` — razones y
  compromisos derivados de las respuestas concretas.
- `computeFinderResults(models, answers): FinderComputation` — pipeline
  completo con umbrales (best-value ≥ 70 % del top; other ≥ 75 %) y
  `noMatch` cuando no hay elegibles.

### AppleFinderPage.tsx (rewrite)

- Nuevo estado `FinderAnswers` con `emptyAnswers()`.
- Stages: `intro → family → (general → family-confirm) → specific →
  budget → budgetFlex → summary → results`.
- Pantalla `FamilyConfirmStep` con dos `CandidateCard` (recomendación
  principal + segunda posibilidad), botón "Ver todas las categorías" y
  botón "← Atrás".
- Nueva pantalla `BudgetStep` con opciones calculadas por familia.
- Nueva pantalla `SummaryStep` "Esto es lo que buscas" con una fila
  por respuesta y "Cambiar" en cada una.
- `ResultsStep` con roles `best-fit` / `best-value` / `other`,
  cabecera "Encaja contigo porque" / "Ten en cuenta", nota final
  con `eligibleCount`. Vista `noMatch` con acciones "Revisar
  respuestas", "Ampliar presupuesto y probar" y "Empezar de nuevo".

### Tests

- `tests/e2e/apple-finder.spec.ts` reescrito con 16 escenarios:
  flujos completos, filtros duros (Mac portátil/sobremesa, AirPods
  fit), confirmación de familia con dos candidatas, resumen editable,
  presupuesto estricto que no muestra caveats "por encima",
  determinismo, comparar y axe. Suite: **107/107** (99 → 107).

## Decisiones tomadas

- **Namespaces por familia** en vez de un `{use, priority}` compartido.
  Motivo: evitar por diseño el bug reportado; las respuestas generales
  y específicas ya no comparten claves.
- **Pantalla explícita de confirmación** en "No lo tengo claro" en vez
  de inferir. Motivo: la spec pedía no elegir silenciosamente; la
  confirmación permite volver atrás sin perder respuestas.
- **Filtro duro ≠ scoring**. Motivo: un iPad sin Pencil no debe
  aparecer si el usuario dice "Pencil imprescindible" aunque puntúe
  alto por otras dimensiones.
- **Bandas de presupuesto derivadas del catálogo**. Motivo: 500/1000/
  1500 € pierden sentido para AirPods (todos <300 €) y para Mac Studio
  (>2000 €). Se generan con `Math.ceil(price / step) * step` con paso
  específico por familia.
- **`best-value` con ratio score/precio + tope por precio del top**.
  Motivo: no queríamos que "más barato" fuera automáticamente la
  alternativa. Ahora es "el que mejor equilibra encaje y precio".
- **`other` con umbral 75 %**. Motivo: si el tercer resultado no
  llega al 75 % del mejor, no lo mostramos — a veces sólo hay una
  o dos opciones que realmente encajan.
- **AirPods `open`/`in-ear`/`over-ear`** con clasificación estricta.
  Antes AirPods 4 aparecía como "intraural" y podía recomendarse a
  alguien que decía "in-ear"; ahora se filtra.

## Comprobaciones

- `npm run build` verde.
- `npm run test:e2e` → **107/107** (chromium + mobile).
- `git diff --check` limpio.
- No se ha tocado carrito, seguro, checkout, Plan Renove, Servicio
  Técnico, guía de preparación, tienda favorita, favoritos+avisos,
  inventario demostrativo, precios ni imágenes del catálogo. Tampoco
  `src/lib/store.tsx` (esta PR no lo requiere).

## Archivos afectados

- `src/data/productDecisionData.ts` — nueva arquitectura del asistente
  (mantiene intacto el bloque del comparador).
- `src/pages/AppleFinderPage.tsx` — rewrite con nueva máquina de
  estados y nuevas pantallas.
- `tests/e2e/apple-finder.spec.ts` — 16 escenarios nuevos.
- `docs/05-registro-de-cambios.md`
- `docs/sesiones/2026-07-29--calidad-recomendador.md` (este archivo)

## Limitaciones conocidas

- Los tests de calidad son E2E — no importan directamente
  `productDecisionData.ts` porque la infraestructura actual no incluye
  un runner de tests unitarios (Vitest); añadirlo estaba fuera del
  scope. Los tests E2E cubren los invariantes clave (filtros duros,
  roles nuevos, no-match). Añadir Vitest queda como deuda para una
  futura PR.
- La pantalla de confirmación asume mínimo 2 candidatos. Si sólo hay 1
  con score positivo, se pinta solo el principal (correcto).

## Siguiente paso

- (opcional) Añadir Vitest y mover parte de los tests de calidad a
  unitarios para acelerar el feedback y cubrir combinatorias sin
  simular la UI.
- (opcional) Personalizar las razones incluso más (p. ej. mencionar
  el ahorro real vs el best-fit en euros).
