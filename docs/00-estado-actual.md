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
- Commit auditado: `e7de00bc3f8d6a944c0b64433512c6440e16ea25`
  (`Añade despliegue automático a GitHub Pages`).
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
- Catálogo desarrollado para cinco familias: iPhone, Mac, iPad, Apple Watch y
  AirPods. Accesorios existe en navegación, pero redirige al catálogo de iPhone.
- Once modelos con variantes de color/capacidad, imágenes locales, precios y
  disponibilidad de ejemplo.
- Búsqueda sobre modelos, categorías, servicios y contenido de ayuda.
- Favoritos, comparador de hasta tres productos de la misma familia y carrito.
- Persistencia local en las claves `banana:cart`, `banana:fav` y
  `banana:compare` de `localStorage`.
- Checkout de tres pasos, simulador de financiación y selector de stock por
  tienda, todos sin transacciones ni consultas reales.
- Directorio de cinco tiendas de ejemplo, filtros y fichas individuales.
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

## Verificación realizada

El 2026-07-26:

- `npm ci --cache /tmp/codex-npm-cache-pagina-banana`: correcto.
- `npm run build`: correcto; 419 módulos transformados.
- Salida principal: CSS `44.84 kB` (`8.56 kB` gzip) y JavaScript `397.93 kB`
  (`120.99 kB` gzip).
- El build conservó sin cambios `tsconfig.tsbuildinfo` y el resto de archivos
  versionados.
- `npm audit`: dos vulnerabilidades moderadas, ambas en la cadena de
  `react-router-dom@6.30.4`; hay corrección disponible. Véase
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].

## Navegación de la documentación

- [[01-contexto-del-proyecto]]
- [[02-decisiones]]
- [[03-roadmap]]
- [[04-problemas-pendientes]]
- [[05-registro-de-cambios]]
