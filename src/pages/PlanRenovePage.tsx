import { Container, Section, SectionHeader } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { ProvisionalBadge } from '../components/ui/Tag'
import { planRenoveDevices, planRenoveSteps, planRenoveFaq } from '../data/content'

// Página de Plan Renove (§4.12). Aviso claro y destacado: la tasación final es
// presencial y orientativa online (riesgo detectado en auditoría).
export function PlanRenovePage() {
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">Plan Renove</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Tu Apple actual vale más de lo que crees. Entrégalo y ahorra en tu próxima compra.
          </p>

          {/* Aviso destacado visualmente, no solo en letra pequeña */}
          <div className="mt-6 flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
            <Icon name="info" className="mt-0.5 shrink-0 text-backorder" />
            <p className="text-sm text-ink">
              <strong>La tasación final es siempre presencial.</strong> Cualquier importe mostrado online es solo
              orientativo; el valor real lo confirma un especialista en tienda.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title="¿Cómo funciona?" />
            <ol className="space-y-4">
              {planRenoveSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-1.5 text-ink">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SectionHeader title="Dispositivos válidos" />
            <ul className="grid grid-cols-2 gap-3">
              {planRenoveDevices.map((d) => (
                <li key={d} className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-3">
                  <Icon name="check" size={18} className="text-available" />
                  <span className="font-medium text-ink">{d}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <ProvisionalBadge label="Contenido provisional" />
            </div>
          </div>
        </div>
      </Section>

      <Section alt>
        <Reveal className="rounded-[20px] bg-brand px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Empieza tu Plan Renove</h2>
          <p className="mt-2 text-white/70">Elige una tienda cercana o reserva cita previa.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/tiendas" size="lg">
              <Icon name="map-pin" size={18} /> Elegir tienda
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <SectionHeader title="Preguntas frecuentes" />
          <Accordion items={planRenoveFaq} />
        </div>
      </Section>
    </>
  )
}
