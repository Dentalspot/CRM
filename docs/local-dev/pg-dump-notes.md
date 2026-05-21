# Regenerar `supabase/schema.sql` — notas de dev ops

**TL;DR**: Supabase CLI usa Docker para `db dump`. Si no tienes Docker, instalas `postgresql@17` via Homebrew y usas pg_dump directo con el script que el CLI genera en `--dry-run`.

**Cuándo regenerar**: después de aplicar migraciones nuevas, para que `schema.sql` refleje el estado DB actual. No es fuente de verdad para apply (eso son las migraciones), pero sirve como snapshot legible + onboarding + debugging offline.

---

## Receta rápida (ya tienes postgresql@17 instalado)

```bash
# 1. Capturar el script del CLI con credentials frescas
supabase db dump --linked --dry-run 2>/dev/null > /tmp/dump.sh

# 2. Reemplazar pg_dump por el binario local v17
sed 's|^pg_dump \\$|/usr/local/opt/postgresql@17/bin/pg_dump \\|' /tmp/dump.sh > /tmp/dump17.sh

# 3. Ejecutar
bash /tmp/dump17.sh > supabase/schema.sql 2> /tmp/dump.err
# exit 0 esperado; stderr vacío esperado

# 4. Limpiar trailing blank lines (artefacto del sed pipeline del CLI)
awk 'NF { last=NR; buf[NR]=$0; next } { buf[NR]=$0 } END { for (i=1; i<=last; i++) print buf[i] }' \
  supabase/schema.sql > /tmp/trimmed.sql && mv /tmp/trimmed.sql supabase/schema.sql

# 5. Limpiar temps (contienen credentials CLI session)
rm -f /tmp/dump.sh /tmp/dump17.sh /tmp/dump.err

# 6. Verificar
grep -c "^CREATE TABLE" supabase/schema.sql          # esperado ~194+
grep -c "CREATE POLICY" supabase/schema.sql          # esperado ~458+
grep -c "^\-\-" supabase/schema.sql                  # esperado 0 (sed strip)

# 7. Commit
git add supabase/schema.sql
git commit -m "chore(schema): regenerate schema.sql (post migration XXX)"
```

---

## Setup inicial (solo una vez)

### Prerequisito: pg_dump >= server version

```bash
# Verificar versión del server
supabase db dump --linked --dry-run 2>&1 | grep "server version" || true
# O intentando el dump real — fallará con "server version mismatch" si client es viejo

# Si tu pg_dump local es viejo:
brew install postgresql@17  # o la versión que matchee
```

**Por qué keg-only**: postgresql@17 se instala en `/usr/local/opt/postgresql@17/bin/` sin modificar el PATH. Tu pg 14 default sigue funcionando. Para usarlo sin path absoluto: `brew link --force postgresql@17` (**no recomendado** si ya usas pg 14 para otra cosa).

### Por qué no usar Supabase CLI directo

`supabase db dump --linked` internamente ejecuta pg_dump dentro de un contenedor Docker. Si no tienes Docker instalado/corriendo, falla con:
```
failed to inspect docker image: Cannot connect to the Docker daemon
```

El CLI NO tiene flag `--no-docker`. El workaround: usar el `--dry-run` para extraer el script bash que el CLI iba a ejecutar, y correrlo con un pg_dump local.

---

## Qué hace el script del CLI

El dry-run genera un bash script con:

1. **Env exports** — `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` con credenciales ephemeral del "CLI login role" del proyecto linked.
2. **`pg_dump` invocation** con flags:
   - `--schema-only` (no data)
   - `--quote-all-identifier`
   - `--role "postgres"`
   - `--exclude-schema` con la lista de schemas internos de Supabase (auth, storage, realtime, etc.)
3. **Pipeline de sed** que transforma:
   - Strip `-- ...` comment markers (strip todo comment line)
   - `CREATE SCHEMA "` → `CREATE SCHEMA IF NOT EXISTS "`
   - `CREATE TABLE "` → `CREATE TABLE IF NOT EXISTS "`
   - `CREATE VIEW "` → `CREATE OR REPLACE VIEW "`
   - `CREATE FUNCTION "` → `CREATE OR REPLACE FUNCTION "`
   - `CREATE TRIGGER "` → `CREATE OR REPLACE TRIGGER "`
   - Strip `CREATE PUBLICATION "supabase_realtime...`, `CREATE EVENT TRIGGER`, `ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"`, etc.

**Implicación diff**: el sed pipeline reescribe ~50% del archivo con `IF NOT EXISTS`. Si el dump anterior se hizo con otra pipeline (ej: pg_dump v15 sin sed), el primer regen post-upgrade producirá un diff gigante cosmético (+12K/-12K líneas). Las siguientes regens tendrán diffs limpios.

**Las credentials son ephemeral** — el CLI las regenera cada `--dry-run`. No commitees el archivo temp.

---

## Errores típicos

### `server version mismatch: server 17.6; pg_dump version: 15.17`
**Causa**: Supabase upgradó el server y tu pg_dump local quedó viejo.

**Fix**: instalar versión compatible:
```bash
brew install postgresql@17  # o la versión que pida
```

### `Cannot connect to the Docker daemon`
**Causa**: Supabase CLI quiere Docker y no lo tienes.

**Fix**: usar el workaround `--dry-run` + local pg_dump (receta arriba). NO instales Docker Desktop solo para esto — son ~500MB y no suma nada si ya tienes pg_dump local.

### `pg_dump: error: aborting because of server version mismatch`
Mismo que el primero — verificar que `/usr/local/opt/postgresql@17/bin/pg_dump` está siendo usado, no el default del PATH.

### Diff enorme pero contenido semántico similar
**Normal** post cambio de pipeline (ver arriba). Verificar con:
```bash
git diff supabase/schema.sql | grep -E "^[+-]CREATE (TABLE|POLICY|FUNCTION) " | head -20
```
Si solo ves flips `CREATE X "` ↔ `CREATE X IF NOT EXISTS "`, es cosmético. Si ves símbolos nuevos (`CREATE TABLE "nueva_tabla"`), son cambios reales de migraciones.

### `supabase db dump` pide password interactivo
No debería. Si pasa, verificar que el proyecto esté linked:
```bash
supabase projects list  # el proyecto con "●" está linked
```

---

## Qué hay en `supabase/` y cuál es fuente de verdad

| Archivo | Estado | Uso |
|---|---|---|
| `supabase/migrations/*.sql` | **Fuente de verdad** | apply via CLI o SQL Editor |
| `supabase/schema.sql` | Snapshot derivado | onboarding/debug offline, **NO apply** |
| `supabase/policies.sql` | Snapshot histórico (stale 2026-02) | referencia legible; tech debt regenerarlo |
| `supabase/tables_list.txt` | Snapshot stale (173 entries, pre-spec 022) | stale; no confiar |
| `supabase/schema_storage.sql` | Snapshot de `storage` schema | referencia |
| `supabase/seed_dentalspot_admins.sql` | Seed de admins | apply manual post-deploy fresh env |

**Regla**: si quieres aplicar algo a la DB, usa las migraciones. Los snapshots son lectura.

---

## Regeneración bulk de los otros snapshots (futuro)

No automatizado todavía. Follow-up micro-bloque:

```bash
# Tables list
/usr/local/opt/postgresql@17/bin/psql "$DB_URL" -c "\dt public.*" > supabase/tables_list.txt

# Policies bulk dump
/usr/local/opt/postgresql@17/bin/pg_dump "$DB_URL" \
  --schema-only --no-comments \
  | grep -A 10 "^CREATE POLICY" > supabase/policies.sql
```

Por ahora queda stale. El `schema.sql` regenerado contiene toda la info de ambos.

---

## Historial de upgrades del server Supabase

Documentar cuando detectés un mismatch:

| Fecha | Server version | pg_dump client requerido |
|---|---|---|
| ≤2026-04-20 | 15.8 | 15.x |
| 2026-04-22 | 17.6 | 17.x |

**Cómo verificar server version actual**:
```bash
supabase db dump --linked --dry-run 2>&1 | grep "server version"
```

O intentar el dump real con tu client actual — si el server es más nuevo, error inmediato con la versión exacta del server.
