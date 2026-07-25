import { useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { Button } from '../components/ui/Button'
import { getStore } from '../data/stores'
import { NotFound } from './NotFound'

const TODAY = new Date().toLocaleDateString('es-ES', { weekday: 'long' })

// Ficha de una tienda (§4.14).
export function StoreDetailPage() {
  const { slug } = useParams()
  const store = getStore(slug ?? '')
  if (!store) return <NotFound />

  const today = TODAY.charAt(0).toUpperCase() + TODAY.slice(1)

  return (
    <Container className="py-8">
      <Breadcrumb
        items={[{ label: 'Inicio', to: '/' }, { label: 'Tiendas', to: '/tiendas' }, { label: store.name }]}
      />

      {/* 1 — Cabecera de tienda */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
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
              {store.services.map((s) => (
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
                  <tr key={h.day} className={`border-b border-line ${isToday ? 'font-semibold text-brand' : 'text-ink'}`}>
                    <td className="py-2">{h.day}</td>
                    <td className="py-2 text-right text-muted">{h.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 5 — Consultar stock en esta tienda */}
        <div>
          <h2 className="mb-3 font-bold text-ink">Consultar stock en esta tienda</h2>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              placeholder="Buscar producto…"
              aria-label="Buscar producto en esta tienda"
              className="field"
            />
            <Button>Buscar</Button>
          </form>
          <p className="mt-2 text-xs text-muted">Stock de ejemplo: la consulta es una demostración.</p>
        </div>
      </div>
    </Container>
  )
}
