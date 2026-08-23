---
tipo: sesion
fecha: 2026-08-23
tema: Tienda nativa v2 — la pantalla deja de ser un subconjunto de Inicio y pasa a ser el catálogo
---

# Tienda prometía el catálogo y entregaba el perchero de rebajas

## Objetivo

Implementar el diseño aprobado de Tienda nativa v2: concepto «Tienda es el
catálogo», sin tocar Inicio, el armazón, la web ni los catálogos de familia.

## Estado inicial

`main` limpio en `09b1347c`. Baseline dirigido: **47/47**.

## Lo que se medía antes

| | 320×568 | 390×844 |
| --- | --- | --- |
| Encabezado | top 42 · 76 | top 42 · 76 |
| Oportunidades | top 150 · 312 | top 150 · 312 |
| Ayuda para elegir | top 494 · 102 | top 494 · 78 |
| Servicios y ayuda | top 628 · **286** | top 604 · **286** |
| Total | 954 (2,17 pant.) | 930 (1,30) |

3 títulos · 7 superficies · 6 tarjetas · 18 enlaces · 5 filas de servicio.

Y lo que de verdad fallaba: **6 ofertas de un catálogo de 21 modelos**, cuatro
de ellas Mac, de modo que iPad, Watch, AirPods y Accesorios **no aparecían en
toda la pantalla**. Con historial real la **intersección con Inicio era 6 de 6**.

## Trabajo realizado

| Archivo | Qué cambia |
| --- | --- |
| `AppHome.tsx` | Sección «Explorar», orden nuevo, Finder corregido, servicios a tres, `Seccion` pasa a ser `region` con nombre |
| `StorePage.tsx` | Comentario obsoleto corregido |
| `src/i18n/*.ts` (5) | `app.store.explore`, `app.store.buyInStore`, y `app.home.services` deja de prometer ayuda |
| `tienda-catalogo.spec.ts` | Contrato de familias invertido, carril personal reparado, 5 contratos nuevos |
| `app-shopping.spec.ts` | El orden pasa a ser «catálogo antes que servicios» |

Los datos no cambian: `families`, `allModels`, `tieneOferta`,
`presentacionDeTarjeta` y `ProductCardCompact` siguen exactamente igual. **Ni
una petición nueva, ni una línea de personalización.**

## Decisiones

Recogidas en [[02-decisiones#D-077]]. La que más discusión merecía: **vuelve una
navegación de familias**, retirada en su día porque «los chips están SIEMPRE
arriba y a un toque». Esa premisa era incompleta y ahora está medida: los chips
ocupan 474 px, **a 320 px sólo se ven cuatro de seis** —«Accesorios» nunca—,
miden 32 px y **se recortan al bajar**. «Explorar» no restaura la vieja rejilla:
son seis destinos de 56 px en dos columnas, sin imágenes y sin iconos, porque no
hay en `Icon` símbolos que distingan un Mac de un iPad sin inventarlos.

## Dos defectos encontrados por el camino

- **`sparkles` no existe en `Icon`.** La fila de ayuda lo pedía y el componente
  hace `paths[name] ?? paths.info`, así que caía silenciosamente en el icono de
  información. Eso explicaba que la fila «pareciera un aviso». Ahora usa `star`.
- **`tienda-catalogo.spec.ts` había perdido cobertura sin avisar.** Comprobaba
  que no apareciera el encabezado «Continúa donde lo dejaste», copy que la PR
  #73 renombró a «Seguías mirando»: la aserción no podía fallar. Ahora se mide
  la lista por su nombre accesible y, además, que Tienda no monte **ningún**
  carril de producto que no sea el de ofertas.

## Resultado, medido

| | Antes (320) | Después (320) |
| --- | --- | --- |
| Explorar | no existía | top 142 · 224 px |
| Oportunidades | top 150 | top 398 |
| Ayuda para elegir | top 494 · 102 | top 742 · 78 |
| Servicios | top 628 · **286** | top 852 · **188** |
| Total | 954 (2,17 pant.) | **1080 (2,45)** |
| Títulos · superficies · enlaces | 3 · 7 · 18 | 4 · 13 · 22 |
| Familias desde el contenido | **0** | **6** |
| Filas de servicio | 5 | **3** |
| Desbordamiento | 0 | **0** |

A 390 y 430 el total es el mismo, 1080 px (1,51 y 1,34 pantallas), y la primera
tarjeta de producto entra entera en el primer viewport.

**La pantalla crece 126 px a 320.** Es un 13 % más a cambio de la navegación
completa al catálogo, y por debajo del objetivo conceptual sólo por poco (2,45
frente a ~2,2). No se forzaron alturas para bajar de esa cifra: los objetivos
táctiles se quedan en 56 px las familias y 48 los servicios.

## Comprobaciones

- **Contraprueba** del contrato de carril personal: reintroduciendo «Seguías
  mirando» en Tienda, la prueba se pone roja con `Expected 0 · Received 1`. La
  versión anterior habría seguido verde.
- **487 E2E aprobadas y 1 omitida esperada** (Chromium y móvil contra el
  artefacto), **37/37** en preferencias, **24/24** en el panel, **358
  unitarias**, `typecheck`, `build:test`, Prettier y ESLint con **0 errores**.
- **`app:sync` correcto para iOS y Android**, sin modificar ningún fichero
  nativo versionado.
- `/tienda` en la web sigue redirigiendo a `/`, comprobado.
- Capturas antes y después fuera del repositorio, en
  `/private/tmp/banana-tienda-v2-audit/` y
  `/private/tmp/banana-tienda-v2-implementation/`.

## Archivos afectados

Los cinco de la tabla —contando los cinco ficheros de i18n como uno—, más
`docs/02-decisiones.md` (D-077), `docs/05-registro-de-cambios.md`,
`docs/06-app-nativa.md` y esta nota.

## Deuda que NO se toca aquí

Los chips de `AppTopBar` siguen midiendo 32 px y sin caber los seis. Es deuda
del armazón, anotada desde la PR #43, y Tienda v2 la rodea creando su propia
entrada en vez de rediseñar el shell. `AppHome` sigue llamándose así pese a ser
Tienda: renombrarlo es mecánico y ajeno a esta entrega.

## Siguiente paso

Revisión y fusión de la PR.
