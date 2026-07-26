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
import { ProductImage } from '../components/product/ProductImage'
import { StoreCarousel } from '../components/home/StoreCarousel'
import { BentoShowcase } from '../components/home/BentoShowcase'
import { families, iphoneModels, modelsByFamily } from '../data/products'
import { advantages, homeFaq } from '../data/content'

export function Home() {
  const [financeOpen, setFinanceOpen] = useState(false)
  const launches = iphoneModels.slice(0, 3)
  const offers = iphoneModels.filter((m) => m.colors[0].capacities[0].previousPrice != null).slice(0, 3)

  return (
    <>
      {/* 02 — Campaña principal (banner real de Banana) */}
      <section className="bg-ink">
        <Link to="/iphone/17-pro" className="group relative mx-auto block max-w-[1400px]">
          <picture>
            <source media="(min-width: 768px)" srcSet={`${import.meta.env.BASE_URL}img/hero-17pro-desktop.png`} />
            <img
              src={`${import.meta.env.BASE_URL}img/hero-17pro-mobile.png`}
              alt="iPhone 17 Pro, ya en Banana"
              className="mx-auto block w-full"
              fetchPriority="high"
            />
          </picture>
          <span className="absolute right-4 top-4">
            <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink">
              Contenido provisional
            </span>
          </span>
        </Link>
      </section>

      {/* 02b — Bento de destacados (producto estrella + servicios clave) */}
      <Section>
        <SectionHeader eyebrow="Banana Computer" title="Todo lo Apple, cerca de ti" />
        <Reveal>
          <BentoShowcase />
        </Reveal>
      </Section>

      {/* 03 — Categorías principales (carrusel) */}
      <Section>
        <SectionHeader title="Explora por categoría" />
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 py-3 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {families.map((fam) => {
            const cover = modelsByFamily[fam.slug]?.[0]?.colors[0].image
            const to = modelsByFamily[fam.slug] ? `/${fam.slug}` : '/iphone'
            return (
              <Link
                key={fam.slug}
                to={to}
                className="group w-40 shrink-0 snap-start rounded-[12px] border border-line bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-banana hover:shadow-[var(--shadow-raised)] sm:w-auto"
              >
                {cover ? (
                  <ProductImage src={cover} alt={fam.name} ratio="1 / 1" />
                ) : (
                  <Placeholder label={fam.name} ratio="1 / 1" />
                )}
                <p className="mt-3 text-sm font-semibold text-ink group-hover:text-ink">{fam.name}</p>
              </Link>
            )
          })}
        </div>
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

      {/* 06 — Ventajas (franja de confianza) */}
      <section className="banana-surface bg-banana text-ink">
        <Container className="grid grid-cols-2 gap-8 py-10 lg:grid-cols-4">
          {advantages.map((a) => (
            <div key={a.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/10 text-ink">
                <Icon name={a.icon} />
              </span>
              <div>
                <p className="font-semibold leading-tight">{a.title}</p>
                <p className="mt-0.5 text-xs text-ink/70">{a.note}</p>
              </div>
            </div>
          ))}
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
