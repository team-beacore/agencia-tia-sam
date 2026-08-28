import { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, Star, MessageSquare, Phone, Settings, Menu, X, LogOut, ArrowLeft,
} from 'lucide-react'
import { AuthProvider, useAuth } from './AuthContext'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ServicesPage from './pages/Services'
import ProfessionalsPage from './pages/Professionals'
import OpportunitiesPage from './pages/Opportunities'
import FaqsPage from './pages/Faqs'
import ContactsPage from './pages/Contacts'
import SettingsPage from './pages/Settings'

const NAV = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Serviços', path: '/admin/servicos', icon: Star },
  { label: 'Profissionais', path: '/admin/profissionais', icon: Users },
  { label: 'Oportunidades', path: '/admin/oportunidades', icon: Briefcase },
  { label: 'FAQ', path: '/admin/faq', icon: MessageSquare },
  { label: 'Contatos', path: '/admin/contatos', icon: Phone },
  { label: 'Configurações', path: '/admin/configuracoes', icon: Settings },
]

function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  if (!user) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* Overlay mobile */}
      {sidebar && (
        <div className="fixed inset-0 z-40 bg-night/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebar(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line/70 bg-white transition-transform duration-300 lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-line/70 px-5 py-5">
          <span className="text-lg font-extrabold tracking-tight text-grape">Tia Sam</span>
          <button
            type="button"
            onClick={() => setSidebar(false)}
            aria-label="Fechar menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-lavender/70 hover:text-grape lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path)
                setSidebar(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                isActive(item.path, item.exact)
                  ? 'bg-lavender/60 text-grape'
                  : 'text-muted hover:bg-lavender/30 hover:text-ink'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <a
            href="/"
            className="flex w-full items-center gap-3 rounded-xl bg-grape px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-plum"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            Voltar ao site
          </a>
        </div>

        <div className="border-t border-line/70 px-4 py-4">
          <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
          <p className="truncate text-[11px] text-muted">{user.email}</p>
          <button
            type="button"
            onClick={() => { logout(); navigate('/admin/login') }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-magenta"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-white/95 px-4 py-3 backdrop-blur-sm lg:ml-64 lg:px-6">
        <button
          type="button"
          onClick={() => setSidebar(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-lavender/70 hover:text-grape lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-bold text-ink lg:hidden">Painel Tia Sam</span>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted lg:inline">{user.name}</span>
          <button
            type="button"
            onClick={() => { logout(); navigate('/admin/login') }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-red-50 hover:text-magenta lg:border lg:border-line"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="lg:ml-64">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route index element={<DashboardPage />} />
            <Route path="servicos" element={<ServicesPage />} />
            <Route path="profissionais" element={<ProfessionalsPage />} />
            <Route path="oportunidades" element={<OpportunitiesPage />} />
            <Route path="faq" element={<FaqsPage />} />
            <Route path="contatos" element={<ContactsPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<AdminLayout />} />
      </Routes>
    </AuthProvider>
  )
}