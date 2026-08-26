import { IMAGES } from './images'

/**
 * Configuração dos três fluxos do "Assistente Tia Sam".
 * Data-driven: cada fluxo é uma lista de etapas reutilizáveis.
 */

export type WizardFlowId = 'hire' | 'professional' | 'company'

export type ChoiceOption = {
  id: string
  label: string
  description?: string
  image?: string
  alt?: string
}

export type StepConfig =
  | {
      id: string
      kind: 'choice'
      question: string
      helper?: string
      options: ChoiceOption[]
    }
  | {
      id: string
      kind: 'textarea'
      question: string
      helper?: string
      label: string
      placeholder: string
    }
  | {
      id: string
      kind: 'summary'
      question: string
    }

export type FlowConfig = {
  id: WizardFlowId
  title: string
  eyebrow: string
  intro: string
  finalCta: string
  summaryTitle: string
  summaryNote: string
  steps: StepConfig[]
  /** Rótulos curtos por etapa, usados no indicador de progresso. */
  stepLabels: string[]
  /** Etapas exibidas no resumo, na ordem, com rótulo amigável. */
  summaryFields: Array<{ stepId: string; label: string }>
}

export const WIZARD_FLOWS: Record<WizardFlowId, FlowConfig> = {
  hire: {
    id: 'hire',
    title: 'Contratar uma profissional',
    eyebrow: 'Assistente Tia Sam',
    intro: 'Vamos entender o que você precisa. Escolha com calma — a gente cuida do resto.',
    finalCta: 'Conversar com a Tia Sam',
    summaryTitle: 'Seu pedido está pronto.',
    summaryNote: 'Revise as informações e continue pelo WhatsApp. Uma pessoa de verdade vai te responder.',
    stepLabels: ['Serviço', 'Necessidade', 'Quando', 'Detalhes', 'Resumo'],
    summaryFields: [
      { stepId: 'service', label: 'Serviço' },
      { stepId: 'audience', label: 'Necessidade' },
      { stepId: 'timeline', label: 'Quando' },
      { stepId: 'notes', label: 'Observação' },
    ],
    steps: [
      {
        id: 'service',
        kind: 'choice',
        question: 'Qual serviço você procura?',
        helper: 'Selecione um serviço para continuar.',
        options: [
          {
            id: 'baba',
            label: 'Babá',
            description: 'Cuidado dedicado para as crianças.',
            image: IMAGES.services.baba,
            alt: IMAGES.services.babaAlt,
          },
          {
            id: 'secretaria',
            label: 'Secretária do lar',
            description: 'Organização e rotina da casa em dia.',
            image: IMAGES.services.secretaria,
            alt: IMAGES.services.secretariaAlt,
          },
          {
            id: 'diarista',
            label: 'Diarista',
            description: 'Praticidade para a sua rotina.',
            image: IMAGES.services.diarista,
            alt: IMAGES.services.diaristaAlt,
          },
          {
            id: 'posParto',
            label: 'Assistência pós-parto',
            description: 'Apoio humano para mãe e bebê.',
            image: IMAGES.services.posParto,
            alt: IMAGES.services.posPartoAlt,
          },
          {
            id: 'passadeira',
            label: 'Passadeira',
            description: 'Roupas impecáveis, sem preocupação.',
            image: IMAGES.services.passadeira,
            alt: IMAGES.services.passadeiraAlt,
          },
          {
            id: 'cuidadora',
            label: 'Cuidadora de idosos',
            description: 'Presença, paciência e respeito.',
            image: IMAGES.services.cuidadora,
            alt: IMAGES.services.cuidadoraAlt,
          },
        ],
      },
      {
        id: 'audience',
        kind: 'choice',
        question: 'Para quem é esse cuidado?',
        options: [
          { id: 'family', label: 'Minha família' },
          { id: 'child', label: 'Meu filho' },
          { id: 'baby', label: 'Meu bebê' },
          { id: 'elder', label: 'Uma pessoa idosa' },
          { id: 'home', label: 'Minha casa' },
          { id: 'other', label: 'Outro' },
        ],
      },
      {
        id: 'timeline',
        kind: 'choice',
        question: 'Quando você precisa?',
        options: [
          { id: 'asap', label: 'O quanto antes' },
          { id: 'week', label: 'Nesta semana' },
          { id: 'days', label: 'Nos próximos dias' },
          { id: 'researching', label: 'Ainda estou pesquisando' },
        ],
      },
      {
        id: 'notes',
        kind: 'textarea',
        question: 'Quer contar um pouco mais?',
        helper: 'Opcional — mas ajuda a gente a te entender melhor.',
        label: 'Sua mensagem',
        placeholder: 'Conte brevemente o que você precisa...',
      },
      {
        id: 'summary',
        kind: 'summary',
        question: 'Seu pedido está pronto.',
      },
    ],
  },

  professional: {
    id: 'professional',
    title: 'Fazer parte da Tia Sam',
    eyebrow: 'Para profissionais',
    intro: 'Queremos conhecer você. Cada indicação começa com uma análise.',
    finalCta: 'Quero conversar com a Tia Sam',
    summaryTitle: 'Seu cadastro está pronto.',
    summaryNote: 'Revise as informações e continue pelo WhatsApp para dar o próximo passo.',
    stepLabels: ['Oportunidade', 'Experiência', 'Trabalho', 'Sobre você', 'Resumo'],
    summaryFields: [
      { stepId: 'opportunity', label: 'Oportunidade' },
      { stepId: 'experience', label: 'Experiência' },
      { stepId: 'workMode', label: 'Como prefere trabalhar' },
      { stepId: 'about', label: 'Sobre você' },
    ],
    steps: [
      {
        id: 'opportunity',
        kind: 'choice',
        question: 'Qual oportunidade você procura?',
        helper: 'Selecione uma opção para continuar.',
        options: [
          { id: 'baba', label: 'Babá' },
          { id: 'diarista', label: 'Diarista' },
          { id: 'secretaria', label: 'Secretária do lar' },
          { id: 'cuidadora', label: 'Cuidadora de idosos' },
          { id: 'passadeira', label: 'Passadeira' },
          { id: 'posParto', label: 'Assistência pós-parto' },
          { id: 'other', label: 'Outra' },
        ],
      },
      {
        id: 'experience',
        kind: 'choice',
        question: 'Você possui experiência?',
        options: [
          { id: 'yes', label: 'Sim' },
          { id: 'no', label: 'Não' },
          { id: 'informal', label: 'Experiência informal' },
        ],
      },
      {
        id: 'workMode',
        kind: 'choice',
        question: 'Como prefere trabalhar?',
        options: [
          { id: 'fixo', label: 'Fixo' },
          { id: 'mensalista', label: 'Mensalista' },
          { id: 'diarista', label: 'Diarista' },
          { id: 'oportunidade', label: 'Por oportunidade' },
          { id: 'naoSei', label: 'Ainda não sei' },
        ],
      },
      {
        id: 'about',
        kind: 'textarea',
        question: 'Conte um pouco sobre você',
        helper: 'Opcional — sua apresentação chega junto com o pedido.',
        label: 'Sobre você',
        placeholder: 'Me conte sua experiência, sua disponibilidade e o que você ama fazer...',
      },
      {
        id: 'summary',
        kind: 'summary',
        question: 'Seu cadastro está pronto.',
      },
    ],
  },

  company: {
    id: 'company',
    title: 'Soluções para empresas',
    eyebrow: 'Para empresas',
    intro: 'Conte para a gente o que a sua empresa precisa. Vamos montar a solução juntos.',
    finalCta: 'Falar com a equipe',
    summaryTitle: 'Sua solicitação está pronta.',
    summaryNote: 'Revise as informações e continue pelo WhatsApp. Nossa equipe responde com atenção.',
    stepLabels: ['Solução', 'Quantidade', 'Necessidade', 'Resumo'],
    summaryFields: [
      { stepId: 'solution', label: 'Solução' },
      { stepId: 'quantity', label: 'Quantidade' },
      { stepId: 'need', label: 'Necessidade' },
    ],
    steps: [
      {
        id: 'solution',
        kind: 'choice',
        question: 'Que tipo de solução sua empresa procura?',
        helper: 'Selecione uma opção para continuar.',
        options: [
          { id: 'recorrentes', label: 'Profissionais recorrentes', description: 'Apoio contínuo para o dia a dia.' },
          { id: 'eventos', label: 'Eventos', description: 'Reforço pontual para ocasiões especiais.' },
          { id: 'especificos', label: 'Serviços específicos', description: 'Uma necessidade bem definida.' },
          { id: 'outra', label: 'Outra necessidade', description: 'Conte para a gente o que você imagina.' },
        ],
      },
      {
        id: 'quantity',
        kind: 'choice',
        question: 'Quantos profissionais você precisa?',
        options: [
          { id: '1', label: '1 profissional' },
          { id: '2a5', label: 'De 2 a 5 profissionais' },
          { id: '6mais', label: '6 ou mais' },
          { id: 'naoSei', label: 'Ainda não sei' },
        ],
      },
      {
        id: 'need',
        kind: 'textarea',
        question: 'Conte um pouco sobre a necessidade',
        helper: 'Opcional — quanto mais contexto, melhor a solução.',
        label: 'Sua necessidade',
        placeholder: 'Descreva o que a sua empresa precisa...',
      },
      {
        id: 'summary',
        kind: 'summary',
        question: 'Sua solicitação está pronta.',
      },
    ],
  },
}

/** Rótulo amigável de uma resposta (id → label), considerando o fluxo ativo. */
export function answerLabel(flowId: WizardFlowId, stepId: string, value: string): string {
  const flow = WIZARD_FLOWS[flowId]
  const step = flow.steps.find((s) => s.id === stepId)
  if (step && step.kind === 'choice') {
    const opt = step.options.find((o) => o.id === value)
    if (opt) return opt.label
  }
  return value
}

/** Monta a mensagem personalizada do WhatsApp a partir das respostas. */
export function generateWhatsAppMessage(
  flowId: WizardFlowId,
  answers: Record<string, string>,
): string {
  const label = (stepId: string) => answerLabel(flowId, stepId, answers[stepId] ?? '')

  if (flowId === 'hire') {
    const note = answers.notes?.trim()
    const lines = [
      'Olá, Agência Tia Sam! 💜',
      '',
      'Gostaria de contratar uma profissional.',
      '',
      `Serviço: ${label('service')}`,
      `Necessidade: ${label('audience')}`,
      `Quando: ${label('timeline')}`,
      ...(note ? ['', `Observação: ${note}`] : []),
      '',
      'Gostaria de conversar sobre as opções disponíveis.',
    ]
    return lines.join('\n')
  }

  if (flowId === 'professional') {
    const about = answers.about?.trim()
    const lines = [
      'Olá, Agência Tia Sam! 💜',
      '',
      'Quero fazer parte da agência.',
      '',
      `Oportunidade: ${label('opportunity')}`,
      `Experiência: ${label('experience')}`,
      `Como prefere trabalhar: ${label('workMode')}`,
      ...(about ? ['', `Sobre mim: ${about}`] : []),
      '',
      'Gostaria de conversar sobre as oportunidades disponíveis.',
    ]
    return lines.join('\n')
  }

  const need = answers.need?.trim()
  const lines = [
    'Olá, Agência Tia Sam! 💜',
    '',
    'Sou uma empresa e gostaria de conhecer as soluções da agência.',
    '',
    `Solução: ${label('solution')}`,
    `Quantidade: ${label('quantity')}`,
    ...(need ? ['', `Necessidade: ${need}`] : []),
    '',
    'Gostaria de falar com a equipe.',
  ]
  return lines.join('\n')
}
