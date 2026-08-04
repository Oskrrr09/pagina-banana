import { Container, Section, SectionHeader } from '../components/ui/Container'
import { conNegritas, useT } from '../lib/i18n'
import type { ClaveTexto } from '../lib/i18n'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { ProvisionalBadge } from '../components/ui/Tag'
import { planRenoveDevices, planRenoveSteps, planRenoveFaq } from '../data/content'

// Pasos del Plan Renove. No se muestran precios ni tasador propio, y no se
// nombra al partner externo que realiza la valoración final de Mac.
//
// Realidad operativa:
//  - En la web se puede consultar una valoración estimada, pero no vincula
//    a Banana ni al cliente.
//  - En tienda física la valoración de iPhone, iPad y Watch se realiza en
//    el momento, de una sola vez.
//  - Los Mac requieren un paso adicional: enviarlos al servicio técnico
//    para comprobar que no han sido abiertos ni reparados y confirmar la
//    valoración.
//  - La valoración puede cambiar de un día para otro, incluso valorada en
//    tienda.
const RENOVE_STEPS: Array<{ title: ClaveTexto; body: ClaveTexto }> = [
  { title: 'renove.step1Title', body: 'renove.step1Body' },
  { title: 'renove.step2Title', body: 'renove.step2Body' },
  { title: 'renove.step3Title', body: 'renove.step3Body' },
  { title: 'renove.step4Title', body: 'renove.step4Body' },
]

// Página de Plan Renove (§4.12). Aviso claro y destacado: la tasación final es
// presencial y orientativa online (riesgo detectado en auditoría).
export function PlanRenovePage() {
  const t = useT()
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">Plan Renove</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{t('renove.intro')}</p>

          {/* Avisos destacados: sólo en tienda física, valoración
              variable y traspaso de datos con antelación */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="store" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">{conNegritas(t('renove.noticeStore'))}</p>
            </div>
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="info" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">{conNegritas(t('renove.noticeValue'))}</p>
            </div>
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="clock" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">{conNegritas(t('renove.noticeTransfer'))}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Timeline de 4 pasos. Sin precios, sin tasador propio, sin nombre
          del partner de tasación. Puedes empezar por una valoración
          estimada online, pero el Renove se completa siempre en tienda. */}
      <Section>
        <SectionHeader title={t('renove.howTitle')} desc={t('renove.howDesc')} />
        <ol aria-label={t('renove.stepsAria')} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {RENOVE_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex h-full flex-col rounded-[12px] border border-line bg-surface p-5"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-ink"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink">{t(step.title)}</h3>
              <p className="mt-2 text-sm text-ink">{t(step.body)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">{t('renove.stepsNote')}</p>
        <div className="mt-3">
          <ProvisionalBadge label={t('renove.demoBadge')} />
        </div>
      </Section>

      <Section alt>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title={t('renove.beforeTitle')} />
            <ol className="space-y-4">
              {planRenoveSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <p className="pt-1.5 text-ink">{t(step)}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SectionHeader title={t('renove.devicesTitle')} />
            <ul className="grid grid-cols-2 gap-3">
              {planRenoveDevices.map((d) => (
                <li key={d} className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-3">
                  <Icon name="check" size={18} className="text-available" aria-hidden="true" />
                  <span className="font-medium text-ink">{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <ProvisionalBadge label={t('renove.provisional')} />
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <Reveal className="rounded-[20px] bg-ink px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('renove.ctaTitle')}</h2>
          <p className="mt-2 text-white/70">{t('renove.ctaBody')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/tiendas" size="lg">
              <Icon name="map-pin" size={18} aria-hidden="true" /> {t('renove.ctaStores')}
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeader title={t('home.section.faqTitle')} />
          <Accordion items={planRenoveFaq.map((f) => ({ q: t(f.q), a: t(f.a), note: t(f.note) }))} />
        </div>
      </Section>
    </>
  )
}
