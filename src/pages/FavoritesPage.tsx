import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import { useStorePreference } from '../lib/storePreference'
import { useFavoriteAlerts, currentInventoryStateFor } from '../lib/favoriteAlerts'
import { INVENTORY_LABELS } from '../data/demoStoreInventory'
import { allModels, variantPath } from '../data/products'
import { stores, getStore } from '../data/stores'
import { euro } from '../lib/format'
import type { Model } from '../data/types'

// -----------------------------------------------------------------------
// Favoritos ampliados con seguimiento demostrativo de disponibilidad y
// centro interno de avisos (PR4 del bloque diferencial).
//
// - Compatibilidad con `banana:fav` (id `family/model`).
// - Nuevo seguimiento en `banana:favorite-alerts` y notificaciones en
//   `banana:favorite-notifications`.
// - Simulación explícita de llegada a tienda: cambia el estado del
//   inventario en memoria a "disponible" y genera una notificación.
// - No se envían emails ni se realizan peticiones de red.
// -----------------------------------------------------------------------
export function FavoritesPage() {
  const t = useT()
  const { favorites, toggleFavorite } = useStore()
  const { favoriteStore, setFavorite: setFavoriteStore } = useStorePreference()
  const {
    alerts,
    notifications,
    setAlert,
    changeAlertStore,
    disableAlert,
    simulateArrival,
    markRead,
    markAllRead,
    getAlertForProduct,
  } = useFavoriteAlerts()

  const favModels = useMemo<Model[]>(
    () =>
      allModels.filter((m) =>
        favorites.some((f) => f.startsWith(`${m.family}/${m.slug}`)),
      ),
    [favorites],
  )

  const trackedAlerts = alerts.filter((a) => a.enabled)

  return (
    <Container className="py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-ink">Favoritos</h1>
        <p className="mt-1 text-muted">
          {t('favorites.intro')}
        </p>
      </header>

      {favModels.length === 0 ? (
        <div className="mt-8 rounded-[12px] border border-dashed border-line py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral text-muted">
            <Icon name="heart" size={26} />
          </div>
          <p className="mt-4 text-muted">Aún no has guardado ningún producto.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/iphone">Explorar iPhone</ButtonLink>
            <ButtonLink to="/elige-tu-apple" variant="secondary">
              {t('favorites.finderCta')}
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          {/* 1 — Mis productos */}
          <section aria-labelledby="fav-products" className="mt-8">
            <h2 id="fav-products" className="text-xl font-bold text-ink">
              Mis productos
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favModels.map((model) => (
                <FavoriteCard
                  key={model.slug}
                  model={model}
                  favoriteStoreSlug={favoriteStore?.slug ?? null}
                  alert={getAlertForProduct(`${model.family}/${model.slug}`)}
                  onRemove={() => {
                    // Retirar el favorito también desactiva el seguimiento
                    // y borra las notificaciones huérfanas (§PR4).
                    disableAlert(`${model.family}/${model.slug}`)
                    toggleFavorite(`${model.family}/${model.slug}`)
                  }}
                  onFollow={(storeSlug, offerAsFavorite) => {
                    setAlert(`${model.family}/${model.slug}`, storeSlug)
                    if (offerAsFavorite && !favoriteStore) {
                      setFavoriteStore(storeSlug)
                    }
                  }}
                  onDisable={() => disableAlert(`${model.family}/${model.slug}`)}
                />
              ))}
            </ul>
          </section>

          {/* 2 — Mis avisos */}
          {trackedAlerts.length > 0 && (
            <section aria-labelledby="fav-alerts" className="mt-10">
              <h2 id="fav-alerts" className="text-xl font-bold text-ink">
                Mis avisos
              </h2>
              <p className="mt-1 text-sm text-muted">
                Simulación demostrativa — nada de correos ni datos personales.
              </p>
              <ul className="mt-4 space-y-3">
                {trackedAlerts.map((alert) => {
                  const model = allModels.find((m) => `${m.family}/${m.slug}` === alert.productId)
                  const store = getStore(alert.storeSlug)
                  if (!model || !store) return null
                  const state = currentInventoryStateFor(store.slug, alert.productId)
                  const label = INVENTORY_LABELS[state]
                  return (
                    <li
                      key={alert.productId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-surface p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-050 text-ink">
                          <Icon name="info" size={16} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{model.name}</p>
                          <p className="text-xs text-muted">
                            {store.name} · {label.short}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => simulateArrival(alert.productId, model.name)}
                          className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand-050 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand/20"
                        >
                          <Icon name="refresh" size={13} aria-hidden="true" /> Simular llegada
                        </button>
                        <StoreSelectInline
                          value={store.slug}
                          onChange={(next) => changeAlertStore(alert.productId, next)}
                        />
                        <button
                          type="button"
                          onClick={() => disableAlert(alert.productId)}
                          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-danger hover:border-danger"
                        >
                          Desactivar
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">
                Simulación: no representa stock real. En una versión conectada al inventario y al
                sistema de comunicaciones, este aviso también podría enviarse por email.
              </p>
            </section>
          )}

          {/* 3 — Notificaciones internas */}
          {notifications.length > 0 && (
            <section aria-labelledby="fav-notifications" className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="fav-notifications" className="text-xl font-bold text-ink">
                  Notificaciones
                </h2>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-ink underline underline-offset-2"
                >
                  Marcar todas como leídas
                </button>
              </div>
              <ul className="mt-4 space-y-2">
                {notifications.map((n) => {
                  const store = getStore(n.storeSlug)
                  return (
                    <li
                      key={n.id}
                      className={`rounded-[10px] border p-3 text-sm ${
                        n.read ? 'border-line bg-surface text-muted' : 'border-brand bg-brand-050 text-ink'
                      }`}
                    >
                      <p className="font-semibold">{n.message}</p>
                      <p className="mt-1 text-xs text-muted">
                        {store?.name ?? n.storeSlug} · {new Date(n.createdAt).toLocaleString('es-ES')}
                      </p>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="mt-1 text-xs font-semibold text-ink underline underline-offset-2"
                        >
                          Marcar como leído
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="mt-8">
        <ProvisionalBadge label={t('favorites.demoBadge')} />
      </div>
    </Container>
  )
}

// -----------------------------------------------------------------------

function FavoriteCard({
  model,
  favoriteStoreSlug,
  alert,
  onRemove,
  onFollow,
  onDisable,
}: {
  model: Model
  favoriteStoreSlug: string | null
  alert: ReturnType<ReturnType<typeof useFavoriteAlerts>['getAlertForProduct']>
  onRemove: () => void
  onFollow: (storeSlug: string, offerAsFavorite: boolean) => void
  onDisable: () => void
}) {
  const t = useT()
  const productId = `${model.family}/${model.slug}`
  const activeStoreSlug = alert?.storeSlug ?? favoriteStoreSlug
  const activeStore = activeStoreSlug ? getStore(activeStoreSlug) : null
  const state = activeStore ? currentInventoryStateFor(activeStore.slug, productId) : null
  const label = state ? INVENTORY_LABELS[state] : null
  const following = Boolean(alert?.enabled)

  return (
    <li className="flex h-full flex-col rounded-[16px] border border-line bg-surface p-4">
      <Link to={variantPath(model)} className="block">
        <ProductImage src={model.colors[0].image} alt={model.name} ratio="4 / 3" />
      </Link>
      <h3 className="mt-2 text-sm font-semibold text-ink">{model.name}</h3>
      <p className="text-xs text-muted">desde {euro(model.fromPrice)}</p>
      <div className="mt-2">
        <ProvisionalBadge label={t('common.demoPrice')} />
      </div>

      {label && activeStore && (
        <p className="mt-3 rounded-[8px] bg-neutral p-2 text-xs text-ink">
          <strong>{label.short}</strong> — {label.long}
          <span className="block text-muted">Tienda: {activeStore.name}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={variantPath(model)}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
        >
          Ver producto
        </Link>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${model.name} de favoritos`}
          className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-danger hover:border-danger"
        >
          Quitar
        </button>
      </div>

      <div className="mt-3 rounded-[10px] border border-line bg-neutral p-3">
        {following && activeStore ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-ink">
              Siguiendo disponibilidad en {activeStore.name}
            </p>
            <button
              type="button"
              onClick={onDisable}
              className="text-xs font-semibold text-danger underline underline-offset-2"
            >
              Desactivar
            </button>
          </div>
        ) : (
          <FollowControls
            productId={productId}
            favoriteStoreSlug={favoriteStoreSlug}
            onFollow={onFollow}
          />
        )}
      </div>
    </li>
  )
}

function FollowControls({
  productId: _productId,
  favoriteStoreSlug,
  onFollow,
}: {
  productId: string
  favoriteStoreSlug: string | null
  onFollow: (storeSlug: string, offerAsFavorite: boolean) => void
}) {
  const t = useT()
  return (
    <details className="text-xs text-ink">
      <summary className="cursor-pointer font-semibold text-ink">Seguir disponibilidad</summary>
      <p className="mt-2 text-muted">
        {t('favorites.chooseStoreNote')}
      </p>
      <ul className="mt-2 space-y-1">
        {stores.map((store) => {
          const isFav = store.slug === favoriteStoreSlug
          return (
            <li key={store.slug}>
              <button
                type="button"
                onClick={() => onFollow(store.slug, !favoriteStoreSlug)}
                className="flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-left text-xs text-ink hover:bg-brand-050"
              >
                <span>
                  {store.name}
                  <span className="ml-1 text-muted">{store.island}</span>
                </span>
                {isFav && <span className="text-[10px] font-bold uppercase text-ink">Tu tienda</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {!favoriteStoreSlug && (
        <p className="mt-2 text-[11px] text-muted">
          Si aún no tienes tienda favorita, se guardará también como tal al elegirla.
        </p>
      )}
    </details>
  )
}

function StoreSelectInline({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className="text-xs text-muted">
      <span className="sr-only">Cambiar tienda</span>
      <select
        aria-label="Cambiar tienda del aviso"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink"
      >
        {stores.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  )
}
