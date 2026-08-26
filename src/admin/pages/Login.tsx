import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { Button } from '../ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-white p-8 shadow-soft">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-grape text-white shadow-soft">
              <span className="font-serif text-2xl font-bold">S</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">Painel Tia Sam</h1>
            <p className="mt-1 text-sm text-muted">Acesse para gerenciar o conteúdo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tiasam.local"
                required
                autoFocus
                className="w-full rounded-xl border border-line bg-cream px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/50 focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-ink">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-line bg-cream px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/50 focus:border-grape focus:outline-none focus:ring-2 focus:ring-grape/20"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-magenta/20 bg-magenta/5 px-4 py-2.5 text-sm font-semibold text-magenta">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={busy} className="w-full py-3">
              {busy ? 'Entrando...' : 'Entrar'}
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted">
            Acesso restrito à equipe da Agência Tia Sam
          </p>
        </div>
      </div>
    </div>
  )
}