import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { api } from '../api'
import { Button, Field, Input, Textarea, Toggle, Modal, Spinner, EmptyState, ResponsiveTable, RowActions, ImageUpload } from '../ui'
import type { Service } from '../../lib/types'

const EMPTY: Omit<Service, 'id'> = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  benefits: [],
  image: '',
  alt: '',
  cta: '',
  active: true,
}

export default function ServicesPage() {
  const [rows, setRows] = useState<Service[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<Omit<Service, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<Service[]>('/admin/services')
      .then(setRows)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, active: true })
    setOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({
      slug: s.slug,
      name: s.name,
      tagline: s.tagline,
      description: s.description,
      benefits: s.benefits,
      image: s.image,
      alt: s.alt,
      cta: s.cta,
      active: s.active,
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) await api.put(`/admin/services/${editing.id}`, form)
      else await api.post('/admin/services', form)
      setOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (s: Service) => {
    await api.put(`/admin/services/${s.id}`, { ...s, active: !s.active })
    load()
  }

  const remove = async (s: Service) => {
    if (!window.confirm(`Excluir o serviço "${s.name}"?`)) return
    await api.delete(`/admin/services/${s.id}`)
    load()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Serviços</h1>
          <p className="mt-1 text-sm text-muted">Os serviços exibidos no site público</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo serviço
        </Button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}

      {!rows ? (
        <Spinner />
      ) : (
        <ResponsiveTable<Service>
          columns={[
            { key: 'name', label: 'Serviço' },
            { key: 'cta', label: 'CTA', className: 'hidden md:table-cell' },
            { key: 'status', label: 'Status' },
            { key: 'sort', label: 'Ordem', className: 'hidden sm:table-cell' },
            { key: 'actions', label: '', className: 'text-right' },
          ]}
          rows={rows}
          empty={<EmptyState title="Nenhum serviço cadastrado" hint="Crie o primeiro serviço para exibi-lo no site." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo serviço</Button>} />}
          renderRow={(s) => (
            <tr key={s.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {s.image ? (
                    <img src={s.image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-paper" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{s.name}</p>
                    <p className="truncate text-xs text-muted">{s.tagline}</p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{s.cta}</td>
              <td className="px-4 py-3">
                <Toggle checked={s.active} onChange={() => toggleActive(s)} label={s.active ? 'Ativo' : 'Inativo'} />
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted sm:table-cell">{s.sort_order ?? '—'}</td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(s)} onDelete={() => remove(s)} />
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? `Editar: ${editing.name}` : 'Novo serviço'} onClose={() => setOpen(false)} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do serviço">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Babá" />
          </Field>
          <Field label="Chave (slug)" hint="Identificador único usado pelo site. Gerado automaticamente se vazio.">
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="baba" />
          </Field>
          <Field label="Frase curta" className="sm:col-span-2">
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Cuidado que acompanha o crescimento." />
          </Field>
          <Field label="Texto do botão (CTA)" className="sm:col-span-2">
            <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Encontrar uma babá" />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </Field>
          <div className="sm:col-span-2">
            <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          </div>
          <Field label="Texto alternativo da imagem (alt)" className="sm:col-span-2">
            <Input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Descreva a imagem para acessibilidade" />
          </Field>
          <Field label="Benefícios (um por linha)" className="sm:col-span-2">
            <Textarea
              value={form.benefits.join('\n')}
              onChange={(e) => setForm({ ...form, benefits: e.target.value.split('\n') })}
              rows={4}
              placeholder={'Rotina e afeto no cuidado diário\nSegurança e atenção em primeiro lugar'}
            />
          </Field>
          <Field label="Ordem de exibição">
            <Input type="number" value={form.sort_order ?? 1} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <div className="flex h-[46px] items-center">
              <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label={form.active ? 'Ativo no site' : 'Inativo'} />
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