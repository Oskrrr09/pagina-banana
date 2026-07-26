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
- Emails, newsletter, chat y formularios.
- Mapas, reservas y seguimiento de pedidos.
- Estrategia de privacidad, seguridad, analítica y tratamiento de datos.

## 5. Añadir una base de calidad

- Definir lint y formato.
- Añadir tests unitarios para datos, formato y store.
- Añadir tests de componentes para selección, modales y validación.
- Añadir E2E para navegación profunda en GitHub Pages, carrito y checkout.
- Incorporar comprobaciones de accesibilidad y presupuesto de bundle al CI.
