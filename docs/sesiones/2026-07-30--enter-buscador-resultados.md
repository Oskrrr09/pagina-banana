---
tipo: sesion
fecha: 2026-07-30
tema: Enter en el buscador abre la página completa de resultados
---

# Enter en el buscador

## Objetivo

Corregir el comportamiento de la tecla Enter en el nuevo buscador
del Header: al escribir una consulta y pulsar Enter sin haber
seleccionado ninguna sugerencia, se abre la página completa de
resultados `/buscar?q=…` (no la primera sugerencia).

## Causa exacta

`HeaderSearch` inicializaba `activeIndex` en `0` y el `useEffect`
sobre `q` lo reponía a `0` cada vez que cambiaba la consulta. Como
consecuencia, la primera sugerencia quedaba siempre marcada como
opción activa y la rama `if (active) activateItem(active.item)` del
manejador de Enter navegaba al destino del primer resultado —
típicamente la familia AirPods o su primer modelo.

Además, `SuggestionRow` disparaba `onHoverIndex` en `onMouseEnter` y
`onFocus`, lo que introducía un vector adicional de selección
implícita.

## Nuevo comportamiento

- **Estado inicial**: `activeIndex = -1`. Sin selección visible, sin
  `aria-activedescendant`.
- **Enter con `activeIndex === -1`**: navega a
  `/buscar?q=${encodeURIComponent(query.trim())}` y cierra el panel.
- **Enter con `activeIndex >= 0`**: abre la sugerencia activa (como
  antes).
- **ArrowDown**: `-1 → 0`, después avanza sin salir de rango.
- **ArrowUp**: `-1 → última`; `0 → -1`; en el medio, retrocede.
- **Cambio de consulta**: `useEffect` con dependencia `[q]` fuerza
  `setActiveIndex(-1)`.
- **Cerrado y Escape**: `closeAndRestore()` limpia el índice a `-1`.
- **Sin selección implícita por hover**: se retiran `onMouseEnter` y
  `onFocus` de `SuggestionRow`. El clic sigue abriendo la opción.

## Archivos modificados

- `src/components/search/HeaderSearch.tsx` — estado inicial `-1`,
  reset a `-1` al cambiar `q`, ArrowUp/Down con wrap consistente,
  Enter sin selección envía a `/buscar`, `aria-activedescendant` solo
  con selección, `closeAndRestore` limpia el índice, se retiran las
  ramas de hover/focus.
- `tests/e2e/search.spec.ts` — 12 tests nuevos y endurecimiento de
  "flecha abajo + Enter".
- `docs/05-registro-de-cambios.md` — nueva entrada.
- Esta nota de sesión.

## Accesibilidad

- `aria-expanded` sigue reflejando `expanded`.
- `aria-controls`, `aria-owns`, `aria-haspopup="listbox"`,
  `aria-autocomplete="list"` intactos.
- `aria-activedescendant` **solo** se pinta cuando `activeIndex >= 0`
  y `expanded`. Con `-1` no aparece.
- Foco restaurado con `restoreFocusTo` al cerrar (lupa escritorio o
  lupa móvil).
- Escape sigue cerrando el panel, restaurando el foco y limpiando el
  índice; no navega.
- axe sin violaciones en `/buscar?q=AirPods` ni en el estado vacío
  (regresión intacta).

## Tests

**Nuevos (12)**:

1. Enter directo desde escritorio → `/buscar?q=AirPods` (assertion
   exacta con `$`, no acepta `/airpods` ni ninguna ruta de producto).
2. ArrowDown → `aria-activedescendant` presente + una opción con
   `aria-selected="true"`.
3. Cambio de consulta → `aria-activedescendant` ausente + Enter abre
   `/buscar?q=<nueva consulta>`.
4. Botón lupa móvil → `/buscar?q=AirPods`.
5. "Ver todos los resultados" → `/buscar?q=AirPods` + secciones
   visibles.
6. Enter en móvil → `/buscar?q=AirPods` + overlay cerrado + body sin
   `overflow:hidden` residual.
7. Móvil + ArrowDown + Enter → sugerencia activa (URL no contiene
   `/buscar`) + overlay cerrado.
8. Sin selección: input sin `aria-activedescendant`; tras ArrowDown,
   sí; tras cambio de consulta, desaparece de nuevo.
9. Escape con selección: overlay cerrado, foco en la lupa, URL sin
   cambios.
10. Regresión de `/buscar?q=AirPods`: Dispositivos antes de
    Relacionados / Accesorios Apple / Accesorios compatibles / Ayuda.
11. `funda AirPods` desde el Header → `/buscar?q=funda%20AirPods` +
    Accesorios antes que Dispositivos (intención accessory).
12. `airpds` desde el Header → `/buscar?q=airpds` + "Quizá querías
    decir …" visible.

**Endurecido**:

- `Header escritorio: flecha abajo + Enter` — antes toleraba `/`
  distinto de la raíz; ahora exige `not(URL /buscar/)` y comprueba
  `aria-activedescendant` antes de pulsar Enter.

**Regresión intacta**: `apple-finder.spec.ts` (31), `accessibility`
(9), resto de `search.spec.ts` (20 anteriores).

## Comprobaciones

- `npm run build` — verde.
- `npm run test:e2e` — **156/156**.
- `npx playwright test tests/e2e/search.spec.ts --project=chromium` —
  32 verdes.
- `npx playwright test tests/e2e/search.spec.ts --project=mobile` —
  4 verdes.
- `npx playwright test tests/e2e/accessibility.spec.ts --project=chromium`
  — 9 verdes.
- `git diff --check` — limpio.

## Casos manuales / vía Playwright cubiertos

- Enter directo con AirPods (escritorio y móvil).
- Flecha abajo + Enter (escritorio y móvil).
- Cambio de consulta.
- Botón lupa (móvil).
- "Ver todos los resultados".
- `funda AirPods`.
- `airpds`.
- Escape con selección.

## Pendientes reales

- Igual que antes: sin runner unitario para el motor. Se sigue
  cubriendo vía Playwright.
