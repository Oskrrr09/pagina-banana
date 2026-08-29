---
tipo: decisiones
actualizado: 2026-08-21
---

# Decisiones

Este registro recoge decisiones demostrables en el código o en la configuración.
No atribuye motivaciones que el repositorio no documenta.

## D-001 — SPA con Vite, React y TypeScript

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: implementar el prototipo como SPA de React 18 compilada con Vite y
  TypeScript estricto.
- Evidencia: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`.

## D-002 — Tailwind v4 y Motion como capas de presentación

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: usar Tailwind CSS v4 con configuración CSS-first y Motion para las
  transiciones de componentes y entradas en viewport.
- Evidencia: `src/index.css`, imports desde `motion/react` y skills versionados
  en `.claude/skills/`.
- Límite actual: GSAP y Lenis están descritos en los skills, pero no son
  dependencias ni se usan en la aplicación.

## D-003 — Catálogo y contenido locales

- Fecha constatada: 2026-07-25.
- Estado: vigente mientras el proyecto sea prototipo.
- Decisión: modelar catálogo, tiendas y contenido editorial como módulos
  TypeScript estáticos.
- Evidencia: `src/data/products.ts`, `src/data/stores.ts`,
  `src/data/content.ts`.
- Consecuencia: la web no consulta stock, precios, tiendas ni contenido a un
  sistema externo.

## D-004 — Datos comerciales explícitamente demostrativos

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: etiquetar información no validada como “Contenido provisional”,
  “Precio demostrativo”, “Condiciones pendientes de validación” o “Stock de
  ejemplo”.
- Evidencia: `README.md`, `src/data/types.ts` y los badges visibles de la UI.

## D-005 — Estado funcional persistido en localStorage

- Fecha constatada: 2026-07-25.
- Estado: vigente.
- Decisión: mantener carrito, favoritos y comparador en un contexto React y
  persistirlos en el navegador, sin backend.
- Evidencia: `src/lib/store.tsx`.

## D-006 — Catálogo multi-familia con accesorios aún no desarrollados

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: ofrecer catálogo para iPhone, Mac, iPad, Apple Watch y AirPods; la
  entrada Accesorios se conserva como demostración y dirige a iPhone.
- Evidencia: `src/data/products.ts`, `src/data/nav.ts`.

## D-007 — Identidad amarilla Banana

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: unificar identidad y acción en el amarillo `#ffce1f`, con texto
  oscuro sobre amarillo.
- Evidencia: commit `76642b3` e `src/index.css`.

## D-008 — Publicación bajo una subruta de GitHub Pages

- Fecha constatada: 2026-07-26.
- Estado: vigente.
- Decisión: servir la SPA bajo `/pagina-banana/`, desplegarla con GitHub Actions
  al hacer push a `main` y usar un fallback 404 para rutas profundas.
- Evidencia: `vite.config.ts`, `src/main.tsx`, `public/404.html`,
  `index.html`, `.github/workflows/deploy.yml`.

## D-009 — Documentación persistente en un vault aislado

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: usar `docs/` como documentación compartida y vault de Obsidian,
  manteniendo `docs/.obsidian/` y la configuración `.obsidian/` de la raíz fuera
  de Git.
- Evidencia: solicitud del usuario, `AGENTS.md` y `.gitignore`.
- Consecuencia: se versiona el conocimiento del proyecto, no las preferencias
  locales de Obsidian.

## D-010 — Layout exclusivo para checkout

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mantener `/checkout/:step` fuera del layout comercial y envolverlo
  en `CheckoutLayout`, con una sola cabecera simplificada y sin footer general.
- Evidencia: `src/App.tsx`, `src/components/layout/CheckoutLayout.tsx` y
  `src/pages/CheckoutPage.tsx`.
- Consecuencia: los tres pasos conservan el flujo funcional sin duplicar la
  navegación de la tienda.

## D-011 — Horarios con fuente, sin estado en tiempo real

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: conservar en `src/data/stores.ts` las direcciones y horarios
  publicados por Banana Computer, la fecha de consulta y la URL oficial, pero
  no inferir ni mostrar “Abierto ahora”.
- Motivo: un horario regular no garantiza aperturas en festivos o incidencias.
- Consecuencia: la interfaz muestra el horario correspondiente al día en
  Canarias como orientación y pide confirmación antes del desplazamiento.

## D-012 — Navegación modal accesible en móvil

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: tratar el menú móvil como diálogo modal, confinar el foco, cerrarlo
  con Escape, devolver el foco al disparador y bloquear el scroll de fondo.
- Evidencia: `src/components/layout/Header.tsx` y
  `src/components/layout/MobileMenu.tsx`.

## D-013 — Seguro como opción única del pedido

- Fecha: 2026-07-26.
- Estado: reemplazada por D-014.
- Decisión: tratar el seguro a todo riesgo de 8,99 € como una opción del pedido,
  no como una línea ni una unidad de producto.
- Evidencia: `src/lib/store.tsx`, `src/pages/VariantPage.tsx`,
  `src/pages/CartPage.tsx` y `src/pages/CheckoutPage.tsx`.
- Consecuencia: la ficha selecciona el seguro antes de comprar y carrito y
  checkout comparten el mismo estado e importe.

## D-014 — Seguro asociado a cada línea del carrito

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: almacenar el seguro en la línea exacta de familia, modelo, color y
  capacidad, con un coste demostrativo de 8,99 € por unidad.
- Evidencia: `src/lib/store.tsx`, `src/pages/VariantPage.tsx`,
  `src/pages/CartPage.tsx` y `src/pages/CheckoutPage.tsx`.
- Consecuencia: el usuario puede identificar, activar o retirar el seguro para
  cada producto desde la cesta y el checkout sin duplicar unidades.

## D-015 — Acceso directo a variantes desde iPhone y Mac

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mostrar una franja de modelos y ofertas en las familias iPhone y
  Mac, y enlazar sus modelos directamente a la primera variante configurable.
- Evidencia: `src/pages/FamilyPage.tsx`, `src/components/product/ProductCard.tsx`,
  `src/data/nav.ts` y `src/data/products.ts`.
- Consecuencia: la ruta intermedia de modelo sigue siendo válida, pero deja de
  ser un paso obligatorio en estos escaparates.

## D-016 — Entrada global al chat sin simular un servicio activo

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: mantener un botón flotante amarillo en todas las rutas que abre un
  aviso accesible de “próximamente” y enlaza al soporte existente.
- Evidencia: `src/components/layout/ChatBubble.tsx` y `src/App.tsx`.
- Consecuencia: queda reservado el punto de entrada visual sin afirmar que
  exista todavía atención por chat.

## D-017 — Tema automático según el dispositivo

- Fecha: 2026-07-26.
- Estado: reemplazada por D-019.
- Decisión: adaptar la interfaz a `prefers-color-scheme` con tokens oscuros,
  sin añadir un selector ni persistir una preferencia adicional.
- Evidencia: `src/index.css`, `src/components/layout/Header.tsx` y
  `src/components/ui/Button.tsx`.
- Consecuencia: el amarillo Banana conserva texto oscuro y legible, mientras
  las superficies, bordes, campos y contenido comercial se adaptan al modo
  oscuro del sistema.

## D-018 — Dimensiones estables para contenido intercambiable

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: reservar altura en el carrusel de tiendas, mega-menú y tarjetas de
  catálogo, y normalizar los bloques internos de las tarjetas de producto.
- Evidencia: `src/components/home/StoreCarousel.tsx`,
  `src/components/layout/MegaMenu.tsx` y
  `src/components/product/ProductCard.tsx`.
- Consecuencia: los cambios de tienda, familia o texto descriptivo no alteran
  visualmente la rejilla ni desplazan el contenido adyacente.

## D-019 — Tema manual con preferencia del sistema como punto de partida

- Fecha: 2026-07-26.
- Estado: reemplazada por D-021.
- Decisión: ofrecer un control visible de tema claro/oscuro, usar
  `prefers-color-scheme` mientras no exista una elección manual y persistirla en
  `banana:theme`.
- Evidencia: `src/lib/theme.tsx`, `src/components/ui/ThemeToggle.tsx`,
  `src/main.tsx` y `src/index.css`.
- Consecuencia: la página evita un destello de tema incorrecto al iniciar y
  anima el cambio durante 360 ms; con `prefers-reduced-motion`, el cambio es
  inmediato.

## D-020 — Fotografías Mac oficiales y trazables

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: sustituir las siluetas del selector Mac por fotografías de producto
  publicadas por Apple Newsroom, guardarlas localmente y documentar sus páginas
  de origen.
- Evidencia: `src/data/products.ts`, `src/pages/FamilyPage.tsx`,
  `public/img/products/*-photo.jpg` y `public/img/products/SOURCES.md`.
- Consecuencia: las imágenes no dependen de una carga remota y se encuadran
  centradas en marcos uniformes.

## D-021 — Tema controlado exclusivamente por el dispositivo

- Fecha: 2026-07-26.
- Estado: vigente.
- Decisión: aplicar el tema oscuro únicamente con
  `@media (prefers-color-scheme: dark)`, sin control manual ni persistencia
  propia.
- Evidencia: `src/index.css`; ausencia de `ThemeToggle` y del proveedor de tema
  en `src/main.tsx`.
- Consecuencia: la interfaz responde a la preferencia actual del sistema y a sus
  cambios en vivo. Una antigua clave `banana:theme`, si existe en el navegador,
  deja de influir en la página.

## D-022 — Chat de Bananito como sustitución de Quantum Asis

- Fecha: 2026-07-30.
- Estado: vigente (Fase 1 desplegada).
- Decisión: desarrollar un chat propio para clientes web con panel de
  agentes propio (`/agente`) como reemplazo del sistema actual de Banana
  (Quantum Asis). El diseño es un pilar comercial de la propuesta a
  presentar a la dirección.
- Evidencia: `src/components/layout/ChatBubble.tsx`,
  `src/pages/AgentPage.tsx`, `docs/sesiones/2026-07-30--chat-bananito-supabase-agente.md`.
- Consecuencia: se abre la puerta a integraciones multicanal
  (WhatsApp, Instagram) en Fase 2 y a añadir IA/RAG sobre el catálogo
  en Fase 3.

## D-023 — Backend en Supabase (Fase 1)

- Fecha: 2026-07-30.
- Estado: vigente.
- Decisión: usar Supabase (Postgres + Realtime + Auth) como backend
  del chat en lugar de montar servidor propio. Región EU, Postgres 17
  estándar (no OrioleDB por ser experimental).
- Evidencia: `supabase/schema.sql`, `src/lib/supabase.ts`,
  `.env.example`.
- Consecuencia: sin coste en Fase 1 (tier gratuito), sin infraestructura
  que mantener. Si en el futuro Banana exige on-premise, se puede migrar
  a Postgres propio (el esquema es Postgres estándar) y a un WebSocket
  server (Socket.io, Ably) sin cambiar el modelo de datos.

## D-024 — Modo demo como fallback sin credenciales

- Fecha: 2026-07-30.
- Estado: vigente.
- Decisión: cuando faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`,
  el chat cae al modo canned reply original y `/agente` muestra un
  aviso de configuración. `supabaseEnabled` centraliza el switch.
- Evidencia: `src/lib/supabase.ts` (`export const supabase = url && anon
  ? createClient(url, anon) : null`), `src/lib/chatSession.ts`,
  `src/components/layout/ChatBubble.tsx` (bloque `if (session.demo)`),
  `src/pages/AgentPage.tsx` (`SupabaseMissingScreen`).
- Consecuencia: cualquier clon del repo sigue teniendo un prototipo
  navegable sin depender de infraestructura externa. Los tests E2E
  actuales siguen funcionando sin cambios.

## D-025 — Fase 1 sin autenticación de agentes

- Fecha: 2026-07-30.
- Estado: **reemplazada por [[#D-027 — Fase 2 con cuentas ficticias]]**
  el 2026-07-31. Se conserva como historia.
- Decisión: `/agente` es accesible por URL sin login. Las políticas RLS
  de las tres tablas permiten `select`/`insert`/`update` al rol `anon`.
- Evidencia: bloque de políticas en `supabase/schema.sql`, ausencia de
  cualquier proveedor de auth en el frontend.
- Consecuencia: la Fase 1 se puede demostrar sin fricción, pero **la
  URL pública `/agente` es visible para cualquiera que la descubra**.
  Riesgo aceptable mientras el proyecto sea prototipo interno con
  Banana desconociéndolo. Fase 2 debe:
  1. Añadir Supabase Auth con magic link para el rol de agente.
  2. Sustituir las políticas `to anon` por políticas basadas en
     `auth.uid()` y una tabla `agentes`.
  3. Ocultar `/agente` de robots (`robots.txt`) mientras tanto.

## D-026 — Identidad de visitante en `localStorage`

- Fecha: 2026-07-30.
- Estado: vigente.
- Decisión: cada visitante recibe un UUID persistido en `localStorage`
  bajo la clave `bananito:visitor_id`. La conversación activa se guarda
  bajo `bananito:conversation_id`.
- Evidencia: `src/lib/chatSession.ts`, funciones `ensureVisitor` y
  `ensureConversation`.
- Consecuencia: sin flujo de consentimiento adicional ni cookies. Si el
  visitante borra su almacenamiento local pierde el hilo. Cuando toque
  cumplimiento estricto de RGPD (Fase 2+), añadir aviso y opción de
  reset explícito.

## D-027 — Fase 2 con cuentas ficticias

- Fecha: 2026-07-31.
- Estado: vigente. Reemplaza a [[#D-025 — Fase 1 sin autenticación de agentes]].
- Contexto: la Fase 2 estaba bloqueada esperando luz verde de Banana
  porque implicaba agentes reales atendiendo a clientes reales, con sus
  datos en infraestructura montada por Oscar.
- Decisión: construir la Fase 2 completa pero **solo con cuentas
  ficticias** (agentes y clientes de prueba), para poder enseñársela a
  Banana como demostración. Ningún dato real de clientes ni de
  compañeros entra en el sistema.
- Consecuencia: se destraba el desarrollo sin comprometer a nadie. Antes
  de que Banana use esto de verdad hará falta su aprobación explícita,
  revisar el tratamiento de datos personales y decidir si la
  infraestructura sigue siendo Supabase o pasa a algo suyo.

## D-028 — Dos clientes de Supabase, uno por rol

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: `src/lib/supabase.ts` exporta dos clientes contra el mismo
  proyecto: `supabase` (tienda: chat del visitante y sesión de cliente) y
  `supabaseAgent` (panel `/agente`), este último con
  `auth.storageKey = 'banana-agente-auth'`.
- Motivo: supabase-js guarda **una sola sesión por cliente**. Con un solo
  objeto compartido, entrar como agente cerraría la sesión del cliente y
  al revés — justo lo que rompería una demostración en la que se enseñan
  las dos caras a la vez.
- Consecuencia: ambas sesiones conviven en el mismo navegador. La consola
  muestra el aviso "Multiple GoTrueClient instances", que es esperado y
  benigno mientras las claves de almacenamiento sean distintas. Las
  consultas del panel de agentes **deben** usar `supabaseAgent`, o
  viajarán sin el JWT del agente y la RLS las rechazará.

## D-029 — Email + contraseña en vez de magic link

- Fecha: 2026-07-31.
- Estado: vigente. Corrige el punto 1 de [[#D-025 — Fase 1 sin autenticación de agentes]].
- Decisión: tanto los agentes como los clientes entran con email y
  contraseña, no con enlace mágico por correo.
- Motivo: en una demostración en vivo el magic link obliga a abrir una
  bandeja de entrada en ese momento; si el correo tarda o cae en spam, la
  demo se para. Con contraseña se escribe la credencial y se entra.
- Consecuencia: hay que desactivar "Confirm email" en Supabase
  (Authentication → Providers → Email) para que el registro sea
  inmediato. Si se deja activo, el registro sigue funcionando pero pide
  validar el correo antes de entrar; la interfaz lo detecta y lo explica.

## D-030 — Reservas por orden de pago, sin guardar la posición

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: una variante `agotado` o `bajo-pedido` ya no se compra: se
  **reserva**. Cada unidad reservada es una fila en `reservas` y el
  puesto en la cola lo fija `pagado_at`. La posición **no se almacena**:
  se calcula al vuelo con la función `posicion_en_cola` de la base de
  datos.
- Motivo: una posición guardada se queda obsoleta en cuanto alguien por
  delante cancela. Calcularla al leer siempre da el número correcto.
- Consecuencia: cambia el comportamiento de `bajo-pedido`, que hasta
  ahora dejaba comprar como si hubiera stock. La reserva exige cuenta
  iniciada, porque la cola se ordena por cliente y no por navegador.
- Evidencia: `src/lib/reservations.ts`, `supabase/schema.sql`,
  `src/pages/VariantPage.tsx`.

## D-031 — El agente revisa descuentos por función, no por UPDATE

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: aprobar o rechazar un descuento educativo se hace llamando a
  `revisar_descuento_educativo()` (SECURITY DEFINER), no dando permiso de
  UPDATE al agente sobre la tabla `clientes`.
- Motivo: RLS filtra **filas, no columnas**. Una política de UPDATE que
  dejara al agente tocar la fila del cliente le permitiría cambiar
  también su dirección o su teléfono. La función limita la escritura a
  los campos de la revisión.
- Consecuencia: los agentes tienen `select` sobre `clientes` (necesario
  para ver la cola de solicitudes) pero ningún `update`.

## D-032 — En el panel, Bananito va del lado de Banana

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: en `/agente` los mensajes se ordenan desde el punto de vista
  del agente: todo lo que sale de Banana (respuestas del agente **y** del
  bot Bananito) va a la derecha en azul del nav; el cliente va a la
  izquierda. En la burbuja de la web es al revés, porque allí el "tú" es
  el visitante.
- Motivo: antes el bot se pintaba a la izquierda, junto al cliente, y
  desde el panel parecía que las respuestas automáticas las mandaba la
  otra parte. Es el mismo criterio que usan las consolas de soporte al
  uso.
- Matiz: el bot usa una versión pastel del mismo azul (`#cfe4f5`) y la
  etiqueta "Bananito · automático", para distinguir de un vistazo lo
  automático de lo que ha escrito una persona. Sobre ese pastel el texto
  va en tinta, no en blanco, que no tendría contraste suficiente.

## D-033 — El chat identifica al cliente si tiene sesión

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: cuando alguien con la sesión iniciada usa el chat, se guarda
  su `cliente_id`, nombre, email y teléfono en su fila de `visitantes`.
  Se hace también sobre visitantes que ya existían, porque alguien puede
  haber escrito como anónimo y registrarse después.
- Consecuencia: el agente ve con quién habla y puede llamarle. Los
  visitantes sin cuenta siguen funcionando igual, con `cliente_id` nulo y
  un aviso en la ficha de que solo sabemos lo que él haya contado.
- Evidencia: `ensureVisitor` en `src/lib/chatSession.ts`, columnas nuevas
  en `supabase/schema.sql`.

## D-034 — Conversaciones archivables, no borrables

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: el agente cierra conversaciones (`estado = 'cerrada'`) y las
  consulta en una bandeja "Archivadas" aparte, desde donde puede
  reabrirlas. No se borra nada.
- Consecuencia: si el visitante vuelve a escribir tras un cierre, se le
  abre una conversación nueva, porque `ensureConversation` solo reutiliza
  las que están abiertas. El historial anterior sigue accesible desde la
  ficha del visitante.
- Nota de implementación: el filtro va en la consulta, no en cliente, para
  que el límite de 50 no se lo coman las cerradas según crezca el archivo.

## D-035 — El chat anónimo pide nombre y email antes de empezar

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: quien abre el chat sin sesión ve primero un formulario de
  nombre y email. Hasta rellenarlo no se crea conversación ni se puede
  escribir. Los datos quedan en `localStorage` para no volver a pedirlos
  y se copian a su fila de `visitantes`. Con sesión iniciada no se pide
  nada: los datos salen de la cuenta.
- Motivo: si el visitante cierra el chat antes de que le contesten, hace
  falta un contacto para avisarle, como hace el proveedor actual
  (Quantum Asis).
- ⚠️ **El aviso por email no está implementado.** Solo se recoge el
  contacto. La interfaz lo dice explícitamente para no prometer un correo
  que nunca llega. Enviarlo de verdad exige un servicio de email
  (Resend, Postmark…) y una Edge Function que reaccione al mensaje nuevo;
  queda anotado en el roadmap.

## D-036 — Valoración con estrellas al cerrar el chat

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: al cerrar una conversación el agente elige entre "cerrar y
  pedir valoración" o "cerrar sin pedirla". Si la pide, el visitante ve
  un formulario de 1 a 5 estrellas más una observación opcional la
  próxima vez que abra el chat; si no, solo ve que se ha cerrado.
- La valoración vive en columnas de `conversaciones`
  (`valoracion_solicitada`, `valoracion_estrellas`,
  `valoracion_observacion`), no en tabla aparte: es una por conversación
  y así se lee sin joins.
- El visitante la envía por la función `enviar_valoracion()`, no con un
  UPDATE. Es anónimo: si le abriéramos `conversaciones` para escribir
  podría tocar también el estado o la asignación. La función exige
  conocer los DOS uuid (conversación y visitante) y solo deja valorar una
  vez, y únicamente si el agente lo ha pedido.
- Reabrir una conversación retira la petición pendiente; una valoración ya
  enviada no se toca.

## D-037 — Borrado definitivo solo desde el archivo

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: el botón "Eliminar" solo aparece en conversaciones ya
  cerradas, y pide confirmación en un diálogo aparte. Borra la
  conversación y sus mensajes (cascada de la clave foránea).
- Motivo: obligar a cerrar antes evita eliminar por error una
  conversación viva. No hay papelera — lo borrado no se recupera — así
  que la confirmación deja claro que es irreversible.

## D-038 — El visitante puede abrir otra conversación sin recargar

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: cuando el agente cierra una conversación, el visitante ve un
  botón "Escribir otra consulta" que suelta la conversación cerrada y
  abre una nueva en el sitio.
- Motivo: antes el `conversationId` se quedaba fijo en el estado del
  componente, así que quien tenía el chat abierto se quedaba mirando una
  conversación cerrada y **solo podía volver a escribir recargando la
  página**.
- Implementación: se borra la conversación de `localStorage` y se pone
  `conversationId` a null; el efecto de inicialización vuelve a entrar y,
  como la anterior quedó cerrada, `ensureConversation` crea una nueva en
  vez de reutilizarla. El historial anterior no se toca.

## D-039 — Dos aplicaciones distintas: la tienda nativa, el panel como PWA

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: la **tienda** se empaqueta como aplicación nativa para App
  Store y Google Play (Capacitor); el **panel de agentes** se instala como
  PWA desde el navegador. No se hace lo mismo con las dos.
- Motivo: son públicos y canales distintos. Un cliente busca "Banana
  Computer" en la tienda de aplicaciones de su móvil y espera encontrarla;
  ahí una PWA no aparece. Un agente entra desde el ordenador de la tienda,
  no necesita pasar por App Store y publicar en una tienda pública un panel
  interno no tiene sentido.
- Consecuencia: la tienda depende de cuentas de desarrollador de pago y de
  la revisión de Apple; el panel se despliega solo, con cada push a `main`.
- Evidencia: `capacitor.config.ts` (`webDir: 'dist-app'`),
  `public/manifest-agente.webmanifest` y `src/lib/pwa.ts`.
- Descartado: **Tauri** para el panel (ver alternativa en
  [[03-roadmap]]). Habría exigido instalar el toolchain de Rust, distribuir
  un binario a mano y un certificado de Apple de 99 €/año solo para que
  macOS no lo marque como aplicación no identificada. La PWA da Dock,
  contador y notificaciones sin nada de eso.

## D-040 — Un único código para web y app nativa

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: la app nativa envuelve **el mismo build de React** que se
  publica en GitHub Pages. No hay una segunda versión del código.
- Motivo: es un prototipo de demostración; mantener dos interfaces en
  paralelo garantizaría que se separasen.
- **Matiz (2026-08-28, D-085): «un único código» es un único repositorio,
  un único build y un único dominio — no una única composición visual.** Esta
  decisión sigue vigente tal y como se escribió; lo que se aclara es que nunca
  quiso decir que web y app tuvieran que montar la misma estructura de página.
  Ver [[#D-085]].
- Implementación: la única diferencia es la base de las rutas. En Pages la
  web cuelga de `/pagina-banana/`; dentro del binario los ficheros están en
  la raíz. De ahí `npm run build:app`, que construye a `dist-app/` con
  `--base=/`. El `basename` del enrutador ya salía de
  `import.meta.env.BASE_URL`, así que se adapta solo.
- Consecuencia detectada al hacerlo: el `<link rel="preload">` del hero
  tenía `/pagina-banana/` escrito a mano en `index.html` y habría dado 404
  dentro de la app. Ahora va sin base y la antepone Vite en cada build.
- Consecuencia pendiente: cada cambio de la web exige **recompilar y volver
  a publicar** la app en las tiendas, con revisión de Apple por medio. La
  web se actualiza sola; la app no.

## D-041 — Las conversaciones sin leer se cuentan en el dispositivo

- Fecha: 2026-07-31.
- Estado: vigente.
- Decisión: no hay columna de "leído" en la base de datos. Una conversación
  está sin leer si su último mensaje lo escribió el visitante y es
  posterior a la última vez que ese navegador la abrió.
- Motivo: sería estado por agente y por conversación, y en la demostración
  atiende una sola persona. Añadir la tabla ahora sería esquema que
  mantener sin nadie que lo use.
- Limitación asumida y visible: la marca vive en `localStorage`, así que un
  agente que entre desde otro equipo empieza con todo sin leer.
- Evidencia: `src/lib/agentUnread.ts`, clave `banana:agente-visto`.

## D-042 — La app nativa usa la navegación de una app, no la de la web

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: dentro del binario, la tienda cambia de esqueleto: **barra de
  navegación inferior** con cinco destinos (Inicio, Buscar, Favoritos,
  Carrito, Cuenta) y **sin pie de página**. La web no cambia.
- Motivo: quien descarga una app de una tienda espera el pulgar abajo y las
  secciones principales siempre a la vista. Una cabecera con mega-menú y un
  pie con mapa del sitio son correctos en la web y se notan prestados en una
  app.
- Implementación: mismo código. `src/lib/nativeApp.ts` resuelve una sola vez
  si existe `window.Capacitor`, que Capacitor inyecta antes de cargar el
  bundle. No contradice
  [[02-decisiones#D-040 — Un único código para web y app nativa]]: sigue
  habiendo un solo código y un solo build; lo que cambia es el esqueleto.
- Detalles que solo aparecieron al ejecutarlo en un dispositivo, no en el
  navegador: la cabecera necesita `env(safe-area-inset-top)` o queda bajo la
  Dynamic Island, y el aviso de tienda favorita tapaba la barra inferior.
- Forma final (2026-08-01, tras revisarla con Oscar en el emulador):
  - **Arriba no hay cabecera**: la sustituye un buscador (`AppTopBar`). Ni
    logo ni menú: la navegación vive abajo.
  - **Los filtros por familia van dentro del contenido**, no de la
    cabecera, para que se escondan bajo el buscador al bajar y el amarillo
    se encoja hasta dejar solo lo que conviene tener siempre a mano.
  - **Abajo**: Inicio · Favoritos · Explorar · Carrito · Cuenta.
    "Explorar" no es una ruta, es el menú de categorías, que en la web abre
    la hamburguesa de la cabecera.
  - Quinto hueco para **Favoritos** y no para promociones: las promociones
    en tiempo real no existen en el proyecto y una pestaña vacía —o con
    datos inventados— iría contra la regla de contenido demostrativo.
- Evidencia: `src/components/layout/AppTabBar.tsx`,
  `src/components/layout/AppTopBar.tsx`, `tests/e2e/app-shell.spec.ts`.

## D-043 — En la app, el chat vive en "Contacta con nosotros"

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: dentro de la app no hay burbuja flotante de Bananito. El chat se
  abre desde un bloque "Contacta con nosotros" en el menú, junto al centro de
  ayuda y las tiendas.
- Motivo: la burbuja flotante es un patrón de web y, con la barra de
  navegación abajo, competiría por el mismo sitio y el mismo pulgar.
- Implementación: `src/lib/chatLauncher.ts` con un evento del documento.
  Se eligió un evento y no un contexto porque `ChatBubble` se monta fuera de
  `Layout` (ver `src/App.tsx`) y un proveedor tendría que envolver toda la
  aplicación solo para esto.
- Consecuencia que hubo que resolver: sin burbuja no hay elemento al que
  devolver el foco al cerrar. Va al contenido principal, y **después** de que
  se levante el `inert` que el chat aplica al resto del documento: hacerlo
  antes era una operación vacía y el foco acababa en `body`.

## D-044 — Suelo de 16px en los campos, para que iOS no amplíe la página

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: en pantallas táctiles, todo `input`, `select` y `textarea` tiene
  un tamaño de texto mínimo de 16px (`font-size: max(16px, 1em)`).
- Motivo: Safari en iOS **amplía la página** al enfocar un campo cuyo texto
  mida menos de 16px, y una vez ampliada se puede arrastrar de lado. Se
  manifestaba como "la página se desplaza y descuadra lateralmente" al tocar
  el buscador (15px) o el chat (14px). La clase `.field` de los formularios
  ya lo cumplía; el problema estaba en los campos escritos a mano.
- Descartado: `user-scalable=no` en el viewport. Quita el zoom a todo el
  mundo, incluida la gente que lo necesita para leer.
- Se refuerza además con `overscroll-behavior-x: none`, que corta el rebote
  horizontal del WebView.
- Cubierto en `tests/e2e/mobile-layout.spec.ts`, que mide el tamaño real de
  cada campo visible y comprueba que ninguna ruta desborda a 320 y 390px.

## D-045 — El icono de la app es el oficial de Banana, no un dibujo propio

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: el icono de la tienda es el **plátano abierto en blanco sobre
  degradado naranja** que Banana publica en su web, tal cual. No se
  redibuja ni se sustituye por el trazo simplificado que el prototipo usaba
  como favicon.
- Motivo: es su marca. Un icono "parecido" en la pantalla de inicio de un
  móvil es justo donde más se nota que no es el suyo.
- Limitación conocida y a resolver con Banana: **solo lo publican en mapa
  de bits, y el mayor mide 180x180**. De vector solo hay el rótulo. 180 px
  da exacto para el icono de la pantalla de inicio de un iPhone
  (60pt @3x) y sobra para Android, pero el de **1024 px que exige App
  Store se amplía y se ve blando**. Antes de publicar hay que pedirles el
  original.
- La pantalla de carga lleva **solo el rótulo**, que sí es vectorial: el
  icono trae su propio fondo naranja y sobre el amarillo de la pantalla se
  ve como una pegatina.
- El panel de agentes conserva su icono propio (negro con plátano
  amarillo). Es una herramienta interna y conviene distinguirla de la
  tienda en el Dock de un vistazo.
- Evidencia: `public/apple-touch-icon.png` (fuente),
  `scripts/generate-icons.mjs`.

## D-046 — Dentro de la app, el documento no se desplaza

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: en la app, `html` y `body` van a `overflow: hidden` y la
  pantalla es una columna de altura completa: barra de búsqueda, contenido,
  barra de navegación. **Solo el contenido se desplaza.** Ninguna de las dos
  barras usa `position: fixed`.
- Motivo: en WKWebView los elementos fijos **se recolocan al terminar el
  gesto, no durante**. Mientras arrastras parecen despegarse: las barras
  flotaban, el contenido asomaba por encima de la de búsqueda y el menú de
  "Explorar" se desplazaba con la página.
- Historia del arreglo, porque las dos primeras veces no bastó:
  1. Se pasó de `sticky` a `fixed`, pensando que el problema era la
     interacción de `sticky` con el `overflow-x: clip` del documento.
     No era eso.
  2. Se reprodujo en el WebKit de escritorio que trae Playwright: **ahí
     funciona bien**, lo que descartó el `clip` y señaló al comportamiento
     propio de WKWebView en iOS.
  3. Se quitó el scroll del documento. Sin scroll de documento no hay nada
     que recolocar y las barras se quedan quietas por construcción.
- Consecuencia: al cambiar de ruta hay que desplazar el contenedor, no la
  ventana (`Layout`). Y quien mida desbordamiento horizontal tiene que
  mirar el contenedor además del documento.
- La web **no cambia**: sigue con scroll de documento y su cabecera
  `sticky`. El interruptor es el atributo `data-app-shell`, que `Layout`
  pone solo dentro del binario.
- **Efecto colateral que hubo que resolver**: con el documento quieto,
  `contentInset: 'always'` de iOS pasó a desplazar el contenido de forma
  permanente, y el hueco de la barra de estado quedaba reservado **dos
  veces** —una por el WebView y otra por el `env(safe-area-inset-top)` del
  CSS—. Se veía como una franja blanca del fondo nativo y otra amarilla de
  más sobre el buscador. Ahora el WebView va a `contentInset: 'never'` y el
  hueco lo reserva solo el CSS, que además pinta el amarillo por detrás de
  la barra de estado.
- Con el WebView a sangre, las capas a pantalla completa (el menú de
  "Explorar", el buscador) también quedaban bajo el reloj y la batería.
  Se resuelve con la clase `.app-safe-area`, que solo hace algo dentro de
  la app.

## D-047 — La tienda se ofrece en cinco idiomas, la app solo en castellano

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: la **web** se ofrece en castellano, inglés, alemán, francés e
  italiano, con selector de banderas a la derecha de la barra amarilla. La
  **app no lleva selector** y va siempre en castellano.
- Motivo: Canarias vende a mucho visitante extranjero, y ese visitante entra
  por la web. Quien se descarga la app de una tienda de Canarias vive aquí.
  Ofrecer un idioma dentro de la app sin manera de cambiarlo sería peor que
  no ofrecerlo.
- Implementación: el castellano es la fuente de verdad **y el tipo**. Los
  otros cuatro diccionarios se declaran como `Diccionario`, así que si falta
  o sobra una clave el build falla; no hay que acordarse de revisarlo.
- El idioma se detecta del navegador la primera vez y se recuerda. Un idioma
  que no se ofrece cae al castellano.
- Banderas en **SVG, no emoji**: Windows no trae la fuente de banderas y allí
  un emoji de bandera se ve como las dos letras del país.
- Efecto colateral que hubo que atender: con la detección activa, la suite de
  pruebas —escrita en castellano— pasó a ejecutarse contra la versión
  inglesa, porque el navegador de Playwright viene en inglés. Se fija
  `locale: 'es-ES'` en la configuración; las pruebas de detección lo
  sobrescriben.

## D-048 — Las traducciones son demostrativas y se avisa

- Fecha: 2026-08-01.
- Estado: vigente.
- Decisión: fuera del castellano se muestra un aviso, encima del contenido,
  de que la traducción la ha generado el prototipo y de que la versión válida
  es la española.
- Motivo: el prototipo traduce también condiciones de garantía,
  financiación, seguro y Plan Renove. Una traducción aproximada de una
  condición puede afirmar algo que Banana no ofrece. Mientras el texto no lo
  dé Banana en cada idioma, hay que decirlo.
- Va en el flujo y no como capa flotante: un aviso que tapa media pantalla se
  cierra sin leerlo. Se puede descartar y ofrece volver al castellano.
- Es coherente con lo que ya se hace con los precios, marcados como
  demostrativos desde el principio.

## D-049 — El visitante anónimo tiene identidad verificable y escribe por RPC

- Fecha: 2026-08-02.
- Estado: vigente. Sustituye el resto de acceso abierto que quedaba de
  [[#D-025 — Fase 1 sin autenticación de agentes]].
- Decisión: el chat no exige crear una cuenta, pero obtiene una sesión anónima
  de Supabase. Las políticas relacionan cada fila con `auth.uid()`; el UUID de
  `localStorage` solo recuerda la conversación y no autoriza nada.
- Escritura: visitantes, agentes y clientes no insertan ni actualizan
  directamente las columnas sensibles. Apertura, mensajes, valoración,
  asignación, cierre, reservas y descuento educativo pasan por RPC que deriva
  el propietario, autor, agente, estado y fechas desde la sesión.
- Motivo: RLS filtra filas, no columnas. Una política de `UPDATE` correcta en
  la fila no impide que el cliente cambie el descuento, el agente se ascienda
  o alguien altere la fecha que fija el orden de una reserva.
- Evidencia:
  `supabase/migrations/20260802000100_estado_seguro.sql`,
  `tests/schema/politicas.test.ts` y `tests/rls/politicas.spec.ts`.
- Consecuencia: Anonymous sign-ins debe estar activado. El frontend anterior y
  el esquema final no son compatibles entre sí; se despliegan en la misma
  ventana.

## D-050 — Una migración ejecutable y despliegue bloqueado por calidad

- Fecha: 2026-08-02.
- Estado: vigente.
- Decisión: `supabase/migrations/` es la única fuente SQL ejecutable.
  `supabase/schema.sql` queda como puntero, no como segunda definición. La
  migración se prueba tanto desde cero como sobre el estado exacto anterior.
- CI: un solo workflow encadena tipos, ESLint, Vitest/esquema, build, E2E y
  RLS. Pages solo se publica desde `main` después de superar toda la cadena.
- Validación RLS: PGlite comprueba PostgreSQL y las políticas en cada cambio;
  GoTrue, PostgREST y Storage requieren además un proyecto Supabase dedicado.
  Un push a `main` sin sus tres secretos debe fallar en vez de publicar.
- Motivo: antes `schema.sql` podía reabrir políticas que las migraciones
  cerraban y el workflow de Pages publicaba en paralelo antes de conocer el
  resultado de los E2E.
- Evidencia: `.github/workflows/ci.yml`, `tests/schema/` y
  `tests/rls/README.md`.

## D-051 — El supervisor gestiona asignaciones sin suplantar respuestas

- Fecha: 2026-08-04.
- Estado: vigente.
- Decisión: la interfaz refleja las capacidades del servidor. Un supervisor
  puede liberar una asignación ajena y cerrar o reabrir conversaciones de otro
  agente; la acción se llama explícitamente **«Liberar asignación»**. Un agente
  normal solo gestiona las suyas.
- Autoría: `responder_como_agente()` conserva la restricción de que la
  conversación esté libre o asignada a la propia sesión. Ser supervisor no
  autoriza a firmar una respuesta dentro de la asignación de otra persona. Para
  responder, debe liberarla y asignársela de forma explícita.
- Historial: el panel no ofrece borrado. Cerrar archiva y reabrir recupera; un
  borrado físico sigue reservado a administración con `service_role` fuera del
  navegador.
- Motivo: gestión y autoría son capacidades distintas. Permitir supervisión no
  debe atribuir a una persona mensajes escritos dentro del caso de otra.
- Evidencia: `src/pages/AgentPage.tsx`,
  `tests/e2e-agent/agent-panel.spec.ts` y las pruebas de conversación en
  `tests/schema/politicas.test.ts` y `tests/rls/politicas.spec.ts`.

## D-052 — El informe RLS es JSON puro y conserva el código de Playwright

- Fecha: 2026-08-04.
- Estado: vigente.
- Decisión: el job RLS ejecuta directamente
  `npx playwright test --project=rls --reporter=json > rls.json`, captura `$?`
  antes de reactivar `set -e` y entrega ambos datos al verificador. No pasa por
  `npm run`, porque sus líneas informativas pueden contaminar la salida
  estándar que debe contener exclusivamente JSON.
- Validación: antes de contar resultados, el verificador exige que el archivo
  exista, no esté vacío y sea JSON válido. Un informe ausente, truncado,
  malformado o precedido por el encabezado de npm bloquea la verificación con
  un mensaje explícito.
- Contrato SQL relacionado: los RPC que no admiten `NULL` deben comprobarlo de
  forma explícita antes de escribir; `NULL NOT IN (...)` produce `NULL`, no
  `TRUE`. `revisar_descuento_educativo()` aplica esta regla y conserva intactos
  estado, nota, fecha y revisor cuando rechaza la llamada.
- Evidencia: `.github/workflows/ci.yml`, `scripts/lib/verificar-rls.mjs`,
  `tests/unit/verificar-rls.test.ts`,
  `supabase/migrations/20260802000100_estado_seguro.sql` y
  `tests/schema/politicas.test.ts`.

## D-053 — El chat no recopila user-agent y Storage impone sus propios límites

- Fecha: 2026-08-04.
- Estado: vigente.
- Decisión: `abrir_conversacion()` conserva el parámetro `p_user_agent` para
  no romper clientes anteriores, pero lo ignora, escribe `NULL` y la migración
  limpia los valores históricos. El dato no participa en ninguna función del
  prototipo y no justifica ampliar la huella de identificación del visitante.
- Storage: el bucket privado `descuentos-educativos` limita en servidor los
  objetos a 5 MB y a PDF, JPEG o PNG. Las escrituras solo admiten el nombre
  canónico `<auth.uid()>/justificante.<ext>`; la URL firmada del agente dura
  60 segundos.
- Evidencia: migración
  `20260804000200_minimiza_chat_y_limita_storage.sql`, pruebas de instalación y
  políticas en `tests/schema/`, y el caso Storage de `tests/rls/`.
- Consecuencia de datos: al aplicar la migración se eliminan únicamente los
  valores históricos de `visitantes.user_agent`; no se borra ninguna ficha,
  conversación ni mensaje. La columna se conserva para compatibilidad y una
  reversión operativa simple.

## D-054 — La integración RLS usa Supabase local y datos efímeros por API

- Fecha: 2026-08-04.
- Estado: vigente.
- Decisión: la verificación de GoTrue, PostgREST y Storage en CI levanta
  Supabase local con Docker. No depende de secretos ni de un proyecto alojado.
- Datos: `seed.sql` no inserta usuarios de Auth a mano. La suite crea por API
  dos visitantes, dos clientes, agentes y solicitudes ficticias con marcas
  únicas, obtiene JWT reales y limpia el escenario. Sembrar `auth.users`
  directamente evitaría probar precisamente GoTrue.
- Ejecución: `test:integration` consulta `supabase status -o json`, pasa las
  claves locales al proceso hijo sin imprimirlas y corta antes con un mensaje
  claro si Docker no está disponible.
- CI: `ci.yml` llama al workflow reutilizable
  `supabase-integration.yml`; Pages continúa dependiendo de ese trabajo.
- Evidencia: `supabase/config.toml`, `supabase/seed.sql`,
  `scripts/test-supabase-local.mjs` y el workflow citado.

## D-055 — El panel interno permanece en español con `lang` por ruta

- Fecha: 2026-08-04.
- Estado: vigente.
- Decisión: el panel de agentes no se traduce en esta fase. `IdiomaProvider`
  fuerza `document.documentElement.lang = 'es'` en `/agente` y
  `/agente/login`; al volver a una ruta pública reaplica la preferencia del
  visitante.
- Motivo: es una herramienta interna de Canarias y traducir sus más de mil
  líneas junto con la tienda pública ampliaría el alcance sin beneficio
  demostrable. Mantener `lang` coherente evita que un lector de pantalla use
  voz alemana, francesa, inglesa o italiana sobre textos españoles.
- Evidencia: `tests/e2e/idiomas.spec.ts` entra desde alemán, comprueba español
  en el panel y alemán de nuevo al salir.

## D-056 — Los permisos de tabla se conceden en la migración, no se heredan

- Fecha: 2026-08-05.
- Estado: vigente.
- Decisión: `supabase/migrations/20260805000300_permisos_de_tabla.sql` concede
  explícitamente cada permiso de tabla a `anon`, `authenticated` y
  `service_role`. Ninguna tabla depende ya de las *default privileges* del
  proyecto.
- Motivo: las migraciones anteriores no concedían ni un GRANT. Se apoyaban, sin
  decirlo, en las default privileges que Supabase deja preparadas en `public`;
  esas defaults las fijó otro rol antes y **no alcanzan a las tablas que crea
  la migración**, así que nacían sin permisos para nadie. RLS filtra filas
  *después* de que exista el permiso: sin GRANT no se evaluaba ninguna política
  y PostgreSQL cortaba antes con «permission denied for table …».
  `service_role` salta RLS por BYPASSRLS, pero no salta los GRANT, de ahí que
  el alta administrativa de un agente fallara.
- Consecuencia buscada: cada línea del fichero es el reflejo de una política.
  Donde el esquema dice «NO hay INSERT directo», aquí no hay GRANT — la
  operación se corta en la base y deja de depender de que nadie escriba la
  política por descuido. Lo que no aparece pasa por un RPC `security definer`,
  que se ejecuta con los permisos de su propietario.
- Evidencia: `tests/schema/permisos.test.ts` comprueba el cuadro tabla por
  tabla, incluido lo que **no** debe poder hacerse y que `PUBLIC` no recibe
  nada.

## D-057 — El arnés de PGlite deja de concederse permisos a sí mismo

- Fecha: 2026-08-05.
- Estado: vigente. Reemplaza el supuesto que traía `tests/schema/andamio.ts`.
- Decisión: el andamio prepara los roles (`anon`, `authenticated` y ahora
  `service_role`) pero **no concede nada sobre `public`**. Los permisos los
  concede la migración, que es lo que se despliega.
- Motivo: el andamio ejecutaba `alter default privileges … grant …` antes de
  aplicar las migraciones, con el argumento de que «Supabase los concede por
  defecto». Al hacerlo respondía que las políticas funcionaban mientras
  Supabase local caía con permisos denegados: 17 de las 27 pruebas RLS en rojo
  con el arnés en verde. Un arnés que se concede lo que va a medir no mide
  nada.
- Consecuencia: `tests/schema/politicas.test.ts` usa el mismo andamio en vez de
  su copia, para que no vuelvan a divergir dos supuestos.
- Evidencia: las 125 pruebas de esquema pasan sin que el andamio conceda ningún
  permiso sobre `public`.

## D-058 — Se permanece en React Router 7.18.2 en esta PR, con 8.3.0 ya disponible

- Fecha: 2026-08-05. **Corregida el 2026-08-06.**
- Estado: vigente, con la corrección aplicada.
- Corrección: la primera redacción afirmaba que «la 8.3.0 corregida sigue sin
  publicarse». **Es falso.** `react-router@8.3.0` se publicó el 2026-07-22 y es
  la versión que corrige `GHSA-qwww-vcr4-c8h2`. El error vino de consultar
  `npm view react-router-dom version`, que responde `7.18.2` porque React
  Router 8 **retira `react-router-dom`**: el paquete que sigue publicándose es
  `react-router`. La decisión de no actualizar en esta PR no cambia, pero el
  motivo sí: no es que no exista arreglo, es que adoptarlo no cabe aquí.
- Decisión: no se toca ninguna dependencia en esta PR. `npm audit` seguirá
  informando de dos avisos `high`, que son el mismo aviso contado en
  `react-router` y en su dependiente `react-router-dom`.
- Motivo del aviso: `GHSA-qwww-vcr4-c8h2` afecta al rango `>=7.12.0 <8.3.0` y
  describe un *bypass* de CSRF que sólo alcanza a las **APIs RSC inestables**:
  acciones de servidor ejecutadas antes de devolver un 400.
- Por qué no aplica aquí: esta SPA es declarativa. No tiene servidor de React
  Router, ni acciones RSC, ni React Server Components, ni router de datos.
  Importa `BrowserRouter`, `Routes`, `Route`, `Link`, `Navigate`, `Outlet`,
  `useLocation`, `useNavigate`, `useParams` y `useSearchParams`, y nada más. El
  camino vulnerable no existe en este código.
- Por qué no se actualiza en esta PR: React Router 8 exige **Node ≥ 22.22.0** y
  **React y React DOM ≥ 19.2.7**, y retira `react-router-dom`. El proyecto va
  con React 18.3.1, Vite 6 e importa desde `react-router-dom` en toda la base
  de código. No es un cambio de versión: es una migración de framework que
  necesita su propia suite completa, y meterla en una PR de *hardening* de
  seguridad, i18n y calidad mezclaría dos riesgos distintos.
- Alternativa descartada: `npm audit fix --force` propone bajar a 7.11.0, que
  **no** deja el árbol limpio — cambia este aviso por `GHSA-2j2x-hqr9-3h42`
  (redirección abierta mediante URL relativa al protocolo, rango
  `7.0.0-pre.0 - 7.11.0`), también `high`. Ninguna versión 7.x está sin aviso.
- Seguimiento: [[03-roadmap#Migración a React Router 8]] y
  [[04-problemas-pendientes#SEG-001 — Avisos de seguridad en React Router]].

## D-059 — Una sesión anónima del chat no es una sesión de cliente

- Fecha: 2026-08-06.
- Estado: vigente.
- Contexto: `signInAnonymously()` no crea un rol aparte. Supabase le da a la
  sesión anónima el **mismo** rol PostgreSQL que a una cuenta de verdad,
  `authenticated`, y la única diferencia es el reclamo `is_anonymous: true` del
  JWT. Toda política escrita `to authenticated` alcanzaba por tanto también a
  quien sólo había abierto el widget del chat.
- Decisión: la permanencia de la cuenta es una condición explícita, escrita en
  la base y en el frontend. `public.es_usuario_permanente()` la resuelve leyendo
  el reclamo, y `CustomerAuthProvider` publica `session = null` mientras la
  sesión sea anónima.
- Dónde y por qué de cada forma:
  - **Políticas RESTRICTIVAS** en `clientes`, `pedidos` y `reservas`. Las
    políticas normales son permisivas y se combinan con OR: añadir la condición
    sólo a las existentes dejaría que una política nueva volviera a conceder el
    acceso por su cuenta. Una restrictiva se combina con AND sobre todas.
  - **Condición incorporada** en las políticas del bucket educativo. Una
    restrictiva sobre `storage.objects` alcanzaría a todos los buckets del
    proyecto, incluidos los que no son de esta aplicación.
  - **Comprobación dentro de cada RPC** de cliente. Son `security definer`: se
    ejecutan con los permisos de su propietario y RLS no los filtra.
- El chat sigue siendo anónimo a propósito: `abrir_conversacion()`,
  `enviar_mensaje_visitante()` y `enviar_valoracion()` no llevan la condición.
- Evidencia: `tests/schema/anonimos.test.ts` (PostgreSQL real, 18 casos, uno de
  ellos añade una política permisiva abierta y comprueba que la restrictiva
  sigue cortando), seis casos de `tests/rls/politicas.spec.ts` con sesiones
  anónimas de GoTrue y `tests/integration/chat-anonimo.spec.ts` con la
  aplicación entera montada.

## D-060 — El registro convierte la sesión anónima, no la reemplaza

- Fecha: 2026-08-06.
- Estado: vigente.
- Decisión: cuando el visitante ya tiene sesión anónima del chat y se registra,
  `signUp()` **convierte esa misma cuenta** en permanente mediante
  `updateUser({ email, password })` seguido de `refreshSession()`. No se cierra
  la sesión anónima para crear otra.
- Motivo: `vincular_mi_visitante_a_cliente()` enlaza la ficha de visitante con
  la de cliente **por el mismo `auth.uid()`**. Cerrar la sesión anónima daría un
  uid distinto, dejaría la conversación huérfana y el visitante perdería el hilo
  que acababa de escribir con un agente. El esquema está construido para la
  conversión; la alternativa obligaría a reescribirlo o a aceptar esa pérdida.
- Por qué se decide de forma explícita y no se deja a `signUp()`: con una sesión
  anónima abierta, el comportamiento de `signUp()` depende de la configuración
  de GoTrue —puede convertir la cuenta o crear otra—, y de eso depende si el
  visitante conserva su chat. Un detalle así no puede quedar implícito.
- Detalle que costó encontrar: `is_anonymous` viaja **dentro del access token**.
  Sin `refreshSession()` después de convertir, la base sigue viendo la sesión
  como anónima y rechaza el alta de la ficha, aunque en `auth.users` ya sea
  permanente.
- **Corrección del 2026-08-06 — el orden de los dos pasos.** La primera versión
  hacía `updateUser({ email, password })` en una sola llamada. Eso funciona
  cuando el proyecto tiene la confirmación de email desactivada y falla en
  cuanto no lo está: Supabase no acepta la contraseña hasta que el email esté
  verificado. Ahora se sigue el orden documentado —primero el email, la
  contraseña sólo después—, que es correcto en las dos configuraciones **a
  nivel de API**. Que la interfaz sepa terminar el registro es otra cosa, y con
  Confirm Email activado no sabe: ver la limitación de más abajo.
- Y quién decide si hace falta confirmar **no es una suposición nuestra**: es lo
  que responde el servidor. Si tras `refreshSession()` la sesión sigue siendo
  anónima, el email está pendiente y se devuelve `needsEmailConfirmation` sin
  crear la ficha. No se lee ningún ajuste de configuración ni se codifica un
  camino según el entorno.
- Se conserva el camino rápido —conversión completa en una visita— porque es lo
  que ocurre cuando la confirmación está desactivada, pero como **consecuencia**
  de lo que responde el servidor, no como una rama aparte.
- **Limitación, y es bloqueante para activar Confirm Email**: con la
  confirmación activada el recorrido no se puede terminar desde el navegador.
  `signUp()` añade el email y devuelve `needsEmailConfirmation` antes de haber
  podido fijar la contraseña; `RegisterPage` dice «revisa tu correo y luego
  inicia sesión», pero no hay contraseña con la que iniciar sesión ni pantalla
  donde establecerla al volver. La cuenta queda verificada y sin contraseña.
  Por eso **Confirm Email debe permanecer desactivado en este despliegue**.
- Alcance de las pruebas: `tests/confirmacion/conversion.spec.ts` valida el
  procedimiento de backend y las garantías de seguridad, no el recorrido
  completo en el navegador. Soportarlo entero es tarea aparte; ver
  [[03-roadmap#5.2 Registro con Confirm Email activado]] y
  [[08-predespliegue-supabase]].
- Evidencia: el caso «convertir la sesión anónima en cuenta permanente habilita
  los recorridos de cliente» de `tests/rls/politicas.spec.ts` (confirmación
  desactivada) y la suite `tests/confirmacion/conversion.spec.ts` con la
  confirmación **activada**, que recorre los siete pasos documentados leyendo el
  enlace del buzón local, más email ocupado, contraseña rechazada, token no
  válido o ya consumido y refresco fallido.

## D-061 — La base se migra antes que el frontend, y los anónimos al final

- Fecha: 2026-08-06.
- Estado: vigente, en ejecución.
- Decisión: el despliegue va en tres tiempos: **primero las migraciones**,
  después el frontend, y **los inicios de sesión anónimos al final**.
- Motivo del primer tiempo: la base estaba exponiendo 36 fichas de visitante
  —nombre, email y teléfono— a cualquiera con la clave publicable, que viaja en
  el bundle por diseño. Esperar a tener el frontend listo para cerrar eso habría
  alargado la exposición sin ganar nada.
- Coste aceptado a cambio: entre la migración y la publicación del frontend, el
  chat de la web pública **no funciona**. El frontend anterior escribe
  directamente en las tablas y el esquema nuevo lo rechaza. Es una degradación
  conocida, acotada y reversible publicando; el resto de la tienda no depende de
  Supabase y sigue igual.
- Motivo del tercer tiempo: activar los anónimos antes de publicar no aporta
  nada —el frontend viejo no sabe usarlos— y el nuevo, si los encuentra
  desactivados, cae a modo demostración sin romperse. Se activan cuando hay
  frontend que los aproveche.
- Lo que ya no condiciona el orden: la migración `20260806000400` está aplicada,
  así que activar los anónimos ya no puede abrir el agujero de que una sesión
  anónima valga como cuenta de cliente.
- Evidencia: `supabase migration list` con los cuatro identificadores iguales en
  Local y Remote, `db push --dry-run` con `Remote database is up to date`, las
  cinco comprobaciones SQL en `true`, y la lectura pública que pasó de 36 filas
  a cero. Detalle en [[08-predespliegue-supabase]].

## D-062 — Las preferencias de cuenta se reinician con un aviso interno

- Fecha: 2026-08-06.
- Estado: vigente.
- Decisión: al cerrar sesión una cuenta de cliente, `signOut()` emite el aviso
  de `src/lib/accountSession.ts` y cada proveedor de preferencias se reinicia
  solo. No se manipula el estado de un proveedor desde fuera.
- Por qué un aviso y no una llamada directa: `StorePreferenceProvider` y
  `FavoriteAlertsProvider` están **por debajo** de `CustomerAuthProvider` en el
  árbol (`src/main.tsx`), así que desde el proveedor de sesión no se pueden usar
  sus hooks. Reordenarlos sólo para esto arrastraría al Header, al checkout y al
  panel de agentes, que dependen del orden actual.
- El aviso es concreto —«se ha cerrado la sesión de un cliente»— y no un `reset`
  genérico: un nombre genérico invita a colgar de él cosas que no tienen que
  ver, y acabaría borrando el carrito o el idioma.
- Cada escucha se ejecuta en su propio `try`. Si `localStorage` no está
  disponible, el resto de reinicios se hacen igual y quien cerró sesión sale de
  verdad. Descartado `window.location.reload()`: esconde el problema en vez de
  resolverlo y tira por delante el estado de toda la aplicación.
- Consecuencia añadida: en `favoriteAlerts` una lista vacía ahora **borra** su
  clave en vez de escribir `"[]"`. Ausente y vacía significan lo mismo al leer,
  y que el almacenamiento lo refleje evita tener que borrarlas por separado.
- Evidencia: `tests/unit/account-session.test.ts` y `tests/e2e-prefs/`.

## D-063 — `main` protegida por ruleset, sin bypass

- Fecha: 2026-08-07.
- Estado: vigente.
- Contexto: el repositorio se transfirió a `Oskrrr09/pagina-banana` y `main`
  estaba **sin ninguna protección**: aceptaba force push, borrado y escritura
  directa.
- Decisión: ruleset «Protección de main» (`20547777`), activo, sobre
  `~DEFAULT_BRANCH`. Exige pull request con **0 aprobaciones** —el proyecto lo
  mantiene una sola persona—, los cuatro checks de CI en verde, la rama al día
  con `main`, y bloquea force push y borrado. `bypass_actors` vacío, así que
  alcanza también al propietario.
- Ruleset y no protección clásica: los *bypass actors* son una lista explícita y
  auditable, se puede desactivar temporalmente sin perder la configuración, y es
  la vía que GitHub mantiene.
- `~DEFAULT_BRANCH` en vez de `refs/heads/main`: si algún día se renombra la
  rama por defecto, la protección la sigue en vez de quedarse apuntando a una
  rama inexistente.
- `integration_id: 15368` en cada check: los ata a GitHub Actions. Sin eso,
  cualquier aplicación externa podría publicar un check con el mismo nombre y
  darlo por bueno.
- **`Publicar en GitHub Pages` queda deliberadamente FUERA de los obligatorios.**
  Es un job de **despliegue**, condicionado al `push` sobre `main`: no valida el
  pull request, y exigirlo como condición previa a la fusión añadiría una
  dependencia innecesaria entre validación y despliegue.
- Corrección del 2026-08-07: una versión anterior de esta decisión justificaba
  esa exclusión diciendo que un check omitido bloquearía la fusión para siempre.
  **Es falso.** GitHub da por satisfecho un check obligatorio con `success`,
  `skipped` **o** `neutral`. Lo que sí puede bloquear indefinidamente es que el
  workflow exigido no llegue a reportar **ningún** estado —por ejemplo, si un
  filtro de `paths` o de `branches` impide que se dispare—. La decisión no
  cambia; el motivo, sí.
- Comprobado con la PR #37, que se abrió para eso: con checks pendientes el
  estado fue `BLOCKED` y GitHub rechazó la fusión —«the base branch policy
  prohibits the merge»—; con los cuatro en verde pasó a `CLEAN` y se fusionó sin
  privilegios especiales.
- No se probó `--admin`: confirmarlo exigiría intentar una fusión con los checks
  en rojo, y si la protección fallara se habría fusionado de verdad. El riesgo no
  compensa cuando `bypass_actors` está vacío y el bloqueo ya está demostrado.
- Consecuencia práctica: el flujo de trabajo del repositorio pasa
  obligatoriamente por rama y PR. Recogido en `AGENTS.md`.

## D-064 — El historial de vistos es del dispositivo, no de la cuenta

- Fecha: 2026-08-07.
- Estado: vigente.
- Decisión: `banana:recientes` guarda sólo `familia/slug` de los últimos ocho
  productos vistos, y **no se borra al cerrar sesión**.
- Frontera con las preferencias de cuenta: la tienda favorita y los seguimientos
  de disponibilidad sí se vacían al cerrar sesión (ver
  [[02-decisiones#D-062]]), porque pertenecen a la CUENTA. El historial de
  navegación pertenece al DISPOSITIVO —es lo que se ha mirado en este navegador,
  haya sesión o no—, igual que el carrito o el idioma. Nunca se sincroniza con
  Supabase.
- Consecuencia buscada: sobrevive al cierre de sesión explícito, y debe
  sobrevivir también al que venga de otra pestaña o de una sesión invalidada
  cuando se resuelva SEG-PREF-001. Por eso **no** se suscribe al aviso de
  `accountSession.ts`; no hacerlo es la decisión, no un olvido.
- Qué no se guarda: ni nombres, ni precios, ni imágenes —ya están en el
  catálogo—, ni fechas ni recuentos de visita. El orden de la lista basta.
- Se anota al resolverse `VariantPage`, no al pulsar una tarjeta, para que
  cuenten igual los enlaces directos, la búsqueda, favoritos y el botón Atrás.
- Evidencia: `src/lib/recentlyViewed.ts` y `tests/unit/recently-viewed.test.ts`.

## D-065 — La app tiene su propia portada, no la web adaptada

- Fecha: 2026-08-07.
- Estado: **evolucionada**. El principio —la app no monta la portada web— sigue
  siendo cierto y lo cumplen `AppCustomerHome` y `AppHome`. Lo que ya no
  describe el producto es su **composición concreta**: la barra de cinco
  pestañas la reemplazó [[02-decisiones#D-068]] (PR #41), la portada de Inicio
  la reemplazó [[02-decisiones#D-076]] (PR #73) y la de Tienda
  [[02-decisiones#D-077]] (PR #74). Corregido el 2026-08-23 al cerrar DOC-002:
  hasta entonces decía «vigente» mientras D-068 declaraba haberla reemplazado.
- Decisión: dentro del binario, `Home` monta `AppHome`. El orden es
  producto → descubrimiento → disponibilidad → compra, y los servicios van al
  final.
- Por qué un componente aparte y no condicionales: son dos composiciones con
  públicos opuestos que comparten catálogo, tarjetas y rutas pero no estructura.
  Repartir `isNativeApp` por las doce secciones de la portada web habría dejado
  un archivo que nadie puede leer entero. La decisión se toma una vez, arriba.
- Nada inventado: el hero elige por dato el producto con oferta más caro, las
  oportunidades salen sólo de `previousPrice` real, y **no se promete recogida
  ni disponibilidad por tienda** porque el catálogo tiene existencias por
  variante, no por tienda. Sin dato, la sección no aparece.
- **La oferta se busca en el modelo entero**, con `lib/offers.ts`, no en su
  primera capacidad. La rebaja vive en la variante: el MacBook Air M5 no la
  tiene en su configuración de entrada y sí en la de 15 pulgadas, y mirando sólo
  la primera se quedaba fuera —cinco modelos en oferta de los seis que hay—.
  Precio, precio anterior, porcentaje y enlace salen todos de esa misma
  variante; juntar el «desde» de una con el precio anterior de otra anunciaría
  un descuento que nadie puede comprar. Lo usan la portada de la app,
  `ProductCardCompact` y también `ProductCard`, que arrastraba el mismo fallo.
- **La imagen también sale de esa variante** (`presentacionDeTarjeta`). Con el
  precio corregido pero la foto todavía en `colors[0]`, una tarjeta podía
  enseñar la foto de un color, la rebaja de otro y abrir el segundo al pulsar.
  Hoy no se ve —las seis rebajas del catálogo están en el primer color—, y por
  eso mismo se cierra ahora: en cuanto se rebaje un color posterior la tarjeta
  empezaría a mentir sin que fallara nada. Sin oferta, el color y la capacidad
  son los de entrada, así que la mayoría de tarjetas no cambia.
- Todas las familias de dispositivos comparten `CatalogoFiltrable`. AirPods
  entraba por la página genérica y conservaba un filtro por tramos de precio
  propio, sin disponibilidad, sin ordenación y con el estado en `useState`; se
  retiró en vez de mantener dos sistemas según por dónde se entrara.
- `ProductCardCompact` acompaña a la portada: `ProductCard` mide 400 px de alto
  como mínimo, correcto en una rejilla de escritorio e inmanejable en un
  carrusel de móvil.
- Evidencia: `tests/e2e/app-shopping.spec.ts`.

## D-066 — La barra de compra se apoya en la navegación de la app

- Fecha: 2026-08-07.
- Estado: vigente.
- Problema: la barra de compra de `VariantPage` es `fixed bottom-0`, pero
  `AppTabBar` **no** es `fixed` —es el último hermano de la columna que ocupa la
  pantalla—. Medido en un iPhone 13 simulado: la barra terminaba en 844 px y la
  navegación empezaba en 785, con 59 px de solape y sus botones inalcanzables.
- Decisión: en la app se sube exactamente `ALTURA_TAB_BAR`, la constante que ya
  exportaba `AppTabBar` y que incluye el área segura; en el navegador móvil se
  queda abajo y gana el relleno de `safe-area-inset-bottom`, que antes tampoco
  respetaba.
- **Corrección del 2026-08-07 — «una sola fuente» no era cierto.** La constante
  existía, pero la barra no se dimensionaba con ella: su altura salía de sus
  paddings, su icono y su texto, y los `4rem` del literal se le parecían por
  casualidad. Ni siquiera coincidían — la barra medía **58,75 px** frente a los
  64 declarados, así que la barra de compra se apartaba 5 px de más y quedaba un
  hueco. Ahora el `<nav>` toma su `minHeight` de `ALTURA_TAB_BAR`: la altura
  real y el hueco que dejan los demás son el mismo número por construcción.
- Efecto visible, pequeño y buscado: la barra pasa de 58,75 a 64 px y el hueco
  entre ella y la barra de compra desaparece.
- Evidencia: `tests/e2e/app-shopping.spec.ts` compara las cajas de las dos
  barras en los dos modos.

## D-067 — El pedido guarda la identidad del producto, y sólo lo comprado

- Fecha: 2026-08-08.
- Estado: vigente.
- Problema: `mirrorOrderToSupabase` traducía cada línea a
  `{name, color, capacity, price, qty, insured, image}` y **perdía por el camino
  `id`, `family`, `modelSlug`, `kind` y `reservation`**. De un pedido guardado no
  se podía volver al producto del catálogo: quedaba un nombre suelto. Y con un
  carrito mixto —algo comprado y algo reservado— la línea reservada acababa
  dentro de `pedidos` sin ninguna marca y sumando en `products_total`, así que
  el dato afirmaba que el cliente había comprado un aparato que en realidad
  estaba esperando en una lista.
- Decisión, en tres partes:
  1. **La identidad se persiste explícita.** `family`, `modelSlug`, `kind`,
     `colorSlug` e `id`. `colorSlug` es nuevo en toda la cadena
     `CartLine → DemoOrderLine → DbOrderLine`: el catálogo distingue el slug
     (`plata`, estable, el que usa `variantPath`) del nombre visible (`Plata`,
     texto editorial que cambia con una corrección de estilo o al traducirse).
     Se resuelve por el slug; el nombre se conserva como foto de lo que el
     cliente compró.
  2. **`pedidos` sólo contiene compras.** El filtro vive en `orderSync`, que es
     quien decide qué entra, no en el checkout: así ningún llamante futuro puede
     saltárselo. Los agregados —`products_total`, `insurance_total`,
     `insured_units`— se **recalculan** sobre las líneas guardadas en vez de
     copiarse del pedido local, que legítimamente suma también las reservas
     porque representa el paso por caja entero.
  3. **No se deduplica por SKU.** Sin número de serie ni IMEI no hay forma de
     saber si dos compras de la misma variante son el mismo aparato;
     probablemente sean dos. La identidad en la interfaz es pedido + posición de
     la línea, y `qty: 2` se dice como «2 unidades» en vez de partirse en dos
     tarjetas que serían dos objetos inventados.
- `id` se conserva como identidad canónica del SKU y como comprobación, pero
  **no es la fuente primaria**: parsearlo queda sólo como compatibilidad con
  datos locales antiguos, y únicamente si el formato encaja exacto y el
  resultado se confirma contra el catálogo.
- Sin migración: `pedidos.lines` ya es `jsonb`
  (`20260802000100_estado_seguro.sql:221`), sin `check` ni trigger, y la RLS es
  por fila. Ampliar el contenido del JSON es aditivo. Comprobado además que
  nadie más lee esa columna: sólo `OrdersSection`, que usa nombre y cantidad.
- Qué NO se afirma: `insured` significa que se marcó la casilla del seguro en un
  checkout demostrativo. No hay póliza, ni estado, ni fechas, ni aseguradora, ni
  número de contrato — y los 8,99 € son una constante del front, no una tarifa
  guardada, así que de un pedido antiguo ni siquiera se puede recuperar la prima
  que se le aplicó. La interfaz no habla de cobertura.
- Los pedidos ya guardados no tienen los campos nuevos y **no se reparan**: una
  línea sin identidad sigue apareciendo en «Mis pedidos», donde el dato es fiel,
  y no entra en «Mis productos». No se asocia por nombre: los accesorios se
  guardan con la variante pegada al nombre y los nombres de modelo son texto que
  cambia, así que una coincidencia no demuestra nada.
- **Ampliación del 2026-08-08 — lo que faltaba.** Esta decisión se escribió
  antes de dos remates de la revisión de la PR #40 y se quedó sin ellos:
  - **El `id` sólo completa si no contradice.** Como fallback de compatibilidad
    se puede parsear, pero se descarta **entero** en cuanto discrepa de
    `family` o de `modelSlug` explícitos. Descartarlo no invalida una identidad
    explícita que ya se baste: el campo que falte se queda sin resolver. El caso
    que lo motiva es silencioso: `azul` existe tanto en `iphone/17` como en
    `iphone/17-pro`, así que con el modelo explícito y un `id` del otro modelo,
    la variante se resolvía —y se resolvía bien— con el color de otro producto.
  - **De dónde sale la foto**, en este orden: la del color resuelto en el
    catálogo de hoy; si ese color ya no existe, la que se guardó al comprar
    (`line.image`, que las líneas de dispositivo ahora sí escriben); y si no hay
    ninguna, ninguna. **Nunca `model.colors[0].image`**, que es la foto de otro
    producto con aspecto de ser la correcta: mejor el hueco neutro que
    `ProductImage` ya sabe dejar.
- Evidencia: `tests/unit/order-sync-contrato.test.ts` fija el contrato de
  escritura y el caso mixto; `tests/unit/my-products.test.ts`, la resolución, el
  `id` contradictorio y la procedencia de la foto;
  `tests/e2e-prefs/mis-productos.spec.ts`, la pantalla. Contraprueba con la
  implementación anterior: guardaba las dos líneas y un `products_total` de
  2808 € que incluía el aparato reservado, y tres de las pruebas nuevas fallan
  contra el código previo a los remates.

## D-068 — La app acompaña al cliente: Inicio · Tienda · Mis compras · Cuenta

- Fecha: 2026-08-08.
- Estado: vigente en su estructura —cuatro pestañas—; reemplaza la barra de
  cinco de D-065. **El rótulo cambió**: la PR #57 pasó «Mis compras» a
  **«Compras»** (`appnav.purchases`), sin mover la ruta `/mis-productos`. Ver
  [[02-decisiones#D-084]].
- Problema: la navegación nativa era `Inicio · Favoritos · Explorar · Carrito ·
  Cuenta`. Cinco destinos para una app que sólo sabía vender, con una pestaña
  que no navegaba —«Explorar» abría un diálogo— y sin ningún sitio donde vivir
  lo que el cliente ya había comprado. Un cliente que compró un iPhone vuelve
  dentro de tres o cuatro años: ese ritmo no sostiene una app instalada.
- Decisión: cuatro pestañas, cada una respondiendo a una pregunta distinta.
  - **Inicio** — mi relación con Banana. En la app, `/` deja de ser escaparate.
  - **Tienda** (`/tienda`) — lo que puedo comprar. Es la portada comercial de la
    PR #39 **entera**, sólo que con pestaña propia en vez de ocupar la raíz.
  - **Mis compras** (`/mis-productos`) — lo que ya compré y su postventa.
  - **Cuenta** — quién soy, mis datos y mis ajustes.
- **Se llama «Mis compras»**, no «Productos» ni «Dispositivos». «Productos» se
  lee como catálogo, que es justo lo que hay en la pestaña de al lado;
  «Dispositivos» como una categoría de la tienda. El rótulo tiene que decir que
  eso ya es tuyo sin que haga falta entrar.
- **La ruta sigue siendo `/mis-productos`.** Cambiar la URL sólo para que case
  con el rótulo añadiría riesgo —enlaces, pruebas, historial— a cambio de nada
  que el cliente note.
- **La tarjeta de acceso que la PR #40 puso en Cuenta desaparece en la app**:
  allí ya hay pestaña, y repetir el mismo destino en la misma pantalla no ayuda.
  En la web se queda, porque no hay barra inferior y es como se descubre que la
  sección existe. En los dos sitios se llama «Mis compras».
- **La barra superior tiene dos variantes.** En Tienda manda el buscador, que
  ocupa casi todo el ancho porque es lo que más se usa para comprar desde el
  móvil. En Inicio, Mis compras y Cuenta ese mismo campo enorme hacía que la
  pantalla siguiera pareciendo una tienda aunque el contenido fuera del cliente:
  allí la barra se reduce a la marca y a dos botones compactos de 44 px. **El
  buscador y el carrito son los mismos** —mismo `HeaderSearch`, mismo diálogo,
  mismo foco, mismo contador—; sólo cambia el tamaño del botón que los abre.
- **`/cuenta?apartado=pedidos`** abre «Mis pedidos» directamente. Es un enlace
  profundo mínimo y no una ruta nueva: la cuenta sigue siendo una pantalla con
  un menú. Un valor desconocido se ignora y abre «Datos personales», porque
  llegar a la cuenta y no ver nada por un parámetro mal escrito sería peor.
- **Soporte no tiene pestaña.** Es de urgencia altísima y frecuencia bajísima:
  ocuparía un cuarto de la barra el 99 % del tiempo. Debe llegarse desde donde
  nace la necesidad.
  - **Lo que esta PR entrega**: acceso a `/soporte` y al chat desde **Inicio**.
    El del chat no es un extra: al retirar «Explorar» era su única puerta dentro
    del binario, porque el botón flotante no se pinta ahí.
  - **Lo que NO entrega, y conviene no dar por hecho**: comprobado que
    `ProfilePage`, `VariantPage` y `ModelPage` **no tienen hoy ningún enlace a
    soporte** —ni antes de esta PR ni después—. El soporte que empieza en el
    producto queda como dirección, no como hecho, y se construirá en su propia
    entrega.
- **El carrito sube a la barra superior**, con contador y 44 px de lado. No es
  un escondite: pasa de verse sólo al mirar hacia abajo a estar junto al
  buscador en todas las pantallas. Dentro del propio carrito desaparece.
- **Favoritos** deja de necesitar pestaña: es una lista de deseos, se consulta
  al comprar. Sigue en `/favoritos` y en el corazón de cada ficha.
- **«Explorar» desaparece.** Era una pestaña que no navegaba. Las categorías
  viven dentro de Tienda, que sí es un destino. `MobileMenu` **no se elimina**:
  lo sigue usando la cabecera de la web.
- **Los chips de categoría sólo salen en el contexto comercial.** Encima de «Mis
  compras» o de «Cuenta» invitan a irse justo cuando alguien ha entrado a mirar
  lo suyo. La clasificación vive en `src/lib/appSections.ts`, en un solo sitio y
  con pruebas: antes cada componente la resolvía con su propio `startsWith` y
  bastaba una ruta nueva para que dijeran cosas distintas de la misma pantalla.
- En rutas ambiguas —soporte, tiendas, servicio técnico— **ninguna pestaña se
  marca**. Marcar una cualquiera le diría a quien navega que está donde no está.
- La web no cambia: `/` sigue siendo la portada corporativa y `/tienda` redirige
  a la raíz para no tener dos portadas que dicen lo mismo.
- Evidencia: `tests/unit/app-sections.test.ts` y
  `tests/e2e/app-shell-navegacion.spec.ts`.

## D-069 — El cupón del carrito desbordaba la página en móvil

- Fecha: 2026-08-08.
- Estado: vigente.
- Problema: en `/carrito`, al abrir «¿Tienes un cupón?», la página se podía
  arrastrar de lado. Medido a 320 px: **31 px** de desbordamiento.
- Causa, que no era la que parecía: un `<input>` sin `size` mide **20
  caracteres** de ancho intrínseco, y en pantalla táctil la regla de
  `index.css` le pone además un suelo de 16 px al texto para que iOS no amplíe
  la página al enfocarlo. Las dos cosas juntas dan un mínimo de **221 px** que
  `flex-1` no puede reducir: un hijo flex no baja de su contenido mientras
  conserve `min-width: auto`. Con el botón «Aplicar» al lado, la fila pedía
  331 px donde había 280.
- Y por qué parecía otra cosa: una celda de grid también tiene `min-width:
  auto`, así que la columna se ensanchaba entera y arrastraba con ella la lista
  de productos, **que sí cabía**. Al medir, el sospechoso era el `<ul>`.
- Decisión: `min-w-0` en el campo con `size={1}`, `shrink-0` en el botón, y
  `min-w-0` en las dos celdas del grid para que nada de lo que se plante ahí
  dentro vuelva a estirar la página. **No** se añadió `overflow-x: hidden` en
  ningún sitio: habría escondido el fallo dejándolo dentro.
- **La prueba que había no podía verlo.** `mobile-layout.spec.ts` mide
  `documentElement.scrollWidth`, y el documento lleva `overflow-x: clip`: bajo
  `clip` nunca declara desbordamiento aunque su contenido se salga. La prueba
  nueva mide `#contenido` —el contenedor que se desplaza de verdad en la app— y
  el documento con la contención neutralizada un instante.
- Y tiene que correr con **puntero grueso**: sin él la regla de los 16 px no se
  aplica, el campo cabe y la prueba pasa con el fallo presente. Comprobado.
- Evidencia: `tests/e2e/carrito-movil.spec.ts`. Contraprueba: con el arreglo
  revertido la prueba falla con 17 px; con `Desktop Chrome`, pasa.

## D-070 — El aviso de tienda favorita ocupa banda, no flota

- Fecha: 2026-08-19. PR #62 (`144294d8`) y PR #63 (`763b9a71`).
- Estado: vigente.
- Problema: el aviso se pintaba flotando sobre el contenido. Lo que quedaba
  debajo se veía pero no se podía tocar: el toque lo recibía el aviso. Medido
  con `document.elementFromPoint` y `page.mouse` —no con `locator.click()`, que
  desplaza el objetivo y esconde justo este defecto—, había tarjetas de Inicio
  visibles e inalcanzables.
- Decisión: el aviso deja de flotar y ocupa **una banda propia dentro del
  flujo**, en la app y en la web. Lo que hay debajo baja, se ve entero y se
  puede tocar. La banda se limita a `max-h-[55dvh]` y la lista de tiendas se
  desplaza por dentro.
- **El tope de altura no es cosmético.** Con la lista de tiendas desplegada a
  320×568 el aviso llegaba a 931 px, `main` quedaba en 0 y la barra de pestañas
  caía fuera de la ventana, irrecuperable porque `html` y `body` llevan
  `overflow: hidden` en la app.
- **El foco inicial sólo se toma si el botón de cerrar está a la vista.** Antes
  se tomaba siempre, y al ocupar el aviso el flujo eso arrastraba la página
  hasta arriba —observado: `scrollY` de 2100 a 0—. Se resolvió comprobando la
  visibilidad real del botón, **no** añadiendo `preventScroll` a ciegas: eso
  habría dejado el foco en un elemento fuera de pantalla.
- **Las dos pruebas de la PR #53 se reorientaron, no se debilitaron.** Estaban
  escritas contra una precondición geométrica —que el CTA cayera dentro de la
  banda del aviso—, que sólo tenía sentido mientras el aviso flotaba. Protegen
  comportamiento, no `position: fixed`, y se reescribieron como tal.
- La PR #63 corrige la cota de esa prueba: el desplazamiento admisible se deriva
  de la **altura real de la banda** (`[data-favorite-store-prompt]`) en vez de
  un número fijo, y se mide sobre `main`. Una cota absoluta de 8 px producía
  fallos intermitentes —observados 10 px y 256 px frente a 211—, en parte porque
  el anclaje de desplazamiento no es determinista y en parte porque la
  referencia anterior estaba animada.
- Evidencia: `src/components/layout/FavoriteStoreDialogs.tsx`,
  `src/components/layout/Layout.tsx`, `tests/e2e/favorite-store.spec.ts`.
- Consecuencia: en la web el aviso se pinta después de `TranslationNotice` y
  antes de `<main>`; en la app, junto a `AppTabBar`.

## D-071 — En la app manda el producto, no el contenedor

- Fecha: 2026-08-20. PR #64 (`3bb99a91`) y PR #65 (`096a3bf8`).
- Estado: vigente. Dirección visual aceptada; no deshacer sin sustituirla.
- Problema medido, no impresión: en el área de contenido de la app el **90,1 %**
  de los píxeles eran blanco o gris, y el azul de marca —7,2 % de la pantalla
  completa— caía al **0,1 %** dentro del contenido, porque sólo estaba en la
  barra de pestañas. Y en `ProductCardCompact` había tres marcos concéntricos:
  a 390×844, tarjeta de 152 px, caja de imagen de 126 y un iPhone de unos 90.
  El envoltorio pesaba más que lo que se vende.
- Dirección, en una frase: **«Apple Store móvil, pero más cálida, cercana y
  reconociblemente Banana.»** Y el principio que la resume: **la app no necesita
  más decoración; necesita que el producto tenga más presencia.**
- Decisión, en cuatro reglas: **producto por encima de contenedor**, **imagen
  por encima de marco**, **jerarquía por encima de decoración** y **respuesta
  táctil por encima de animación**.
  - La tarjeta no se dibuja: sin borde, separada del fondo sólo por
    `--shadow-rest`, con la foto a ancho completo y sin relleno propio —el
    recorte de estos PNG ya trae su aire—.
  - El descuento es etiqueta redonda, no cartel. El corazón conserva sus 44 px.
  - Al pulsar, la tarjeta cede un 2 % con `transform`, que no reordena nada y no
    mueve el carril. Con `prefers-reduced-motion` no se aplica.
  - En Inicio: saludo con tipografía de display, secciones que pueden ir en
    banda amarilla (`bg-brand-050`) y una tarjeta con Bananito.
- **Sustituir bordes por sombras no es la decisión.** Un primer intento cambió
  diez bordes por diez sombras: es el mismo contorno con otro nombre y vuelve a
  dibujar el marco que sobra. Se retiró.
- **Inicio no se convierte en una copia de `/tienda`.** Sigue respondiendo a «mi
  relación con Banana», según [[02-decisiones#D-068]].
- Evidencia: `src/components/product/ProductCardCompact.tsx`,
  `src/components/home/app/AppCustomerHome.tsx`, tokens de `src/index.css`.
- Comprobación de alcance: normalizando el archivo de la tarjeta —sin
  `className`, comentarios ni espacios— la PR #64 sólo cambia
  `pad={!color.imageBg}` por `pad={false}` y un `<div>` envolvente. El resto es
  presentación.

## D-072 — La geometría de la tarjeta no depende del producto

- Fecha: 2026-08-20. PR #66 (`5bdee61f`).
- Estado: vigente.
- Problema: en un mismo carril las tarjetas terminaban a alturas distintas.
  Medido a 390×844: «MacBook Air M4» 244,75 px, «Apple Watch Ultra 3» 239,5 e
  «iPhone 17 Pro Max» 220,75. Son dos diferencias independientes que se suman:
  18,75 px por la segunda línea del nombre y 24 px por el precio anterior de una
  oferta.
- Decisión: **cada zona de texto reserva de antemano su caso más alto** —nombre
  a dos líneas (`min-h-[2.375rem]`), bloque de precio con su caso de oferta
  (`min-h-[3.125rem]`)— y el contenido decide qué se lee, no cuánto ocupa.
  Resultado: 264 px en los tres casos.
- **264 px no es el contrato.** El contrato es «estas tarjetas miden lo mismo»,
  no «esta tarjeta mide N píxeles»: lo segundo se rompería con cualquier ajuste
  legítimo de tipografía o espaciado. Las pruebas comprueban que el conjunto de
  alturas de un carril tiene un solo elemento, con una precondición explícita de
  que la muestra mezcle títulos largos y cortos, con y sin oferta.
- Descartado por principio: condicionar la altura al `slug` o a la familia,
  mantener listas de excepciones, rellenar con espacios según el nombre,
  duplicar el precio o insertar texto invisible semánticamente incorrecto.
- Evidencia: `src/components/product/ProductCardCompact.tsx`,
  `tests/e2e/inicio-nativo.spec.ts`.

## D-073 — «Volver» usa el historial cuando existe y un destino semántico cuando no

- Fecha: 2026-08-21. PR #68 (`d6e6e9ee`).
- Estado: vigente.
- Problema: en iPhone no hay retroceso del sistema y las pantallas secundarias
  de la aplicación no ofrecían ninguna forma visible de volver. La barra
  superior no tenía control alguno; la única salida era cambiar de pestaña.
- **Las raíces no llevan control.** `/`, `/tienda`, `/mis-productos` y
  `/cuenta` son las cuatro raíces de `AppTabBar`, y `/login` se trata como
  raíz-equivalente porque es el destino de la pestaña «Cuenta» mientras no hay
  sesión. Allí no hay «atrás», hay pestañas. Que `/login` sea raíz **por ruta y
  no por sesión** mantiene la regla pura: con sesión esa pantalla ni se pinta,
  porque `LoginPage` redirige con `replace` antes.
- **Las secundarias sí**: las dieciocho restantes del armazón —registro; las
  tres del catálogo (`/:family`, `/:family/:model` y la variante); accesorios y
  su ficha; búsqueda, comparador, favoritos, carrito y Finder; tiendas y el
  detalle de una tienda; soporte, servicio técnico, servicios y Plan Renove; y
  la ruta comodín—.
- **Con historial propio manda el historial**: si el router tiene una entrada
  anterior apilada, `navigate(-1)`. Es lo que devuelve el catálogo con sus
  filtros y la búsqueda con su término, sin que este módulo tenga que saber
  nada de ellos.
- **Sin historial propio, destino semántico con `replace`**: la ficha vuelve al
  catálogo de su familia, `/tiendas/:slug` a `/tiendas`, `/comparar?familia=`
  a esa familia si existe, `/registro` a `/login` conservando un `redirect`
  interno seguro. Se usa `replace` para no dejar detrás una entrada que
  devolvería justo a donde se acaba de salir.
- **Cómo se sabe si hay algo detrás.** React Router numera sus entradas en
  `window.history.state.idx` y sube de uno en uno con cada navegación que
  apila; `idx > 0` significa que hay una entrada anterior **suya**.
  - `history.length` **no sirve**: cuenta entradas del navegador, no las
    nuestras, y en un WebView reutilizado o tras un enlace externo vale más de
    uno sin que haya ni una pantalla de Banana detrás.
  - `location.key` **tampoco lo demuestra**: un `replace` sobre la primera
    entrada le da clave nueva sin que haya aparecido nada detrás, y eso pasa de
    verdad en el guardia de `/cuenta`, en `AccessoryDetailPage` y en el
    reemplazo canónico de `VariantPage`.
  - **Una recarga no baja `idx` a 0**: el navegador conserva `history.state`,
    así que una pantalla a la que se llegó navegando mantiene su `idx > 0` y
    retroceder sigue siendo correcto.
- Reparto de responsabilidades, que es lo que hace esto mantenible:
  `appBack.ts` guarda la **regla semántica** como función pura —sin React, sin
  `window`, sin sesión—; `useAppBack.ts` decide **cómo** se ejecuta la vuelta y
  es el **único** sitio que lee `window.history.state`; `AppTopBar` sólo
  **pinta** el control. La lectura del `idx` queda encapsulada a propósito: es
  detalle interno del router, y si una versión futura lo cambia se pone roja una
  prueba concreta en vez de la aplicación.
- **El «Atrás» del Finder no es éste.** `/elige-tu-apple` conserva su control
  interno, que retrocede un paso del asistente; el de la barra sale de la
  pantalla. Son dos conceptos distintos y conviven a propósito.
- Fuera del armazón y por tanto sin control: `/checkout/:step`, `/agente` y
  `/agente/login`, que no montan `AppTopBar` y ya tienen su propia navegación.
- **No se añadió `@capacitor/app` ni ningún listener del botón físico de
  Android.** El bridge sigue delegando en el historial del WebView, que es la
  misma pila que usa este control: los dos caminos coinciden por construcción y
  duplicarlo sólo habría añadido una dependencia y dos comportamientos que
  mantener sincronizados.
- Evidencia: `src/lib/appBack.ts`, `src/lib/useAppBack.ts`,
  `src/components/layout/AppTopBar.tsx`, `tests/unit/app-back.test.ts` (31
  casos: el mapa completo de destinos y las clases de `idx`) y
  `tests/e2e/app-atras.spec.ts` (12 pruebas: raíces, historial, entrada en
  frío, la trampa del `replace`, 320×568, 390×844, teclado y la web sin botón).

## D-074 — El padding horizontal de un botón se sustituye, no se pisa

- Fecha: 2026-08-22. UI-002.
- Estado: vigente.
- Problema: `Button` metía el padding horizontal dentro de la cadena de clases
  del tamaño (`lg: 'h-13 px-8 …'`). Una llamada que necesitara otro pasaba
  `className="px-3"` y **no pasaba nada**: `px-3` y `px-8` son la misma
  propiedad con la misma especificidad, así que gana la que Tailwind emita más
  tarde en la hoja, no la que se escriba después en el atributo. Las tres únicas
  llamadas del repositorio que lo intentaban —las tres de la barra de compra de
  `VariantPage`— recibían 64 px de padding por botón sin enterarse. De ahí
  UI-002.
- Decisión: el padding horizontal vive en su propio mapa `paddingsX`, y la
  propiedad `paddingX` lo **reemplaza**. Nunca se pisa una clase con otra de la
  misma propiedad: o se sustituye, o se deja la del tamaño.
- Alcance: no cambia nada para quien no la usa. Las otras ocho llamadas con
  `size="lg"` y todas las `sm`/`md` reciben exactamente las mismas clases que
  antes, porque el valor por defecto de `paddingsX` es el que ya estaba dentro de
  `sizes`.
- Corolario, que es lo que hace esto útil más allá del botón: **una clase de
  utilidad no es un override.** Si dos utilidades tocan la misma propiedad, el
  resultado no lo decide el código que las escribe. Cuando haga falta variar una
  propiedad por llamada, hay que sacarla a un punto de sustitución explícito.
- Consecuencia buscada en la barra de compra: los tres botones comparten
  `PADDING_CTA = 'px-3 min-[360px]:px-5 sm:px-8'`, tres tramos medidos y no
  intuidos. Desde `sm` se recupera el `px-8` original.
- Evidencia: `src/components/ui/Button.tsx`, `src/pages/VariantPage.tsx` y los
  10 casos de `tests/e2e/app-shopping.spec.ts` («la barra de compra cabe en la
  pantalla»), con contraprueba: tres de ellos se ponen rojos contra `2a69349f`.
  Detalle numérico en
  [[04-problemas-pendientes#UI-002 — La barra de compra de la ficha se sale por la derecha a 320 px]].

## D-075 — Cada apartado de la cuenta es una ruta, y la app la recorre como una lista

- Fecha: 2026-08-22. Auditoría del 2026-08-22 y su implementación.
- Estado: vigente.
- Sustituye el diseño de la **PR #60**, que mantenía el apartado activo en el
  parámetro `?apartado=`. Aquello ya sincronizaba URL, historial y apartado; lo
  que no daba era «Atrás» nativo, porque las raíces se comparan por *pathname*.
  Reconstruido el 2026-08-23 al cerrar DOC-002.
- Problema, medido con la aplicación real y sesión de verdad: el carril
  horizontal de apartados ocupaba **1104 px** dentro de una caja de **280 px a
  320** y **350 px a 390**, así que quedaban **824 y 754 px fuera de la vista**.
  En cinco de las siete pantallas a 320 px lo único visible del menú era **el
  apartado en el que ya estabas**: pagaba el coste de un menú sin dar su
  beneficio. Arrastrado al final dejaba «uento educativo», un fragmento de
  palabra, y ningún indicador de activo. Nada de esto era maquetación rota —cero
  desbordamiento del documento, objetivos de 44 px—: era **descubribilidad**.
- **Y `?apartado=` no podía arreglarlo.** El armazón decide si una pantalla
  lleva «Volver» mirando el **pathname**: `/cuenta?apartado=pedidos` es
  `/cuenta`, o sea una raíz de pestaña, y nunca podría ofrecer retroceso sin
  meter una excepción por parámetro en un módulo que hoy es puro.
- Decisión: **los siete apartados tienen ruta propia** —`/cuenta/datos`,
  `/cuenta/envio`, `/cuenta/facturacion`, `/cuenta/pedidos`, `/cuenta/reservas`,
  `/cuenta/descuento`, `/cuenta/favoritos`—, y **web y aplicación usan la misma
  gramática**. Dos formas de direccionar lo mismo habrían sido deuda desde el
  primer día.
- **En la aplicación, `/cuenta` es una lista vertical** con grupos —Actividad,
  Mis datos, Preferencias— y cada fila abre su pantalla, que trae el «Volver»
  del sistema. El orden pone Actividad primero: es una decisión de jerarquía de
  producto, **no un hecho medido** —no hay analítica—.
- **En la web no cambia la composición**: columna de apartados y contenido al
  lado, identidad arriba, «Cerrar sesión» arriba a la derecha y tarjeta de «Mis
  productos». A 1440 px esa disposición enseña los siete a la vez y funciona; lo
  único que cambia es la dirección de cada enlace. El carril de la web móvil se
  conserva: esta decisión resuelve la aplicación, no el responsive de la web.
- **`?apartado=` queda como compatibilidad de ENTRADA**, nunca de salida: se
  traduce a su subruta con `replace` —sin él quedaría una entrada de historial
  que obligaría a un Atrás de más— y el resto de la consulta viaja con la
  traducción. Un valor que no es apartado aterriza en `/cuenta`. Ningún enlace
  de la aplicación genera ya la gramática antigua.
- **El «Volver» de `/cuenta/*` es `/cuenta`**, con una sola entrada en el mapa
  `DETALLES` de `appBack`: el mecanismo por segmentos ya cubre los siete, y
  escribirlos uno a uno sería duplicar el mapa de apartados y dejar que se
  desincronizara. Sin ella caían en la rama del catálogo y el control mandaba a
  la portada —comprobado en la aplicación antes de tocar nada—.
- **`AppTabBar` permanece visible** también en las secundarias, y la pestaña
  Cuenta sigue marcada. Es lo que ya hacen la ficha de producto, el carrito y el
  detalle de tienda; esconderla sólo aquí sería una excepción sin motivo.
  `seccionActiva` y `contextoDe` funcionan por prefijo, así que no hizo falta
  tocarlos.
- **Favoritos y Tienda habitual son accesos directos** en la lista: van a
  `/favoritos` y `/tiendas`. Una pantalla intermedia cuyo único contenido son
  esos dos enlaces no aporta nada. **`/cuenta/favoritos` se conserva**, porque
  la web la usa y hay enlaces antiguos: cambiar en silencio el significado de un
  enlace profundo es peor que mantener una ruta.
- **Un enlace profundo sin sesión conserva su destino**: el guardia compone
  `?redirect=` con la ubicación real, y `safeRedirect` de `LoginPage` sigue
  siendo quien decide qué destino es aceptable. Antes daba igual porque sólo
  existía `/cuenta`; ahora perder el destino sería perder el enlace justo cuando
  más vale.
- Consecuencia de código: las siete secciones salen de `ProfilePage` a
  `src/components/account/sections.tsx` **sin tocar su cuerpo**, y `ProfilePage`
  queda como punto común —Supabase, sesión, carga, cierre de sesión— que elige
  composición. La lógica, los estados y las peticiones son los mismos.
- Evidencia: `src/components/account/`, `src/pages/ProfilePage.tsx`,
  `src/lib/appBack.ts`, `src/App.tsx`, y los contratos nuevos en
  `tests/integration/cuenta-navegacion-servidor.spec.ts`,
  `tests/unit/app-back.test.ts` y `tests/unit/app-sections.test.ts`.

## D-076 — Inicio cuenta lo que requiere atención, no el catálogo

- Fecha: 2026-08-23. Auditoría del 2026-08-22 y su implementación.
- Estado: vigente.
- Sustituye el Inicio de la **PR #55**, que fue el primero en dejar de ser una
  lista de enlaces. Reconstruido el 2026-08-23 al cerrar DOC-002.
- Problema, medido con la aplicación real y sesión de verdad: el saludo
  `Hola, <nombre>` iba a 28 px de tipografía display y ocupaba **68 px con
  sesión y 182 sin ella**; el Finder no empezaba hasta **y=258** en las tres
  anchuras; y a **320 px no se veía ni un producto completo** en el primer
  viewport. La pantalla sumaba **1559 px —3,54 pantallas—** con **5 títulos, 13
  superficies redondeadas y 2 carriles idénticos**. Peor: con historial real, la
  primera tarjeta de «Continúa» y la primera de «Oportunidades» eran **el mismo
  producto**, en dos pantallazos seguidos.
- **Inicio no es Tienda.** `/tienda` es la portada comercial y tiene pestaña
  propia. Inicio cuenta otra historia: **lo que requiere mi atención → lo que
  Banana puede ayudarme a elegir → lo que estaba viendo o puedo descubrir**.
- Orden decidido: **identidad compacta · aviso (si existe) · Finder · «Seguías
  mirando» (si existe) · Oportunidades · Tu tienda · Bananito + Soporte.**
- **El aviso va ANTES del Finder.** Una reserva `disponible` es información
  temporal y accionable —hay una unidad esperando—; el Finder es una
  herramienta permanente y puede esperar un dedo más abajo. Consecuencia para
  las pruebas, y por eso se escribe aquí: **no puede exigirse por contrato que
  el Finder se vea entero sin desplazar**, porque con un aviso delante puede no
  caber. El contrato sólo se afirma en el estado sin avisos.
- **La identidad es una línea, no un titular.** El `h1` sigue existiendo —la
  pantalla necesita su encabezado— pero deja de ser lo que más pesa. Sin nombre
  se dice «Mi cuenta», que es cierto siempre: no se deriva del correo, no se
  inventan iniciales y no hay avatar.
- **`ProductCardCompact` gana una variante `recent`, no una segunda tarjeta.**
  Sólo neutraliza la presentación promocional: se van el distintivo de descuento
  y el precio anterior, y el precio de esa misma variante se pinta en tinta
  normal. `presentacionDeTarjeta` no se toca, así que el producto, la variante
  elegida, la imagen, el destino y el favorito son los mismos, y **la igualdad
  de alturas de la D-072 se mantiene en los dos carriles y mezclándolos**.
- **Oportunidades enseña cuatro como máximo**, número exacto y no un rango:
  ocho era un escaparate, y el escaparate ya existe en Tienda. El resto se
  alcanza con «Ver más».
- **Un modelo no puede salir en los dos carriles.** Se resuelve primero lo
  personal y Oportunidades descarta lo que ya está arriba. Se excluye por los
  modelos que **se pintan** —resueltos contra el catálogo—, no por lo que haya
  en `localStorage`: un reciente que ya no existe no debe descartar nada.
- **Tu tienda es una sola pieza** con favorita y sin ella. Antes eran dos
  composiciones distintas y, con favorita, un título de sección más una ficha
  más una segunda llamada «Ver la tienda» que repetía el destino de la propia
  ficha: tres elementos para un enlace.
- **La ayuda pierde su encabezado.** Un `<h2>` que sólo precede a dos filas no
  ordena nada; añadía un quinto título a la pantalla. Bananito y Soporte siguen
  viéndose distintos porque tienen papeles distintos.
- **El descargo demostrativo sale de la pieza principal.** «Orientación
  demostrativa» ocupaba la tercera línea de la única tarjeta protagonista. No se
  retira —el prototipo no puede presentar como real una recomendación que no lo
  es— sino que baja a una nota pequeña bajo la tarjeta. El texto **no se parte
  en dos claves**: `home.finder.body` lo comparte la portada web, y tocarlo
  cambiaría una superficie que esta entrega no toca.
- **La web no se rediseña.** `HomeWeb` y `AppHome` quedan intactas, y el carril
  horizontal de la web móvil se conserva: esta decisión resuelve la aplicación.
- Resultado medido: identidad de **68 → 64 px**, Finder de **258 → 178** con
  aviso y **141 sin él**, total de **1559 → 1448 px** (3,54 → **3,29
  pantallas**) a 320, títulos **5 → 4**, superficies **13 → 11** y **0
  duplicados** entre carriles.
- Evidencia: `src/components/home/app/AppCustomerHome.tsx`,
  `src/components/product/ProductCardCompact.tsx` y los contratos de
  `tests/e2e/inicio-nativo.spec.ts` y `tests/e2e-prefs/inicio-accesos.spec.ts`,
  con contraprueba del filtro de deduplicación.

## D-077 — Tienda es la puerta al catálogo, no una selección

- Fecha: 2026-08-23. Auditoría del 2026-08-23 y su implementación.
- Estado: vigente.
- Sustituye la Tienda de la **PR #56**, que separó Tienda de Inicio y quitó los
  dos escaparates previos al filtro. Reconstruido el 2026-08-23 al cerrar
  DOC-002.
- Problema, medido con la aplicación real: Tienda enseñaba **6 ofertas de un
  catálogo de 23 modelos** —cuatro de ellas Mac—, así que **iPad, Watch, AirPods
  y Accesorios no aparecían en toda la pantalla**. Con historial real la
  intersección de producto con Inicio era **6 de 6**: abrir Tienda después de
  Inicio no aportaba ni un producto nuevo. Su lead prometía «todo lo que puedes
  comprar» y entregaba el 26 % del catálogo, todo rebajado. Y **Servicios
  ocupaba 286 px, el 31 % de la pantalla**, con tres rótulos que se distinguían
  mal entre sí.
- **Inicio y Tienda responden a preguntas distintas.** Inicio: «lo mío, lo que
  requiere atención, ayúdame a decidir». Tienda: «qué vende Banana, entra al
  catálogo, qué ofertas hay ahora». Compartir algunas tarjetas es aceptable; lo
  que no lo era es compartir la función.
- Orden: **Tienda · Explorar · Oportunidades · Ayuda para elegir · Servicios.**
- **Vuelve una navegación de familias, y no es la de antes.** Se retiró en su
  día porque «las familias ya viven en los chips de `AppTopBar`, que están
  SIEMPRE arriba y a un toque». Esa premisa era incompleta en tres puntos
  medidos: los chips ocupan 474 px y **a 320 px sólo se ven cuatro de seis**
  —«Accesorios» no aparece nunca sin arrastrar—, miden **32 px** de alto, y **se
  recortan bajo el buscador al bajar** (lo afirma `app-shell.spec.ts`).
  «Explorar» no es la vieja rejilla «Compra por categoría», que era un
  escaparate con imágenes: son seis destinos de 56 px en dos columnas, sin
  iconos —no hay en `Icon` símbolos que distingan un Mac de un iPad sin
  inventarlos—. **Los chips no se tocan**: siguen donde estaban.
- **Oportunidades enseña todas las ofertas reales del catálogo**, sin límite y
  sin «Ver todas»: en Inicio son un teaser de cuatro, aquí son el conjunto, que
  es lo que se espera de una tienda. No se deduplica contra Inicio ni contra el
  historial: lo que cambia es la función de la pantalla, no el producto.
- **No hay bloque aparte de Accesorios**: es una de las seis familias de
  Explorar, y repetirlo sería la duplicación que esto viene a quitar.
- **La ayuda para elegir sigue siendo secundaria**, después del producto, y se
  corrigen dos cosas que la hacían ilegible: pedía el icono `sparkles`, que **no
  existe** en `Icon` —el componente cae a `paths.info` cuando no encuentra el
  nombre, así que la fila se leía como un aviso con su ⓘ—, y tenía la jerarquía
  invertida, con el eyebrow de título y el nombre de la herramienta de
  subtítulo.
- **Servicios quedan en tres, y comerciales**: Plan Renove, «Comprar en tienda»
  —reencuadre de `/tiendas`, mismo destino y sin comportamiento nuevo— y
  Servicio técnico. Se van de aquí el índice genérico `/servicios` y `/soporte`,
  que ya tiene sitio propio en Inicio. Ninguna ruta desaparece del producto.
- **Tienda no se personaliza.** No lee sesión, ni historial, ni tienda favorita:
  es la misma pantalla para todo el mundo, y debe seguir siéndolo. Los favoritos
  de la tarjeta siguen funcionando porque son comportamiento de la tarjeta.
- **La web no cambia**: `/tienda` sigue redirigiendo a `/` fuera del binario, y
  `HomeWeb`, `AppCustomerHome`, `ProductCardCompact`, `AppTopBar`, `AppTabBar` y
  los catálogos de familia quedan intactos.
- Resultado medido a 320: **6 familias alcanzables desde el contenido** sin
  desplazamiento lateral y con 56 px de alto; servicios de **286 → 188 px**;
  total de **954 → 1080 px** (2,17 → 2,45 pantallas). La pantalla crece 126 px y
  a cambio deja de ser un subconjunto de Inicio.
- Evidencia: `src/components/home/app/AppHome.tsx`, `src/pages/StorePage.tsx` y
  los contratos de `tests/e2e/tienda-catalogo.spec.ts` y
  `tests/e2e/app-shopping.spec.ts`, con contraprueba del carril personal.

## Cómo añadir una decisión

Añade una sección con identificador, fecha, estado, decisión, evidencia y
consecuencias. Si una decisión cambia, no borres su historia: márcala como
reemplazada e indica el nuevo identificador.

## D-078 — El armazón nativo tiene barras propias: cabecera Banana, pestañas azules

- Fecha: 2026-08-09 a 2026-08-16. PR #43 (`7a8f3b9b`), PR #49 (`8887ef10`) y
  PR #58 (`e39802a7`).
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar
  [[04-problemas-pendientes#DOC-002 — La documentación viva va veintitrés PR por detrás]].
  Las tres PR se documentan juntas porque son una sola evolución.

**Problema.** La barra inferior de la app y la cabecera no tenían un criterio de
color propio: se derivaban del contexto de la ruta.

**La evolución, en tres pasos.** La PR #43 fijó la barra inferior **azul en toda
la app** y una cabecera que dependía del contexto: amarilla en Tienda, clara en
Inicio, Mis compras y Cuenta. La PR #49 movió Inicio al amarillo. La PR #58
cerró el criterio: `contextoDe` devuelve tres valores —`comercial`, `cliente`,
`neutro`— y **todo lo `neutro` caía en blanco sin que nadie lo hubiera
decidido**: soporte, tiendas, servicio técnico, Plan Renove, login, registro y
el 404. Desde entonces la cabecera es amarilla siempre.

**Decisión.** La cabecera de la aplicación nativa es la superficie amarilla
Banana en todas las rutas; la barra de pestañas es azul. Lo que sigue dependiendo
del contexto es la **composición** de la cabecera —buscador prominente y chips
en comercial, búsqueda compacta en cliente—, no su color.

**Evidencia hoy.** `AppTopBar.tsx` pinta `className="z-40 shrink-0 bg-banana"`
sin condición, y `AppTabBar.tsx` usa `bg-azul`. Lo vigila
`tests/e2e/barra-banana.spec.ts`.

**Nota de historia.** La PR #43 llevaba además dos cambios que no son de este
criterio: la barra azul de servicios de la **web** pasó a `xl` porque solapaba
entre 640 y ~1000 px, y el panel de agentes ganó un divisor arrastrable.

## D-079 — El arranque nativo va de Banana a Banana, y enseña el logotipo

- Fecha: 2026-08-12 y 2026-08-14. PR #50 (`01581a30`) y PR #54 (`8e8b901f`).
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.

**Problema.** Abrir la app era `sistema → blanco nativo → blanco del documento →
Home`. Sin `ios.backgroundColor`, Capacitor inicializa el `WKWebView` con la
superficie del sistema: medido, **~700 ms de blanco**. La PR #54 encontró
después un segundo defecto distinto —una pantalla negra antes del amarillo, y el
logotipo que no aparecía en ningún momento.

**Decisión.** El arranque no atraviesa ninguna superficie que no sea de la
marca, y muestra el logotipo hasta que la Home está pintada.

**Evidencia hoy.** `capacitor.config.ts`, `index.html`, `src/index.css`, los
recursos `wordmark*.png` y `LaunchScreen.storyboard` de iOS. Lo vigila
`tests/unit/arranque-nativo.test.ts`.

**Nota de historia.** La #50 no resolvió el arranque entero: corrigió el blanco
del WebView y del documento. El logotipo y el negro previo son de la #54.

## D-080 — Las tipografías se distribuyen con la aplicación, no desde Google Fonts

- Fecha: 2026-08-13. PR #52 (`c33d0389`).
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.

**Problema.** Inter y Manrope se pedían a Google Fonts en tiempo de ejecución. El
CI posterior a la PR #50 registró un inestable en `product.spec.ts` cuyo rastro
del primer intento señalaba una petición de fuente fallida.

**Decisión.** Las tipografías viajan con la aplicación vía `@fontsource`, con
**exactamente los mismos pesos** que se cargaban antes: Inter 400/500/600/700 y
Manrope 500/700/800. Se retira del *service worker* la excepción que trataba
`fonts.googleapis.com` y `fonts.gstatic.com` como recursos externos cacheables.

**Alternativa descartada, y por qué.** Ampliar `IGNORED_ERROR` para silenciar el
error de red habría convertido en falso verde cualquier imagen, script o API rota
de verdad.

**Evidencia hoy.** `@fontsource/inter` y `@fontsource/manrope` en
`package.json`, importados en `src/main.tsx`; ninguna petición a dominios de
Google. Lo vigila `tests/e2e/tipografias.spec.ts`.

## D-081 — Una prueba que no puede ponerse roja no es una prueba

- Fecha: 2026-08-09. PR #45 (`ac3729e9`), con las PR #46 (`117acdc7`) y #51
  (`cb481247`) como aplicación del mismo criterio.
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.

**Problema.** Una auditoría del sistema de pruebas concluyó `TESTS NO FIABLES`.
En tres áreas —`nav-solapes`, `anchos`, `secretos`— se demostraron **seis
mecanismos distintos de falso verde**. El más claro: `solapes()` devolvía
`{ visible: false, cruces: [] }` cuando la barra no se pintaba, y las pruebas
sólo miraban `cruces`, así que **barra ausente → cero cruces → verde**. Medido:
ocultándola a todos los anchos, cinco de siete pruebas seguían pasando.

**Decisión.** Una comprobación debe demostrarse capaz de fallar. La forma de
demostrarlo es la **contraprueba**: romper a propósito lo que la prueba dice
proteger y verificar que se pone roja por el motivo esperado.

**Evidencia hoy.** Es la metodología que sigue usándose: las dos correcciones de
cobertura de la PR #74 se validaron exactamente así.

**Nota de historia.** Las PR #46 y #51 no son de esta decisión, sino dos
aplicaciones suyas: la #46 demostró que el inestable del comparador era la URL
—`?f=` frente a `?familia=`— y no el comparador, y la #51 que el selector de
tienda en Favoritos resolvía a **dos** botones, un `strict mode violation` que
sólo se manifestaba cuando aparecía el diálogo de bienvenida.

## D-082 — La identidad del chat sin cuenta es efímera

- Fecha: 2026-08-10. PR #47 (`7b7307ab`), con la PR #48 (`7ee79759`) como
  corrección del panel.
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.

**Problema.** Quien usaba el chat **sin cuenta** y volvía a abrir la web o la app
seguía siendo la misma persona: no se le pedían nombre y correo y recuperaba su
conversación anterior. Reproducido contra Supabase local: mismo `auth.uid`
anónimo y misma conversación tras reiniciar. Borrar `localStorage` no bastaba.

**Decisión.** Sin cuenta no hay identidad duradera: la sesión anónima y su
conversación dejan de sobrevivir a un reinicio.

**Evidencia hoy.** `src/lib/chatSession.ts` y la migración
`20260810000500_continuidad_temporal_conversacion.sql`. Lo vigilan las pruebas
de integración `chat-anonimo-efimero`, `chat-anonimo`, `chat-identidad-cuentas`
y `continuidad-conversacion`.

**Nota de historia.** La PR #48 es un problema distinto del panel de agentes, no
de la identidad: cerrar una conversación no se reflejaba por **dos** defectos
—la selección se quedaba apuntando a una fila que salía de la bandeja, y el
panel esperaba su propio eco de *realtime*—. El backend siempre funcionó.

## D-083 — La compra sin cuenta se reconcilia al identificarse

- Fecha: 2026-08-17. PR #59 (`dc9fe5ba`).
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.

**Problema.** Quien compraba sin identificarse veía su pedido en la confirmación
y lo **perdía al cerrar la pestaña**: vivía en `sessionStorage`, nunca llegaba al
servidor y no había reconciliación posterior. El checkout no exige sesión —y no
la va a exigir—, así que el hueco era estructural.

**Decisión.** La compra invitada se guarda en una cola aparte
—`banana:pending-guest-orders` en `localStorage`— y se escribe en `pedidos` en
cuanto aparece una cuenta permanente.

**Evidencia hoy.** `src/lib/pendingGuestOrders.ts`, `orderSync.ts`, `orderId.ts`
y `customerAuth.tsx`. Lo vigilan `tests/unit/compra-invitado.test.ts` y
`tests/integration/compra-invitado-servidor.spec.ts`.

## D-084 — «Mis productos» es superficie de cuenta, y la pestaña se llama «Compras»

- Fecha: 2026-08-08 y 2026-08-16. PR #40 (`7bf8628e`) y PR #57 (`56cadc82`).
- Estado: vigente.
- **Reconstrucción histórica**, escrita el 2026-08-23 al cerrar DOC-002.
  Complementa [[02-decisiones#D-067]], que es la parte de datos.

**Problema.** La pantalla se llamaba **«Mis compras»** y sólo enseña líneas de
pedido con `kind === 'device'`: quien hubiera comprado únicamente accesorios
tenía pedidos y veía «Mis compras» **vacío**. Además estaba construida como
catálogo —rejilla de tarjetas verticales con foto cuadrada a ancho completo, unos
310 px a 390 px de pantalla— para un producto que el cliente **ya tiene** y no
está eligiendo.

**Decisión.** El rótulo dice la verdad: la pestaña pasa a **«Compras»**. La
pantalla deja de presentarse como catálogo y pasa a ser una superficie de cuenta,
orientada a la postventa del dispositivo.

**La ruta no se mueve.** Sigue siendo `/mis-productos`. Cambiarla sólo para que
casara con el rótulo añadía riesgo —enlaces, pruebas, historial— a cambio de nada
que el cliente note. Mismo criterio que ya aplicó la PR #41.

**Evidencia hoy.** La clave `appnav.purchases` expresa el rótulo «Compras» y
está traducida en los cinco idiomas —`Purchases`, `Käufe`, `Achats`,
`Acquisti`—; **en castellano vale `'Compras'`**, que es el rótulo que se ve en
la app, porque la app va siempre en castellano
([[02-decisiones#D-047]]). `AppTabBar.tsx` apunta a `/mis-productos`. Lo vigilan
`tests/e2e-prefs/mis-productos.spec.ts` y
`tests/integration/mis-productos-servidor.spec.ts`.

## D-085 — Compartir código no es compartir composición

- Fecha: 2026-08-28.
- Estado: vigente.
- Decisión: **web y app son experiencias visuales distintas.** Comparten
  repositorio, build, datos, tipos, precios, ofertas, rutas, lógica de filtros y
  su estado en la URL. **No comparten obligatoriamente composición visual,
  jerarquía de bloques ni controles de catálogo.** Cuando una página necesita
  estructuras distintas, la plataforma se decide **una sola vez**, en la
  frontera de esa página, y cada composición vive en su propio archivo.
- Motivo: no es una preferencia estética, es la corrección de un fallo real.
  `FamilyPage` la montaban las dos plataformas. En `f3143d85` —«feat(app):
  Tienda deja el catálogo a un toque»— se simplificó pensando en la app, con
  razón: en `/iphone` los filtros aparecían en y=2.238, casi tres pantallas por
  debajo. Pero al ser una composición compartida, **la web perdió a la vez** su
  carrusel de modelos, su escaparate de «Oportunidades» y el encabezado del
  catálogo completo, y en escritorio quedó una pantalla de móvil estirada a
  1440 px. Nadie lo pidió y nadie lo vio hasta meses después.
- Regla que queda: **si cambiar una plataforma puede mover la otra por
  accidente, la frontera está mal puesta.**
- Implementación: `FamilyPage` resuelve el 404 y decide con `isNativeApp`,
  delegando en `WebFamilyPage` o `AppFamilyPage`. Es el mismo patrón que `Home`
  (D-042) ya usaba con `HomeWeb` y `AppCustomerHome`. Los controles de catálogo
  se parten en `CatalogFiltersWeb` —orden a la vista, recuento legible— y
  `CatalogFiltersApp` —dos controles táctiles y su hoja—. El dominio se comparte
  en `useCatalogoFamilia` y en `lib/catalogFilters`, donde viven las listas de
  órdenes y disponibilidades **para que separar la presentación no acabe
  separando también lo que se ofrece**.
- Alcance conocido al escribirla (2026-08-28): `ProductCard`, `VariantPage` y
  `ModelPage` seguían siendo superficies compartidas. Rediseñarlas para una
  plataforma cambiaría la otra, así que ponerles su frontera es **requisito
  previo** a tocarlas visualmente.
- **Actualización (2026-08-29): la tarjeta ya tiene su frontera.** `ProductCard`
  se separó en `ProductCardWeb` y `ProductCardApp`, ambas nacidas idénticas a lo
  que su plataforma enseñaba —la entrega construye la puerta, no la cruza—. El
  comportamiento no se duplicó: variante enseñada, oferta, destino, favorito y
  comparación viven una sola vez en `useTarjetaDeProducto`, que sigue usando
  `lib/offers`. Cada superficie importa explícitamente la suya, de modo que la
  frontera se lee en los imports; `/buscar`, que es la misma pantalla en las dos
  plataformas, decide **una sola vez** en su cabecera. `data-product-card-surface`
  lo hace comprobable en `tests/e2e/tarjeta-por-plataforma.spec.ts`.
- **Sigue pendiente**: `VariantPage` y `ModelPage`. Son las dos superficies que
  quedan sin frontera de presentación.
- **Fuera de esta migración**: `ProductCardCompact` ya era una composición
  independiente —sólo la montan `AppHome` y `AppCustomerHome`— y no formaba parte
  del problema; no se ha tocado.

## D-086 — La Fase B empieza por la app, y la web conserva su composición

- Fecha: 2026-08-29.
- Estado: vigente.
- Decisión: **la Fase B visual («el producto respira») se aplica a la app y no a
  la web.** Su primera entrega, **B1**, rediseña la tarjeta de catálogo nativa
  —`ProductCardApp`— y deja `ProductCardWeb` exactamente como estaba.
- Motivo: el diseño de Fase B se escribió **antes** de que existieran las
  fronteras de D-085, midiendo a 320/390/430 en modo aplicación, y **no declara
  plataforma en ninguna de sus decisiones**. La auditoría previa lo dejó por
  escrito en vez de deducirlo: lo que la Fase B resuelve —que el precio entre en
  pantalla junto al producto— es un problema de un catálogo que se recorre con
  el pulgar, no de una rejilla de tres columnas en escritorio, donde la tarjeta
  actual funciona. Aplicarlo a la web habría sido un rediseño que nadie pidió.
- Implementación: B1 vive íntegramente en `ProductCardApp`, más el aviso de
  precios demostrativos. Ese aviso **se da una vez por cada superficie de
  listado nativa que monta la tarjeta nueva**, no una vez en total: el catálogo
  de familia (`AppFamilyPage`) y **la búsqueda cuando corre en modo app**
  (`SearchPage`), que es compartida y decide plataforma en su frontera. En la
  búsqueda se exige además que haya un dispositivo real en pantalla —no basta
  con estar en la app—, para no avisar sobre precios que no existen. La web no
  recibe ese aviso: allí cada `ProductCardWeb` sigue llevando el suyo.
  **No se tocó `useTarjetaDeProducto`**: variante
  enseñada, oferta, destino, favorito, límite de tres y regla por familia siguen
  definiéndose una sola vez para las dos plataformas. La proporción de imagen se
  pasa por prop —el `ratio` por defecto de `ProductImage` **no se cambia**,
  porque eso sí movería la web—.
- Lo que hizo posible esto: la frontera de la PR #87. Sin ella, cada uno de
  estos cambios habría cambiado también el navegador, que es el fallo que
  D-085 describe.
- **Pendiente, no decidido**: **B2**, la ficha de producto. `VariantPage` sigue
  compartida y no se ha tocado. Si su limpieza se aplicara a las dos plataformas
  —la auditoría apunta a que sus defectos son de ancho, no de plataforma— no
  haría falta frontera; si se decidiera divergir, la mínima sería extraer el
  hero, no partir la página.
- **Fuera de alcance**: `ModelPage`. No hay evidencia de que el diseño aprobado
  pretenda cambiarla, y ninguna superficie de producto enlaza a ella salvo el
  detalle de accesorios. Permanece compartida.

## D-087 — B2 diverge en tres nodos, no en una página

- Fecha: 2026-08-29.
- Estado: vigente.
- Decisión: la Fase B2 —la ficha de producto— **no crea `VariantPageApp`,
  `VariantPageWeb`, `ProductHeroApp` ni `ProductHeroWeb`**. `VariantPage` sigue
  siendo **una sola página compartida**, y la presentación diverge en **tres
  nodos concretos** mediante `isNativeApp`: la superficie de la galería, la fila
  del nombre con el favorito, y el renderizador de los accesorios sugeridos.
- Motivo: la auditoría previa acotó B2 a tres requisitos —galería sin marco,
  favorito que deja de separar nombre y precio, accesorios con el tratamiento
  del catálogo—. Extraer un hero significaría mover unas 240 líneas y pasar
  hacia abajo modelo, color, capacidad, variante actual, tamaños y los callbacks
  de selección, favorito, carrito y modales, para que **las dos copias nacieran
  idénticas y siguieran idénticas**, porque ningún requisito pide que diverjan.
  Sería duplicación sin divergencia. Separar la página entera es aún menos
  defendible: hay un solo `isNativeApp` preexistente en 808 líneas.
- Implementación: los tres nodos eligen presentación en el sitio donde se
  pintan. `FavoriteToggle` gana una variante `soloIcono` —misma lógica, mismo
  `aria-pressed`, mismo nombre accesible, sólo sin texto visible— porque con
  texto medía 170 px y no cabía junto al título. Los accesorios nativos
  **reutilizan `AccessoryCard`**, la fuente real del tratamiento del catálogo,
  en lugar de copiar sus clases.
- **La recomendación de la auditoría no se adopta, y conviene que conste.** Esa
  auditoría concluyó que los tres problemas existen **igual en la web
  estrecha** —el favorito se interpone también a 390 px de navegador, medido— y
  que lo coherente sería arreglarlos en ambas plataformas. No se hace: **D-086
  congela la composición web durante la Fase B**. Que un cambio también mejore
  la web no lo convierte en parte de esta entrega; sería otra decisión, con su
  propia revisión.
- **Tampoco conviene falsear la historia**: el diseño original de Fase B **no
  declaró B2 como app-only**. La decisión de aplicarlo sólo a la app es
  posterior y consciente, tomada en D-086 y ejecutada aquí.
- Fuera de alcance: `ModelPage` —ningún requisito la nombra—, selectores, stock,
  entrega, financiación, compra, reservas, seguro, pestañas, barra de compra
  fija y el distintivo de precio de la ficha, que B2 no menciona y por tanto no
  se toca.

