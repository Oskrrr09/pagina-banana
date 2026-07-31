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
    // El contenido no se mete bajo la barra de estado ni bajo el indicador de
    // inicio; la web no está diseñada para dibujar detrás de ellos.
    contentInset: 'always',
  },
}

export default config
