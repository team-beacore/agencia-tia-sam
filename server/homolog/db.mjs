import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'

/**
 * Camada de banco do AMBIENTE DE HOMOLOGAÇÃO.
 *
 * Dois backends com a MESMA interface assíncrona:
 *  - TURSO (libSQL/SQLite via HTTP): usado na Vercel (homologação real, persistente).
 *  - node:sqlite local: usado para desenvolvimento/teste local quando não há Turso.
 *
 * Produção (VPS) NÃO usa este arquivo — continua usando server/db.js (SQLite local).
 *
 * Variáveis de ambiente (Vercel):
 *   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD
 */

const __dirname = dirname(fileURLToPath(import.meta.url))

const USE_TURSO = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)
const DATABASE_URL = process.env.TURSO_DATABASE_URL
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN
/* Banco local de homologação fica em DATA_DIR quando definido (mesma fonte de
 * verdade do backend de produção), senão no ./data do repo. Nunca é o banco de
 * produção — é arquivo separado (homolog-local.db). */
const DATA_DIR = (process.env.DATA_DIR || '').trim() || join(__dirname, '..', '..', 'data')
const LOCAL_DB_PATH = process.env.HOMOLOG_LOCAL_DB || join(DATA_DIR, 'homolog-local.db')

if (!USE_TURSO) {
  console.warn('[homolog/db] TURSO não configurado — usando SQLite local de desenvolvimento (somente teste local).')
}

/* ================= Turso (HTTP) ================= */

async function tursoRequest(payload) {
  const base = (DATABASE_URL || '').replace(/\/+$/, '')
  const res = await fetch(`${base}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN || ''}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json || json.results?.type === 'error') {
    const err = json?.results?.error?.message || `Turso HTTP ${res.status}`
    throw new Error(`[homolog/db] ${err}`)
  }
  return json.results
}

function firstResult(response) {
  const r = response?.response
  if (r?.type !== 'execute' || !r?.result) return null
  return r.result
}

function rowsToObjects(result) {
  const rows = result?.rows ?? []
  const cols = result?.columns ?? []
  return rows.map((row) => {
    const out = {}
    for (let i = 0; i < cols.length; i++) out[cols[i]] = row[i]
    return out
  })
}

/* ================= Local (node:sqlite) ================= */

mkdirSync(dirname(LOCAL_DB_PATH), { recursive: true })
const localDb = USE_TURSO ? null : new DatabaseSync(LOCAL_DB_PATH)

/* ================= Interface comum (assíncrona) ================= */

export async function get(sql, args = []) {
  if (USE_TURSO) {
    const result = firstResult(await tursoRequest({ requests: [{ type: 'execute', stmt: { sql, args } }] }))
    return rowsToObjects(result)[0]
  }
  return localDb.prepare(sql).get(...args)
}

export async function all(sql, args = []) {
  if (USE_TURSO) {
    const result = firstResult(await tursoRequest({ requests: [{ type: 'execute', stmt: { sql, args } }] }))
    return rowsToObjects(result)
  }
  return localDb.prepare(sql).all(...args)
}

export async function run(sql, args = []) {
  if (USE_TURSO) {
    const result = firstResult(await tursoRequest({ requests: [{ type: 'execute', stmt: { sql, args } }] }))
    return { lastInsertRowid: Number(result?.last_insert_rowid ?? 0), changes: Number(result?.affected_row_count ?? 0) }
  }
  const info = localDb.prepare(sql).run(...args)
  return { lastInsertRowid: Number(info.lastInsertRowid ?? 0), changes: Number(info.changes ?? 0) }
}

/** Executa um lote de instruções (schema/seed). */
export async function execMany(requests) {
  if (USE_TURSO) {
    await tursoRequest({ requests })
    return
  }
  for (const r of requests) {
    localDb.prepare(r.stmt.sql).run(...(r.stmt.args ?? []))
  }
}

/* ---------- helpers de conversão (espelham server/db.js) ---------- */

export function toInt(v, fallback = 0) {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? fallback : n
}

export function toBool(v, fallback = 0) {
  if (v === undefined || v === null) return fallback
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0
}

/** Converte uma linha do banco para o formato da API (booleans). */
export function hydrate(table, row) {
  if (!row) return null
  const out = { ...row }
  if (table === 'services' || table === 'professionals') {
    try {
      out.benefits = typeof row.benefits === 'string' ? JSON.parse(row.benefits ?? '[]') : (row.benefits ?? [])
      out.services = typeof row.services === 'string' ? JSON.parse(row.services ?? '[]') : (row.services ?? [])
    } catch {
      out.benefits = []
      out.services = []
    }
  }
  if (['services', 'professionals', 'faqs', 'opportunities', 'contacts'].includes(table)) {
    out.active = toBool(row.active) === 1
  }
  if (table === 'professionals') {
    out.show_on_site = toBool(row.show_on_site) === 1
    out.showOnSite = out.show_on_site
  }
  return out
}

/* ---------- settings ---------- */

export async function getSetting(key) {
  const row = await get('SELECT value FROM settings WHERE key = ?', [key])
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

export async function setSetting(key, value) {
  await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, JSON.stringify(value)],
  )
}

/* ---------- schema ---------- */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  active INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  value TEXT NOT NULL DEFAULT '',
  display TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL DEFAULT '',
  alt TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS professionals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '',
  services TEXT NOT NULL DEFAULT '[]',
  show_on_site INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  closes_at TEXT,
  active INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`

/* ---------- seed inicial (dados claramente de demonstração) ---------- */

const SEED_PATH = join(__dirname, '..', '..', 'shared', 'seed.json')

export async function seedIfEmpty() {
  /* Cria o schema (tabelas) se não existirem */
  const schemaStatements = SCHEMA
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  await execMany(schemaStatements.map((sql) => ({ type: 'execute', stmt: { sql: `${sql};` } })))

  const settingsCount = (await get('SELECT COUNT(*) AS c FROM settings'))?.c ?? 0

  if (Number(settingsCount) > 0) return

  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'))

  const requests = []

  for (const [key, value] of Object.entries(seed.settings ?? {})) {
    requests.push({ type: 'execute', stmt: { sql: `INSERT INTO settings (key, value) VALUES (?, ?)`, args: [key, JSON.stringify(value)] } })
  }

  for (const s of seed.services ?? []) {
    requests.push({
      type: 'execute',
      stmt: {
        sql: `INSERT INTO services (slug, name, tagline, description, benefits, image, alt, cta, sort_order, active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [s.id, s.name, s.tagline, s.description, JSON.stringify(s.benefits || []), s.image || '', s.alt || '', s.cta || '', s.sortOrder ?? 0, s.active === false ? 0 : 1],
      },
    })
  }

  for (const f of seed.faqs ?? []) {
    requests.push({
      type: 'execute',
      stmt: {
        sql: `INSERT INTO faqs (question, answer, sort_order, active) VALUES (?, ?, ?, ?)`,
        args: [f.question, f.answer, f.sortOrder ?? 0, f.active === false ? 0 : 1],
      },
    })
  }

  for (const c of seed.contacts ?? []) {
    requests.push({
      type: 'execute',
      stmt: {
        sql: `INSERT INTO contacts (label, type, value, display, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [c.label, c.type, c.value, c.display, c.sortOrder ?? 0, c.active === false ? 0 : 1],
      },
    })
  }

  /* Profissionais de demonstração (fictícias) */
  const DEMO_PROFESSIONALS = [
    {
      name: 'Maria Souza (demonstração)',
      role: 'Cuidadora de idosos',
      photo: '',
      location: 'Zona Centro-Sul, Manaus',
      bio: 'Perfil fictício para demonstração do painel na Vercel. Profissional com experiência em cuidados com idosos e comunicação constante com a família.',
      experience: '6 anos de experiência',
      availability: 'Segunda a sábado, manhã e tarde',
      services: ['cuidadora'],
      show_on_site: 1,
      active: 1,
      sort_order: 1,
    },
    {
      name: 'Joana Lima (demonstração)',
      role: 'Babá',
      photo: '',
      location: 'Zona Oeste, Manaus',
      bio: 'Perfil fictício para demonstração. Babá com rotina, afeto e segurança no cuidado diário de crianças.',
      experience: '4 anos de experiência',
      availability: 'Segunda a sexta, período integral',
      services: ['baba'],
      show_on_site: 1,
      active: 1,
      sort_order: 2,
    },
    {
      name: 'Ana Paula (demonstração)',
      role: 'Diarista',
      photo: '',
      location: 'Zona Leste, Manaus',
      bio: 'Perfil fictício para demonstração. Diarista treinada e recomendada, com flexibilidade de dias e horários.',
      experience: '3 anos de experiência',
      availability: 'Terça a sábado, meio período',
      services: ['diarista'],
      show_on_site: 0,
      active: 1,
      sort_order: 3,
    },
  ]

  for (const p of DEMO_PROFESSIONALS) {
    requests.push({
      type: 'execute',
      stmt: {
        sql: `INSERT INTO professionals (name, role, photo, location, bio, experience, availability, services, show_on_site, active, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [p.name, p.role, p.photo, p.location, p.bio, p.experience, p.availability, JSON.stringify(p.services), p.show_on_site, p.active, p.sort_order],
      },
    })
  }

  /* Oportunidades de demonstração (fictícias) */
  const DEMO_OPPORTUNITIES = [
    {
      title: 'Vaga para babá — Zona Centro-Oeste (demonstração)',
      description: 'Oportunidade fictícia para demonstração do painel. Família busca babá para cuidar de duas crianças, manhã e tarde.',
      type: 'Babá',
      requirements: 'Experiência comprovada\nReferências verificadas\nDisponibilidade de horário',
      location: 'Manaus - AM',
      status: 'published',
      published_at: new Date().toISOString().slice(0, 10),
      closes_at: null,
      active: 1,
      sort_order: 1,
    },
    {
      title: 'Vaga para cuidadora de idosos — Zona Sul (demonstração)',
      description: 'Oportunidade fictícia para demonstração. Cuidadora para acompanhamento diurno de idosa com mobilidade reduzida.',
      type: 'Cuidadora de idosos',
      requirements: 'Paciência e atenção\nDisponibilidade de meio período\nTreinamento específico',
      location: 'Manaus - AM',
      status: 'published',
      published_at: new Date().toISOString().slice(0, 10),
      closes_at: null,
      active: 1,
      sort_order: 2,
    },
  ]

  for (const o of DEMO_OPPORTUNITIES) {
    requests.push({
      type: 'execute',
      stmt: {
        sql: `INSERT INTO opportunities (title, description, type, requirements, location, status, published_at, closes_at, active, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [o.title, o.description, o.type, o.requirements, o.location, o.status, o.published_at, o.closes_at, o.active, o.sort_order],
      },
    })
  }

  /* Admin da homologação. Sem credencial hardcoded: usa ADMIN_EMAIL/ADMIN_PASSWORD
   * ou gera senha aleatória exibida no log (acessível só a quem detém o projeto Vercel). */
  const email = process.env.ADMIN_EMAIL || 'admin@tiasam.homolog.local'
  let password = (process.env.ADMIN_PASSWORD || '').trim()
  if (!password) {
    password = randomBytes(12).toString('base64url')
    console.warn('[homolog/db] AVISO: ADMIN_PASSWORD não definido. Senha aleatória gerada (veja o log desta execução).')
  }
  const hash = bcrypt.hashSync(password, 12)
  requests.push({
    type: 'execute',
    stmt: {
      sql: `INSERT INTO admin_users (name, email, password_hash, role, active) VALUES (?, ?, ?, 'admin', 1)`,
      args: ['Administrador (Homologação)', email, hash],
    },
  })
  console.log(`[homolog/db] Admin de homologação criado: ${email} / ${password}`)

  if (requests.length > 0) {
    await execMany(requests)
  }
}
