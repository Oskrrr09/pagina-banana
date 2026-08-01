import { Container, Section, SectionHeader } from '../components/ui/Container'
import { useT } from '../lib/i18n'
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
const RENOVE_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Consulta una valoración estimada online',
    body:
      'En web puedes obtener una valoración estimada orientativa de tu dispositivo. La estimación online no vincula: la valoración real puede variar en tienda.',
  },
  {
    title: 'Acude a una tienda Banana',
    body:
      'La valoración final se hace en una tienda física de Banana Computer. Para iPhone, iPad o Apple Watch, la valoración se realiza en el momento, de una sola vez.',
  },
  {
    title: 'Si es un Mac, pasa por el servicio técnico',
    body:
      'Los Mac se envían al servicio técnico para comprobar que no han sido abiertos ni reparados y confirmar la valoración. La confirmación se comunica después.',
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
  const t = useT()
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">Plan Renove</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Tu Apple actual vale más de lo que crees. Entrégalo y ahorra en tu próxima compra.
          </p>

          {/* Avisos destacados: sólo en tienda física, valoración
              variable y traspaso de datos con antelación */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="store" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">
                <strong>El Plan Renove solo se completa en tienda física.</strong> No forma parte
                del proceso de compra online; el paso por tienda es indispensable para aplicarlo
                sobre una nueva compra.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="info" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">
                <strong>La valoración puede cambiar de un día para otro,</strong> incluso valorada
                en tienda. Cualquier importe mostrado online es solo orientativo.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-[12px] border border-backorder/40 bg-backorder-050 p-4">
              <Icon name="clock" className="mt-0.5 shrink-0 text-backorder" aria-hidden="true" />
              <p className="text-sm text-ink">
                <strong>Si necesitas traspaso de datos,</strong> acude a la tienda con un mínimo
                de <strong>2 horas de antelación</strong> respecto al cierre. Sin ese margen no
                podemos garantizar que el traspaso se complete el mismo día.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Timeline de 4 pasos. Sin precios, sin tasador propio, sin nombre
          del partner de tasación. Puedes empezar por una valoración
          estimada online, pero el Renove se completa siempre en tienda. */}
      <Section>
        <SectionHeader
          title="Cómo funciona"
          desc="Empieza con una valoración estimada online y complétalo en tienda. Los Mac requieren un paso adicional por el servicio técnico."
        />
        <ol
          aria-label="Pasos del Plan Renove"
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
                  <p className="pt-1.5 text-ink">{t(step)}</p>
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
          <SectionHeader title={t('home.section.faqTitle')} />
          <Accordion items={planRenoveFaq.map((f) => ({ q: t(f.q), a: t(f.a), note: t(f.note) }))} />
        </div>
      </Section>
    </>
  )
}
