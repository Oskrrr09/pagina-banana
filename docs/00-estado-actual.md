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
- Commit funcional desplegado: `03e11f13f3a3c6446382441a39a78a427332caed`
  (merge de la PR
  [#5](https://github.com/luis-lop-nas/pagina-banana/pull/5)).
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
- Dieciocho modelos con variantes de color/capacidad, imágenes locales, precios y
  disponibilidad de ejemplo.
- Las familias iPhone y Mac presentan un selector horizontal de modelos y una
  zona de ofertas; cada modelo abre directamente su variante configurable.
- La categoría Mac incluye MacBook Neo, MacBook Air M4/M5, MacBook Pro M4/M5,
  iMac 24" M4, Mac Studio y Mac mini M4.
- Búsqueda sobre modelos, categorías, servicios y contenido de ayuda.
- Favoritos, comparador de hasta tres productos de la misma familia y carrito.
- Persistencia local en las claves `banana:cart`, `banana:fav` y
  `banana:compare` de `localStorage`.
- La ficha conserva color y capacidad en la URL. “Comprar” añade la variante y
  abre el checkout; “Añadir al carrito” la guarda sin abandonar la ficha.
- El seguro a todo riesgo se asocia a cada línea del carrito: no añade unidades,
  suma 8,99 € por unidad asegurada y se puede activar o retirar tanto en la
  tarjeta de cesta como en “Pago y extras”.
- Checkout de tres pasos con layout propio, una única cabecera simplificada y
  amarilla suave, sin navegación o footer comerciales.
- Acceso flotante global al futuro chat, identificado expresamente como
  “próximamente” y enlazado al soporte existente.
- Las tarjetas de producto reservan las mismas áreas para imagen, nombre y
  descripción, de modo que mantienen una altura alineada dentro de cada rejilla.
- El carrusel de tiendas y el mega-menú de escritorio mantienen una altura fija
  al cambiar de contenido; el menú Mac muestra una imagen del destacado y
  ordena juntos los MacBook Air y los MacBook Pro.
- La ficha permite aumentar o quitar unidades de una variante ya añadida sin
  abandonar la página; cambiar capacidad conserva el color elegido.
- La interfaz detecta automáticamente `prefers-color-scheme` y sigue el modo
  claro u oscuro del dispositivo, incluso si cambia mientras la página está
  abierta.
- No existe un selector de tema ni se guarda una preferencia visual propia.
- La franja de modelos Mac usa fotografías oficiales de producto almacenadas
  localmente, centradas dentro de marcos de tamaño constante; su procedencia se
  registra en `public/img/products/SOURCES.md`.
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

El despliegue de la PR #4 finalizó correctamente el 2026-07-26 en el workflow
[`30211613240`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30211613240).
La URL pública devolvió HTTP 200, cargó los recursos desde
`/pagina-banana/assets/` y mostró el bloque neutro de opiniones.

El despliegue de la PR #5 finalizó correctamente el 2026-07-26 en el workflow
[`30214178171`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30214178171).
La versión pública conservó el tema oscuro tras navegar, mantuvo el fondo negro
continuo de la campaña y cargó las ocho fotografías Mac centradas.

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

El 2026-07-26, en la rama `feature/catalog-and-purchase-flow`:

- `npm run build`: correcto; 421 módulos transformados.
- Recorrido manual correcto desde las portadas de iPhone y Mac hasta una
  variante, cesta y “Pago y extras”.
- Verificados los dos destinos de compra: checkout inmediato y añadido sin
  abandonar la ficha.
- El seguro se comprobó por línea de producto en ficha, cesta, resumen y
  checkout.
- Comprobación responsive a 375, 768, 1024 y 1440 px sin scroll horizontal.
- El acceso al chat abre un aviso de disponibilidad futura, cierra con Escape y
  devuelve el foco a su botón.
- La PR #3 se fusionó en `main`; el workflow
  [`30210351355`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30210351355)
  compiló y desplegó correctamente.
- La URL pública mostró el catálogo Mac, la ruta profunda de MacBook Neo, las
  dos acciones de compra, el seguro por producto, la cabecera amarilla suave y
  el globo del chat.

El 2026-07-26, en la rama `fix/layout-consistency`:

- `npm run build`: correcto; 421 módulos transformados.
- La tarjeta de tiendas midió 340 px antes y después de cambiar entre Banana
  Castillo y Banana La Laguna.
- Al cambiar MacBook Neo de `8 GB · 256 GB` a `16 GB · 512 GB`, el color
  Cítrico y el sufijo `-citrico` de la URL se conservaron.
- Revisado el modo oscuro del dispositivo en portada y ficha: contraste correcto
  en superficies, texto, tarjetas, cabecera amarilla y controles de compra.

El 2026-07-26, en la rama `fix/theme-and-mac-images`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-theme`: correcto.
- `npm run build`: correcto; 423 módulos transformados.
- Salida principal: CSS `49.93 kB` (`9.42 kB` gzip) y JavaScript `419.54 kB`
  (`126.08 kB` gzip).
- No existen scripts de test ni lint.
- El selector cambia de claro a oscuro y de oscuro a claro con un fundido de
  360 ms; la clase temporal se retira al terminar.
- La preferencia manual se conserva al recargar y, mientras no exista, se sigue
  el modo del dispositivo.
- La imagen principal de portada mantiene fondo negro en todo su ancho en ambos
  temas, sin franjas blancas laterales.
- Los ocho modelos Mac cargan fotografías locales procedentes de Apple Newsroom
  y sus centros visuales coinciden con los centros de sus marcos.

El 2026-07-26, en la rama `codex/system-theme-detection`:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-system-theme`: correcto.
- `npm run build`: correcto; 421 módulos transformados.
- Salida principal: CSS `49.37 kB` (`9.33 kB` gzip) y JavaScript `417.44 kB`
  (`125.37 kB` gzip).
- No existen scripts de test ni lint.
- La detección queda implementada exclusivamente mediante
  `@media (prefers-color-scheme: dark)`.
- Eliminados el selector de tema, su proveedor React y la lectura/escritura de
  `banana:theme`.
- En modo claro del dispositivo, la portada usa superficie blanca y texto
  oscuro; no se renderiza ningún control de tema.
- El bundle de producción no contiene `data-theme`, `banana:theme` ni la
  etiqueta accesible del antiguo botón.

## Navegación de la documentación

- [[01-contexto-del-proyecto]]
- [[02-decisiones]]
- [[03-roadmap]]
- [[04-problemas-pendientes]]
- [[05-registro-de-cambios]]
