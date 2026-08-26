import { useCallback, useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { api } from '../api'
import { Button, Field, Input, Textarea, Toggle, Modal, Spinner, EmptyState, ResponsiveTable, RowActions } from '../ui'
import type { Faq } from '../../lib/types'

const EMPTY: Omit<Faq, 'id'> = { question: '', answer: '', active: true }

export default function FaqsPage() {
  const [rows, setRows] = useState<Faq[] | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [form, setForm] = useState<Omit<Faq, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    api
      .get<Faq[]>('/admin/faqs')
      .then(setRows)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, active: true })
    setOpen(true)
  }

  const openEdit = (f: Faq) => {
    setEditing(f)
    setForm({ question: f.question, answer: f.answer, active: f.active })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing?.id) await api.put(`/admin/faqs/${editing.id}`, form)
      else await api.post('/admin/faqs', form)
      setOpen(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (f: Faq) => {
    await api.put(`/admin/faqs/${f.id}`, { ...f, active: !f.active })
    load()
  }

  const remove = async (f: Faq) => {
    if (!window.confirm(`Excluir a pergunta "${f.question}"?`)) return
    await api.delete(`/admin/faqs/${f.id}`)
    load()
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Perguntas frequentes</h1>
          <p className="mt-1 text-sm text-muted">FAQs exibidas na seção de dúvidas do site</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova pergunta
        </Button>
      </header>

      {error ? <p className="mb-4 rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-3 text-sm font-semibold text-magenta">{error}</p> : null}

      {!rows ? (
        <Spinner />
      ) : (
        <ResponsiveTable<Faq>
          columns={[
            { key: 'question', label: 'Pergunta' },
            { key: 'active', label: 'Ativa' },
            { key: 'sort', label: 'Ordem', className: 'hidden sm:table-cell' },
            { key: 'actions', label: '', className: 'text-right' },
          ]}
          rows={rows}
          empty={<EmptyState title="Nenhuma pergunta cadastrada" hint="Adicione perguntas frequentes para exibir no site." action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova pergunta</Button>} />}
          renderRow={(f) => (
            <tr key={f.id}>
              <td className="px-4 py-3">
                <p className="font-semibold text-ink">{f.question}</p>
                <p className="line-clamp-1 max-w-md text-xs text-muted">{f.answer}</p>
              </td>
              <td className="px-4 py-3">
                <Toggle checked={f.active} onChange={() => toggle(f)} label={f.active ? 'Ativa' : 'Inativa'} />
              </td>
              <td className="hidden px-4 py-3 text-sm text-muted sm:table-cell">{f.sort_order ?? '—'}</td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(f)} onDelete={() => remove(f)} />
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={open} title={editing ? 'Editar pergunta' : 'Nova pergunta'} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Field label="Pergunta">
            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </Field>
          <Field label="Resposta">
            <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
          </Field>
          <Field label="Ativa">
            <div className="flex h-[46px] items-center">
              <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label={form.active ? 'Exibida no site' : 'Inativa'} />
            </div>
          </Field>
        </div>
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line/70 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.question.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Salvar
          </Button>
        </div>
      </Modal>
    </div>
  )
}