---
tipo: sesion
fecha: 2026-07-26
tema: tema según dispositivo
---

# Tema según dispositivo

## Objetivo

Hacer que la web determine el modo claro u oscuro exclusivamente a partir de la
preferencia del dispositivo, sin ofrecer un botón propio.

## Estado inicial

La página usaba un proveedor React, un control en ambas cabeceras y la clave
`banana:theme` para dar prioridad a una elección manual.

## Trabajo realizado

- Retirado el control de las cabeceras comercial y de checkout.
- Eliminados `ThemeToggle`, el proveedor React y los iconos exclusivos del
  selector.
- Simplificado `main.tsx` para que no lea ni escriba una preferencia visual.
- Convertidos los tokens oscuros a una media query nativa
  `prefers-color-scheme`.
- Conservadas las fotografías Mac, su centrado y el resto de funcionalidades.

## Comprobaciones

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana-system-theme`: correcto.
- `npm run build`: correcto; 421 módulos transformados.
- No existen scripts de test ni lint configurados.
- Código sin referencias al proveedor, al selector, a `data-theme` ni a
  `banana:theme`.
- Navegador en modo claro: superficie blanca, texto oscuro y ausencia del botón.
- El CSS de producción contiene `@media (prefers-color-scheme: dark)` con todos
  los tokens de contraste anteriores.

## Archivos afectados

- `src/main.tsx`
- `src/index.css`
- `src/components/layout/Header.tsx`
- `src/components/layout/CheckoutLayout.tsx`
- `src/components/ui/Icon.tsx`
- `src/components/ui/ThemeToggle.tsx` (eliminado)
- `src/lib/theme.tsx` (eliminado)
- Documentación viva relacionada.

## Siguiente paso

Ejecutar la verificación reproducible, publicar y comprobar GitHub Pages.
