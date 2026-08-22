---
tipo: sesion
fecha: 2026-08-22
tema: UI-002 — la barra de compra de la ficha se salía por la derecha a 320 px
---

# El padding pesaba más que el texto

## Objetivo

Cerrar **UI-002** en una PR aislada: que la barra de compra fija de
`VariantPage` quepa de verdad a 320 px, sin recortar, esconder ni abreviar nada.

## Estado inicial

`main` limpio en `2a69349f`, con UI-002 anotado el día anterior como deuda
preexistente y sin causa determinada: la ficha decía «pendiente: decidir cómo
cede el ancho».

## Reproducción, antes de tocar nada

Medido en `/iphone/17-pro/256gb-plata` con el armazón nativo, a 320×568:

- barra `scrollWidth` **339** sobre `clientWidth` **320** — 19 px de exceso;
- «Comprar» de 207,8 a **339,4**, es decir 19,4 px fuera;
- `documentElement` y `#contenido` seguían diciendo 320/320.

A 390×844 no desbordaba, pero la holgura era **0,0 px**: cabía por casualidad.

Recorriendo los cuatro estados reales de la barra aparecieron dos cosas que la
ficha no decía:

- el defecto **no depende de la oferta**: sin precio anterior desbordaba igual,
  porque a 320 px la línea del «antes» envuelve y el bloque mide lo mismo;
- con el control de cantidad cabía por **3,6 px**, y con «Reservar» de sobra.

## La causa

No faltaba un mecanismo para ceder ancho: **el que había estaba muerto**.

Los tres botones pedían `px-3`/`px-4` en `className` y su `padding-inline`
computado era **64 px**. `px-3` y `px-8` son la misma propiedad con la misma
especificidad, así que decide el orden de la hoja de estilos, no el del
atributo. El `px-8` del tamaño `lg` ganaba siempre.

A 320 px, con el texto en una línea:

- caja de contenido de la fila: 288 px (320 − `px-4`);
- menos 16 px de separaciones → **272 px** para tres elementos;
- texto: precio 73,55 + «Al carrito» 72,91 + «Comprar» 67,67 = **214,13**;
- padding de los dos botones: **128**;
- necesario: **342,13**.

El padding ocupaba más que todo el texto de los botones (128 frente a 140,58), y
con `min-width: auto` «Comprar» —una sola palabra— no puede encoger por debajo
de su `min-content`. El sobrante salía entero por la derecha.

## Una corrección a la ficha del problema

UI-002 decía «no aparece en la web: fuera del binario esa barra fija no se
monta». **No es cierto.** La barra es `lg:hidden`, no `isNativeApp`; lo único
que cambia entre los dos armazones es de qué se cuelga por abajo (D-066).
Medido sobre `main` sin Capacitor a 320 px: **339/320**, el mismo defecto. Era
un defecto de la ficha en móvil, no de la aplicación. Corregido en el documento
y cubierto con un caso de prueba propio.

## Trabajo realizado

| Archivo | Qué cambia |
| --- | --- |
| `src/components/ui/Button.tsx` | El padding horizontal sale de `sizes` a `paddingsX`; nueva propiedad `paddingX` que lo **sustituye** |
| `src/pages/VariantPage.tsx` | Los tres botones de la barra comparten `PADDING_CTA = 'px-3 min-[360px]:px-5 sm:px-8'` |
| `tests/e2e/app-shopping.spec.ts` | Describe «la barra de compra cabe en la pantalla»: 10 casos |

Los tres tramos de padding salen de la medición, no de la intuición: hasta 359
px sobran ~10 px con 12 por lado; de 360 a 639 caben 20; desde `sm` sobra de
largo y se recupera el `px-8` original.

## Decisiones tomadas

- **D-074 — el padding horizontal de un botón se sustituye, no se pisa.** Con el
  corolario general: una clase de utilidad no es un override, y si dos utilidades
  tocan la misma propiedad el resultado no lo decide quien las escribe.
- **Se conserva la degradación amable.** No se puso `whitespace-nowrap` en los
  rótulos a propósito: sin él, un texto que no quepa vuelve a partirse en dos
  líneas —feo pero contenido—; con él, volvería a desbordar. El modo de fallo
  importa tanto como el caso que funciona.
- **La regla alcanza también a «Reservar»**, que no tenía defecto. Es una sola
  barra y merece una sola regla; además su `px-4` en `className` era otro
  override muerto.

## Comprobaciones

- **Rojo antes del arreglo, y por la razón correcta.** Con `Button.tsx` y
  `VariantPage.tsx` revertidos a `2a69349f`, 3 de los 10 casos fallan —los tres
  a 320 px, con `la barra de compra desborda 19px`— y los otros 7 siguen verdes
  porque esos estados sí cabían.
- Barrido en los dos armazones a 320, 359, 360, 390, 430, 639, 640, 768 y 1023
  px: `exceso 0` en todos. Desde 640 los botones vuelven a medir exactamente lo
  de antes (136,9 y 131,7 px).
- D-066 intacto: en la app el borde inferior de la barra sigue coincidiendo con
  el superior de `AppTabBar`; en la web sigue pegada al borde de la ventana.
- `npm run typecheck`, `npm run test:unit` (**353/353 en 23 ficheros**),
  `npm run build:test`, Prettier y ESLint (**0 errores, 25 avisos preexistentes**,
  ninguno en los ficheros tocados).
- E2E contra el artefacto de `build:test`, proyectos `chromium` y `mobile`:
  **468 aprobadas, 1 omitida esperada, 0 fallos**.
- Capturas antes/después a 320×568 y 390×844, y de los cuatro estados, fuera del
  repositorio en `/private/tmp/banana-ui002-before` y `…-after`.

**No se recompiló ningún binario nativo**: la verificación es de código, medidas
y pruebas. La última compilación real de iOS y Android sigue siendo la del
2026-08-01.

## Archivos afectados

Los tres de la tabla, más `docs/02-decisiones.md` (D-074),
`docs/04-problemas-pendientes.md` (UI-002 resuelto y corregido) y
`docs/05-registro-de-cambios.md`.

## Fuera de alcance

DOC-002, UX-062 y las tres direcciones visuales pendientes —Inicio nativo v2,
Cuenta nativa vertical y Tienda nativa v2—, que siguen sin diseñar y no se han
convertido en decisiones.

## Siguiente paso

Revisión y fusión de la PR. `docs/00-estado-actual.md` **no se toca todavía**: describe
`main`, y este trabajo aún no está fusionado. Después del merge tocará anotar
allí el cierre y registrar en la bóveda el merge, el SHA y el CI post-merge.
