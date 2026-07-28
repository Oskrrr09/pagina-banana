import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Section, SectionHeader } from '../components/ui/Container'
import { Button, ButtonLink } from '../components/ui/Button'
import { Placeholder } from '../components/ui/Placeholder'
import { Reveal, StaggerGroup, StaggerItem } from '../components/ui/Reveal'
import { Accordion } from '../components/ui/Accordion'
import { Icon } from '../components/ui/Icon'
import { ProductCard } from '../components/product/ProductCard'
import { FinanceSimulator } from '../components/product/FinanceSimulator'
import { StoreCarousel } from '../components/home/StoreCarousel'
import { BentoShowcase } from '../components/home/BentoShowcase'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { families, iphoneModels, modelsByFamily } from '../data/products'
import { homeFaq } from '../data/content'
import { euro } from '../lib/format'

export function Home() {
  const [financeOpen, setFinanceOpen] = useState(false)
  const launches = iphoneModels.slice(0, 3)
  const offers = iphoneModels.filter((m) => m.colors[0].capacities[0].previousPrice != null).slice(0, 3)

  return (
    <>
      {/* 02 — Hero carrusel rotativo */}
      <HeroCarousel />

      {/* 02a — Franja de confianza */}
      <section className="border-y border-line bg-neutral">
        <Container className="grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {[
            { icon: 'store', title: '5 tiendas en Canarias', note: 'Recogida gratis y taller' },
            { icon: 'truck', title: 'Envío 24-48 h', note: 'Con seguimiento a toda Canarias' },
            { icon: 'credit-card', title: 'Financiación al 0 %', note: 'Hasta 24 meses' },
            { icon: 'shield', title: 'Servicio técnico oficial', note: 'Especialistas Apple' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-banana text-ink">
                <Icon name={item.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                <p className="truncate text-xs text-muted">{item.note}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* 02b — Bento de destacados (producto estrella + servicios clave) */}
      <Section>
        <SectionHeader eyebrow="Banana Computer" title="Todo lo Apple, cerca de ti" />
        <Reveal>
          <BentoShowcase />
        </Reveal>
      </Section>

      {/* 03 — Categorías principales (tiles grandes con foto) */}
      <Section>
        <SectionHeader title="Explora por categoría" desc="Toda la gama Apple organizada por familia." />
        <StaggerGroup className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-3 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-6">
          {families.map((fam) => {
            const cover = modelsByFamily[fam.slug]?.[0]?.colors[0].image
            const developed = Boolean(modelsByFamily[fam.slug])
            const to = developed ? `/${fam.slug}` : '/iphone'
            return (
              <StaggerItem key={fam.slug} className="w-44 shrink-0 snap-start sm:w-auto">
                <Link
                  to={to}
                  className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="grid aspect-square place-items-center overflow-hidden bg-neutral p-4">
                    {cover ? (
                      <img
                        src={cover}
                        alt={fam.name}
                        className="block h-full w-full object-contain object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                        loading="lazy"
                      />
                    ) : (
                      <Placeholder label={fam.name} ratio="1 / 1" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 text-center">
                    <p className="font-display text-base font-bold text-ink">{fam.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{fam.tagline}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      {developed ? `desde ${euro(fam.fromPrice)}` : 'Próximamente'}
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerGroup>
      </Section>

      {/* 04 — Lanzamientos */}
      <Section alt>
        <SectionHeader eyebrow="Novedades" title="Últimos lanzamientos" />
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {launches.map((m) => (
            <StaggerItem key={m.slug}>
              <ProductCard model={m} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      {/* 05 — Ofertas · Rincón del chollo */}
      {offers.length > 0 && (
        <Section>
          <SectionHeader eyebrow="Rincón del chollo" title="Ofertas destacadas" desc="Precios demostrativos, pendientes de validación." />
          <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((m) => (
              <StaggerItem key={m.slug}>
                <ProductCard model={m} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* 06 — Banner intermedio Plan Renove (acento amarillo) */}
      <section className="banana-surface bg-banana text-ink">
        <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/70">Plan Renove</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Hasta 400 € por tu iPhone actual.
            </h2>
            <p className="mt-3 max-w-md text-ink/85">
              Trae tu dispositivo Apple a cualquier tienda Banana, un especialista lo tasa y aplicamos
              el descuento sobre tu próxima compra. Sencillo, inmediato y con precio garantizado.
            </p>
            <p className="mt-2 text-xs text-ink/60">Tasación presencial · Cantidad demostrativa.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/plan-renove" variant="primary">
                <Icon name="refresh" size={18} /> Valorar mi dispositivo
              </ButtonLink>
              <ButtonLink to="/tiendas" variant="tertiary">
                Ver tiendas
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-3 items-end gap-3">
            <img
              src={`${import.meta.env.BASE_URL}img/products/17pro-plata.png`}
              alt=""
              className="col-span-2 row-start-1 aspect-square w-full object-contain drop-shadow-xl"
              loading="lazy"
            />
            <img
              src={`${import.meta.env.BASE_URL}img/products/watch-ultra-alpine.png`}
              alt=""
              className="col-start-3 row-start-1 aspect-square w-full self-center object-contain drop-shadow-xl"
              loading="lazy"
            />
          </div>
        </Container>
      </section>

      {/* 07 + 08 — Financiación y Plan Renove */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <Reveal className="flex flex-col justify-between rounded-[20px] border border-line bg-neutral p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink">Financiación</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Llévatelo hoy, págalo poco a poco</h2>
              <p className="mt-2 text-sm text-muted">Simulación de cuota — condiciones pendientes de validación.</p>
            </div>
            <div className="mt-6">
              <Button variant="secondary" onClick={() => setFinanceOpen(true)}>
                <Icon name="credit-card" size={18} /> Simular cuota
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col justify-between rounded-[20px] border border-line bg-neutral p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-ink">Plan Renove</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">Tu Apple actual vale más de lo que crees</h2>
              <p className="mt-2 text-sm text-muted">Tasación presencial en tienda.</p>
            </div>
            <div className="mt-6">
              <ButtonLink to="/plan-renove" variant="secondary">
                <Icon name="refresh" size={18} /> Valorar mi dispositivo
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Reserva para futuras opiniones verificadas */}
      <Section alt>
        <Reveal className="mx-auto flex min-h-48 max-w-2xl items-center justify-center rounded-[20px] border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="max-w-lg text-xl font-medium leading-relaxed text-muted sm:text-2xl">
            Espacio reservado para opiniones verificadas de clientes
          </p>
        </Reveal>
      </Section>

      {/* 09 — Tiendas físicas (carrusel) */}
      <Section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionHeader eyebrow="Estamos cerca" title="Tiendas físicas en Canarias" className="mb-0" />
          <ButtonLink to="/tiendas" variant="tertiary">
            Ver todas las tiendas <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </div>
        <Reveal>
          <StoreCarousel />
        </Reveal>
      </Section>

      {/* 11 — FAQ */}
      <Section alt>
        <div className="mx-auto max-w-3xl">
          <SectionHeader title="Preguntas frecuentes" />
          <Accordion items={homeFaq} />
        </div>
      </Section>

      {/* 13 — Newsletter */}
      <Section>
        <Reveal className="banana-surface bg-banana rounded-[20px] px-6 py-12 text-center text-ink sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">No te pierdas ninguna oferta</h2>
          <p className="mt-2 text-ink/70">Suscríbete y recibe las novedades antes que nadie.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:gap-3"
          >
            <input
              type="email"
              required
              placeholder="tu@email.com"
              aria-label="Tu correo electrónico"
              className="min-h-12 w-full min-w-0 flex-1 rounded-[12px] border-0 bg-white px-5 py-3 text-base text-[#1d1d1f] outline-none placeholder:text-[#6e6e73]"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-ink px-8 py-3 font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 sm:w-auto"
            >
              Suscribirme
            </button>
          </form>
          <p className="mt-3 text-xs text-ink/60">
            Demostración: el formulario no envía datos reales.
          </p>
        </Reveal>
      </Section>

      <FinanceSimulator
        open={financeOpen}
        onClose={() => setFinanceOpen(false)}
        price={iphoneModels.find((m) => m.slug === '17-pro')?.fromPrice ?? 1229}
        productName="iPhone 17 Pro (desde)"
      />
    </>
  )
}
