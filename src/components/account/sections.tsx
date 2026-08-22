import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { listMyOrders } from '../../lib/orderSync'
import {
  cancelReservation,
  describeReservationStatus,
  listMyReservations,
  type ReservationWithPosition,
} from '../../lib/reservations'
import { ACCEPTED_ACCEPT_ATTR, describeStatus, uploadEducationalProof } from '../../lib/educationalDiscount'
import type { DbAddress, DbOrder } from '../../lib/supabase'
import { ISLAS } from '../../lib/checkoutState'
import { euro } from '../../lib/format'

// Las secciones de «Mi cuenta».
//
// Salieron de `ProfilePage.tsx` sin tocar su cuerpo, porque ahora las montan
// DOS composiciones distintas: la de escritorio —columna de apartados y
// contenido al lado— y la pantalla secundaria de la aplicación nativa. La
// lógica, los estados y las peticiones son los mismos; lo único que cambia es
// dónde se colocan.

const EMPTY_ADDRESS: DbAddress = { calle: '', ciudad: '', isla: '', cp: '' }

/** Todas las secciones aceptan el nivel para poder ser pantalla o apartado. */
export type NivelDeTitulo = { headingLevel?: 1 | 2 }

/**
 * El marco de una sección de la cuenta.
 *
 * EL NIVEL DEL ENCABEZADO NO ES COSMÉTICO
 *
 * En la web esta sección vive DENTRO de «Mi cuenta», que es el `<h1>`: aquí es
 * un `<h2>` y así se lee la jerarquía. En la aplicación nativa cada sección es
 * una pantalla propia, y su título es el único de esa pantalla: ahí es el
 * `<h1>`.
 *
 * Se resuelve con el nivel y no pintando dos títulos —uno oculto y otro
 * visible—, que era la alternativa fácil y habría dejado el mismo texto dos
 * veces en el árbol de accesibilidad.
 */
export function Section({
  title,
  description,
  headingLevel = 2,
  children,
}: {
  title: string
  description?: string
  headingLevel?: 1 | 2
  children: React.ReactNode
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <section>
      <Heading className="text-lg font-bold text-ink">{title}</Heading>
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
      {state === 'error' && <span className="text-danger">No se pudo guardar. Inténtalo de nuevo.</span>}
    </p>
  )
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function PersonalDataSection({ headingLevel }: NivelDeTitulo) {
  const t = useT()
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
    <Section title="Datos personales" headingLevel={headingLevel}>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label={t('checkout.fullName')}>
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

export function AddressSection({
  which,
  title,
  headingLevel,
}: { which: 'envio' | 'facturacion'; title: string } & NivelDeTitulo) {
  const { cliente, updateProfile } = useCustomerAuth()
  const stored = which === 'envio' ? cliente?.direccion_envio : cliente?.direccion_facturacion
  // La "otra" dirección, para poder copiarla.
  const otra = which === 'envio' ? cliente?.direccion_facturacion : cliente?.direccion_envio
  const otraLabel = which === 'envio' ? 'facturación' : 'envío'

  const [address, setAddress] = useState<DbAddress>(EMPTY_ADDRESS)
  const [state, setState] = useState<SaveState>('idle')
  const [copiedNotice, setCopiedNotice] = useState(false)

  useEffect(() => {
    setAddress(stored ?? EMPTY_ADDRESS)
  }, [stored])

  function set(patch: Partial<DbAddress>) {
    setAddress((prev) => ({ ...prev, ...patch }))
    setState('idle')
  }

  // Copiar rellena el formulario pero NO guarda: así se puede ajustar
  // algo (un piso distinto, por ejemplo) antes de confirmar.
  function copiarDeLaOtra() {
    if (!otra) return
    setAddress(otra)
    setState('idle')
    setCopiedNotice(true)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setState('saving')
    setCopiedNotice(false)
    const isEmpty = Object.values(address).every((v) => !v.trim())
    const { error } = await updateProfile(
      which === 'envio'
        ? { direccion_envio: isEmpty ? null : address }
        : { direccion_facturacion: isEmpty ? null : address },
    )
    setState(error ? 'error' : 'saved')
  }

  const otraTieneDatos = otra ? Object.values(otra).some((v) => v?.trim()) : false

  return (
    <Section
      title={title}
      headingLevel={headingLevel}
      description={
        which === 'envio' ? 'Se usa para rellenar el checkout más rápido.' : 'La usamos en la factura del pedido.'
      }
    >
      <form onSubmit={save} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        {otraTieneDatos && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-neutral p-3">
            <Button type="button" variant="secondary" size="sm" onClick={copiarDeLaOtra}>
              Copiar dirección de {otraLabel}
            </Button>
            <span role="status" aria-live="polite" className="text-xs text-muted">
              {copiedNotice ? 'Copiada. Revísala y pulsa Guardar.' : 'Rellena este formulario con la otra dirección.'}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Calle y número" full>
            {(props) => (
              <input
                {...props}
                className="field"
                autoComplete={which === 'envio' ? 'shipping street-address' : 'billing street-address'}
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
              <select {...props} className="field" value={address.isla} onChange={(e) => set({ isla: e.target.value })}>
                <option value="">Selecciona una isla</option>
                {ISLAS.map((isla) => (
                  <option key={isla} value={isla}>
                    {isla}
                  </option>
                ))}
              </select>
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
          <Button type="submit" disabled={state === 'saving'}>
            Guardar dirección
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

export function OrdersSection({ clienteId, headingLevel }: { clienteId: string } & NivelDeTitulo) {
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
      headingLevel={headingLevel}
      description="Pedidos demostrativos hechos con la sesión iniciada."
    >
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && <p className="text-sm text-danger">No se pudieron cargar los pedidos.</p>}
      {status === 'ready' && orders.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          Todavía no has hecho ningún pedido con la sesión iniciada.
        </p>
      )}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
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
              {order.delivery === 'envio' ? 'Envío a domicilio' : 'Recogida en tienda'} · {order.payment_method}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink">
              {order.lines.map((line, index) => (
                <li key={index}>
                  {line.qty} × {line.name}
                  {line.color || line.capacity ? ` (${[line.color, line.capacity].filter(Boolean).join(' · ')})` : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function ReservationsSection({ clienteId, headingLevel }: { clienteId: string } & NivelDeTitulo) {
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
      headingLevel={headingLevel}
      description="Reservas de productos sin stock. El puesto en la lista de espera lo fija el momento del pago."
    >
      {status === 'loading' && <p className="text-sm text-muted">Cargando…</p>}
      {status === 'error' && <p className="text-sm text-danger">No se pudieron cargar las reservas.</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          No tienes ninguna reserva. Cuando un producto esté agotado o sea bajo pedido, podrás reservarlo desde su
          ficha.
        </p>
      )}
      <ul className="space-y-4">
        {items.map(({ reservation, position }) => (
          <li key={reservation.id} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-semibold text-ink">{reservation.model_name}</p>
              <p className="text-sm text-muted">{reservation.variant_label}</p>
              <p className="ml-auto font-semibold text-ink">{euro(Number(reservation.price))}</p>
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

export function EducationalDiscountSection({ headingLevel }: NivelDeTitulo) {
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
      headingLevel={headingLevel}
      description="Sube un justificante (matrícula o carné de estudiante). Lo revisa una persona del equipo; no es automático."
    >
      <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm text-ink">
          Estado: <strong>{describeStatus(estado)}</strong>
        </p>

        {cliente?.descuento_educativo_nota && (
          <p className="mt-2 rounded-[12px] bg-neutral p-3 text-sm text-muted">
            <strong className="text-ink">Nota del equipo:</strong> {cliente.descuento_educativo_nota}
          </p>
        )}

        {estado === 'pendiente' && (
          <p className="mt-2 text-sm text-muted">
            Ya tenemos tu justificante. Te avisaremos cuando esté revisado. Puedes subir otro si te has equivocado de
            archivo.
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="justificante-educativo" className="mb-1 block text-sm font-medium text-ink">
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

export function FavoritesSection({ headingLevel }: NivelDeTitulo) {
  const t = useT()
  const { favorites } = useStore()
  const { favoriteStore } = useStorePreference()

  return (
    <Section title="Favoritos y tienda" headingLevel={headingLevel}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Productos favoritos</h3>
          <p className="mt-1 text-sm text-muted">
            {favorites.length === 0
              ? 'Todavía no has guardado ninguno.'
              : `Tienes ${favorites.length} producto${favorites.length === 1 ? '' : 's'} guardado${favorites.length === 1 ? '' : 's'}.`}
          </p>
          <Link to="/favoritos" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            Ver mis favoritos
          </Link>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">Tienda habitual</h3>
          <p className="mt-1 text-sm text-muted">
            {favoriteStore ? favoriteStore.name : 'No has elegido ninguna todavía.'}
          </p>
          <Link to="/tiendas" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            {t('common.viewStores')}
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Favoritos y tienda habitual se guardan en este navegador, no en la cuenta.
      </p>
    </Section>
  )
}
