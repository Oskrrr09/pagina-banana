---
tipo: sesion
fecha: 2026-07-29
tema: limpieza release candidate y mantenimiento técnico
---

# Limpieza release candidate y mantenimiento técnico

## Objetivo

Dejar el prototipo como versión candidata a presentación mediante
una PR pequeña, sin cambios de interfaz ni de lógica de negocio:

1. Corregir documentación desactualizada o contradictoria.
2. Eliminar `tsconfig.tsbuildinfo` del repositorio y añadir
   `*.tsbuildinfo` a `.gitignore`.
3. Configurar Node.js 24 explícitamente en CI y Pages, añadir
   `.nvmrc` y documentarlo.
4. Reverificar `npm audit` / `npm outdated` sin cambiar
   dependencias.
5. Actualizar `docs/03-roadmap.md`, `docs/04-problemas-pendientes.md`,
   `docs/00-estado-actual.md` y `docs/05-registro-de-cambios.md`.

## Rama

`chore/release-candidate-cleanup`, salida de
`main = 78c3889495180747499c460cbdd6621d5f35552d` (PR #14).

## Estado base

- Working tree limpio antes de empezar.
- `main` = `78c38894…` (PR #14 fusionada el 2026-07-29).
- `tsconfig.tsbuildinfo` estaba trackeado.
- Workflows con `node-version: 20`.
- QA-001 declaraba a la vez que axe estaba integrado y que
  "integrar axe" seguía pendiente.

## Incoherencias corregidas

- `docs/03-roadmap.md`: fecha `actualizado` al 2026-07-29; orden de
  preparación (copia → antirrobo → Buscar); descripción del bloque
  de Servicio Técnico como página propia; retirada del nombre del
  proveedor externo del Plan Renove; axe marcado como integrado
  (no pendiente).
- `docs/04-problemas-pendientes.md`: QA-001 sin la contradicción
  final ("integrar axe" ya no aparece como pendiente); SEG-001
  con evidencia real del 2026-07-29 y "No fix available" dentro
  de 6.x; CI-001 resuelto en código; nuevo ARTEFACTOS-001 cerrado.
- `README.md`: fila `/plan-renove` sin proveedor externo; Node 24
  en la tabla de stack; sección de arranque con `nvm use`; axe
  descrito como "ocho rutas más la guía interactiva".
- `docs/00-estado-actual.md`: referencia actualizada a PR #14 y
  SHA `78c38894`, con la mención de Node 24, `.nvmrc`, axe y el
  estado real de dependencias.

## Decisión de mantener React Router 6.30.4

Documentada en SEG-001. La corrección oficial requiere migrar a
React Router 7 (mayor). Fuera del alcance de esta PR. Se
mantiene `react-router-dom@6.30.4` sin cambios en `package.json`
ni `package-lock.json`; no se ha ejecutado `npm audit fix` ni
`--force`.

## Resultados de comandos (resumen)

- `node --version`: `v26.0.0` (entorno local; CI usa Node 24).
- `npm --version`: `11.15.0`.
- `npm ci`: correcto.
- `npm outdated`: 9 paquetes con `latest` mayor (`react`,
  `react-dom`, `react-router-dom`, `motion`, `vite`,
  `typescript`, `@types/react*`, `@vitejs/plugin-react`). En
  todos, `wanted == current`, así que no hay update compatible
  con el rango semver actual y no se aplica ninguno.
- `npm audit` y `npm audit --omit=dev`: **2 vulnerabilidades
  moderadas** en `react-router` (GHSA-wrjc-x8rr-h8h6 y
  GHSA-337j-9hxr-rhxg), sin fix dentro de 6.x.
- `npm ls react-router react-router-dom`:
  `react-router-dom@6.30.4 → react-router@6.30.4`.

## Actualización a Node 24

- `.github/workflows/e2e.yml`: `node-version: 24` con
  `cache: npm`.
- `.github/workflows/deploy.yml`: `node-version: 24` con
  `cache: npm`.
- Nuevo `.nvmrc` en la raíz con `24`.
- README con `nvm use` y "Node.js 24 en GitHub Actions" en el
  apartado de arranque.
- Sin cambios en eventos, permisos, concurrencia, secretos ni
  pasos de instalación de Chromium.

## Limpieza de TypeScript

- `git rm tsconfig.tsbuildinfo` (retirado del índice).
- `.gitignore` incluye `*.tsbuildinfo`.
- Comprobado con `git ls-files | grep -E '\.tsbuildinfo$'` →
  vacío.
- `git check-ignore -v tsconfig.tsbuildinfo` → coincide con la
  nueva regla del `.gitignore`.
- El archivo se regenera localmente con `tsc -b` (paso
  `npm run build`).

## Validaciones locales

- `npm run build`: correcto tras la limpieza.
- `npm run test:e2e`: 64/64 en verde (sin cambios de comportamiento).
- `git diff --check`: limpio.

## Confirmaciones

- `src/`, `tests/`, `playwright.config.ts`, `scripts/`,
  `public/`, `CartPage.tsx`, `CheckoutPage.tsx`,
  `PlanRenovePage.tsx`, `ServiceTechnicalPage.tsx`,
  `DevicePreparationGuide.tsx` y toda la lógica del seguro
  quedan **intactos** (verificado con `git diff --name-only`).
- No se ha añadido ni retirado ninguna dependencia.
- No se ha versionado ningún archivo privado
  (`git ls-files | grep -E '(\.auth|storageState|audit-private|session\.json)'`
  sigue vacío).

## Commit / PR / workflow

Se completan al final de la sesión con los IDs reales.

## Pendientes reales

- **SEG-001** — abierto. Requiere evaluar migración a React Router
  7 fuera de esta PR.
- **QA-001** — solo queda ampliar la cobertura axe al detalle de
  tienda (`/tiendas/:slug`).
- **CI-001** — cerrado en código; validación final con los
  workflows de la propia PR.
- Barra sticky "Total — Continuar" en el checkout móvil.
- Contenido comercial y de tiendas pendiente de validación por
  Banana Computer / Foxway.
