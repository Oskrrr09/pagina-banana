---
tipo: cambios
actualizado: 2026-07-26
---

# Registro de cambios

Este registro resume cambios relevantes. Git sigue siendo la fuente exacta para
autores, diffs y marcas de tiempo.

## Sin publicar

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
