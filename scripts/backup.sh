#!/usr/bin/env bash
#
# backup.sh — Backup automático da Agência Tia Sam (Linux)
#
# Gera uma cópia consistente de:
#   - data/tiasam.db            (SQLite em modo WAL)
#   - data/uploads/             (imagens enviadas pelo painel)
#
# Estratégia de backup do SQLite (WAL):
#   1. Se o CLI `sqlite3` existir: usa o backup online API (`.backup`),
#      que é seguro mesmo com escrita concorrente durante o backup.
#   2. Caso contrário: fallback via Node (scripts/sqlite-copy.mjs),
#      que faz PRAGMA wal_checkpoint(TRUNCATE) antes de copiar o arquivo.
#      NUNCA faz cópia ingênua de um banco aberto sem checkpoint.
#
# Retenção: mantém backups por BACKUP_RETENTION_DAYS (padrão 14) e remove
# os mais antigos. Nunca remove o backup mais recente do mesmo dia.
#
# Uso:
#   bash scripts/backup.sh                        # usa o padrão (pasta backups/)
#   BACKUP_DIR=/mnt/backup/tia-sam bash scripts/backup.sh
#   BACKUP_RETENTION_DAYS=30 bash scripts/backup.sh
#
# Agendamento (cron, diário às 03:00):
#   0 3 * * * cd /var/www/agencia-tia-sam && bash scripts/backup.sh >> /var/log/tia-sam-backup.log 2>&1

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${BACKUP_DIR:-$APP_DIR/backups}"
DB_FILE="$APP_DIR/data/tiasam.db"
UPLOADS_DIR="$APP_DIR/data/uploads"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/$TS"

mkdir -p "$BACKUP_ROOT" "$BACKUP_DIR"

echo "[backup] Iniciando backup em $BACKUP_DIR"

# 1) Banco SQLite
if [ ! -f "$DB_FILE" ]; then
  echo "[backup] AVISO: banco não encontrado em $DB_FILE — continuando mesmo assim (só uploads)."
else
  if command -v sqlite3 >/dev/null 2>&1; then
    (cd "$BACKUP_DIR" && sqlite3 "$DB_FILE" ".backup tiasam.db")
    echo "[backup] Banco copiado via sqlite3 .backup (consistente com WAL)."
  else
    node "$APP_DIR/scripts/sqlite-copy.mjs" "$DB_FILE" "$BACKUP_DIR/tiasam.db"
    echo "[backup] Banco copiado via Node (wal_checkpoint + cópia)."
  fi

  # Validação de integridade do backup
  if command -v sqlite3 >/dev/null 2>&1; then
    CHECK="$(sqlite3 "$BACKUP_DIR/tiasam.db" 'PRAGMA integrity_check;')"
    if [ "$CHECK" != "ok" ]; then
      echo "[backup] ERRO: backup corrompido (integrity_check = $CHECK)" >&2
      exit 1
    fi
    echo "[backup] Integridade do banco verificada (ok)."
  fi
fi

# 2) Uploads (se existirem arquivos)
if [ -d "$UPLOADS_DIR" ] && [ -n "$(ls -A "$UPLOADS_DIR" 2>/dev/null)" ]; then
  cp -a "$UPLOADS_DIR" "$BACKUP_DIR/uploads"
  echo "[backup] Uploads copiados."
fi

# 3) Retenção — remove backups com mais de RETENTION_DAYS dias
#    (usa -mtime: nunca remove backups recentes; o de hoje fica intocado)
OLD_BACKUPS="$(find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETENTION_DAYS")"
if [ -n "$OLD_BACKUPS" ]; then
  echo "[backup] Removendo backups antigos (>${RETENTION_DAYS} dias):"
  echo "$OLD_BACKUPS"
  while IFS= read -r dir; do
    rm -rf "$dir"
  done <<< "$OLD_BACKUPS"
fi

echo "[backup] Concluído com sucesso: $BACKUP_DIR"
