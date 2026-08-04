import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '../lib/i18n'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { DevicePreparationGuide } from '../components/support/DevicePreparationGuide'
import { supportQuickLinks, supportTopics } from '../data/content'

// Centro de soporte (§4.15).
// - Buscador de ayuda + FAQ por tema.
// - El bloque completo del Servicio Técnico Autorizado vive en su página propia
//   `/servicio-tecnico`. Aquí se muestra un acceso rápido y el activador de la
//   guía interactiva "Preparar mi dispositivo" (DevicePreparationGuide).
export function SupportPage() {
  const t = useT()
  const [q, setQ] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const term = q.trim().toLowerCase()

  // El filtro busca sobre el texto TRADUCIDO, no sobre las claves: desde que
  // el contenido pasó a claves, buscar en `q`/`a` habría sido buscar dentro de
  // `supportFaq.track.q` y no dentro de la pregunta.
  const filteredTopics = useMemo(() => {
    if (!term) return supportTopics
    return supportTopics
      .map((tema) => ({
        ...tema,
        items: tema.items.filter(
          (i) => t(i.q).toLowerCase().includes(term) || t(i.a).toLowerCase().includes(term),
        ),
      }))
      .filter((tema) => tema.items.length > 0)
  }, [term, t])

  return (
    <>
      {/* 1 — Buscador de ayuda (H1 único de la página) */}
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 text-center md:py-16">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('support.title')}</h1>
          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3.5 shadow-[var(--shadow-rest)]">
              <Icon name="search" className="text-muted" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('support.searchPlaceholder')}
                aria-label={t('support.searchAria')}
                className="w-full bg-transparent text-base outline-none placeholder:text-muted"
              />
            </div>
          </form>
        </Container>
      </section>

      <Container className="py-10">
          {/* 2 — Accesos rápidos. "Preparar mi dispositivo" abre la guía
                interactiva; el resto navegan a anclas o secciones. */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {supportQuickLinks.map((l) =>
              l.title === 'support.prepare.title' ? (
                <button
                  key={l.title}
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="flex flex-col items-start rounded-[12px] border border-line bg-surface p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-brand-050 text-ink">
                    <Icon name={l.icon} size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-semibold text-ink">{t(l.title)}</p>
                  <p className="mt-0.5 text-sm text-muted">{t(l.desc)}</p>
                </button>
              ) : (
                <Link
                  key={l.title}
                  to="#faq"
                  className="flex flex-col items-start rounded-[12px] border border-line bg-surface p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-brand-050 text-ink">
                    <Icon name={l.icon} size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-semibold text-ink">{t(l.title)}</p>
                  <p className="mt-0.5 text-sm text-muted">{t(l.desc)}</p>
                </Link>
              ),
            )}
          </div>

          {/* 3 — Acceso destacado al Servicio Técnico Autorizado */}
          <aside
            aria-labelledby="sat-callout"
            className="mt-8 rounded-[16px] border border-line bg-neutral p-6 md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {t('repair.kicker')}
                </p>
                <h2 id="sat-callout" className="mt-1 text-2xl font-extrabold text-ink">
                  {t('support.repairTitle')}
                </h2>
                <p className="mt-2 text-sm text-ink">
                  {t('support.repairBody')}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-ink/30"
                >
                  {t('support.prepare.title')}
                </button>
                <Link
                  to="/servicio-tecnico"
                  className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
                >
                  {t('support.repairCta')}
                  <Icon name="arrow-right" size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </aside>

          {/* 4 — FAQ por tema */}
          <section id="faq" aria-labelledby="faq-heading" className="mt-12">
            <h2 id="faq-heading" className="mb-6 text-2xl font-bold text-ink">
              {t('home.section.faqTitle')}
            </h2>
            {filteredTopics.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-line py-12 text-center">
                <p className="text-ink">{t('support.noResultsFor', { consulta: q })}</p>
                <p className="mt-2 text-sm text-muted">{t('support.noResults')}</p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {filteredTopics.map((tema) => (
                  <div key={tema.topic}>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink">
                      {t(tema.topic)}
                    </h3>
                    <Accordion
                      items={tema.items.map((i) => ({ q: t(i.q), a: t(i.a), note: t(i.note) }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 5 — Cierre con acceso a tiendas y servicios */}
          <section
            aria-labelledby="support-more"
            className="mt-12 rounded-[20px] border border-line bg-neutral p-8 text-center"
          >
            <h2 id="support-more" className="text-xl font-bold text-ink">
              {t('support.notFoundTitle')}
            </h2>
            <p className="mt-2 text-muted">{t('support.channels')}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to="/tiendas"
                className="inline-flex items-center gap-2 rounded-[12px] bg-action px-6 py-3 font-semibold text-ink hover:bg-action-600"
              >
                {t('support.storesCta')}
              </Link>
              <Link
                to="/servicios"
                className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-6 py-3 font-semibold text-ink hover:border-ink/30"
              >
                {t('support.servicesCta')}
              </Link>
            </div>
          </section>
      </Container>

      <DevicePreparationGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}
