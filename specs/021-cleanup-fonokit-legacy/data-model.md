# Data Model — Spec 021 Cleanup FonoKit Legacy

**Phase**: 1 (Design & Contracts)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)

---

## Overview

Spec 021 **no introduce entities nuevas** ni modifica schemas. Documenta la tabla exhaustiva de archivos a eliminar + tabla exhaustiva de strings a reemplazar en los rebrands.

Para spec de tipo "cleanup + rebrand" (sin DB changes), el "data model" equivalente es: **qué archivos mueren, qué strings cambian, qué signatures se preservan**.

---

## 1. Tabla de deletes (10 confirmados + 1 Phase A)

### Lista exhaustiva

| # | Archivo | Rm comando local | Delete comando remoto | Razón |
|---|---|---|---|---|
| 01 | `supabase/functions/process-scheduled-emails/` | `rm -rf supabase/functions/process-scheduled-emails` | `supabase functions delete process-scheduled-emails --project-ref tomremkbuxvedliyywbo` | Scheduler emails FonoKit, 0 callsites src/**, verify cron Phase A |
| 02 | `supabase/functions/welcome-sequence/` | `rm -rf ...welcome-sequence` | `supabase functions delete welcome-sequence ...` | Onboarding email FonoKit, 0 callsites |
| 03 | `supabase/functions/rag-query/` | `rm -rf ...rag-query` | `supabase functions delete rag-query ...` | Chatbot FonoKit con prompt fonoaudiología, 0 callsites |
| 04 | `supabase/functions/form-auto-responder/` | `rm -rf ...form-auto-responder` | `supabase functions delete form-auto-responder ...` | Auto-reply emails FonoKit, 0 callsites |
| 05 | `supabase/functions/setup-ads/` | `rm -rf ...setup-ads` | `supabase functions delete setup-ads ...` | Meta Ads setup FonoKit CORFO, 0 callsites |
| 06 | `supabase/functions/setup-ads-v3/` | `rm -rf ...setup-ads-v3` | `supabase functions delete setup-ads-v3 ...` | v3 iteration FonoKit growth, 0 callsites |
| 07 | `supabase/functions/setup-campaigns/` | `rm -rf ...setup-campaigns` | `supabase functions delete setup-campaigns ...` | Campaign setup FonoKit, 0 callsites |
| 08 | `supabase/functions/meta-ads-manager/` | `rm -rf ...meta-ads-manager` | `supabase functions delete meta-ads-manager ...` | Manager ads FonoKit, 0 callsites |
| 09 | `supabase/functions/test-email/` | `rm -rf ...test-email` | `supabase functions delete test-email ...` | Debug one-shot FonoKit, 0 callsites |
| 10 | `supabase/functions/send-marketing-campaign/` | `rm -rf ...send-marketing-campaign` | `supabase functions delete send-marketing-campaign ...` | Marketing outbound FonoKit, 0 callsites |
| 11 | `supabase/functions/export-leads-csv/` | (Phase A decision) | (Phase A decision) | **Phase A verificación**: si dead code → delete 11º archivo; si usado → rebrand |

### Comando batch (Phase B execution)

Sequential (un archivo a la vez) con verificación post cada delete:

```bash
# Plantilla por archivo (iterar 10 veces):
rm -rf supabase/functions/<NAME>/
supabase functions delete <NAME> --project-ref tomremkbuxvedliyywbo
ls supabase/functions/<NAME>/ 2>&1 | head -1  # expected: "No such file or directory"

# Al final (batch verification):
ls supabase/functions/ | wc -l  # expected: decrement de 10
supabase functions list --project-ref tomremkbuxvedliyywbo | grep -cE "^<deleted-names>$"  # expected: 0
grep -rin "fonokit" supabase/functions/ | wc -l  # expected: solo matches en 4 archivos a rebrandear
```

---

## 2. Tabla de rebrands (3 confirmados + 1 defense-in-depth)

### 2.1. `clinic-invitations/index.ts` — Mapeo exhaustivo

**Callsite confirmed**: `ClinicInvitationsPanel.jsx:21,50` + `InviteAcceptPage.jsx:26,53`

| Línea aprox | Tipo | Valor actual (fragmento) | Valor post-rebrand |
|---|---|---|---|
| ~12 | `FRONTEND_URL` fallback default | `Deno.env.get("FRONTEND_URL") ?? "https://fonokit.cl"` | `Deno.env.get("FRONTEND_URL") ?? "https://dentalspot.cl"` |
| ~29 | Email `from:` | `from: "Fonokit <no-reply@fonokit.cl>"` | `from: "DentalSpot <no-reply@dentalspot.cl>"` |
| ~99 | HTML banner `<h1>` | `<h1 style="...">FONOKIT</h1>` | `<h1 style="...">DENTALSPOT</h1>` |
| ~103 | Texto body del email | `"Has sido invitado a formar parte del equipo clínico en Fonokit."` | `"Has sido invitado a formar parte del equipo clínico en DentalSpot."` |

**Total matches estimados**: 4 líneas (confirmar en Phase A grep final).

**Preservación signature**:
- Body request: `{ email, invitationToken, clinicName, role }` — no se toca.
- Response: `{ success: boolean, message?, error? }` — no se toca.
- Error codes: 400 (validation), 500 (Resend API failure) — no se tocan.

### 2.2. `prepare-training-data/index.ts` — Mapeo

**Callsite confirmed**: `fonoLevelApi.js:73`

| Línea aprox | Tipo | Valor actual | Valor post-rebrand |
|---|---|---|---|
| ~152 | Filename template del JSONL | `` `fonokit_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl` `` | `` `dentalspot_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl` `` |

**Total matches estimados**: 1 línea.

**Preservación signature**:
- Body request: `{ dataset_type }` — no se toca.
- Response: `{ success, filename, size, ... }` — no se toca (solo cambia el **valor** de `filename`).

### 2.3. `generate-ad-copy/index.ts` — Mapeo

**Callsite confirmed**: `MetaAdsPage.jsx:850`

| Línea aprox | Tipo | Valor actual | Valor post-rebrand |
|---|---|---|---|
| ~86 | Default `product` en prompt | `product = 'Fonokit — plataforma para fonoaudiologos'` | `product = 'DentalSpot — plataforma para dentistas'` |
| ~153 | HTTP-Referer header | `'HTTP-Referer': 'https://fonokit.cl'` | `'HTTP-Referer': 'https://dentalspot.cl'` |
| ~154 | X-Title header | `'X-Title': 'Fonokit Ad Copy Generator'` | `'X-Title': 'DentalSpot Ad Copy Generator'` |

**Total matches estimados**: 3 líneas.

**Preservación signature**:
- Body request: `{ product?, tone?, audience?, ... }` — no se toca (solo cambia **default** cuando `product` no viene del cliente).
- Response: ad copy string — no se toca.

### 2.4. `marketplace-ai-description/index.ts` — Mapeo (defense-in-depth)

**Callsite confirmed**: `AiDescriptionButton.jsx:23` (marketplace OFF via FEATURE_FLAG)

| Línea aprox | Tipo | Valor actual | Valor post-rebrand |
|---|---|---|---|
| ~34 | Prompt user string | `"Genera una descripción mejorada para este producto del marketplace de Fonokit:"` | `"Genera una descripción mejorada para este producto del marketplace de DentalSpot:"` |

**Total matches estimados**: 1 línea (confirmar Phase A grep).

**Preservación signature**: mismo body + response format.

### Total de rebrands

**~9 líneas** cambiadas distribuidas en 4 archivos. Preservación de signatures = FR-008 compliance.

---

## 3. Tabla Phase A verifications

### 3.1. Verificación `og-preview` (FR-005)

**Criterio de decisión**: blog activo con posts publicados → rebrand ahora.

**Query a ejecutar**:
```sql
-- Asumiendo tabla blog_posts con columna published boolean.
-- Confirmar nombre de tabla y columna en Phase A (puede llamarse distinto).
SELECT COUNT(*) AS published_count
FROM blog_posts
WHERE published = true
  AND published_at <= NOW();
```

**Outcomes**:
- `published_count = 0` → diferir rebrand og-preview a spec futuro (junto con UI rebrand blog)
- `published_count > 0` → rebrandear ahora (cambios: `'FONOKIT Blog'` → `'DentalSpot Blog'`, `og_site_name`, default image URL)

**Si rebrand procede** — strings a cambiar en `og-preview/index.ts`:

| Línea aprox | Tipo | Valor actual | Valor post-rebrand |
|---|---|---|---|
| ~40 | Fallback redirect | `Location: https://fonokit.cl/blog/${slug}` | `Location: https://dentalspot.cl/blog/${slug}` |
| ~44-48 | Meta title/description/image defaults | `'FONOKIT Blog'`, `'Equipo FONOKIT'`, `'https://fonokit.cl/og-default.jpg'` | `'DentalSpot Blog'`, `'Equipo DentalSpot'`, `'https://dentalspot.cl/og-default.jpg'` |
| ~56 | `<title>` HTML | `${title} | FONOKIT Blog` | `${title} | DentalSpot Blog` |
| ~67 | `og:site_name` meta | `content="FONOKIT"` | `content="DentalSpot"` |

**Total estimado**: 5-6 líneas si rebrand procede.

### 3.2. Verificación `export-leads-csv` (FR-004)

**Criterio de decisión**: invocaciones + cron status.

**Comandos**:
```bash
# 1. Grep frontend
grep -rin "export-leads-csv" /Users/danissaklagges/Documents/DENTALSPOT/src/

# 2. Verificar cron en panel Supabase (o query pg_cron si aplica)
# (manual en dashboard)
```

**Outcomes**:
- `grep = 0 matches` + no cron activo → dead code → incluir en FR-001 delete list (total 11)
- `grep > 0` o cron activo → reclasificar a rebrand (solo filename pattern `fonokit_leads_meta_*` → `dentalspot_leads_meta_*`)

**Si rebrand procede** — strings a cambiar en `export-leads-csv/index.ts`:

| Línea aprox | Tipo | Valor actual | Valor post-rebrand |
|---|---|---|---|
| ~183 | Content-Disposition filename | `` `attachment; filename="fonokit_leads_meta_${date}.csv"` `` | `` `attachment; filename="dentalspot_leads_meta_${date}.csv"` `` |

**Total estimado**: 1 línea si rebrand procede.

---

## 4. Entidades DB relacionadas (read-only, no modificadas)

### `clinic_invitations` (asumido, confirmar en Phase A)

Leída/escrita por `clinic-invitations` edge function. **No modificada** por este spec. El rebrand solo cambia strings de email, no la tabla.

### `blog_posts` (asumido, para Phase A decision FR-005)

Tabla consultada en Phase A para decidir og-preview rebrand vs diferir. **No modificada**.

### Otras entidades relacionadas a delete candidates

- `welcome-sequence`, `form-auto-responder` — pueden tener lecturas de `leads` table. No importa porque los archivos se borran completos (no hay preservación de queries).
- `setup-ads*`, `meta-ads-manager` — interactúan con Meta API externamente, no leen DB. Borrar es atómico.
- `rag-query` — consulta posiblemente a `clinical_reference` o similar tabla de embeddings. Irrelevante porque se borra.

---

## 5. Signatures preservadas (FR-008 compliance)

Lista de signatures que NO deben cambiar en los rebrands:

### `clinic-invitations`

**Input** (body request):
```typescript
{
  email: string,           // email destinatario
  invitationToken: string, // JWT generado server-side
  clinicName: string,      // para display en email
  role: string             // rol asignado (dentist|assistant|...)
}
```

**Output** (response):
```typescript
{
  success: boolean,
  message?: string,        // OK message si success
  error?: string           // error message si !success
}
```

### `prepare-training-data`

**Input**:
```typescript
{
  dataset_type: string     // "dentallevel" | otros
}
```

**Output**:
```typescript
{
  success: boolean,
  filename: string,        // ← VALOR cambia (dentalspot_*), formato preservado
  size: number,
  download_url?: string
}
```

### `generate-ad-copy`

**Input**:
```typescript
{
  product?: string,        // default si ausente
  tone?: string,
  audience?: string,
  // ... otros params
}
```

**Output**: ad copy string en `data` field.

### `marketplace-ai-description`

**Input**:
```typescript
{
  product_name: string,
  product_details?: string
}
```

**Output**: descripción mejorada en `data` field.

---

## 6. State transitions (no hay)

Este spec no introduce state machines. Los flujos existentes (invitation creation, training data export, ad copy generation) mantienen sus transiciones.

---

## 7. Diferencias post-spec — verificación esperada

### Diff visual esperado en `git diff`

**Deletes (10 directorios)**:
```diff
# git status debería mostrar:
 D supabase/functions/process-scheduled-emails/deno.json
 D supabase/functions/process-scheduled-emails/index.ts
 D supabase/functions/welcome-sequence/deno.json
 D supabase/functions/welcome-sequence/index.ts
 ... (×10 archivos, asumiendo cada edge function es 1-2 archivos)
```

**Rebrands (9-10 líneas totales)**:
```diff
# clinic-invitations/index.ts
-    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://fonokit.cl";
+    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://dentalspot.cl";
-        from: "Fonokit <no-reply@fonokit.cl>",
+        from: "DentalSpot <no-reply@dentalspot.cl>",
-          <h1 style="color:white;margin:0;font-size:24px">FONOKIT</h1>
+          <h1 style="color:white;margin:0;font-size:24px">DENTALSPOT</h1>
-          <p style="color:#6b7280;font-size:15px">Has sido invitado a formar parte del equipo clinico en Fonokit.</p>
+          <p style="color:#6b7280;font-size:15px">Has sido invitado a formar parte del equipo clínico en DentalSpot.</p>

# prepare-training-data/index.ts
-    const fileName = `fonokit_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl`
+    const fileName = `dentalspot_${dataset_type}_${new Date().toISOString().slice(0, 10)}.jsonl`

# generate-ad-copy/index.ts
-      product = 'Fonokit — plataforma para fonoaudiologos',
+      product = 'DentalSpot — plataforma para dentistas',
-        'HTTP-Referer': 'https://fonokit.cl',
+        'HTTP-Referer': 'https://dentalspot.cl',
-        'X-Title': 'Fonokit Ad Copy Generator',
+        'X-Title': 'DentalSpot Ad Copy Generator',

# marketplace-ai-description/index.ts
-    const userPrompt = `Genera una descripción mejorada para este producto del marketplace de Fonokit:
+    const userPrompt = `Genera una descripción mejorada para este producto del marketplace de DentalSpot:
```

**Total expected diff**:
- Deletes: 10 directorios × 1-2 archivos cada uno = ~10-20 file deletions
- Rebrands: ~9-10 líneas netas cambiadas

---

## Next

- [quickstart.md](./quickstart.md) — guía ejecutable step-by-step con comandos copy-paste
- `/speckit-tasks` — task list ordered con dependencies
- `/speckit-implement` (luego de tasks.md) — ejecutar las 5 phases A → E
