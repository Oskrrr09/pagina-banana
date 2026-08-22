---
tipo: sesion
fecha: 2026-08-21
tema: Navegación «Atrás» en la app nativa
---

# Navegación «Atrás» en la app nativa

## Objetivo

Dar a las pantallas secundarias de la aplicación nativa una forma visible de
volver, y dejarla apoyada en algo más sólido que un `navigate(-1)`.

## Estado inicial

`main` en `e2a92e19`, con la documentación de las PR #62 a #66 recién
fusionada. En iPhone no hay retroceso del sistema y `AppTopBar` no ofrecía
ningún control: quien entraba en una ficha, en el detalle de una tienda o en
soporte sólo podía salir cambiando de pestaña.

## Auditoría previa

Antes de escribir nada se recorrieron las 26 rutas declaradas en `App.tsx` y se
clasificaron en tres grupos: las 23 del armazón —`Layout` con `isNativeApp`—,
el checkout con su `CheckoutLayout` y el panel de agentes con `AgentAppScope`.
De las 23, cuatro son raíces de `AppTabBar` y el resto secundarias.

Dos hallazgos cambiaron el diseño:

- **La cuarta pestaña no siempre apunta a `/cuenta`.** `AppTabBar` usa `/login`
  cuando no hay sesión, así que `/login` también es raíz.
- **No existía ninguna señal de historial en el repositorio.** Ni
  `location.state`, ni `location.key`, ni `window.history`, ni `history.length`:
  cero coincidencias en `src/`. Había que introducirla.

Leyendo la implementación instalada de React Router 7.18.2 se confirmó que el
router numera sus entradas en `window.history.state.idx`, que `push` lo sube y
que `replace` **no** lo mueve.

## Decisiones tomadas

Recogidas en [[02-decisiones#D-073]]. En resumen:

- Con historial propio manda el historial; sin él, un destino semántico por
  pantalla, con `replace`.
- `history.length` no distingue el historial de Banana del anterior a Banana.
- `location.key` tampoco demuestra que haya una entrada detrás: un `replace`
  sobre la primera entrada le da clave nueva, y eso pasa de verdad en el
  guardia de `/cuenta`, en `AccessoryDetailPage` y en el reemplazo canónico de
  `VariantPage`.
- Una recarga **no** baja `idx` a 0: el navegador conserva `history.state`.
- La regla semántica va en un módulo puro aparte de `appSections`, que responde
  a otra pregunta —qué pestaña, qué chips, qué carrito—.

## Trabajo realizado

Cinco archivos, `+617/−0`:

| Archivo | Qué hace |
| --- | --- |
| `src/lib/appBack.ts` | Función pura: si la ruta lleva control y cuál es su destino |
| `src/lib/useAppBack.ts` | Único sitio que lee `window.history.state`; decide `-1` o destino |
| `src/components/layout/AppTopBar.tsx` | Pinta el botón, primero de la fila |
| `tests/unit/app-back.test.ts` | 31 casos: mapa de destinos y clases de `idx` |
| `tests/e2e/app-atras.spec.ts` | 12 pruebas del comportamiento en el armazón |

El botón mide 44×44, lleva `aria-label="Volver"` y reutiliza `chevron-right`
girado, como ya hacía el «Volver al carrito» del checkout: no hizo falta tocar
`Icon.tsx` ni añadir traducciones.

## Revisión visual

Se midió a **320×568** antes de decidir la composición de la barra de cliente,
no después. Con el logotipo dentro no aprieta —tres objetivos de 44 y el
logotipo caben con aire—, así que **el logotipo se queda** también en las
secundarias. A **390×844** no había duda. La barra comercial cede ancho por el
buscador, que ya llevaba `flex-1 min-w-0`, y el carrito conserva su objetivo.

## Comprobaciones

- Dirigidas en local: Prettier, ESLint, 31 unitarias, 12 E2E y `typecheck`,
  todo en verde.
- CI de la PR `32530133221`: éxito al primer intento.
- CI posterior sobre `main` `32533459831`, también al primer intento: 464
  pruebas E2E con 463 aprobadas, 1 omitida esperada, **0 fallos, 0 reintentos,
  0 inestables**; 353 unitarias; 24/24 en el panel de agentes; 35/35 en
  preferencias; 36 + 60 + 5 contra Supabase; y **Pages ejecutado de verdad y
  desplegado** sobre `d6e6e9ee`.
- Los ceros de reintentos e inestables se buscaron en el registro del trabajo,
  no se dedujeron del distintivo verde.

**No se recompiló ningún binario nativo** en esta sesión: la verificación fue
de código, pruebas, CI y viewports.

## Archivos afectados

Los cinco de la tabla anterior. La PR #68 se fusionó con *merge commit* en
`d6e6e9ee67ce1aebb55ba1ceb27f431f942374bc`, con padres `e2a92e19` y `23716f10`.

## Fuera de alcance

- `/checkout/:step`, `/agente` y `/agente/login`: no montan `AppTopBar`.
- Añadir `@capacitor/app` o interceptar el botón físico de Android, que sigue
  delegando en el historial del WebView —la misma pila que usa este control—.
- El «Atrás» interno del Finder, que retrocede un paso del asistente y convive
  a propósito con el de la barra.

## Deuda anotada, ajena a esta entrega

Revisando las capturas apareció la barra de compra de la ficha saliéndose por
la derecha a 320 px. Se reprodujo después contra `main` en `d6e6e9ee` —339 px
de contenido en 320 de ancho, con «Comprar» cortado— y se anotó como
[[04-problemas-pendientes#UI-002 — La barra de compra de la ficha se sale por la derecha a 320 px]].
Es preexistente: la PR #68 no toca `VariantPage`. No se arregló aquí.

## Siguiente paso

Sin trabajo comprometido. La dirección anotada en
[[03-roadmap#9. Rematar la identidad visual fuera de la app]] sigue sin decidir,
y las dos deudas de documentación —[[04-problemas-pendientes#DOC-002 — La documentación viva va veintitrés PR por detrás]]
y [[04-problemas-pendientes#UX-062 — Hallazgos abiertos de la auditoría del 2026-08-19]]—
siguen abiertas tal cual.
