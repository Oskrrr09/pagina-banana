import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { useCustomerAuth } from '../../lib/customerAuth'
import { describeStatus } from '../../lib/educationalDiscount'
import { rutaDeApartado } from './apartados'

// La raíz de «Cuenta» dentro de la aplicación.
//
// QUÉ SUSTITUYE, Y POR QUÉ
//
// Antes esta pantalla montaba un carril horizontal con los siete apartados.
// Medido sobre `main`: el carril ocupaba 1104 px dentro de una caja de 280 px a
// 320 y de 350 px a 390, así que quedaban 824 y 754 px fuera de la vista. En
// cinco de las siete pantallas a 320 px lo ÚNICO visible del menú era el
// apartado en el que ya estabas: el menú confirmaba dónde estás y escondía a
// dónde puedes ir. Arrastrado hasta el final dejaba «uento educativo», un
// fragmento de palabra, y ningún indicador de activo.
//
// No estaba roto —cero desbordamiento del documento, objetivos de 44 px—: era
// un problema de DESCUBRIBILIDAD. Una lista vertical enseña las ocho entradas
// con el gesto que ya se usa para leer, y cada una abre su pantalla.
//
// La web conserva su columna, que a 1440 px sí enseña los siete a la vez.

/** Un grupo de filas: encabezado discreto y una sola superficie. */
function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">{titulo}</h2>
      {/* Una superficie por grupo, con divisores dentro. Siete tarjetas
          independientes con su sombra convertirían la pantalla en un tablero;
          esto es una lista. */}
      <div className="overflow-hidden rounded-[16px] border border-line bg-surface">{children}</div>
    </section>
  )
}

/**
 * Una fila de la lista.
 *
 * 56 px de alto —por encima de los 44 de objetivo táctil— porque una lista de
 * ajustes se recorre con el pulgar y se toca sin mirar. El subtexto sólo
 * aparece cuando dice algo que no está ya en el rótulo.
 */
function Fila({ to, titulo, subtexto, ultima }: { to: string; titulo: string; subtexto?: string; ultima?: boolean }) {
  return (
    <Link
      to={to}
      className={
        'flex min-h-14 w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral active:bg-neutral ' +
        (ultima ? '' : 'border-b border-line')
      }
    >
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-ink">{titulo}</span>
        {subtexto && <span className="mt-0.5 block text-sm text-muted">{subtexto}</span>}
      </span>
      <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
    </Link>
  )
}

export function AccountRootNative({
  email,
  nombre,
  cerrandoSesion,
  errorCierre,
  onCerrarSesion,
}: {
  email: string
  nombre: string | null
  cerrandoSesion: boolean
  errorCierre: string | null
  onCerrarSesion: () => void
}) {
  const { favorites } = useStore()
  const { favoriteStore } = useStorePreference()
  const { cliente } = useCustomerAuth()

  // El recuento, también en cero: «0 productos» ocupa una línea y mantiene las
  // tres filas de este grupo a la misma altura, mientras que «Todavía no has
  // guardado ninguno» envolvía a dos a 320 px y dejaba la fila 20 px más alta
  // que sus vecinas.
  const favoritosSubtexto = `${favorites.length} producto${favorites.length === 1 ? '' : 's'}`

  return (
    <Container className="py-6">
      {/* IDENTIDAD, SIN INVENTARSE NADA
          Sin avatar y sin iniciales derivadas del correo: no tenemos ese dato y
          fabricarlo sería decorar con una suposición. Si no hay nombre, el
          encabezado es «Mi cuenta», que es cierto siempre.

          El `<h1>` existe aunque no sea tipográficamente enorme: lo que ordena
          la pantalla es la jerarquía, no el tamaño. */}
      <h1 className="text-xl font-bold text-ink">{nombre || 'Mi cuenta'}</h1>
      <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{email}</p>
      {/* El aviso deja de ser una caja gris con borde que competía con el
          contenido: sigue diciendo lo mismo, en el tono de una nota al pie. */}
      <p className="mt-2 text-xs text-muted">
        <strong className="font-semibold text-ink">Cuenta de demostración.</strong> Los pedidos, reservas y descuentos
        son de ejemplo: no se cobra ni se envía nada.
      </p>

      <Grupo titulo="Actividad">
        <Fila to={rutaDeApartado('pedidos')} titulo="Mis pedidos" />
        <Fila to={rutaDeApartado('reservas')} titulo="Mis reservas" ultima />
      </Grupo>

      <Grupo titulo="Mis datos">
        <Fila to={rutaDeApartado('datos')} titulo="Datos personales" />
        <Fila to={rutaDeApartado('envio')} titulo="Dirección de envío" />
        <Fila to={rutaDeApartado('facturacion')} titulo="Dirección de facturación" ultima />
      </Grupo>

      {/* Favoritos y Tienda habitual van DIRECTOS a sus pantallas.
          `/cuenta/favoritos` sigue existiendo —hay enlaces antiguos y la web lo
          usa—, pero como fila de esta lista sería una pantalla intermedia cuyo
          único contenido son otros dos enlaces.

          Los subtextos salen de estado que YA está en memoria: `useStore` y
          `useStorePreference`. No se pide nada al servidor para decorar una
          lista; por eso pedidos y reservas no llevan contador. */}
      <Grupo titulo="Preferencias">
        <Fila to="/favoritos" titulo="Favoritos" subtexto={favoritosSubtexto} />
        <Fila
          to="/tiendas"
          titulo="Tienda habitual"
          subtexto={favoriteStore ? favoriteStore.name : 'No has elegido ninguna'}
        />
        <Fila
          to={rutaDeApartado('descuento')}
          titulo="Descuento educativo"
          subtexto={describeStatus(cliente?.descuento_educativo_estado ?? null)}
          ultima
        />
      </Grupo>

      {/* Al final y separado: cerrar sesión no es una sección más, y arriba
          competía con todo lo demás por ser lo primero que se veía. */}
      <div className="mt-8">
        <Button variant="secondary" className="w-full" disabled={cerrandoSesion} onClick={onCerrarSesion}>
          {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </Button>
        {errorCierre && (
          <p role="alert" className="mt-3 rounded-[12px] border border-line bg-neutral px-4 py-3 text-sm text-ink">
            No se ha podido cerrar la sesión: {errorCierre}. Sigues dentro de tu cuenta; inténtalo de nuevo.
          </p>
        )}
      </div>
    </Container>
  )
}
