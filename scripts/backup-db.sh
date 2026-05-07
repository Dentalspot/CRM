#!/bin/bash
# ============================================================================
# DentalSpot — Backup manual de la base de datos
# ============================================================================
#
# Hace pg_dump completo (schema + data) de la BD Supabase, comprime con gzip,
# guarda en ./backups/ y borra backups más viejos que RETENTION_DAYS.
#
# Setup primera vez:
#   1. En Supabase Dashboard → Settings → Database → Connection string →
#      "URI" (formato Direct connection, puerto 5432). Copiá ese string.
#   2. Agregá a tu ~/.zshrc:
#        export DENTALSPOT_DB_URL="postgresql://postgres:TU_PASSWORD@db.tomremkbuxvedliyywbo.supabase.co:5432/postgres"
#   3. source ~/.zshrc
#   4. chmod +x scripts/backup-db.sh
#
# Uso:
#   ./scripts/backup-db.sh
#
# Para automatizar diario (recomendado):
#   crontab -e
#   # Backup diario a las 03:00
#   0 3 * * * cd /Users/danissaklagges/Documents/DENTALSPOT && ./scripts/backup-db.sh >> backups/backup.log 2>&1
# ============================================================================

set -euo pipefail

# Config
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/dentalspot-$TIMESTAMP.sql.gz"

# Validaciones
if [[ -z "${DENTALSPOT_DB_URL:-}" ]]; then
  echo "❌ Falta variable DENTALSPOT_DB_URL en tu shell." >&2
  echo "   Agregala en ~/.zshrc — ver header de este script." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%H:%M:%S')] Iniciando backup → $BACKUP_FILE"

# pg_dump con opciones seguras:
#   --no-owner --no-acl: el restore funciona en cualquier role.
#   --clean --if-exists: el restore primero dropea tablas antes de crear.
#   --quote-all-identifiers: previene problemas con palabras reservadas.
pg_dump \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --format=plain \
  "$DENTALSPOT_DB_URL" \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date '+%H:%M:%S')] ✅ Backup OK ($SIZE) — $BACKUP_FILE"

# Retention: eliminar backups más viejos que RETENTION_DAYS
DELETED=$(find "$BACKUP_DIR" -name "dentalspot-*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')
if [[ "$DELETED" -gt 0 ]]; then
  echo "[$(date '+%H:%M:%S')] 🗑  Eliminados $DELETED backups > $RETENTION_DAYS días"
fi

# Resumen final
TOTAL=$(find "$BACKUP_DIR" -name "dentalspot-*.sql.gz" | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "[$(date '+%H:%M:%S')] 📦 Backups disponibles: $TOTAL ($TOTAL_SIZE total)"
