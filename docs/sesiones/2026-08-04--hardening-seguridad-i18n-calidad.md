---
tipo: sesion
fecha: 2026-08-04
---

# Hardening de seguridad, i18n y calidad

## Objetivo

Consolidar las PR de seguridad pendientes y completar los cierres de
integración Supabase, traducción, accesibilidad, calidad, navegadores, PWA y
documentación solicitados en la auditoría exhaustiva.

## Estado inicial

- `main` en `30b7957`; seguridad repartida en las PR #33 y #34.
- Rama superior limpia en `c4b5162`, con 27 casos RLS aún omitidos.
- Sin Docker ni Supabase CLI local; autenticación de `gh` caducada.
- 23 avisos ESLint conocidos, React Router 6.30.4 con dos avisos moderados.

## Trabajo realizado

### Bloque 1 — Seguridad

- Creada `fix/security-i18n-quality-hardening` desde `main` e incorporados por
  avance rápido los 14 commits de seguridad existentes.
- Añadida una migración incremental: el chat deja de recopilar `user_agent`,
  limpia el dato histórico y Storage impone tamaño, MIME y nombre canónico.
- La URL firmada del justificante dura 60 segundos.
- `test:rls` ya no levanta un servidor web innecesario.
- Creado `docs/07-modelo-seguridad.md` con roles, amenazas, RPC, Storage y
  diagrama de datos.

### Bloque 2 — Integración Supabase

- CLI 2.111.0 fijada como dependencia de desarrollo.
- Añadidos configuración local, seed sin secretos y lanzador que obtiene las
  claves efímeras sin imprimirlas.
- El workflow reutilizable levanta Docker, aplica migraciones, ejecuta 27
  flujos reales y detiene los contenedores siempre.
- En esta máquina el preflight confirma el único bloqueo: Docker no está
  instalado. No se ha tocado ninguna base alojada.

### Bloque 3 — Internacionalización

- Traducidos todos los estados exigidos de SupportPage y ModelPickerDialog en
  cinco idiomas; búsqueda por nombre traducido y moneda según locale.
- El panel adopta la opción B: español con `lang="es"`, restaurado al salir.
- La regresión de idiomas pasa 11/11 sobre el build.
- El barrido descubrió más literales públicos históricos; se retira la
  afirmación de cobertura completa y se registra I18N-001 hasta corregirlos.

### Bloque 4 — Accesibilidad

- Eliminado el segundo `<main>` de `/soporte` y añadido un barrido de una sola
  región principal sobre 19 rutas públicas.
- Unificado el aislamiento del fondo en modal genérico, menú móvil, guía y
  chat; se verifica foco inicial, ciclo completo, Escape y retorno al control
  de apertura.
- Eliminado el fundido que degradaba el contraste del texto del selector
  durante la entrada y traducidos los nombres accesibles del chat.
- Axe pasa en 14 estados de ruta y en guía, selector, menú y chat, sin reglas
  desactivadas.

## Comprobaciones acumuladas

- TypeScript: correcto.
- Vitest: 124/124; esquema PostgreSQL/PGlite: 102/102.
- ESLint: 0 errores y 22 avisos preexistentes.
- Build demostrativo: correcto; service worker generado.
- RLS: 27 casos descubiertos y 27 omitidos por falta de entorno, no aprobados.

## Archivos afectados hasta ahora

- Segunda migración en `supabase/migrations/`.
- `chatSession.ts`, `educationalDiscount.ts`, Playwright y workflow.
- Pruebas de esquema y RLS.
- Documentación viva y modelo de seguridad.

## Siguiente paso

Completar el bloque de calidad con scripts coherentes, Prettier y CI; después
ampliar la matriz de navegadores y validar PWA contra el build.
