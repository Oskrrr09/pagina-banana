import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useCustomerAuth } from '../lib/customerAuth'
import { useStore } from '../lib/store'
import { useStorePreference } from '../lib/storePreference'
import { listMyOrders } from '../lib/orderSync'
import {
  cancelReservation,
  describeReservationStatus,
  listMyReservations,
  type ReservationWithPosition,
} from '../lib/reservations'
import {
  ACCEPTED_ACCEPT_ATTR,
  describeStatus,
  uploadEducationalProof,
} from '../lib/educationalDiscount'
import { supabaseEnabled, type DbAddress, type DbOrder } from '../lib/supabase'
import { euro } from '../lib/format'

// "Mi cuenta" — Fase 2.
//
// Reúne lo que hoy vive disperso (favoritos, tienda favorita) con lo que
// solo existe con sesión (pedidos persistentes, reservas, direcciones y
// descuento educativo). Todo demostrativo.

const EMPTY_ADDRESS: DbAddress = { calle: '', ciudad: '', isla: '', cp: '' }

export function ProfilePage() {
  const { session, cliente, loading, signOut } = useCustomerAuth()
  const navigate = useNavigate()

  if (!supabaseEnabled) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Mi cuenta</h1>
        <p className="mt-2 text-muted">
          Las cuentas necesitan Supabase configurado en este entorno.
        </p>
        <Link to="/" className="mt-4 inline-block font-semibold text-ink hover:underline">
          Volver a la portada
        </Link>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className="py-20 text-center">
        <p className="text-muted">Cargando tu cuenta…</p>
      </Container>
    )
  }

  if (!session) {
    return <Navigate to="/login?redirect=%2Fcuenta" replace />
  }

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink">Mi cuenta</h1>
          <p className="mt-1 break-words text-sm text-muted">{session.user.email}</p>
        </div>
        <Button
          variant="secondary"
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
        >
          Cerrar sesión
        </Button>
      </div>

      <div className="mt-4 rounded-[12px] border border-line bg-neutral px-4 py-2 text-xs text-muted">
        <strong className="text-ink">Cuenta de demostración.</strong> Los pedidos,
        reservas y descuentos de esta página son de ejemplo: no se cobra ni se envía
        nada.
      </div>

      <div className="mt-10 space-y-12">
        <PersonalDataSection />
        <AddressesSection />
        <OrdersSection clienteId={session.user.id} />
        <ReservationsSection clienteId={session.user.id} />
        <EducationalDiscountSection />
        <FavoritesSection />
      </div>

      {!cliente && (
        <p className="mt-8 text-sm text-danger">
          No se pudo cargar tu ficha de cliente. Recarga la página; si sigue igual,
          revisa que el esquema de Supabase esté aplicado.
        </p>
      )}
    </Container>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Aviso de guardado que se anuncia a lectores de pantalla. */
function SaveFeedback({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-xs">
      {state === 'saving' && <span className="text-muted">Guardando…</span>}
      {state === 'saved' && <span className="text-ink">Guardado.</span>}
      {state === 'error' && (
        <span className="text-danger">No se pudo guardar. Inténtalo de nuevo.</span>
      )}
    </p>
  )
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function PersonalDataSection() {
  const { cliente, updateProfile } = useCustomerAuth()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [state, setState] = useState<SaveState>('idle')

  useEffect(() => {
    setNombre(cliente?.nombre ?? '')
    setTelefono(cliente?.telefono ?? '')
  }, [cliente])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setState('saving')
    const { error } = await updateProfile({
      nombre: nombre.trim() || null,
      telefono: telefono.trim() || null,
    })
    setState(error ? 'error' : 'saved')
  }

  return (
    <Section title="Datos personales">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre y apellidos">
          {(props) => (
            <input
              {...props}
              className="field"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          )}
        </Field>
        <Field label="Teléfono">
          {(props) => (
            <input
              {...props}
              type="tel"
              className="field"
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          )}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={state === 'saving'}>
            Guardar datos
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

function AddressesSection() {
  return (
    <Section
      title="Direcciones"
      description="Se usan para rellenar el checkout más rápido."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <AddressCard which="envio" title="Dirección de envío" />
        <AddressCard which="facturacion" title="Dirección de facturación" />
      </div>
    </Section>
  )
}

function AddressCard({
  which,
  title,
}: {
  which: 'envio' | 'facturacion'
  title: string
}) {
  const { cliente, updateProfile } = useCustomerAuth()
  const stored = which === 'envio' ? cliente?.direccion_envio : cliente?.direccion_facturacion
  const [address, setAddress] = useState<DbAddress>(EMPTY_ADDRESS)
  const [state, setState] = useState<SaveState>('idle')

  useEffect(() => {
    setAddress(stored ?? EMPTY_ADDRESS)
  }, [stored])

  function set(patch: Partial<DbAddress>) {
    setAddress((prev) => ({ ...prev, ...patch }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setState('saving')
    const isEmpty = Object.values(address).every((v) => !v.trim())
    const { error } = await updateProfile(
      which === 'envio'
        ? { direccion_envio: isEmpty ? null : address }
        : { direccion_facturacion: isEmpty ? null : address },
    )
    setState(error ? 'error' : 'saved')
  }

  return (
    <form
      onSubmit={save}
      className="rounded-[16px] border border-line bg-surface p-5 shadow-sm"
    >
      <h3 className="font-semibold text-ink">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Calle y número" full>
          {(props) => (
            <input
              {...props}
              className="field"
              value={address.calle}
              onChange={(e) => set({ calle: e.target.value })}
            />
          )}
        </Field>
        <Field label="Ciudad">
          {(props) => (
            <input
              {...props}
              className="field"
              value={address.ciudad}
              onChange={(e) => set({ ciudad: e.target.value })}
            />
          )}
        </Field>
        <Field label="Isla">
          {(props) => (
            <input
              {...props}
              className="field"
              value={address.isla}
              onChange={(e) => set({ isla: e.target.value })}
            />
          )}
        </Field>
        <Field label="Código postal">
          {(props) => (
            <input
              {...props}
              className="field"
              inputMode="numeric"
              value={address.cp}
              onChange={(e) => set({ cp: e.target.value })}
            />
          )}
        </Field>
      </div>
      <div className="mt-4">
        <Button type="submit" variant="secondary" disabled={state === 'saving'}>
          Guardar dirección
        </Button>
        <div className="mt-2">
          <SaveFeedback state={state} />
        </div>
      </div>
    </form>
  )
}

function OrdersSection({ clienteId }: { clienteId: string }) {
  const [orders, setOrders] = useState<DbOrder[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    listMyOrders(clienteId).then(({ orders: rows, error }) => {
      if (!active) return
      if (error) {
        setStatus('error')
        return
      }
      setOrders(rows)
      setStatus('ready')
    })
    return () => {
      active = false
    }
  }, [clienteId])

  return (
    <Section
      title="Mis pedidos"
      description="Pedidos demostrativos hechos con la sesión iniciada."
    >
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && (
        <p className="text-sm text-danger">No se pudieron cargar los pedidos.</p>
      )}
      {status === 'ready' && orders.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          Todavía no has hecho ningún pedido con la sesión iniciada.
        </p>
      )}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="rounded-[16px] border border-line bg-surface p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-sm font-semibold text-ink">{order.id}</p>
              <p className="text-xs text-muted">
                {new Date(order.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="ml-auto font-semibold text-ink">
                {euro(Number(order.products_total) + Number(order.insurance_total))}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted">
              {order.delivery === 'envio' ? 'Envío a domicilio' : 'Recogida en tienda'} ·{' '}
              {order.payment_method}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {order.lines.map((line, index) => (
                <li key={index}>
                  {line.qty} × {line.name}
                  {line.color || line.capacity
                    ? ` (${[line.color, line.capacity].filter(Boolean).join(' · ')})`
                    : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function ReservationsSection({ clienteId }: { clienteId: string }) {
  const [items, setItems] = useState<ReservationWithPosition[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { items: rows, error } = await listMyReservations(clienteId)
    if (error) {
      setStatus('error')
      return
    }
    setItems(rows)
    setStatus('ready')
  }, [clienteId])

  useEffect(() => {
    void load()
  }, [load])

  async function cancel(id: string) {
    setBusyId(id)
    await cancelReservation(id)
    setBusyId(null)
    await load()
  }

  return (
    <Section
      title="Mis reservas"
      description="Reservas de productos sin stock. El puesto en la lista de espera lo fija el momento del pago."
    >
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && (
        <p className="text-sm text-danger">No se pudieron cargar las reservas.</p>
      )}
      {status === 'ready' && items.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          No tienes ninguna reserva. Cuando un producto esté agotado o sea bajo
          pedido, podrás reservarlo desde su ficha.
        </p>
      )}
      <ul className="space-y-4">
        {items.map(({ reservation, position }) => (
          <li
            key={reservation.id}
            className="rounded-[16px] border border-line bg-surface p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-semibold text-ink">{reservation.model_name}</p>
              <p className="text-sm text-muted">{reservation.variant_label}</p>
              <p className="ml-auto font-semibold text-ink">
                {euro(Number(reservation.price))}
              </p>
            </div>
            <p className="mt-2 text-sm text-ink">
              {describeReservationStatus(reservation.estado)}
              {reservation.estado === 'en-espera' && position != null && (
                <>
                  {' · '}
                  <strong>
                    Posición {position} {position === 1 ? '(siguiente)' : ''}
                  </strong>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              Reservado el{' '}
              {new Date(reservation.pagado_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {reservation.estado === 'en-espera' && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                disabled={busyId === reservation.id}
                onClick={() => void cancel(reservation.id)}
              >
                Cancelar reserva
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function EducationalDiscountSection() {
  const { session, cliente, refresh } = useCustomerAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const estado = cliente?.descuento_educativo_estado ?? null

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !session) return
    setError(null)
    setUploading(true)
    const { error: uploadError } = await uploadEducationalProof(session.user.id, file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    if (uploadError) {
      setError(uploadError)
      return
    }
    await refresh()
  }

  return (
    <Section
      title="Descuento educativo"
      description="Sube un justificante (matrícula o carné de estudiante). Lo revisa una persona del equipo; no es automático."
    >
      <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm text-ink">
          Estado: <strong>{describeStatus(estado)}</strong>
        </p>

        {cliente?.descuento_educativo_nota && (
          <p className="mt-2 rounded-[12px] bg-neutral p-3 text-sm text-muted">
            <strong className="text-ink">Nota del equipo:</strong>{' '}
            {cliente.descuento_educativo_nota}
          </p>
        )}

        {estado === 'pendiente' && (
          <p className="mt-2 text-sm text-muted">
            Ya tenemos tu justificante. Te avisaremos cuando esté revisado. Puedes
            subir otro si te has equivocado de archivo.
          </p>
        )}

        <div className="mt-4">
          <label
            htmlFor="justificante-educativo"
            className="mb-1 block text-sm font-medium text-ink"
          >
            {estado ? 'Subir otro justificante' : 'Subir justificante'}
          </label>
          <input
            ref={inputRef}
            id="justificante-educativo"
            type="file"
            accept={ACCEPTED_ACCEPT_ATTR}
            onChange={onFileChange}
            disabled={uploading}
            className="block w-full text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-ink/20 file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-black/5"
          />
          <p className="mt-1 text-xs text-muted">PDF, JPG o PNG. Máximo 5 MB.</p>
        </div>

        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs">
          {uploading && <span className="text-muted">Subiendo…</span>}
          {error && <span className="text-danger">{error}</span>}
        </p>
      </div>
    </Section>
  )
}

function FavoritesSection() {
  const { favorites } = useStore()
  const { favoriteStore } = useStorePreference()

  return (
    <Section title="Favoritos y tienda">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Productos favoritos</h3>
          <p className="mt-1 text-sm text-muted">
            {favorites.length === 0
              ? 'Todavía no has guardado ninguno.'
              : `Tienes ${favorites.length} producto${favorites.length === 1 ? '' : 's'} guardado${favorites.length === 1 ? '' : 's'}.`}
          </p>
          <Link
            to="/favoritos"
            className="mt-3 inline-block text-sm font-semibold text-ink underline"
          >
            Ver mis favoritos
          </Link>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Tienda habitual</h3>
          <p className="mt-1 text-sm text-muted">
            {favoriteStore ? favoriteStore.name : 'No has elegido ninguna todavía.'}
          </p>
          <Link
            to="/tiendas"
            className="mt-3 inline-block text-sm font-semibold text-ink underline"
          >
            Ver tiendas
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Favoritos y tienda habitual se guardan en este navegador, no en la cuenta.
      </p>
    </Section>
  )
}
