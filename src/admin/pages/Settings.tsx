import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { api } from '../api'
import { Button, Card, Field, Input, Textarea, Spinner, ImageUpload, cx } from '../ui'
import type { SiteSettings } from '../../lib/types'
import seedData from '../../../shared/seed.json'

const SEED = (seedData as any).settings ?? {}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card title={title} subtitle={subtitle} className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  )
}

function FieldSpan({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>
}

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api
      .get<SiteSettings>('/admin/settings')
      .then((s) => {
        // garante as chaves padrão presentes
        const merged: SiteSettings = {}
        for (const key of Object.keys(SEED)) merged[key] = { ...(SEED[key] ?? {}), ...(s[key] ?? {}) }
        setForm(merged)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const set = (section: string, field: string, value: unknown) => {
    setForm((prev) => (prev ? { ...prev, [section]: { ...(prev[section] ?? {}), [field]: value } } : prev))
    setSaved(false)
  }

  const save = async () => {
    if (!form) return
    setBusy(true)
    setError('')
    try {
      for (const [key, value] of Object.entries(form)) {
        await api.put(`/admin/settings/${key}`, value)
      }
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setBusy(false)
    }
  }

  if (!form) return <Spinner />

  const site = form.site ?? {}
  const hero = form.hero ?? {}
  const about = form.about ?? {}
  const companies = form.companies ?? {}
  const professionals = form.professionals ?? {}
  const editorial = form.editorial ?? {}
  const social = form.social ?? {}
  const images = form.images ?? {}

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Configurações</h1>
          <p className="mt-1 text-sm text-muted">Identidade, conteúdo institucional e imagens do site</p>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Salvar alterações
        </Button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}
      {saved ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Alterações salvas. O site público será atualizado automaticamente.
        </p>
      ) : null}

      <Section title="Identidade da agência" subtitle="Nome, slogan e informações institucionais">
        <Field label="Nome da agência">
          <Input value={site.name ?? ''} onChange={(e) => set('site', 'name', e.target.value)} />
        </Field>
        <Field label="Slogan (tagline)">
          <Input value={site.tagline ?? ''} onChange={(e) => set('site', 'tagline', e.target.value)} />
        </Field>
        <Field label="Frase de marca (rodapé)">
          <Input value={site.claim ?? ''} onChange={(e) => set('site', 'claim', e.target.value)} />
        </Field>
        <Field label="Cidade / região de atendimento">
          <Input value={site.location ?? ''} onChange={(e) => set('site', 'location', e.target.value)} />
        </Field>
        <Field label="Cidade">
          <Input value={site.city ?? ''} onChange={(e) => set('site', 'city', e.target.value)} />
        </Field>
        <Field label="Famílias atendidas (contador)">
          <Input type="number" value={String(site.familiesServed ?? 3000)} onChange={(e) => set('site', 'familiesServed', Number(e.target.value))} />
        </Field>
        <FieldSpan>
          <Field label="Descrição institucional">
            <Textarea value={site.description ?? ''} onChange={(e) => set('site', 'description', e.target.value)} rows={3} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Destaque inicial (Hero)" subtitle="Texto exibido na primeira seção do site">
        <Field label="Rótulo (eyebrow)">
          <Input value={hero.eyebrow ?? ''} onChange={(e) => set('hero', 'eyebrow', e.target.value)} />
        </Field>
        <Field label="Chamada do WhatsApp">
          <Input value={hero.whatsappHint ?? ''} onChange={(e) => set('hero', 'whatsappHint', e.target.value)} />
        </Field>
        <FieldSpan>
          <Field label="Título">
            <Input value={hero.title ?? ''} onChange={(e) => set('hero', 'title', e.target.value)} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Subtítulo">
            <Textarea value={hero.subtitle ?? ''} onChange={(e) => set('hero', 'subtitle', e.target.value)} rows={2} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Sobre a agência" subtitle="Seção institucional 'Sobre'">
        <FieldSpan>
          <Field label="Título">
            <Input value={about.title ?? ''} onChange={(e) => set('about', 'title', e.target.value)} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Texto 1">
            <Textarea value={about.text1 ?? ''} onChange={(e) => set('about', 'text1', e.target.value)} rows={3} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Texto 2">
            <Textarea value={about.text2 ?? ''} onChange={(e) => set('about', 'text2', e.target.value)} rows={3} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Seção empresas" subtitle="Conteúdo para empresas">
        <Field label="Título">
          <Input value={companies.title ?? ''} onChange={(e) => set('companies', 'title', e.target.value)} />
        </Field>
        <Field label="CTA">
          <Input value={companies.cta ?? ''} onChange={(e) => set('companies', 'cta', e.target.value)} />
        </Field>
        <FieldSpan>
          <Field label="Texto">
            <Textarea value={companies.text ?? ''} onChange={(e) => set('companies', 'text', e.target.value)} rows={2} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Benefícios (um por linha)">
            <Textarea value={(companies.benefits ?? []).join('\n')} onChange={(e) => set('companies', 'benefits', e.target.value.split('\n'))} rows={4} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Seção profissionais" subtitle="Conteúdo para profissionais">
        <Field label="Título">
          <Input value={professionals.title ?? ''} onChange={(e) => set('professionals', 'title', e.target.value)} />
        </Field>
        <Field label="CTA">
          <Input value={professionals.cta ?? ''} onChange={(e) => set('professionals', 'cta', e.target.value)} />
        </Field>
        <FieldSpan>
          <Field label="Texto">
            <Textarea value={professionals.text ?? ''} onChange={(e) => set('professionals', 'text', e.target.value)} rows={2} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Momento editorial" subtitle="Citação em tela cheia">
        <Field label="Citação">
          <Input value={editorial.quote ?? ''} onChange={(e) => set('editorial', 'quote', e.target.value)} />
        </Field>
        <Field label="Atribuição">
          <Input value={editorial.attribution ?? ''} onChange={(e) => set('editorial', 'attribution', e.target.value)} />
        </Field>
      </Section>

      <Section title="Redes sociais">
        <Field label="Handle do Instagram">
          <Input value={social.instagramHandle ?? ''} onChange={(e) => set('social', 'instagramHandle', e.target.value)} />
        </Field>
        <Field label="URL do Instagram">
          <Input value={social.instagramUrl ?? ''} onChange={(e) => set('social', 'instagramUrl', e.target.value)} />
        </Field>
      </Section>

      <Section title="Imagens das seções" subtitle="Fotos exibidas nas principais seções">
        <div className={cx('grid gap-4 sm:col-span-2 sm:grid-cols-2')}>
          <ImageUpload value={images.heroMain ?? ''} onChange={(url) => set('images', 'heroMain', url)} label="Hero principal" />
          <ImageUpload value={images.heroAlt ?? ''} onChange={(url) => set('images', 'heroAlt', url)} label="Hero (alternativa)" />
          <ImageUpload value={images.about ?? ''} onChange={(url) => set('images', 'about', url)} label="Sobre" />
          <ImageUpload value={images.companies ?? ''} onChange={(url) => set('images', 'companies', url)} label="Empresas" />
          <ImageUpload value={images.professionals ?? ''} onChange={(url) => set('images', 'professionals', url)} label="Profissionais" />
          <ImageUpload value={images.cta ?? ''} onChange={(url) => set('images', 'cta', url)} label="CTA final" />
          <ImageUpload value={images.editorial ?? ''} onChange={(url) => set('images', 'editorial', url)} label="Momento editorial" />
        </div>
      </Section>

      <div className="flex justify-end gap-2 pb-8">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}