import { Container, Section, SectionHeader } from '../components/ui/Container'
import { useT } from '../lib/i18n'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { ProvisionalBadge } from '../components/ui/Tag'
import { Reveal, StaggerGroup, StaggerItem } from '../components/ui/Reveal'
import { ButtonLink } from '../components/ui/Button'
import { services, serviceFaq } from '../data/content'

// Página de servicios (§4.11).
export function ServicesPage() {
  const t = useT()
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{t('services.title')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            {t('services.intro')}
          </p>
        </Container>
      </section>

      <Section>
        <SectionHeader title={t('services.allTitle')} />
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <StaggerItem key={s.slug}>
              <div id={s.slug} className="flex h-full flex-col rounded-[12px] border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]">
                <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-brand-050 text-ink">
                  <Icon name={s.icon} size={24} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{t(s.name)}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{t(s.line)}</p>
                <div className="mt-3">
                  <ProvisionalBadge label={t(s.note)} />
                </div>
                <ButtonLink
                  to={s.slug === 'plan-renove' ? '/plan-renove' : '/servicios'}
                  variant="tertiary"
                  className="mt-4"
                >
                  {t('services.more')} <Icon name="arrow-right" size={16} />
                </ButtonLink>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      <Section alt>
        <div className="mx-auto max-w-3xl">
          <SectionHeader title={t('faq.servicesTitle')} />
          <Accordion items={serviceFaq.map((f) => ({ q: t(f.q), a: t(f.a), note: t(f.note) }))} />
        </div>
      </Section>

      <Section>
        <Reveal className="rounded-[20px] border border-line bg-neutral p-8 text-center">
          <h2 className="text-2xl font-bold text-ink">{t('services.doubtsTitle')}</h2>
          <p className="mt-2 text-muted">{t('services.doubtsBody')}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/soporte">Ir a soporte</ButtonLink>
            <ButtonLink to="/tiendas" variant="secondary">
              {t('common.viewStores')}
            </ButtonLink>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
