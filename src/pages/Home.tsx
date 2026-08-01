import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Section, SectionHeader } from '../components/ui/Container'
import { ButtonLink } from '../components/ui/Button'
import { Placeholder } from '../components/ui/Placeholder'
import { Reveal, StaggerGroup, StaggerItem } from '../components/ui/Reveal'
import { Accordion } from '../components/ui/Accordion'
import { Icon } from '../components/ui/Icon'
import { ProductCard } from '../components/product/ProductCard'
import { FinanceSimulator } from '../components/product/FinanceSimulator'
import { StoreCarousel } from '../components/home/StoreCarousel'
import { BentoShowcase } from '../components/home/BentoShowcase'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { MobileScroller } from '../components/ui/MobileScroller'
import { families, iphoneModels, modelsByFamily } from '../data/products'
import { homeFaq } from '../data/content'
import { useT } from '../lib/i18n'
import { claim } from '../data/commercialClaims'
import { euro } from '../lib/format'

export function Home() {
  const t = useT()
  const [financeOpen, setFinanceOpen] = useState(false)
  const launches = iphoneModels.slice(0, 3)
  const offers = iphoneModels.filter((m) => m.colors[0].capacities[0].previousPrice != null).slice(0, 3)

  return (
    <>
      {/* Decisión visual consciente: la portada empieza directamente por el
          HeroCarousel. Los títulos rotativos del hero se mantienen como <h2>
          y no se añade ningún <h1> sustituto (ni visible, ni sr-only). */}
      <HeroCarousel />

      {/* 02a — Franja de confianza. Todas las afirmaciones vienen del módulo
             central commercialClaims.ts; las marcadas como demo llevan un
             aviso discreto para no presentarlas como promociones activas. */}
      <section className="border-y border-line bg-neutral">
        <Container className="py-6">
          <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              claim('tiendasCanarias'),
              claim('envio24'),
              claim('financiacion0'),
              claim('soporteOficial'),
            ].map((c) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-banana text-ink">
                  <Icon name={c.icon ?? 'info'} size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{c.title}</p>
                  <p className="truncate text-xs text-muted">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted">{t('home.demoConditions')}</p>
        </Container>
      </section>

      {/* 02c — CTA discreto al asistente "Encuentra tu Apple". Sirve como
             puerta al recorrido guiado sin competir visualmente con los
             CTAs de compra del hero. */}
      <section aria-label="Asistente Encuentra tu Apple" className="border-b border-line bg-surface">
        <Container className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t('home.finder.eyebrow')}
            </p>
            <h2 className="text-lg font-bold text-ink">{t('home.finder.title')}</h2>
            <p className="text-sm text-muted">{t('home.finder.body')}</p>
          </div>
          <Link
            to="/elige-tu-apple"
            className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
          >
            Empezar <Icon name="arrow-right" size={14} aria-hidden="true" />
          </Link>
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
            const to = developed
              ? `/${fam.slug}`
              : fam.slug === 'accesorios'
                ? '/accesorios'
                : '/iphone'
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
                        width={200}
                        height={200}
                        loading="lazy"
                        decoding="async"
                        className="block h-full w-full object-contain object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
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
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink/70">
              {t('home.tradeIn.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {t('home.tradeIn.title')}
            </h2>
            <p className="mt-3 max-w-md text-ink/85">{t('home.tradeIn.body')}</p>
            <p className="mt-2 text-xs text-ink/80">{t('home.tradeIn.note')}</p>
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
              src={`${import.meta.env.BASE_URL}img/products/17pro-plata.webp`}
              alt=""
              width={1080}
              height={1080}
              loading="lazy"
              decoding="async"
              className="col-span-2 row-start-1 aspect-square w-full object-contain drop-shadow-xl"
            />
            <img
              src={`${import.meta.env.BASE_URL}img/products/watch-ultra-3-natural-alpine.webp`}
              alt=""
              width={1080}
              height={1080}
              loading="lazy"
              decoding="async"
              className="col-start-3 row-start-1 aspect-square w-full self-center object-contain drop-shadow-xl"
            />
          </div>
        </Container>
      </section>

      {/* 07 — Complementa tu Apple (categorías de accesorios) */}
      <Section>
        <SectionHeader eyebrow="Personaliza tu Apple" title="Complementa tu equipo" desc="Todo lo que necesitas para sacarle partido a tu Apple." />
        <MobileScroller
          desktopClass="sm:grid sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          itemClass="w-[65vw] sm:w-auto"
        >
          {[
            { label: 'Fundas iPhone', icon: 'shield', bg: '#dbeaf9', ring: '#7fb5e6', to: '/accesorios' },
            { label: 'Carga y MagSafe', icon: 'credit-card', bg: '#fff4c9', ring: '#ffd76b', to: '/accesorios' },
            { label: 'Correas Watch', icon: 'refresh', bg: '#ffe0e7', ring: '#f0a3b8', to: '/accesorios' },
            { label: 'Teclados y ratones', icon: 'compare', bg: '#e6dff8', ring: '#a992e0', to: '/accesorios' },
            { label: 'Audio y sonido', icon: 'chat', bg: '#dbf1e5', ring: '#7fc9a2', to: '/buscar?q=audio' },
          ].map((cat) => (
            <Link
              key={cat.label}
              to={cat.to}
              className="group flex h-full flex-col items-center justify-center gap-3 rounded-[16px] border border-line bg-surface p-6 text-center transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
            >
              <span
                className="grid h-16 w-16 place-items-center rounded-full text-ink transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: cat.bg, boxShadow: `inset 0 0 0 2px ${cat.ring}` }}
              >
                <Icon name={cat.icon} size={28} />
              </span>
              <p className="text-sm font-bold text-ink">{cat.label}</p>
              <p className="text-xs font-semibold text-muted transition-colors group-hover:text-ink">
                Ver todo ›
              </p>
            </Link>
          ))}
        </MobileScroller>
      </Section>

      {/* 08 — Servicios Banana (4 tiles coloridos) */}
      <Section alt>
        <SectionHeader eyebrow="Servicios Banana" title="Más que una tienda" desc="Servicios pensados para que tu Apple funcione al 100 %." />
        <MobileScroller
          desktopClass="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-4"
          itemClass="w-[80vw] sm:w-auto"
        >
          <button
            type="button"
            onClick={() => setFinanceOpen(true)}
            className="group flex h-full w-full flex-col justify-between rounded-[20px] bg-[linear-gradient(160deg,#fff4c9,#ffe08a)] p-6 text-left text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-raised)]"
          >
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
                <Icon name="credit-card" size={20} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">Financiación al 0 %</h3>
              <p className="mt-1 text-sm text-ink/80">Hasta 24 meses sin intereses.</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2">
              Simular cuota <Icon name="arrow-right" size={16} />
            </span>
          </button>
          <Link
            to="/plan-renove"
            className="group flex h-full flex-col justify-between rounded-[20px] bg-[linear-gradient(160deg,#dbf1e5,#a3d9bd)] p-6 text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-raised)]"
          >
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
                <Icon name="refresh" size={20} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">Plan Renove</h3>
              <p className="mt-1 text-sm text-ink/80">Hasta 400 € por tu Apple actual.</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2">
              Valorar mi dispositivo <Icon name="arrow-right" size={16} />
            </span>
          </Link>
          <Link
            to="/soporte"
            className="group flex h-full flex-col justify-between rounded-[20px] bg-[linear-gradient(160deg,#dbeaf9,#8fc3ee)] p-6 text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-raised)]"
          >
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
                <Icon name="wrench" size={20} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">Servicio técnico</h3>
              <p className="mt-1 text-sm text-ink/80">Reparaciones oficiales Apple.</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2">
              Ver taller <Icon name="arrow-right" size={16} />
            </span>
          </Link>
          <Link
            to="/servicios"
            className="group flex h-full flex-col justify-between rounded-[20px] bg-[linear-gradient(160deg,#e6dff8,#b8a3e6)] p-6 text-ink transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-raised)]"
          >
            <div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-black/10">
                <Icon name="graduation" size={20} />
              </span>
              <h3 className="mt-4 text-lg font-extrabold">Formación Banana</h3>
              <p className="mt-1 text-sm text-ink/80">Talleres gratis en tienda.</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-all group-hover:gap-2">
              Ver próximos <Icon name="arrow-right" size={16} />
            </span>
          </Link>
        </MobileScroller>
      </Section>

      {/* 09 — Testimonios (contenido demostrativo) */}
      <Section>
        <SectionHeader eyebrow="Lo que dicen de nosotros" title="Clientes que ya son familia" desc="Contenido demostrativo, pendiente de validar con opiniones reales." />
        <MobileScroller
          desktopClass="sm:grid sm:grid-cols-2 sm:gap-5 md:grid-cols-3"
          itemClass="w-[calc(100vw-2.5rem)] sm:w-auto"
        >
          {[
            {
              name: 'Elena R.',
              city: 'Las Palmas',
              product: 'iPhone 17 Pro',
              stars: 5,
              text: 'Compra rápida y el iPhone en 24 h en casa. Me atendieron por WhatsApp para elegir el modelo, súper cercano.',
              hue: '#ffe08a',
            },
            {
              name: 'Javier M.',
              city: 'Santa Cruz de Tenerife',
              product: 'MacBook Air M5',
              stars: 5,
              text: 'Financié el Mac al 0 % y me dieron un buen precio por mi portátil anterior con el Plan Renove. Todo transparente.',
              hue: '#dbeaf9',
            },
            {
              name: 'Marta L.',
              city: 'Arrecife',
              product: 'Apple Watch Ultra 3',
              stars: 4,
              text: 'Me explicaron todo antes de comprar, incluso el seguro. Volveré para los AirPods sin duda.',
              hue: '#dbf1e5',
            },
          ].map((resena) => (
            <div key={resena.name} className="flex h-full flex-col rounded-[20px] border border-line bg-surface p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-extrabold text-ink"
                  style={{ backgroundColor: resena.hue }}
                >
                  {resena.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{resena.name}</p>
                  <p className="truncate text-xs text-muted">{resena.city} · {resena.product}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-0.5 text-banana">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" size={16} className={i < resena.stars ? 'fill-current' : 'text-muted/40'} />
                ))}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/85">"{resena.text}"</p>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('home.review.demo')}</p>
            </div>
          ))}
        </MobileScroller>
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
          <Accordion items={homeFaq.map((f) => ({ q: t(f.q), a: t(f.a), note: t(f.note) }))} />
        </div>
      </Section>

      {/* 13 — Newsletter */}
      <Section>
        <Reveal className="banana-surface bg-banana rounded-[20px] px-6 py-12 text-center text-ink sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.newsletter.title')}</h2>
          <p className="mt-2 text-ink/70">{t('home.newsletter.body')}</p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:gap-3"
          >
            <input
              type="email"
              required
              placeholder="tu@email.com"
              aria-label={t('home.newsletter.emailLabel')}
              className="min-h-12 w-full min-w-0 flex-1 rounded-[12px] border-0 bg-white px-5 py-3 text-base text-[#1d1d1f] outline-none placeholder:text-[#6e6e73]"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-ink px-8 py-3 font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 sm:w-auto"
            >
              Suscribirme
            </button>
          </form>
          <p className="mt-3 text-xs text-ink/80">
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
