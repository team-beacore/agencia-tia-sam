import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, Star, MessageSquare, Phone, Settings, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '../api'
import { Card } from '../ui'
import type { Professional, Opportunity, Service, Faq, Contact } from '../../lib/types'

type Counts = {
  professionals: number
  professionalsPublished: number
  professionalsAvailable: number
  opportunities: number
  opportunitiesActive: number
  services: number
  servicesActive: number
  faqs: number
  contacts: number
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<Professional[]>('/admin/professionals').catch(() => []),
      api.get<Opportunity[]>('/admin/opportunities').catch(() => []),
      api.get<Service[]>('/admin/services').catch(() => []),
      api.get<Faq[]>('/admin/faqs').catch(() => []),
      api.get<Contact[]>('/admin/contacts').catch(() => []),
    ])
      .then(([prof, opp, serv, faq, cont]) => {
        setCounts({
          professionals: prof.length,
          professionalsPublished: prof.filter((p) => p.show_on_site && p.active).length,
          professionalsAvailable: prof.filter((p) => p.active).length,
          opportunities: opp.length,
          opportunitiesActive: opp.filter((o) => o.active && o.status === 'published').length,
          services: serv.length,
          servicesActive: serv.filter((s) => s.active).length,
          faqs: faq.length,
          contacts: cont.length,
        })
      })
      .catch(() => setError('Não foi possível carregar o resumo.'))
  }, [])

  const cards: Array<{ label: string; value: number; sub: string; to: string; icon: typeof Users }> = counts
    ? [
        { label: 'Profissionais', value: counts.professionals, sub: `${counts.professionalsPublished} publicadas · ${counts.professionalsAvailable} ativas`, to: '/admin/profissionais', icon: Users },
        { label: 'Oportunidades', value: counts.opportunities, sub: `${counts.opportunitiesActive} ativas/publicadas`, to: '/admin/oportunidades', icon: Briefcase },
        { label: 'Serviços', value: counts.services, sub: `${counts.servicesActive} ativos no site`, to: '/admin/servicos', icon: Star },
        { label: 'Perguntas (FAQ)', value: counts.faqs, sub: 'perguntas cadastradas', to: '/admin/faq', icon: MessageSquare },
        { label: 'Contatos', value: counts.contacts, sub: 'canais de contato', to: '/admin/contatos', icon: Phone },
      ]
    : []

  const shortcuts = [
    { label: 'Gerenciar profissionais', to: '/admin/profissionais', icon: Users },
    { label: 'Gerenciar oportunidades', to: '/admin/oportunidades', icon: Briefcase },
    { label: 'Gerenciar serviços', to: '/admin/servicos', icon: Star },
    { label: 'Editar contatos', to: '/admin/contatos', icon: Phone },
    { label: 'Gerenciar conteúdo e FAQ', to: '/admin/faq', icon: MessageSquare },
    { label: 'Configurações da agência', to: '/admin/configuracoes', icon: Settings },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">Resumo do conteúdo da Agência Tia Sam</p>
      </header>

      {error ? (
        <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p>
      ) : null}

      {!counts ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-grape" />
          <span className="text-sm">Carregando resumo...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => navigate(c.to)}
              className="group rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-grape/30 hover:shadow-lift"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-lavender/60 text-grape">
                <c.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-2xl font-extrabold tabular-nums tracking-tight text-ink">{c.value}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink">{c.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted">{c.sub}</p>
            </button>
          ))}
        </div>
      )}

      <Card title="Atalhos rápidos" className="mt-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {shortcuts.map((s) => (
            <button
              key={s.to}
              type="button"
              onClick={() => navigate(s.to)}
              className="group flex items-center justify-between rounded-xl border border-line/70 bg-cream/50 px-4 py-3 text-left transition-colors hover:border-grape/30 hover:bg-lavender/30"
            >
              <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-ink">
                <s.icon className="h-4 w-4 text-grape" aria-hidden="true" />
                {s.label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
