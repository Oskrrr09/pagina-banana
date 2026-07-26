---
tipo: estado
actualizado: 2026-07-26
---

# Estado actual

> [!summary]
> Prototipo SPA navegable y compilable de una tienda Apple para Banana Computer.
> La experiencia cubre catálogo, búsqueda, favoritos, comparación, carrito,
> checkout simulado, servicios, Plan Renove, tiendas y soporte. No existe backend
> ni integración comercial real.

## Referencia de la auditoría

- Rama: `main`.
- Commit funcional desplegado: `a1143615cb8443ac8d62fccc694acd31337183ba`
  (merge de la PR
  [#2](https://github.com/luis-lop-nas/pagina-banana/pull/2)).
- URL pública verificada:
  <https://luis-lop-nas.github.io/pagina-banana/>.
- Sin diferencias en archivos versionados antes de iniciar esta estructura
  documental.
- Ya existían dos carpetas locales no versionadas: `.agents/` y `.obsidian/`.
  `.agents/` replica los skills versionados en `.claude/skills/`; se incorpora
  al repositorio como guía de trabajo para agentes. `.obsidian/` permanece como
  configuración local ignorada.

## Qué funciona hoy

- Navegación cliente con React Router y página 404.
- Home con campaña, bento, categorías, lanzamientos, ofertas, servicios,
  tiendas, FAQ y newsletter de demostración.
- La portada reserva un bloque neutro para futuras opiniones verificadas, sin
  testimonios, nombres ni valoraciones inventadas.
- Catálogo desarrollado para cinco familias: iPhone, Mac, iPad, Apple Watch y
  AirPods. Accesorios existe en navegación, pero redirige al catálogo de iPhone.
- Once modelos con variantes de color/capacidad, imágenes locales, precios y
  disponibilidad de ejemplo.
- Búsqueda sobre modelos, categorías, servicios y contenido de ayuda.
- Favoritos, comparador de hasta tres productos de la misma familia y carrito.
- Persistencia local en las claves `banana:cart`, `banana:insurance`,
  `banana:fav` y `banana:compare` de `localStorage`.
- El configurador de modelo abre la ficha profunda de la variante seleccionada
  al pulsar “Comprar”; la ficha conserva color y capacidad en la URL.
- El seguro a todo riesgo es una opción del pedido: no añade unidades, suma
  8,99 € al total y mantiene el mismo estado entre ficha, carrito y checkout.
- Checkout de tres pasos con layout propio, una única cabecera simplificada y
  sin navegación o footer comerciales.
- Directorio de cinco tiendas con direcciones y horarios contrastados con las
  fichas oficiales el 2026-07-26. No se muestra un estado “Abierto ahora”:
  los horarios llevan fuente y aviso de posibles variaciones.
- El menú móvil mueve y confina el foco, cierra con Escape, devuelve el foco al
  disparador y bloquea/restaura el scroll de fondo.
- En móvil, los bloques del footer comienzan cerrados como acordeones; la
  newsletter mantiene controles de al menos 48 px y texto de 16 px.
- Motion para transiciones/reveals y reglas globales para reducir movimiento.

## Qué no existe

- Backend, API, base de datos, autenticación o cuenta de usuario.
- Pago, pedidos, emails, cupones, newsletter, chat, formulario de contacto,
  reservas, mapas, stock, financiación o Plan Renove reales.
- Tests automatizados, script de lint o comprobación E2E.
- Catálogo desarrollado para accesorios.

## Stack efectivo

Las versiones instaladas desde `package-lock.json` durante la auditoría fueron:

| Pieza | Versión |
| --- | --- |
| React / React DOM | 18.3.1 |
| React Router DOM | 6.30.4 |
| Motion | 11.18.2 |
| Vite | 6.4.3 |
| TypeScript | 5.9.3 |
| Tailwind CSS / plugin de Vite | 4.3.3 |

El workflow de GitHub Actions usa Node 20, ejecuta `npm ci` y `npm run build`, y
publica `dist/` en GitHub Pages en cada push a `main`.

El despliegue de la PR #1 finalizó correctamente el 2026-07-26 en el workflow
[`30206642599`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30206642599).
La URL pública devolvió HTTP 200, cargó los recursos desde
`/pagina-banana/assets/` y mostró el bloque neutro de opiniones.

El despliegue de la PR #2 finalizó correctamente en el workflow
[`30208520075`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30208520075).
La versión pública abrió `512gb-naranja` desde el configurador, conservó el
`basename` y mostró el seguro como casilla.

## Verificación realizada

El 2026-07-26, en la rama `fix/product-variant-flow`:

- `npm run build`: correcto; 420 módulos transformados.
- Recorrido manual correcto desde modelo hasta variante, carrito y “Pago y
  extras”.
- La variante `512gb-naranja` conserva `/pagina-banana/` en la URL al cambiar
  de color o capacidad.
- Con seguro seleccionado, el carrito mantiene una unidad, muestra 8,99 € y un
  total de 1.487,99 € para el iPhone 17 Pro 512GB de ejemplo.
- La casilla llega marcada al checkout y conserva el mismo importe.
- A 375 px no existe scroll horizontal y el control del seguro mide 62 px de
  alto.

El 2026-07-26, en la rama `fix/presentation-polish`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-polish`: correcto.
- `npm run build`: correcto; 420 módulos transformados.
- Salida principal: CSS `44.95 kB` (`8.55 kB` gzip) y JavaScript `401.15 kB`
  (`121.86 kB` gzip).
- No existen scripts de test ni lint.
- Comprobación manual correcta a 375, 768, 1024 y 1440 px, sin scroll
  horizontal.
- Comprobados portada, newsletter, menú móvil con teclado, footer, tiendas,
  carrito y los tres pasos del checkout.
- El menú cierra con Escape, conserva el foco dentro mientras está abierto y lo
  devuelve al botón disparador.
- Checkout mantiene una sola cabecera y no renderiza el footer comercial.
- `npm audit`: dos vulnerabilidades moderadas, ambas en la cadena de
  `react-router-dom@6.30.4`; hay corrección disponible. Véase
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].

## Navegación de la documentación

- [[01-contexto-del-proyecto]]
- [[02-decisiones]]
- [[03-roadmap]]
- [[04-problemas-pendientes]]
- [[05-registro-de-cambios]]
