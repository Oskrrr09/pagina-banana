import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Section, SectionHeader } from '../components/ui/Container'
import { Button, ButtonLink } from '../components/ui/Button'
import { Placeholder } from '../components/ui/Placeholder'
import { ProvisionalBadge, OfferBadge } from '../components/ui/Tag'
import { Reveal, StaggerGroup, StaggerItem } from '../components/ui/Reveal'
import { Accordion } from '../components/ui/Accordion'
import { Icon } from '../components/ui/Icon'
import { ProductCard } from '../components/product/ProductCard'
import { FinanceSimulator } from '../components/product/FinanceSimulator'
import { families, iphoneModels } from '../data/products'
import { advantages, homeFaq, sampleReview } from '../data/content'
import { stores } from '../data/stores'

export function Home() {
  const [financeOpen, setFinanceOpen] = useState(false)
  const launches = iphoneModels.slice(0, 3)
  const offers = iphoneModels.filter((m) => m.colors[0].capacities[0].previousPrice != null).slice(0, 3)

  return (
    <>
      {/* 02 — Campaña principal */}
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <Reveal>
            <Placeholder label="Imagen de producto" tint="#c8642a" ratio="4 / 3" />
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-ink sm:text-5xl">
              iPhone 17 Pro.
              <br />
              Ya en Banana.
            </h1>
            <p className="mt-4 text-lg text-muted">
              El nuevo iPhone, con envío a toda Canarias y recogida gratuita en tienda.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink to="/iphone/17-pro" size="lg">
                Ver oferta
              </ButtonLink>
              <ProvisionalBadge label="Contenido provisional" />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 03 — Categorías principales (carrusel) */}
      <Section>
        <SectionHeader title="Explora por categoría" />
        <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
          {families.map((fam) => (
            <Link
              key={fam.slug}
              to="/iphone"
              className="group w-40 shrink-0 snap-start rounded-[12px] border border-line bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] sm:w-auto"
            >
              <Placeholder label={fam.name} ratio="4 / 3" />
              <p className="mt-3 text-sm font-semibold text-ink group-hover:text-brand">{fam.name}</p>
            </Link>
          ))}
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
              <StaggerItem key={m.slug} className="relative">
                <div className="absolute left-3 top-3 z-20">
                  <OfferBadge>-15%</OfferBadge>
                </div>
                <ProductCard model={m} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Section>
      )}

      {/* 06 — Ventajas (franja de confianza) */}
      <section className="border-y border-line bg-brand text-white">
        <Container className="grid grid-cols-2 gap-8 py-10 lg:grid-cols-4">
          {advantages.map((a) => (
            <div key={a.title} className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10">
                <Icon name={a.icon} />
              </span>
              <div>
                <p className="font-semibold leading-tight">{a.title}</p>
                <p className="mt-0.5 text-xs text-white/60">{a.note}</p>
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
              <p className="text-sm font-bold uppercase tracking-wider text-brand">Financiación</p>
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
              <p className="text-sm font-bold uppercase tracking-wider text-brand">Plan Renove</p>
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

      {/* Reseña de ejemplo (§7) */}
      <Section alt>
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex justify-center gap-1 text-action">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} name="star" className="fill-action" />
            ))}
          </div>
          <blockquote className="text-xl font-medium leading-relaxed text-ink sm:text-2xl">
            “{sampleReview.text}”
          </blockquote>
          <p className="mt-3 text-sm text-muted">— {sampleReview.author}</p>
          <div className="mt-4 flex justify-center">
            <ProvisionalBadge label="Contenido provisional" />
          </div>
        </Reveal>
      </Section>

      {/* 09 — Tiendas físicas */}
      <Section>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <Reveal>
            <Placeholder label="Mapa de tiendas" ratio="4 / 3" />
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeader eyebrow="Estamos cerca" title="Tiendas físicas en Canarias" />
            <ul className="space-y-3">
              {stores.slice(0, 3).map((s) => (
                <li key={s.slug}>
                  <Link to={`/tiendas/${s.slug}`} className="flex items-center gap-2 text-ink hover:text-brand">
                    <Icon name="map-pin" size={18} className="text-muted" />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-muted">· {s.island}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink to="/tiendas" variant="tertiary" className="mt-4">
              Ver todas las tiendas <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </Reveal>
        </div>
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
        <Reveal className="rounded-[20px] bg-brand px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">No te pierdas ninguna oferta</h2>
          <p className="mt-2 text-white/70">Suscríbete y recibe las novedades antes que nadie.</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              placeholder="tu@email.com"
              aria-label="Tu correo electrónico"
              className="h-12 flex-1 rounded-[12px] border-0 bg-white px-4 text-ink outline-none placeholder:text-muted"
            />
            <Button type="submit" size="lg">
              Suscribirme
            </Button>
          </form>
          <p className="mt-3 text-xs text-white/60">
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
