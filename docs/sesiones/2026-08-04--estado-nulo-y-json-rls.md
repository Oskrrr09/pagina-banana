---
tipo: sesion
fecha: 2026-08-04
---

# Estado nulo e informe JSON RLS

## Objetivo

Cerrar los dos hallazgos residuales de la PR #34: el estado `NULL` en la
revisión educativa y la posible contaminación del informe JSON por `npm run`.

## Estado inicial

- Rama `fix/cierre-final-seguridad-supabase` limpia en `fde3b42`.
- El RPC validaba con `p_estado not in (...)`, que no rechaza `NULL` en SQL.
- El workflow redirigía a `rls.json` la salida estándar de `npm run`.
- La PR seguía en borrador y las 27 pruebas RLS reales continuaban sin
  infraestructura dedicada.

## Trabajo realizado

- Se añadió `p_estado is null` antes de modificar la ficha y se conservaron la
  autorización y el error `P0002` para clientes inexistentes.
- PGlite compara estado, nota, fecha y revisor ante `NULL` y `aprobada`; el caso
  RLS existente hace la misma comparación contra Supabase sin pasar de 27.
- CI invoca Playwright directamente, captura su código y el verificador valida
  existencia, contenido no vacío y JSON estricto antes del recuento.
- Las regresiones cubren el encabezado exacto de npm, JSON vacío, roto e
  inexistente, código no cero y recuentos distintos de 27.

## Comprobaciones

- Regresión previa: 2 fallos sobre `fde3b42` —estado `NULL` aceptado y comando
  del workflow todavía indirecto—.
- `npm ci`, TypeScript, build y `npm run check`: correctos.
- ESLint: 0 errores y 23 avisos preexistentes.
- Vitest: 122/122 en 5 archivos; esquema: 100/100; verificador: 13/13.
- E2E: 264 aprobadas y 28 omitidas en la ejecución completa; panel 6/6.
- RLS: 27 descubiertas, 0 ejecutadas, 0 aprobadas y 27 omitidas.
- `npm audit`: 2 vulnerabilidades moderadas ya registradas en SEG-001.
- `git diff --check`: correcto.

## Archivos afectados

- `.github/workflows/ci.yml`, `scripts/verificar-rls.mjs` y
  `scripts/lib/verificar-rls.mjs`.
- `supabase/migrations/20260802000100_estado_seguro.sql`.
- `tests/unit/verificar-rls.test.ts`, `tests/schema/politicas.test.ts` y
  `tests/rls/politicas.spec.ts`.
- README y documentación viva relacionada.

## Pendiente y siguiente paso

La PR debe seguir en borrador. Hace falta un Supabase dedicado, aplicar allí la
migración y obtener 27 descubiertas, ejecutadas y aprobadas sin fallos,
inestables ni omisiones antes de integrar o desplegar.
