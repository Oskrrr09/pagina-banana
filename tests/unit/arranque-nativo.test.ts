import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import config from '../../capacitor.config'

// ============================================================================
// El WebView de la app nativa arranca con el amarillo de la interfaz.
//
// POR QUÉ EXISTE ESTA PRUEBA
//
// Sin `ios.backgroundColor`, el `WKWebView` usa el fondo del sistema y se veían
// ~700 ms de blanco entre el fundido de apertura y el primer pintado del
// documento. Se midió en el simulador pintando cada capa de un color imposible:
// ni la barra de estado, ni la ventana, ni el `UIViewController` cambiaban ese
// tramo; el `WKWebView` sí.
//
// Lo que sigue a ese tramo es la cabecera de Inicio, que es `--color-banana`.
// Si los dos valores se separan, aparece un escalón de color justo en la
// entrada de la aplicación, y es de las cosas que nadie nota revisando código.
//
// LO QUE ESTA PRUEBA **NO** DEMUESTRA
//
// Que iOS lo dibuje, cuánto dura, ni nada del `LaunchScreen`: todo eso ocurre
// antes del documento y no hay navegador que lo vea. Esto fija la
// configuración declarada; lo demás se comprueba en el simulador.
// ============================================================================

const raiz = join(import.meta.dirname, '..', '..')

/** El amarillo de marca, leído de la hoja de estilos y no copiado a mano. */
function bananaDeCss(): string {
  const css = readFileSync(join(raiz, 'src', 'index.css'), 'utf8')
  const match = css.match(/--color-banana:\s*(#[0-9a-fA-F]{6})/)
  if (!match) throw new Error('no se encontró `--color-banana` en src/index.css')
  return match[1].toLowerCase()
}

describe('arranque de la app nativa', () => {
  it('el WebView de iOS declara un color de fondo', () => {
    expect(
      config.ios?.backgroundColor,
      'sin esto el WebView arranca con el fondo del sistema y se ve blanco',
    ).toBeDefined()
  })

  it('ese color es el mismo amarillo que la interfaz', () => {
    expect(
      config.ios?.backgroundColor?.toLowerCase(),
      'el fondo del WebView y `--color-banana` tienen que ir juntos: lo que se ve después es la cabecera de Inicio',
    ).toBe(bananaDeCss())
  })

  it('el WebView sigue llegando al borde de la pantalla', () => {
    // No es decoración: con `always` el inset lo reservarían el WebView y el
    // CSS a la vez. Va aquí para que un cambio en el bloque `ios` no se lo
    // lleve por delante de paso.
    expect(config.ios?.contentInset).toBe('never')
  })
})

// ============================================================================
// El documento también nace amarillo, y sólo durante el arranque.
//
// Con el WebView ya amarillo quedaba un fotograma blanco: el documento se
// pintaba con `--color-surface` antes de que React montara. Se resuelve con un
// marcador que pone `index.html` y retira `App`.
//
// Las tres piezas se sostienen entre sí y ninguna sirve sola, así que se
// comprueban juntas: quien quite una tiene que enterarse.
// ============================================================================
describe('bootstrap del documento en la app nativa', () => {
  const html = readFileSync(join(raiz, 'index.html'), 'utf8')
  const css = readFileSync(join(raiz, 'src', 'index.css'), 'utf8')
  const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf8')

  it('index.html marca el documento antes de cargar el bundle', () => {
    const marcador = html.search(/setAttribute\(\s*['"]data-native-boot['"]/)
    const bundle = html.search(/<script[^>]+src=['"][^'"]*main\.tsx['"]/)

    expect(marcador, 'falta el script que marca el arranque nativo').toBeGreaterThan(-1)
    expect(bundle, 'no se encontró la etiqueta del bundle').toBeGreaterThan(-1)
    expect(marcador, 'el marcador tiene que ir ANTES del bundle o llega tarde al primer pintado').toBeLessThan(bundle)
  })

  it('sólo marca dentro del binario nativo', () => {
    // Sin condición, la web también nacería amarilla y con el logotipo encima.
    //
    // No se exige una condición concreta —`window.Capacitor` puede no existir
    // todavía cuando el script corre en el `head`, y por eso también se mira el
    // esquema de la URL—, pero sí que EXISTA y que sea una señal exclusiva del
    // binario empaquetado. Lo que esta prueba impide es marcar sin preguntar.
    const linea = html.match(/^.*setAttribute\(\s*['"]data-native-boot['"].*$/m)
    expect(linea, 'falta el script que marca el arranque nativo').not.toBeNull()

    const condicion = html.match(
      /if\s*\(([^)]*(?:\([^)]*\))?[^)]*)\)\s*\n?\s*document\.documentElement\.setAttribute\(\s*['"]data-native-boot['"]/,
    )
    expect(condicion, 'el marcador se pone sin condición: la web nacería amarilla').not.toBeNull()
    expect(condicion![1], 'la condición tiene que mirar una señal exclusiva de la app empaquetada').toMatch(
      /window\.Capacitor|capacitor:|ionic:/,
    )
  })

  it('la superficie de arranque usa el amarillo de marca', () => {
    const regla = css.match(/html\[data-native-boot\][\s\S]*?\{([\s\S]*?)\}/)
    expect(regla, 'falta la regla de `data-native-boot` en src/index.css').not.toBeNull()
    expect(
      regla![1],
      'el arranque tiene que pintarse con `--color-banana`: con la superficie clara vuelve el fotograma blanco',
    ).toMatch(/background-color:\s*var\(--color-banana\)/)
  })

  it('App retira el marcador dentro de un efecto de montaje', () => {
    // OJO CON LO QUE SE COMPRUEBA AQUÍ, Y POR QUÉ NO BASTA MENOS.
    //
    // Buscar sólo `removeAttribute('data-native-boot')` en el fichero daría
    // verde con esto, que es justo lo que NO queremos:
    //
    //   export function App() {
    //     document.documentElement.removeAttribute('data-native-boot')
    //     useEffect(() => {}, [])
    //
    // Ahí se retiraría durante el render, antes de que el primer árbol haya
    // pintado, y el fotograma blanco volvería. Así que se exigen las cuatro
    // cosas a la vez: `useEffect`, su callback, la retirada DENTRO de ese
    // callback, y el array de dependencias vacío para que sea el montaje y no
    // cada render.
    //
    // Tolera espacios, saltos y comentarios; no fija el formato.
    const efectoDeMontaje =
      /useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?removeAttribute\(\s*['"]data-native-boot['"]\s*\)[\s\S]*?\}\s*,\s*\[\s*\]\s*\)/

    expect(
      app,
      'la retirada tiene que vivir dentro de `useEffect(() => { … }, [])`: en el cuerpo del render se ejecutaría antes del primer pintado',
    ).toMatch(efectoDeMontaje)
  })
})

// ============================================================================
// La pantalla de arranque nativa se retiene, y por eso alguien tiene que
// retirarla.
//
// Entre que iOS quita la pantalla de arranque y el documento pinta, el WebView
// enseñaba su color de fondo: amarillo, pero sin logotipo. Reteniéndola hasta
// que React monta, el rótulo está desde que se abre la app hasta que la Home
// está pintada.
//
// El precio de retenerla es que ya NO se va sola: si la llamada que la oculta
// desapareciera, la app se quedaría clavada en la pantalla amarilla para
// siempre. Las dos mitades del trato se comprueban juntas.
// ============================================================================
describe('pantalla de arranque nativa', () => {
  const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf8')

  it('no se oculta sola', () => {
    expect(
      config.plugins?.SplashScreen?.launchAutoHide,
      'con el ocultado automático, la pantalla se va antes de que el documento pinte y reaparece el amarillo sin logotipo',
    ).toBe(false)
  })

  it('arranca con el mismo amarillo que el WebView', () => {
    expect(config.plugins?.SplashScreen?.backgroundColor?.toLowerCase()).toBe(bananaDeCss())
  })

  it('App la oculta al montar, o la app se queda clavada', () => {
    expect(
      app,
      'nadie oculta la pantalla de arranque: con `launchAutoHide: false` eso deja la app en amarillo para siempre',
    ).toMatch(/SplashScreen\.hide\(\)/)

    // Y el plugin se carga en diferido: importarlo arriba mete
    // `@capacitor/core` en el bundle de la web, que define `window.Capacitor`
    // en el navegador y deja a la web sin service worker.
    expect(
      app,
      'el plugin no puede importarse de forma estática: define `window.Capacitor` también en la web',
    ).not.toMatch(/^import\s.*@capacitor\/splash-screen/m)
    expect(app, 'la carga del plugin tiene que ir en diferido').toMatch(/import\(\s*'@capacitor\/splash-screen'\s*\)/)

    // Y en el mismo efecto de montaje que retira el marcador: separarlos
    // devuelve el parpadeo que se estaba corrigiendo.
    const juntas =
      /useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?removeAttribute\(\s*['"]data-native-boot['"]\s*\)[\s\S]*?SplashScreen\.hide\(\)[\s\S]*?\}\s*,\s*\[\s*\]\s*\)/
    expect(app, 'la pantalla nativa y el marcador del documento tienen que retirarse en el mismo punto').toMatch(juntas)
  })
})
