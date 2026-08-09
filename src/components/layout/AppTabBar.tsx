import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useT, type ClaveTexto } from '../../lib/i18n'
import { seccionActiva } from '../../lib/appSections'

/**
 * Barra de navegación inferior de la aplicación nativa.
 *
 * Solo se monta dentro del binario (ver `src/lib/nativeApp.ts`). Quien
 * descarga una app de una tienda espera el pulgar en la parte de abajo y las
 * secciones principales siempre a la vista.
 *
 * CUATRO DESTINOS, Y POR QUÉ ESTOS
 *
 * Inicio es mi relación con Banana. Tienda es lo que puedo comprar. Mis
 * compras es lo que ya compré, con la postventa que le corresponde. Cuenta es
 * quién soy y mis ajustes. Cada pestaña responde a una pregunta distinta, y
 * ninguna de las cuatro se solapa con otra.
 *
 * Se llama **«Mis compras»** y no «Productos» ni «Dispositivos» a propósito:
 * «Productos» se lee como catálogo —justo lo que hay en la pestaña de al
 * lado— y «Dispositivos» como una categoría de la tienda. Lo que hay dentro no
 * es un catálogo: es lo que ya te pertenece, y el rótulo tiene que decirlo sin
 * que haga falta entrar.
 *
 * QUÉ SALIÓ, Y ADÓNDE
 *
 * - **Carrito** sube a la barra superior con su contador, donde se ve en todas
 *   las pantallas en vez de sólo al mirar hacia abajo.
 * - **Explorar** desaparece: era una pestaña que no navegaba, abría un
 *   diálogo. Las categorías viven dentro de Tienda, que sí es un destino.
 * - **Favoritos** se llega desde Tienda, desde Cuenta y desde el corazón de
 *   cada ficha, que ya existía. Es una lista de deseos: se consulta al
 *   comprar, no al abrir la aplicación.
 *
 * Soporte **no** tiene pestaña. Es de urgencia altísima y frecuencia bajísima:
 * ocuparía un cuarto de la barra el 99 % del tiempo. Se llega desde el
 * producto, desde Inicio y desde Cuenta, que es donde nace la necesidad.
 */
export function AppTabBar() {
  const { session } = useCustomerAuth()
  const { pathname } = useLocation()

  const activa = seccionActiva(pathname)
  const cuentaTo = session ? '/cuenta' : '/login'

  return (
    <nav
      aria-label="Navegación principal"
      data-app-tab-bar
      // `env(safe-area-inset-bottom)` deja sitio al indicador de inicio del
      // iPhone y a la barra de gestos de Android. En un navegador normal
      // vale cero, así que no estorba.
      //
      // No es `fixed`: es el último hermano de la columna que ocupa la
      // pantalla. Ver el comentario de `AppTopBar`.
      // La altura sale de la constante, no de la suma de sus paddings: así
      // el hueco que dejan otros elementos y lo que la barra ocupa de verdad
      // son el mismo número por construcción.
      style={{ minHeight: ALTURA_TAB_BAR }}
      // Azul Banana, el mismo de la barra utilitaria de la web. La franja se
      // corta con el área segura para que no quede un bloque de color
      // desproporcionado en los móviles con indicador de inicio.
      className="z-50 shrink-0 bg-azul pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        <Tab to="/" icon="home" clave="appnav.home" activa={activa === 'inicio'} />
        <Tab to="/tienda" icon="store" clave="appnav.store" activa={activa === 'tienda'} />
        <Tab to="/mis-productos" icon="package" clave="appnav.purchases" activa={activa === 'compras'} />
        <Tab to={cuentaTo} icon="user" clave="appnav.account" activa={activa === 'cuenta'} />
      </ul>
    </nav>
  )
}

/**
 * Una pestaña.
 *
 * Las cuatro son enlaces: ya no hay ninguna que abra un diálogo, así que
 * tampoco hace falta la variante de botón que existía para «Explorar».
 */
function Tab({ to, icon, clave, activa }: { to: string; icon: string; clave: ClaveTexto; activa: boolean }) {
  const t = useT()
  const etiqueta = t(clave)

  return (
    <li className="flex-1">
      <Link
        to={to}
        aria-current={activa ? 'page' : undefined}
        data-tab={clave}
        className="flex w-full flex-col items-center gap-0.5 px-0.5 pb-1.5 pt-2"
      >
        {/* La pestaña activa no se distingue sólo por el color: la píldora
            amarilla cambia también la FORMA, y el rótulo pasa a negrita. Quien
            no distinga el amarillo del azul sigue viendo dónde está. */}
        <span
          className={`relative grid h-7 w-12 place-items-center rounded-full transition-colors ${
            activa ? 'bg-brand text-ink' : 'text-[color:var(--color-azul-claro)]'
          }`}
        >
          <Icon name={icon} size={20} aria-hidden="true" />
        </span>
        {/* `Mis compras` es la etiqueta más larga y tiene que caber entera a
            320 px: con cuatro pestañas cada una dispone de 80 px, y a 11 px
            con el interletrado apretado sobra sitio. Se deja en una línea
            —`whitespace-nowrap`— para que no se parta en dos y descuadre la
            altura de la barra respecto a las demás. */}
        <span
          className={`whitespace-nowrap text-[11px] leading-tight tracking-tight ${
            activa ? 'font-bold text-white' : 'font-medium text-[color:var(--color-azul-claro)]'
          }`}
        >
          {etiqueta}
        </span>
      </Link>
    </li>
  )
}

/**
 * Altura que ocupa la barra, área segura del dispositivo incluida.
 *
 * Es la ÚNICA fuente: la propia barra se dimensiona con ella —ver el
 * `minHeight` de su `<nav>`— y quien tenga que apartarse por abajo la usa
 * también. Antes este valor era un literal escrito aparte que se parecía a la
 * altura real por casualidad: la barra medía 58,75 px por sus paddings y su
 * icono, y la constante decía 64. Nada fallaba a la vista, pero cualquier
 * cambio de padding habría separado las dos cifras sin que nadie se enterara.
 */
export const ALTURA_TAB_BAR = 'calc(4rem + env(safe-area-inset-bottom))'
