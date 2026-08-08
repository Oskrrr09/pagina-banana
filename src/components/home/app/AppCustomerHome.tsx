import { Link } from 'react-router-dom'
import { Icon } from '../../ui/Icon'
import { useCustomerAuth } from '../../../lib/customerAuth'
import { useStorePreference } from '../../../lib/storePreference'
import { useT } from '../../../lib/i18n'
import { openChat } from '../../../lib/chatLauncher'

/**
 * Inicio de la aplicación nativa: **mi relación con Banana**.
 *
 * NO es la portada comercial. Esa vive ahora en `/tienda` y sigue siendo la de
 * la PR #39, entera. Aquí sólo hay accesos a cosas que son del cliente: sus
 * compras, sus pedidos, el soporte y su tienda.
 *
 * Y no es tampoco la Inicio definitiva. Es deliberadamente corta porque los
 * datos que la harían rica —factura, garantía, estado de un pedido en curso,
 * reparaciones— **todavía no existen**. Una portada llena de tarjetas vacías o
 * de cifras inventadas se lee como un producto terminado que no cumple; una
 * corta y honesta se lee como lo que es, un punto de partida.
 *
 * Por eso aquí no hay ni una cifra: sólo destinos reales.
 */
export function AppCustomerHome() {
  const { session, cliente } = useCustomerAuth()
  const t = useT()

  return (
    <div className="px-4 pb-10 pt-5">
      {session ? <SaludoCliente nombre={cliente?.nombre ?? null} /> : <SaludoVisitante />}

      <nav aria-label="Tu Banana" className="mt-6">
        <ul className="grid gap-3">
          <li>
            <Acceso
              to="/mis-productos"
              icono="package"
              titulo={t('purchases.title')}
              detalle={t('purchases.subtitle')}
            />
          </li>
          {session && (
            <li>
              {/* Al apartado, no a la cuenta a secas: `/cuenta` abre «Datos
                  personales», y un acceso que dice «Mis pedidos» y enseña otra
                  cosa es peor que no tenerlo. */}
              <Acceso
                to="/cuenta?apartado=pedidos"
                icono="truck"
                titulo="Mis pedidos"
                detalle="Pedidos y reservas de tu cuenta"
              />
            </li>
          )}
          <li>
            <Acceso to="/soporte" icono="chat" titulo="Soporte" detalle="Ayuda, guías y servicio técnico" />
          </li>
          <li>
            {/* El chat vivía en el menú de «Explorar», que ha desaparecido de
                la barra. Sin esto se quedaría sin ninguna puerta dentro de la
                app: el botón flotante no se pinta en el binario a propósito.
                No es un rediseño del chat — es su acceso, donde ahora toca. */}
            <AccesoBoton
              icono="chat"
              titulo="Chatea con Bananito"
              detalle="Te respondemos en el momento"
              onClick={openChat}
            />
          </li>
        </ul>
      </nav>

      <TuTienda />

      {/* La tienda no desaparece de Inicio: se ofrece como destino, no como
          escaparate. Quien quiera comprar tiene su pestaña. */}
      <Link
        to="/tienda"
        className="mt-6 flex min-h-14 items-center justify-between rounded-[16px] bg-brand px-5 font-bold text-ink"
      >
        {t('appnav.store')}
        <Icon name="arrow-right" size={20} aria-hidden="true" />
      </Link>
    </div>
  )
}

function SaludoCliente({ nombre }: { nombre: string | null }) {
  // Sólo se saluda por el nombre si lo hay. Un «Hola, null» o un «Hola,
  // cliente» es peor que un hola a secas.
  const primerNombre = nombre?.trim().split(/\s+/)[0]

  return (
    <header className="flex items-start justify-between gap-4">
      <h1 className="min-w-0 text-2xl font-extrabold text-ink">{primerNombre ? `Hola, ${primerNombre}` : 'Hola'}</h1>
      <Link
        to="/cuenta"
        aria-label="Tu cuenta"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral text-ink"
      >
        <Icon name="user" size={20} aria-hidden="true" />
      </Link>
    </header>
  )
}

function SaludoVisitante() {
  return (
    <header>
      <h1 className="text-2xl font-extrabold text-ink">Hola</h1>
      <p className="mt-1 text-sm text-muted">
        Identifícate y tendrás aquí tus compras, tus pedidos y el soporte de cada producto.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-white"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/registro"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-semibold text-ink"
        >
          Crear cuenta
        </Link>
      </div>
    </header>
  )
}

/** La tienda favorita si la hay; si no, la invitación a elegirla. */
function TuTienda() {
  const { favoriteStore } = useStorePreference()

  if (!favoriteStore) {
    return (
      <Link to="/tiendas" className="mt-6 flex items-center gap-3 rounded-[16px] border border-line bg-surface p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-neutral text-ink">
          <Icon name="store" size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">Elige tu tienda</span>
          <span className="block text-sm text-muted">Para tenerla siempre a mano</span>
        </span>
        <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
      </Link>
    )
  }

  return (
    <section aria-labelledby="inicio-tu-tienda" className="mt-6 rounded-[16px] border border-line bg-surface p-4">
      <h2 id="inicio-tu-tienda" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
        Tu tienda
      </h2>
      <p className="mt-1 font-semibold text-ink">{favoriteStore.name}</p>
      <p className="text-sm text-muted">{favoriteStore.address}</p>
      <Link
        to={`/tiendas/${favoriteStore.slug}`}
        className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink"
      >
        Ver la tienda
        <Icon name="chevron-right" size={16} aria-hidden="true" />
      </Link>
    </section>
  )
}

const CLASES_ACCESO =
  'flex w-full min-h-14 items-center gap-3 rounded-[16px] border border-line bg-surface p-4 text-left'

function Contenido({ icono, titulo, detalle }: { icono: string; titulo: string; detalle: string }) {
  return (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-neutral text-ink">
        <Icon name={icono} size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{titulo}</span>
        <span className="block text-sm text-muted">{detalle}</span>
      </span>
      <Icon name="chevron-right" size={18} aria-hidden="true" className="shrink-0 text-muted" />
    </>
  )
}

function Acceso({ to, icono, titulo, detalle }: { to: string; icono: string; titulo: string; detalle: string }) {
  return (
    <Link to={to} className={CLASES_ACCESO}>
      <Contenido icono={icono} titulo={titulo} detalle={detalle} />
    </Link>
  )
}

/**
 * El mismo acceso, pero como botón.
 *
 * Un enlace que no navega miente al lector de pantalla y al menú contextual del
 * navegador: el chat abre un diálogo, así que es un botón.
 */
function AccesoBoton({
  icono,
  titulo,
  detalle,
  onClick,
}: {
  icono: string
  titulo: string
  detalle: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={CLASES_ACCESO}>
      <Contenido icono={icono} titulo={titulo} detalle={detalle} />
    </button>
  )
}
