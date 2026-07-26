# Variaciones de estilo dentro de "minimalista moderno"

Todas parten del mismo esqueleto (escala tipográfica + ritmo de espaciado + un
acento). Cambia el mood, no los fundamentos.

## Swiss / editorial
- Sans-serif neutra (Neue Haas, Inter, Söhne), rejilla muy visible.
- Mucho negro sobre blanco, tipografía enorme, casi sin color.
- Numeración de secciones (01 — 02 — 03), reglas finas, texto alineado a la izquierda.
- Ideal para: agencias, portfolios, marcas de diseño.

## Editorial serif
- Display serif con contraste (Fraunces, GT Sectra, Ogg) + sans para texto.
- Aire generoso, líneas finas, un acento cálido.
- Ideal para: publicaciones, estudios, marcas "premium" cálidas.

## Glassmorphism (con moderación)
- Superficies con `backdrop-filter: blur()` + fondo translúcido + borde 1px claro.
- Solo sobre fondos con textura/gradiente/imagen; sobre blanco plano no se ve.
- Cuidado con el contraste del texto encima y con el coste de `backdrop-filter` en móvil.

```css
.glass {
  background: rgb(255 255 255 / 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgb(255 255 255 / 0.3);
}
```

## Brutalismo suave / anti-design
- Bordes negros gruesos, sombras duras desplazadas, tipografía monoespaciada.
- Rompe reglas a propósito para provocar; NO es lo mismo que descuidado.
- Ideal para: marcas jóvenes que quieren destacar. Úsalo entero o no lo uses.

```css
.brutal {
  border: 2px solid #0a0a0a;
  box-shadow: 4px 4px 0 #0a0a0a;
  border-radius: 0;
}
```

## Dark mode elegante
- Fondo `#0a0a0a`-`#111`, NO negro puro. Superficies un pelín más claras que el fondo.
- Texto no blanco puro (`#ededed`); baja el contraste de lo secundario, no lo subas.
- El acento suele necesitar un punto más de saturación/luz que en light mode.
- Sombras casi no funcionan en dark; usa bordes y diferencia de superficie para separar.

## Bento grid
- Rejilla de tarjetas de tamaños distintos (tipo caja bento), muy usada para features.
- Cada celda una idea; tamaños que guían la jerarquía. `grid-template-areas` o
  `grid-auto-flow: dense`. Radios y gaps consistentes son lo que lo hace verse pulido.

## Fuentes gratis que se ven caras
Inter, Geist, General Sans, Satoshi, Fraunces, Instrument Serif, Space Grotesk,
Bricolage Grotesque. Cárgalas con `font-display: swap` y solo los pesos que uses.
