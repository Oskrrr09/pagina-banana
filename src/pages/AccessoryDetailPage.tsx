import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Button, ButtonLink } from '../components/ui/Button'
import { useStore } from '../lib/store'
import { conNegritas, useCatalogo, useT } from '../lib/i18n'
import { ProvisionalBadge } from '../components/ui/Tag'
import { euro } from '../lib/format'
import { getAccessory, appleAccessories } from '../data/accessories'
import type { Accessory } from '../data/accessories'
import { allModels } from '../data/products'
import { AccessoryImage } from '../components/product/AccessoryImage'

// Ficha de detalle de un accesorio (§4.5). Muestra galería con variantes,
// especificaciones, compatibilidad estructurada, avisos de precio y
// disponibilidad demostrativos y CTAs a tiendas y soporte. NO integra
// carrito, favoritos, comparador ni seguro.

export function AccessoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const accessory = slug ? getAccessory(slug) : undefined
  if (!accessory) return <Navigate to="/accesorios" replace />
  return <AccessoryDetail accessory={accessory} />
}

function AccessoryDetail({ accessory }: { accessory: Accessory }) {
  const [activeVariant, setActiveVariant] = useState(0)
  const variant = accessory.variants[activeVariant] ?? accessory.variants[0]
  const price = variant.price ?? accessory.price
  const { addToCart } = useStore()
  const t = useT()
  const cat = useCatalogo()

  const cartId = `accessory:${accessory.slug}/${variant.slug}`

  function handleAddToCart() {
    if (price == null) return
    addToCart({
      id: cartId,
      modelSlug: accessory.slug,
      family: 'accesorios',
      name:
        accessory.variants.length > 1
          ? `${cat(accessory.name)} · ${cat(variant.label)}`
          : cat(accessory.name),
      color: '',
      capacity: '',
      price,
      previousPrice: accessory.previousPrice ?? null,
      kind: 'accessory',
      image: variant.image,
    })
  }

  const compatibleModels = useMemo(
    () =>
      (accessory.compatibility.models ?? [])
        .map((id) => allModels.find((m) => `${m.family}/${m.slug}` === id))
        .filter((m): m is (typeof allModels)[number] => Boolean(m)),
    [accessory.compatibility.models],
  )

  return (
    <Container className="py-10">
      <nav aria-label={t('accessory.route')} className="text-sm text-muted">
        <Link to="/" className="hover:text-ink">
          {t('accessory.home')}
        </Link>{' '}
        /{' '}
        <Link to="/accesorios" className="hover:text-ink">
          {t('accessories.kicker')}
        </Link>{' '}
        / <span className="text-ink">{cat(accessory.name)}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        {/* Galería */}
        <section aria-label={t('accessory.gallery')}>
          <div className="overflow-hidden rounded-[16px] border border-line">
            <AccessoryImage
              src={variant.image}
              alt={t('accessory.variantAlt', { nombre: cat(accessory.name), variante: cat(variant.label) })}
              size="hero"
              presentation={accessory.imagePresentation}
              imageBg={accessory.imageBg}
              width={1200}
              height={1200}
              loading="eager"
            />
          </div>
          {accessory.variants.length > 1 && (
            <div
              role="radiogroup"
              aria-label={t('accessory.variants')}
              className="mt-4 flex flex-wrap gap-2"
            >
              {accessory.variants.map((v, i) => {
                const active = i === activeVariant
                return (
                  <button
                    key={v.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setActiveVariant(i)}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${
                      active
                        ? 'border-ink bg-ink text-surface'
                        : 'border-line bg-surface text-ink hover:border-ink/30'
                    }`}
                  >
                    {v.swatch && (
                      <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 rounded-full border border-black/10"
                        style={{ background: v.swatch }}
                      />
                    )}
                    {cat(v.label)}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Info */}
        <section aria-labelledby="accessory-title">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            {t('accessory.kicker')}
          </p>
          <h1 id="accessory-title" className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">
            {cat(accessory.name)}
          </h1>
          <p className="mt-2 text-muted">{cat(accessory.tagline)}</p>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {price != null ? (
              <>
                <p className="text-2xl font-bold text-ink">{euro(price)}</p>
                <ProvisionalBadge />
              </>
            ) : (
              <p className="text-lg font-semibold text-ink">{t('accessory.askPrice')}</p>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">{cat(accessory.availabilityLabel)}</p>

          <p className="mt-5 text-[15px] leading-relaxed text-ink">
            {cat(accessory.description)}
          </p>

          {accessory.highlights.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-ink">
              {accessory.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Icon name="check" size={14} className="mt-1 shrink-0 text-ink" aria-hidden="true" />
                  <span>{cat(h)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {price != null && (
              <Button variant="primary" onClick={handleAddToCart}>
                {t('common.addToCart')}
              </Button>
            )}
            <ButtonLink to="/tiendas" variant="secondary">
              {t('accessory.checkStores')}
            </ButtonLink>
            <a
              href="#compat"
              className="inline-flex items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              {t('accessory.seeCompatible')}
            </a>
          </div>

          <p className="mt-6 text-xs text-muted">
            {conNegritas(t('accessory.priceNote', { fecha: accessory.verifiedOn }))}
          </p>
        </section>
      </div>

      {/* Especificaciones */}
      <section aria-labelledby="specs" className="mt-12">
        <h2 id="specs" className="text-xl font-bold text-ink">
          {t('accessory.specs')}
        </h2>
        <dl className="mt-4 grid gap-y-2 gap-x-8 sm:grid-cols-2">
          {accessory.specs.map((s) => (
            <div key={s.label} className="border-b border-line py-2">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted">
                {cat(s.label)}
              </dt>
              <dd className="text-sm text-ink">{cat(s.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Compatibilidad */}
      <section aria-labelledby="compat" className="mt-12" id="compat">
        <h2 id="compat" className="text-xl font-bold text-ink">
          {t('accessories.compatibility')}
        </h2>
        <div className="mt-4 space-y-3 text-sm text-ink">
          {accessory.compatibility.models && accessory.compatibility.models.length > 0 && (
            <div>
              <p className="font-semibold">{t('accessory.compatModels')}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {accessory.compatibility.models.map((m) => {
                  const [family, modelSlug] = m.split('/')
                  return (
                    <li key={m}>
                      <Link
                        to={`/${family}`}
                        className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink hover:border-ink/30"
                      >
                        {family} · {modelSlug.replace(/-/g, ' ')}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {accessory.compatibility.families && accessory.compatibility.families.length > 0 && (
            <div>
              <p className="font-semibold">{t('accessory.compatFamilies')}</p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {accessory.compatibility.families.map((f) => (
                  <li key={f}>
                    <Link
                      to={`/${f}`}
                      className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink hover:border-ink/30"
                    >
                      {f}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {accessory.compatibility.notes && accessory.compatibility.notes.length > 0 && (
            <div>
              <p className="font-semibold">{t('accessory.notes')}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {accessory.compatibility.notes.map((n) => (
                  <li key={n}>{cat(n)}</li>
                ))}
              </ul>
            </div>
          )}
          {compatibleModels.length > 0 && (
            <div className="pt-2">
              <p className="font-semibold">{t('accessory.catalogDevices')}</p>
              <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {compatibleModels.map((m) => (
                  <li key={`${m.family}/${m.slug}`}>
                    <Link
                      to={`/${m.family}/${m.slug}`}
                      className="flex items-center gap-2 rounded-[8px] border border-line bg-surface px-3 py-2 text-sm text-ink hover:border-ink/30"
                    >
                      <Icon name="chevron-right" size={14} className="text-muted" aria-hidden="true" />
                      {m.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Otros accesorios */}
      <RelatedAccessories current={accessory} />
    </Container>
  )
}

function RelatedAccessories({ current }: { current: Accessory }) {
  const t = useT()
  const cat = useCatalogo()
  const others = appleAccessories.filter(
    (a) => a.slug !== current.slug && a.category === current.category,
  )
  if (others.length === 0) return null
  return (
    <section aria-labelledby="related" className="mt-12">
      <h2 id="related" className="text-xl font-bold text-ink">
        {t('accessory.related')}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {others.slice(0, 6).map((a) => (
          <li key={a.slug}>
            <Link
              to={`/accesorios/${a.slug}`}
              className="flex items-center gap-3 rounded-[12px] border border-line bg-surface p-3 hover:border-ink/30"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px]">
                <AccessoryImage
                  src={a.image}
                  alt=""
                  size="thumb"
                  presentation={a.imagePresentation}
                  imageBg={a.imageBg}
                  width={80}
                  height={80}
                />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {cat(a.name)}
                </span>
                {a.price != null && (
                  <span className="text-xs text-muted">{euro(a.price)}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
