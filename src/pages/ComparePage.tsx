import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button, ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Placeholder } from '../components/ui/Placeholder'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import { euro } from '../lib/format'

// Comparador (§4.8): hasta 3 columnas. Resalta las diferencias por fila.
export function ComparePage() {
  const { compare, removeCompare, addToCart } = useStore()
  const navigate = useNavigate()

  // Filas de características a partir de las specs (unión de etiquetas)
  const specLabels = Array.from(new Set(compare.flatMap((c) => c.specs.map((s) => s.label))))

  function valuesFor(label: string) {
    return compare.map((c) => c.specs.find((s) => s.label === label)?.value ?? '—')
  }
  const allSame = (vals: string[]) => vals.every((v) => v === vals[0])

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">Comparador</h1>
      <p className="mt-1 text-muted">Compara hasta 3 productos lado a lado.</p>

      {compare.length === 0 ? (
        <div className="mt-8 rounded-[12px] border border-dashed border-line py-16 text-center">
          <p className="text-muted">Aún no has añadido productos a comparar.</p>
          <ButtonLink to="/iphone" className="mt-6">
            Elegir productos
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="w-40 p-3 text-left align-bottom text-sm font-medium text-muted">Producto</th>
                  {compare.map((c) => (
                    <th key={c.id} className="p-3 align-bottom">
                      <div className="relative rounded-[12px] border border-line p-3">
                        <button
                          onClick={() => removeCompare(c.id)}
                          aria-label={`Quitar ${c.name}`}
                          className="absolute right-2 top-2 text-muted hover:text-danger"
                        >
                          <Icon name="close" size={16} />
                        </button>
                        <Placeholder label={c.name} ratio="4 / 3" />
                        <p className="mt-2 text-left text-sm font-bold text-ink">{c.name}</p>
                        <p className="text-left text-xs text-muted">
                          {c.capacity} · {c.color}
                        </p>
                        <p className="mt-1 text-left font-bold text-ink">{euro(c.price)}</p>
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() =>
                            addToCart({
                              id: c.id,
                              modelSlug: c.modelSlug,
                              family: 'iphone',
                              name: c.name,
                              color: c.color,
                              capacity: c.capacity,
                              price: c.price,
                              previousPrice: null,
                            })
                          }
                        >
                          Comprar
                        </Button>
                      </div>
                    </th>
                  ))}
                  {compare.length < 3 && (
                    <th className="p-3 align-middle">
                      <Link
                        to="/iphone"
                        className="grid h-full min-h-[180px] place-items-center rounded-[12px] border border-dashed border-line text-sm font-semibold text-brand hover:bg-brand-050"
                      >
                        + Añadir producto
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                    Precio
                  </th>
                  {compare.map((c) => (
                    <td key={c.id} className="p-3 font-bold text-ink">
                      {euro(c.price)}
                    </td>
                  ))}
                  {compare.length < 3 && <td />}
                </tr>
                {specLabels.map((label) => {
                  const vals = valuesFor(label)
                  const same = allSame(vals)
                  return (
                    <tr key={label} className="border-t border-line">
                      <th scope="row" className="p-3 text-left text-sm font-medium text-muted">
                        {label}
                      </th>
                      {vals.map((v, i) => (
                        <td
                          key={i}
                          className={`p-3 text-sm ${same ? 'text-ink' : 'bg-action-050 font-semibold text-action-600'}`}
                        >
                          {v}
                        </td>
                      ))}
                      {compare.length < 3 && <td />}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <ProvisionalBadge label="Precio demostrativo" />
            <span className="text-xs text-muted">Las diferencias entre columnas aparecen resaltadas en ámbar.</span>
          </div>

          {compare.length === 1 && (
            <p className="mt-6 rounded-[12px] bg-neutral p-4 text-sm text-muted">
              Añade al menos un producto más para poder comparar.{' '}
              <button onClick={() => navigate('/iphone')} className="font-semibold text-brand hover:underline">
                Elegir otro
              </button>
            </p>
          )}
        </>
      )}
    </Container>
  )
}
