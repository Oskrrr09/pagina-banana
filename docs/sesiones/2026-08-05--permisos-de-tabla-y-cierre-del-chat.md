---
tipo: sesion
fecha: 2026-08-05
tema: permisos de tabla, cierre del chat y avisos de dependencias
---

# Permisos de tabla, cierre del chat y avisos de dependencias

## Objetivo

Poner en verde el CI de la PR #35 sin desactivar ni relajar ninguna prueba:
27/27 en las pruebas RLS contra Supabase local, cierre correcto del diálogo del
chat en WebKit y Safari móvil, y análisis de los dos avisos `high` de `npm ci`.

## Estado inicial

Compilación, lint, typecheck, unitarias, build, accesibilidad e i18n en verde.
La integración de Supabase local arrancaba y descubría las 27 pruebas RLS, pero
daba 10 aprobadas y 17 fallidas; muchos fallos apuntaban a que los usuarios de
prueba no obtenían fila en `public.clientes`, y el alta administrativa del
agente caía con `permission denied for table agentes`. Playwright terminaba con
293 aprobadas, 1 omitida y 2 fallidas —WebKit y Safari móvil, el mismo caso del
chat—.

## Trabajo realizado

Esta máquina no tiene Docker, así que las 27 pruebas no podían ejecutarse aquí.
Se reprodujeron las dos causas por otro camino, ambas contra software real.

**Permisos de tabla.** Un guion con PGlite imitó el proyecto de Supabase —roles
`anon`, `authenticated` y `service_role` creados, sin conceder nada a mano— y
aplicó las migraciones. Resultado: las siete tablas sin un solo permiso, y los
mensajes exactos del CI, incluido `permission denied for table agentes`.

La causa es que las migraciones nunca concedían nada: se apoyaban, sin
decirlo, en las *default privileges* de Supabase, que las fijó otro rol antes y
no alcanzan a las tablas que crea la migración. RLS filtra filas *después* del
permiso de tabla, así que ninguna política llegaba a evaluarse; y `service_role`
salta RLS por BYPASSRLS pero no salta los GRANT.

El síntoma engañaba por partida doble. Las pruebas negativas seguían pasando
—un permiso denegado también es un error—, de modo que sólo caían los
recorridos legítimos. Y `tests/schema/andamio.ts` se concedía esos permisos a
sí mismo antes de aplicar las migraciones, así que el arnés de esquema
respondía en verde mientras Supabase local estaba en rojo.

**Cierre del chat.** El caso pasa aislado en los cuatro navegadores, también
contra el artefacto compilado. Anulando `requestAnimationFrame` falla igual que
en CI, y falla también en Chromium: el desmontaje del panel colgaba sólo de
`onTransitionEnd`, y si el navegador no entrega el rAF que activa la clase
visible —ventana ocluida o *throttled*—, al cerrar no hay cambio de estilo, ni
transición, ni evento.

**Dependencias.** Los dos avisos `high` son el mismo, contado en `react-router`
y en su dependiente.

## Decisiones tomadas

- [[02-decisiones#D-056]]: los permisos se conceden en la migración, línea por
  línea como reflejo de cada política. Donde el esquema dice «NO hay INSERT
  directo», no hay GRANT.
- [[02-decisiones#D-057]]: el arnés de PGlite deja de concederse permisos. Un
  arnés que se concede lo que va a medir no mide nada.
- [[02-decisiones#D-058]]: se permanece en React Router 7.18.2.
  `GHSA-qwww-vcr4-c8h2` alcanza sólo a las APIs RSC inestables, que esta SPA no
  usa —importa sólo la API declarativa—. Bajar a 7.11.0 no limpia el árbol:
  cambia el aviso por `GHSA-2j2x-hqr9-3h42`, redirección abierta, también
  `high`. Ninguna 7.x está sin aviso.
  **Corrección del 2026-08-06:** esta nota añadía que «la 8.3.0 corregida no
  está publicada». Era falso: `react-router@8.3.0` salió el 2026-07-22. El
  error vino de consultar `react-router-dom`, que se queda en 7.18.2 porque la
  8 retira ese paquete. La decisión no cambia, pero el motivo sí: no se
  actualiza porque la 8 exige Node ≥ 22.22.0, React/React DOM ≥ 19.2.7 y dejar
  `react-router-dom`, lo que la convierte en una migración con suite propia
  —[[03-roadmap#5.1 Migración a React Router 8]]— y no en un salto de versión.
- El desmontaje del chat pasa a garantizarlo un temporizador de la misma
  duración que la animación; `transitionend` sólo lo adelanta cuando llega.
- `clienteRegistrado()` comprueba el error del alta. No se relajó ninguna
  prueba: se añadió una comprobación que faltaba.

## Comprobaciones

- Prettier, ESLint (0 errores), TypeScript: sin incidencias.
- Vitest: 159 aprobadas en 8 ficheros, incluidas las 34 nuevas de permisos.
- `npm run build:test`: correcto.
- Playwright contra el artefacto compilado en Chromium, Firefox, WebKit, móvil
  y Safari móvil: **296 aprobadas, 1 omitida, 0 fallidas**. La omisión es el
  caso exclusivo del servidor de desarrollo.
- Panel de agentes aislado: 6 aprobadas.
- Las 27 pruebas RLS **no pueden ejecutarse en esta máquina**: exigen Docker.
  Las ejecutó CI en tres pasadas. La primera con la migración de permisos pasó
  de 10/27 a **26/27**; la segunda, tras corregir el pedido de prueba,
  **27/27**; la tercera dejó todo el CI en verde.
- CI, run 31053972151: los cuatro trabajos en verde. 27/27 RLS contra GoTrue,
  PostgREST y Storage reales, más el cierre de sesión PWA.

## Lo que aparecía al ir destapando capas

Cada arreglo dejaba ver el siguiente, porque el fallo anterior impedía llegar
hasta él.

- Con los permisos concedidos, «un cliente no puede leer los pedidos de otro»
  falló por su cuenta: el pedido de prueba no traía `delivery` ni
  `payment_method`, que son NOT NULL sin valor por defecto, y tampoco se miraba
  el error del insert. La prueba moría al leer el `id` de un pedido inexistente.
- Con las 27 en verde, el mismo trabajo llegó por fin al cierre de sesión PWA,
  que nunca se había ejecutado. Y falló por un defecto real de la web:
  [[04-problemas-pendientes#QA-CUENTA-001 — Cerrar sesión devolvía al login en vez de a la portada]].

## Archivos afectados

- `supabase/migrations/20260805000300_permisos_de_tabla.sql` (nuevo)
- `tests/schema/permisos.test.ts` (nuevo)
- `tests/schema/andamio.ts`, `tests/schema/politicas.test.ts`
- `tests/rls/politicas.spec.ts`
- `src/components/layout/ChatBubble.tsx`, `tests/e2e/chat.spec.ts`
- `src/pages/ProfilePage.tsx`
- `docs/00-estado-actual.md`, `docs/02-decisiones.md`,
  `docs/04-problemas-pendientes.md`, `docs/05-registro-de-cambios.md`

## Siguiente paso

La PR #35 tiene el CI completamente en verde. Lo que queda no es de código: en
la demostración hay que activar Anonymous sign-ins y aplicar las migraciones
versionadas —sin la de permisos la web se queda sin acceso a sus propias
tablas—, y después verificar web y chat contra la URL pública.

**Actualización del 2026-08-06:** antes de eso hay que cerrar el hallazgo de
sesiones anónimas; ver
[[04-problemas-pendientes#SEG-ANON-001 — Una sesión anónima del chat valía como cuenta de cliente]].

Y lo que esta nota dice sobre Docker ya no vale: **se instaló Docker Desktop el
2026-08-06** y se usó para los respaldos de Supabase. La afirmación de arriba
—que la máquina no lo tenía— describe cómo estaban las cosas el 2026-08-05 y se
conserva por eso, no porque siga siendo cierta.
