import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { Container } from '../ui/Container'
import { ButtonLink } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { ProductImage } from '../product/ProductImage'
import { ProvisionalBadge } from '../ui/Tag'
import { currentInventoryStateFor } from '../../lib/favoriteAlerts'
import { INVENTORY_LABELS } from '../../data/demoStoreInventory'
import { variantPath } from '../../data/products'
import { stores, getStore } from '../../data/stores'
import { allModels } from '../../data/products'
import { euro } from '../../lib/format'
import { useFavoritos } from './useFavoritos'
import type { Model } from '../../data/types'
import type { FavoriteAlert } from '../../lib/favoriteAlerts'

// ============================================================================
// FAVORITOS, EN LA APLICACIÓN NATIVA.
//
// QUÉ CAMBIA RESPECTO A LA WEB
//
// La web presenta cada favorito como una tarjeta de escaparate dentro de una
// rejilla, y dentro de esa tarjeta mete otra caja para la disponibilidad y una
// tercera para el seguimiento, con las acciones en pastillas de 28–30 px. En
// el móvil eso son cuatro niveles de superficie y controles que no se pueden
// pulsar sin apuntar.
//
// Aquí la lista es UNA superficie y cada favorito una fila dentro de ella,
// separada por divisores. La jerarquía visual la dan las líneas, no los
// marcos. El contrato no es «cero bordes»: un grupo puede tener el suyo. Lo
// que no puede haber es marco dentro de marco.
//
// LA GESTIÓN DEL SEGUIMIENTO SE DESPLIEGA, NO SE ABRE
//
// El estado normal enseña el resumen —a qué tienda se sigue y cómo está— y una
// sola acción para gestionarlo. Al pulsarla se despliega la lista de tiendas
// en la misma fila. No hace falta un modal para elegir entre cinco opciones, y
// un modal en un WebView es justo el tipo de pieza que luego hay que validar
// en el teléfono.
//
// EL COMPORTAMIENTO ES EL MISMO
//
// Nada de esto reimplementa el dominio: sale entero de `useFavoritos`, que es
// el mismo que usa la web. Aquí sólo se decide qué se enseña y cómo se toca.
// ============================================================================

export function FavoritesApp() {
  const t = useT()
  const {
    favModels,
    trackedAlerts,
    notifications,
    favoriteStoreSlug,
    getAlertForProduct,
    quitar,
    seguir,
    disableAlert,
    changeAlertStore,
    simulateArrival,
    markRead,
    markAllRead,
  } = useFavoritos()

  return (
    <Container className="py-6">
      <h1 className="text-[26px] font-bold leading-tight text-ink">Favoritos</h1>
      <p className="mt-1 text-[15px] leading-relaxed text-muted">{t('favorites.intro')}</p>

      {favModels.length === 0 ? (
        <Vacio />
      ) : (
        <>
          <ul data-fav-lista className="mt-6 overflow-hidden rounded-[16px] border border-line bg-surface">
            {favModels.map((model) => (
              <FilaFavorito
                key={model.slug}
                model={model}
                favoriteStoreSlug={favoriteStoreSlug}
                alert={getAlertForProduct(`${model.family}/${model.slug}`)}
                onQuitar={() => quitar(`${model.family}/${model.slug}`)}
                onSeguir={(storeSlug) => seguir(`${model.family}/${model.slug}`, storeSlug)}
                onDejarDeSeguir={() => disableAlert(`${model.family}/${model.slug}`)}
              />
            ))}
          </ul>
          {/* El aviso de precio demostrativo, una vez y al pie de la lista.
              En la web va una insignia por tarjeta; aquí eso serían tantas
              pastillas como productos, que es la densidad que se está
              quitando. */}
          <p className="mt-2 px-1 text-xs text-muted">{t('common.demoPrice')} — precios y disponibilidad de ejemplo.</p>

          {trackedAlerts.length > 0 && (
            <section aria-labelledby="fav-avisos" className="mt-8">
              <h2 id="fav-avisos" className="text-[17px] font-bold text-ink">
                Mis avisos
              </h2>
              <p className="mt-1 text-sm text-muted">Simulación demostrativa — nada de correos ni datos personales.</p>
              <ul data-fav-avisos className="mt-3 overflow-hidden rounded-[16px] border border-line bg-surface">
                {trackedAlerts.map((alert) => {
                  const model = allModels.find((m) => `${m.family}/${m.slug}` === alert.productId)
                  const store = getStore(alert.storeSlug)
                  if (!model || !store) return null
                  return (
                    <FilaAviso
                      key={alert.productId}
                      nombre={model.name}
                      tienda={store.name}
                      estado={INVENTORY_LABELS[currentInventoryStateFor(store.slug, alert.productId)].short}
                      onSimular={() => simulateArrival(alert.productId, model.name)}
                      onCambiarTienda={(slug) => changeAlertStore(alert.productId, slug)}
                      onDesactivar={() => disableAlert(alert.productId)}
                      tiendaActual={store.slug}
                    />
                  )
                })}
              </ul>
              <p className="mt-2 px-1 text-xs text-muted">
                Simulación: no representa stock real. En una versión conectada al inventario y al sistema de
                comunicaciones, este aviso también podría enviarse por email.
              </p>
            </section>
          )}

          {notifications.length > 0 && (
            <section aria-labelledby="fav-notificaciones" className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="fav-notificaciones" className="text-[17px] font-bold text-ink">
                  Notificaciones
                </h2>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="-mr-2 inline-flex min-h-11 items-center rounded-[10px] px-2 text-sm font-semibold text-ink"
                >
                  Marcar todas como leídas
                </button>
              </div>
              <ul data-fav-notificaciones className="mt-3 overflow-hidden rounded-[16px] border border-line bg-surface">
                {notifications.map((n) => (
                  <FilaNotificacion
                    key={n.id}
                    mensaje={n.message}
                    tienda={getStore(n.storeSlug)?.name ?? n.storeSlug}
                    fecha={new Date(n.createdAt).toLocaleString('es-ES')}
                    leida={n.read}
                    onLeer={() => markRead(n.id)}
                  />
                ))}
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

/** Sin favoritos: se explica y se ofrece por dónde empezar. */
function Vacio() {
  const t = useT()
  return (
    <div data-fav-vacio className="mt-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-neutral text-muted">
        <Icon name="heart" size={26} />
      </div>
      <p className="mt-4 text-[15px] text-muted">Aún no has guardado ningún producto.</p>
      <p className="mt-1 text-sm text-muted">El corazón de cualquier producto lo guarda aquí para volver a verlo.</p>
      {/* A ancho completo y en columna: son las dos salidas, y en el móvil
          compiten mal en fila. */}
      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
        <ButtonLink to="/iphone" size="lg" className="w-full">
          Explorar iPhone
        </ButtonLink>
        <ButtonLink to="/elige-tu-apple" variant="secondary" size="lg" className="w-full">
          {t('favorites.finderCta')}
        </ButtonLink>
      </div>
    </div>
  )
}

/**
 * Un favorito: la fila que lleva al producto y, debajo, sus dos acciones.
 *
 * La fila entera es el enlace —no una miniatura y además un «Ver producto» de
 * 30 px al lado—, así que el objetivo táctil para entrar en la ficha es todo
 * lo ancho de la pantalla.
 */
function FilaFavorito({
  model,
  favoriteStoreSlug,
  alert,
  onQuitar,
  onSeguir,
  onDejarDeSeguir,
}: {
  model: Model
  favoriteStoreSlug: string | null
  alert: FavoriteAlert | null
  onQuitar: () => void
  onSeguir: (storeSlug: string) => void
  onDejarDeSeguir: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  const productId = `${model.family}/${model.slug}`
  const slugActivo = alert?.storeSlug ?? favoriteStoreSlug
  const tienda = slugActivo ? getStore(slugActivo) : null
  const estado = tienda ? INVENTORY_LABELS[currentInventoryStateFor(tienda.slug, productId)] : null
  const siguiendo = Boolean(alert?.enabled)

  return (
    <li data-fav-item className="border-b border-line last:border-b-0">
      <Link to={variantPath(model)} className="flex min-h-[88px] items-center gap-3 p-3">
        <div className="w-[76px] shrink-0">
          <ProductImage src={model.colors[0].image} alt={model.name} ratio="1 / 1" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-tight text-ink">{model.name}</h3>
          <p className="mt-0.5 text-sm text-muted">desde {euro(model.fromPrice)}</p>
          {estado && tienda && (
            <p className="mt-1 text-xs text-muted">
              <span className="font-semibold text-ink">{estado.short}</span> · {tienda.name}
            </p>
          )}
        </div>
        <Icon name="chevron-right" size={18} className="shrink-0 text-muted" aria-hidden="true" />
      </Link>

      <div className="flex items-stretch border-t border-line">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="flex min-h-12 flex-1 items-center gap-2 px-3 text-left text-sm font-semibold text-ink"
        >
          <Icon name={siguiendo ? 'check' : 'info'} size={16} aria-hidden="true" />
          <span className="min-w-0 truncate">
            {siguiendo && tienda ? `Siguiendo en ${tienda.name}` : 'Seguir disponibilidad'}
          </span>
        </button>
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar ${model.name} de favoritos`}
          className="grid min-h-12 w-14 shrink-0 place-items-center border-l border-line text-danger"
        >
          <Icon name="heart" size={18} aria-hidden="true" />
        </button>
      </div>

      {abierto && (
        <ListaDeTiendas
          activa={siguiendo ? (tienda?.slug ?? null) : null}
          favorita={favoriteStoreSlug}
          onElegir={(slug) => {
            onSeguir(slug)
            setAbierto(false)
          }}
          onDejarDeSeguir={
            siguiendo
              ? () => {
                  onDejarDeSeguir()
                  setAbierto(false)
                }
              : undefined
          }
        />
      )}
    </li>
  )
}

/** Un aviso activo, con sus tres acciones a tamaño de dedo. */
function FilaAviso({
  nombre,
  tienda,
  estado,
  tiendaActual,
  onSimular,
  onCambiarTienda,
  onDesactivar,
}: {
  nombre: string
  tienda: string
  estado: string
  tiendaActual: string
  onSimular: () => void
  onCambiarTienda: (slug: string) => void
  onDesactivar: () => void
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <li data-fav-aviso className="border-b border-line last:border-b-0">
      <div className="flex min-h-14 items-center gap-3 px-3 py-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
          <Icon name="info" size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-tight text-ink">{nombre}</p>
          <p className="mt-0.5 text-xs text-muted">
            {tienda} · {estado}
          </p>
        </div>
      </div>
      <div className="flex items-stretch border-t border-line text-sm font-semibold">
        <button type="button" onClick={onSimular} className="min-h-12 flex-1 px-2 text-ink">
          Simular llegada
        </button>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="min-h-12 flex-1 border-l border-line px-2 text-ink"
        >
          Cambiar tienda
        </button>
        <button type="button" onClick={onDesactivar} className="min-h-12 flex-1 border-l border-line px-2 text-danger">
          Desactivar
        </button>
      </div>
      {abierto && (
        <ListaDeTiendas
          activa={tiendaActual}
          favorita={null}
          onElegir={(slug) => {
            onCambiarTienda(slug)
            setAbierto(false)
          }}
        />
      )}
    </li>
  )
}

/** Una notificación. La acción de leerla vive en su fila, no en una pastilla. */
function FilaNotificacion({
  mensaje,
  tienda,
  fecha,
  leida,
  onLeer,
}: {
  mensaje: string
  tienda: string
  fecha: string
  leida: boolean
  onLeer: () => void
}) {
  return (
    <li data-fav-notificacion className={`border-b border-line last:border-b-0 ${leida ? '' : 'bg-brand-050'}`}>
      <div className="px-3 py-2.5">
        <p className={`text-sm font-semibold ${leida ? 'text-muted' : 'text-ink'}`}>{mensaje}</p>
        <p className="mt-0.5 text-xs text-muted">
          {tienda} · {fecha}
        </p>
      </div>
      {!leida && (
        <button
          type="button"
          onClick={onLeer}
          className="min-h-12 w-full border-t border-line px-3 text-left text-sm font-semibold text-ink"
        >
          Marcar como leído
        </button>
      )}
    </li>
  )
}

/**
 * Las tiendas, como filas pulsables dentro de la misma superficie.
 *
 * Sin `<select>`: el desplegable del sistema es el control de escritorio que
 * más delata una web dentro de una app, y aquí sobra porque son cinco
 * opciones que caben.
 */
function ListaDeTiendas({
  activa,
  favorita,
  onElegir,
  onDejarDeSeguir,
}: {
  activa: string | null
  favorita: string | null
  onElegir: (slug: string) => void
  onDejarDeSeguir?: () => void
}) {
  const t = useT()
  return (
    <div data-fav-tiendas className="border-t border-line bg-neutral">
      <p className="px-3 pt-2.5 text-xs text-muted">{t('favorites.chooseStoreNote')}</p>
      <ul>
        {stores.map((store) => (
          <li key={store.slug}>
            <button
              type="button"
              onClick={() => onElegir(store.slug)}
              className="flex min-h-12 w-full items-center justify-between gap-2 px-3 text-left text-sm text-ink"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{store.name}</span>
                <span className="block truncate text-xs text-muted">{store.island}</span>
              </span>
              {store.slug === activa ? (
                <Icon name="check" size={18} className="shrink-0 text-ink" aria-hidden="true" />
              ) : (
                store.slug === favorita && (
                  <span className="shrink-0 text-xs font-bold uppercase text-muted">Tu tienda</span>
                )
              )}
            </button>
          </li>
        ))}
      </ul>
      {onDejarDeSeguir && (
        <button
          type="button"
          onClick={onDejarDeSeguir}
          className="min-h-12 w-full border-t border-line px-3 text-left text-sm font-semibold text-danger"
        >
          Dejar de seguir
        </button>
      )}
      {!favorita && (
        <p className="px-3 pb-2.5 text-xs text-muted">
          Si aún no tienes tienda favorita, se guardará también como tal al elegirla.
        </p>
      )}
    </div>
  )
}
