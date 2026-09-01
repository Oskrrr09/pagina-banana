---
tipo: roadmap
actualizado: 2026-09-01
---

# Roadmap

> [!important]
> El repositorio no contenía un roadmap formal. Este documento ordena trabajo
> que se desprende directamente del código, el README y los problemas
> verificados. Es backlog documental, no una promesa de alcance o fecha.

> [!info] Revisado al aparcar el proyecto (2026-09-01)
> Cada punto se contrastó con el estado real. Lo resuelto queda marcado como
> **hecho** en su sitio en vez de borrarse, para que no se vuelva a proponer. Lo
> que **no se ha podido demostrar** se dice tal cual: ni se da por hecho ni se
> da por pendiente.

## 1. Estabilizar el prototipo publicado

- **Hecho.** El Supabase local versionado corre en CI, en su propio job, con los
  casos de `tests/rls/` contra GoTrue, PostgREST y Storage. Ya no son 27: son
  **36**, más 103 de integración y 5 de confirmación.
- **Hecho.** Las PR #33 y #34 se integraron y el chat anónimo funciona contra el
  proyecto de demostración; sus flujos están cubiertos por `tests/integration/`.
- **Hecho.** React Router está en **7.18.2**, la versión que cierra los avisos
  moderados. La migración a la **8** sigue pendiente y tiene su apartado en 5.1.
- **Pendiente**: `npm audit` no se ha vuelto a ejecutar en este cierre. Deuda
  pausada a propósito.

Detalle: [[04-problemas-pendientes]].

## 2. Alinear documentación y comportamiento

- **Hecho** al aparcar el proyecto: el README describe las tres superficies
  —web, app nativa y panel—, la frontera de plataforma y el catálogo real de
  cinco familias con imágenes locales.
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
- [ ] Resolver los **24** avisos actuales de hooks sin reescribir efectos a
      ciegas; cada cambio necesita una regresión que justifique la conducta.
- [ ] Añadir presupuesto o división de bundle: el JavaScript principal supera
      actualmente el umbral de 500 kB sin comprimir de Vite.
- [ ] **Migración a React Router 8** — ver el apartado dedicado más abajo.
- [ ] **Registro con Confirm Email activado** — ver 5.2.
- [ ] **Estabilizar `search.spec.ts:342`** — ver 5.3.
- [ ] **Reiniciar preferencias en cierres de sesión externos** — ver 5.4.

## 5.1 Migración a React Router 8

Tarea técnica propia, registrada el 2026-08-06. **No** entra en la PR #35, que
es de *hardening* de seguridad, i18n y calidad: mezclar una migración de
framework con ese trabajo juntaría dos riesgos que conviene evaluar por
separado.

Motivo: `react-router@8.3.0`, publicada el 2026-07-22, es la versión que
corrige `GHSA-qwww-vcr4-c8h2`. Mientras el proyecto siga en la rama 7.x,
`npm audit` seguirá mostrando dos entradas `high` por ese aviso. El aviso sólo
alcanza a las **APIs RSC inestables**, que esta SPA declarativa con
`BrowserRouter` no usa —no hay servidor de React Router, ni acciones RSC, ni
React Server Components—, así que el camino vulnerable no es aplicable y la
migración es mantenimiento, no una urgencia de seguridad.

Lo que exige la versión 8, y por lo que no es un simple salto de versión:

- **Node ≥ 22.22.0**. Hoy `.nvmrc` y CI van con Node 24, así que esto ya se
  cumple; conviene confirmarlo también en cualquier máquina de desarrollo.
- **React y React DOM ≥ 19.2.7**. El proyecto va con React 18.3.1, de modo que
  la migración arrastra un salto mayor de React con su propia superficie de
  cambios.
- **Retirada de `react-router-dom`**. Todas las importaciones del proyecto
  vienen de ese paquete y pasan a `react-router`.
- Revisar la convivencia con **Vite 6** y con la compilación nativa de
  Capacitor.

Criterio de cierre: migración completa, `basename` y rutas profundas intactos,
y la **suite completa** en verde —`npm run check` y `npm run check:full`, con
los cinco motores de Playwright— antes de integrar.

Ver [[02-decisiones#D-058]] y
[[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].

## 5.2 Registro con Confirm Email activado

Tarea propia, registrada el 2026-08-06. **No** entra en la PR #35.

Hoy el registro sólo se puede terminar con Confirm Email **desactivado**, que es
como está la demostración. Con la confirmación activada el backend hace lo
correcto —el email primero, la contraseña sólo tras verificarlo, y ninguna ficha
de cliente mientras la sesión siga siendo anónima—, pero el navegador se queda a
medias: `signUp()` devuelve `needsEmailConfirmation` antes de haber podido fijar
la contraseña, `RegisterPage` dice «revisa tu correo y luego inicia sesión», y no
hay contraseña con la que iniciar sesión ni pantalla donde establecerla.

Lo que haría falta:

- **Ruta de retorno** desde el enlace del correo, con su entrada en
  `additional_redirect_urls`.
- **Estado de registro pendiente** que sobreviva a la salida del navegador y
  permita reconocer, al volver, que esa cuenta está verificada pero sin
  contraseña.
- **Establecimiento de la contraseña después de verificar el email**, en una
  pantalla de «terminar registro», y sólo entonces crear la ficha de cliente y
  vincular el chat.
- Pruebas de ese recorrido en el navegador, no sólo del procedimiento de
  backend: los cinco casos de `tests/confirmacion/conversion.spec.ts` cubren la
  API y la seguridad, no la interfaz.

Hasta que exista, `docs/08-predespliegue-supabase.md` marca Confirm Email como
«debe permanecer desactivado».

## 5.3 Estabilizar `search.spec.ts:342`

Tarea propia, registrada el 2026-08-06.

> [!warning] Estado al aparcar el proyecto: **sin demostrar en ninguno de los
> dos sentidos**. Los últimos runs de CI —del #198 al #211— no registran ni un
> solo `retry`, `flaky` ni `interrupted`, y el fichero ha cambiado desde
> entonces, así que la línea 342 ya no es la que describe este apartado. Eso no
> prueba que la carrera esté resuelta: prueba que no se ha vuelto a ver. Se deja
> abierto porque cerrarlo sin evidencia sería peor.

«Escape con selección cierra, restaura foco y no navega» falla de vez en cuando
en el primer intento y pasa en el reintento. En el run 31084026968 salió como
inestable: el localizador del botón de búsqueda se resolvió catorce veces sin
que la interacción llegara a producirse.

Es anterior a los cambios de la PR #35 y no oculta ningún fallo real, pero un
test inestable deja de dar información: cuando falle de verdad, nadie lo va a
creer.

Cómo **no** se arregla: subiendo los reintentos ni relajando las expectativas.
Eso lo esconde. Hay que encontrar la condición de carrera —lo más probable, que
la prueba interactúe antes de que el overlay del buscador haya terminado su
transición— y esperar por el estado real en vez de por el elemento.

## 5.4 Reiniciar preferencias en cierres de sesión externos

Tarea propia, registrada el 2026-08-06. Riesgo residual de SEG-PREF-001.

Las preferencias de cuenta se reinician cuando el cierre de sesión nace en la
propia pestaña. Falta el cierre que viene de fuera: **otra pestaña** del mismo
navegador, o una **sesión invalidada en el servidor**. En esos casos la sesión
termina y la tienda favorita, los seguimientos y las notificaciones siguen en
`localStorage` hasta el siguiente cierre explícito.

Por qué no se resolvió con `onAuthStateChange` en la misma corrección:

- supabase-js emite `SIGNED_OUT` **antes** de que se resuelva `signOut()`, así
  que emitir el aviso también desde el escuchador lo dispararía dos veces por
  cierre.
- El chat abre sesiones anónimas con el **mismo** cliente de Supabase. Reiniciar
  ante cualquier `SIGNED_OUT` borraría las preferencias de una cuenta cuando lo
  que caduca es la sesión anónima del visitante.

Lo que haría falta: recordar si la sesión que termina era permanente y emitir el
aviso una sola vez, viniera de donde viniera el cierre. Con pruebas de las dos
procedencias y del caso anónimo.

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

## 8. Navegación «Atrás» en la app nativa — COMPLETADA

Entregada en la **PR #68** (`d6e6e9ee`, 2026-08-21) y con la ejecución de CI
posterior en verde, Pages incluido.

Las pantallas secundarias del armazón nativo llevan un control «Volver» en
`AppTopBar`. Con historial propio se retrocede de verdad —el catálogo vuelve
con sus filtros y la búsqueda con su término—; sin él se va a un destino
semántico con `replace`. Las cuatro raíces de la barra —Inicio (`/`), Tienda
(`/tienda`), Compras (`/mis-productos`) y Cuenta (`/cuenta`)— no lo llevan, ni
`/login`, que es la pestaña «Cuenta» sin sesión. Ver
[[02-decisiones#D-073 — «Volver» usa el historial cuando existe y un destino semántico cuando no]].

El inventario previo de rutas —clasificar cada una como raíz, secundaria o
fuera del armazón, y revisar `AppTopBar` y el router antes de decidir dónde
vivía la regla— **se hizo** el 2026-08-21 y es lo que fijó el mapa de destinos.
La regla acabó en `src/lib/appBack.ts` como función pura.

Las condiciones acordadas quedaron **resueltas y verificadas**:

- Ningún `navigate(-1)` a ciegas: el historial se usa cuando el router tiene una
  entrada anterior apilada y, si no, cada pantalla tiene su destino lógico.
- Objetivo táctil de 44 px, galón a la izquierda, área segura intacta, nombre
  accesible «Volver» y `focus-visible`; sin animación nueva, así que
  `prefers-reduced-motion` no necesitó lógica.
- Android no se rompe ni se duplica: el bridge sigue delegando en el historial
  del WebView, que es la misma pila.
- Enlace profundo, entrada directa y las dos anchuras —320×568 y 390×844— están
  cubiertos por `tests/e2e/app-atras.spec.ts`.

## 9. Rematar la identidad visual fuera de la app

`Inicio` de la web sigue con la presentación anterior: la revisión visual del
2026-08-20 se aplicó sólo a las superficies nativas. Queda decidir si la web
adopta la misma dirección de [[02-decisiones#D-071]] o mantiene deliberadamente
un registro corporativo distinto. Sin decidir; no hay trabajo comprometido.
