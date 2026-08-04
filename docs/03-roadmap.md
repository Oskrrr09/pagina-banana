---
tipo: roadmap
actualizado: 2026-08-04
---

# Roadmap

> [!important]
> El repositorio no contenía un roadmap formal. Este documento ordena trabajo
> que se desprende directamente del código, el README y los problemas
> verificados. Es backlog documental, no una promesa de alcance o fecha.

## 1. Estabilizar el prototipo publicado

- Confirmar en CI el Supabase local ya versionado y ejecutar los 27 casos de
  `tests/rls/` contra GoTrue, PostgREST y Storage.
- Solo después: integrar las PR #33 y #34, activar Anonymous sign-ins en el
  proyecto de demostración, aplicar la migración y publicar el frontend
  compatible en la misma ventana.
- Actualizar React Router a una versión sin los avisos moderados actuales y
  volver a ejecutar la suite completa y `npm audit`.

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

## 5. Mantener la base de calidad

- [x] TypeScript, ESLint, Vitest, pruebas de esquema, Playwright y axe en CI.
- [x] E2E contra el artefacto compilado y despliegue dependiente de calidad.
- [ ] Resolver los 23 avisos actuales de hooks sin reescribir efectos a
      ciegas; cada cambio necesita una regresión que justifique la conducta.
- [ ] Añadir presupuesto o división de bundle: el JavaScript principal supera
      actualmente el umbral de 500 kB sin comprimir de Vite.

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

**Añadido el 2026-07-29** en `feature/favorites-availability-alerts`:

- ✅ Favoritos ampliados con seguimiento demostrativo de
  disponibilidad, centro de notificaciones interno y campana
  en la cabecera. Inventario determinista en
  `src/data/demoStoreInventory.ts`, contexto en
  `src/lib/favoriteAlerts.tsx`. Sin emails, sin peticiones de
  red, sin PII.

**Añadido el 2026-07-29** en `feature/favorite-store`:

- ✅ Tienda favorita local (`src/lib/storePreference.tsx`) con
  bottom sheet inicial no bloqueante, selector "Mi tienda" en
  cabecera y menú móvil, priorización en `/tiendas`,
  `StoreDetail` y `StorePicker`. Sin datos personales.

**Añadido el 2026-07-29** en `feature/apple-finder-assistant`:

- ✅ Asistente "Encuentra tu Apple" en `/elige-tu-apple` con
  recorrido determinista (intro → familia → generales opcionales →
  específicas → resultados). Sin IA real, sin backend, sin
  persistencia obligatoria. `scoreModel` puro. Accesos desde
  portada, barra utilitaria, comparador y favoritos.

**Añadido el 2026-07-29** en `feature/comparator-essential`:

- ✅ Rediseño del comparador esencial en `/comparar` inspirado en
  la claridad del comparador oficial de Apple (columnas +
  diferencias esenciales), sin copiar CSS ni textos: nuevo
  módulo `src/data/productDecisionData.ts` con los campos
  esenciales por familia y utilidades para "Solo diferencias" /
  "Mostrar todas", resumen orientativo y sustitución en columna.
  Compatibilidad con `banana:compare` existente sin migración.

**Añadido el 2026-07-29** en `chore/release-candidate-cleanup`:

- ✅ Node.js 24 en el workflow unificado `.github/workflows/ci.yml`.
- ✅ `.nvmrc` en la raíz con `24`.
- ✅ Retirado `tsconfig.tsbuildinfo` del repositorio y añadido
  `*.tsbuildinfo` al `.gitignore`.

**Pendiente**:

- Franja fija "Total — Continuar" en checkout móvil, sin tocar la
  lógica del seguro ni la trampa de foco existente del chat.

Descartadas expresamente (mismo informe): tasador propio del Plan
Renove, sistema de citas para servicio técnico y chat con IA real.

## 7. Chat de Bananito — Fase 2 y siguientes

Fase 1 desplegada el 2026-07-30 (ver
[[sesiones/2026-07-30--chat-bananito-supabase-agente]]).

**Fase 2 — Piloto interno con auth** (implementada el 2026-07-31 con
cuentas ficticias, ver [[02-decisiones#D-027 — Fase 2 con cuentas ficticias]]):

- [x] Políticas RLS basadas en `auth.uid()` para agentes y visitantes. El
      widget no pide cuenta, pero usa una sesión anónima verificable; ya no
      existe lectura incondicional del chat.
- [x] Login de agentes en `/agente/login` — con email y contraseña, no
      magic link (ver [[02-decisiones#D-029 — Email + contraseña en vez de magic link]]).
- [x] Tabla `agentes` y asignación de conversaciones (`agente_id`).
- [x] Estado de agente: `disponible` / `ocupado` / `ausente`.
- [x] Ficha del visitante en la columna derecha del panel, con sus
      conversaciones anteriores.
- [x] Ocultar `/agente` de robots (`robots.txt`), hecho el 2026-07-30.
- [ ] Indicador de "está escribiendo" bidireccional vía Supabase
      Presence. **Aplazado**: no aporta a la demostración y añade una
      suscripción más que mantener.
- [x] Notificaciones (`Notification` API) al llegar un mensaje, hecho el
      2026-07-31 junto con la PWA del panel. Se desaplazó porque con la
      app instalada sí aporta: es lo que permite atender sin tener la
      ventana delante. Sin sonido propio — el del sistema basta.

**Fase 2 bis — Cuenta de cliente** (implementada el 2026-07-31):

- [x] Registro, login y perfil (`/registro`, `/login`, `/cuenta`).
- [x] Direcciones de envío y facturación.
- [x] Historial de pedidos persistente cuando hay sesión.
- [x] Reservas por lista de espera para variantes sin stock
      (ver [[02-decisiones#D-030 — Reservas por orden de pago, sin guardar la posición]]).
- [x] Descuento educativo con justificante y validación manual por un
      agente.
- [ ] Migrar favoritos y tienda habitual a la cuenta. **Aplazado**: ver
      [[04-problemas-pendientes#CUENTAS-003 — Favoritos y tienda favorita siguen fuera de la cuenta]].
- [ ] Avisar al cliente cuando le toca el turno de una reserva o cuando
      se resuelve su descuento. Hoy el estado cambia en la base de datos
      pero no se notifica por ningún canal.

**Fase 2 bis — Aplicaciones** (2026-07-31): se resolvió con dos piezas
distintas en vez de una, ver
[[02-decisiones#D-039 — Dos aplicaciones distintas: la tienda nativa, el panel como PWA]].

*Panel de agentes — PWA instalable* (hecho):

- [x] `manifest-agente.webmanifest`, iconos propios y service worker
      generado en el build.
- [x] Icono en el Dock con contador de conversaciones sin leer
      (Badging API).
- [x] Notificaciones del sistema al llegar un mensaje.
- [x] Arranque y navegación sin conexión, con aviso al perderla.
- [ ] Atajo global para traer al frente. **No se puede desde una PWA**;
      necesitaría envoltorio nativo.
- ~~Tauri~~ **descartado**: exigía instalar el toolchain de Rust,
  distribuir el binario a mano y un certificado de Apple de 99 €/año solo
  para que macOS no lo marcase como aplicación no identificada. La PWA da
  Dock, contador y notificaciones sin nada de eso.

*Tienda — app nativa con Capacitor* (compilada en ambos sistemas):

- [x] `capacitor.config.ts`, `npm run build:app`, proyectos `ios/` y
      `android/`, iconos y pantallas de carga.
- [x] Compilar y ejecutar el binario de **Android** (2026-08-01): APK
      generado y verificado en emulador, con navegación profunda dentro
      del WebView.
- [x] Compilar y ejecutar el binario de **iOS** en simulador (2026-08-01).
- [ ] Publicar en App Store y Google Play. **No es trabajo de código**:
      exige autorización de Banana, sus cuentas de desarrollador
      (99 €/año + 25 $) y sustituir los datos demostrativos por reales.
      Detalles en [[06-app-nativa]].
- [ ] Notificaciones push (FCM + APNs). Trabajo aparte.

**Fase 3 — Multicanal**:

- WhatsApp Business API vía Meta como primer canal externo. Webhooks
  a Supabase Edge Function, unificación en el mismo modelo
  `conversaciones` + `mensajes` con nueva columna `canal`.
- Instagram Direct como segundo canal.
- Panel del agente muestra chip 🟢WhatsApp / 📷Instagram / 💻Web por
  conversación.

**Fase 4 — IA como asistente**:

- RAG sobre el catálogo (productos, tiendas, servicios, FAQs) con
  Supabase Vector (pgvector) o Qdrant.
- Modelo por API (Groq / Together / OpenAI) con fallback a modo
  humano si la respuesta no supera un umbral de confianza.
- Historial de intervenciones IA vs agente humano para poder
  auditar y ajustar prompts.

Descartada expresamente: IA ejecutándose en el navegador del
visitante (WebLLM). Inviable en móvil, primera carga demasiado
larga.
