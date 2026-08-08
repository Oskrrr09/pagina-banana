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

// «Mis productos»: lo que el cliente ha comprado, salido de sus pedidos.
//
// PRIMERA VERSIÓN, Y SE NOTA A PROPÓSITO
//
// Sólo lista. Ni factura, ni garantía, ni número de serie, ni IMEI, ni
// AppleCare, ni póliza, ni reparaciones: de nada de eso tenemos dato, y una
// tarjeta que lo insinuara sería una promesa que el respaldo no sostiene.
// Cuando el pedido lleve seguro contratado tampoco se dice aquí — `insured`
// significa que se marcó la casilla en un checkout demostrativo, no que exista
// una cobertura viva.
//
// SE LLAMA «MIS COMPRAS»
//
// La ruta sigue siendo `/mis-productos` a propósito: cambiar la URL sólo para
// que case con el rótulo añadiría riesgo —enlaces, pruebas, historial— a cambio
// de nada que el cliente note. Lo que ve dice «Mis compras»; lo que hay en la
// barra de direcciones da igual.
//
// Ya está traducida a los cinco idiomas: al pasar a la navegación principal
// dejó de ser un rincón del área de cuenta, y con ello venció la deuda de
// idioma que la PR #40 dejó anotada.

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
    <Container className="py-12">
      <h1 className="text-2xl font-bold text-ink">{t('purchases.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('purchases.subtitle')}</p>

      {estado === 'cargando' && <p className="mt-8 text-sm text-muted">{t('purchases.loading')}</p>}
      {estado === 'error' && <p className="mt-8 text-sm text-danger">{t('purchases.error')}</p>}

      {estado === 'listo' && productos.length === 0 && <SinProductos />}

      {estado === 'listo' && productos.length > 0 && (
        <section aria-labelledby="mis-compras-dispositivos" className="mt-8">
          <h2 id="mis-compras-dispositivos" className="text-lg font-bold text-ink">
            {t('purchases.devices')}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
 * Estado vacío.
 *
 * Explica para qué sirve la pantalla en vez de limitarse a decir que está
 * vacía: quien llega aquí sin compras necesita saber qué va a aparecer.
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
      <Link
        to="/tienda"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-ink"
      >
        {t('purchases.empty.cta')}
      </Link>
    </div>
  )
}

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
    <article className="flex h-full flex-col rounded-[16px] border border-line bg-surface p-4">
      <ProductImage
        src={producto.imagen}
        alt={`${producto.nombre}${producto.colorNombre ? ` ${producto.colorNombre}` : ''}`}
        bgColor={producto.color?.imageBg}
        pad={!producto.color?.imageBg}
      />

      <h2 className="mt-3 font-semibold leading-tight text-ink">{producto.nombre}</h2>
      {variante && <p className="mt-0.5 text-sm text-muted">{variante}</p>}

      <p className="mt-2 text-sm text-muted">
        {t('purchases.boughtOn', { fecha })}
        {producto.cantidad > 1 && <> · {t('purchases.units', { total: producto.cantidad })}</>}
      </p>
      <p className="mt-0.5 font-mono text-xs text-muted">{t('purchases.order', { id: producto.pedidoId })}</p>

      <div className="mt-auto pt-4">
        {/* Con la variante resuelta se abre esa; si el catálogo ya no la tiene,
            se abre la ficha del modelo. Nunca otra variante: sería un enlace
            que funciona hacia un producto que no es el que se compró. */}
        <Link
          to={producto.ruta}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-ink hover:underline"
        >
          {t('purchases.viewProduct')}
          <Icon name="chevron-right" size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
