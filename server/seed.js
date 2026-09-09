import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db, setSetting } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEED_PATH = join(__dirname, '..', 'shared', 'seed.json')

/**
 * Semeia o banco apenas quando vazio.
 * Usa o mesmo conteúdo que serve de fallback no frontend (shared/seed.json).
 */
export function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c
  const settingsCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get().c

  const seed = JSON.parse(readFileSync(SEED_PATH, 'utf8'))

  if (settingsCount === 0 && seed.settings) {
    for (const [key, value] of Object.entries(seed.settings)) {
      setSetting(key, value)
    }
  }

  if (db.prepare('SELECT COUNT(*) AS c FROM services').get().c === 0) {
    const ins = db.prepare(
      `INSERT INTO services (slug, name, tagline, description, benefits, image, alt, cta, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const s of seed.services || []) {
      ins.run(s.id, s.name, s.tagline, s.description, JSON.stringify(s.benefits || []), s.image || '', s.alt || '', s.cta || '', s.sortOrder ?? 0, s.active === false ? 0 : 1)
    }
  }

  if (db.prepare('SELECT COUNT(*) AS c FROM faqs').get().c === 0) {
    const ins = db.prepare(
      `INSERT INTO faqs (question, answer, sort_order, active) VALUES (?, ?, ?, ?)`,
    )
    for (const f of seed.faqs || []) {
      ins.run(f.question, f.answer, f.sortOrder ?? 0, f.active === false ? 0 : 1)
    }
  }

  if (db.prepare('SELECT COUNT(*) AS c FROM contacts').get().c === 0) {
    const ins = db.prepare(
      `INSERT INTO contacts (label, type, value, display, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    for (const c of seed.contacts || []) {
      ins.run(c.label, c.type, c.value, c.display, c.sortOrder ?? 0, c.active === false ? 0 : 1)
    }
  }

  if (userCount === 0) {
    const isProd = process.env.NODE_ENV === 'production'
    const email = (process.env.ADMIN_EMAIL || '').trim()
    let password = (process.env.ADMIN_PASSWORD || '').trim()

    if (!password) {
      if (isProd) {
        console.error('[seed] ADMIN_PASSWORD é obrigatório em produção quando o banco está vazio. Configure a variável de ambiente e inicie novamente. Encerrando.')
        process.exit(1)
      }
      /* Desenvolvimento: gera senha ALEATÓRIA (nada hardcoded) e exibe no console. */
      password = randomBytes(12).toString('base64url')
      console.warn('[seed] AVISO (desenvolvimento): ADMIN_PASSWORD não definido. Senha aleatória gerada abaixo.')
    }
    const adminEmail = email || (isProd ? '' : 'admin@localhost')
    if (!adminEmail) {
      console.error('[seed] ADMIN_EMAIL é obrigatório em produção junto com ADMIN_PASSWORD para criar o admin inicial. Encerrando.')
      process.exit(1)
    }

    const hash = bcrypt.hashSync(password, 12)
    db.prepare(
      `INSERT INTO admin_users (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, 1)`,
    ).run('Administrador', adminEmail, hash, 'admin')
    if (isProd) {
      console.log(`[seed] Usuário admin inicial criado: ${adminEmail}. Recomenda-se remover ADMIN_PASSWORD do .env após o primeiro boot.`)
    } else {
      console.log(`[seed] Usuário admin de desenvolvimento criado: ${adminEmail} / ${password}`)
    }
  }
}
