---
tipo: sesion
fecha: 2026-07-30
tema: Chat de Bananito con Supabase y panel /agente (Fase 1)
---

# Chat de Bananito + backend en tiempo real (Fase 1)

## Objetivo

Convertir el prototipo del chat (hasta ahora una burbuja con respuestas
simuladas) en una experiencia bidireccional real: los mensajes del
visitante se persisten en un backend, un agente de tienda los ve en
un panel dedicado y puede contestar, con actualización en vivo. Todo
sin backend propio y sin coste — usando Supabase como Backend-as-a-Service.

## Estado inicial

- La burbuja de chat de Bananito ([[../../src/components/layout/ChatBubble.tsx]])
  respondía con un array de canned replies (`CANNED_REPLIES`) con un delay
  simulado. Nada persistía, nada llegaba a nadie.
- No existía panel de agentes.
- No había cuenta de Supabase ni infraestructura de backend.

## Trabajo realizado

### 1. Cuenta y proyecto Supabase

- Cuenta creada en <https://supabase.com> con `oscar16702@gmail.com`.
- Proyecto `pagina-banana` en región EU con **Postgres 17** estándar
  (rechazamos OrioleDB por ser experimental, ver
  [[../02-decisiones#Backend — Postgres estándar vs OrioleDB]]).
- Activados los tres checks del setup inicial: **Data API**,
  **Automatically expose new tables** y **Enable automatic RLS**.

### 2. Esquema SQL

Archivo versionado en `supabase/schema.sql`. Tres tablas:

| Tabla | Rol |
| --- | --- |
| `visitantes` | Una fila por navegador que abre la web. UUID persistido en `localStorage` bajo `bananito:visitor_id`. |
| `conversaciones` | Sesión de chat asociada a un visitante. Estado `abierta`/`cerrada`, `agente_id`, `ultimo_mensaje_at`. |
| `mensajes` | Cada línea del chat, con `autor` = `visitor` \| `agent` \| `bot`. |

Extras del esquema:

- **Trigger** `touch_conversation_on_message` que actualiza
  `ultimo_mensaje_at` en la conversación cada vez que se inserta un mensaje
  (ordenación del inbox del agente).
- **RLS activa** en las tres tablas + **políticas abiertas para `anon`** en
  Fase 1 (no hay auth todavía). Se sustituirán por políticas basadas en
  `auth.uid()` en Fase 2.
- **Publicación en `supabase_realtime`** de `mensajes` y `conversaciones`,
  para que los clientes puedan suscribirse a `INSERT` en vivo.

El script es **idempotente** (`create ... if not exists`, `drop policy if
exists ... create policy ...`), así que se puede re-ejecutar sin miedo al
iterar.

### 3. Cliente Supabase y variables de entorno

- Instalado `@supabase/supabase-js` (con `--cache /tmp` porque `~/.npm`
  era propiedad de `root` en la máquina de Oscar — ver
  [[../04-problemas-pendientes#Permisos de la caché npm]]).
- Nuevo módulo `src/lib/supabase.ts`: exporta `supabase` (cliente o `null`
  si faltan credenciales) y `supabaseEnabled`. Tipa `DbVisitor`,
  `DbConversation`, `DbMessage` para consumo desde React.
- Nuevo `.env.example` documentando las variables. `.env.local` (ignorado
  por git) con la URL y la anon key reales.
- `.gitignore` extendido: `.env`, `.env.*` con excepción `!.env.example`.
- `src/vite-env.d.ts` con tipado de `import.meta.env.VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY`.

### 4. Hook `useVisitorChatSession`

Nuevo módulo `src/lib/chatSession.ts` con la lógica compartida:

- Al abrir el chat por primera vez, asegura que existe el visitante en BD
  (crea si no existe, reusa si sí) y una conversación abierta para él.
- Inserta un mensaje de bienvenida del bot cuando la conversación es
  nueva.
- Carga historial de mensajes al abrir.
- Se suscribe a `INSERT` en `mensajes` filtrado por `conversacion_id`
  para pintar respuestas del agente en vivo.
- Deduplicación por id (`seenIdsRef`) para evitar doble render cuando
  llega el evento realtime del propio insert optimista.
- Fallback: si no hay Supabase configurado (`supabaseEnabled === false`),
  el hook expone `demo: true` y el componente cae al modo canned reply.

### 5. Reescritura de `ChatBubble.tsx`

- Consume `useVisitorChatSession(open)` — la sesión se inicializa **solo
  cuando se abre el chat**, no al cargar la página, para no meter
  latencia gratuita ni consumir cuota de Realtime en visitantes que no
  van a hablar.
- Convierte los mensajes de BD (`DbMessage`) a `UIMessage` con
  `side: 'left'|'right'` para renderizar (izquierda = bot/agente, derecha =
  visitante).
- Mantiene toda la accesibilidad previa (trampa de foco, `inert`,
  Escape, `role="dialog"`) y la animación de entrada/salida.
- Oculto en `/checkout/*` y ahora también en `/agente/*` (para no
  mostrar la burbuja dentro del panel de agentes).
- Conserva el modo demo con `CANNED_REPLIES` cuando no hay Supabase.

### 6. Panel `/agente`

Nueva página `src/pages/AgentPage.tsx` con dos hooks nuevos
en `chatSession.ts`:

- **`useAgentInbox()`** → lista las 50 conversaciones más recientes con
  su último mensaje. Se suscribe a `INSERT`/`UPDATE` globales en
  `mensajes` y `conversaciones` y recarga en vivo.
- **`useAgentConversation(id)`** → historial de una conversación + envío
  como `autor: 'agent'` + suscripción realtime a nuevos mensajes de esa
  conversación.

Layout full-screen (sin `Layout` público) con:

- **TopBar** amarilla del nav con logo y "Panel de agentes · Oscar".
- **InboxColumn** (280px) con lista de conversaciones ordenadas por
  actividad. Cada item muestra "Visitante xxxxxxxx", último mensaje y
  tiempo relativo.
- **ConversationColumn** con cabecera del visitante seleccionado,
  historial (mensajes del agente a la derecha en azul, del visitante y
  del bot a la izquierda) y campo de entrada.
- Auto-selección de la conversación más reciente al cargar.
- Pantalla de aviso si `supabaseEnabled === false`.

Ruta registrada en `src/App.tsx` fuera del `Layout` público:

```tsx
<Route path="/agente" element={<AgentPage />} />
```

### 7. GitHub Actions

- `deploy.yml` inyecta `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  al paso de `npm run build` desde los secretos `SUPABASE_URL` y
  `SUPABASE_ANON_KEY` (configurados por Oscar en
  Settings → Secrets and variables → Actions).
- Si los secretos no están definidos, el build sigue funcionando pero la
  web se despliega en modo demo (fallback documentado).

## Decisiones tomadas

- **Supabase como backend** en lugar de montar servidor propio (nos da
  Postgres + Auth + Realtime + storage en un solo servicio, gratis para
  el prototipo). Ver [[../02-decisiones#Backend — Supabase Fase 1]].
- **Fase 1 sin auth de agentes**: `/agente` es accesible por URL. Suficiente
  para la demo interna; se sustituye por Supabase Auth en Fase 2. Ver
  [[../02-decisiones#Auth — sin login en Fase 1]].
- **Mantener modo demo** cuando faltan credenciales. Cualquier fork del
  repo sin `.env.local` sigue teniendo un chat funcional (canned replies).
- **`visitor_id` en `localStorage`** en vez de cookie o auth anónima de
  Supabase — más simple, sin flujo de consentimiento adicional. Se puede
  migrar cuando toque cumplimiento estricto de RGPD.
- **RLS abierta al rol `anon` en Fase 1**: se documenta como decisión
  temporal explícita. Sin auth real, no hay forma sensata de escribir
  políticas más restrictivas para el panel del agente.

## Comprobaciones

- `npm run build` verde tras cada cambio grande.
- Prueba end-to-end en local con dos navegadores (visitante en normal,
  agente en incógnito): mensajes fluyen bidireccionalmente en <1s, el
  historial persiste al refrescar, la lista del agente se reordena al
  recibir nuevo mensaje.
- Rutas `/`, `/agente` responden HTTP 200 en dev server.

## Archivos afectados

Nuevos:

- `supabase/schema.sql`
- `src/lib/supabase.ts`
- `src/lib/chatSession.ts`
- `src/pages/AgentPage.tsx`
- `.env.example`

Modificados:

- `src/components/layout/ChatBubble.tsx` — reescritura para consumir
  el hook, mantener fallback demo, ocultar en `/agente`.
- `src/App.tsx` — nueva ruta `/agente`.
- `src/vite-env.d.ts` — tipos de las variables de entorno.
- `.gitignore` — bloque `.env`/`.env.*` con excepción de `.env.example`.
- `.github/workflows/deploy.yml` — inyección de secretos al build.
- `package.json` / `package-lock.json` — dependencia
  `@supabase/supabase-js`.

Commits en `main`:

- `5718b13` — Chat en tiempo real con Supabase + panel /agente (Fase 1).

## Siguiente paso

Fase 2 propuesta (a debatir con Oscar):

1. **Auth real de agentes** con Supabase Auth (magic link por email).
2. **Ficha del cliente**: nombre, dispositivos previos, historial.
3. **Asignación** de conversaciones a un agente concreto y estado
   `disponible`/`ocupado`/`ausente`.
4. **Notificaciones nativas** cuando llega un mensaje nuevo al panel.
5. **App Mac nativa** (Tauri) que envuelva `/agente` — con icono en el
   Dock, badge de mensajes sin leer y atajo global. Ver conversación en
   sesión.
6. **Primer canal externo**: WhatsApp Business API vía Meta.

Antes de arrancar Fase 2, si Banana da luz verde, revisar la política
RLS abierta y sustituir por reglas basadas en `auth.uid()`.
