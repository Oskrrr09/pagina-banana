import { Container, Section, SectionHeader } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { ProvisionalBadge } from '../components/ui/Tag'
import { planRenoveDevices, planRenoveSteps, planRenoveFaq } from '../data/content'

// Pasos del Plan Renove. No se muestran precios ni tasador propio, y no se
// nombra al partner externo que realiza la valoración final. El Plan Renove
// **solo está disponible en tiendas físicas de Banana Computer**: no forma
// parte del flujo de compra online, así que el paso por tienda es
// indispensable.
const RENOVE_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Visita una tienda Banana',
    body:
      'El Plan Renove solo se gestiona en tienda física. Acude a cualquiera de nuestras tiendas en Canarias con el dispositivo que quieres renovar.',
  },
  {
    title: 'Estimación inicial',
    body:
      'En tienda se recoge la información básica del equipo y se realiza una estimación inicial orientativa.',
  },
  {
    title: 'Revisión y valoración final',
    body:
      'El dispositivo se revisa para confirmar su estado real. La valoración final puede ser diferente de la estimación inicial.',
  },
  {
    title: 'Compensación en tu nueva compra',
    body:
      'La compensación se aplica sobre la compra de tu nuevo Apple realizada en tienda, conforme a las condiciones oficiales de Banana Computer.',
  },
]

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

          {/* Aviso doble: sólo en tienda física y valor final presencial */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="store" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">
                <strong>El Plan Renove solo está disponible en tienda física.</strong> No forma
                parte del proceso de compra online; el paso por tienda es indispensable para
                iniciarlo y aplicarlo sobre una nueva compra.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="info" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">
                <strong>La tasación final es siempre presencial.</strong> Cualquier importe
                mostrado online es solo orientativo; el valor real lo confirma un especialista en
                tienda.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Timeline de 4 pasos. Sin precios, sin tasador propio, sin nombre
          del partner de tasación. El paso por tienda es obligatorio. */}
      <Section>
        <SectionHeader
          title="Cómo funciona"
          desc="Cuatro pasos claros. Todos requieren pasar por tienda: el Plan Renove no se completa online."
        />
        <ol
          aria-label="Pasos del Plan Renove en tienda"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
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
              <h3 className="mt-3 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-ink">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">
          La estimación inicial puede variar tras la revisión presencial. La compensación se
          aplicará conforme a las condiciones oficiales de Banana Computer y siempre sobre una
          nueva compra realizada en tienda.
        </p>
        <div className="mt-3">
          <ProvisionalBadge label="Información demostrativa · condiciones sujetas a Banana Computer" />
        </div>
      </Section>

      <Section alt>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader title="Antes de empezar" />
            <ol className="space-y-4">
              {planRenoveSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-ink">
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
                  <Icon name="check" size={18} className="text-available" aria-hidden="true" />
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

      <Section>
        <Reveal className="rounded-[20px] bg-ink px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Empieza tu Plan Renove</h2>
          <p className="mt-2 text-white/70">
            Consulta las tiendas y horarios disponibles para preparar la entrega de tu
            dispositivo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/tiendas" size="lg">
              <Icon name="map-pin" size={18} aria-hidden="true" /> Ver tiendas y horarios
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
