---
tipo: sesion
fecha: 2026-08-23
tema: Inicio nativo v2 — el saludo deja de ser el titular y la pantalla abre por lo que requiere atención
---

# Inicio enseñaba la portada antes que el producto

## Objetivo

Implementar el diseño aprobado de Inicio nativo v2: concepto «Inicio
contextual», sin tocar la web ni la Tienda.

## Estado inicial

`main` limpio en `925e38db`. Auditoría del 2026-08-22 aprobada con precisiones.

## Lo que se medía antes

Con la aplicación real y sesión de verdad:

| | 320×568 | 390×844 |
| --- | --- | --- |
| Identidad | 68 px (182 de invitado) | íd. |
| Finder empieza en | **y=258** | y=258 |
| Primer producto completo visible | **ninguno** | sí, tras ~430 px |
| Altura total | 1559 px (**3,54 pantallas**) | 1466 (2,05) |
| Títulos · superficies · carriles | 5 · 13 · 2 | íd. |

Y algo que no era una sensación: con historial real, `iphone/17-pro` salía como
primera tarjeta de «Continúa» **y** como primera de «Oportunidades».

## Trabajo realizado

| Archivo | Qué cambia |
| --- | --- |
| `AppCustomerHome.tsx` | Orden nuevo, identidad compacta, Finder sin descargo dentro, carril personal, deduplicación, tienda en una fila, ayuda sin encabezado |
| `ProductCardCompact.tsx` | Variante `recent`, que **sólo** neutraliza la presentación de oferta |
| `inicio-nativo.spec.ts` | Contratos adaptados y 11 nuevos |
| `inicio-accesos.spec.ts` | Cabecera adaptada; dos contratos nuevos de orden |
| `app-shell-navegacion.spec.ts`, `app-shopping.spec.ts` | Referencias al copy anterior |

Los datos no cambian: `leerRecientes`, `getModel`, `allModels`, `tieneOferta`,
`listMyReservations`, `useStorePreference`, `StoreStatus`, `openChat` y la
costura `listarReservas` siguen exactamente igual. **Ni una petición nueva.**

## Decisiones

Recogidas en [[02-decisiones#D-076]]. Las dos que corrigen la propuesta original
de la auditoría:

- **El aviso va antes del Finder.** Es temporal y accionable. Y de ahí una
  consecuencia que se escribe en la decisión para que no se pierda: **no puede
  exigirse por contrato que el Finder se vea entero sin desplazar**, porque con
  aviso delante puede no caber. El contrato sólo se afirma sin avisos.
- **Oportunidades descarta lo que ya se enseña arriba**, y lo hace por los
  modelos que **se pintan**, no por lo que hay en `localStorage`: un reciente
  que ya no existe en el catálogo no debe descartar nada.

El máximo de «Seguías mirando» **no se toca**: la nota aprobada no fija uno
nuevo, así que se conserva el de siempre (6).

## Resultado, medido

| | Antes (320) | Después (320) |
| --- | --- | --- |
| Identidad | 68 px | **64** |
| Finder empieza en | 258 | **178** con aviso · **141–160** sin él |
| Altura total | 1559 (3,54 pant.) | **1448 (3,29)** |
| Títulos | 5 | **4** |
| Superficies | 13 | **11** |
| Tarjetas en Oportunidades | 8 | **4** |
| Duplicados entre carriles | 1 | **0** |
| Desbordamiento | 0 | **0** |

Invitado a 390: de 1134 px a **1012**, con el Finder en y=141 en vez de 270.

## Comprobaciones

- **Contraprueba del filtro de deduplicación**: retirándolo, la prueba se pone
  roja con `estos modelos salen dos veces: iphone/17-pro` — el caso real medido
  en la auditoría.
- Igualdad de alturas de la D-072 verificada **en los dos carriles** y entre
  variantes: `recent` y `default` miden lo mismo.
- **481 E2E aprobadas y 1 omitida esperada** (Chromium y móvil contra el
  artefacto), **71 de integración**, **37/37** en preferencias, **358
  unitarias**, `typecheck`, `build:test`, Prettier.
- **`app:sync` correcto para iOS y Android**, sin modificar ningún fichero
  nativo versionado. No se recompiló ningún binario.
- Capturas antes y después fuera del repositorio, en
  `/private/tmp/banana-inicio-v2-audit/` y `/private/tmp/banana-inicio-v2-implementation/`.

### Una medición que casi se reporta mal

`npm run lint` dio **215 problemas, 190 errores**. No era una regresión: con el
Supabase local levantado, `eslint .` recorre `supabase/.temp/`, un fichero
minificado que la CLI escribe mientras el stack está en marcha. El valor real,
con `eslint src tests` y con el stack parado, es **0 errores y 25 avisos** — la
línea base de siempre. Es exactamente la trampa que dejó anotada la PR #57.

## Archivos afectados

Los seis de la tabla, más `docs/02-decisiones.md` (D-076),
`docs/05-registro-de-cambios.md`, `docs/06-app-nativa.md` y esta nota.

## Siguiente paso

Revisión y fusión de la PR. Después del merge, anotar el cierre donde
corresponda; `docs/00-estado-actual.md` describe `main` y no se toca antes.
