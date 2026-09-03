import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Pencil, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { whatsappLink } from '../../config/site'
import {
  generateWhatsAppMessage,
  summaryValue,
  WIZARD_FLOWS,
} from '../../config/wizard'
import type { ChoiceOption, StepConfig, WizardFlowId } from '../../config/wizard'
import { useSite } from '../../data/SiteContext'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { useWizard } from './WizardContext'

const EASE = [0.22, 1, 0.36, 1] as const
const AUTO_ADVANCE_MS = 420

/**
 * "Assistente Tia Sam" — modal premium reutilizável.
 * Desktop: painel central. Mobile: tela cheia.
 */
export function ContactWizard() {
  const { activeFlow, closeWizard } = useWizard()

  return (
    <AnimatePresence>
      {activeFlow ? (
        <WizardPanel key={activeFlow} flowId={activeFlow} onClose={closeWizard} />
      ) : null}
    </AnimatePresence>
  )
}

function WizardPanel({
  flowId,
  onClose,
}: {
  flowId: WizardFlowId
  onClose: () => void
}) {
  const flow = WIZARD_FLOWS[flowId]
  const { prefill } = useWizard()
  const site = useSite()

  // Opções de serviço dinâmicas (serviços ativos cadastrados no painel)
  const serviceOptions = useMemo<ChoiceOption[]>(
    () =>
      site.services.map((s) => ({
        id: s.slug,
        label: s.name,
        description: s.tagline,
        ...(s.image ? { image: s.image } : {}),
        ...(s.alt ? { alt: s.alt } : {}),
      })),
    [site.services],
  )

  // Opções de oportunidade dinâmicas (oportunidades publicadas no painel)
  const opportunityOptions = useMemo<ChoiceOption[]>(() => {
    const opps = (site.data.opportunities ?? [])
      .filter((o) => o.active && o.status === 'published')
      .map((o) => ({ id: String(o.id), label: o.title, ...(o.type ? { description: o.type } : {}) }))
    if (opps.length > 0) return [...opps, { id: 'other', label: 'Outra' }]
    // fallback: serviços como tipos de oportunidade
    return [
      ...site.services.map((s) => ({ id: s.slug, label: s.name })),
      { id: 'other', label: 'Outra' },
    ]
  }, [site.data.opportunities, site.services])

  // Stepper contextual: se a primeira etapa (serviço) já veio respondida antes de abrir,
  // começa direto na próxima etapa — nunca pergunta duas vezes o mesmo serviço.
  const firstStep = flow.steps[0]
  const startIndex = firstStep?.kind === 'choice' && Boolean(prefill[firstStep.id]) ? 1 : 0

  const [stepIndex, setStepIndex] = useState(startIndex)
  const [answers, setAnswers] = useState<Record<string, string>>(prefill)
  const [showError, setShowError] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLHeadingElement>(null)
  const advanceTimer = useRef<number | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const reduce = useReducedMotion()

  // Limpa o timer de avanço automático ao desmontar
  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  const step = flow.steps[stepIndex]
  // Passo "serviço" (contratação) e "oportunidade" (profissional) recebem opções dinâmicas
  const resolvedStep: StepConfig =
    flowId === 'hire' && step.kind === 'choice' && step.id === 'service'
      ? { ...step, options: serviceOptions }
      : flowId === 'professional' && step.kind === 'choice' && step.id === 'opportunity'
        ? { ...step, options: opportunityOptions }
        : step
  const isSummary = resolvedStep.kind === 'summary'
  const total = flow.steps.length
  const progress = Math.round(((stepIndex + 1) / total) * 100)

  // Trava o scroll do body, foca o painel e fecha com Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      lastFocusedRef.current?.focus()
    }
  }, [onClose])

  // Foco volta para a pergunta quando troca de etapa (acessível e sem perder o contexto)
  useEffect(() => {
    if (reduce) return
    const id = window.setTimeout(() => {
      questionRef.current?.focus()
    }, 260)
    return () => window.clearTimeout(id)
  }, [stepIndex, reduce])

  // Focus trap: mantém o Tab circulando dentro do diálogo
  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [],
  )

  const answer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }))

  const canContinue = useMemo(() => {
    if (resolvedStep.kind === 'choice') return Boolean(answers[resolvedStep.id])
    if (resolvedStep.kind === 'date') {
      const optionId = answers[resolvedStep.id]
      if (!optionId) return false
      const opt = resolvedStep.options.find((o) => o.id === optionId)
      if (opt?.mode === 'single') return Boolean(answers[`${resolvedStep.id}.date`])
      if (opt?.mode === 'range') return Boolean(answers[`${resolvedStep.id}.start`] && answers[`${resolvedStep.id}.end`])
      return true
    }
    return true
  }, [resolvedStep, answers])

  // Avança com validação: se obrigatório não preenchido, mostra mensagem amigável
  const goNext = useCallback(() => {
    if (!canContinue) {
      setShowError(true)
      return
    }
    setShowError(false)
    setStepIndex((i) => Math.min(i + 1, total - 1))
  }, [canContinue, total])

  const goBack = useCallback(() => {
    setShowError(false)
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  const jumpTo = useCallback((index: number) => {
    setShowError(false)
    setStepIndex(index)
  }, [])

  // Seleção de opção: salva + limpa erro + auto-avança no passo de serviço
  const selectOption = (value: string) => {
    setShowError(false)
    if (resolvedStep.kind === 'date') {
      setAnswers((prev) => {
        const next = { ...prev }
        if (next[resolvedStep.id] !== value) {
          delete next[`${resolvedStep.id}.date`]
          delete next[`${resolvedStep.id}.start`]
          delete next[`${resolvedStep.id}.end`]
        }
        next[resolvedStep.id] = value
        return next
      })
      return
    }
    answer(resolvedStep.id, value)
    if (resolvedStep.id === 'service' && flowId === 'hire') {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null
        setStepIndex((i) => (i === 0 ? 1 : i))
      }, AUTO_ADVANCE_MS)
    }
  }

  const setDateValue = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setShowError(false)
  }

  // Opção selecionada exibida no banner (serviço na contratação; oportunidade no fluxo
  // profissional) — mostrado nas etapas seguintes, exceto no resumo.
  const choiceBanner =
    flowId === 'hire' && stepIndex >= 1 && !isSummary && answers.service
      ? { option: serviceOptions.find((o) => o.id === answers.service), changeLabel: 'Alterar serviço' }
      : flowId === 'professional' && stepIndex >= 1 && !isSummary && answers.opportunity
        ? { option: opportunityOptions.find((o) => o.id === answers.opportunity), changeLabel: 'Alterar' }
        : undefined

  const resolveLabel = useCallback(
    (stepId: string, value: string) => {
      if (stepId === 'service') return serviceOptions.find((o) => o.id === value)?.label
      if (stepId === 'opportunity') return opportunityOptions.find((o) => o.id === value)?.label
      return undefined
    },
    [serviceOptions, opportunityOptions],
  )

  const message = useMemo(
    () => generateWhatsAppMessage(flowId, answers, resolveLabel),
    [flowId, answers, resolveLabel],
  )

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      onKeyDown={handlePanelKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-night/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-[100dvh] w-full flex-col bg-cream outline-none sm:h-auto sm:max-h-[90dvh] sm:max-w-3xl sm:rounded-[28px] sm:shadow-lift"
        initial={reduce ? false : { opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 32, scale: 0.98 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {/* Cabeçalho */}
        <header className="flex items-center justify-between gap-4 border-b border-line/70 px-5 pb-4 pt-5 sm:px-8 sm:pt-7">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-grape">
              {flow.eyebrow}
            </p>
            <h2 id="wizard-title" className="mt-1 truncate text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {flow.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-lavender/70 hover:text-grape"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Indicador de etapas */}
        <StepIndicator steps={flow.stepLabels} current={stepIndex} reduce={reduce} />

        {/* Barra de progresso */}
        <div
          className="h-1 w-full bg-lavender/60"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Etapa ${stepIndex + 1} de ${total}`}
        >
          <motion.div
            className="h-full bg-grape"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        </div>

        {/* Conteúdo */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Etapa {stepIndex + 1} de {total}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              aria-live="polite"
              initial={reduce ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -18 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <h3
                ref={questionRef}
                tabIndex={-1}
                className="tracking-headline mt-4 text-[clamp(1.4rem,3vw,1.9rem)] font-extrabold leading-snug text-ink outline-none"
              >
                {resolvedStep.question}
              </h3>
              {resolvedStep.kind !== 'summary' && resolvedStep.helper ? (
                <p className="mt-2 text-sm text-muted">{resolvedStep.helper}</p>
              ) : null}

              <div className="mt-6">
                {resolvedStep.kind === 'choice' && (
                  <ChoiceStep
                    step={resolvedStep}
                    value={answers[resolvedStep.id] ?? ''}
                    onSelect={selectOption}
                  />
                )}

                {resolvedStep.kind === 'date' && (
                  <DateStep
                    step={resolvedStep}
                    answers={answers}
                    onSelect={selectOption}
                    onDateChange={setDateValue}
                  />
                )}

                {resolvedStep.kind === 'textarea' && (
                  <label className="block">
                    <span className="sr-only">{resolvedStep.label}</span>
                    <textarea
                      value={answers[resolvedStep.id] ?? ''}
                      onChange={(e) => answer(resolvedStep.id, e.target.value)}
                      placeholder={resolvedStep.placeholder}
                      rows={5}
                      autoFocus={!reduce}
                      className="w-full resize-none rounded-2xl border border-line bg-white/70 px-5 py-4 text-[15px] leading-relaxed text-ink placeholder:text-muted/60 focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
                    />
                  </label>
                )}

                {resolvedStep.kind === 'summary' && (
                  <SummaryStep
                    flowId={flowId}
                    answers={answers}
                    onEdit={jumpTo}
                    resolve={resolveLabel}
                  />
                )}
              </div>

              {/* Banner da escolha selecionada (serviço na contratação; oportunidade no profissional) */}
              {choiceBanner?.option ? (
                <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-grape/15 bg-lavender/50 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {choiceBanner.option.image ? (
                      <img
                        src={choiceBanner.option.image}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                        Você escolheu
                      </p>
                      <p className="truncate text-[15px] font-bold text-grape">{choiceBanner.option.label}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpTo(0)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-bold text-grape underline-offset-4 transition-colors hover:bg-lavender/70 hover:underline"
                  >
                    {choiceBanner.changeLabel}
                  </button>
                </div>
              ) : null}

              {/* Mensagem de validação */}
              <AnimatePresence>
                {showError && !canContinue ? (
                  <motion.p
                    role="alert"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    className="mt-4 flex items-center gap-2.5 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-magenta" />
                    {resolvedStep.kind === 'choice' && resolvedStep.id === 'service'
                      ? 'Selecione um serviço para continuar.'
                      : resolvedStep.kind === 'date' && !answers[resolvedStep.id]
                        ? 'Selecione uma opção para continuar.'
                        : resolvedStep.kind === 'date'
                          ? 'Informe a(s) data(s) para continuar.'
                          : resolvedStep.kind === 'choice' && resolvedStep.helper
                            ? resolvedStep.helper
                            : 'Selecione uma opção para continuar.'}
                  </motion.p>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rodapé de navegação */}
        <footer className="border-t border-line/70 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
          {isSummary ? (
            <a
              href={whatsappLink(message, site.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-grape px-7 py-4 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {flow.finalCta}
              <span className="sr-only">abre o WhatsApp em nova aba</span>
            </a>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold transition-colors',
                  stepIndex === 0
                    ? 'cursor-not-allowed text-muted/40'
                    : 'text-grape hover:bg-lavender/60',
                )}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar
              </button>
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2.5 rounded-full bg-grape px-7 py-3.5 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-plum"
              >
                Continuar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </footer>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Indicador de etapas ---------- */

function StepIndicator({
  steps,
  current,
  reduce,
}: {
  steps: string[]
  current: number
  reduce: boolean | null
}) {
  return (
    <nav aria-label="Progresso do pedido" className="px-5 pt-4 sm:px-8">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} className="flex min-w-0 items-center">
              <span className="flex items-center gap-2">
                <motion.span
                  aria-hidden="true"
                  initial={reduce ? false : { scale: 0.7, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 sm:h-7 sm:w-7 sm:text-[11px]',
                    done && 'bg-grape text-white',
                    active && 'border-2 border-grape bg-lavender text-grape shadow-[0_0_0_3px_rgba(138,92,184,0.15)]',
                    !done && !active && 'border border-line bg-white/70 text-muted/50',
                  )}
                >
                  {done ? (
                    <motion.span
                      initial={reduce ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </motion.span>
                <span
                  className={cn(
                    'hidden whitespace-nowrap text-[11px] font-semibold tracking-wide transition-colors duration-300 sm:block',
                    active ? 'text-grape' : done ? 'text-muted' : 'text-muted/50',
                  )}
                >
                  {label}
                </span>
              </span>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-2 h-px min-w-2 flex-1 transition-colors duration-500 sm:mx-3',
                    i < current ? 'bg-grape/40' : 'bg-line',
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ---------- Etapa de escolha ---------- */

function ChoiceStep({
  step,
  value,
  onSelect,
}: {
  step: Extract<(typeof WIZARD_FLOWS)[WizardFlowId]['steps'][number], { kind: 'choice' }>
  value: string
  onSelect: (value: string) => void
}) {
  const reduce = useReducedMotion()
  const hasImages = step.options.some((o) => o.image)

  if (hasImages) {
    return (
      <div role="radiogroup" aria-label={step.question} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {step.options.map((opt) => {
          const selected = value === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(opt.id)}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className={cn(
                'group relative overflow-hidden rounded-2xl border text-left transition-all duration-300',
                selected
                  ? 'border-grape bg-white shadow-soft ring-2 ring-grape/25'
                  : 'border-line bg-white/70 hover:-translate-y-0.5 hover:border-grape/40 hover:shadow-soft',
              )}
            >
              {opt.image ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-lavender/40">
                  <img
                    src={opt.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      'absolute inset-0 transition-colors duration-300',
                      selected ? 'bg-grape/15' : 'bg-night/10 group-hover:bg-night/5',
                    )}
                  />
                  <AnimatePresence>
                    {selected && (
                      <motion.span
                        initial={reduce ? false : { scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduce ? undefined : { scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-grape text-white shadow-soft"
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
              <div className="px-3.5 py-3">
                <p className={cn('text-sm font-bold', selected ? 'text-grape' : 'text-ink')}>
                  {opt.label}
                </p>
                {opt.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{opt.description}</p>
                ) : null}
              </div>
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="radiogroup" aria-label={step.question} className="space-y-2.5">
      {step.options.map((opt) => {
        const selected = value === opt.id
        return (
          <motion.button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(opt.id)}
            whileTap={reduce ? undefined : { scale: 0.99 }}
            className={cn(
              'flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300',
              selected
                ? 'border-grape bg-lavender/40 shadow-soft'
                : 'border-line bg-white/60 hover:-translate-y-0.5 hover:border-grape/35 hover:bg-lavender/20 hover:shadow-soft',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
                selected ? 'border-grape' : 'border-muted/40',
              )}
            >
              {selected && (
                <motion.span
                  key={`dot-${opt.id}`}
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                  className="h-2.5 w-2.5 rounded-full bg-grape"
                />
              )}
            </span>
            <span className="min-w-0">
              <span className={cn('block text-[15px] font-bold', selected ? 'text-grape' : 'text-ink')}>
                {opt.label}
              </span>
              {opt.description ? (
                <span className="mt-0.5 block text-sm text-muted">{opt.description}</span>
              ) : null}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/* ---------- Etapa com data ---------- */

function DateStep({
  step,
  answers,
  onSelect,
  onDateChange,
}: {
  step: Extract<(typeof WIZARD_FLOWS)[WizardFlowId]['steps'][number], { kind: 'date' }>
  answers: Record<string, string>
  onSelect: (value: string) => void
  onDateChange: (key: string, value: string) => void
}) {
  const reduce = useReducedMotion()
  const selected = answers[step.id] ?? ''
  const active = step.options.find((o) => o.id === selected)

  const inputCls =
    'w-full rounded-2xl border border-line bg-white/70 px-5 py-3.5 text-[15px] text-ink placeholder:text-muted/60 focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20'

  return (
    <div>
      <div role="radiogroup" aria-label={step.question} className="space-y-2.5">
        {step.options.map((opt) => {
          const sel = selected === opt.id
          return (
            <motion.button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onSelect(opt.id)}
              whileTap={reduce ? undefined : { scale: 0.99 }}
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300',
                sel
                  ? 'border-grape bg-lavender/40 shadow-soft'
                  : 'border-line bg-white/60 hover:-translate-y-0.5 hover:border-grape/35 hover:bg-lavender/20 hover:shadow-soft',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300',
                  sel ? 'border-grape' : 'border-muted/40',
                )}
              >
                {sel && (
                  <motion.span
                    key={`dot-${opt.id}`}
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    className="h-2.5 w-2.5 rounded-full bg-grape"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-[15px] font-bold', sel ? 'text-grape' : 'text-ink')}>
                  {opt.label}
                </span>
                {opt.description ? (
                  <span className="mt-0.5 block text-sm text-muted">{opt.description}</span>
                ) : null}
              </span>
            </motion.button>
          )
        })}
      </div>

      {active?.mode === 'single' ? (
        <div className="mt-5">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              {active.dateLabel ?? 'Data desejada'}
            </span>
            <input
              type="date"
              value={answers[`${step.id}.date`] ?? ''}
              onChange={(e) => onDateChange(`${step.id}.date`, e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      ) : null}

      {active?.mode === 'range' ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              {active.startLabel ?? 'Início'}
            </span>
            <input
              type="date"
              value={answers[`${step.id}.start`] ?? ''}
              onChange={(e) => onDateChange(`${step.id}.start`, e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">
              {active.endLabel ?? 'Fim'}
            </span>
            <input
              type="date"
              value={answers[`${step.id}.end`] ?? ''}
              onChange={(e) => onDateChange(`${step.id}.end`, e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}

/* ---------- Resumo ---------- */

function SummaryStep({
  flowId,
  answers,
  onEdit,
  resolve,
}: {
  flowId: WizardFlowId
  answers: Record<string, string>
  onEdit: (stepIndex: number) => void
  resolve?: (stepId: string, value: string) => string | undefined
}) {
  const flow = WIZARD_FLOWS[flowId]

  return (
    <div>
      <p className="mb-5 text-base leading-relaxed text-muted">{flow.summaryNote}</p>
      <ul className="overflow-hidden rounded-2xl border border-line bg-white/60">
        {flow.summaryFields.map((field, i) => {
          const step = flow.steps.find((s) => s.id === field.stepId)
          const value = summaryValue(flowId, step, answers, resolve)
          const stepIdx = flow.steps.findIndex((s) => s.id === field.stepId)
          return (
            <li
              key={field.stepId}
              className={cn(
                'flex items-center justify-between gap-4 px-5 py-4',
                i > 0 && 'border-t border-line/80',
              )}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {field.label}
                </p>
                <p className="mt-1 truncate text-[15px] font-semibold text-ink">
                  {value || '—'}
                </p>
              </div>
              {value ? (
                <button
                  type="button"
                  onClick={() => onEdit(stepIdx)}
                  aria-label={`Editar ${field.label}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-lavender/70 hover:text-grape"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
