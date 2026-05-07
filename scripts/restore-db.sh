#!/bin/bash
# ============================================================================
# DentalSpot — Restore manual desde un backup
# ============================================================================
#
# ⚠️ DESTRUCTIVO: este script DROPea las tablas existentes y las recrea
# desde el dump. Usalo solo en emergencia o sobre un proyecto Supabase
# de staging/branch — NUNCA sobre prod sin backup previo del estado actual.
#
# Uso recomendado para casos de "ay, borre algo":
#   1. Crear un branch en Supabase: dashboard → Branches → "Create branch"
#   2. Setear DENTALSPOT_RESTORE_URL al connection string del branch
#   3. ./scripts/restore-db.sh backups/dentalspot-20260506-120000.sql.gz
#   4. Verificar el branch
#   5. Si todo OK, decidís si hacés merge o copiás filas puntuales
#
# Para evitar accidentes, requiere DENTALSPOT_RESTORE_URL (NO la principal).
# ============================================================================

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: $0 <backup.sql.gz>" >&2
  echo "Ejemplo: $0 backups/dentalspot-20260506-120000.sql.gz" >&2
  exit 1
fi

BACKUP="$1"

if [[ ! -f "$BACKUP" ]]; then
  echo "❌ Archivo no existe: $BACKUP" >&2
  exit 1
fi

if [[ -z "${DENTALSPOT_RESTORE_URL:-}" ]]; then
  echo "❌ Falta DENTALSPOT_RESTORE_URL — apuntá a un BRANCH de Supabase, no a prod." >&2
  echo "   export DENTALSPOT_RESTORE_URL='postgresql://postgres:PASS@db.<branch>.supabase.co:5432/postgres'" >&2
  exit 1
fi

echo "⚠️  Vas a restaurar:"
echo "    Backup: $BACKUP"
echo "    Target: ${DENTALSPOT_RESTORE_URL:0:60}..."
echo ""
read -p "Escribí 'RESTAURAR' para confirmar: " CONFIRM

if [[ "$CONFIRM" != "RESTAURAR" ]]; then
  echo "Cancelado."
  exit 0
fi

echo "[$(date '+%H:%M:%S')] Iniciando restore..."
gunzip -c "$BACKUP" | psql "$DENTALSPOT_RESTORE_URL"
echo "[$(date '+%H:%M:%S')] ✅ Restore completo"
