export type ContactType = 'whatsapp' | 'phone' | 'instagram' | 'email' | 'address' | 'hours' | 'other'

export type Contact = {
  id?: number
  label: string
  type: ContactType
  value: string
  display: string
  sort_order?: number
  active: boolean
}

export type Service = {
  id?: number
  slug: string
  name: string
  tagline: string
  description: string
  benefits: string[]
  image: string
  alt: string
  cta: string
  sort_order?: number
  active: boolean
}

export type Professional = {
  id?: number
  name: string
  role: string
  photo: string
  location: string
  bio: string
  experience: string
  availability: string
  services: string[]
  show_on_site: boolean
  active: boolean
  sort_order?: number
}

export type Opportunity = {
  id?: number
  title: string
  description: string
  type: string
  requirements: string
  location: string
  status: 'draft' | 'published'
  published_at: string | null
  closes_at: string | null
  active: boolean
  sort_order?: number
}

export type Faq = {
  id?: number
  question: string
  answer: string
  sort_order?: number
  active: boolean
}

export type SiteSettings = Record<string, any>

export type SiteData = {
  settings: SiteSettings
  contacts: Contact[]
  services: Service[]
  faqs: Faq[]
  professionals: Professional[]
  opportunities: Opportunity[]
}

export async function fetchPublicSite(): Promise<SiteData> {
  const res = await fetch('/api/public/site', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Falha ao carregar dados do site (${res.status})`)
  return res.json()
}
