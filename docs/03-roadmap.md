---
tipo: roadmap
actualizado: 2026-07-29
---

# Roadmap

> [!important]
> El repositorio no contenía un roadmap formal. Este documento ordena trabajo
> que se desprende directamente del código, el README y los problemas
> verificados. Es backlog documental, no una promesa de alcance o fecha.

## 1. Estabilizar el prototipo publicado

- Actualizar React Router a una versión sin los avisos moderados actuales y
  volver a ejecutar build y audit.

Detalle: [[04-problemas-pendientes]].

## 2. Alinear documentación y comportamiento

- Actualizar el README: el catálogo ya no es solo iPhone y el proyecto usa
  imágenes locales de producto.
- Mantener este vault al día cada vez que cambien rutas, datos, decisiones,
  riesgos o comandos de verificación.
- Registrar sesiones solo cuando aporten contexto no capturado en los
  documentos canónicos.

## 3. Validar contenido con Banana Computer

Pendientes ya declarados en el repositorio:

- Manual e identidad de marca definitivos.
- Precios, promociones y stock reales.
- Condiciones de financiación, envío, seguro, garantía y descuento educativo.
- Funcionamiento y presencialidad del Plan Renove.
- Revalidación periódica de tiendas, horarios y servicios antes de presentarlos
  como información comercial definitiva.
- Reseñas reales y autorización/uso de recursos de marca e imágenes.

Hasta esa validación deben conservarse las etiquetas de contenido demostrativo.

## 4. Definir la evolución a producto real

Solo después de acordar alcance:

- Fuente real de catálogo, precios y disponibilidad.
- Autenticación y cuenta.
- Carrito y pedidos de servidor.
- Pago, financiación, cupones y seguros.
- Emails, newsletter, implementación del chat ya reservado en la interfaz y
  formularios.
- Mapas, reservas y seguimiento de pedidos.
- Estrategia de privacidad, seguridad, analítica y tratamiento de datos.

## 5. Añadir una base de calidad

- Definir lint y formato.
- Añadir tests unitarios para datos, formato y store.
- Añadir tests de componentes para selección, modales y validación.
- Añadir E2E para navegación profunda en GitHub Pages, carrito y checkout.
- Incorporar comprobaciones de accesibilidad y presupuesto de bundle al CI.

## 6. Ideas surgidas de la auditoría UX de la web oficial (2026-07-28)

Basado en [[auditorias/auditoria-web-oficial-banana]].

**Implementadas** en la rama `feature/audit-ux-improvements`
(2026-07-28):

- ✅ (revertida el 2026-07-29) `<h1>` semántico en la portada del
  prototipo. Tras revisión visual se retira por completo la franja
  "Bienvenido / Banana Computer — Apple en Canarias" y **no se
  añade otro H1**. La portada empieza directamente por el
  `HeroCarousel`; los títulos de los slides son `<h2>`.
- ✅ **Servicio Técnico Autorizado** — vive en `/servicio-tecnico`
  (página propia enlazada desde la barra utilitaria y desde
  `/soporte`). Contiene banner "Sin cita previa", checklist con el
  **orden correcto** (1) copia de seguridad → (2) desactivar la
  protección o modo antirrobo cuando corresponda → (3) desactivar
  la función Buscar, opciones de entrega, condiciones de garantía /
  fuera de garantía (35 € con descuento o no reembolsable) y plazos
  orientativos con mínimo de 3 días de traslado y aclaración de que
  ese plazo no incluye diagnóstico ni reparación. `/soporte` queda
  como centro de ayuda genérico con activadores de la guía.
- ✅ Nueva guía interactiva "Preparar mi dispositivo"
  (`DevicePreparationGuide`) con 4 pasos, confirmaciones,
  navegación teclado y trampa de foco. Estado local (sin
  `localStorage`, sin peticiones).
- ✅ Renombrado del quick-link "Iniciar reparación" a
  "Preparar mi dispositivo" en `src/data/content.ts`.
- ✅ Timeline del Plan Renove con valoración estimada online,
  finalización en tienda y tratamiento específico para Mac, sin
  precios ni tasador propio.
- ✅ **axe integrado** en la suite E2E. Ejecuta `color-contrast` y
  `region` sobre **ocho rutas más la guía interactiva** (`/`,
  `/iphone`, ficha de producto, `/tiendas`, `/soporte`,
  `/servicio-tecnico`, `/plan-renove`, `/checkout/1` + guía). No
  hay reglas globalmente desactivadas.
- ✅ Corrección real de contraste (paleta muted / cian utilitaria /
  verde disponibilidad).

**Añadido el 2026-07-29** en `feature/comparator-essential`:

- ✅ Rediseño del comparador esencial en `/comparar` inspirado en
  la claridad del comparador oficial de Apple (columnas +
  diferencias esenciales), sin copiar CSS ni textos: nuevo
  módulo `src/data/productDecisionData.ts` con los campos
  esenciales por familia y utilidades para "Solo diferencias" /
  "Mostrar todas", resumen orientativo y sustitución en columna.
  Compatibilidad con `banana:compare` existente sin migración.

**Añadido el 2026-07-29** en `chore/release-candidate-cleanup`:

- ✅ Node.js 24 en `.github/workflows/e2e.yml` y
  `.github/workflows/deploy.yml`.
- ✅ `.nvmrc` en la raíz con `24`.
- ✅ Retirado `tsconfig.tsbuildinfo` del repositorio y añadido
  `*.tsbuildinfo` al `.gitignore`.

**Pendiente**:

- Franja fija "Total — Continuar" en checkout móvil, sin tocar la
  lógica del seguro ni la trampa de foco existente del chat.
- Cobertura axe adicional del detalle de tienda
  (`/tiendas/:slug`).

Descartadas expresamente (mismo informe): tasador propio del Plan
Renove, sistema de citas para servicio técnico y chat con IA real.
