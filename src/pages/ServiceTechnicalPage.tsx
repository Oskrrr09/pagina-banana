import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProvisionalBadge } from '../components/ui/Tag'

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
export function ServiceTechnicalPage() {
  return (
    <>
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 md:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Servicio técnico
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-ink sm:text-5xl">
            Servicio Técnico Autorizado
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Cómo entregar tu dispositivo Apple, qué preparar antes y qué
            condiciones se aplican según esté dentro o fuera de garantía.
          </p>
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
                  Cómo funciona
                </p>
                <h2 id="sat-heading" className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
                  Sin cita previa, en horario de tienda
                </h2>
              </div>
            </div>

            {/* Banner "Sin cita previa" */}
            <div
              role="note"
              className="mt-5 rounded-[12px] border border-brand bg-brand-050 p-5"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name="check" size={18} aria-hidden="true" />
                No necesitas cita previa
              </p>
              <p className="mt-2 text-sm text-ink">
                No necesitas cita previa. Puedes acudir directamente durante el horario de
                apertura. Antes de entregar tu dispositivo, asegúrate de haber realizado una
                copia de seguridad y de haber desactivado las funciones de seguridad necesarias.
              </p>
              <p className="mt-2 text-xs text-muted">
                No se garantiza atención inmediata ni un plazo total concreto de diagnóstico o
                reparación.
              </p>
            </div>

            {/* Preparación del dispositivo — orden correcto:
                 1) copia · 2) modo antirrobo · 3) Buscar
                 (el modo antirrobo debe estar desactivado antes que Buscar). */}
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
              <h3 className="text-lg font-bold text-ink">Prepara tu dispositivo antes de entregarlo</h3>
              <p className="mt-1 text-sm text-muted">
                Estas funciones de seguridad pueden impedir que el servicio técnico revise,
                diagnostique o gestione correctamente tu dispositivo. Hazlo en este orden.
              </p>
              <ol className="mt-4 space-y-3 text-sm text-ink">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    1
                  </span>
                  <span>
                    <strong className="font-semibold">Realiza una copia de seguridad</strong>{' '}
                    actualizada de tus datos.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    2
                  </span>
                  <span>
                    <strong className="font-semibold">
                      Desactiva la Protección del dispositivo en caso de robo
                    </strong>{' '}
                    (modo antirrobo o función equivalente), cuando esté activada o disponible.
                    Debe desactivarse antes que la función "Buscar".
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-050 text-ink"
                    aria-hidden="true"
                  >
                    3
                  </span>
                  <span>
                    <strong className="font-semibold">Desactiva la función “Buscar”</strong>:
                    Buscar mi iPhone, Buscar mi iPad, Buscar mi Mac o la opción equivalente según
                    el dispositivo.
                  </span>
                </li>
              </ol>
              <p className="mt-4 text-xs text-muted">
                No te pediremos aquí contraseñas, códigos ni credenciales de tu Apple ID.
              </p>
            </div>

            {/* Opciones de entrega */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="store" size={18} aria-hidden="true" />
                  Entrega directa
                </h3>
                <p className="mt-2 text-sm text-ink">
                  Puedes entregar el dispositivo directamente en un establecimiento Banana que
                  gestione el servicio técnico.
                </p>
              </div>
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="truck" size={18} aria-hidden="true" />
                  Dejarlo en cualquier tienda Banana
                </h3>
                <p className="mt-2 text-sm text-ink">
                  También puedes dejar el dispositivo en el resto de tiendas Banana. El equipo
                  será recogido y enviado al servicio técnico para su revisión.
                </p>
              </div>
            </div>

            {/* En garantía / Fuera de garantía */}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-available">
                  <Icon name="shield" size={18} aria-hidden="true" />
                  Dispositivo en garantía
                </h3>
                <p className="mt-3 text-sm text-ink">
                  Si el dispositivo está en garantía,{' '}
                  <strong className="font-semibold">el envío al servicio técnico es gratuito</strong>.
                  Tras la revisión, se te informará del diagnóstico y del presupuesto cuando sea
                  necesario. La cobertura de la reparación dependerá del diagnóstico y de las
                  condiciones de garantía aplicables.
                </p>
                <p className="mt-3 text-xs text-muted">
                  Que un dispositivo esté dentro del periodo de garantía no significa que
                  cualquier avería esté cubierta.
                </p>
              </div>
              <div className="rounded-[12px] border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Icon name="package" size={18} aria-hidden="true" />
                  Dispositivo fuera de garantía
                </h3>
                <p className="mt-3 text-sm text-ink">
                  Si el dispositivo está fuera de garantía, el envío al servicio técnico tiene un
                  coste de <strong className="font-semibold">35 €</strong>. Tras la revisión
                  recibirás un presupuesto.
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink">
                  <li className="flex items-start gap-2">
                    <Icon name="check" size={16} className="mt-0.5 text-available" aria-hidden="true" />
                    <span>
                      Si <strong className="font-semibold">aceptas la reparación</strong>, esos
                      35 € se descontarán del precio final.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="info" size={16} className="mt-0.5 text-muted" aria-hidden="true" />
                    <span>
                      Si <strong className="font-semibold">decides no reparar</strong> el
                      dispositivo, el importe de 35 € no será reembolsable.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plazos orientativos */}
            <div className="mt-6 rounded-[12px] border border-line bg-surface p-5">
              <h3 className="text-lg font-bold text-ink">Plazos orientativos</h3>
              <p className="mt-2 text-sm text-ink">
                Cuando el dispositivo se envía desde una tienda al servicio técnico, el traslado
                suele tardar un mínimo de <strong className="font-semibold">3 días</strong>. A
                este plazo hay que añadir el tiempo necesario para diagnosticar el equipo y,
                cuando corresponda, el tiempo de reparación tras la aceptación del presupuesto.
              </p>
              <div
                role="note"
                className="mt-4 rounded-[10px] border border-line bg-neutral p-4 text-sm text-ink"
              >
                <p className="flex items-center gap-2 font-semibold">
                  <Icon name="info" size={16} aria-hidden="true" />
                  Aclaración importante
                </p>
                <p className="mt-1">
                  Los 3 días corresponden únicamente al traslado orientativo al servicio técnico,
                  no al plazo total de diagnóstico y reparación.
                </p>
              </div>
              <p className="mt-3 text-xs text-muted">
                El plazo total puede variar según la avería, el diagnóstico, la disponibilidad de
                piezas y el tipo de reparación.
              </p>
              <div className="mt-3">
                <ProvisionalBadge label="Información operativa · condiciones sujetas a Banana Computer" />
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/tiendas"
                className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
              >
                Consultar tiendas y horarios
                <Icon name="arrow-right" size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/soporte"
                className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-ink/30"
              >
                Más información de soporte
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}
