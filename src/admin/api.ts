const TOKEN_KEY = 'tiasam_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    setToken(null)
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || `Erro ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T,>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T,>(path: string) => request<T>('DELETE', path),

  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; name: string; email: string; role: string } }>(
      'POST',
      '/auth/login',
      { email, password },
    ),

  me: () => request<{ user: { id: number; name: string; email: string; role: string } }>('GET', '/auth/me'),

  upload: async (file: File): Promise<{ url: string }> => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Falha no upload')
    }
    return res.json()
  },
}

export type AdminUser = { id: number; name: string; email: string; role: string }
