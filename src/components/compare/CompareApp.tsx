import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../../lib/i18n'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Icon } from '../ui/Icon'
import { ProductImage } from '../product/ProductImage'
import { ProvisionalBadge } from '../ui/Tag'
import { ModelPickerDialog } from './ModelPickerDialog'
import { useComparador } from './useComparador'
import { productImage, variantPath } from '../../data/products'
import { euro } from '../../lib/format'
import type { Model } from '../../data/types'

// ============================================================================
// EL COMPARADOR, EN LA APLICACIÓN NATIVA.
//
// POR QUÉ NO ES LA TABLA DE LA WEB MÁS ESTRECHA
//
// La web compara en columnas: A | B | C. En un teléfono esa metáfora no cabe.
// Medido a 320 px con tres productos, la tabla dejaba **424 px fuera de
// pantalla** tras un gesto horizontal sin ninguna señal. Comparar así obliga a
// sostener una cifra en la memoria mientras se arrastra para ver la otra: eso
// no es comparar, es recordar.
//
// Aquí la comparación es VERTICAL y por atributo. Cada característica es un
// bloque y dentro están los valores de los productos, uno por línea, con su
// identificación a la izquierda y el dato a la derecha. La diferencia se ve
// sin gesto y sin memoria. Con «Solo diferencias» —que sigue activo por
// defecto— son seis o siete bloques: una pantalla y media, no una tabla.
//
// EL MOTOR NO SE TOCA
//
// Qué se compara, qué difiere y quién gana cada atributo sale entero de
// `useComparador`, que es el mismo dominio que consume la web. Aquí sólo se
// decide qué se enseña y cómo se toca.
//
// SIN STICKY, A PROPÓSITO
//
// Es la primera versión: una cabecera pegajosa es una pieza que habría que
// validar en el teléfono antes de saber si hace falta. Si al usarlo se echa de
// menos el contexto, se decide entonces.
// ============================================================================

export function CompareApp() {
  const t = useT()
  const c = useComparador()
  const [picker, setPicker] = useState<{ modo: 'add' } | { modo: 'replace'; id: string; slug: string } | null>(null)

  // Producto, nombre, etiqueta, valores y destacados salen TODOS de
  // `comparables`. Antes las etiquetas se sacaban de `compare` en crudo
  // mientras los valores venían de los contextos ya filtrados, y un modelo
  // retirado desalineaba las dos listas sin lanzar ninguna excepción.
  const etiquetas = c.comparables.map((x) => x.etiqueta)

  return (
    <div data-cmp-app>
      <Container className="py-6">
        <h1 className="text-[26px] font-bold leading-tight text-ink">{t('compare.heading')}</h1>

        {c.vacio ? (
          <Vacio
            familia={c.familia?.name ?? ''}
            familias={c.familiasComparables}
            activa={c.familiaActiva}
            onFamilia={c.cambiarFamilia}
            onAnadir={() => setPicker({ modo: 'add' })}
          />
        ) : (
          <>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">{t('compare.intro')}</p>

            {/* RESUMEN — una superficie, una fila por producto. No tres
              tarjetas de catálogo: aquí sólo hace falta reconocerlo, saber
              cuánto cuesta y poder actuar. */}
            <ul data-cmp-resumen className="mt-5 overflow-hidden rounded-[16px] border border-line bg-surface">
              {c.comparables.map((resuelto, i) => {
                const { item, model, destacados } = resuelto
                return (
                  <li data-cmp-producto key={item.id} className="border-b border-line last:border-b-0 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-[68px] shrink-0">
                        <ProductImage
                          src={productImage(item.modelSlug, resuelto.color)}
                          alt={resuelto.nombre}
                          ratio="1 / 1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p data-cmp-nombre className="text-[15px] font-semibold leading-tight text-ink">
                          {resuelto.nombre}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {resuelto.capacidad} · {resuelto.color}
                        </p>
                        <p className="mt-1 text-[15px] font-bold text-ink">{euro(resuelto.precio)}</p>
                        {destacados.length > 0 && (
                          <p className="mt-1 text-xs font-semibold text-ink">{destacados.join(' · ')}</p>
                        )}
                      </div>
                    </div>

                    {/* Acciones con jerarquía: comprar manda, ver producto la
                      acompaña, y cambiar/quitar quedan como iconos rotulados. */}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="md"
                        paddingX="px-3"
                        className="min-w-0 flex-1"
                        onClick={() =>
                          c.addToCart({
                            id: item.id,
                            modelSlug: item.modelSlug,
                            family: item.family,
                            name: resuelto.nombre,
                            color: resuelto.color,
                            capacity: resuelto.capacidad,
                            price: resuelto.precio,
                            previousPrice: null,
                          })
                        }
                      >
                        Comprar
                      </Button>
                      {/* `model` está garantizado: `comparables` sólo trae los
                          que existen de verdad en el catálogo. */}
                      <Link
                        to={variantPath(model)}
                        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[12px] border border-line px-3 text-sm font-semibold text-ink"
                      >
                        Ver producto
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPicker({ modo: 'replace', id: item.id, slug: item.modelSlug })}
                        aria-label={`Cambiar ${resuelto.nombre} por otro modelo`}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-line text-ink"
                      >
                        <Icon name="refresh" size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => c.quitar(item.id)}
                        aria-label={`Quitar ${resuelto.nombre} de la comparación`}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-line text-danger"
                      >
                        <Icon name="close" size={18} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="sr-only">{`Producto ${i + 1} de ${c.comparables.length}`}</span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {!c.lleno && (
                <button
                  type="button"
                  data-model-picker-trigger
                  onClick={() => setPicker({ modo: 'add' })}
                  aria-label={t('compare.emptySlotAria', {
                    familia: c.familia?.name ?? '',
                    n: c.comparables.length + 1,
                  })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-[12px] border border-dashed border-brand px-4 text-sm font-semibold text-ink"
                >
                  <Icon name="plus" size={16} aria-hidden="true" />
                  Añadir otro producto
                </button>
              )}
              <ProvisionalBadge />
            </div>

            {c.comparables.length < 2 ? (
              <p className="mt-6 text-[15px] text-muted">Añade otro modelo para ver sus diferencias.</p>
            ) : (
              <>
                <div
                  role="group"
                  aria-label="Modo de visualización de la comparación"
                  className="mt-6 flex flex-wrap items-center gap-2"
                >
                  <Chip selected={c.soloDiferencias} onClick={() => c.setSoloDiferencias(true)}>
                    Solo diferencias
                  </Chip>
                  <Chip selected={!c.soloDiferencias} onClick={() => c.setSoloDiferencias(false)}>
                    Mostrar todas
                  </Chip>
                  <span className="sr-only" aria-live="polite">
                    {c.soloDiferencias
                      ? 'Mostrando solo diferencias'
                      : 'Mostrando todas las características esenciales'}
                  </span>
                </div>

                {c.secciones.length === 0 ? (
                  <p className="mt-6 text-[15px] text-muted">
                    Los modelos elegidos comparten los datos esenciales disponibles. Pulsa «Mostrar todas» para verlos.
                  </p>
                ) : (
                  c.secciones.map((seccion) => (
                    <section data-cmp-seccion key={seccion.title} className="mt-7">
                      <h2 data-cmp-titulo className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {seccion.title}
                      </h2>
                      <div className="mt-2 space-y-3">
                        {seccion.rows.map((fila) => (
                          <BloqueAtributo
                            key={fila.field}
                            campo={fila.field}
                            etiquetas={etiquetas}
                            valores={fila.values}
                            destacadoDe={(i) => c.destacadoEn(fila.field, i)}
                          />
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </>
            )}
          </>
        )}

        <ModelPickerDialog
          open={picker !== null}
          onClose={() => setPicker(null)}
          models={c.modelos}
          usedSlugs={c.slugsUsados}
          currentSlug={picker?.modo === 'replace' ? picker.slug : undefined}
          familyName={c.familia?.name ?? ''}
          mode={picker?.modo === 'replace' ? 'replace' : 'add'}
          onPick={(model: Model) => {
            if (picker?.modo === 'replace') c.sustituir(model, picker.id)
            else c.anadir(model)
          }}
        />
      </Container>
    </div>
  )
}

/** Un atributo: su nombre y, debajo, un valor por producto. */
function BloqueAtributo({
  campo,
  etiquetas,
  valores,
  destacadoDe,
}: {
  campo: string
  etiquetas: string[]
  valores: (string | null)[]
  destacadoDe: (i: number) => string | null
}) {
  return (
    <div data-cmp-atributo className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <p data-cmp-campo className="px-3 pt-2.5 text-sm font-semibold text-ink">
        {campo}
      </p>
      <ul>
        {etiquetas.map((etiqueta, i) => {
          const destacado = destacadoDe(i)
          return (
            <li data-cmp-valor key={etiqueta} className="flex items-start justify-between gap-3 px-3 py-2 last:pb-2.5">
              <span data-cmp-etiqueta className="min-w-0 shrink-0 basis-[38%] text-sm text-muted">
                {etiqueta}
              </span>
              <span className="min-w-0 flex-1 text-right">
                <span data-cmp-dato className="block text-sm font-semibold text-ink [overflow-wrap:anywhere]">
                  {valores[i] ?? '—'}
                </span>
                {destacado && (
                  <span data-cmp-destaca className="mt-0.5 block text-xs font-semibold text-available">
                    {destacado}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Sin nada que comparar: se explica y se ofrece por dónde empezar. */
function Vacio({
  familia,
  familias,
  activa,
  onFamilia,
  onAnadir,
}: {
  familia: string
  familias: { slug: string; name: string }[]
  activa: string
  onFamilia: (slug: string) => void
  onAnadir: () => void
}) {
  const t = useT()
  return (
    <div data-cmp-vacio className="mt-4">
      <p className="text-[15px] leading-relaxed text-muted">{t('compare.chooseUpTo', { familia })}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {familias.map((f) => (
          <Chip key={f.slug} selected={f.slug === activa} onClick={() => onFamilia(f.slug)}>
            {f.name}
          </Chip>
        ))}
      </div>
      <button
        type="button"
        data-model-picker-trigger
        onClick={onAnadir}
        aria-label={t('compare.emptySlotAria', { familia, n: 1 })}
        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-brand px-4 text-[15px] font-semibold text-ink"
      >
        <Icon name="plus" size={18} aria-hidden="true" />
        {t('compare.chooseModel')}
      </button>
      <p className="mt-3 text-sm text-muted">Añade productos para compararlos.</p>
      <Link
        to="/elige-tu-apple"
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-action px-4 text-sm font-semibold text-ink"
      >
        <Icon name="chat" size={16} aria-hidden="true" /> {t('compare.needHelp')}
      </Link>
    </div>
  )
}
