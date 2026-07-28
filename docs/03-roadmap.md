---
tipo: roadmap
actualizado: 2026-07-26
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

- ✅ `<h1>` semántico único en la portada del prototipo
  ("Banana Computer — Apple en Canarias"). El hero pasa a `<h2>`
  para no duplicar nivel.
- ✅ Bloque "Servicio Técnico Autorizado" en `/soporte` con banner
  "Sin cita previa", checklist de preparación (copia de seguridad,
  desactivar Buscar y modo antirrobo), opciones de entrega,
  condiciones de garantía / fuera de garantía (35 € con descuento o
  no reembolsable) y plazos orientativos con mínimo de 3 días de
  traslado y aclaración de que ese plazo no incluye diagnóstico ni
  reparación.
- ✅ Timeline oficial del Plan Renove (4 pasos con Foxway) sin
  precios, sin ejemplos de tasación y sin tasador propio.
- ✅ Cobertura `@axe-core/playwright` sobre 7 rutas dentro de la
  suite E2E existente.

**Pendiente**:

- Franja fija "Total — Continuar" en checkout móvil, sin tocar la
  lógica del seguro ni la trampa de foco existente del chat.

Descartadas expresamente (mismo informe): tasador propio del Plan
Renove, sistema de citas para servicio técnico y chat con IA real.
