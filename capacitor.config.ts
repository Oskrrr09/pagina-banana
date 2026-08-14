import type { CapacitorConfig } from '@capacitor/cli'

// Aplicación nativa de la TIENDA para App Store y Google Play.
//
// Envuelve exactamente el mismo build de React que se publica en GitHub Pages;
// no hay una segunda versión del código que mantener. La única diferencia es la
// base de las rutas: en Pages la web cuelga de `/pagina-banana/`, y dentro del
// binario los ficheros están en la raíz. De ahí `npm run build:app`, que
// construye a `dist-app/` con `--base=/`.
//
// El panel de agentes NO va aquí: se instala como PWA desde el navegador
// (ver src/lib/pwa.ts y docs/02-decisiones.md).
//
// PENDIENTE DE CONFIRMAR CON BANANA: `appId` es el identificador del paquete y
// es PERMANENTE una vez publicada la app; no se puede cambiar sin publicar una
// aplicación distinta. Debe acordarse con Banana y crearse bajo SU cuenta de
// desarrollador, no bajo una personal.
const config: CapacitorConfig = {
  appId: 'com.bananacomputer.tienda',
  appName: 'Banana Computer',
  webDir: 'dist-app',
  server: {
    // Android sirve el contenido por https://localhost en vez de file://.
    // Hace falta para que Supabase Auth funcione: el almacenamiento de sesión
    // y las peticiones con credenciales necesitan un origen seguro.
    androidScheme: 'https',
  },
  ios: {
    // El WebView llega al borde de la pantalla y es el CSS quien reserva el
    // hueco de la barra de estado, con `env(safe-area-inset-top)`.
    //
    // Con `contentInset: 'always'` lo reservaban LOS DOS: el WebView bajaba
    // el contenido y el CSS volvía a bajarlo, así que quedaba una franja
    // blanca del fondo nativo y otra amarilla de más sobre el buscador. Y al
    // dejar de desplazarse el documento (D-046) ese desplazamiento del
    // WebView pasó a ser permanente.
    //
    // Además así el amarillo de la cabecera se pinta por detrás de la barra
    // de estado, que es como debe verse.
    contentInset: 'never',

    // El WebView nace con el amarillo de la interfaz en vez del blanco del
    // sistema.
    //
    // Medido en el simulador: entre el fundido de apertura y el primer pintado
    // del documento se veían ~700 ms de blanco. No era la barra de estado, ni
    // la ventana, ni el `UIViewController`: pintando cada capa de un color
    // imposible, la única que cambiaba ese tramo era el propio `WKWebView`,
    // que sin este ajuste usa el fondo del sistema.
    //
    // Mantener sincronizado con `--color-banana` de `src/index.css`: lo que
    // sigue a este tramo es la cabecera de Inicio, y cualquier diferencia se
    // vería como un escalón. Hay una prueba que lo vigila.
    //
    // OJO: el asset del `LaunchScreen` usa OTRO amarillo, `#FDC200`, que es el
    // del icono oficial. La divergencia viene de antes y no se resuelve aquí.
    backgroundColor: '#ffce1f',
  },
  plugins: {
    // La pantalla de arranque NO se retira sola. Entre que el sistema la
    // quita y que el documento pinta, el WebView enseña su color de fondo:
    // amarillo, sí, pero sin logotipo. Reteniéndola hasta que React monta, el
    // rótulo está desde que se abre la app hasta que la Home está pintada.
    //
    // Quien la retira es `App`, en el mismo sitio donde quita el marcador de
    // arranque del documento. Si esa llamada desapareciera, la pantalla se
    // quedaría fija: hay una prueba que vigila que siga estando.
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#ffce1f',
      showSpinner: false,
    },
  },
}

export default config
