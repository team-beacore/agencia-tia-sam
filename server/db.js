import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/*
 * Fonte única de verdade para dados persistentes (SQLite + uploads).
 * DESENVOLVIMENTO: DATA_DIR opcional — sem ele, usa ./data (relativo ao repo).
 * PRODUÇÃO: DATA_DIR é OBRIGATÓRIO — sem ele o startup ABORTA (não existe
 * fallback ./data em produção, para o banco nunca viver dentro do código).
 */
const isProd = process.env.NODE_ENV === 'production'

function resolveDataDir() {
  const fromEnv = (process.env.DATA_DIR || '').trim()
  if (fromEnv) return isAbsolute(fromEnv) ? fromEnv : resolve(process.cwd(), fromEnv)
  if (isProd) {
    console.error(
      '[db] DATA_DIR é obrigatório em produção. Configure um caminho absoluto de dados ' +
        'persistentes (ex.: DATA_DIR=/var/www/agencia-tia-sam/data) no .env. ' +
        'O startup foi abortado para não gravar dados dentro do código. Encerrando.',
    )
    process.exit(1)
  }
  return join(__dirname, '..', 'data')
}

export const DATA_DIR = resolveDataDir()
export const UPLOADS_DIR = join(DATA_DIR, 'uploads')
mkdirSync(DATA_DIR, { recursive: true })
mkdirSync(UPLOADS_DIR, { recursive: true })

export const DB_PATH = join(DATA_DIR, 'tiasam.db')
export const db = new DatabaseSync(DB_PATH)

db.exec(`
PRAGMA journal_mode = WAL;

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
`)

/* ---------- migrações (bancos criados antes da coluna active) ---------- */
function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)
}
if (!hasColumn('admin_users', 'active')) {
  db.exec(`ALTER TABLE admin_users ADD COLUMN active INTEGER NOT NULL DEFAULT 1`)
}
if (!hasColumn('admin_users', 'deleted_at')) {
  db.exec(`ALTER TABLE admin_users ADD COLUMN deleted_at TEXT`)
}

/* ---------- helpers ---------- */

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, JSON.stringify(value))
}

export function toInt(v, fallback = 0) {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? fallback : n
}

export function toBool(v, fallback = 0) {
  if (v === undefined || v === null) return fallback
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0
}

/* Converte uma linha do banco para o formato da API (JSON decodificado, booleans) */
export function hydrate(table, row) {
  if (!row) return null
  const out = { ...row }
  if (table === 'services' || table === 'professionals') {
    try {
      out.benefits = JSON.parse(row.benefits ?? '[]')
      out.services = JSON.parse(row.services ?? '[]')
    } catch {
      out.benefits = []
      out.services = []
    }
  }
  if (table === 'services' || table === 'professionals' || table === 'faqs' || table === 'opportunities' || table === 'contacts') {
    out.active = toBool(row.active)
  }
  if (table === 'professionals') {
    out.show_on_site = toBool(row.show_on_site)
    out.showOnSite = out.show_on_site
  }
  return out
}
