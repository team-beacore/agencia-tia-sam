import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { api } from '../api'
import { Button, Field, Input, Toggle, Badge, Modal, Spinner, EmptyState, ResponsiveTable, RowActions, Select } from '../ui'
import type { Contact, ContactType } from '../../lib/types'

const TYPES: { value: ContactType; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'E-mail' },
  { value: 'address', label: 'Endereço / região' },
  { value: 'hours', label: 'Horário de atendimento' },
  { value: 'other', label: 'Outro' },
]

const EMPTY: Omit<Contact, 'id'> = { label: '', type: 'whatsapp', value: '', display: '', active: true }

export default function ContactsPage() {
  const [rows, setRows] = useState<Contact[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<Omit<Contact, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<Contact[]>('/admin/contacts')
      .then(setRows)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, active: true })
    setOpen(true)
  }

  const openEdit = (c: Contact) => {
    setEditing(c)
    setForm({ label: c.label, type: c.type, value: c.value, display: c.display, active: c.active })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) await api.put(`/admin/contacts/${editing.id}`, form)
      else await api.post('/admin/contacts', form)
      setOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (c: Contact) => {
    await api.put(`/admin/contacts/${c.id}`, { ...c, active: !c.active })
    load()
  }

  const remove = async (c: Contact) => {
    if (!window.confirm(`Excluir o contato "${c.label}"?`)) return
    await api.delete(`/admin/contacts/${c.id}`)
    load()
  }

  const typeLabel = (t: ContactType) => TYPES.find((x) => x.value === t)?.label ?? t

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Contatos</h1>
          <p className="mt-1 text-sm text-muted">Canais de contato usados em todo o site (WhatsApp, Instagram, etc.)</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo contato
        </Button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}

      {!rows ? (
        <Spinner />
      ) : (
        <ResponsiveTable<Contact>
          columns={[
            { key: 'label', label: 'Canal' },
            { key: 'value', label: 'Valor', className: 'hidden md:table-cell' },
            { key: 'active', label: 'Ativo' },
            { key: 'actions', label: '', className: 'text-right' },
          ]}
          rows={rows}
          empty={<EmptyState title="Nenhum contato cadastrado" hint="O WhatsApp é usado no botão flutuante e nos CTAs." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Novo contato</Button>} />}
          renderRow={(c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">
                <Badge tone={c.type === 'whatsapp' ? 'green' : c.type === 'instagram' ? 'violet' : 'neutral'}>{typeLabel(c.type)}</Badge>
                <p className="mt-1 font-semibold text-ink">{c.display || c.value}</p>
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted md:table-cell">{c.value}</td>
              <td className="px-4 py-3">
                <Toggle checked={c.active} onChange={() => toggle(c)} label={c.active ? 'Ativo' : 'Inativo'} />
              </td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(c)} onDelete={() => remove(c)} />
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? `Editar: ${editing.label}` : 'Novo contato'} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContactType })}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nome do canal">
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex.: WhatsApp" />
            </Field>
          </div>
          <Field label="Valor (usado nos links)" hint="WhatsApp: número com código do país, sem + ou espaços. Ex.: 5592984146066">
            <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="5592984146066" />
          </Field>
          <Field label="Texto exibido">
            <Input value={form.display} onChange={(e) => setForm({ ...form, display: e.target.value })} placeholder="+55 92 98414-6066" />
          </Field>
          <Field label="Ativo">
            <div className="flex h-[46px] items-center">
              <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label={form.active ? 'Ativo' : 'Inativo'} />
            </div>
          </Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line/70 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.label.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </div>
      </Modal>
    </div>
  )
}