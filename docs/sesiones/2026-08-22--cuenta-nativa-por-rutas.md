---
tipo: sesion
fecha: 2026-08-22
tema: Cuenta pasa a lista vertical y subrutas reales en la app nativa
---

# El menú que enseñaba una puerta de siete

## Objetivo

Implementar el rediseño aprobado de «Cuenta» en la aplicación: lista vertical,
subrutas reales y «Volver» del sistema, sin rediseñar la web.

## Estado inicial

`main` limpio en `4ebb2049`. Auditoría del mismo día ya hecha y aprobada.

## El punto de partida, medido

Con la aplicación real y sesión de verdad: el carril de apartados ocupaba
**1104 px** dentro de **280 px a 320** y **350 px a 390** —824 y 754 px fuera de
la vista—. En cinco de las siete pantallas a 320 px lo único visible del menú
era el apartado en el que ya estabas. No había desbordamiento del documento ni
objetivos por debajo de 44 px: el problema era **descubribilidad**.

Y `?apartado=` tenía un techo: `appBack` decide por **pathname**, así que
`/cuenta?apartado=pedidos` era `/cuenta` —raíz de pestaña— y jamás podría
ofrecer «Volver».

## Trabajo realizado

| Archivo | Qué hace |
| --- | --- |
| `src/components/account/apartados.ts` | **Nuevo.** Los siete apartados y la gramática de sus direcciones |
| `src/components/account/sections.tsx` | **Nuevo.** Las siete secciones, extraídas sin tocar su cuerpo |
| `src/components/account/AccountRootNative.tsx` | **Nuevo.** La lista vertical |
| `src/pages/ProfilePage.tsx` | Punto común: normaliza, guarda sesión, cierra sesión y elige composición |
| `src/App.tsx` | Ruta `/cuenta/:apartado` |
| `src/lib/appBack.ts` | Una entrada: `'/cuenta': '/cuenta'` |
| `AppCustomerHome.tsx`, `MyProductsPage.tsx` | Enlaces a las subrutas |

La extracción fue **mecánica**: `Section` gana un `headingLevel` y nada más. Lo
único que se añadió a las secciones es esa propiedad, para que en la web sigan
siendo `h2` dentro de «Mi cuenta» y en la aplicación sean el `h1` de su
pantalla. Así desaparece el título duplicado sin pintar dos encabezados.

## Decisiones

Recogidas en [[02-decisiones#D-075]]. En resumen: una sola gramática de URL para
web y app; `?apartado=` como compatibilidad de entrada con `replace`; el
«Volver» de `/cuenta/*` resuelto con una sola entrada en `DETALLES`; `AppTabBar`
visible en las secundarias; Favoritos y Tienda habitual como accesos directos
conservando `/cuenta/favoritos`.

Dos cosas que **no** se hicieron a propósito: no se tocó la composición de la
web —a 1440 px funciona— ni el carril de la web móvil, que es otro problema; y
no se añadió ninguna entrada nueva a la cuenta. Esta entrega **reorganiza lo que
ya existía**.

## Resultado, medido

| | Antes | Después |
| --- | --- | --- |
| Apartados visibles a 320 | **1 de 7** | **8 de 8**, bajando |
| Carril horizontal | 1104 px en 280 | **no existe** |
| Desbordamiento del documento | 0 | 0 |
| Alto de fila | chips de 44 | **56**, y 70–71 con subtexto |
| «Volver» en un apartado | no existía | sí, y en frío va a `/cuenta` |
| Títulos por pantalla | 2 (chip + `h2`) | **1** |
| Primer campo de «Datos» a 320 | ~700 px de scroll | dentro del primer pantallazo |

## Comprobaciones

- **358 unitarias en 23 ficheros** (+5): los siete destinos de `appBack`, la
  raíz sin control, la barra final y las subrutas en `appSections`.
- **71 de integración** contra Supabase local (+11): raíz sin carril y sin
  «Volver», descubribilidad y objetivos táctiles a 320 y 390, entrar en un
  apartado, «Volver» en frío, recarga, `/cuenta/favoritos`, cierre de sesión al
  final con su contrato, enlace profundo sin sesión y la compatibilidad de
  `?apartado=` con sus cuatro casos.
- **468 E2E aprobadas y 1 omitida esperada** en Chromium y móvil contra el
  artefacto de `build:test`; **35/35** en preferencias.
- `typecheck`, `build:test`, Prettier y ESLint con **0 errores** y los 25 avisos
  preexistentes.
- **`npm run app:sync` correcto para iOS y Android**, sin modificar ningún
  fichero nativo versionado. No se recompiló ningún binario.
- Capturas antes y después fuera del repositorio, en
  `/private/tmp/banana-cuenta-audit/` y `/private/tmp/banana-cuenta-implementation/`.

## Archivos afectados

Los siete de la tabla, más `docs/02-decisiones.md`, `docs/05-registro-de-cambios.md`,
`docs/06-app-nativa.md`, esta nota y los siete ficheros de prueba adaptados.

## Siguiente paso

Revisión y fusión de la PR. Después del merge, anotar el cierre en
`docs/00-estado-actual.md`, que describe `main`.
