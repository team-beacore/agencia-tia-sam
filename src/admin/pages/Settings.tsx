import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Loader2, Save } from 'lucide-react'
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

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos')
      return
    }
    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha')
      return
    }
    setBusy(true)
    try {
      await api.changePassword(currentPassword, newPassword)
      setSuccess('Senha alterada com sucesso.')
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar a senha')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Senha do administrador" subtitle="Altere a senha usada para acessar o painel" className="mb-6">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Senha atual">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </Field>
        <Field label="Nova senha" hint="Mínimo de 8 caracteres">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirmar nova senha">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </Field>
        <div className="flex items-end justify-end sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            Alterar senha
          </Button>
        </div>
        {error ? (
          <p className="rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta sm:col-span-2">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 sm:col-span-2">
            {success}
          </p>
        ) : null}
      </form>
    </Card>
  )
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

  const setNested = (section: string, field: string, sub: string, value: unknown) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            [section]: {
              ...(prev[section] ?? {}),
              [field]: { ...(prev[section]?.[field] ?? {}), [sub]: value },
            },
          }
        : prev,
    )
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
  const founder = about.founder ?? {}
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

      <PasswordSection />

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
          <Field label="Rótulo (eyebrow)">
            <Input value={about.eyebrow ?? ''} onChange={(e) => set('about', 'eyebrow', e.target.value)} />
          </Field>
        </FieldSpan>
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

      <Section title="Quem está por trás" subtitle="Apresentação da fundadora (Samara Santos)">
        <FieldSpan>
          <Field label="Rótulo (eyebrow)">
            <Input value={founder.eyebrow ?? ''} onChange={(e) => setNested('about', 'founder', 'eyebrow', e.target.value)} />
          </Field>
        </FieldSpan>
        <Field label="Nome">
          <Input value={founder.name ?? ''} onChange={(e) => setNested('about', 'founder', 'name', e.target.value)} />
        </Field>
        <Field label="Cargo / papel">
          <Input value={founder.role ?? ''} onChange={(e) => setNested('about', 'founder', 'role', e.target.value)} />
        </Field>
        <Field label="Idade (ex.: 28 anos)">
          <Input value={founder.age ?? ''} onChange={(e) => setNested('about', 'founder', 'age', e.target.value)} />
        </Field>
        <Field label="Formação">
          <Input value={founder.formation ?? ''} onChange={(e) => setNested('about', 'founder', 'formation', e.target.value)} />
        </Field>
        <Field label="Experiência">
          <Input value={founder.experience ?? ''} onChange={(e) => setNested('about', 'founder', 'experience', e.target.value)} />
        </Field>
        <FieldSpan>
          <Field label="Apresentação (bio)">
            <Textarea value={founder.bio ?? ''} onChange={(e) => setNested('about', 'founder', 'bio', e.target.value)} rows={3} />
          </Field>
        </FieldSpan>
      </Section>

      <Section title="Números da história" subtitle="Indicadores exibidos em cards na seção 'Sobre'">
        <Field label="Fundação">
          <Input value={about.stats?.founded ?? ''} onChange={(e) => setNested('about', 'stats', 'founded', e.target.value)} />
        </Field>
        <Field label="Experiência da fundadora">
          <Input value={about.stats?.founderExperience ?? ''} onChange={(e) => setNested('about', 'stats', 'founderExperience', e.target.value)} />
        </Field>
        <Field label="Atuação da agência">
          <Input value={about.stats?.monthsActive ?? ''} onChange={(e) => setNested('about', 'stats', 'monthsActive', e.target.value)} />
        </Field>
      </Section>

      <Section title="Missão, visão e valores" subtitle="Área institucional compacta">
        <FieldSpan>
          <Field label="Missão">
            <Textarea value={about.mission ?? ''} onChange={(e) => set('about', 'mission', e.target.value)} rows={2} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Visão">
            <Textarea value={about.vision ?? ''} onChange={(e) => set('about', 'vision', e.target.value)} rows={2} />
          </Field>
        </FieldSpan>
        <FieldSpan>
          <Field label="Valores" hint="Um valor por linha. Ex.: Ética, Respeito, Empatia...">
            <Textarea
              value={Array.isArray(about.values) ? about.values.join('\n') : ''}
              onChange={(e) => set('about', 'values', e.target.value.split('\n').map((v) => v.trim()).filter(Boolean))}
              rows={4}
            />
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
          <ImageUpload value={images.founder ?? ''} onChange={(url) => set('images', 'founder', url)} label="Fundadora (Samara)" />
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