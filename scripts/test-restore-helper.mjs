#!/usr/bin/env node
// Helper do test-restore.sh — cria e verifica bancos de PROVA em diretório temporário.
// NUNCA toca no banco de produção: opera apenas sobre caminhos passados por argumento.
//
// Uso:
//   node scripts/test-restore-helper.mjs make <caminho.db>          # cria fixture (schema + dados de prova)
//   node scripts/test-restore-helper.mjs walwrite <caminho.db>      # grava mais uma linha (deixa no WAL)
//   node scripts/test-restore-helper.mjs verify <caminho.db> <dir-uploads>

import { DatabaseSync } from 'node:sqlite'
import { readFileSync, existsSync } from 'node:fs'

const PROBE = 'restore-probe-2026'
const [, , cmd, arg1, arg2] = process.argv

function fail(msg) {
  console.error(`[test-restore] FALHA: ${msg}`)
  process.exit(1)
}

if (cmd === 'make') {
  if (!arg1) fail('informe o caminho do banco')
  const db = new DatabaseSync(arg1)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'admin', active INTEGER DEFAULT 1, deleted_at TEXT);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE services (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, name TEXT);
    INSERT INTO admin_users (name, email, password_hash) VALUES ('Probe Admin', 'probe@example.invalid', '$2b$12$nao-e-uma-senha-real');
    INSERT INTO settings (key, value) VALUES ('site', '{"probe":"restore-probe-2026","name":"Banco de Prova"}');
    INSERT INTO services (slug, name) VALUES ('probe-servico', 'Serviço de Prova');
  `)
  db.close()
  console.log('[test-restore] fixture criado (WAL ativo, dados de prova gravados)')
} else if (cmd === 'walwrite') {
  if (!arg1) fail('informe o caminho do banco')
  const db = new DatabaseSync(arg1)
  db.exec('PRAGMA journal_mode = WAL;')
  db.prepare("INSERT INTO services (slug, name) VALUES ('probe-extra', 'Prova Extra WAL')").run()
  db.close()
  console.log('[test-restore] escrita adicional registrada (conteúdo no WAL)')
} else if (cmd === 'verify') {
  if (!arg1) fail('informe o caminho do banco restaurado')
  if (!existsSync(arg1)) fail(`banco restaurado não existe: ${arg1}`)
  const db = new DatabaseSync(arg1, { readOnly: true })
  const check = db.prepare('PRAGMA integrity_check').get()
  if (!check || check.integrity_check !== 'ok') fail(`integrity_check: ${JSON.stringify(check)}`)
  console.log('[test-restore] integrity_check: ok')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name)
  for (const t of ['admin_users', 'settings', 'services']) {
    if (!tables.includes(t)) fail(`tabela ausente após restore: ${t}`)
  }
  console.log(`[test-restore] tabelas presentes: ${tables.join(', ')}`)
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'site'").get()
  if (!setting || !String(setting.value).includes(PROBE)) fail('dados de settings não sobreviveram ao restore')
  const svc = db.prepare("SELECT name FROM services WHERE slug = 'probe-servico'").get()
  if (!svc || svc.name !== 'Serviço de Prova') fail('dados de services não sobreviveram ao restore')
  const users = db.prepare('SELECT COUNT(*) c FROM admin_users').get().c
  if (Number(users) !== 1) fail(`esperava 1 admin de prova, encontrei ${users}`)
  const extra = db.prepare("SELECT name FROM services WHERE slug = 'probe-extra'").get()
  if (!extra || extra.name !== 'Prova Extra WAL') fail('dados gravados no WAL não foram incluídos no backup')
  console.log('[test-restore] leitura dos dados de prova: ok (settings, services, admin_users, conteúdo do WAL)')
  db.close()
  if (arg2) {
    const probeFile = `${arg2}/probe-upload.txt`
    if (!existsSync(probeFile)) fail(`upload de prova ausente: ${probeFile}`)
    const content = readFileSync(probeFile, 'utf8')
    if (!content.includes(PROBE)) fail('conteúdo do upload de prova divergente')
    console.log('[test-restore] uploads restaurados: ok')
  } else {
    console.log('[test-restore] AVISO: verificação de uploads pulada (diretório não informado)')
  }
  console.log('[test-restore] VERIFICAÇÃO COMPLETA: ok')
} else {
  fail('comando desconhecido — use: make <db> | verify <db> <uploads-dir>')
}
