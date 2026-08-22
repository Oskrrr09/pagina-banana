import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { useCustomerAuth } from '../lib/customerAuth'
import { useIdioma, useT } from '../lib/i18n'
import { supabaseEnabled } from '../lib/supabase'
import { listMyOrders } from '../lib/orderSync'
import { productosDeMisPedidos, type ProductoComprado } from '../lib/myProducts'

// «Mis productos»: los dispositivos que aparecen en las compras del cliente.
//
// QUÉ ES ESTO, Y QUÉ NO
//
// Sólo lista. Ni factura, ni garantía, ni número de serie, ni IMEI, ni
// AppleCare, ni póliza, ni reparaciones: de nada de eso tenemos dato, y una
// tarjeta que lo insinuara sería una promesa que el respaldo no sostiene.
// Cuando el pedido lleva seguro marcado tampoco se dice aquí — `insured`
// significa que se pulsó una casilla en un checkout demostrativo, no que exista
// una cobertura viva.
//
// Tampoco es un inventario de aparatos físicos: el modelo de datos llega hasta
// la LÍNEA DE PEDIDO, no hasta la unidad. Ver la cabecera de `lib/myProducts.ts`.
//
// POR QUÉ SE LLAMA «MIS PRODUCTOS» Y NO «MIS COMPRAS»
//
// Se llamaba «Mis compras», y era ambiguo: la pantalla sólo enseña líneas con
// `kind === 'device'`. Quien hubiera comprado únicamente accesorios tenía
// pedidos y veía «Mis compras» vacío, que es exactamente lo contrario de lo que
// había pasado. El rótulo dice ahora lo que la pantalla contiene —productos, es
// decir dispositivos— y la pestaña de la barra dice «Compras», que es el
// territorio. Los accesorios siguen en Mis pedidos, y desde aquí se llega.
//
// La ruta sigue siendo `/mis-productos`: cambiar la URL sólo para que case con
// el rótulo añadiría riesgo —enlaces, pruebas, historial— a cambio de nada que
// el cliente note.

export function MyProductsPage() {
  const { session, loading } = useCustomerAuth()
  const { t, intl } = useIdioma()
  const [productos, setProductos] = useState<ProductoComprado[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')

  const clienteId = session?.user.id

  useEffect(() => {
    if (!clienteId) return
    let vigente = true
    // Sin reiniciar el estado aquí: `clienteId` no cambia mientras la pantalla
    // está montada, y hacerlo encadenaría un render de más. Es el mismo
    // planteamiento que `OrdersSection` en `ProfilePage`.
    listMyOrders(clienteId).then(({ orders, error }) => {
      if (!vigente) return
      if (error) {
        setEstado('error')
        return
      }
      setProductos(productosDeMisPedidos(orders))
      setEstado('listo')
    })
    return () => {
      vigente = false
    }
  }, [clienteId])

  if (!supabaseEnabled) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">{t('purchases.title')}</h1>
        <p className="mt-2 text-muted">{t('purchases.needsSupabase')}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-ink hover:underline">
          {t('purchases.backHome')}
        </Link>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="text-muted">{t('purchases.loading')}</p>
      </Container>
    )
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fmis-productos" replace />
  }

  return (
    <Container className="py-10">
      <Cabecera />

      {/* Carga y error se anuncian: sin `aria-live` un lector de pantalla se
          queda en el título mientras la pantalla cambia por debajo. */}
      <div role="status" aria-live="polite">
        {estado === 'cargando' && <p className="mt-8 text-sm text-muted">{t('purchases.loading')}</p>}
        {estado === 'error' && <p className="mt-8 text-sm text-danger">{t('purchases.error')}</p>}
      </div>

      {estado === 'listo' && productos.length === 0 && <SinProductos />}

      {estado === 'listo' && productos.length > 0 && (
        <section aria-labelledby="mis-productos-dispositivos" className="mt-8">
          <h2 id="mis-productos-dispositivos" className="text-lg font-bold text-ink">
            {t('purchases.devices')}
          </h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {productos.map((producto) => (
              <li key={producto.clave}>
                <TarjetaProducto producto={producto} intl={intl} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  )
}

/**
 * Cabecera de la pantalla.
 *
 * Superficie de cuenta, no de tienda: título, una frase que dice exactamente
 * qué se está mirando, y la salida a Mis pedidos —que es donde están los
 * accesorios, los importes y todas las transacciones—. Ni escaparate, ni
 * recomendaciones, ni ofertas.
 */
function Cabecera() {
  const t = useT()

  return (
    <header>
      <h1 className="text-2xl font-bold text-ink">{t('purchases.title')}</h1>
      <p className="mt-1 max-w-prose text-sm text-muted">{t('purchases.subtitle')}</p>
      <EnlaceAPedidos className="mt-4" />
    </header>
  )
}

/**
 * Acceso a Mis pedidos.
 *
 * A la sección, no a un pedido concreto: `ProfilePage` abre un apartado por
 * `?apartado=`, y no existe hoy ninguna forma estable de señalar UN pedido
 * dentro de la lista. Inventarla aquí sería fabricar un destino que no existe.
 */
function EnlaceAPedidos({ className = '' }: { className?: string }) {
  const t = useT()

  return (
    <Link
      to="/cuenta/pedidos"
      className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-ink/30 ${className}`}
    >
      <Icon name="credit-card" size={16} aria-hidden="true" />
      {t('purchases.orders')}
    </Link>
  )
}

/**
 * Estado vacío.
 *
 * No dice «no has comprado nada», porque puede ser falso: un cliente con
 * pedidos de sólo accesorios llega aquí igual. Dice que no hay DISPOSITIVOS, y
 * ofrece las dos salidas verdaderas: el catálogo y sus pedidos.
 */
function SinProductos() {
  const t = useT()

  return (
    <div className="mt-8 rounded-[16px] border border-line bg-neutral p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface text-muted">
        <Icon name="package" size={24} aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-ink">{t('purchases.empty.title')}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t('purchases.empty.body')}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          to="/tienda"
          className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-ink"
        >
          {t('purchases.empty.cta')}
        </Link>
        <EnlaceAPedidos />
      </div>
    </div>
  )
}

/**
 * Una entrada: esta línea, de esta compra.
 *
 * Es una FILA y no una tarjeta de catálogo. La rejilla vertical que había antes
 * dedicaba una foto cuadrada a ancho completo —unos 310 px a 390 px de
 * pantalla— a un producto que el cliente ya tiene y no está eligiendo. Aquí lo
 * que importa es reconocerlo de un vistazo y saber cuál de sus configuraciones
 * compró, así que la foto es una miniatura y el texto manda.
 */
function TarjetaProducto({ producto, intl }: { producto: ProductoComprado; intl: string }) {
  const t = useT()
  const fecha = new Date(producto.compradoEn).toLocaleDateString(intl, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // La variante se enseña con lo que se guardó al comprar, no con lo que diga
  // hoy el catálogo: es lo que el cliente eligió.
  const variante = [producto.colorNombre, producto.capacidad].filter(Boolean).join(' · ')

  return (
    <article className="flex h-full gap-4 rounded-[16px] border border-line bg-surface p-4">
      <div className="w-20 shrink-0 sm:w-24">
        {producto.imagen ? (
          <ProductImage
            src={producto.imagen}
            alt={`${producto.nombre}${producto.colorNombre ? ` ${producto.colorNombre}` : ''}`}
            bgColor={producto.color?.imageBg}
            pad={!producto.color?.imageBg}
          />
        ) : (
          // SIN FOTO VÁLIDA
          //
          // Pasa cuando el color comprado ya no está en el catálogo y la compra
          // tampoco guardó imagen. Antes quedaba el hueco de `ProductImage` a
          // ancho completo, con el texto alternativo dentro: honesto, pero un
          // bloque gris enorme dominando la fila.
          //
          // Sigue sin haber foto —jamás la de otro color, que sería enseñar un
          // producto que no es el comprado— y ahora además se dice.
          <div
            className="grid aspect-square place-items-center gap-1 rounded-[12px] border border-dashed border-line bg-neutral p-1 text-center"
            title={t('purchases.noPhoto')}
          >
            <Icon name="package" size={20} className="text-muted" aria-hidden="true" />
            <span className="text-[10px] leading-tight text-muted">{t('purchases.noPhoto')}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-tight text-ink">{producto.nombre}</h3>
        {variante && <p className="mt-0.5 text-sm text-muted">{variante}</p>}

        <p className="mt-2 text-sm text-muted">
          {t('purchases.boughtOn', { fecha })}
          {producto.cantidad > 1 && <> · {t('purchases.units', { total: producto.cantidad })}</>}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">{t('purchases.order', { id: producto.pedidoId })}</p>

        <div className="mt-auto pt-3">
          {/* Con la variante resuelta se abre esa; si el catálogo ya no la tiene,
              se abre la ficha del modelo. Nunca otra variante: sería un enlace
              que funciona hacia un producto que no es el que se compró. */}
          <Link
            to={producto.ruta}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink hover:underline"
          >
            {t('purchases.viewProduct')}
            <Icon name="chevron-right" size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
