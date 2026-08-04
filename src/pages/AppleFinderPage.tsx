import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { Icon } from '../components/ui/Icon'
import { ProductImage } from '../components/product/ProductImage'
import { ProvisionalBadge } from '../components/ui/Tag'
import { useStore } from '../lib/store'
import { useCatalogo, useIdioma, useMotivo, useT } from '../lib/i18n'
import {
  FINDER_QUESTIONS,
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
  type BudgetOption,
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
  'intro' | 'family' | 'general' | 'family-confirm' | 'specific' | 'budget' | 'budgetFlex' | 'summary' | 'results'

const FINDER_FAMILIES: readonly { slug: FamilySlug | 'unknown'; label: string }[] = [
  { slug: 'iphone', label: 'iPhone' },
  { slug: 'mac', label: 'Mac' },
  { slug: 'ipad', label: 'iPad' },
  { slug: 'apple-watch', label: 'Apple Watch' },
  { slug: 'airpods', label: 'AirPods' },
  { slug: 'unknown', label: 'No lo tengo claro' },
]

export function AppleFinderPage() {
  const { t, intl } = useIdioma()
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
    () => (answers.family ? getBudgetOptionsForFamily(answers.family, getFamilyModels(answers.family), intl) : []),
    [answers.family, intl],
  )

  const computation: FinderComputation | null = useMemo(() => {
    if (stage !== 'results' || !answers.family) return null
    return computeFinderResults(getFamilyModels(answers.family), answers, intl)
  }, [stage, answers, intl])

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
    setAnswers((current) => {
      const nextGeneral: FinderAnswers['general'] = { ...current.general, [key]: value }
      // Limpieza de dependencias: workType solo tiene sentido cuando el uso
      // principal es "trabajo". Al cambiar el uso a cualquier otro valor
      // retiramos la clave del objeto (no dejarla como undefined) para que
      // ni el resumen ni el motor de ranking la vean como respuesta activa.
      if (key === 'use' && value !== 'trabajo') {
        delete nextGeneral.workType
      }
      return { ...current, general: nextGeneral }
    })
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
      // Sin fallback: si no hay ninguna familia candidata, mostramos el
      // estado sin coincidencias (no inyectamos iPhone con score 0).
      setCandidates(computeFamilyCandidates(answers.general))
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t('finder.kicker')}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{t('finder.title')}</h1>
        <p className="mt-2 text-muted">{t('finder.intro')}</p>
        <div className="mt-3">
          <ProvisionalBadge label={t('finder.demoBadge')} />
        </div>
      </header>

      {stage === 'intro' && (
        <section aria-labelledby="intro-heading" className="mt-8 rounded-[16px] border border-line bg-neutral p-6">
          <h2 id="intro-heading" className="text-xl font-bold text-ink">
            {t('finder.introTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">{t('finder.introBody')}</p>
          <button
            type="button"
            onClick={() => setStage('family')}
            className="mt-5 inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
          >
            {t('finder.start')} <Icon name="arrow-right" size={14} aria-hidden="true" />
          </button>
        </section>
      )}

      {stage === 'family' && <FamilyStep onBack={() => setStage('intro')} onPick={pickFamilyDirect} />}

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
          general={answers.general}
          onConfirm={confirmFamily}
          onSeeAll={() => setStage('family')}
          onBack={goPrev}
          onReviewAnswers={() => {
            // Vuelve al flujo general, situándose en "¿Qué tipo de producto
            // necesitas?" para que el usuario pueda cambiar la respuesta
            // que causó el descarte, sin perder el resto.
            const flow = getGeneralQuestionFlow(answers.general)
            const idx = flow.findIndex((q) => q.id === 'general.productRole')
            setStage('general')
            setStep(Math.max(0, idx))
          }}
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

function FamilyStep({ onBack, onPick }: { onBack: () => void; onPick: (slug: FamilySlug | 'unknown') => void }) {
  const t = useT()
  return (
    <section aria-labelledby="family-heading" className="mt-8">
      <h2 id="family-heading" className="text-xl font-bold text-ink">
        {t('finder.whichProduct')}
      </h2>
      <ul
        role="radiogroup"
        aria-label={t('finder.productFamily')}
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
      <button type="button" onClick={onBack} className="mt-6 text-sm font-semibold text-ink hover:underline">
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
  const t = useT()
  const cat = useCatalogo()
  return (
    <section aria-labelledby={`q-${question.id}`} className="mt-8">
      <div className="mb-3 flex items-center justify-between" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {t('finder.questionOf', { n: stepNumber, total: totalSteps })}
        </p>
      </div>
      <div className="rounded-[16px] border border-line bg-surface p-6">
        <h2 id={`q-${question.id}`} className="text-lg font-bold text-ink">
          {cat(question.prompt)}
        </h2>
        {question.help && <p className="mt-1 text-xs text-muted">{cat(question.help)}</p>}
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
                  {cat(option.label)}
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
          {t('finder.previous')}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLast ? t('finder.continue') : t('finder.next')}
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

function FamilyConfirmStep({
  candidates,
  general,
  onConfirm,
  onSeeAll,
  onBack,
  onReviewAnswers,
}: {
  candidates: FamilyCandidate[]
  general: FinderAnswers['general']
  onConfirm: (family: FamilySlug) => void
  onSeeAll: () => void
  onBack: () => void
  onReviewAnswers: () => void
}) {
  const t = useT()
  const primary = candidates[0]
  const secondary = candidates[1]

  // Estado sin coincidencias: 0 candidatas.
  const emptyHeadingRef = useRef<HTMLHeadingElement | null>(null)
  const noCandidates = !primary
  useEffect(() => {
    if (!noCandidates) return
    const node = emptyHeadingRef.current
    if (!node) return
    node.focus({ preventScroll: true })
  }, [noCandidates])

  if (!primary) {
    const isPhotoAccessory = general.use === 'foto' && general.productRole === 'accessory'
    return (
      <section aria-labelledby="family-confirm" className="mt-8" aria-live="polite">
        <h2 id="family-confirm" ref={emptyHeadingRef} tabIndex={-1} className="text-xl font-bold text-ink outline-none">
          {t('finder.noCategory')}
        </h2>
        <p className="mt-2 text-sm text-ink">
          {isPhotoAccessory ? t('finder.noPhotoCategory') : t('finder.noSuggestion')}
        </p>
        <p className="mt-2 text-sm text-muted">
          {isPhotoAccessory
            ? 'Este prototipo recomienda dispositivos Apple y complementos de audio o salud, pero no incluye una categoría específica de accesorios para fotografía.'
            : t('finder.reviewAnswers')}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReviewAnswers}
            className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
          >
            {t('finder.reviewStep')}
          </button>
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
          >
            {t('finder.allCategories')}
          </button>
          <button type="button" onClick={onBack} className="text-sm font-semibold text-ink hover:underline">
            {t('finder.back')}
          </button>
        </div>
      </section>
    )
  }

  // 1 o 2 candidatas: layout normal. Con una sola no renderizamos la
  // segunda tarjeta ni pasamos por un placeholder vacío.
  return (
    <section aria-labelledby="family-confirm" className="mt-8" aria-live="polite">
      <h2 id="family-confirm" className="text-xl font-bold text-ink">
        Por lo que nos cuentas, creemos que {secondary ? t('finder.theseCategories') : t('finder.thisCategory')}
      </h2>
      <p className="mt-1 text-sm text-muted">
        Confirma con {secondary ? 'cuál' : 'ella'} seguimos o elige otra manualmente.
      </p>
      <div className={secondary ? 'mt-5 grid gap-4 md:grid-cols-2' : 'mt-5 grid gap-4 md:max-w-md'}>
        <CandidateCard
          candidate={primary}
          label={t('finder.mainPick')}
          primary
          onConfirm={() => onConfirm(primary.family)}
        />
        {secondary && (
          <CandidateCard
            candidate={secondary}
            label={t('finder.secondPick')}
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
          {t('finder.allCategories')}
        </button>
        <button type="button" onClick={onBack} className="text-sm font-semibold text-ink hover:underline">
          {t('finder.back')}
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
  const t = useT()
  const motivo = useMotivo()
  const info = familyInfo(candidate.family)
  return (
    <div className={`rounded-[16px] border p-5 ${primary ? 'border-brand bg-brand-050' : 'border-line bg-surface'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{label}</p>
      <h3 className="mt-1 text-lg font-bold text-ink">{info?.name}</h3>
      {info && <p className="text-sm text-ink">{info.tagline}.</p>}
      {candidate.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-ink">
          {candidate.reasons.map((r) => (
            <li key={r.texto} className="flex items-start gap-2">
              <Icon name="check" size={14} className="mt-0.5 text-ink" aria-hidden="true" />
              {motivo(r)}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onConfirm}
        className={`mt-4 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold ${primary ? 'bg-action text-ink hover:bg-action-600' : 'border border-line bg-surface text-ink hover:border-ink/30'}`}
      >
        {primary ? t('finder.continueCategory') : t('finder.chooseThis')}
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
  options: BudgetOption[]
  value: string | null
  onChange: (v: string) => void
  onPrev: () => void
  onNext: () => void
}) {
  const t = useT()
  const cat = useCatalogo()
  return (
    <section aria-labelledby="q-budget" className="mt-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t('finder.budget')}</p>
      <div className="mt-2 rounded-[16px] border border-line bg-surface p-6">
        <h2 id="q-budget" className="text-lg font-bold text-ink">
          ¿Qué presupuesto orientativo tienes para {familyName}?
        </h2>
        <p className="mt-1 text-xs text-muted">{t('finder.bandsNote')}</p>
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
                  {cat(opt.label, opt.labelValores)}
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
          {t('finder.previous')}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!value}
          className="inline-flex items-center gap-2 rounded-[10px] bg-action px-4 py-2 text-sm font-semibold text-ink hover:bg-action-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('finder.next')}
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
  budgetOptions: BudgetOption[]
  onEditFamily: () => void
  onEditSpecific: (qid: string) => void
  onEditBudget: () => void
  onEditBudgetFlex: () => void
  onEditGeneral: (key: string) => void
  onSee: () => void
  onReset: () => void
  onPrev: () => void
}) {
  const t = useT()
  const cat = useCatalogo()
  const info = answers.family ? familyInfo(answers.family) : null
  const specificRows = answers.family
    ? FINDER_QUESTIONS[answers.family].map((q) => {
        const value = answers.specific[q.id]
        const opt = value ? q.options.find((o) => o.value === value) : null
        return { qid: q.id, prompt: cat(q.prompt), label: opt ? cat(opt.label) : '—' }
      })
    : []
  // Solo mostramos preguntas del flujo actualmente aplicable (p. ej. no
  // "¿Qué tipo de trabajo?" cuando el uso ya no es Trabajo). Además, solo
  // filas con respuesta — nada de filas vacías por respuestas antiguas.
  const generalRows = getGeneralQuestionFlow(answers.general)
    .filter((q) => q.id !== 'general.budget' && q.id !== 'general.budgetFlex')
    .map((q) => {
      const key = q.id.split('.')[1] as keyof FinderAnswers['general']
      const value = answers.general[key]
      const opt = value ? q.options.find((o) => o.value === value) : null
      return {
        key: key as string,
        prompt: cat(q.prompt),
        label: opt ? cat(opt.label) : null,
      }
    })
    .filter((row) => row.label !== null) as { key: string; prompt: string; label: string }[]
  const banda = budgetOptions.find((b) => b.value === answers.general.budget)
  const budgetLabel = answers.general.budget && banda ? cat(banda.label, banda.labelValores) : undefined
  const opcionFlex = BUDGET_FLEX_QUESTION.options.find((o) => o.value === answers.general.budgetFlex)
  const flexLabel = answers.general.budgetFlex && opcionFlex ? cat(opcionFlex.label) : undefined

  return (
    <section aria-labelledby="summary-heading" className="mt-8">
      <h2 id="summary-heading" className="text-xl font-bold text-ink">
        {t('finder.summaryTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('finder.summaryIntro')}</p>
      <ul className="mt-5 divide-y divide-line rounded-[16px] border border-line bg-surface">
        <SummaryRow label={t('finder.product')} value={info?.name ?? '—'} onEdit={onEditFamily} />
        {generalRows.map((r) => (
          <SummaryRow key={r.key} label={r.prompt} value={r.label} onEdit={() => onEditGeneral(r.key)} />
        ))}
        {specificRows.map((r) => (
          <SummaryRow key={r.qid} label={r.prompt} value={r.label} onEdit={() => onEditSpecific(r.qid)} />
        ))}
        <SummaryRow label={t('finder.budget')} value={budgetLabel ?? '—'} onEdit={onEditBudget} />
        <SummaryRow label={t('finder.flexibility')} value={flexLabel ?? '—'} onEdit={onEditBudgetFlex} />
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSee}
          className="inline-flex items-center gap-2 rounded-[12px] bg-action px-5 py-3 text-sm font-semibold text-ink hover:bg-action-600"
        >
          {t('finder.seeResults')}
          <Icon name="arrow-right" size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          {t('finder.goBack')}
        </button>
        <button type="button" onClick={onReset} className="text-sm font-semibold text-ink hover:underline">
          {t('finder.restart')}
        </button>
      </div>
    </section>
  )
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const t = useT()
  return (
    <li className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="text-sm text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('finder.changeField', { campo: label })}
        className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink/30"
      >
        {t('finder.change')}
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
  const t = useT()
  const { intl } = useIdioma()
  const cat = useCatalogo()
  const motivo = useMotivo()
  const info = familyInfo(family)

  if (computation.noMatch || computation.results.length === 0) {
    return (
      <section aria-labelledby="results-heading" className="mt-8">
        <h2 id="results-heading" className="text-2xl font-bold text-ink">
          {t('finder.noMatch')}
        </h2>
        <p className="mt-2 text-sm text-ink">
          Con las restricciones que has indicado no queda ningún {info?.name}. Puedes revisar tus respuestas, ampliar el
          presupuesto o cambiar de formato.
        </p>
        {computation.excluded.length > 0 && (
          <div className="mt-4 rounded-[12px] border border-line bg-neutral p-4 text-sm text-ink">
            <p className="font-semibold">{t('finder.discarded')}</p>
            <ul className="mt-2 space-y-1">
              {computation.excluded.slice(0, 5).map((e) => (
                <li key={e.slug}>
                  <span className="font-medium">{e.slug}:</span> {motivo(e.reason)}
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
            {t('finder.reviewStep')}
          </button>
          <button
            type="button"
            onClick={onRelax}
            className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
          >
            {t('finder.raiseBudget')}
          </button>
          <button type="button" onClick={onReset} className="text-sm font-semibold text-ink hover:underline">
            {t('finder.restart')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="results-heading" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t('finder.resultsStep')}</p>
          <h2 id="results-heading" className="text-2xl font-bold text-ink">
            {t('finder.suggestedIn', { familia: info?.name ?? '' })}
          </h2>
        </div>
        <ProvisionalBadge label={t('finder.demoGuidance')} />
      </div>
      <ul aria-label={t('finder.results')} className="mt-5 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {computation.results.map((result) => (
          <li
            key={`${result.role}-${result.model.slug}`}
            className="flex h-full min-h-[520px] flex-col rounded-[16px] border border-line bg-surface p-4"
          >
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-050 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
              {result.role === 'best-fit'
                ? t('finder.bestFit')
                : result.role === 'best-value'
                  ? t('finder.bestValue')
                  : t('finder.otherOption')}
            </span>
            <ProductImage src={result.model.colors[0].image} alt={cat(result.model.name)} ratio="4 / 3" />
            <h3 className="mt-2 text-lg font-bold text-ink">{cat(result.model.name)}</h3>
            <p className="mt-1 text-sm text-ink">{t('hero.from', { importe: euro(result.model.fromPrice, intl) })}</p>
            {result.positives.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {t('finder.fitsBecause')}
                </p>
                <ul className="mt-1 space-y-1 text-sm text-ink">
                  {result.positives.map((p) => (
                    <li key={p.texto} className="flex items-start gap-2">
                      <Icon name="check" size={14} className="mt-0.5 text-available" aria-hidden="true" />
                      {motivo(p)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.caveats.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {t('finder.considerThis')}
                </p>
                <ul className="mt-1 space-y-1 text-xs text-ink">
                  {result.caveats.map((c) => (
                    <li key={c.texto} className="flex items-start gap-2">
                      <Icon name="info" size={12} className="mt-0.5" aria-hidden="true" />
                      {motivo(c)}
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
                  {t('finder.viewProduct')}
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
                  {t('finder.favorite')}
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
                  {isComparing(result.model.slug) ? t('finder.inCompare') : t('finder.compare')}
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
          {t('finder.compareThese')}
          <Icon name="compare" size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30"
        >
          {t('finder.changeAnswers')}
        </button>
        <button type="button" onClick={onReset} className="text-sm font-semibold text-ink hover:underline">
          {t('finder.restart')}
        </button>
      </div>
      <div className="mt-4">
        <p className="text-xs text-muted">
          {t('finder.catalogNote', {
            familias: families.length,
            modelos: computation.eligibleCount,
          })}
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
