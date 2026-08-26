import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { api } from '../api'
import { Button, Field, Input, Textarea, Toggle, Badge, Modal, Spinner, EmptyState, ResponsiveTable, RowActions, Select } from '../ui'
import type { Opportunity } from '../../lib/types'

const EMPTY: Omit<Opportunity, 'id'> = {
  title: '',
  description: '',
  type: '',
  requirements: '',
  location: '',
  status: 'draft',
  published_at: null,
  closes_at: null,
  active: true,
}

export default function OpportunitiesPage() {
  const [rows, setRows] = useState<Opportunity[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [form, setForm] = useState<Omit<Opportunity, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<Opportunity[]>('/admin/opportunities')
      .then(setRows)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, active: true, status: 'draft', published_at: new Date().toISOString().slice(0, 10) })
    setOpen(true)
  }

  const openEdit = (o: Opportunity) => {
    setEditing(o)
    setForm({
      title: o.title,
      description: o.description,
      type: o.type,
      requirements: o.requirements,
      location: o.location,
      status: o.status,
      published_at: o.published_at,
      closes_at: o.closes_at,
      active: o.active,
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) await api.put(`/admin/opportunities/${editing.id}`, form)
      else await api.post('/admin/opportunities', form)
      setOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (o: Opportunity) => {
    await api.put(`/admin/opportunities/${o.id}`, { ...o, active: !o.active })
    load()
  }

  const remove = async (o: Opportunity) => {
    if (!window.confirm(`Excluir a oportunidade "${o.title}"?`)) return
    await api.delete(`/admin/opportunities/${o.id}`)
    load()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Oportunidades</h1>
          <p className="mt-1 text-sm text-muted">Vagas e oportunidades para profissionais. Somente as ativas e publicadas aparecem no site.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova oportunidade
        </Button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}

      {!rows ? (
        <Spinner />
      ) : (
        <ResponsiveTable<Opportunity>
          columns={[
            { key: 'title', label: 'Título' },
            { key: 'type', label: 'Tipo', className: 'hidden md:table-cell' },
            { key: 'status', label: 'Status' },
            { key: 'active', label: 'Ativa' },
            { key: 'actions', label: '', className: 'text-right' },
          ]}
          rows={rows}
          empty={<EmptyState title="Nenhuma oportunidade cadastrada" hint="Crie uma oportunidade e publique-a para aparecer no site." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova oportunidade</Button>} />}
          renderRow={(o) => (
            <tr key={o.id}>
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{o.title}</p>
                <p className="truncate text-xs text-muted">{o.location || o.description}</p>
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{o.type || '—'}</td>
              <td className="px-4 py-3">
                {o.status === 'published' ? <Badge tone="green">Publicada</Badge> : <Badge tone="amber">Rascunho</Badge>}
              </td>
              <td className="px-4 py-3">
                <Toggle checked={o.active} onChange={() => toggle(o)} label={o.active ? 'Ativa' : 'Inativa'} />
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(o)} onDelete={() => remove(o)} />
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? `Editar: ${editing.title}` : 'Nova oportunidade'} onClose={() => setOpen(false)} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Vagas para babá — Zona Centro-Oeste" />
          </Field>
          <Field label="Tipo de oportunidade">
            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Ex.: Babá, Diarista, Home care..." />
          </Field>
          <Field label="Localização">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Manaus - AM" />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <Field label="Requisitos" className="sm:col-span-2">
            <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} placeholder={'Experiência comprovada\nReferências verificadas\nDisponibilidade de horário'} />
          </Field>
          <Field label="Data de publicação">
            <Input type="date" value={form.published_at ?? ''} onChange={(e) => setForm({ ...form, published_at: e.target.value || null })} />
          </Field>
          <Field label="Data de encerramento (opcional)">
            <Input type="date" value={form.closes_at ?? ''} onChange={(e) => setForm({ ...form, closes_at: e.target.value || null })} />
          </Field>
          <Field label="Status">
            <div className="flex h-[46px] items-center">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}>
                <option value="draft">Rascunho</option>
                <option value="published">Publicada</option>
              </Select>
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
          <Button onClick={save} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </div>
      </Modal>
    </div>
  )
}