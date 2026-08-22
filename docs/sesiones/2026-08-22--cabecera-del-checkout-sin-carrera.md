---
tipo: sesion
fecha: 2026-08-22
tema: El test de la cabecera del checkout medía una pantalla que la aplicación estaba abandonando
---

# Una prueba que abría una puerta cerrada

## Objetivo

Eliminar el intermitente de
`tests/e2e/barra-banana.spec.ts` › `checkout › el paso 3 tiene la cabecera
amarilla y conserva su fondo`, sin tocar producción y sin esperas artificiales.

## Estado inicial

`main` limpio en `d894450c` (PR #70 fusionada, CI post-merge limpio).

## La evidencia

En el CI **pre**-merge de la PR #70 (run `32591398519`, job `97075897453`) esa
prueba falló en el primer intento y pasó en el reintento:

```
Expected: "rgb(255, 206, 31)"
Received: ""
```

Una cadena vacía no es un color equivocado: es lo que devuelve
`getComputedStyle` sobre un nodo **desconectado del documento**.

## La causa

Los tres pasos del checkout están guardados, y no de la misma forma:

| Paso | Sin precondición |
| --- | --- |
| 3 | `<Navigate replace />` a `/carrito` o `/iphone` |
| 1 y 2 sin carrito | estado vacío (no redirige) |
| 2 con carrito y paso 1 inválido | `<Navigate replace />` a `/checkout/1` |

La prueba hacía `goto('./checkout/3')` sin pedido demostrativo y medía el
`header` inmediatamente. Es decir: **creaba un estado en el que esa pantalla no
es válida** y luego medía la pantalla. Unas veces medía antes del redirect y
otras durante, y el destino de la redirección **también** tiene cabecera
amarilla, así que pasaba casi siempre.

**Mecanismo comprobado en local**, de forma determinista y sin depender del
azar: reteniendo la referencia al `header` y leyéndola después del redirect,

```
nada más montar : isConnected true  · backgroundColor "rgb(255, 206, 31)"
tras <Navigate> : isConnected false · backgroundColor ""
```

Exactamente lo que recibió el CI.

El redirect de la aplicación **es correcto** y no se ha tocado. Lo comprueba
`checkout.spec.ts` › «abrir /checkout/3 sin pedido redirige al carrito o
catálogo», que sigue intacto.

## Trabajo realizado

Sólo pruebas. Cero cambios en producción.

| Archivo | Qué cambia |
| --- | --- |
| `tests/e2e/checkout-helpers.ts` | **Nuevo.** `sembrarCarrito` y `llegarAlPaso` |
| `tests/e2e/barra-banana.spec.ts` | Los cuatro casos de checkout entran por el flujo real y confirman la pantalla antes de medir |
| `tests/e2e/checkout.spec.ts` | Usa el `sembrarCarrito` común |
| `tests/e2e/checkout-flow.spec.ts` | Íd. |

`sembrarCarrito` no es código nuevo: estaba **duplicado literalmente** en
`checkout.spec.ts` y `checkout-flow.spec.ts`, y se ha extraído en vez de
escribir una tercera copia. `llegarAlPaso` recorre el flujo por la interfaz
—la misma secuencia que ya usaba `checkout.spec.ts`— en lugar de fabricar un
`DemoOrder` en `sessionStorage`: ese objeto tiene once campos más una lista de
líneas, y un molde escrito a mano se queda viejo sin que nadie se entere.

Antes de medir, la prueba afirma tres cosas: que la URL sigue siendo la del
paso, que `#contenido-checkout` está montado y que hay **exactamente una**
cabecera. Ese `toHaveCount(1)` sustituye al `.first()`, que era justamente lo
que permitía caer sobre la cabecera de otra pantalla tras una redirección.

## Decisiones

- **Una prueba que mide una pantalla guardada tiene que cumplir su
  precondición.** No se ralentiza la aplicación, no se relaja la guarda y no se
  acepta «cualquiera de los dos destinos»: se entra bien.
- **Nada de esperas.** Ni `waitForTimeout`, ni reintentos propios, ni timeouts
  más largos: el problema no era de tiempo, era de estado.
- **Los pasos 1 y 2 también entran por el flujo**, aunque no fueran
  intermitentes. Antes medían la cabecera del **estado vacío** —sin carrito no
  se pinta el paso—, así que decían menos de lo que parecía.
- No se abre entrada en `04-problemas-pendientes`: la deuda se detecta y se
  cierra en la misma PR. Tampoco hay decisión nueva que registrar.

## Comprobaciones

- **Reproducción local previa**: 20 repeticiones del caso original, **20
  aprobadas**. No se reprodujo — la ventana es demasiado estrecha en local. La
  evidencia forense válida es el run `32591398519`, más el mecanismo demostrado
  arriba.
- **Estrés tras el arreglo**: 20 repeticiones, **20 aprobadas, 0 reintentos, 0
  inestables**.
- **Contraprueba**: poniendo `bg-checkout` en la cabecera de `CheckoutLayout`,
  **5 pruebas se ponen rojas**, el paso 3 entre ellas, con
  `Received: "rgb(247, 230, 169)"` — un color real, ya no `""`. Producción
  revertida acto seguido.
- `barra-banana` 24/24, `checkout` 4/4, `checkout-flow` 3/3.
- Suite completa contra el artefacto de `build:test`, Chromium y móvil: **468
  aprobadas, 1 omitida esperada, 0 fallos**.
- `typecheck`, `test:unit` (**353/353 en 23 ficheros**), `build:test`, Prettier
  y ESLint (**0 errores, 25 avisos preexistentes**).

## Archivos afectados

Los cuatro de la tabla, más `docs/05-registro-de-cambios.md` y esta nota.

## Siguiente paso

Revisión y fusión de la PR. Nada comprometido después.
