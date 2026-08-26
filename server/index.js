import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import multer from 'multer'
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, getSetting, setSetting, toInt, toBool, hydrate, UPLOADS_DIR } from './db.js'
import { seedIfEmpty } from './seed.js'
import { loginHandler, logoutHandler, meHandler, requireAuth } from './auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production'

seedIfEmpty()

const app = express()

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1)
}

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

/* CORS restrito às origens configuradas (em produção defina CORS_ORIGINS) */
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Vary', 'Origin')
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

/* Rate limiting global (proteção contra abuso) */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: (req) => req.path === '/api/public/health',
})
app.use('/api', apiLimiter)

/* Rate limit específico para o login (anti brute-force) */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
})

/* Upload de imagens */
function getImageSignature(buf) {
  if (!buf || buf.length < 4) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'gif'
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) return 'webp'
  return null
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    mkdirSync(UPLOADS_DIR, { recursive: true })
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const safe = file.originalname
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]+/g, '-')
    const ext = extname(safe) || '.jpg'
    const base = safe.replace(/\.[^.]+$/, '') || 'imagem'
    cb(null, `${Date.now()}-${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // SVG bloqueado: permite XSS via <script> quando aberto diretamente.
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else {
      const e = new Error('Formato de imagem não suportado (use JPG, PNG, WEBP ou GIF)')
      e.statusCode = 400
      cb(e)
    }
  },
})

/* ---------- Auth ---------- */
app.post('/api/auth/login', loginLimiter, loginHandler)
app.post('/api/auth/logout', logoutHandler)
app.get('/api/auth/me', requireAuth, meHandler)

/* ---------- API pública (site) ---------- */
app.get('/api/public/site', (req, res) => {
  const settings = {
    site: getSetting('site'),
    hero: getSetting('hero'),
    about: getSetting('about'),
    companies: getSetting('companies'),
    professionals: getSetting('professionals'),
    editorial: getSetting('editorial'),
    social: getSetting('social'),
    images: getSetting('images'),
  }
  const contacts = db
    .prepare('SELECT * FROM contacts WHERE active = 1 ORDER BY sort_order, id')
    .all()
    .map((r) => hydrate('contacts', r))
  const services = db
    .prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order, id')
    .all()
    .map((r) => hydrate('services', r))
  const faqs = db
    .prepare('SELECT * FROM faqs WHERE active = 1 ORDER BY sort_order, id')
    .all()
    .map((r) => hydrate('faqs', r))
  const professionals = db
    .prepare("SELECT * FROM professionals WHERE active = 1 AND show_on_site = 1 ORDER BY sort_order, id")
    .all()
    .map((r) => hydrate('professionals', r))
  const opportunities = db
    .prepare("SELECT * FROM opportunities WHERE active = 1 AND status = 'published' ORDER BY sort_order, id")
    .all()
    .map((r) => hydrate('opportunities', r))

  res.json({ settings, contacts, services, faqs, professionals, opportunities })
})

app.get('/api/public/health', (req, res) => res.json({ ok: true }))

/* ---------- Helpers de CRUD ---------- */

const TABLES = {
  contacts: { cols: ['label', 'type', 'value', 'display', 'sort_order', 'active'] },
  services: { cols: ['slug', 'name', 'tagline', 'description', 'benefits', 'image', 'alt', 'cta', 'sort_order', 'active'] },
  professionals: { cols: ['name', 'role', 'photo', 'location', 'bio', 'experience', 'availability', 'services', 'show_on_site', 'active', 'sort_order'] },
  opportunities: { cols: ['title', 'description', 'type', 'requirements', 'location', 'status', 'published_at', 'closes_at', 'active', 'sort_order'] },
  faqs: { cols: ['question', 'answer', 'sort_order', 'active'] },
}

function listAll(table) {
  return db.prepare(`SELECT * FROM ${table} ORDER BY sort_order, id`).all()
}

function findOne(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)
}

function buildInsert(table, body, id) {
  const { cols } = TABLES[table]
  const names = []
  const values = []
  for (const col of cols) {
    let v = body[col]
    if (v === undefined) {
      if (id !== undefined) continue // update: mantém o valor existente
      if (col === 'active') v = 1
      else if (col === 'show_on_site') v = 0
      else if (col === 'sort_order') v = Date.now()
      else continue // insert: usa o DEFAULT da coluna
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
    values.push(id)
    return { sql: `UPDATE ${table} SET ${sets}, updated_at = datetime('now') WHERE id = ?`, values }
  }
  const sql = `INSERT INTO ${table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`
  return { sql, values }
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
  const code = e?.code || ''
  if (code.startsWith('SQLITE_CONSTRAINT')) {
    return 'Registro duplicado ou valor inválido (verifique campos únicos, como o slug)'
  }
  return 'Erro ao salvar o registro'
}

function crudRoutes(table) {
  const router = express.Router()
  router.use(requireAuth)

  router.get('/', (req, res) => {
    const rows = listAll(table).map((r) => hydrate(table, r))
    res.json(rows)
  })

  router.post('/', (req, res) => {
    try {
      const { sql, values } = buildInsert(table, req.body)
      const info = db.prepare(sql).run(...values)
      res.status(201).json(hydrate(table, findOne(table, info.lastInsertRowid)))
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  router.put('/:id', (req, res) => {
    try {
      const id = toInt(req.params.id)
      const existing = findOne(table, id)
      if (!existing) return res.status(404).json({ error: 'Registro não encontrado' })
      const { sql, values } = buildInsert(table, { ...existing, ...req.body }, id)
      db.prepare(sql).run(...values)
      res.json(hydrate(table, findOne(table, id)))
    } catch (e) {
      res.status(400).json({ error: dbError(e) })
    }
  })

  router.delete('/:id', (req, res) => {
    const id = toInt(req.params.id)
    const existing = findOne(table, id)
    if (!existing) return res.status(404).json({ error: 'Registro não encontrado' })
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
    res.json({ ok: true })
  })

  return router
}

app.use('/api/admin/contacts', crudRoutes('contacts'))
app.use('/api/admin/services', crudRoutes('services'))
app.use('/api/admin/professionals', crudRoutes('professionals'))
app.use('/api/admin/opportunities', crudRoutes('opportunities'))
app.use('/api/admin/faqs', crudRoutes('faqs'))

/* ---------- Settings (admin) ---------- */
app.get('/api/admin/settings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
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

app.put('/api/admin/settings/:key', requireAuth, (req, res) => {
  setSetting(req.params.key, req.body)
  res.json({ ok: true, key: req.params.key, value: req.body })
})

/* ---------- Upload ---------- */
app.post('/api/admin/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  const signature = getImageSignature(readFileSync(req.file.path))
  if (!signature) {
    try { unlinkSync(req.file.path) } catch {}
    return res.status(400).json({ error: 'Arquivo não é uma imagem válida' })
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` })
})

/* ---------- Servir estáticos (produção) ---------- */
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
  next()
}, express.static(UPLOADS_DIR, { fallthrough: false }))

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  // SPA fallback (Express 5 não aceita o wildcard "*" — usa middleware)
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next()
    }
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
}

/* Error handler: não vaza detalhes internos para o cliente */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? 'Arquivo muito grande (máximo 6MB)'
      : `Erro no upload: ${err.code}`
    return res.status(400).json({ error: msg })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corpo da requisição inválido (JSON malformado)' })
  }
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500
  if (status >= 500) {
    console.error(err)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
  res.status(status).json({ error: err.message || 'Requisição inválida' })
})

app.listen(PORT, () => {
  console.log(`[api] Agência Tia Sam — servidor rodando em http://localhost:${PORT}`)
})
