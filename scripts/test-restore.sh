#!/usr/bin/env bash
#
# test-restore.sh — Teste REAL de backup+restore em ambiente isolado.
#
# O que faz (tudo dentro de um diretório temporário):
#   1. Cria um banco de PROVA (com dados de teste) em DATA_DIR temporário;
#   2. Gera uploads de prova;
#   3. Roda scripts/backup.sh apontando para esse DATA_DIR;
#   4. Restaura o backup em OUTRO diretório temporário (simula perda total);
#   5. Abre o SQLite restaurado, roda integrity_check, confere tabelas e dados;
#   6. Confere que os uploads foram recuperados.
#
# SEGURANÇA: não toca no data/ do projeto nem no DATA_DIR de produção.
# Repetível: sempre cria um diretório novo e limpa ao final (KEEP_TMP=1 p/ manter).
#
# Uso (Linux/Git Bash):
#   bash scripts/test-restore.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_BIN="${NODE_BIN:-node}"

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/tiasam-restore-test.XXXXXX")"
SRC_DATA="$TMP_ROOT/src-data"
RESTORE_DATA="$TMP_ROOT/restore-data"
BACKUPS="$TMP_ROOT/backups"

cleanup() {
  if [ "${KEEP_TMP:-0}" = "1" ]; then
    echo "[test-restore] Arquivos mantidos em: $TMP_ROOT"
  else
    rm -rf "$TMP_ROOT"
  fi
}
trap cleanup EXIT

echo "[test-restore] Ambiente isolado: $TMP_ROOT"
mkdir -p "$SRC_DATA/uploads" "$RESTORE_DATA" "$BACKUPS"

# 1) Banco de prova (WAL + dados)
"$NODE_BIN" "$APP_DIR/scripts/test-restore-helper.mjs" make "$SRC_DATA/tiasam.db"

# Escreve mais uma vez para garantir conteúdo no WAL antes do backup
"$NODE_BIN" "$APP_DIR/scripts/test-restore-helper.mjs" walwrite "$SRC_DATA/tiasam.db"

# 2) Uploads de prova
echo 'restore-probe-2026 conteudo do upload' > "$SRC_DATA/uploads/probe-upload.txt"
mkdir -p "$SRC_DATA/uploads/sub"
echo 'subpasta' > "$SRC_DATA/uploads/sub/probe-sub.txt"

# 3) Backup usando o MESMO script de produção, apontando para o DATA_DIR temporário
(
  cd "$APP_DIR"
  DATA_DIR="$SRC_DATA" BACKUP_DIR="$BACKUPS" bash scripts/backup.sh
)

LATEST_BACKUP="$(ls -1 "$BACKUPS" | tail -n1)"
if [ -z "$LATEST_BACKUP" ] || [ ! -f "$BACKUPS/$LATEST_BACKUP/tiasam.db" ]; then
  echo "[test-restore] FALHA: backup não gerou tiasam.db" >&2
  exit 1
fi
echo "[test-restore] Backup gerado: $BACKUPS/$LATEST_BACKUP"

# 4) "Desastre": apaga o diretório de dados original e restaura em outro lugar
rm -rf "$SRC_DATA"
cp "$BACKUPS/$LATEST_BACKUP/tiasam.db" "$RESTORE_DATA/tiasam.db"
if [ -d "$BACKUPS/$LATEST_BACKUP/uploads" ]; then
  cp -a "$BACKUPS/$LATEST_BACKUP/uploads" "$RESTORE_DATA/uploads"
fi

# 5+6) Verificação do restore (integrity_check + tabelas + dados + conteúdo do WAL + uploads)
"$NODE_BIN" "$APP_DIR/scripts/test-restore-helper.mjs" verify "$RESTORE_DATA/tiasam.db" "$RESTORE_DATA/uploads"

echo "[test-restore] ✅ RESTORE TESTADO COM SUCESSO (ambiente isolado, nada de produção foi tocado)"
