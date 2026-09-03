import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const isProd = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES = '7d'
const COOKIE_NAME = 'tiasam_token'

if (!JWT_SECRET) {
  if (isProd) {
    console.error('[auth] JWT_SECRET é obrigatório em produção. Configure a variável de ambiente.')
    process.exit(1)
  }
  console.warn('[auth] AVISO: usando JWT_SECRET de desenvolvimento. Configure JWT_SECRET em produção.')
}

function getSecret() {
  return process.env.JWT_SECRET || 'tiasam-dev-secret-key-change-in-production'
}

export const TOKEN_COOKIE = COOKIE_NAME

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, getSecret(), {
    expiresIn: JWT_EXPIRES,
  })
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    path: '/',
  }
}

function extractToken(req) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) return header.slice(7)
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME]
  return null
}

export function requireAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  try {
    const payload = jwt.verify(token, getSecret())
    const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(payload.sub)
    if (!user || user.active !== 1 || user.deleted_at) {
      return res.status(401).json({ error: 'Usuário desativado ou inexistente' })
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export function loginHandler(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' })
  }
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email)
  const passwordOk = user ? bcrypt.compareSync(password, user.password_hash) : false
  if (!user || !passwordOk || user.active !== 1 || user.deleted_at) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  const token = signToken(user)
  res.cookie(COOKIE_NAME, token, cookieOptions())
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

export function logoutHandler(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
}

export function meHandler(req, res) {
  const user = db.prepare('SELECT id, name, email, role FROM admin_users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' })
  }
  res.json({ user })
}

export function changePasswordHandler(req, res) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' })
  }
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado' })
  }
  const passwordOk = bcrypt.compareSync(String(currentPassword), user.password_hash)
  if (!passwordOk) {
    return res.status(400).json({ error: 'Senha atual incorreta' })
  }
  const hash = bcrypt.hashSync(String(newPassword), 12)
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(hash, req.user.id)
  res.json({ ok: true })
}
