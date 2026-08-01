---
tipo: guia
actualizado: 2026-08-01
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

**Android: compilado, instalado y ejecutado** (2026-08-01).

- `app-debug.apk`, 12 MB, `com.bananacomputer.tienda`, etiqueta "Banana
  Computer", `targetSdk` 36.
- Verificado en un emulador Pixel arm64 con Android 36: instala, arranca,
  la tienda renderiza dentro del WebView y **la navegación profunda
  funciona** (`/` → ficha de producto), que era el riesgo real de meter un
  `BrowserRouter` en un WebView. Sin errores en `logcat`.
- No hizo falta Android Studio: basta el JDK y las herramientas de línea de
  comandos.

**iOS: sin compilar.** Necesita **Xcode completo** (~15 GB, desde la App
Store con tu Apple ID; las Command Line Tools no bastan). No se ha podido
instalar, así que el binario de iOS **no se ha compilado ni ejecutado
nunca** y dar por hecho que arranca sería inventar. El proyecto `ios/` está
generado y con sus iconos, pero sin verificar.

**Publicar** —firmar, subir y pasar revisión— sigue pendiente en ambas, y
depende de lo del bloque anterior, no del código.

---

## Instalar las herramientas

### Android — receta comprobada

Sin Android Studio y sin `sudo`. Esto es exactamente lo que se ejecutó para
producir el APK verificado:

```bash
brew install openjdk@21
brew install --cask android-commandlinetools

export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME="$HOME/Library/Android/sdk"
mkdir -p "$ANDROID_HOME"

yes | sdkmanager --sdk_root="$ANDROID_HOME" --licenses
sdkmanager --sdk_root="$ANDROID_HOME" \
  "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

`android-36` y `build-tools;36.0.0` salen de `compileSdkVersion` en
`android/variables.gradle`: si esa versión cambia, hay que instalar la nueva.

Para probar en un emulador, además:

```bash
sdkmanager --sdk_root="$ANDROID_HOME" \
  "emulator" "system-images;android-36;google_apis;arm64-v8a" "cmdline-tools;latest"

# El avdmanager que instala Homebrew usa OTRA raíz de SDK y no encuentra las
# imágenes; hay que llamar al que queda dentro de $ANDROID_HOME.
"$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd \
  -n banana-test -k "system-images;android-36;google_apis;arm64-v8a"
```

### iOS

| Herramienta | Cómo |
|---|---|
| Xcode completo | App Store, ~15 GB. Las Command Line Tools **no** bastan. Después: `sudo xcode-select -s /Applications/Xcode.app` |

Capacitor 8 usa Swift Package Manager, así que **CocoaPods ya no hace falta**.

---

## Compilar y abrir

Con los IDE instalados:

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

Sin Android Studio, el APK se genera y se prueba así (comprobado):

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export ANDROID_HOME="$HOME/Library/Android/sdk"

npm run app:sync
(cd android && ./gradlew assembleDebug)
# → android/app/build/outputs/apk/debug/app-debug.apk

"$ANDROID_HOME/platform-tools/adb" install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Con un móvil Android conectado y la depuración USB activada, ese `adb
install` ya deja la app en el dispositivo: es la forma más rápida de
enseñarla sin pasar por Google Play.

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
