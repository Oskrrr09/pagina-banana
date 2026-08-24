import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIdioma, useT, type ClaveTexto } from '../../lib/i18n'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useStore } from '../../lib/store'
import { useStorePreference } from '../../lib/storePreference'
import { listMyOrders } from '../../lib/orderSync'
import { cancelReservation, listMyReservations, type ReservationWithPosition } from '../../lib/reservations'
import { ACCEPTED_ACCEPT_ATTR, uploadEducationalProof } from '../../lib/educationalDiscount'
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
  const t = useT()
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-xs">
      {state === 'saving' && <span className="text-muted">{t('account.saving')}</span>}
      {state === 'saved' && <span className="text-ink">{t('account.saved')}</span>}
      {state === 'error' && <span className="text-danger">{t('account.saveError')}</span>}
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
    <Section title={t('account.personalData')} headingLevel={headingLevel}>
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
        <Field label={t('account.phone')}>
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
            {t('account.saveData')}
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

export function AddressSection({ which, headingLevel }: { which: 'envio' | 'facturacion' } & NivelDeTitulo) {
  // El título sale de `which` en vez de llegar por prop: quien la monta es una
  // función suelta, no un componente, y allí no se pueden llamar hooks.
  const t = useT()
  const { cliente, updateProfile } = useCustomerAuth()
  const stored = which === 'envio' ? cliente?.direccion_envio : cliente?.direccion_facturacion
  // La "otra" dirección, para poder copiarla.
  const otra = which === 'envio' ? cliente?.direccion_facturacion : cliente?.direccion_envio
  const copiarDeLaOtraLabel = which === 'envio' ? t('account.copyBilling') : t('account.copyShipping')

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
      title={which === 'envio' ? t('account.shippingAddress') : t('account.billingAddress')}
      headingLevel={headingLevel}
      description={which === 'envio' ? t('account.shippingIntro') : t('account.billingIntro')}
    >
      <form onSubmit={save} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        {otraTieneDatos && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-neutral p-3">
            <Button type="button" variant="secondary" size="sm" onClick={copiarDeLaOtra}>
              {copiarDeLaOtraLabel}
            </Button>
            <span role="status" aria-live="polite" className="text-xs text-muted">
              {copiedNotice ? t('account.copied') : t('account.copyHint')}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('account.street')} full>
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
          <Field label={t('account.city')}>
            {(props) => (
              <input
                {...props}
                className="field"
                value={address.ciudad}
                onChange={(e) => set({ ciudad: e.target.value })}
              />
            )}
          </Field>
          <Field label={t('checkout.island')}>
            {(props) => (
              <select {...props} className="field" value={address.isla} onChange={(e) => set({ isla: e.target.value })}>
                <option value="">{t('account.selectIsland')}</option>
                {ISLAS.map((isla) => (
                  <option key={isla} value={isla}>
                    {isla}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t('account.postalCode')}>
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
            {t('account.saveAddress')}
          </Button>
          <div className="mt-2">
            <SaveFeedback state={state} />
          </div>
        </div>
      </form>
    </Section>
  )
}

/**
 * El método de pago, tal y como se enseña.
 *
 * `payment_method` NO es un dato que escriba nadie: es un enum del propio
 * producto —`'tarjeta' | 'bizum' | 'financiacion'`—, así que imprimirlo tal cual
 * dejaba «Home delivery · tarjeta» con la web en inglés. Se reutiliza el
 * contrato que ya usa el checkout en vez de inventar claves paralelas.
 *
 * Es un `switch` con retorno declarado a propósito: si el union incorpora un
 * método nuevo, la función deja de devolver siempre `string` y el compilador
 * lo para aquí, en vez de dejar que el token interno se cuele en la pantalla.
 *
 * Bizum se queda como está: es un nombre propio y se escribe igual en los cinco
 * idiomas, igual que en el checkout.
 */
function etiquetaDePago(metodo: DbOrder['payment_method'], t: (clave: ClaveTexto) => string): string {
  switch (metodo) {
    case 'tarjeta':
      return t('checkout.card')
    case 'bizum':
      return 'Bizum'
    case 'financiacion':
      return t('checkout.financing')
  }
}

export function OrdersSection({ clienteId, headingLevel }: { clienteId: string } & NivelDeTitulo) {
  const { t, intl } = useIdioma()
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
    // A62-04: NO SE DESCRIBE CÓMO NACIÓ EL PEDIDO
    //
    // Decía «Pedidos demostrativos hechos con la sesión iniciada» y, en vacío,
    // «Todavía no has hecho ningún pedido con la sesión iniciada». Desde D-083
    // una compra hecha SIN cuenta se reconcilia al identificarse, así que esta
    // misma lista puede contener pedidos que nadie hizo con la sesión abierta.
    // Lo único que la pantalla sabe —y por tanto lo único que afirma— es que
    // están asociados a esta cuenta.
    <Section title={t('account.orders')} headingLevel={headingLevel} description={t('account.ordersIntro')}>
      {status === 'loading' && <p className="text-sm text-muted">{t('common.loading')}</p>}
      {status === 'error' && <p className="text-sm text-danger">{t('account.ordersError')}</p>}
      {status === 'ready' && orders.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          {t('account.ordersEmpty')}
        </p>
      )}
      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-sm font-semibold text-ink">{order.id}</p>
              <p className="text-xs text-muted">
                {new Date(order.created_at).toLocaleDateString(intl, {
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
              {order.delivery === 'envio' ? t('checkout.homeDelivery') : t('checkout.storePickup')} ·{' '}
              {etiquetaDePago(order.payment_method, t)}
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

/**
 * El estado de una reserva, en el idioma activo.
 *
 * `describeReservationStatus` sigue devolviendo castellano y no se toca: lo
 * comparte con superficies que van siempre en español. Aquí sólo se traduce el
 * valor, que es lo que ve quien mira su cuenta.
 */
const CLAVE_RESERVA = {
  'en-espera': 'account.resWaiting',
  disponible: 'account.resAvailable',
  completada: 'account.resCompleted',
  cancelada: 'account.resCancelled',
} as const satisfies Record<ReservationWithPosition['reservation']['estado'], ClaveTexto>

export function ReservationsSection({ clienteId, headingLevel }: { clienteId: string } & NivelDeTitulo) {
  const { t, intl } = useIdioma()
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
    <Section title={t('account.reservations')} headingLevel={headingLevel} description={t('account.reservationsIntro')}>
      {status === 'loading' && <p className="text-sm text-muted">{t('common.loading')}</p>}
      {status === 'error' && <p className="text-sm text-danger">{t('account.reservationsError')}</p>}
      {status === 'ready' && items.length === 0 && (
        <p className="rounded-[12px] border border-line bg-neutral p-4 text-sm text-muted">
          {t('account.reservationsEmpty')}
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
              {t(CLAVE_RESERVA[reservation.estado])}
              {reservation.estado === 'en-espera' && position != null && (
                <>
                  {' · '}
                  <strong>
                    {t('account.position', { n: position })} {position === 1 ? t('account.positionNext') : ''}
                  </strong>
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('account.reservedOn', {
                fecha: new Date(reservation.pagado_at).toLocaleDateString(intl, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }),
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
                {t('account.cancelReservation')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** Mismo criterio que en reservas: `describeStatus` se queda como está. */
const CLAVE_DESCUENTO = {
  pendiente: 'account.discountPendingStatus',
  aprobado: 'account.discountApproved',
  rechazado: 'account.discountRejected',
} as const satisfies Record<'pendiente' | 'aprobado' | 'rechazado', ClaveTexto>

export function EducationalDiscountSection({ headingLevel }: NivelDeTitulo) {
  const t = useT()
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
      title={t('account.educationDiscount')}
      headingLevel={headingLevel}
      description={t('account.discountIntro')}
    >
      <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
        <p className="text-sm text-ink">
          {t('account.statusLabel')} <strong>{t(estado ? CLAVE_DESCUENTO[estado] : 'account.discountNone')}</strong>
        </p>

        {cliente?.descuento_educativo_nota && (
          <p className="mt-2 rounded-[12px] bg-neutral p-3 text-sm text-muted">
            <strong className="text-ink">{t('account.teamNote')}</strong> {cliente.descuento_educativo_nota}
          </p>
        )}

        {estado === 'pendiente' && <p className="mt-2 text-sm text-muted">{t('account.discountPending')}</p>}

        <div className="mt-4">
          <label htmlFor="justificante-educativo" className="mb-1 block text-sm font-medium text-ink">
            {estado ? t('account.uploadAnotherProof') : t('account.uploadProof')}
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
          <p className="mt-1 text-xs text-muted">{t('account.fileHint')}</p>
        </div>

        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-xs">
          {uploading && <span className="text-muted">{t('account.uploading')}</span>}
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
    <Section title={t('account.favorites')} headingLevel={headingLevel}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">{t('account.favoriteProducts')}</h3>
          <p className="mt-1 text-sm text-muted">
            {favorites.length === 0
              ? t('account.noFavorites')
              : t(favorites.length === 1 ? 'account.favoritesOne' : 'account.favoritesMany', {
                  n: favorites.length,
                })}
          </p>
          <Link to="/favoritos" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            {t('account.viewFavorites')}
          </Link>
        </div>

        <div className="rounded-[16px] border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-semibold text-ink">{t('account.usualStore')}</h3>
          <p className="mt-1 text-sm text-muted">{favoriteStore ? favoriteStore.name : t('account.noStoreChosen')}</p>
          <Link to="/tiendas" className="mt-3 inline-block text-sm font-semibold text-ink underline">
            {t('common.viewStores')}
          </Link>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">{t('account.localOnly')}</p>
    </Section>
  )
}
