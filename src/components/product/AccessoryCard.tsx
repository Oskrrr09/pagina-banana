import { Link } from 'react-router-dom'
import { ProvisionalBadge } from '../ui/Tag'
import { euro } from '../../lib/format'
import type { Accessory } from '../../data/accessories'
import { accessoryPath } from '../../data/accessories'
import { ProductImage } from './ProductImage'

// Tarjeta de accesorio (§4.5). Comparte la jerarquía visual con
// `ProductCard` (mismo borde, radio, padding, altura mínima, hover,
// sombra) para que en el catálogo y en el buscador los accesorios se
// perciban como productos del mismo nivel.
//
// NO añade favoritos, carrito, comparador ni seguro — los accesorios
// no participan en esos flujos en esta fase.
export function AccessoryCard({ accessory }: { accessory: Accessory }) {
  return (
    <div className="group relative flex h-full min-h-[400px] flex-col rounded-[12px] border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]">
      <Link
        to={accessoryPath(accessory.slug)}
        className="block focus-visible:outline-none"
        aria-label={accessory.name}
      >
        {/* Imagen decorativa dentro del enlace: el nombre lo aporta el
            aria-label del Link + el h3. Alt vacío evita el aviso
            `image-redundant-alt` de axe. */}
        <ProductImage
          src={accessory.image}
          alt=""
          bgColor={accessory.imageBg}
          pad={!accessory.imageBg}
          blend={!accessory.imageBg}
        />
        <h3 className="mt-4 min-h-10 text-[15px] font-semibold text-ink group-hover:text-ink">
          {accessory.name}
        </h3>
      </Link>

      <p className="mt-1 min-h-10 line-clamp-2 text-sm text-muted">{accessory.tagline}</p>

      <div className="mt-auto pt-3">
        {accessory.price != null ? (
          <span className="text-lg font-bold text-ink">
            {accessory.priceLabel === 'desde' ? 'desde ' : ''}
            {euro(accessory.price)}
          </span>
        ) : (
          <span className="text-lg font-bold text-ink">Consultar precio</span>
        )}
      </div>
      {accessory.price != null && (
        <div className="mt-2">
          <ProvisionalBadge label="Precio demostrativo" />
        </div>
      )}
    </div>
  )
}

