import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { put } from '@vercel/blob'
import { randomBytes } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  get, all, run, getSetting, setSetting,
  toInt, toBool, hydrate, seedIfEmpty,
} from './db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Aplicação Express do AMBIENTE DE HOMOLOGAÇÃO (Vercel).
 * Espelha as rotas de server/index.js, mas com banco Turso (async)
 * e uploads via Vercel Blob. Não altera o backend de produção.
 */

const isProd = process.env.NODE_ENV === 'production'

/* ---------- Autenticação (JWT + cookies, igual à produção) ---------- */

/*
 * Homologação (Vercel): não aborta o boot (o ambiente precisa subir), mas
 * também NÃO usa segredo hardcoded. Sem JWT_SECRET, gera uma chave aleatória
 * EFÊMERA — as sessões caem a cada cold start/deploy. Defina JWT_SECRET no
 * projeto da Vercel para sessões persistentes.
 */
const JWT_EXPIRES = '7d'
const COOKIE_NAME = 'tiasam_token'

function resolveSecret() {
  const secret = (process.env.JWT_SECRET || '').trim()
  if (secret) return secret
  console.warn(
    '[homolog] AVISO: JWT_SECRET não definido na Vercel. Usando chave aleatória efêmera ' +
      '(sessões caem a cada restart). Configure JWT_SECRET nas env vars do projeto.',
  )
  return randomBytes(32).toString('hex')
}

const SECRET = resolveSecret()

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}

function extractToken(req) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) return header.slice(7)
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME]
  return null
}

async function requireAuth(req, res, next) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })
  try {
    const payload = jwt.verify(token, SECRET)
    const user = await get('SELECT * FROM admin_users WHERE id = ?', [payload.sub])
    if (!user || toBool(user.active) !== 1 || user.deleted_at) {
      return res.status(401).json({ error: 'Usuário desativado ou inexistente' })
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active }
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

async function loginHandler(req, res) {
  const { email, password } = req.body ?? {}
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' })
  const user = await get('SELECT * FROM admin_users WHERE email = ?', [String(email)])
  const passwordOk = user ? bcrypt.compareSync(String(password), user.password_hash) : false
  if (!user || !passwordOk || toBool(user.active) !== 1 || user.deleted_at) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role },
    SECRET,
    { expiresIn: JWT_EXPIRES },
  )
  res.cookie(COOKIE_NAME, token, cookieOptions())
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}

function logoutHandler(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 })
  res.json({ ok: true })
}

async function meHandler(req, res) {
  const user = await get('SELECT id, name, email, role FROM admin_users WHERE id = ?', [req.user.id])
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })
  res.json({ user })
}

async function changePasswordHandler(req, res) {
  const { currentPassword, newPassword } = req.body ?? {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' })
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' })
  }
  const user = await get('SELECT * FROM admin_users WHERE id = ?', [req.user.id])
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })
  const passwordOk = bcrypt.compareSync(String(currentPassword), user.password_hash)
  if (!passwordOk) {
    return res.status(400).json({ error: 'Senha atual incorreta' })
  }
  const hash = bcrypt.hashSync(String(newPassword), 12)
  await run('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, req.user.id])
  res.json({ ok: true })
}

/* ---------- Inicialização do banco (schema + seed) ---------- */

await seedIfEmpty()

/* ---------- Middleware ---------- */

const app = express()

app.disable('x-powered-by')
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

app.use(express.json({ limit: '3mb' }))
app.use(cookieParser())

/* CORS (homologação: mesma origem da Vercel + origens configuradas) */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: (req) => req.path === '/api/public/health',
})
app.use('/api', apiLimiter)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
})

/* ---------- Upload (memória + Vercel Blob) ---------- */

function getImageSignature(buf) {
  if (!buf || buf.length < 4) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'gif'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  return null
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else {
      const e = new Error('Formato de imagem não suportado (use JPG, PNG, WEBP ou GIF)')
      e.statusCode = 400
      cb(e)
    }
  },
})

/* ---------- Rotas de autenticação ---------- */

app.post('/api/auth/login', loginLimiter, loginHandler)
app.post('/api/auth/logout', logoutHandler)
app.get('/api/auth/me', requireAuth, meHandler)
app.post('/api/auth/change-password', requireAuth, changePasswordHandler)

/* ---------- API pública ---------- */

app.get('/api/public/site', async (req, res) => {
  const [site, hero, about, professionals, editorial, social, images] = await Promise.all([
    getSetting('site'),
    getSetting('hero'),
    getSetting('about'),
    getSetting('professionals'),
    getSetting('editorial'),
    getSetting('social'),
    getSetting('images'),
  ])
  const settings = { site, hero, about, professionals, editorial, social, images }
  const contacts = (await all('SELECT * FROM contacts WHERE active = 1 ORDER BY sort_order, id')).map((r) => hydrate('contacts', r))
  const services = (await all('SELECT * FROM services WHERE active = 1 ORDER BY sort_order, id')).map((r) => hydrate('services', r))
  const faqs = (await all('SELECT * FROM faqs WHERE active = 1 ORDER BY sort_order, id')).map((r) => hydrate('faqs', r))
  const profs = (await all('SELECT * FROM professionals WHERE active = 1 AND show_on_site = 1 ORDER BY sort_order, id')).map((r) => hydrate('professionals', r))
  const opps = (await all("SELECT * FROM opportunities WHERE active = 1 AND status = 'published' ORDER BY sort_order, id")).map((r) => hydrate('opportunities', r))
  res.json({ settings, contacts, services, faqs, professionals: profs, opportunities: opps })
})

app.get('/api/public/health', (req, res) => res.json({ ok: true }))

/* ---------- CRUD genérico (igual à produção) ---------- */

const TABLES = {
  contacts: { cols: ['label', 'type', 'value', 'display', 'sort_order', 'active'] },
  services: { cols: ['slug', 'name', 'tagline', 'description', 'benefits', 'image', 'alt', 'cta', 'sort_order', 'active'] },
  professionals: { cols: ['name', 'role', 'photo', 'location', 'bio', 'experience', 'availability', 'services', 'show_on_site', 'active', 'sort_order'] },
  opportunities: { cols: ['title', 'description', 'type', 'requirements', 'location', 'status', 'published_at', 'closes_at', 'active', 'sort_order'] },
  faqs: { cols: ['question', 'answer', 'sort_order', 'active'] },
}

async function listAll(table) {
  return all(`SELECT * FROM ${table} ORDER BY sort_order, id`)
}

async function findOne(table, id) {
  return get(`SELECT * FROM ${table} WHERE id = ?`, [id])
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`
}

function dbError(e) {
  console.error(e)
  const msg = String(e?.message || '')
  if (/UNIQUE constraint failed|duplicate/i.test(msg)) {
    return 'Registro duplicado ou valor inválido (verifique campos únicos, como o slug)'
  }
  return 'Erro ao salvar o registro'
}

function buildInsert(table, body, id) {
  const { cols } = TABLES[table]
  const names = []
  const values = []
  for (const col of cols) {
    let v = body[col]
    if (v === undefined) {
      if (id !== undefined) continue
      if (col === 'active') v = 1
      else if (col === 'show_on_site') v = 0
      else if (col === 'sort_order') v = Date.now()
      else continue
    }
    if (col === 'benefits' || col === 'services') v = JSON.stringify(v ?? [])
    if (col === 'active' || col === 'show_on_site') v = toBool(v)
    if (col === 'sort_order') v = toInt(v)
    if (col === 'slug' && v === '') v = slugify(body.name || '')
    names.push(col)
    values.push(v)
  }
  if (id !== undefined) {
    const sets = names.map((n) => `${n} = ?`).join(', ')
    return { sql: `UPDATE ${table} SET ${sets}, updated_at = datetime('now') WHERE id = ?`, args: [...values, id] }
  }
  return { sql: `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`, args: values }
}

function crudRoutes(table) {
  const router = express.Router()
  router.use(requireAuth)

  router.get('/', async (req, res) => {
    const rows = await listAll(table)
    res.json(rows.map((r) => hydrate(table, r)))
  })

  router.post('/', async (req, res) => {
    try {
      const { sql, args } = buildInsert(table, req.body ?? {})
      const { lastInsertRowid } = await run(sql, args)
      const row = await findOne(table, Number(lastInsertRowid))
      res.status(201).json(hydrate(table, row))
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  router.put('/:id', async (req, res) => {
    try {
      const id = toInt(req.params.id)
      const existing = await findOne(table, id)
      if (!existing) return res.status(404).json({ error: 'Registro não encontrado' })
      const { sql, args } = buildInsert(table, { ...existing, ...req.body }, id)
      await run(sql, args)
      res.json(hydrate(table, await findOne(table, id)))
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  router.delete('/:id', async (req, res) => {
    const id = toInt(req.params.id)
    const existing = await findOne(table, id)
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado' })
    await run(`DELETE FROM ${table} WHERE id = ?`, [id])
    res.json({ ok: true })
  })

  return router
}

app.use('/api/admin/contacts', crudRoutes('contacts'))
app.use('/api/admin/services', crudRoutes('services'))
app.use('/api/admin/professionals', crudRoutes('professionals'))
app.use('/api/admin/opportunities', crudRoutes('opportunities'))
app.use('/api/admin/faqs', crudRoutes('faqs'))

/* ---------- Settings ---------- */

app.get('/api/admin/settings', requireAuth, async (req, res) => {
  const rows = await all('SELECT key, value FROM settings')
  const out = {}
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value)
    } catch {
      out[r.key] = r.value
    }
  }
  res.json(out)
})

app.put('/api/admin/settings/:key', requireAuth, async (req, res) => {
  await setSetting(req.params.key, req.body)
  res.json({ ok: true, key: req.params.key, value: req.body })
})

/* ---------- Upload (Vercel Blob) ---------- */

app.post('/api/admin/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  const signature = getImageSignature(req.file.buffer)
  if (!signature) return res.status(400).json({ error: 'Arquivo não é uma imagem válida' })

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const safe = String(req.file.originalname || 'imagem')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9._-]+/g, '-')
      const blob = await put(`homolog/${Date.now()}-${safe}`, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      return res.status(201).json({ url: blob.url })
    } catch (e) {
      console.error('[homolog/upload]', e)
      return res.status(500).json({ error: 'Falha ao enviar imagem para o armazenamento' })
    }
  }

  /* Fallback de demonstração (sem Blob configurado): data URL local, sem persistência externa */
  console.warn('[homolog/upload] BLOB_READ_WRITE_TOKEN não configurado — usando data URL de demonstração (não persistente).')
  const b64 = req.file.buffer.toString('base64')
  res.status(201).json({ url: `data:${req.file.mimetype};base64,${b64}` })
})

/* ---------- Error handler ---------- */

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo muito grande (máximo 6MB)' : `Erro no upload: ${err.code}`
    return res.status(400).json({ error: msg })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corpo da requisição inválido (JSON malformado)' })
  }
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500
  if (status >= 500) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
  res.status(status).json({ error: err.message || 'Requisição inválida' })
})

/* ---------- Estático + SPA (SOMENTE teste local) ----------
   Na Vercel o frontend é servido pela própria Vercel (rewrite /index.html).
   Na VPS, pelo server/index.js. Este bloco existe apenas para rodar o
   stack completo localmente com HOMOLOG_SERVE_STATIC=1. */
if (process.env.HOMOLOG_SERVE_STATIC === '1') {
  const DIST_DIR = join(__dirname, '..', '..', 'dist')
  app.use(express.static(DIST_DIR))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
}

export default app
