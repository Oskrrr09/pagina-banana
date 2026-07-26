import { useMemo, useState } from 'react'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { Accordion } from '../components/ui/Accordion'
import { supportQuickLinks, supportTopics } from '../data/content'

// Centro de soporte (§4.15): buscador de ayuda, accesos rápidos, FAQ por tema,
// chat y contacto.
export function SupportPage() {
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()

  const filteredTopics = useMemo(() => {
    if (!term) return supportTopics
    return supportTopics
      .map((t) => ({
        ...t,
        items: t.items.filter((i) => i.q.toLowerCase().includes(term) || i.a.toLowerCase().includes(term)),
      }))
      .filter((t) => t.items.length > 0)
  }, [term])

  return (
    <>
      {/* 1 — Buscador de ayuda */}
      <section className="border-b border-line bg-linear-to-b from-brand-050 to-surface">
        <Container className="py-12 text-center md:py-16">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">¿En qué podemos ayudarte?</h1>
          <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3.5 shadow-[var(--shadow-rest)]">
              <Icon name="search" className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca en la ayuda…"
                aria-label="Buscar en la ayuda"
                className="w-full bg-transparent text-base outline-none placeholder:text-muted"
              />
            </div>
          </form>
        </Container>
      </section>

      <Container className="py-10">
        {/* 2 — Accesos rápidos */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {supportQuickLinks.map((l) => (
            <button
              key={l.title}
              className="flex flex-col items-start rounded-[12px] border border-line bg-surface p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-raised)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-brand-050 text-ink">
                <Icon name={l.icon} size={22} />
              </span>
              <p className="mt-3 font-semibold text-ink">{l.title}</p>
              <p className="mt-0.5 text-sm text-muted">{l.desc}</p>
            </button>
          ))}
        </div>

        {/* 3 — FAQ por tema */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-ink">Preguntas frecuentes</h2>
          {filteredTopics.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-line py-12 text-center">
              <p className="text-ink">No hemos encontrado artículos sobre “{q}”.</p>
              <p className="mt-2 text-sm text-muted">Prueba a contactar por chat o formulario.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {filteredTopics.map((t) => (
                <div key={t.topic}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-ink">{t.topic}</h3>
                  <Accordion items={t.items} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4 — Chat y contacto */}
        <div className="mt-12 rounded-[20px] border border-line bg-neutral p-8 text-center">
          <h2 className="text-xl font-bold text-ink">¿No encuentras lo que buscas?</h2>
          <p className="mt-2 text-muted">Estamos aquí para ayudarte por el canal que prefieras.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-[12px] bg-action px-6 py-3 font-semibold text-ink hover:bg-action-600">
              <Icon name="chat" size={18} /> Abrir chat
            </button>
            <button className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-6 py-3 font-semibold text-ink hover:border-ink/30">
              Formulario de contacto
            </button>
          </div>
        </div>
      </Container>

      {/* Botón de chat fijo (esquina inferior) */}
      <button
        aria-label="Abrir chat de soporte"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-ink shadow-[var(--shadow-raised)] transition-transform hover:scale-105"
      >
        <Icon name="chat" size={24} />
      </button>
    </>
  )
}
