---
tipo: sesion
fecha: 2026-07-28
tema: auditoría UX de la web oficial de Banana Computer
---

# Auditoría UX de la web oficial de Banana Computer

## Objetivo

Analizar https://tienda.bananacomputer.com/ desde el punto de vista
UX, generar hallazgos accionables y compararlos con el prototipo
existente en `Oskrrr09/pagina-banana` sin implementar todavía
ninguna mejora.

## Metodología

- Preparación: scripts locales en `scripts/banana-audit/`.
- Sesión manual con `npm run audit:banana:login` (sin lectura ni
  almacenamiento de credenciales por parte del script).
- Recorrido headless (Chromium desktop 1440×900 + Chromium móvil
  Pixel 5) con `npm run audit:banana` sobre 23 páginas públicas.
- Navegación manual complementaria para las áreas privadas
  (`/cuenta`, pedidos, favoritos) con la sesión previamente
  guardada; se documentan de forma anonimizada.
- Todas las capturas y el JSON generado se guardan sólo en
  `audit-private/banana/` (ignorado por Git).

## Medidas de seguridad

- No se leen ni imprimen credenciales, cookies, tokens ni cabeceras.
- El `storageState` vive en `playwright/.auth/banana-test-user.json`
  y está bloqueado por `.gitignore` (`git check-ignore` verificado
  antes y después del recorrido).
- No se pulsa el botón que confirma pedido. El último control
  observado en el checkout es el botón **"Realizar pedido"**;
  la auditoría se detiene ahí.
- No se introduce tarjeta, CVV, IBAN, ni se autoriza Bizum ni se
  inicia financiación.
- No se modifican datos personales, direcciones ni contraseñas.
- Toda evidencia se anonimiza antes de tocar el repositorio.

## Secciones revisadas

Públicas (23): portada, catálogos iPhone/Mac/iPad/Apple Watch,
AirPods (bajo `/accesorios-apple/`), `/accesorios/`, fichas de
iPhone 17 Pro y MacBook Air 13" M5, comparador iPhone, Rincón del
Chollo, Seguros a todo riesgo, Plan Renove, Servicio Técnico,
Tiendas y ficha de tienda, Soporte, Empresas, Educación, Descuento
educativo, Financiación, Envíos a domicilio, Política de
privacidad.

Privadas (navegación manual): cuenta, pedidos, direcciones,
favoritos. Se registra estructura, no contenido.

## Limitaciones

- Las URLs de la web oficial son largas (`/comprar-un-iphone/`) y
  la primera versión del script probó slugs cortos que devolvieron
  404. Se corrigieron los slugs y se relanzó (46 visitas
  automatizadas totales).
- Se detectó `TypeError` en `/financiacion/` (bundle
  `serviciosfinanciacompra_ettef`); no se depuró, se registró como
  hallazgo BC-UX-004.

## Hallazgos (resumen)

Detalle en [[auditorias/auditoria-web-oficial-banana]].

| ID | Área | Gravedad |
| --- | --- | --- |
| BC-UX-001 | H1 ausente en 15/23 páginas | Alta |
| BC-UX-002 | 324/417 imágenes sin `alt` en comparador | Alta |
| BC-UX-003 | Formularios sin `label` en Empresas/Educación/Financiación | Alta |
| BC-UX-004 | `TypeError` en `/financiacion/` | Media |
| BC-UX-005 | Slugs largos `/comprar-un-…/` | Baja |
| BC-UX-006 | `/accesorios/` sobredimensionada (782 links, 180 imgs) | Media |
| BC-UX-007 | Falta badge "Abierto ahora/Cerrado" | Media (oportunidad) |
| BC-UX-008 | Financiación fragmentada en 3 páginas | Media |
| BC-UX-009 | Contraste bajo en enlaces secundarios | Baja |
| BC-UX-010 | Cabecera con muchas capas | Baja |
| BC-UX-011 | Plan Renove sin pasos explicados | Media |
| BC-UX-012 | Servicio técnico sin banner "sin cita previa" | Baja |
| BC-UX-013 | Seguros no aparecen en ficha de producto | Media |
| BC-UX-014 | Carrito local no comunicado al usuario | Oportunidad |
| BC-UX-015 | Checkout móvil sin total sticky | Media |

## Comparación con el prototipo

Nuestro prototipo ya cubre bien varias áreas (H1 en catálogos y
fichas, slugs cortos, badge "Abierto ahora/Cerrado" en tiendas con
hora Canarias, foco visible, trampa de foco en el chat provisional,
guardas del checkout).

Áreas donde podemos ganar con esfuerzo bajo (no implementadas en
esta sesión):

- `<h1>` en la portada del prototipo.
- Banner "Sin cita previa" en `/soporte`.
- Timeline explicativa del Plan Renove (sin tasador propio).
- `sticky total` en checkout móvil.
- axe en la suite Playwright.

## Recomendaciones

Ver §12 del informe. Se proponen cinco mejoras concretas para la
próxima iteración; ninguna se implementa aquí.

## Comandos ejecutados

```bash
git checkout -b chore/auditoria-web-oficial-banana
npm install --save-dev tsx @types/node
npm run audit:banana:login   # ejecutado manualmente por el usuario
npm run audit:banana         # público × desktop y mobile
npm run build
npm run test:e2e
```

Comando pendiente si se desea la parte autenticada:

```bash
npm run audit:banana -- --auth
```

## Archivos

Nuevos:

- `scripts/banana-audit/create-session.ts`
- `scripts/banana-audit/run-audit.ts`
- `docs/auditorias/auditoria-web-oficial-banana.md`
- `docs/sesiones/2026-07-28--auditoria-web-oficial-banana.md` (este
  archivo)

Modificados:

- `.gitignore` (sesiones y capturas privadas)
- `package.json` (scripts + devDeps `tsx`, `@types/node`)
- `package-lock.json`
- `docs/03-roadmap.md` (§6 con propuestas)
- `docs/04-problemas-pendientes.md` (UX-BANANA-001)
- `docs/05-registro-de-cambios.md` (entrada 2026-07-28)

No modificados (deliberadamente):

- `src/**` — el prototipo no se toca en esta sesión.
- Cualquier archivo relacionado con el seguro (`insurancePrice`,
  `cartInsuranceTotal`, `setLineInsurance`, `CartPage`,
  `CheckoutPage` en la parte del seguro, y las pruebas
  `checkout-flow.spec.ts` / `checkout.spec.ts`).
- Configuración de Playwright y workflows E2E / Pages.

## Pendientes

- Decisión sobre implementar las cinco propuestas del §12 del
  informe (rama nueva cuando se autorice).
- Revisión conjunta con Banana para acceso a datos reales.

## Commit, PR y workflows

Se completan al final de esta sesión — ver `docs/05-registro-de-cambios.md`
y el mensaje del commit para los IDs finales.
