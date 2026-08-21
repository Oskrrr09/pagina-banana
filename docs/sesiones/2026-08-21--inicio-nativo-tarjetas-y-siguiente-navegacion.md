---
tipo: sesion
fecha: 2026-08-21
tema: Inicio nativo, tarjetas de producto y la siguiente navegación
---

# Inicio nativo, tarjetas de producto y la siguiente navegación

## Objetivo

Dejar la aplicación nativa con identidad propia —dejó de parecer una web
comprimida— y dejar por escrito el punto de entrega antes de parar.

## Estado inicial

`main` en `c0cce5cb` (PR #61). El aviso de tienda favorita flotaba sobre Inicio y
se comía los toques de las tarjetas que quedaban debajo. Y la app se leía como
una lista de tarjetas grises: medido después, en la auditoría visual, el área de
contenido era **90,1 % blanco y gris** y el azul de marca caía al **0,1 %**,
porque sólo estaba en la barra de pestañas.

## Trabajo realizado

Cinco PR, todas de la app y ninguna con efecto sobre datos, catálogo, Supabase,
dependencias ni flujos de compra.

| PR | Merge | Qué entrega |
| --- | --- | --- |
| #62 | `144294d8` | El aviso de tienda favorita ocupa banda propia y deja de tapar los toques de Inicio |
| #63 | `763b9a71` | La prueba de ese aviso mide contra la altura real de la banda |
| #64 | `3bb99a91` | `ProductCardCompact` sin borde ni caja gris: la foto a ancho completo |
| #65 | `096a3bf8` | Inicio con saludo de display, banda amarilla y tarjeta de Bananito |
| #66 | `5bdee61f` | Las tarjetas de un carril terminan a la misma altura |

Las decisiones están en [[02-decisiones#D-070]], [[02-decisiones#D-071]] y
[[02-decisiones#D-072]]; el resumen por PR, en [[05-registro-de-cambios]].

Además, fuera del repositorio: limpieza de espacio en disco sobre catorce rutas
autorizadas una a una (≈2,34 GB), más `/private/tmp/banana-pr66-equal-cards`
(4,1 MB) al confirmarse el veredicto de la auditoría posterior a la #66. Nada
de eso vive en git.

## Comprobaciones

- CI sobre `main` tras la #65 (`32417548643`): 450 pruebas, 449 aprobadas, 1
  omitida esperada, 0 fallos, 0 reintentos, 0 inestables.
- CI sobre `main` tras la #66 (`32425136106`): 452 / 451 / 1 / 0 / 0 / 0. Las
  dos pruebas nuevas de altura pasaron a la primera (821 ms y 691 ms). 24/24 en
  el panel de agentes, 35/35 en preferencias, 36 + 60 + 5 contra Supabase y
  Pages desplegado.
- Lo visual se revisó también en el simulador de iPhone real, no sólo con la
  simulación de Capacitor en navegador.

Tres cosas que conviene recordar de esta sesión:

- Un `dist` viejo da un verde falso: antes de validar una contramutación con
  `E2E_CONTRA_BUILD=1` hay que reconstruir **y comprobar el código de salida**,
  que un `| tail` se traga.
- El anclaje de desplazamiento no es determinista. Una cota absoluta en píxeles
  sobre una referencia animada produce intermitentes; de ahí la #63.
- Dos veces falló la infraestructura de CI —`playwright install --with-deps`
  colgado contra un espejo degradado, 20 minutos y cero pruebas ejecutadas—. Se
  reintentó por infraestructura, no se ocultó ningún rojo.

## Archivos afectados

Esta sesión de cierre sólo escribe documentación: `docs/00-estado-actual.md`,
`docs/02-decisiones.md`, `docs/03-roadmap.md`, `docs/04-problemas-pendientes.md`,
`docs/05-registro-de-cambios.md` y esta nota. El código entregado en las cinco
PR ya está en `main`.

## Siguiente paso

**PR #67 — «Atrás» en las pantallas secundarias de la app.** No iniciada. Las
condiciones acordadas y el inventario previo que hace falta están en
[[03-roadmap#8. Navegación «Atrás» en la app nativa]].

Antes o después de eso, dos deudas que esta sesión deja anotadas:

- [[04-problemas-pendientes#DOC-002 — La documentación viva va veintitrés PR por detrás]].
- [[04-problemas-pendientes#UX-062 — Hallazgos abiertos de la auditoría del 2026-08-19]],
  ocho hallazgos sin reverificar desde el 2026-08-19.

## Divergencia con el protocolo del vault

`~/Proyectos/CLAUDE.md` dice que las sesiones van a `~/segundo-cerebro`. Esta
nota se ha escrito en `docs/sesiones/` del repositorio por instrucción expresa
para esta tarea, que es también donde viven las cuarenta y dos notas anteriores.
Queda apuntado para que no parezca un descuido.
