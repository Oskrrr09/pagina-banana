import { useState } from 'react'
import { Link } from 'react-router-dom'
import { conNegritas, useIdioma } from '../lib/i18n'
import { euro } from '../lib/format'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProvisionalBadge } from '../components/ui/Tag'
import { DevicePreparationGuide } from '../components/support/DevicePreparationGuide'

// Página propia del Servicio Técnico Autorizado.
//
// Se separa de /soporte para poder enlazarla como una entrada dedicada en la
// barra utilitaria superior. El contenido operativo es el que se acordó en
// la iteración post-auditoría (banner sin cita, checklist en el orden
// correcto —modo antirrobo antes que "Buscar"—, opciones de entrega,
// condiciones de garantía / fuera de garantía y plazos orientativos).
//
// No implementa reserva de cita, calendario, pago online, seguimiento de
// reparación ni recogida a domicilio.
// Importes y plazos que la página repite en varios sitios. Estaban escritos a
// mano en cada frase —«35 €» tres veces, «3 días» dos—, así que cambiar la
// tarifa obligaba a acordarse de los cinco puntos y a hacerlo en cinco idiomas.
const COSTE_ENVIO_SAT = 35
const DIAS_TRASLADO = 3

export function ServiceTechnicalPage() {
  const { t, intl } = useIdioma()
  const [guideOpen, setGuideOpen] = useState(false)
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t('repair.kicker')}</p>
          <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">{t('repair.title')}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{t('repair.intro')}</p>
        </Container>
      </section>

      <Container className="py-10">
        <section id="servicio-tecnico" aria-labelledby="sat-heading">
          <div className="rounded-[16px] border border-line bg-neutral p-6 md:p-8">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-ink">
                <Icon name="wrench" size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {t('repair.howKicker')}
                </p>
                <h2 id="sat-heading" className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
                  {t('repair.noAppointment')}
                </h2>
              </div>
            </div>

            {/* Banner "Sin cita previa" */}
            <div role="note" className="mt-5 rounded-[12px] border border-brand bg-brand-050 p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="check" size={18} aria-hidden="true" />
                {t('repair.noAppointmentBadge')}
              </p>
              <p className="mt-2 text-sm text-ink">{t('repair.noAppointmentBody')}</p>
              <p className="mt-2 text-xs text-muted">{t('repair.noAppointmentNote')}</p>
            </div>

            {/* Preparación del dispositivo — orden correcto:
                 1) copia · 2) modo antirrobo · 3) Buscar
                 (el modo antirrobo debe estar desactivado antes que Buscar). */}
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
              <h3 className="text-lg font-bold text-ink">{t('repair.prepareTitle')}</h3>
              <p className="mt-1 text-sm text-muted">{t('repair.prepareIntro')}</p>
              <ol className="mt-4 space-y-3 text-sm text-ink">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    1
                  </span>
                  <span>{conNegritas(t('repair.step1'))}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    2
                  </span>
                  <span>{conNegritas(t('repair.step2'))}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    3
                  </span>
                  <span>{conNegritas(t('repair.step3'))}</span>
                </li>
              </ol>
            </div>

            {/* Opciones de entrega */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="store" size={18} aria-hidden="true" />
                  {t('repair.dropInStore')}
                </h3>
                <p className="mt-2 text-sm text-ink">{t('repair.dropInStoreBody')}</p>
              </div>
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="truck" size={18} aria-hidden="true" />
                  {t('repair.dropAnyStore')}
                </h3>
                <p className="mt-2 text-sm text-ink">{t('repair.dropAnyStoreBody')}</p>
              </div>
            </div>

            {/* En garantía / Fuera de garantía */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-available">
                  <Icon name="shield" size={18} aria-hidden="true" />
                  {t('repair.inWarranty')}
                </h3>
                <p className="mt-3 text-sm text-ink">{conNegritas(t('repair.inWarrantyBody'))}</p>
                <p className="mt-3 text-xs text-muted">{t('repair.inWarrantyNote')}</p>
              </div>
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="package" size={18} aria-hidden="true" />
                  {t('repair.outWarranty')}
                </h3>
                <p className="mt-3 text-sm text-ink">
                  {conNegritas(t('repair.outWarrantyBody', { importe: euro(COSTE_ENVIO_SAT, intl) }))}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink">
                  <li className="flex items-start gap-2">
                    <Icon name="check" size={16} className="mt-0.5 text-available" aria-hidden="true" />
                    <span>{conNegritas(t('repair.outWarrantyAccept', { importe: euro(COSTE_ENVIO_SAT, intl) }))}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="info" size={16} className="mt-0.5 text-muted" aria-hidden="true" />
                    <span>{conNegritas(t('repair.outWarrantyDecline', { importe: euro(COSTE_ENVIO_SAT, intl) }))}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plazos orientativos */}
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
              <h3 className="text-lg font-bold text-ink">{t('repair.estimates')}</h3>
              <p className="mt-2 text-sm text-ink">
                {conNegritas(t('repair.timesBody', { dias: t('repair.days', { n: DIAS_TRASLADO }) }))}
              </p>
              <div role="note" className="mt-4 rounded-[10px] border border-line bg-neutral p-4 text-sm text-ink">
                <p className="flex items-center gap-2 font-semibold">
                  <Icon name="info" size={16} aria-hidden="true" />
                  {t('repair.importantNote')}
                </p>
                <p className="mt-1">
                  {t('repair.importantNoteBody', { dias: t('repair.days', { n: DIAS_TRASLADO }) })}
                </p>
              </div>
              <p className="mt-3 text-xs text-muted">{t('repair.timesNote')}</p>
              <div className="mt-3">
                <ProvisionalBadge label={t('repair.operationalBadge')} />
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
              >
                {t('repair.prepareCta')}
                <Icon name="arrow-right" size={16} aria-hidden="true" />
              </button>
              <Link
                to="/tiendas"
                className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-ink/30"
              >
                {t('repair.storesCta')}
              </Link>
              <Link
                to="/soporte"
                className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-ink/30"
              >
                {t('repair.supportCta')}
              </Link>
            </div>
          </div>
        </section>
      </Container>

      <DevicePreparationGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}
