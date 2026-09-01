---
tipo: entrega
actualizado: 2026-09-01
---

# Entrega y reanudación

Documento operativo para aparcar el proyecto y poder retomarlo sin arqueología.
Es corto a propósito: lo que aquí se resume vive completo en los documentos
enlazados, y duplicarlo sólo garantizaría que las dos copias acaben
contradiciéndose.

## Qué es el proyecto

Un prototipo navegable de tienda Apple para **Banana Computer**. Una sola SPA de
React + Vite + TypeScript que se sirve como tres superficies: la **web** pública
en GitHub Pages, la **tienda nativa** para iOS y Android empaquetada con
Capacitor, y el **panel de agentes** de `/agente`, instalable como PWA. Cubre
catálogo, búsqueda, favoritos con seguimiento de disponibilidad, comparador,
carrito, checkout de tres pasos, cuenta de cliente, servicios, Plan Renove,
tiendas, soporte y chat con Supabase.

## Qué NO es

No es una tienda. En concreto, **nada de esto es real**:

- **precios** y condiciones de financiación;
- **stock** y disponibilidad por tienda;
- **pagos**: no hay pasarela, ni cobro, ni pasarela simulada que mueva dinero;
- **pedidos comerciales**: los pedidos son demostrativos y viven en el
  navegador;
- **emails**: no se envía ninguno;
- **integración con Banana Computer**: no está acordada ni validada.

La interfaz lo dice donde toca —_Precio demostrativo_, _Pedido de
demostración_, _Condición demostrativa_, _Stock de ejemplo_, _Pendiente de
validación con Banana Computer_— y esas etiquetas **no deben retirarse** sin esa
validación.

## Cómo levantarlo desde cero

Desde un clon limpio, con [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use          # Node 24, según .nvmrc
npm ci           # instalación reproducible desde el lockfile
npm run dev      # http://localhost:5173/pagina-banana/
```

Verificación, de menor a mayor coste:

```bash
npm run check        # formato, lint, tipos, unitarias y build de pruebas
npm run check:full   # lo anterior + E2E multinavegador + panel + preferencias
npm run test:e2e     # sólo Playwright
```

Los navegadores de Playwright se instalan una vez con
`npx playwright install chromium firefox webkit`.

Las suites que necesitan **Supabase local** —`test:integration`,
`test:confirmacion`, `test:rls`— requieren Docker y el CLI de Supabase, y no
entran en `check:full`. Se lanzan aparte y el CI las ejecuta en su propio job.

## Variables de entorno

Sólo se versionan dos ficheros, y **ninguno contiene secretos**:

- **`.env.example`** — plantilla. Documenta las dos únicas variables que el
  frontend lee: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Se copia a
  `.env.local`, que git ignora, y ahí van los valores reales.
- **`.env.test`** — entorno de las pruebas E2E, con las dos variables
  **vacías a propósito**: las pruebas corren contra el modo demostración y no
  contra la base de datos real. El CI tampoco tiene credenciales, así que local
  y CI prueban lo mismo.

`.gitignore` ignora `.env` y `.env.*` salvo esos dos. **La `service_role` de
Supabase no va nunca en el frontend**: es de servidor.

Tres formas de arrancar, según lo que se necesite:

| Modo | Cómo | Qué funciona |
| --- | --- | --- |
| **Sin Supabase** | sin `.env.local`, o con las variables vacías | Todo el catálogo, favoritos, comparador, carrito y checkout demostrativo. El chat y la cuenta quedan en modo demo |
| **Contra el proyecto de demostración** | `.env.local` con URL y `anon key` | Además: registro, acceso, cuenta, pedidos, reservas, chat y panel de agentes |
| **Supabase local** | `npm run supabase:start` | Lo mismo, contra una base efímera, y habilita las suites de RLS e integración |

## Web

```bash
npm run build   # tipos + dist/ + service worker del panel
```

El CI publica `dist/` en GitHub Pages **sólo** en pushes a `main`, y el
despliegue depende de que los checks estén verdes.

## App nativa

```bash
npm run build:app    # build con base '/' hacia dist-app/
npm run app:sync     # build:app + cap sync
npm run app:ios      # + abre Xcode
npm run app:android  # + abre Android Studio
```

Requisitos, firma, iconos, splash y lo que falta para publicar de verdad:
[[06-app-nativa]]. No se repite aquí.

## Arquitectura que no debe romperse al retomarlo

El principio que sostiene todo lo demás:

> **Compartir dominio no significa compartir composición.**

Web y app comparten repositorio, build, datos, precios, ofertas, rutas, estado y
persistencia. Lo que puede diverger es cómo se ve y cómo se toca. La plataforma
se resuelve **una sola vez** al arrancar, en `src/lib/nativeApp.ts`, y se decide
en fronteras explícitas y contadas —no consultando `isNativeApp` por dentro de
los componentes—.

Tres reglas prácticas:

1. **Un cambio visual de la app no puede mover la web**, ni al revés. Si puede,
   la frontera está mal puesta.
2. **Divergencia pequeña, rama local**; divergencia de estructura entera,
   composición aparte. Duplicar una página garantiza que las dos copias se
   separen sin que nadie se entere.
3. **El dominio no se duplica.** Si dos superficies necesitan lo mismo, va a un
   hook compartido.

Las decisiones que lo fijan, con su porqué y sus contraejemplos, en
[[02-decisiones]]:

| | |
| --- | --- |
| **D-085** | Compartir código no es compartir composición |
| **D-086** | La evolución visual de la app no modifica la web en silencio |
| **D-087** | La divergencia localizada se resuelve en hojas, no duplicando páginas |
| **D-088** | En la app, el historial de vistos es de la cuenta, no del teléfono |
| **D-089** | La compra se ancla al pulgar |
| **D-090** | El checkout nativo comparte el modelo de scroll, no el armazón |

Esto tiene coste real: la comprobación fuerte de que la web no se ha movido es
**comparar su HTML renderizado** contra el commit anterior al cambio, no leer
clases ni fiarse de que la fase «no tocó la web». Dos regresiones se colaron
justamente por no hacerlo.

## Deuda conocida

En [[04-problemas-pendientes]], que abre con un índice de lo que sigue abierto.
Los apartados 5.1 a 5.4 de [[03-roadmap]] recogen las tareas técnicas
pausadas. **Nada de eso está resuelto** y no conviene darlo por hecho.

## Cómo retomar el trabajo

1. `README.md` — qué es y cómo arrancarlo.
2. [[00-estado-actual]] — la foto de hoy. Ojo a la distinción entre presente e
   histórico: está marcada.
3. [[02-decisiones]] — de D-085 en adelante, si se va a tocar la frontera
   web/app.
4. [[04-problemas-pendientes]] — qué está abierto.
5. [[03-roadmap]] — qué se había pensado hacer.
6. `npm ci && npm run check:full` en local, **antes** de escribir nada: si algo
   está roto, conviene saberlo antes de atribuírselo a un cambio propio.
7. Rama desde `main`. `main` está protegida: exige PR y CI en verde.

## Checklist de demo

Recorrido corto para enseñar el proyecto. **En todo momento conviene decir en
voz alta que los datos son demostrativos**: la interfaz lo etiqueta, pero se
pasa por alto fácilmente.

**Web** — <https://oskrrr09.github.io/pagina-banana/>

1. Portada: carrusel, categorías, ofertas.
2. Familia (`/iphone`): escaparate de modelos, Oportunidades y catálogo con
   filtros —el estado va en la URL, así que se puede compartir el enlace ya
   filtrado—.
3. Ficha de variante: colores, capacidades, financiación simulada.
4. Favoritos: guardar desde el corazón de una tarjeta y seguir disponibilidad
   en una tienda.
5. Comparador: añadir dos modelos desde la ficha de modelo y ver «Solo
   diferencias».
6. Carrito y checkout de tres pasos, hasta la confirmación demostrativa.
7. Tiendas, Servicios y Soporte.

**App nativa** — en el dispositivo, tras `npm run app:ios`

1. Inicio: es la pantalla del cliente, no el escaparate.
2. Tienda: el catálogo a un toque.
3. Familia y ficha: la misma información, con composición nativa.
4. Favoritos: lista de una superficie, acciones a tamaño de dedo.
5. Comparador: comparación **vertical y por atributo**, sin gestos
   horizontales.
6. Carrito y checkout: el botón principal, anclado al pulgar.
7. Compras y Cuenta.

**Panel** — `/agente`

Acceso, lista de conversaciones y ficha del visitante. Se instala como
aplicación desde el propio navegador.
