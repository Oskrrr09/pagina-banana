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
  BUDGET_FLEX_QUESTION,
  computeFinderResults,
  computeFamilyCandidates,
  getBudgetOptionsForFamily,
  getGeneralQuestionFlow,
  emptyAnswers,
  type FamilySlug,
  type FinderAnswers,
  type FinderQuestion,
  type FinderResult,
  type FinderComputation,
  type FamilyCandidate,
  type BudgetFlex,
} from '../data/productDecisionData'
import { families, getFamilyModels, familyInfo, variantPath } from '../data/products'
import { euro } from '../lib/format'

// -----------------------------------------------------------------------
// Asistente "Encuentra tu Apple" (v2).
//
// - Ruta: /elige-tu-apple.
// - Estado 100 % en React (sin persistencia).
// - Nueva arquitectura de respuestas con namespaces: `general.*`, `family`
//   y `specific.*`. Ver `FinderAnswers` en productDecisionData.ts.
// - Fases del flujo:
//     intro → family → (opcional) general → family-confirm (si "No sé") →
//     specific → budget → budgetFlex → summary → results.
// - Los resultados usan `computeFinderResults` (roles Mejor encaje /
//   Mejor relación calidad-precio / Otra opción, con relajación
//   transparente cuando ninguno cumple).
// - Todo demostrativo.
// -----------------------------------------------------------------------

type Stage =
  | 'intro'
  | 'family'
  | 'general'
  | 'family-confirm'
  | 'specific'
  | 'budget'
  | 'budgetFlex'
  | 'summary'
  | 'results'

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
  const { toggleFavorite, isFavorite, toggleCompare, isComparing, compare } = useStore()

  const [stage, setStage] = useState<Stage>('intro')
  const [answers, setAnswers] = useState<FinderAnswers>(() => emptyAnswers())
  const [step, setStep] = useState(0)
  const [candidates, setCandidates] = useState<FamilyCandidate[]>([])

  const activeQuestions: readonly FinderQuestion[] = useMemo(() => {
    if (stage === 'general') return getGeneralQuestionFlow(answers.general)
    if (stage === 'specific' && answers.family) return FINDER_QUESTIONS[answers.family]
    return []
  }, [stage, answers.family, answers.general])

  const totalSteps = activeQuestions.length
  const currentQ = activeQuestions[step] ?? null

  const budgetOptions = useMemo(
    () => (answers.family ? getBudgetOptionsForFamily(answers.family, getFamilyModels(answers.family)) : []),
    [answers.family],
  )

  const computation: FinderComputation | null = useMemo(() => {
    if (stage !== 'results' || !answers.family) return null
    return computeFinderResults(getFamilyModels(answers.family), answers)
  }, [stage, answers])

  function reset() {
    setStage('intro')
    setAnswers(emptyAnswers())
    setStep(0)
    setCandidates([])
  }

  function pickFamilyDirect(family: FamilySlug | 'unknown') {
    if (family === 'unknown') {
      setAnswers({ general: {}, family: null, specific: {} })
      setStage('general')
      setStep(0)
      return
    }
    setAnswers({ general: answers.general, family, specific: {} })
    setStage('specific')
    setStep(0)
  }

  function setGeneral(key: keyof FinderAnswers['general'], value: string) {
    setAnswers((a) => ({ ...a, general: { ...a.general, [key]: value } }))
  }
  function setSpecific(id: string, value: string) {
    setAnswers((a) => ({ ...a, specific: { ...a.specific, [id]: value } }))
  }

  function answerCurrent(value: string) {
    if (!currentQ) return
    if (currentQ.id.startsWith('general.')) {
      const key = currentQ.id.split('.')[1] as keyof FinderAnswers['general']
      setGeneral(key, value)
    } else {
      setSpecific(currentQ.id, value)
    }
  }

  function currentAnswer(): string | null {
    if (!currentQ) return null
    if (currentQ.id.startsWith('general.')) {
      const key = currentQ.id.split('.')[1] as keyof FinderAnswers['general']
      return (answers.general[key] as string | undefined) ?? null
    }
    return answers.specific[currentQ.id] ?? null
  }

  function goNext() {
    if (!currentQ || !currentAnswer()) return
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
      return
    }
    if (stage === 'general') {
      // Calculamos candidatos y pedimos confirmación.
      const cands = computeFamilyCandidates(answers.general)
      setCandidates(cands.length > 0 ? cands : [{ family: 'iphone', score: 0, reasons: [] }])
      setStage('family-confirm')
      setStep(0)
      return
    }
    // stage === 'specific': saltamos a presupuesto.
    setStage('budget')
    setStep(0)
  }

  function goPrev() {
    if (step > 0) {
      setStep((s) => s - 1)
      return
    }
    if (stage === 'general') {
      setStage('family')
      return
    }
    if (stage === 'specific') {
      // Si venimos de "No lo tengo claro" (había general.use), volvemos a la confirmación.
      if (answers.general.use) {
        setStage('family-confirm')
        return
      }
      setStage('family')
      return
    }
    if (stage === 'budget') {
      setStage('specific')
      setStep(FINDER_QUESTIONS[answers.family!].length - 1)
      return
    }
    if (stage === 'budgetFlex') {
      setStage('budget')
      return
    }
    if (stage === 'summary') {
      setStage('budgetFlex')
      return
    }
    if (stage === 'family-confirm') {
      setStage('general')
      setStep(getGeneralQuestionFlow(answers.general).length - 1)
      return
    }
    if (stage === 'family') setStage('intro')
    if (stage === 'results') setStage('summary')
  }

  function confirmFamily(family: FamilySlug) {
    // Conservamos las respuestas generales — no las pisamos.
    setAnswers((a) => ({ ...a, family, specific: {} }))
    setStage('specific')
    setStep(0)
  }

  function goToStage(target: Stage) {
    setStage(target)
    setStep(0)
  }

  function sendToCompare() {
    if (!computation) return
    for (const result of computation.results) {
      const item = compareItemFor(result)
      if (item && !isComparing(item.id)) toggleCompare(item)
    }
    navigate('/comparar')
  }

  return (
    <Container className="py-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          Asistente
        </p>
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
        <FamilyStep onBack={() => setStage('intro')} onPick={pickFamilyDirect} />
      )}

      {(stage === 'general' || stage === 'specific') && currentQ && (
        <QuestionStep
          key={`${stage}-${currentQ.id}-${step}`}
          question={currentQ}
          currentAnswer={currentAnswer()}
          onAnswer={answerCurrent}
          stepNumber={step + 1}
          totalSteps={totalSteps}
          onPrev={goPrev}
          onNext={goNext}
          canNext={Boolean(currentAnswer())}
          isLast={step === totalSteps - 1 && stage === 'specific'}
        />
      )}

      {stage === 'family-confirm' && (
        <FamilyConfirmStep
          candidates={candidates}
          onConfirm={confirmFamily}
          onSeeAll={() => setStage('family')}
          onBack={goPrev}
        />
      )}

      {stage === 'budget' && answers.family && (
        <BudgetStep
          familyName={familyInfo(answers.family)?.name ?? ''}
          options={budgetOptions}
          value={answers.general.budget ?? null}
          onChange={(v) => setGeneral('budget', v)}
          onPrev={goPrev}
          onNext={() => setStage('budgetFlex')}
        />
      )}

      {stage === 'budgetFlex' && (
        <QuestionStep
          key="budgetFlex"
          question={BUDGET_FLEX_QUESTION}
          currentAnswer={answers.general.budgetFlex ?? null}
          onAnswer={(v) => setGeneral('budgetFlex', v as BudgetFlex)}
          stepNumber={1}
          totalSteps={1}
          onPrev={goPrev}
          onNext={() => setStage('summary')}
          canNext={Boolean(answers.general.budgetFlex)}
          isLast
        />
      )}

      {stage === 'summary' && answers.family && (
        <SummaryStep
          answers={answers}
          budgetOptions={budgetOptions}
          onEditFamily={() => setStage('family')}
          onEditSpecific={(qid) => {
            const idx = FINDER_QUESTIONS[answers.family!].findIndex((q) => q.id === qid)
            setStage('specific')
            setStep(Math.max(0, idx))
          }}
          onEditBudget={() => setStage('budget')}
          onEditBudgetFlex={() => setStage('budgetFlex')}
          onEditGeneral={(key) => {
            const flow = getGeneralQuestionFlow(answers.general)
            const idx = flow.findIndex((q) => q.id === `general.${key}`)
            setStage('general')
            setStep(Math.max(0, idx))
          }}
          onSee={() => setStage('results')}
          onReset={reset}
          onPrev={goPrev}
        />
      )}

      {stage === 'results' && answers.family && computation && (
        <ResultsStep
          family={answers.family}
          computation={computation}
          onReset={reset}
          onEdit={() => goToStage('summary')}
          onSendToCompare={sendToCompare}
          onToggleFavorite={(slug) => toggleFavorite(`${answers.family}/${slug}`)}
          isFavorite={(slug) => isFavorite(`${answers.family}/${slug}`)}
          onToggleCompare={(result) => {
            const item = compareItemFor(result)
            if (item) toggleCompare(item)
          }}
          isComparing={(slug) => compare.some((c) => c.modelSlug === slug)}
          onRelax={() => {
            // Ampliar presupuesto rápido: subir a "sin límite" y volver a summary.
            setGeneral('budget', 'sin-limite')
            setGeneral('budgetFlex', 'reference')
            setStage('summary')
          }}
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
        className="mt-4 grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FINDER_FAMILIES.map((option) => {
          const info = option.slug !== 'unknown' ? familyInfo(option.slug) : null
          return (
            <li key={option.slug} className="h-full">
              <button
                type="button"
                role="radio"
                aria-checked={false}
                onClick={() => onPick(option.slug)}
                className="flex h-full min-h-[92px] w-full items-start gap-3 rounded-[12px] border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-banana hover:shadow-[var(--shadow-raised)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-050 text-ink">
                  <Icon
                    name={
                      option.slug === 'unknown'
                        ? 'chat'
                        : option.slug === 'apple-watch'
                          ? 'shield'
                          : 'store'
                    }
                    aria-hidden="true"
                  />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{option.label}</span>
                  {info && (
                    <span className="mt-0.5 block text-xs text-muted">{info.tagline}.</span>
                  )}
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
  onPrev,
  onNext,
  canNext,
  isLast,
}: {
  question: FinderQuestion
  currentAnswer: string | null
  onAnswer: (value: string) => void
  stepNumber: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
  canNext: boolean
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
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
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
          {isLast ? 'Continuar' : 'Siguiente'}
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function FamilyConfirmStep({
  candidates,
  onConfirm,
  onSeeAll,
  onBack,
}: {
  candidates: FamilyCandidate[]
  onConfirm: (family: FamilySlug) => void
  onSeeAll: () => void
  onBack: () => void
}) {
  const primary = candidates[0]
  const secondary = candidates[1]
  return (
    <section aria-labelledby="family-confirm" className="mt-8">
      <h2 id="family-confirm" className="text-xl font-bold text-ink">
        Por lo que nos cuentas, creemos que estas categorías pueden encajar
      </h2>
      <p className="mt-1 text-sm text-muted">
        Confirma con cuál seguimos o elige otra manualmente.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {primary && (
          <CandidateCard
            candidate={primary}
            label="Recomendación principal"
            primary
            onConfirm={() => onConfirm(primary.family)}
          />
        )}
        {secondary && (
          <CandidateCard
            candidate={secondary}
            label="Segunda posibilidad"
            onConfirm={() => onConfirm(secondary.family)}
          />
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          Ver todas las categorías
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-ink hover:underline"
        >
          ← Atrás
        </button>
      </div>
    </section>
  )
}

function CandidateCard({
  candidate,
  label,
  primary,
  onConfirm,
}: {
  candidate: FamilyCandidate
  label: string
  primary?: boolean
  onConfirm: () => void
}) {
  const info = familyInfo(candidate.family)
  return (
    <div className={`rounded-[16px] border p-5 ${primary ? 'border-brand bg-brand-050' : 'border-line bg-surface'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{label}</p>
      <h3 className="mt-1 text-lg font-bold text-ink">{info?.name}</h3>
      {info && <p className="text-sm text-ink">{info.tagline}.</p>}
      {candidate.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink">
          {candidate.reasons.map((r) => (
            <li key={r} className="flex items-start gap-2">
              <Icon name="check" size={14} className="mt-0.5 text-ink" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onConfirm}
        className={`mt-4 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold ${primary ? 'bg-action text-ink hover:bg-action-600' : 'border border-line bg-surface text-ink hover:border-ink/30'}`}
      >
        {primary ? 'Continuar con esta categoría' : 'Elegir esta'}
        <Icon name="arrow-right" size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

function BudgetStep({
  familyName,
  options,
  value,
  onChange,
  onPrev,
  onNext,
}: {
  familyName: string
  options: { value: string; label: string; max: number | null }[]
  value: string | null
  onChange: (v: string) => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <section aria-labelledby="q-budget" className="mt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Presupuesto
      </p>
      <div className="mt-2 rounded-[16px] border border-line bg-surface p-6">
        <h2 id="q-budget" className="text-lg font-bold text-ink">
          ¿Qué presupuesto orientativo tienes para {familyName}?
        </h2>
        <p className="mt-1 text-xs text-muted">
          Tramos calculados sobre el catálogo actual del prototipo.
        </p>
        <ul role="radiogroup" aria-labelledby="q-budget" className="mt-4 grid gap-2">
          {options.map((opt) => {
            const selected = value === opt.value
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(opt.value)}
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
                  {opt.label}
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
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Siguiente
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function SummaryStep({
  answers,
  budgetOptions,
  onEditFamily,
  onEditSpecific,
  onEditBudget,
  onEditBudgetFlex,
  onEditGeneral,
  onSee,
  onReset,
  onPrev,
}: {
  answers: FinderAnswers
  budgetOptions: { value: string; label: string }[]
  onEditFamily: () => void
  onEditSpecific: (qid: string) => void
  onEditBudget: () => void
  onEditBudgetFlex: () => void
  onEditGeneral: (key: string) => void
  onSee: () => void
  onReset: () => void
  onPrev: () => void
}) {
  const info = answers.family ? familyInfo(answers.family) : null
  const specificRows = answers.family
    ? FINDER_QUESTIONS[answers.family].map((q) => {
        const value = answers.specific[q.id]
        const opt = value ? q.options.find((o) => o.value === value) : null
        return { qid: q.id, prompt: q.prompt, label: opt?.label ?? '—' }
      })
    : []
  const generalRows = (Object.keys(answers.general) as Array<keyof FinderAnswers['general']>)
    .filter((k) => k !== 'budget' && k !== 'budgetFlex')
    .map((k) => {
      const value = answers.general[k]
      const q = GENERAL_QUESTIONS.find((qq) => qq.id === `general.${k}`)
      const opt = value && q ? q.options.find((o) => o.value === value) : null
      return { key: k as string, prompt: q?.prompt ?? String(k), label: opt?.label ?? String(value ?? '—') }
    })
  const budgetLabel =
    answers.general.budget && budgetOptions.find((b) => b.value === answers.general.budget)?.label
  const flexLabel =
    answers.general.budgetFlex &&
    BUDGET_FLEX_QUESTION.options.find((o) => o.value === answers.general.budgetFlex)?.label

  return (
    <section aria-labelledby="summary-heading" className="mt-8">
      <h2 id="summary-heading" className="text-xl font-bold text-ink">
        Esto es lo que buscas
      </h2>
      <p className="mt-1 text-sm text-muted">
        Revisa las respuestas antes de ver las recomendaciones. Puedes editar cualquier línea.
      </p>
      <ul className="mt-5 divide-y divide-line rounded-[16px] border border-line bg-surface">
        <SummaryRow label="Producto" value={info?.name ?? '—'} onEdit={onEditFamily} />
        {generalRows.map((r) => (
          <SummaryRow
            key={r.key}
            label={r.prompt}
            value={r.label}
            onEdit={() => onEditGeneral(r.key)}
          />
        ))}
        {specificRows.map((r) => (
          <SummaryRow
            key={r.qid}
            label={r.prompt}
            value={r.label}
            onEdit={() => onEditSpecific(r.qid)}
          />
        ))}
        <SummaryRow
          label="Presupuesto"
          value={budgetLabel ?? '—'}
          onEdit={onEditBudget}
        />
        <SummaryRow
          label="Flexibilidad"
          value={flexLabel ?? '—'}
          onEdit={onEditBudgetFlex}
        />
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSee}
          className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
        >
          Ver recomendaciones
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-ink hover:underline"
        >
          Empezar de nuevo
        </button>
      </div>
    </section>
  )
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <li className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="text-sm text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Cambiar: ${label}`}
        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
      >
        Cambiar
      </button>
    </li>
  )
}

function ResultsStep({
  family,
  computation,
  onReset,
  onEdit,
  onSendToCompare,
  onToggleFavorite,
  isFavorite,
  onToggleCompare,
  isComparing,
  onRelax,
}: {
  family: FamilySlug
  computation: FinderComputation
  onReset: () => void
  onEdit: () => void
  onSendToCompare: () => void
  onToggleFavorite: (slug: string) => void
  isFavorite: (slug: string) => boolean
  onToggleCompare: (result: FinderResult) => void
  isComparing: (slug: string) => boolean
  onRelax: () => void
}) {
  const info = familyInfo(family)

  if (computation.noMatch || computation.results.length === 0) {
    return (
      <section aria-labelledby="results-heading" className="mt-8">
        <h2 id="results-heading" className="text-2xl font-bold text-ink">
          No encontramos una opción que cumpla todo
        </h2>
        <p className="mt-2 text-sm text-ink">
          Con las restricciones que has indicado no queda ningún {info?.name}. Puedes revisar tus
          respuestas, ampliar el presupuesto o cambiar de formato.
        </p>
        {computation.excluded.length > 0 && (
          <div className="mt-4 rounded-[12px] border border-line bg-neutral p-4 text-sm text-ink">
            <p className="font-semibold">Lo que hemos descartado:</p>
            <ul className="mt-2 space-y-1">
              {computation.excluded.slice(0, 5).map((e) => (
                <li key={e.slug}>
                  <span className="font-medium">{e.slug}:</span> {e.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
          >
            Revisar respuestas
          </button>
          <button
            type="button"
            onClick={onRelax}
            className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
          >
            Ampliar presupuesto y probar
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-semibold text-ink hover:underline"
          >
            Empezar de nuevo
          </button>
        </div>
      </section>
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
        className="mt-5 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {computation.results.map((result) => (
          <li
            key={`${result.role}-${result.model.slug}`}
            className="flex h-full min-h-[520px] flex-col rounded-[16px] border border-line bg-surface p-4"
          >
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
              {result.role === 'best-fit'
                ? 'Mejor encaje'
                : result.role === 'best-value'
                  ? 'Mejor relación calidad-precio'
                  : 'Otra opción que también encaja'}
            </span>
            <ProductImage
              src={result.model.colors[0].image}
              alt={result.model.name}
              ratio="4 / 3"
            />
            <h3 className="mt-2 text-lg font-bold text-ink">{result.model.name}</h3>
            <p className="mt-1 text-sm text-ink">desde {euro(result.model.fromPrice)}</p>
            {result.positives.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Encaja contigo porque
                </p>
                <ul className="mt-1 space-y-1 text-sm text-ink">
                  {result.positives.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Icon name="check" size={14} className="mt-0.5 text-available" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.caveats.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Ten en cuenta
                </p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {result.caveats.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <Icon name="info" size={12} className="mt-0.5" aria-hidden="true" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
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
          demostrativos. {computation.eligibleCount} modelo(s) elegible(s) tras aplicar tus
          restricciones.
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
