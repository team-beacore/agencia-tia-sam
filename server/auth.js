import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'tiasam-dev-secret-key-change-in-production'
const JWT_EXPIRES = '7d'

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  })
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.user = payload
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
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  const token = signToken(user)
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}

export function meHandler(req, res) {
  res.json({ user: req.user })
}