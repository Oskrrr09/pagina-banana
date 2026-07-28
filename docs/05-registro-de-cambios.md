---
tipo: cambios
actualizado: 2026-07-28
---
	
# Registro de cambios

Este registro resume cambios relevantes. Git sigue siendo la fuente exacta para
autores, diffs y marcas de tiempo.

## 2026-07-28 — Hooks del checkout, trampa de foco del chat, docs y E2E

Rama `fix/checkout-hooks-docs-e2e`.

- `CheckoutPage`: todos los hooks se llaman antes de cualquier retorno
  condicional. Las guardas de los pasos 1, 2 y 3 se mantienen; la
  confirmación sigue sobreviviendo a recargas y el pedido demostrativo
  sigue creándose sólo al pulsar "Confirmar pedido".
- `ChatBubble`: trampa de foco completa (Tab / Shift+Tab cíclicos entre
  "Cerrar" e "Ir a soporte"), Escape cierra y devuelve el foco al botón
  flotante, y el resto del documento se marca `inert` mientras el panel
  está abierto. El botón flotante pasa a "Ocultar chat" al estar abierto
  para no colisionar con el nombre accesible del botón interno.
- README: "PNGs oficiales" → "Imágenes oficiales optimizadas en WebP",
  sección explícita de reseñas y textos comerciales demostrativos, y
  retirada la mención a `prefers-color-scheme` (la interfaz está en
  modo claro fijo).
- Suite Playwright ampliada de 9 a 21 pruebas: entrega compartida
  carrito↔checkout, seguro sin duplicar cantidad, color/capacidad con
  basename, Apple Watch tamaño y GPS/Cellular, recarga profunda,
  ausencia de errores de hooks en consola, favoritos, comparador y
  trampa de foco del chat con teclado.
- Docs actualizados: `00-estado-actual.md`,
  `04-problemas-pendientes.md` (cierra DOC-001; abre y cierra
  HOOKS-001 y A11Y-001; amplía QA-001).

## 2026-07-28 — PNGs transparentes Air+iMac, nav una sola fila, publicado

Workflow `30313993859` completado con `success`.

- MacBook Air (4 colores) e iMac 24" M4 (7 colores): sustituidas por PNGs
  transparentes 1080×1080 (RGBA) descargados directamente del CDN de Apple
  (`store.storeimages.cdn-apple.com`, `fmt=png-alpha`). Sin fondo blanco.
  iMac mantiene `imageBg` para el fondo de color característico.
- Nav strip Mac: una sola fila con `overflow-x-auto no-scrollbar`, items a
  `w-24 shrink-0`, centrados en lg+. Los 9 items son visibles sin scroll en
  escritorio y con scroll horizontal en móvil.

## 2026-07-28 — Imágenes Air/Pro corregidas y Mac mini visible, publicado

Workflows `30312650928` y `30313030912` completados con `success`.

- MacBook Air M4/M5: reemplazadas las imágenes anteriores (vista de perfil cerrado) por recortes correctos de la vista frontal abierta del compuesto oficial de Apple (y=60–400 sobre 504×876, escalado a 1080×1080 blanco). Azul cielo usa la imagen oficial de 1080×1080 de Apple Newsroom. Cuatro colores: Medianoche, Plata, Blanco estrella y Azul cielo.
- MacBook Pro M4/M5: reencuadradas las cinco imágenes de color para centrar verticalmente el portátil (recorte y=265, altura=750; relleno a 1080×1080). El portátil pasa del 28–89 % al ~20–80 % del encuadre.
- Catálogo Mac — nav strip: cambiado de desplazamiento horizontal (`overflow-x-auto`) a cuadrícula flexible (`flex-wrap justify-center`). Todos los modelos incluido Mac mini son visibles sin necesidad de scroll.
- iMac 24" M4 en nav: la miniatura aplica `imageBg` como `backgroundColor` del contenedor, igual que en las tarjetas de producto.

## 2026-07-27 — Imágenes Air abiertas, fondo iMac y Mac mini, publicado

Workflow `30283909013` completado con `success`.

- MacBook Air M4/M5: las imágenes por color (Medianoche, Plata, Blanco estrella, Azul cielo) muestran ahora el portátil abierto recortado de la imagen compuesta de Apple, rellenado a 1080×1080.
- iMac 24" M4: añadido `imageBg` por color para que el fondo del contenedor de imagen coincida con el fondo de la foto, eliminando el recuadro visible en tarjetas y ofertas.
- Página Mac: nueva sección "Catálogo completo" con `ProductCard` para todos los modelos, haciendo visible Mac mini y Mac Studio independientemente de si tienen oferta.

## 2026-07-27 — Imágenes Mac por color, publicado

Workflow `30277394128` completado con `success`.

- MacBook Neo actualizado a 4 colores reales (Plata, Cítrico, Rosa nube, Índigo) con imágenes PNG individuales de Banana Computer.
- MacBook Pro M4 y M5: imágenes por color (Negro espacial / Plata) en lugar de imagen única.
- MacBook Air M4: añadido 4.º color Azul cielo con imagen oficial.
- MacBook Air M5: añadido color Blanco estrella (4 colores totales).
- iMac 24" y Mac mini: imágenes redimensionadas de 2250×2250 a 1080×1080 para uniformidad visual.

## 2026-07-26 — Tema automático del dispositivo, pendiente de publicación

- Retirado el botón de tema de la cabecera comercial y de checkout.
- Eliminados el proveedor React, la preferencia `banana:theme` y el fundido
  asociado al cambio manual.
- El modo oscuro se activa exclusivamente mediante
  `prefers-color-scheme: dark` y responde a cambios del dispositivo.
- En modo claro se conserva la presentación blanca original.

## 2026-07-26 — Selector de tema e imágenes Mac, publicado

La PR [#5](https://github.com/luis-lop-nas/pagina-banana/pull/5) se fusionó en
`main`. El workflow
[`30214178171`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30214178171)
compiló y publicó la versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Añadido un selector claro/oscuro en la cabecera comercial y en checkout.
- La preferencia del sistema actúa como valor inicial y la elección manual se
  conserva en `localStorage`.
- El paso entre temas usa un fundido accesible de 360 ms que respeta la
  reducción de movimiento.
- Corregidas las franjas blancas laterales de la campaña principal en modo
  oscuro.
- Sustituidas las ocho siluetas del selector Mac por fotografías oficiales
  descargadas de Apple Newsroom, documentadas y centradas en marcos uniformes.
- Compilación de producción y comprobación manual local correctas.
- En producción se verificaron la persistencia del tema, el fondo negro de la
  campaña y la carga y el centrado de las ocho imágenes.

## 2026-07-26 — Consistencia visual y tema del dispositivo, publicado

La PR [#4](https://github.com/luis-lop-nas/pagina-banana/pull/4) se fusionó en
`main`. El workflow
[`30211613240`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30211613240)
compiló y publicó la versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Fijada la altura del carrusel de tiendas y del mega-menú de escritorio.
- El mega-menú Mac usa imagen de producto, sitúa “Nuevo” sobre la tarjeta y
  lista juntos los MacBook Air M4/M5 y los MacBook Pro M4/M5.
- Normalizadas las áreas internas de las tarjetas de producto para alinear las
  tarjetas de una misma categoría.
- La ficha muestra controles de cantidad junto al carrito una vez que la
  variante está añadida; la capacidad conserva el color seleccionado.
- La cabecera de checkout usa un amarillo pastel opaco.
- Añadido tema automático claro/oscuro según el dispositivo.

## 2026-07-26 — Catálogo y flujo de compra publicado

La PR [#3](https://github.com/luis-lop-nas/pagina-banana/pull/3) se fusionó en
`main`. El workflow
[`30210351355`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30210351355)
compiló y publicó la versión, verificada después en
<https://luis-lop-nas.github.io/pagina-banana/>.

- Nueva presentación de iPhone y Mac con franja horizontal de modelos, ofertas
  destacadas y acceso directo a variantes.
- Categoría Mac ampliada a ocho grupos actuales de producto, con imágenes
  locales y precios siempre marcados como demostrativos.
- La ficha separa “Comprar” —checkout inmediato— de “Añadir al carrito” —seguir
  comprando—.
- El seguro se vincula a cada producto y puede modificarse en su tarjeta de
  cesta y en “Pago y extras”; el resumen calcula el total por unidades
  aseguradas.
- La cabecera exclusiva del checkout adopta un amarillo suave para diferenciarse
  de la cabecera comercial.
- Añadido un globo amarillo global que reserva el acceso al futuro chat y
  comunica que todavía no está disponible.
- Verificados build, rutas principales y 375, 768, 1024 y 1440 px sin
  desbordamiento horizontal.
- Registrado el aviso no bloqueante del workflow sobre la retirada de Node 20.

## 2026-07-26 — Flujo de variantes y seguro publicado

La PR [#2](https://github.com/luis-lop-nas/pagina-banana/pull/2) se fusionó en
`main` y el workflow
[`30208520075`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30208520075)
publicó correctamente esta versión en GitHub Pages.

### Flujo de variantes y seguro

- “Comprar” en las tarjetas de color abre ahora la ficha de la capacidad y el
  color seleccionados.
- Las URLs de variante respetan el `basename` `/pagina-banana/`.
- El botón defectuoso de seguro se sustituyó por una casilla accesible.
- El seguro se persiste como opción única del pedido, añade 8,99 € sin duplicar
  productos y se comparte entre ficha, carrito y checkout.
- Verificados build y recorrido manual en escritorio y a 375 px.

## 2026-07-26 — Publicado en GitHub Pages

La PR [#1](https://github.com/luis-lop-nas/pagina-banana/pull/1) se fusionó en
`main` y el workflow
[`30206642599`](https://github.com/luis-lop-nas/pagina-banana/actions/runs/30206642599)
publicó correctamente esta versión en
<https://luis-lop-nas.github.io/pagina-banana/>.

### Presentación y accesibilidad

- Sustituida la reseña ficticia por un espacio neutro para futuras opiniones
  verificadas.
- Separado checkout del layout comercial: una cabecera simplificada y sin
  footer general en los tres pasos.
- Actualizadas las cinco tiendas con direcciones, horarios, fecha de consulta y
  fuentes oficiales; eliminado el estado “Abierto ahora”.
- El selector de recogida del checkout reutiliza los datos centrales de tiendas.
- Añadida trampa de foco, Escape, retorno del foco, ARIA modal y bloqueo de
  scroll al menú móvil.
- Convertido el footer móvil en acordeones cerrados inicialmente, con controles
  táctiles de al menos 44 px.
- Reforzada la newsletter móvil con campo y botón de 48 px, texto de 16 px y
  apilado sin desbordamiento a 375 px.
- Ajustado el breakpoint de la navegación comercial para evitar desbordamiento
  a 1024 px.

### Documentación

- Añadido `AGENTS.md` con reglas de contexto, alcance, mantenimiento documental
  y verificación.
- Creado el vault compartido `docs/` con estado, contexto, decisiones, roadmap,
  problemas pendientes y registro de cambios.
- Reservado `docs/sesiones/` para notas de continuidad.
- Ignorada la configuración local `docs/.obsidian/` y `.obsidian/`.
- Incorporados los skills locales de `.agents/` como guías reutilizables del
  repositorio.

### Verificación

- Compilación de producción correcta.
- Instalación reproducible con `npm ci`.
- Comprobación manual correcta a 375, 768, 1024 y 1440 px.
- Registrados dos avisos moderados de seguridad de React Router.

## Historial existente

### 2026-07-27

- `b1dcb2e` — Centrado imagen hero (recorte negro izquierda) y corrección de
  overflow horizontal de página (overflow-x: hidden en html/body).
- `2a12431` — Flechas bento, lupa a la izquierda del carrito, overlay de
  búsqueda con sugerencias por categoría y recorte de banda gris inferior del hero.
- Push directo a `main` en ambos casos.

### 2026-07-26

- `bdd7c85` — Fusiona las correcciones de presentación y accesibilidad.
- `e7de00b` — Añade despliegue automático a GitHub Pages.
- `76642b3` — Unifica el color de marca a amarillo Banana.
- `35fca54` — Ajustes de tiendas, comparador y cabecera.
- `a7e08e6` — Rediseño Banana: catálogo multi-familia, estética amarilla y
  nuevas secciones.

### 2026-07-25

- `aa0bb54` — Prototipo navegable de Banana Computer (Fase 2, §8.2).
- `711023f` — Initial commit.
