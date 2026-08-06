---
tipo: decisiones
actualizado: 2026-08-06
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

## Cómo añadir una decisión

Añade una sección con identificador, fecha, estado, decisión, evidencia y
consecuencias. Si una decisión cambia, no borres su historia: márcala como
reemplazada e indica el nuevo identificador.
