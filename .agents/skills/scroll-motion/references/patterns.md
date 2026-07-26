# Patrones avanzados de scroll

## Scrollytelling (texto + visual sincronizados)
Un panel visual fijo (imagen/canvas/3D) a un lado y bloques de texto que van
pasando al otro; cada bloque, al entrar, cambia el visual. Estructura:

1. Contenedor con `display: grid`, dos columnas.
2. Columna visual con `position: sticky; top: 0; height: 100vh`.
3. Columna de texto con varios `.step` de altura ~100vh.
4. Un `ScrollTrigger` por `.step` que, en `onEnter`/`onEnterBack`, actualiza el visual.

Usa `toggleActions` o callbacks; no calcules el estado a mano en cada frame.

## Galería horizontal con scroll vertical
Ver Receta 3 de SKILL.md (pin + `xPercent`). Para que el alto de scroll sea
correcto, el `end` debe ser igual al ancho total del track menos un viewport.

## Text splitting (revelar palabra a palabra / letra a letra)
Divide el texto en spans (con la util SplitText de GSAP, o manual) y anima cada
span con un pequeño `stagger`:

```ts
gsap.from('.word', {
  yPercent: 120, opacity: 0, stagger: 0.04, ease: 'power3.out',
  scrollTrigger: { trigger: '.headline', start: 'top 80%' },
})
```
Envuelve cada línea en un contenedor con `overflow: hidden` para el efecto de
"las palabras suben desde detrás de una máscara".

## Kinetic typography
Tipografía a gran escala que reacciona al scroll (peso variable, tamaño, posición).
Usa una fuente variable y anima `font-variation-settings` o `font-weight` con
`useTransform`/scrub. Sutil: el texto es contenido, no debe volverse ilegible.

## Snap entre secciones
Para el efecto "cada scroll salta a la siguiente sección completa":
`scroll-snap-type: y mandatory` en el contenedor y `scroll-snap-align: start` en
cada sección. Combínalo con Lenis con cuidado — a veces conviene desactivar Lenis
en las zonas con snap para que no peleen.

## Rendimiento
- Prefiere un único `gsap.ticker` (ya lo da la integración con Lenis) a muchos rAF.
- Agrupa reveals con `batch()` de ScrollTrigger si tienes decenas de elementos.
- En móvil, reduce o desactiva parallax/pin pesados: el scroll táctil + pin da
  peor sensación y consume batería.
