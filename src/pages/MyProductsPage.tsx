import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { useCustomerAuth } from '../lib/customerAuth'
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
// Se entra desde «Mi cuenta» mientras la navegación de la app no cambie. Y va
// en castellano como el resto del área de cuenta, que todavía no está
// traducida; cuando esta pantalla salga a la barra inferior y deje de ser un
// rincón de la cuenta, entra en el barrido de idiomas con las demás.

export function MyProductsPage() {
  const { session, loading } = useCustomerAuth()
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
        <h1 className="text-2xl font-bold text-ink">Mis productos</h1>
        <p className="mt-2 text-muted">Tus productos necesitan Supabase configurado en este entorno.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Volver a la portada
        </Link>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="text-muted">Cargando tus productos…</p>
      </Container>
    )
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fmis-productos" replace />
  }

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-bold text-ink">Mis productos</h1>
      <p className="mt-1 text-sm text-muted">Productos de tus compras en Banana</p>

      {estado === 'cargando' && <p className="mt-8 text-sm text-muted">Cargando…</p>}
      {estado === 'error' && <p className="mt-8 text-sm text-danger">No se pudieron cargar tus productos.</p>}

      {estado === 'listo' && productos.length === 0 && <SinProductos />}

      {estado === 'listo' && productos.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((producto) => (
            <li key={producto.clave}>
              <TarjetaProducto producto={producto} />
            </li>
          ))}
        </ul>
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
  return (
    <div className="mt-8 rounded-[16px] border border-line bg-neutral p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface text-muted">
        <Icon name="package" size={24} aria-hidden="true" />
      </span>
      <p className="mt-4 font-semibold text-ink">Todavía no hay productos que enseñar</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        Aquí aparecerán los productos que compres en Banana con la sesión iniciada.
      </p>
      <Link
        to="/iphone"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-ink"
      >
        Ver el catálogo
      </Link>
    </div>
  )
}

function TarjetaProducto({ producto }: { producto: ProductoComprado }) {
  const fecha = new Date(producto.compradoEn).toLocaleDateString('es-ES', {
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
        Comprado el {fecha}
        {producto.cantidad > 1 && <> · {producto.cantidad} unidades</>}
      </p>
      <p className="mt-0.5 font-mono text-xs text-muted">Pedido {producto.pedidoId}</p>

      <div className="mt-auto pt-4">
        {/* Con la variante resuelta se abre esa; si el catálogo ya no la tiene,
            se abre la ficha del modelo. Nunca otra variante: sería un enlace
            que funciona hacia un producto que no es el que se compró. */}
        <Link
          to={producto.ruta}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-ink hover:underline"
        >
          Ver producto
          <Icon name="chevron-right" size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
