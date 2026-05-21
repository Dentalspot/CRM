# Quickstart — Spec 021 Cleanup FonoKit Legacy

**Phase**: 1 (Design & Contracts — Ejecución guide)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

Guía step-by-step ejecutable para `/speckit-implement`. Comandos copy-paste. Tiempo total estimado: **4-5 h**.

---

## Pre-requisitos ✅

### Ya completados en sesiones previas
- ✅ Supabase CLI v2.90.0 instalado + autenticado
- ✅ Proyecto linked: `tomremkbuxvedliyywbo`
- ✅ Branch `021-cleanup-fonokit-legacy` creado + checked out
- ✅ Dominio `dentalspot.cl` responde HTTP 200 (verified spec 020)
- ✅ FonoKit real en otro proyecto Supabase (verified 2026-04-22)

### Antes de arrancar Phase A
- [ ] Terminal abierta en `/Users/danissaklagges/Documents/DENTALSPOT/`
- [ ] Git working tree clean (o solo con docs de spec 021 pendientes de commit)
- [ ] Acceso al dashboard Supabase (para Phase A verificaciones de crons)

---

## Phase A — Pre-flight verification (~30 min)

### A1. Verificar crons activos en Supabase

**Opción 1** (si tienes acceso al panel web):
```
Supabase Dashboard → Project tomremkbuxvedliyywbo → Database → Cron Jobs
```
Listar todos los schedules y revisar si alguno invoca a:
- `process-scheduled-emails`
- `welcome-sequence`
- `send-marketing-campaign`
- `form-auto-responder`

**Opción 2** (vía SQL, si pg_cron extension activa):
```sql
SELECT jobname, schedule, command, active
FROM cron.job
WHERE active = true
ORDER BY jobname;
```

**Expected**: ninguna de las 10 functions en FR-001 aparece. Si aparece alguna → reclasificar (exclude del delete).

### A2. Verificar triggers DB que invoquen edge functions

```sql
SELECT event_object_table, trigger_name, action_statement
FROM information_schema.triggers
WHERE action_statement LIKE '%net.http_post%'
   OR action_statement LIKE '%functions/v1/%';
```

**Expected**: triggers que invocan edge functions (si existen) apuntan SOLO a functions que están en scope "a mantener" (ej. `mercadopago-webhook` si algún trigger lo invoca).

### A3. Verificar webhooks externos configurados

Revisar paneles de integración externa:
- **MercadoPago** → Panel developers → Webhooks → confirmar que solo apunta a `mercadopago-webhook` (debería estar así del spec 020)
- **Resend** (si aplica) → Dashboard → Webhooks → ninguno configurado a `test-email` o `process-scheduled-emails`
- **Meta/Facebook** → si tuviera webhook setup → no apunta a `meta-ads-manager` (debería usar `new-meta-capi`)

**Expected**: todos los webhooks externos apuntan a functions fuera del scope de delete.

### A4. Decisión og-preview (FR-005)

```sql
-- Asumir tabla blog_posts; confirmar nombre si es distinto
SELECT COUNT(*) AS published_count
FROM blog_posts
WHERE published = true
  AND (published_at IS NULL OR published_at <= NOW());
```

**Decisión**:
- `published_count = 0` → **diferir** rebrand og-preview (dejar como está, spec futuro)
- `published_count > 0` → **rebrandear ahora** (agregar a Phase C)

Si la tabla no se llama `blog_posts`, probar:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%blog%';
```

### A5. Decisión export-leads-csv (FR-004)

```bash
# Grep frontend
grep -rin "export-leads-csv" /Users/danissaklagges/Documents/DENTALSPOT/src/
```

**Expected**: 0 matches → dead code → incluir en FR-001 delete list (total 11 functions).

Si hay matches → reclasificar a rebrand (simple filename change).

### 🟢 SP-A checkpoint

Confirmar mentalmente:
- [ ] A1: crons revisados, ninguno bloquea delete
- [ ] A2: triggers DB revisados, ninguno bloquea delete
- [ ] A3: webhooks externos no afectados
- [ ] A4: decisión og-preview tomada (rebrand o diferir)
- [ ] A5: decisión export-leads-csv tomada (delete o rebrand)

**🟢 GO Phase B** (con lista final de N archivos a eliminar confirmada).

---

## Phase B — Delete dead code (~45 min)

### Loop ejecutable (10 archivos confirmados)

Ejecutar **uno a la vez** con verificación post cada iteración. Si alguno falla, parar y revisar antes de continuar.

```bash
# Variables
PROJECT_REF="tomremkbuxvedliyywbo"

# Lista de functions a eliminar
FUNCTIONS_TO_DELETE=(
  "process-scheduled-emails"
  "welcome-sequence"
  "rag-query"
  "form-auto-responder"
  "setup-ads"
  "setup-ads-v3"
  "setup-campaigns"
  "meta-ads-manager"
  "test-email"
  "send-marketing-campaign"
)

# Agregar export-leads-csv si Phase A FR-004 lo decidió
# FUNCTIONS_TO_DELETE+=("export-leads-csv")
```

### Ejecución individual (por cada function)

```bash
# Ejemplo con process-scheduled-emails:
FN="process-scheduled-emails"

# Paso 1: delete local
rm -rf supabase/functions/${FN}/
echo "✓ Local deleted: ${FN}"

# Paso 2: delete remoto
supabase functions delete ${FN} --project-ref ${PROJECT_REF}
echo "✓ Remote deleted: ${FN}"

# Paso 3: verificar ausencia
ls supabase/functions/${FN}/ 2>&1 | head -1
# Expected: "ls: No such file or directory"
```

### Verificación batch post-Phase B

```bash
# B1: 10 carpetas menos
echo "=== B1: carpetas menos ==="
ls supabase/functions/ | wc -l
# Expected: decrement de 10 vs estado pre-spec

# B2: grep residual (deberían quedar solo matches en los 4 a rebrandear)
echo "=== B2: grep fonokit residual ==="
grep -rin "fonokit" supabase/functions/ | awk -F: '{print $1}' | sort -u
# Expected output: solo archivos de clinic-invitations, prepare-training-data,
#                  generate-ad-copy, marketplace-ai-description
# (+ og-preview/export-leads-csv si Phase A defirió)

# B3: confirmar deletes remotos
echo "=== B3: supabase functions list ==="
supabase functions list --project-ref ${PROJECT_REF} | grep -cE "^(process-scheduled-emails|welcome-sequence|rag-query|form-auto-responder|setup-ads|setup-ads-v3|setup-campaigns|meta-ads-manager|test-email|send-marketing-campaign)$"
# Expected: 0
```

### 🟢 SP-B checkpoint

- [ ] B1: ~10 carpetas menos
- [ ] B2: grep solo encuentra "fonokit" en 4 archivos a rebrandear (+ quizás og-preview)
- [ ] B3: 0 functions deletadas aparecen en list remoto

**🟢 GO Phase C**

---

## Phase C — Rebrand used edge functions (~1.5-2 h)

### C1. `clinic-invitations/index.ts` (30-40 min)

4 edits principales. Leer el archivo completo primero, luego aplicar cambios:

```typescript
// Línea ~12:
-const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://fonokit.cl";
+const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://dentalspot.cl";

// Línea ~29 (dentro de función sendEmail o similar):
-        from: "Fonokit <no-reply@fonokit.cl>",
+        from: "DentalSpot <no-reply@dentalspot.cl>",

// Línea ~99 (HTML banner):
-          <h1 style="color:white;margin:0;font-size:24px">FONOKIT</h1>
+          <h1 style="color:white;margin:0;font-size:24px">DENTALSPOT</h1>

// Línea ~103 (body text):
-          <p style="color:#6b7280;font-size:15px">Has sido invitado a formar parte del equipo clinico en Fonokit.</p>
+          <p style="color:#6b7280;font-size:15px">Has sido invitado a formar parte del equipo clínico en DentalSpot.</p>
```

**Verificación post-edit**:
```bash
grep -in "fonokit\|FONOKIT" supabase/functions/clinic-invitations/index.ts
# Expected: (no output)

grep -in "dentalspot\|DENTALSPOT" supabase/functions/clinic-invitations/index.ts | wc -l
# Expected: ≥ 4 líneas
```

### C2. `prepare-training-data/index.ts` (15 min)

1 edit de filename:

```typescript
// Línea ~152:
-    const fileName = `fonokit_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl`
+    const fileName = `dentalspot_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl`
```

### C3. `generate-ad-copy/index.ts` (20 min)

3 edits:

```typescript
// Línea ~86:
-      product = 'Fonokit — plataforma para fonoaudiologos',
+      product = 'DentalSpot — plataforma para dentistas',

// Línea ~153:
-        'HTTP-Referer': 'https://fonokit.cl',
+        'HTTP-Referer': 'https://dentalspot.cl',

// Línea ~154:
-        'X-Title': 'Fonokit Ad Copy Generator',
+        'X-Title': 'DentalSpot Ad Copy Generator',
```

### C4. `marketplace-ai-description/index.ts` (15 min — defense-in-depth)

1 edit de prompt:

```typescript
// Línea ~34:
-    const userPrompt = `Genera una descripción mejorada para este producto del marketplace de Fonokit:
+    const userPrompt = `Genera una descripción mejorada para este producto del marketplace de DentalSpot:
```

### C5. (Opcional) `og-preview/index.ts` — si Phase A decidió rebrand

Si FR-005 decidió rebrandear:

```typescript
// Línea ~40:
-      headers: { Location: `https://fonokit.cl/blog/${slug}` },
+      headers: { Location: `https://dentalspot.cl/blog/${slug}` },

// Líneas ~44-48 (defaults):
-  const title = post.meta_title || post.title || 'FONOKIT Blog'
+  const title = post.meta_title || post.title || 'DentalSpot Blog'
-  const description = post.meta_description || post.excerpt || post.subtitle || `${post.title} — Artículo de fonoaudiología en FONOKIT`
+  const description = post.meta_description || post.excerpt || post.subtitle || `${post.title} — Artículo en DentalSpot`
-  const image = post.cover_url || 'https://fonokit.cl/og-default.jpg'
+  const image = post.cover_url || 'https://dentalspot.cl/og-default.jpg'
-  const canonicalUrl = `https://fonokit.cl/blog/${post.slug || post.id}`
+  const canonicalUrl = `https://dentalspot.cl/blog/${post.slug || post.id}`
-  const author = post.author_name || 'Equipo FONOKIT'
+  const author = post.author_name || 'Equipo DentalSpot'

// Línea ~56 (title tag):
-  <title>${escapeHtml(title)} | FONOKIT Blog</title>
+  <title>${escapeHtml(title)} | DentalSpot Blog</title>

// Línea ~67:
-  <meta property="og:site_name" content="FONOKIT">
+  <meta property="og:site_name" content="DentalSpot">
```

### Verificación post-Phase C

```bash
# C1: 0 matches de fonokit en los 4-5 archivos rebrandeados
grep -rin "fonokit" \
  supabase/functions/clinic-invitations \
  supabase/functions/prepare-training-data \
  supabase/functions/generate-ad-copy \
  supabase/functions/marketplace-ai-description
# Expected: (empty)

# C2: signatures intactas — diff review manual
git diff supabase/functions/clinic-invitations/index.ts | head -50
# Review: solo strings cosméticos, NO cambios en:
# - body request parsing (req.json())
# - response JSON structure
# - error codes (400, 500)

# C3: zero edits a src/**
git status --short src/
# Expected: (empty)

# C4: zero migraciones
git status --short supabase/migrations/
# Expected: (empty)
```

### 🟢 SP-C checkpoint

- [ ] C1: grep fonokit = 0 en los 4-5 archivos rebrandeados
- [ ] C2: signatures intactas (diff review)
- [ ] C3: 0 edits a src/**
- [ ] C4: 0 migraciones

**🟢 GO Phase D**

---

## Phase D — Deploy + smoke test (~1 h)

### D1. Deploy de los 4-5 functions rebrandeadas

```bash
supabase functions deploy clinic-invitations prepare-training-data generate-ad-copy marketplace-ai-description \
  --project-ref tomremkbuxvedliyywbo

# Si og-preview también se rebrandeó, agregar al comando:
# supabase functions deploy ... og-preview --project-ref ...
```

**Expected output**: "Deployed Functions on project tomremkbuxvedliyywbo: ..."

### D2. Smoke test — clinic-invitations (Test más importante, P1)

**Opción A — Si tienes el dev server de DentalSpot corriendo**:
1. Login como admin de clínica
2. Navegar a `/clinic/invitations` (o la página equivalente)
3. Invitar email test (usar tu propio email o un alias)
4. Click "Enviar invitación"

**Opción B — Via curl directo**:
```bash
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXJlbWtidXh2ZWRsaXl5d2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTI0MDAsImV4cCI6MjA5MTIyODQwMH0.4zKIR8LTtXG42dbH8tfcyy_mgzHOLh_S5gKH80a0ucs"

curl -X POST "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/clinic-invitations" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email-test@example.com",
    "invitationToken": "test-token-abc",
    "clinicName": "Clínica Test",
    "role": "dentist"
  }'
```

**Verificación en email recibido** (inbox del email test):
- ✅ Remitente: `DentalSpot <no-reply@dentalspot.cl>` (no "Fonokit")
- ✅ Asunto: incluye branding DentalSpot
- ✅ Banner HTML: texto "DENTALSPOT" (no "FONOKIT")
- ✅ Body: "Clínica Test" aparece, contexto DentalSpot
- ✅ Link de aceptación: URL apunta a `dentalspot.cl` (no `fonokit.cl`)

**🔴 Si falla** (email muestra FonoKit): urgent rollback Phase C + revisar edits.

### D3. Smoke test — prepare-training-data

Via admin panel (más simple) o curl:

**Opción A — Via admin panel**:
1. Login como admin
2. Navegar a módulo fonolevel admin
3. Trigger export training data
4. Descargar archivo
5. **Verificar filename**: debe empezar con `dentalspot_` (no `fonokit_`)

**Opción B — Via curl**:
```bash
curl -X POST "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/prepare-training-data" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dataset_type": "dentallevel"}'

# Verificar en response:
# - filename: "dentalspot_dentallevel_2026-04-22.jsonl"
```

### D4. Smoke test — generate-ad-copy

**Via admin MetaAdsPage o curl**:
```bash
curl -X POST "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/generate-ad-copy" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Verificar en response (data field):
# El copy generado menciona "DentalSpot" o "dentistas" (no "Fonokit" ni "fonoaudiologos")
```

### D5. `marketplace-ai-description` (skip — marketplace OFF)

Defense-in-depth deploy validado via diff review. No smoke test.

### 🟢 SP-D checkpoint

- [ ] D1: 4-5 functions deployadas
- [ ] D2: email clinic-invitation recibido con branding DentalSpot ✅
- [ ] D3: filename training data `dentalspot_*` ✅
- [ ] D4: ad copy default menciona DentalSpot ✅

**🟢 GO Phase E**

---

## Phase E — Close (~30 min)

### E1. Update `.specify/memory/architecture.md`

Agregar subsección al final de la sección de specs históricos:

```markdown
### Legacy FonoKit cleanup (spec 021 — 2026-04-22)

**Verdict**: ✅ RESUELTO. Cleanup de 10-11 edge functions dead code heredadas
de FonoKit + rebrand de 3-4 edge functions activas que usaban branding
FonoKit residual. Repo coherente con identidad DentalSpot.

**Origen**: Post-spec 020 (MP rebrand), grep exhaustivo reveló ~25 archivos
con branding "fonokit" en supabase/functions/. Análisis cruzado con
src/** identificó que 10 eran dead code (0 callsites) y 3-4 eran usados
activamente.

**Deletes** (10 functions, dead code): process-scheduled-emails,
welcome-sequence, rag-query, form-auto-responder, setup-ads, setup-ads-v3,
setup-campaigns, meta-ads-manager, test-email, send-marketing-campaign.
[+ export-leads-csv si Phase A confirmó dead code]

**Rebrands** (3-4 functions usadas): clinic-invitations (email banner +
remitente + link), prepare-training-data (filename output), generate-ad-copy
(default product + HTTP headers), marketplace-ai-description (defense-in-depth,
marketplace OFF).

**Smoke test**: email invitation recibido con branding DentalSpot ✅,
filename dentalspot_* ✅, ad copy default DentalSpot ✅.

**Follow-ups pendientes**: meta-spec `fix-mercadopago-critical-bugs`
(F-001/F-002/F-003/F-005 del audit spec 019), `add-subscription-plans-tier-model`
(pricing tier real).

**Referencias**: spec 019 audit origen, spec 020 patrón rebrand precedente,
session log 2026-04-22.
```

Update `**Last updated**:` line al final del archivo con nuevo resumen.

### E2. Update session log

Agregar nueva "Parte 7 (final 2)" a `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`:

```markdown
---

## Parte 7 (final 2) — Spec 021 cleanup FonoKit legacy ejecutado

### Resumen

Post-spec 020, grep exhaustivo reveló que el repo DentalSpot tenía ~25
archivos con branding FonoKit residual. Cross-check con src/** identificó
10 dead code + 3-4 usadas. Spec 021 ejecutó cleanup + rebrand híbrido.

### Ciclo completo (1 sesión)

[Detalle de fases A/B/C/D/E ejecutadas con outputs reales]

### Hallazgos

[Resultados Phase A: crons, triggers, og-preview decision, export-leads-csv decision]
[Commit final: <SHA>]
```

### E3. Update CLAUDE.md Active feature pointer

```markdown
**Active feature**: `021-cleanup-fonokit-legacy` → ✅ CLOSED 2026-04-22.
10 edge functions dead code eliminadas + 3-4 rebrandeadas. Repo coherente
con branding DentalSpot. Próximo follow-up: meta-spec
`fix-mercadopago-critical-bugs` (P0) o `add-subscription-plans-tier-model` (P1).
```

### E4. Commit único

```bash
git add supabase/functions/ \
        .specify/memory/architecture.md \
        CLAUDE.md \
        docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md \
        specs/021-cleanup-fonokit-legacy/

git commit -m "feat(cleanup): legacy FonoKit edge functions + rebrand used (spec 021)

[detalle comprehensive per Constitution §IV Micro-Bloques]"
```

### E5. Merge + push (push delegado a Danissa)

```bash
git checkout main
git merge --no-ff 021-cleanup-fonokit-legacy -m "merge: spec 021 cleanup FonoKit legacy (CLOSED)"

# NO push — Danissa lo hace post-review
```

### 🟢 SP-E checkpoint

- [ ] E1: architecture.md actualizada
- [ ] E2: session log actualizada
- [ ] E3: CLAUDE.md Active feature actualizada
- [ ] E4: commit único con rationale
- [ ] E5: merge a main (pending push)

---

## ❗ Rollback (si algo sale mal)

### Rollback Phase B (delete accidental de función usada)

```bash
# Restaurar local desde git
git checkout HEAD -- supabase/functions/<NAME>/

# Re-deploy a Supabase
supabase functions deploy <NAME> --project-ref tomremkbuxvedliyywbo
```

### Rollback Phase C (edit rompió signature)

```bash
# Restaurar archivo desde último commit
git checkout HEAD -- supabase/functions/<NAME>/index.ts

# Re-deploy versión previa
supabase functions deploy <NAME> --project-ref tomremkbuxvedliyywbo
```

### Rollback Phase D (smoke test D2 fallo — email invitation rompe)

🔴 **URGENT**:
```bash
# 1. Revertir clinic-invitations
git checkout HEAD -- supabase/functions/clinic-invitations/index.ts

# 2. Re-deploy versión previa inmediatamente
supabase functions deploy clinic-invitations --project-ref tomremkbuxvedliyywbo

# 3. Verificar con nuevo test email que vuelve a funcionar (aunque con branding FonoKit)

# 4. Investigar qué cambio rompió el email (probable: template HTML mal escapado)

# 5. Re-aplicar fix + smoke test antes de marcar spec como cerrado
```

---

## Time tracking

| Phase | Planned | Actual (llenar al ejecutar) |
|---|---|---|
| A | 30 min | __ min |
| B | 45 min | __ min |
| C | 1.5-2 h | __ min |
| D | 1 h | __ min |
| E | 30 min | __ min |
| **Total** | **4-5 h** | __ min |

---

## Next después de E5

Spec 021 cerrado. Push a origin/main lo hace Danissa.

Próximo follow-up del roadmap:
- **Meta-spec `fix-mercadopago-critical-bugs`** (P0, 16-22h, spec 019 BLOCKERs F-001/F-002/F-003/F-005)
- O **`add-subscription-plans-tier-model`** (P1, 10-14h, pricing tier real pre-launch)

Decisión advisor post-close de spec 021 según timeline de launch.
