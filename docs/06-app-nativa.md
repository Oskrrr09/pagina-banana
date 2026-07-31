---
tipo: guia
actualizado: 2026-07-31
---

# Aplicación nativa de la tienda (iOS y Android)

La tienda se empaqueta con [Capacitor](https://capacitorjs.com) para poder
publicarla en App Store y Google Play, que es lo que técnicamente tienen las
apps de Amazon o PcComponentes. Envuelve **el mismo build de React** que se
publica en GitHub Pages; no hay una segunda versión del código
([[02-decisiones#D-040 — Un único código para web y app nativa]]).

El panel de agentes **no** entra aquí: se instala como PWA desde el navegador
([[02-decisiones#D-039 — Dos aplicaciones distintas: la tienda nativa, el panel como PWA]]).

---

## Antes de nada: lo que hay que resolver fuera del código

> [!warning] Esto no es una limitación técnica, y no se arregla programando
> Ninguno de estos tres puntos depende del repositorio. Conviene tenerlos
> claros antes de invertir tiempo en publicar.

1. **Publicar una app llamada "Banana Computer" requiere autorización de
   Banana.** Apple y Google exigen que una app que representa a un negocio se
   publique desde la cuenta de desarrollador **de ese negocio**, y verifican la
   identidad de quien la publica. Una cuenta personal publicando la tienda de
   otra empresa se rechaza, y con razón.
2. **Una app de demostración con datos ficticios se rechaza.** Apple aplica sus
   directrices 2.1 (la app debe estar completa) y 4.2 (funcionalidad mínima).
   Este prototipo tiene precios, stock, pedidos y cuentas **demostrativos**:
   tal cual, no pasaría revisión. Para publicar de verdad haría falta antes el
   catálogo, los precios y el stock reales, y una pasarela de pago real.
3. **Cuentas de pago.** Apple Developer Program: **99 €/año**, renovable.
   Google Play Console: **25 $ una sola vez**.

Para **enseñar la app** —que es el objetivo hoy— no hace falta nada de esto:
basta instalarla en un dispositivo o un simulador, como se explica más abajo.

---

## Estado actual

**Hecho y en el repositorio:**

- `capacitor.config.ts` con el identificador, el nombre y los ajustes de
  esquema de Android e `contentInset` de iOS.
- `npm run build:app` — build de la web con `--base=/` a `dist-app/`, que es lo
  que se empaqueta.
- Proyectos nativos `ios/` y `android/` generados y versionados.
- Iconos y pantallas de carga en todos los tamaños de ambas plataformas,
  generados desde el logo vectorial (`npm run icons` +
  `npx @capacitor/assets generate --assetPath resources`).
- El service worker se desactiva dentro de la app nativa: los ficheros ya
  viajan en el binario y no hay nada que cachear (`src/lib/pwa.ts`).

**No hecho, y no se puede hacer desde este repositorio:**

- **Compilar el binario.** Requiere herramientas que no estaban instaladas en
  el equipo cuando se montó esto: Xcode completo (~15 GB, no bastan las
  Command Line Tools), Android Studio con su SDK, y un JDK.
- Firmar, subir y pasar revisión.

Es decir: la configuración está puesta y es coherente, pero **el binario no se
ha compilado ni ejecutado nunca**. Hasta que alguien lo abra en Xcode o Android
Studio, dar por hecho que arranca a la primera sería inventar.

---

## Instalar las herramientas

| Herramienta | Para qué | Cómo |
|---|---|---|
| Xcode (completo) | iOS | App Store. ~15 GB. Después: `sudo xcode-select -s /Applications/Xcode.app` |
| Android Studio | Android | <https://developer.android.com/studio>. Incluye el SDK |
| JDK 21 | Android | `brew install openjdk@21` |

Capacitor 8 usa Swift Package Manager para iOS, así que **CocoaPods ya no hace
falta**.

---

## Compilar y abrir

```bash
npm run app:ios       # build + sync + abre Xcode
npm run app:android   # build + sync + abre Android Studio
```

Ambos ejecutan por debajo `npm run build:app && cap sync`. **`cap sync` hay que
volver a lanzarlo cada vez que cambie la web**: los proyectos nativos llevan una
copia del build dentro, y esa copia no se actualiza sola.

Desde ahí, el botón de ejecutar de cada IDE instala la app en un simulador o en
un dispositivo conectado. Para un iPhone físico basta una cuenta de Apple
gratuita: la app caduca a los 7 días, pero para enseñarla sobra.

Si cambia el logo:

```bash
npm run icons
npx @capacitor/assets generate --assetPath resources
```

---

## Detalles que conviene conocer

- **El `appId` es permanente.** `com.bananacomputer.tienda` está puesto como
  propuesta y **debe confirmarse con Banana antes de publicar nada**: una vez
  hay una app publicada con ese identificador, cambiarlo significa publicar una
  aplicación distinta y perder las descargas y las valoraciones.
- **Android sirve por `https://localhost`** (`androidScheme: 'https'`), no por
  `file://`. Es necesario para que Supabase Auth funcione: la sesión y las
  peticiones con credenciales necesitan un origen seguro.
- **Las credenciales de Supabase se compilan dentro del binario**, igual que en
  la web. La `anon key` está pensada para ser pública y quien protege los datos
  es la RLS, no el secreto de la clave. Lo que **no** debe entrar nunca en el
  binario es la `service_role`.
- **Cada cambio de la web exige recompilar y volver a publicar la app.** La web
  se actualiza sola con cada push a `main`; la app no, y además pasa por
  revisión de Apple. Es la contrapartida de estar en las tiendas.
- **Notificaciones push**: no están. Necesitarían `@capacitor/push-notifications`
  más Firebase Cloud Messaging y APNs. Es trabajo aparte, no un ajuste.
