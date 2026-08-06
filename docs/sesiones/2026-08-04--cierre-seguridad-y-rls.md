---
tipo: sesion
fecha: 2026-08-04
---

# Cierre de seguridad y validación RLS

## Objetivo

Retomar la auditoría, cerrar la cadena de PR de seguridad y publicar solo
después de validar la migración contra Supabase real.

## Estado inicial

- Rama `fix/cierre-final-seguridad-supabase`, limpia y sincronizada, 11 commits
  por delante de `main`.
- PR #33 hacia `main` y PR #34 hacia la rama de #33, ambas draft y sin
  conflictos.
- CI verde en tipos, lint, build y E2E; el trabajo RLS aparecía verde, pero el
  log confirmaba que no había ejecutado ninguna prueba.
- GitHub solo tenía los secretos de la demostración. No había Supabase
  dedicado, Docker ni CLI local.

## Trabajo realizado

- Se ejecutó `npm run check`: tipos, 94 pruebas de esquema + 9 unitarias y
  build correctos; 264 E2E aprobados y uno omitido deliberadamente. ESLint
  quedó en 0 errores y 23 avisos conocidos.
- Se auditó la suite `tests/rls/` y se detectó que sus recorridos legítimos
  seguían usando la API anterior. Se actualizaron a los RPC finales y se
  ampliaron de 21 a 27 casos con agente, cierre, valoración, reservas y Storage.
- Se corrigió la limpieza: los visitantes se borran antes que los usuarios de
  Auth para evitar chats huérfanos por `ON DELETE SET NULL`.
- Se corrigieron las instrucciones SQL y la documentación viva: la única fuente
  ejecutable es `supabase/migrations/20260802000100_estado_seguro.sql`.
- En la revisión final de la PR #34 se retiró la falsa eliminación del panel,
  se alineó la UI con el rol supervisor y se conservaron separadas gestión y
  autoría de respuestas.
- Se centralizó la auditoría PostgreSQL por firma exacta y se aplicó a
  instalación, actualización e idempotencia. El verificador CI exige 27 casos
  RLS exactos y cuenta con siete regresiones unitarias.
- `revisar_descuento_educativo()` falla con `P0002` sobre un UUID inexistente.
  La suite RLS real se fortaleció sin aumentar ni reducir sus 27 casos.

## Decisiones

- No ejecutar pruebas destructivas contra el Supabase de demostración.
- No integrar ni desplegar mientras las 27 pruebas reales sigan omitidas.
- Mantener PGlite como comprobación rápida obligatoria, pero no presentarlo
  como sustituto de GoTrue, PostgREST y Storage.

## Comprobaciones

- `npm run typecheck`: correcto tras actualizar el arnés.
- `npx eslint tests/rls/politicas.spec.ts`: sin incidencias.
- `npm run test:rls`: 27 omitidas con motivo explícito por
  falta de los tres secretos.
- `npm run check`: correcto en la primera revisión (103 Vitest, build y
  264 E2E aprobados; 1 E2E omitido deliberadamente).
- Revisión final: 114 Vitest (98 de esquema), 264 E2E generales y 6 E2E del
  panel aprobadas; 23 avisos de lint y 0 errores. Los 27 casos RLS se descubren
  y se omiten por falta de credenciales dedicadas.
- El workflow se parseó como YAML y `git diff --check` no detectó errores.

## Archivos afectados

- `tests/rls/politicas.spec.ts`, `tests/rls/README.md`.
- `src/pages/AgentPage.tsx`, `src/lib/chatSession.ts`,
  `tests/e2e-agent/` y `playwright.agent.config.ts`.
- `tests/schema/`, `scripts/verificar-rls.mjs` y
  `scripts/lib/verificar-rls.mjs`.
- `supabase/migrations/20260802000100_estado_seguro.sql`.
- `AGENTS.md`, `README.md` y `docs/00` a `docs/05` relacionados.

## Pendiente y siguiente paso

Crear o proporcionar un proyecto Supabase dedicado, aplicar la migración,
activar Anonymous sign-ins y desactivar confirmación de email; configurar
`RLS_TEST_URL`, `RLS_TEST_ANON_KEY` y `RLS_TEST_SERVICE_KEY`; ejecutar 27/27.
Solo entonces integrar #33 y #34, migrar la demostración, desplegar Pages y
comprobar la URL pública y el chat.
