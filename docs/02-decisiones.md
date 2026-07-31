---
tipo: decisiones
actualizado: 2026-07-30
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

## Cómo añadir una decisión

Añade una sección con identificador, fecha, estado, decisión, evidencia y
consecuencias. Si una decisión cambia, no borres su historia: márcala como
reemplazada e indica el nuevo identificador.
