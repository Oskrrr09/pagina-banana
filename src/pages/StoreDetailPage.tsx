import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Button } from '../components/ui/Button'
import { getStore, UNIVERSAL_SERVICES } from '../data/stores'
import { allModels } from '../data/products'
import { NotFound } from './NotFound'

const TODAY = new Date().toLocaleDateString('es-ES', { weekday: 'long' })

// Ficha de una tienda (§4.14).
export function StoreDetailPage() {
  const { slug } = useParams()
  const store = getStore(slug ?? '')
  const [product, setProduct] = useState('')

  if (!store) return <NotFound />

  const today = TODAY.charAt(0).toUpperCase() + TODAY.slice(1)
  // Todos los servicios de la tienda: los comunes + los propios (p. ej. técnico).
  const services = [...UNIVERSAL_SERVICES, ...store.services]

  return (
    <Container className="py-8">
      {/* 1 — Cabecera de tienda */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Placeholder label={store.name} ratio="4 / 3" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-ink">{store.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                store.openNow ? 'bg-available-050 text-available' : 'bg-neutral text-muted'
              }`}
            >
              {store.openNow ? 'Abierta ahora' : 'Cerrada ahora'}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-muted">
            <Icon name="map-pin" size={16} /> {store.address}
          </p>

          {/* 4 — Cómo llegar / reservar */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Button>
              <Icon name="map-pin" size={18} /> Cómo llegar
            </Button>
            <Button variant="secondary">Reservar cita</Button>
          </div>

          {/* 3 — Servicios disponibles */}
          <div className="mt-6">
            <p className="mb-2 font-semibold text-ink">Servicios disponibles</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-ink">
                  <Icon name="check" size={16} className="text-available" /> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* 2 — Horario */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
            <Icon name="clock" size={18} /> Horario
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {store.hours.map((h) => {
                const isToday = h.day === today
                return (
                  <tr key={h.day} className={`border-b border-line ${isToday ? 'font-semibold text-ink' : 'text-ink'}`}>
                    <td className="py-2">
                      {h.day}
                      {isToday && <span className="ml-2 rounded-full bg-banana px-2 py-0.5 text-[11px] font-bold text-ink">Hoy</span>}
                    </td>
                    <td className="py-2 text-right text-muted">{h.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 5 — Consultar stock en esta tienda (menú desplegable) */}
        <div>
          <h2 className="mb-3 font-bold text-ink">Consultar stock en esta tienda</h2>
          <label htmlFor="stock-product" className="mb-1.5 block text-sm text-muted">
            Elige un producto
          </label>
          <select
            id="stock-product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="field"
          >
            <option value="">Selecciona un producto…</option>
            {allModels.map((m) => (
              <option key={`${m.family}/${m.slug}`} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          {product && (
            <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-line bg-neutral p-4">
              <Icon name="check" size={18} className="mt-0.5 text-available" />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {product} · disponible en {store.name}
                </p>
                <p className="text-xs text-muted">Stock de ejemplo: la consulta es una demostración.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
