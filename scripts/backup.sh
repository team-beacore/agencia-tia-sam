#!/usr/bin/env bash
#
# backup.sh — Backup automático da Agência Tia Sam (Linux)
#
# Gera uma cópia consistente de:
#   - $DATA_DIR/tiasam.db       (SQLite em modo WAL)
#   - $DATA_DIR/uploads/        (imagens enviadas pelo painel)
#
# DATA_DIR é a mesma variável usada pela aplicação (server/db.js).
# Se não definida, cai no padrão de desenvolvimento: <repo>/data.
#
# Estratégia de backup do SQLite (WAL):
#   1. Se o CLI `sqlite3` existir: usa o backup online API (`.backup`),
#      que é seguro mesmo com escrita concorrente durante o backup.
#   2. Caso contrário: fallback via Node (scripts/sqlite-copy.mjs),
#      que faz PRAGMA wal_checkpoint(TRUNCATE) antes de copiar o arquivo.
#      NUNCA faz cópia ingênua de um banco aberto sem checkpoint.
#
# Backup EXTERNO (obrigatório como segunda via — disco local não basta):
#   Configure BACKUP_REMOTE e a cópia final usa rclone (configurado fora do
#   repositório, ex.: `rclone config` — nenhuma credencial versionada):
#     BACKUP_REMOTE=rclone-destino:tia-sam-backups
#   Alternativa com rsync/ssh (sem rclone):
#     BACKUP_REMOTE=usuario@outra-maquina:/backups/tia-sam  (usa rsync)
#
# Retenção: mantém backups por BACKUP_RETENTION_DAYS (padrão 14) e remove
# os mais antigos. Nunca remove o backup mais recente do mesmo dia.
#
# Uso:
#   bash scripts/backup.sh                        # DATA_DIR padrão do repo
#   DATA_DIR=/var/www/agencia-tia-sam/data bash scripts/backup.sh
#   BACKUP_DIR=/mnt/backup/tia-sam bash scripts/backup.sh
#   BACKUP_RETENTION_DAYS=30 bash scripts/backup.sh
#   BACKUP_REMOTE=rclone-destino:tia-sam-backups bash scripts/backup.sh
#
# Agendamento (cron, diário às 03:00 — carregando as variáveis do .env):
#   0 3 * * * cd /var/www/agencia-tia-sam && set -a && . ./.env && set +a && bash scripts/backup.sh >> /var/log/tia-sam-backup.log 2>&1

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR_RESOLVED="${DATA_DIR:-$APP_DIR/data}"
BACKUP_ROOT="${BACKUP_DIR:-$APP_DIR/backups}"
DB_FILE="$DATA_DIR_RESOLVED/tiasam.db"
UPLOADS_DIR="$DATA_DIR_RESOLVED/uploads"
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

# 3) Cópia externa (opcional na configuração, obrigatória como prática — backup
#    local no mesmo disco NÃO protege da perda da VPS).
#    Nenhuma credencial fica neste repositório: rclone usa sua própria config
#    (rclone config), rsync usa chaves SSH do usuário de deploy.
#    BACKUP_REMOTE ausente → backup local segue normalmente (exit 0).
#    BACKUP_REMOTE presente e cópia falhando → erro claro + exit 1, SEM
#    destruir o backup local recém-criado (retenção é pulada nesse caso).
EXTERNAL_OK=1
if [ -n "${BACKUP_REMOTE:-}" ]; then
  if [[ "$BACKUP_REMOTE" == /* ]]; then
    if command -v rsync >/dev/null 2>&1; then
      rsync -a "$BACKUP_DIR/" "$BACKUP_REMOTE/$TS/" || EXTERNAL_OK=0
      [ "$EXTERNAL_OK" = 1 ] && echo "[backup] Cópia para destino externo (rsync local/montado): $BACKUP_REMOTE/$TS"
    else
      echo "[backup] ERRO: BACKUP_REMOTE é um caminho local, mas rsync não está instalado." >&2
      EXTERNAL_OK=0
    fi
  elif command -v rclone >/dev/null 2>&1; then
    rclone copy "$BACKUP_DIR" "$BACKUP_REMOTE/$TS" || EXTERNAL_OK=0
    [ "$EXTERNAL_OK" = 1 ] && echo "[backup] Cópia externa enviada via rclone: $BACKUP_REMOTE/$TS"
  elif command -v rsync >/dev/null 2>&1; then
    rsync -a -e ssh "$BACKUP_DIR/" "$BACKUP_REMOTE/$TS/" || EXTERNAL_OK=0
    [ "$EXTERNAL_OK" = 1 ] && echo "[backup] Cópia externa enviada via rsync/ssh: $BACKUP_REMOTE/$TS"
  else
    echo "[backup] ERRO: BACKUP_REMOTE definido, mas nem rclone nem rsync estão instalados — cópia externa impossível." >&2
    EXTERNAL_OK=0
  fi
  if [ "$EXTERNAL_OK" != 1 ]; then
    echo "[backup] ERRO: falha na cópia externa para '$BACKUP_REMOTE'. O backup LOCAL foi PRESERVADO em $BACKUP_DIR." >&2
    exit 1
  fi
else
  echo "[backup] AVISO: BACKUP_REMOTE não definido — este backup existe apenas no mesmo disco da aplicação."
fi

# 4) Retenção — remove backups com mais de RETENTION_DAYS dias
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
