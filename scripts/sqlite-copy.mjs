// sqlite-copy.mjs — Fallback de backup SQLite sem o CLI `sqlite3`.
//
// Usado por scripts/backup.sh quando o sqlite3 não está instalado.
// Estratégia segura para banco em modo WAL:
//   1. Abre o banco e executa PRAGMA wal_checkpoint(TRUNCATE) — isso grava
//      todo o conteúdo do WAL no arquivo principal e esvazia o WAL.
//   2. Fecha a conexão.
//   3. Copia o arquivo principal (tiasam.db) para o destino.
//
// Uso:
//   node scripts/sqlite-copy.mjs <origem.db> <destino.db>

import { DatabaseSync } from 'node:sqlite'
import { copyFileSync } from 'node:fs'

const [, , src, dest] = process.argv

if (!src || !dest) {
  console.error('[sqlite-copy] Uso: node scripts/sqlite-copy.mjs <origem.db> <destino.db>')
  process.exit(1)
}

const db = new DatabaseSync(src)
try {
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
} finally {
  db.close()
}

copyFileSync(src, dest)

// Verifica integridade do backup
const d2 = new DatabaseSync(dest)
try {
  const check = d2.prepare('PRAGMA integrity_check').get()
  if (check && check.integrity_check === 'ok') {
    console.log(`[sqlite-copy] Copiado ${src} -> ${dest} (integridade ok)`)
  } else {
    console.error(`[sqlite-copy] ERRO: backup corrompido (${JSON.stringify(check)})`)
    process.exit(1)
  }
} catch (e) {
  console.error(`[sqlite-copy] ERRO: backup inválido: ${e.message}`)
  process.exit(1)
} finally {
  d2.close()
}
