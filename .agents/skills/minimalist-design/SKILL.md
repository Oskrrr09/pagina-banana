---
name: minimalist-design
description: >-
  Sistema de diseño para webs minimalistas, elegantes y modernas: escala
  tipográfica, ritmo de espaciado, paleta y color, jerarquía visual, uso del
  whitespace y tokens de diseño en CSS/Tailwind. Úsalo al empezar el look & feel
  de una web, al elegir fuentes/colores/tamaños, cuando algo "se ve genérico o de
  plantilla", o cuando el usuario pida "minimalista", "elegante", "limpio",
  "premium" o "que respire". Da valores concretos y un tema base listo para pegar,
  no principios vagos.
---

# Minimalist Design

El minimalismo elegante no es "poner poco", es **decidir mucho sobre poco**:
una escala tipográfica coherente, un ritmo de espaciado constante, una paleta
restringida y mucho whitespace intencional. Lo que hace que una web se vea "de
plantilla" casi siempre es la falta de estas decisiones, no falta de adornos.

## 1. Tipografía — la decisión que más pesa

En una web minimalista la tipografía **es** el diseño. Reglas:

- **Una o dos familias como máximo.** Una display para titulares + una para texto,
  o una sola variable bien usada. Pares que funcionan: Inter + Inter, Söhne/Neue
  Haas, Fraunces (display serif) + Inter (texto), General Sans, Geist.
- **Escala modular, no tamaños al azar.** Usa una razón (1.25 "major third" o 1.333
  "perfect fourth") y deriva todos los tamaños de un base de 16-18px.
- **Titulares grandes y con `letter-spacing` negativo.** Los titulares grandes
  necesitan tracking apretado (`-0.02em` a `-0.04em`) para no verse sueltos.
- **`line-height` inverso al tamaño.** Texto pequeño → 1.5-1.7; titulares grandes
  → 1.0-1.15. Un titular a 1.5 se ve roto.
- **Ancho de línea 60-75 caracteres** en párrafos (`max-width: 65ch`). Más ancho
  cansa; más estrecho pica.

```css
@theme {
  --text-xs: 0.79rem;   /* escala 1.25 desde 1rem */
  --text-sm: 0.889rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.563rem;
  --text-2xl: 1.953rem;
  --text-3xl: 2.441rem;
  --text-4xl: 3.052rem;
  --text-5xl: 3.815rem;
}
```

## 2. Espaciado — un ritmo, no números sueltos

Todo el spacing debe salir de una escala base (4px u 8px). Que un padding sea
`23px` en vez de `24px` es lo que hace que algo se sienta "descuidado" sin que
sepas por qué. Tailwind ya impone esta escala — respétala, no metas valores
arbitrarios con `[13px]`.

Whitespace generoso = percepción de calidad. Regla: **cuando dudes, más aire.**
El espacio entre secciones grandes debe ser claramente mayor (3-5×) que el
espacio dentro de un bloque, para que el ojo agrupe.

## 3. Color — restringido y con un solo acento

Paleta minimalista típica:

- **Fondo:** casi blanco o casi negro, nunca `#fff`/`#000` puros (fatigan y se ven
  duros). `#fafafa` / `#0a0a0a`.
- **Tinta (texto):** el opuesto del fondo pero suavizado.
- **Grises:** 2-3 tonos para texto secundario, bordes, superficies.
- **Un acento, uno solo.** Todo lo demás es neutro. El acento marca lo interactivo
  y los CTAs. Meter tres colores de marca a la vez rompe el minimalismo.

```css
@theme {
  --color-paper: #fafafa;
  --color-ink: #0a0a0a;
  --color-muted: #6b6b6b;   /* texto secundario */
  --color-line: #e6e6e6;    /* bordes/divisores */
  --color-accent: #4f46e5;  /* el único acento */
}
```

- **Contraste:** texto normal mínimo 4.5:1 sobre su fondo (WCAG AA). Los grises
  "elegantes" muy claros suelen fallar esto — verifícalo, no lo asumas.
- **Bordes:** casi siempre 1px de un gris muy sutil (`--color-line`), no negro.

## 4. Jerarquía y layout

- **Un punto focal por pantalla.** Si todo grita, nada destaca. Tamaño, peso y
  espacio crean jerarquía mejor que el color.
- **Grid como esqueleto, roto a propósito.** Las webs modernas usan grids
  asimétricos y elementos que se salen/solapan el grid de forma intencional —
  pero sobre una rejilla base, no al azar. La asimetría controlada se ve moderna;
  el desorden se ve roto.
- **Alineación consistente.** Elige ejes de alineación y respétalos. El 90% de los
  layouts "amateur" es texto centrado que debería ir alineado a la izquierda.
- **Radios y sombras coherentes.** Un solo radio (o dos: uno para botones, uno para
  tarjetas). Sombras suaves y de baja opacidad, o ninguna. Nada de sombras duras
  negras salvo que el estilo sea deliberadamente brutalista.

## 5. Tokens base listos para pegar

```css
@theme {
  --radius: 0.75rem;
  --shadow-soft: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06);
  --ease-out-expo: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 150ms;
  --duration-base: 300ms;
}
```

## 6. El test anti-plantilla

Antes de dar por bueno un diseño, pregúntate:
1. ¿Todos los tamaños de texto salen de la escala, o hay números sueltos?
2. ¿Hay UN acento, o he metido varios colores "porque quedaban bien"?
3. ¿El whitespace entre secciones es claramente mayor que dentro de ellas?
4. ¿La tipografía tiene tracking/line-height ajustado por tamaño, o todo es default?
5. ¿Pasa el contraste AA?

Si alguna falla, ahí está el motivo de que "se vea genérico". Para el estilo
concreto (tipo de fuentes, mood) y variaciones (glassmorphism, editorial,
brutalismo suave), ver `references/styles.md`.
