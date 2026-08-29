import { Link } from 'react-router-dom'
import type { Model } from '../../data/types'
import { euro } from '../../lib/format'
import { ProductImage } from './ProductImage'
import { Icon } from '../ui/Icon'
import { useTarjetaDeProducto } from './useTarjetaDeProducto'

/**
 * Tarjeta de producto de rejilla, **dentro de la app** (§6).
 *
 * FASE B1 — «EL PRODUCTO RESPIRA»
 *
 * Esta composición nació en la PR #87 siendo una copia exacta de la web, porque
 * aquella entrega sólo construía la frontera. Aquí se cruza: la tarjeta nativa
 * evoluciona y **la web se queda como estaba**.
 *
 * Lo que había: borde de tarjeta, dentro una caja gris para la imagen, y dentro
 * el producto con su propio relleno. Tres marcos concéntricos para vender un
 * aparato. Debajo, nombre y descripción con altura reservada para dos líneas
 * cada uno, precio discreto, un distintivo gris de «precio demostrativo» en
 * cada tarjeta y un botón de comparar del ancho completo. Medido a 320×568: la
 * tarjeta ocupaba 510 px y **el precio no llegaba a verse**.
 *
 * Ahora la única superficie es la de la imagen, y debajo van sólo el nombre y
 * el precio. Las acciones son iconos sobre la foto.
 *
 * POR QUÉ LA IMAGEN NO ES CUADRADA, Y POR QUÉ NO ES 4:3
 *
 * A 320 px la imagen ocupa el ancho completo, así que su proporción decide el
 * alto de la tarjeta entera. Con 1:1 el producto se ve enorme pero empuja el
 * precio fuera de la pantalla —medido: 288 px de foto y 0 de precio—. El diseño
 * de Fase B proponía 4:3, que lo arreglaba dejando la foto en 216 px.
 *
 * Se usa **5:4**: es el punto donde el precio entra **y** la fotografía
 * conserva más presencia que con 4:3. La diferencia con el baseline de Fase A
 * es de unos pocos píxeles de alto, y a cambio la tarjeta pasa de 510 px a algo
 * más de la mitad, con lo que el segundo producto asoma. El aparato se sigue
 * viendo entero: `object-contain` no recorta, sólo se retira el aire vertical
 * muerto que rodeaba al PNG dentro del cuadrado.
 *
 * El contrato de Fase A —imagen ≥ 120 px, nombre ≥ 12— lo sigue vigilando
 * `tests/e2e/producto-en-pantalla.spec.ts`, y 120 nunca fue el objetivo.
 *
 * El comportamiento no cambia: variante enseñada, oferta, destino, favorito y
 * comparación siguen viniendo de `useTarjetaDeProducto`, igual que en la web.
 */
export function ProductCardApp({
  model,
  loading = false,
  priority = false,
}: {
  model: Model
  loading?: boolean
  /**
   * `true` sólo para la primera tarjeta del catálogo, que vive sobre el
   * pliegue. El resto sigue en carga diferida.
   */
  priority?: boolean
}) {
  const {
    t,
    intl,
    nombre,
    color,
    oferta,
    destino,
    favorito,
    alternarFavorito,
    comparando,
    comparadorLleno,
    alternarComparar,
    etiquetaFavorito,
    etiquetaComparar,
  } = useTarjetaDeProducto(model)

  if (loading) {
    return (
      <div>
        <div className="skeleton w-full rounded-[16px]" style={{ aspectRatio: '5 / 4' }} />
        <div className="skeleton mt-3 h-5 w-2/3 rounded" />
        <div className="skeleton mt-2 h-6 w-1/3 rounded" />
      </div>
    )
  }

  return (
    <div data-product-card data-product-card-surface="app" className="group relative flex h-full flex-col">
      {/* UN SOLO ENLACE POR TARJETA
          La imagen, el nombre y el precio van dentro del mismo `Link`: son el
          mismo destino. Partirlos en dos enlaces duplicaba la entrada para
          lectores de pantalla y rompía el contrato que ya lo exigía
          —`app-atras.spec.ts`: «la tarjeta tiene un único enlace a su ficha»—.
          Las acciones quedan fuera del enlace, colocadas encima de la foto. */}
      <Link to={destino} className="block focus-visible:outline-none">
        <ProductImage
          src={color.image}
          alt={`${nombre} ${color.name}`}
          ratio="5 / 4"
          bgColor={color.imageBg}
          pad={false}
          priority={priority}
          className="rounded-[16px]"
        />

        {/* NOMBRE Y PRECIO SON UN SOLO BLOQUE
            Antes los separaba una descripción de dos líneas reservadas. Es
            buena redacción, pero en el catálogo no decide nada —quien compara
            iPhone ya sabe cuál es el grande— y costaba 40 px por tarjeta. Vive
            en la ficha, que es donde ayuda. Tampoco hay altura reservada: en
            una sola columna no hay nada que alinear. */}
        <h3 className="mt-3 text-[17px] font-semibold leading-tight text-ink">{nombre}</h3>
        {oferta ? (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold leading-none text-danger">{euro(oferta.precio, intl)}</span>
            <span className="text-sm font-semibold text-muted line-through decoration-2">
              {euro(oferta.precioAnterior, intl)}
            </span>
          </div>
        ) : (
          <span className="mt-1 block text-xl font-extrabold leading-none text-ink">
            {t('common.from', { precio: euro(model.fromPrice, intl) })}
          </span>
        )}
      </Link>

      {/* Sólo el porcentaje. «Oferta» junto a un `-15%` rojo decía dos veces lo
          mismo con dos elementos del mismo color. */}
      {oferta && oferta.descuento > 0 && (
        <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[11px] font-extrabold leading-tight text-white">
          -{oferta.descuento}%
        </span>
      )}

      {/* LAS ACCIONES VIVEN SOBRE LA FOTO, NO DEBAJO
          «Comparar» era un botón del ancho de la tarjeta: la pieza más pesada
          después de la imagen, siendo la acción menos frecuente. Pasa a icono
          junto al favorito, conservando su nombre accesible —el mismo que
          antes, para no anunciar un botón distinto tras cada pulsación—, su
          `aria-pressed` y sus 44 px de lado. */}
      <div className="absolute right-0 top-0 flex">
        <button
          type="button"
          onClick={alternarFavorito}
          aria-label={etiquetaFavorito}
          aria-pressed={favorito}
          className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:text-danger"
        >
          <Icon name="heart" size={20} className={favorito ? 'fill-danger text-danger' : ''} />
        </button>
        <button
          type="button"
          onClick={alternarComparar}
          aria-label={etiquetaComparar}
          aria-pressed={comparando}
          disabled={comparadorLleno}
          className={`grid h-11 w-11 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            comparando ? 'text-ink' : 'text-muted'
          }`}
        >
          {/* El estado seleccionado no depende sólo del color: el icono se
              asienta sobre un disco de tinta, que se distingue también sin
              percibir bien el contraste. */}
          <span className={`grid h-8 w-8 place-items-center rounded-full ${comparando ? 'bg-ink text-white' : ''}`}>
            <Icon name="compare" size={18} aria-hidden="true" />
          </span>
        </button>
      </div>

      {comparadorLleno && <p className="mt-1 text-xs text-muted">{t('compare.full')}</p>}
      {/* El aviso de precios demostrativos ya no se repite en cada tarjeta: lo
          pinta el listado una sola vez. Ver `AppFamilyPage`. */}
    </div>
  )
}
