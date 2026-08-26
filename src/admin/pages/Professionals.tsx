import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2, Info } from 'lucide-react'
import { api } from '../api'
import { Button, Field, Input, Textarea, Toggle, Badge, Modal, Spinner, EmptyState, ResponsiveTable, RowActions, ImageUpload } from '../ui'
import type { Professional, Service } from '../../lib/types'

const EMPTY: Omit<Professional, 'id'> = {
  name: '',
  role: '',
  photo: '',
  location: '',
  bio: '',
  experience: '',
  availability: '',
  services: [],
  show_on_site: false,
  active: true,
}

export default function ProfessionalsPage() {
  const [rows, setRows] = useState<Professional[] | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [form, setForm] = useState<Omit<Professional, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<Professional[]>('/admin/professionals')
      .then(setRows)
      .catch((e) => setError(e.message))
    api
      .get<Service[]>('/admin/services')
      .then(setServices)
      .catch(() => {})
  }, [])

  useEffect(load, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, active: true })
    setOpen(true)
  }

  const openEdit = (p: Professional) => {
    setEditing(p)
    setForm({
      name: p.name,
      role: p.role,
      photo: p.photo,
      location: p.location,
      bio: p.bio,
      experience: p.experience,
      availability: p.availability,
      services: p.services ?? [],
      show_on_site: p.show_on_site,
      active: p.active,
    })
    setOpen(true)
  }

  const toggleService = (slug: string) => {
    const has = form.services.includes(slug)
    setForm({ ...form, services: has ? form.services.filter((s) => s !== slug) : [...form.services, slug] })
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) await api.put(`/admin/professionals/${editing.id}`, form)
      else await api.post('/admin/professionals', form)
      setOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (p: Professional, field: 'active' | 'show_on_site') => {
    await api.put(`/admin/professionals/${p.id}`, { ...p, [field]: !p[field] })
    load()
  }

  const remove = async (p: Professional) => {
    if (!window.confirm(`Excluir a profissional "${p.name}"?`)) return
    await api.delete(`/admin/professionals/${p.id}`)
    load()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Profissionais</h1>
          <p className="mt-1 text-sm text-muted">Cadastro de profissionais da agência</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova profissional
        </Button>
      </header>

      <p className="mb-4 flex items-start gap-2 rounded-xl border border-grape/15 bg-lavender/40 px-4 py-3 text-xs leading-relaxed text-grape">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Apenas profissionais <strong>ativas</strong> e com <strong>"Exibir no site"</strong> ativado aparecem publicamente. Não inclua dados sensíveis (documentos, endereço completo, contato direto).
      </p>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}

      {!rows ? (
        <Spinner />
      ) : (
        <ResponsiveTable<Professional>
          columns={[
            { key: 'name', label: 'Profissional' },
            { key: 'services', label: 'Áreas', className: 'hidden lg:table-cell' },
            { key: 'site', label: 'No site' },
            { key: 'status', label: 'Ativa' },
            { key: 'actions', label: '', className: 'text-right' },
          ]}
          rows={rows}
          empty={<EmptyState title="Nenhuma profissional cadastrada" hint="Cadastre uma profissional para gerenciar quem aparece no site." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova profissional</Button>} />}
          renderRow={(p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-lavender/60" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-xs text-muted">{p.role || p.location || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {(p.services ?? []).length ? p.services.slice(0, 2).map((s) => <Badge key={s} tone="violet">{s}</Badge>) : <span className="text-xs text-muted">—</span>}
                  {(p.services ?? []).length > 2 ? <Badge tone="neutral">+{(p.services ?? []).length - 2}</Badge> : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <Toggle checked={p.show_on_site} onChange={() => toggle(p, 'show_on_site')} />
              </td>
              <td className="px-4 py-3">
                <Toggle checked={p.active} onChange={() => toggle(p, 'active')} />
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(p)} onDelete={() => remove(p)} />
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? `Editar: ${editing.name}` : 'Nova profissional'} onClose={() => setOpen(false)} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da profissional" />
          </Field>
          <Field label="Área de atuação (função)">
            <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex.: Babá" />
          </Field>
          <Field label="Localização / região">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Zona Centro-Sul, Manaus" />
          </Field>
          <Field label="Disponibilidade">
            <Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} placeholder="Ex.: Segunda a sexta, manhã e tarde" />
          </Field>
          <Field label="Experiência">
            <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="Ex.: 5 anos com cuidados infantis" />
          </Field>
          <div className="sm:col-span-2">
            <ImageUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} label="Foto (apenas se autorizada)" />
          </div>
          <Field label="Breve descrição" className="sm:col-span-2">
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </Field>
          <Field label="Serviços que presta" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-cream/50 p-3">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleService(s.slug)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${form.services.includes(s.slug) ? 'border-grape bg-grape text-white' : 'border-line bg-white text-muted hover:border-grape/40'}`}
                >
                  {s.name}
                </button>
              ))}
              {services.length === 0 ? <span className="text-xs text-muted">Crie serviços antes de selecionar áreas.</span> : null}
            </div>
          </Field>
          <Field label="Exibir no site">
            <div className="flex h-[46px] items-center">
              <Toggle checked={form.show_on_site} onChange={(v) => setForm({ ...form, show_on_site: v })} label={form.show_on_site ? 'Sim, aparece no site' : 'Não exibir publicamente'} />
            </div>
          </Field>
          <Field label="Ativa">
            <div className="flex h-[46px] items-center">
              <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label={form.active ? 'Ativa' : 'Inativa'} />
            </div>
          </Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line/70 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </div>
      </Modal>
    </div>
  )
}