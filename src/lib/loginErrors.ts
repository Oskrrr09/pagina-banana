/**
 * Qué se le puede contar a quien no ha podido entrar.
 *
 * A62-07: las dos pantallas de acceso traducían un único error —el de
 * credenciales— y para cualquier otro hacían `setError(signInError)`, es decir,
 * pintaban lo que devolvía el SDK. Con la red caída eso era `Failed to fetch`;
 * ante un error de servidor, el objeto serializado, `{}`.
 *
 * La frontera se pone aquí, en una función pura y compartida, y no en cada
 * pantalla: dos mapeos separados vuelven a divergir en cuanto uno de los dos
 * añade un caso. Las capas de auth siguen devolviendo el mensaje técnico
 * —quien depure lo necesita—; lo que no puede es llegar al DOM.
 *
 * Sólo hay dos categorías porque sólo hay dos cosas distintas que hacer: si las
 * credenciales están mal, el remedio es reescribirlas; en cualquier otro caso
 * —red, servidor, GoTrue, algo desconocido— el remedio es reintentar, y el
 * detalle técnico no le sirve de nada a quien lee.
 */
export type ErrorInicioSesion = 'credenciales' | 'generico'

/** Lo que GoTrue devuelve cuando el email o la contraseña no cuadran. */
const CREDENCIALES = 'Invalid login credentials'

export function clasificarErrorInicioSesion(mensaje: unknown): ErrorInicioSesion {
  return mensaje === CREDENCIALES ? 'credenciales' : 'generico'
}
