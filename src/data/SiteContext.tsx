import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchPublicSite } from '../lib/types'
import type { SiteData, Contact, Service, Faq } from '../lib/types'
import seedData from '../../shared/seed.json'

export type SiteContextValue = {
  data: SiteData
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  whatsapp: Contact | undefined
  instagram: Contact | undefined
  services: Service[]
  faqs: Faq[]
  siteName: string
  siteLocation: string
  familiesServed: number
  whatsappNumber: string
  whatsappDisplay: string
  instagramUrl: string
  instagramHandle: string
}

function toSeed(): SiteData {
  const s = seedData as any
  return {
    settings: s.settings ?? {},
    contacts: s.contacts ?? [],
    services: (s.services ?? []).map((x: any) => ({ ...x, active: x.active !== false })),
    faqs: (s.faqs ?? []).map((x: any) => ({ ...x, active: x.active !== false })),
    professionals: s.professionals ?? [],
    opportunities: s.opportunities ?? [],
  }
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(toSeed)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const remote = await fetchPublicSite()
      setData({
        settings: remote.settings ?? {},
        contacts: remote.contacts ?? [],
        services: remote.services ?? [],
        faqs: remote.faqs ?? [],
        professionals: remote.professionals ?? [],
        opportunities: remote.opportunities ?? [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<SiteContextValue>(() => {
    const settings = data.settings ?? {}
    const site = settings.site ?? {}
    const social = settings.social ?? {}
    const whatsapp = data.contacts.find((c) => c.type === 'whatsapp' && c.active)
    const instagram = data.contacts.find((c) => c.type === 'instagram' && c.active)
    const services = data.services.filter((s) => s.active)
    const faqs = data.faqs.filter((f) => f.active)

    return {
      data,
      loading,
      error,
      refresh: load,
      whatsapp,
      instagram,
      services,
      faqs,
      siteName: site.name || 'Agência Tia Sam',
      siteLocation: site.location || 'Manaus - AM',
      familiesServed: Number(site.familiesServed) || 3000,
      whatsappNumber: whatsapp?.value || '5592984146066',
      whatsappDisplay: whatsapp?.display || '+55 92 98414-6066',
      instagramUrl: social.instagramUrl || instagram?.value || '',
      instagramHandle: social.instagramHandle || instagram?.display || '@agenciatiasam.manaus',
    }
  }, [data, loading, error, load])

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext)
  if (!ctx) throw new Error('useSite deve ser usado dentro de SiteProvider')
  return ctx
}
