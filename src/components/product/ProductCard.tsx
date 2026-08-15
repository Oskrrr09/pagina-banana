import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { MAX_COMPARE, useStore } from '../../lib/store'
import { ProductImage } from './ProductImage'
import { ProvisionalBadge, OfferBadge } from '../ui/Tag'
import { Icon } from '../ui/Icon'
import { variantPath } from '../../data/products'
import { useCatalogo, useIdioma } from '../../lib/i18n'
import { presentacionDeTarjeta } from '../../lib/offers'

// Tarjeta de producto (§6): resume un modelo para decidir si entrar a la ficha.
// Precio y disponibilidad en texto, no solo en color. Favorito con estado.
export function ProductCard({ model, loading = false }: { model: Model; loading?: boolean }) {
  const { t, intl } = useIdioma()
  const cat = useCatalogo()
  const { toggleFavorite, isFavorite, toggleCompare, isComparing, compare } = useStore()
  const favId = `${model.family}/${model.slug}`
  const fav = isFavorite(favId)
  // La oferta se busca en todo el modelo, no sólo en su primera capacidad:
  // hay modelos rebajados en otra configuración —el MacBook Air M5, por
  // ejemplo—, y mirando sólo la de entrada se quedaban sin marcar. Imagen,
  // precio, precio anterior, porcentaje y enlace salen de la MISMA variante,
  // para no juntar el «desde» de una con el precio anterior —o la foto— de otra.
  const { oferta, color, capacity } = presentacionDeTarjeta(model)
  const destino = variantPath(model, color, capacity)

  // COMPARAR DESDE EL CATÁLOGO
  //
  // El comparador existía y no se alcanzaba desde aquí: había que saber que la
  // ruta `/comparar` existe. Ahora se añade desde la tarjeta.
  //
  // Lo que entra al comparador es **la variante que la tarjeta enseña**, no la
  // de entrada del modelo. Si la tarjeta pinta la configuración rebajada y el
  // comparador recibiera otra, el precio comparado no sería el que se acaba de
  // ver. Por eso `color` y `capacity` salen de `presentacionDeTarjeta`, igual
  // que la foto, el precio y el enlace.
  //
  // El identificador es el mismo que usa la ficha —familia/modelo/color/
  // capacidad—, así que añadir aquí y abrir la ficha después no duplica.
  //
  // EL «LLENO» ES POR FAMILIA, NO POR LONGITUD
  //
  // El comparador guarda una familia a la vez: al añadir uno de otra familia,
  // `toggleCompare` empieza una comparación nueva con él. Bloquear el botón
  // mirando sólo `compare.length >= 3` dejaba inservible el catálogo entero:
  // con tres iPhone guardados, TODOS los botones de /mac salían deshabilitados
  // y no había forma de llegar a esa sustitución que el store ya sabe hacer.
  const compareId = `${model.family}/${model.slug}/${color.color}/${capacity.capacity}`
  const comparando = isComparing(compareId)
  const comparadorLleno = compare.length >= MAX_COMPARE && compare[0].family === model.family && !comparando

  if (loading) {
    return (
      <div className="rounded-[12px] border border-line p-4">
        <div className="skeleton aspect-square w-full rounded-[12px]" />
        <div className="skeleton mt-4 h-4 w-2/3 rounded" />
        <div className="skeleton mt-2 h-5 w-1/3 rounded" />
      </div>
    )
  }

  return (
    <div
      data-product-card
      className="group relative flex h-full min-h-[400px] flex-col rounded-[12px] border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
    >
      <button
        onClick={() => toggleFavorite(favId)}
        aria-label={
          fav
            ? t('favorites.removeNamed', { nombre: cat(model.name) })
            : t('favorites.addNamed', { nombre: cat(model.name) })
        }
        aria-pressed={fav}
        className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-surface/80 text-muted backdrop-blur transition-colors hover:text-danger"
      >
        <Icon name="heart" className={fav ? 'fill-danger text-danger' : ''} />
      </button>

      {oferta && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          {oferta.descuento > 0 && (
            <span className="rounded-[10px] bg-danger px-2.5 py-1.5 text-sm font-extrabold leading-none text-white shadow-[var(--shadow-rest)]">
              -{oferta.descuento}%
            </span>
          )}
          <OfferBadge>{t('common.offer')}</OfferBadge>
        </div>
      )}

      <Link to={destino} className="block focus-visible:outline-none">
        <ProductImage
          src={color.image}
          alt={`${cat(model.name)} ${color.name}`}
          bgColor={color.imageBg}
          pad={!color.imageBg}
        />
        <h3 className="mt-4 min-h-10 text-[15px] font-semibold text-ink group-hover:text-ink">{cat(model.name)}</h3>
      </Link>

      <p className="mt-1 min-h-10 line-clamp-2 text-sm text-muted">{cat(model.tagline)}</p>

      <div className="mt-auto pt-3">
        {oferta ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold leading-none text-danger">{euro(oferta.precio, intl)}</span>
            <span className="text-sm font-semibold text-muted line-through decoration-2">
              {euro(oferta.precioAnterior, intl)}
            </span>
          </div>
        ) : (
          <span className="text-lg font-bold text-ink">
            {t('common.from', { precio: euro(model.fromPrice, intl) })}
          </span>
        )}
      </div>
      <div className="mt-2">
        <ProvisionalBadge label={t('common.demoPrice')} />
      </div>

      <button
        type="button"
        onClick={() =>
          toggleCompare({
            id: compareId,
            modelSlug: model.slug,
            family: model.family,
            name: model.name,
            color: color.name,
            capacity: capacity.capacity,
            price: capacity.price,
            specs: model.specs,
          })
        }
        // El nombre accesible no cambia al pulsar —dice de QUÉ modelo se
        // habla— y el estado lo lleva `aria-pressed`. Si el nombre cambiara,
        // un lector de pantalla anunciaría un botón distinto tras cada pulsación.
        aria-label={t('compare.toggleNamed', { nombre: cat(model.name) })}
        aria-pressed={comparando}
        disabled={comparadorLleno}
        className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          comparando ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink/30'
        }`}
      >
        <Icon name="compare" size={16} aria-hidden="true" />
        {comparando ? t('compare.added') : t('product.addToCompare')}
      </button>
      {comparadorLleno && <p className="mt-1 text-xs text-muted">{t('compare.full')}</p>}
      {/* La llamada a abrir el comparador NO vive aquí: es del listado.
          Pintándola dentro de cada tarjeta seleccionada aparecían dos enlaces
          idénticos con dos modelos comparados, y tres con tres. El catálogo la
          pinta una sola vez —ver `CatalogoFiltrable` en FamilyPage—. */}
    </div>
  )
}
