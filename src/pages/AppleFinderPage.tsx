import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import {
  FINDER_QUESTIONS,
  GENERAL_QUESTIONS,
  computeFinderResults,
  inferFamilyFromGeneral,
  type FamilySlug,
  type FinderQuestion,
  type FinderResult,
} from '../data/productDecisionData'
import { families, getFamilyModels, familyInfo, variantPath } from '../data/products'
import { euro } from '../lib/format'

// -----------------------------------------------------------------------
// Asistente "Encuentra tu Apple" (§PR2 del bloque diferencial).
//
// - Ruta: /elige-tu-apple.
// - Recorrido: intro → pregunta de familia → (opcional) preguntas generales
//   si "No lo tengo claro" → preguntas específicas de la familia elegida →
//   resultados con 3 tarjetas (recomendación, más económica, más avanzada).
// - Estado 100 % en React (no toca localStorage, cookies, backend).
// - Recomendaciones deterministas: mismos inputs → mismos resultados.
// - Todo el resultado está claramente etiquetado como demostrativo.
// -----------------------------------------------------------------------

type Stage = 'intro' | 'family' | 'general' | 'specific' | 'results'

const FINDER_FAMILIES: readonly { slug: FamilySlug | 'unknown'; label: string }[] = [
  { slug: 'iphone', label: 'iPhone' },
  { slug: 'mac', label: 'Mac' },
  { slug: 'ipad', label: 'iPad' },
  { slug: 'apple-watch', label: 'Apple Watch' },
  { slug: 'airpods', label: 'AirPods' },
  { slug: 'unknown', label: 'No lo tengo claro' },
]

export function AppleFinderPage() {
  const navigate = useNavigate()
  const { toggleFavorite, isFavorite, toggleCompare, isComparing, compare, clearCart } = useStore()
  void clearCart // silencia unused para satisfacer tsconfig noUnusedLocals

  const [stage, setStage] = useState<Stage>('intro')
  const [family, setFamily] = useState<FamilySlug | 'unknown' | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)

  // Preguntas activas según fase.
  const activeQuestions: readonly FinderQuestion[] = useMemo(() => {
    if (stage === 'general') return GENERAL_QUESTIONS
    if (stage === 'specific' && family && family !== 'unknown') return FINDER_QUESTIONS[family]
    return []
  }, [stage, family])

  const totalSteps = activeQuestions.length
  const currentQ = activeQuestions[step] ?? null

  // Familia definitiva usada para computar resultados.
  const resolvedFamily: FamilySlug | null = useMemo(() => {
    if (family && family !== 'unknown') return family
    if (family === 'unknown' && stage === 'results') return inferFamilyFromGeneral(answers)
    return null
  }, [family, stage, answers])

  const results: FinderResult[] = useMemo(() => {
    if (stage !== 'results' || !resolvedFamily) return []
    const models = getFamilyModels(resolvedFamily)
    return computeFinderResults(models, answers)
  }, [stage, resolvedFamily, answers])

  function reset() {
    setStage('intro')
    setFamily(null)
    setAnswers({})
    setStep(0)
  }

  function pickFamily(slug: FamilySlug | 'unknown') {
    setFamily(slug)
    setAnswers({})
    setStep(0)
    if (slug === 'unknown') setStage('general')
    else setStage('specific')
  }

  function answerCurrent(value: string) {
    if (!currentQ) return
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }))
  }

  function goNext() {
    if (!currentQ) return
    if (!answers[currentQ.id]) return // botón queda desactivado, doble seguro
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
      return
    }
    // Última pregunta: si estamos en general, pasamos a specific de la familia inferida.
    if (stage === 'general') {
      const inferred = inferFamilyFromGeneral(answers)
      setFamily(inferred)
      setStage('specific')
      setStep(0)
      return
    }
    setStage('results')
  }

  function goPrev() {
    if (step > 0) {
      setStep((s) => s - 1)
      return
    }
    if (stage === 'specific' && family === 'unknown') {
      setStage('general')
      setStep(GENERAL_QUESTIONS.length - 1)
      return
    }
    if (stage === 'specific' || stage === 'general') {
      setStage('family')
      setStep(0)
      return
    }
    if (stage === 'family') setStage('intro')
  }

  function sendToCompare() {
    for (const result of results.slice(0, 3)) {
      const item = compareItemFor(result)
      if (item && !isComparing(item.id)) toggleCompare(item)
    }
    navigate('/comparar')
  }

  return (
    <Container className="py-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Asistente</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">Encuentra tu Apple</h1>
        <p className="mt-2 text-muted">
          Responde unas preguntas y te mostraremos opciones del catálogo que pueden ajustarse a tus
          prioridades.
        </p>
        <div className="mt-3">
          <ProvisionalBadge label="Recomendación demostrativa basada en los datos del prototipo" />
        </div>
      </header>

      {stage === 'intro' && (
        <section
          aria-labelledby="intro-heading"
          className="mt-8 rounded-[16px] border border-line bg-neutral p-6"
        >
          <h2 id="intro-heading" className="text-xl font-bold text-ink">
            Encuentra el Apple que encaja contigo
          </h2>
          <p className="mt-2 text-sm text-muted">
            El asistente combina las prioridades que indiques con los datos que el prototipo
            expone del catálogo. Puedes reiniciar o cambiar respuestas en cualquier momento.
          </p>
          <button
            type="button"
            onClick={() => setStage('family')}
            className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
          >
            Empezar <Icon name="arrow-right" size={14} aria-hidden="true" />
          </button>
        </section>
      )}

      {stage === 'family' && (
        <FamilyStep
          onBack={() => setStage('intro')}
          onPick={(slug) => pickFamily(slug)}
        />
      )}

      {(stage === 'general' || stage === 'specific') && currentQ && (
        <QuestionStep
          key={`${stage}-${step}`}
          question={currentQ}
          currentAnswer={answers[currentQ.id] ?? null}
          onAnswer={answerCurrent}
          stepNumber={step + 1}
          totalSteps={totalSteps}
          canPrev={true}
          canNext={Boolean(answers[currentQ.id])}
          onPrev={goPrev}
          onNext={goNext}
          isLast={step === totalSteps - 1 && stage === 'specific'}
        />
      )}

      {stage === 'results' && resolvedFamily && (
        <ResultsStep
          family={resolvedFamily}
          results={results}
          onReset={reset}
          onEdit={() => {
            setStage('specific')
            setStep(0)
          }}
          onSendToCompare={sendToCompare}
          onToggleFavorite={(slug) => toggleFavorite(`${resolvedFamily}/${slug}`)}
          isFavorite={(slug) => isFavorite(`${resolvedFamily}/${slug}`)}
          onToggleCompare={(result) => {
            const item = compareItemFor(result)
            if (item) toggleCompare(item)
          }}
          isComparing={(slug) => compare.some((c) => c.modelSlug === slug)}
        />
      )}
    </Container>
  )
}

// -----------------------------------------------------------------------

function FamilyStep({
  onBack,
  onPick,
}: {
  onBack: () => void
  onPick: (slug: FamilySlug | 'unknown') => void
}) {
  return (
    <section aria-labelledby="family-heading" className="mt-8">
      <h2 id="family-heading" className="text-xl font-bold text-ink">
        ¿Qué producto estás buscando?
      </h2>
      <ul
        role="radiogroup"
        aria-label="Familia de producto"
        className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FINDER_FAMILIES.map((option) => {
          const info = option.slug !== 'unknown' ? familyInfo(option.slug) : null
          return (
            <li key={option.slug}>
              <button
                type="button"
                role="radio"
                aria-checked={false}
                onClick={() => onPick(option.slug)}
                className="flex w-full items-start gap-3 rounded-[12px] border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
                  <Icon
                    name={option.slug === 'unknown' ? 'chat' : option.slug === 'apple-watch' ? 'shield' : 'store'}
                    aria-hidden="true"
                  />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{option.label}</span>
                  {info && <span className="mt-0.5 block text-xs text-muted">{info.tagline}.</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-semibold text-ink hover:underline"
      >
        ← Atrás
      </button>
    </section>
  )
}

function QuestionStep({
  question,
  currentAnswer,
  onAnswer,
  stepNumber,
  totalSteps,
  canPrev,
  canNext,
  onPrev,
  onNext,
  isLast,
}: {
  question: FinderQuestion
  currentAnswer: string | null
  onAnswer: (value: string) => void
  stepNumber: number
  totalSteps: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  isLast: boolean
}) {
  return (
    <section aria-labelledby={`q-${question.id}`} className="mt-8">
      <div className="mb-3 flex items-center justify-between" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Pregunta {stepNumber} de {totalSteps}
        </p>
      </div>
      <div className="rounded-[16px] border border-line bg-surface p-6">
        <h2 id={`q-${question.id}`} className="text-lg font-bold text-ink">
          {question.prompt}
        </h2>
        {question.help && <p className="mt-1 text-xs text-muted">{question.help}</p>}
        <ul role="radiogroup" aria-labelledby={`q-${question.id}`} className="mt-4 grid gap-2">
          {question.options.map((option) => {
            const selected = currentAnswer === option.value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onAnswer(option.value)}
                  className={`flex w-full items-center gap-3 rounded-[10px] border p-3 text-left text-sm transition ${
                    selected
                      ? 'border-brand bg-brand-050 text-ink ring-1 ring-brand'
                      : 'border-line bg-surface text-ink hover:border-ink/30'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-5 w-5 place-items-center rounded-full border ${
                      selected ? 'border-ink bg-ink text-white' : 'border-line text-transparent'
                    }`}
                  >
                    <Icon name="check" size={12} aria-hidden="true" />
                  </span>
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLast ? 'Ver resultados' : 'Siguiente'}
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function ResultsStep({
  family,
  results,
  onReset,
  onEdit,
  onSendToCompare,
  onToggleFavorite,
  isFavorite,
  onToggleCompare,
  isComparing,
}: {
  family: FamilySlug
  results: FinderResult[]
  onReset: () => void
  onEdit: () => void
  onSendToCompare: () => void
  onToggleFavorite: (slug: string) => void
  isFavorite: (slug: string) => boolean
  onToggleCompare: (result: FinderResult) => void
  isComparing: (slug: string) => boolean
}) {
  const info = familyInfo(family)
  if (results.length === 0) {
    return (
      <div className="mt-8 rounded-[16px] border border-line bg-neutral p-6 text-sm text-muted">
        No hemos podido calcular resultados con esas respuestas. Prueba a reiniciar el asistente.
      </div>
    )
  }
  return (
    <section aria-labelledby="results-heading" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Resultados
          </p>
          <h2 id="results-heading" className="text-2xl font-bold text-ink">
            Opciones sugeridas en {info?.name}
          </h2>
        </div>
        <ProvisionalBadge label="Orientación demostrativa" />
      </div>
      <ul
        aria-label="Recomendaciones del asistente"
        className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {results.map((result) => (
          <li
            key={`${result.role}-${result.model.slug}`}
            className="flex h-full flex-col rounded-[16px] border border-line bg-surface p-4"
          >
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
              {result.role === 'recommendation'
                ? 'Nuestra recomendación'
                : result.role === 'cheaper'
                  ? 'Alternativa más económica'
                  : 'Alternativa más avanzada'}
            </span>
            <ProductImage
              src={result.model.colors[0].image}
              alt={result.model.name}
              ratio="4 / 3"
            />
            <h3 className="mt-2 text-lg font-bold text-ink">{result.model.name}</h3>
            <p className="mt-1 text-sm text-muted">desde {euro(result.model.fromPrice)}</p>
            {result.positives.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-ink">
                {result.positives.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Icon name="check" size={14} className="mt-0.5 text-available" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
            {result.caveats.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {result.caveats.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <Icon name="info" size={12} className="mt-0.5" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-4">
              <div className="flex flex-wrap gap-2">
                <Link
                  to={variantPath(result.model)}
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
                >
                  Ver producto
                </Link>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(result.model.slug)}
                  aria-pressed={isFavorite(result.model.slug)}
                  aria-label={
                    isFavorite(result.model.slug)
                      ? `Quitar ${result.model.name} de favoritos`
                      : `Añadir ${result.model.name} a favoritos`
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-danger hover:text-danger"
                >
                  <Icon
                    name="heart"
                    size={13}
                    className={isFavorite(result.model.slug) ? 'fill-danger text-danger' : ''}
                    aria-hidden="true"
                  />
                  Favorito
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCompare(result)}
                  aria-pressed={isComparing(result.model.slug)}
                  aria-label={
                    isComparing(result.model.slug)
                      ? `Quitar ${result.model.name} del comparador`
                      : `Añadir ${result.model.name} al comparador`
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
                >
                  <Icon name="compare" size={13} aria-hidden="true" />
                  {isComparing(result.model.slug) ? 'En comparador' : 'Comparar'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSendToCompare}
          className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
        >
          Comparar estas opciones
          <Icon name="compare" size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          Cambiar respuestas
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-ink hover:underline"
        >
          Empezar de nuevo
        </button>
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted">
          {families.length} familias del catálogo disponibles. Precios y disponibilidad son
          demostrativos.
        </p>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------

function compareItemFor(result: FinderResult) {
  const { model } = result
  const color = model.colors[0]
  if (!color) return null
  const capacity = color.capacities[0]
  if (!capacity) return null
  return {
    id: `${model.family}/${model.slug}/${color.color}/${capacity.capacity}`,
    modelSlug: model.slug,
    family: model.family,
    name: model.name,
    color: color.name,
    capacity: capacity.capacity,
    price: capacity.price,
    specs: model.specs,
  }
}
