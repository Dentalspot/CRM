# Implementation Plan: Cleanup + Rebrand Edge Functions Legacy FonoKit

**Branch**: `021-cleanup-fonokit-legacy` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/021-cleanup-fonokit-legacy/spec.md`

## Summary

Cleanup + rebrand híbrido de ~14 edge functions con branding FonoKit legacy en el repo DentalSpot. Scope dividido: **10 deletes** (dead code sin callsites), **3-4 rebrand** (usadas por `src/**`), **1-2 verificaciones Phase A** (og-preview + export-leads-csv).

**Approach**: Phase A verifica invocaciones externas (crons, webhooks, triggers DB) antes de delete para zero-risk. Phase B ejecuta deletes en repo + remote Supabase. Phase C rebrandea las 3-4 usadas siguiendo patrón spec 020. Phase D deploy + smoke test. Phase E commit único + merge.

**Estimate**: 4-5 h técnico post-plan. 0 migraciones SQL, 0 edits a `src/**`, zero impacto a F-014 fix (preservación de signatures FR-008).

---

## Technical Context

**Language/Version**: TypeScript (Deno runtime para Supabase edge functions)
**Primary Dependencies**: N/A para deletes. Para rebrandeos: `@supabase/supabase-js@2` (invitations), Resend API (emails), OpenRouter API (ad copy), Google/OpenAI embeddings (training data) — todas ya integradas, no se tocan.
**Storage**: N/A — el cleanup no toca DB. `clinic-invitations` lee/escribe invitations table (inmutable por este spec).
**Testing**: Post-deploy smoke tests manuales:
- `clinic-invitations`: enviar email test, verificar branding en inbox
- `prepare-training-data`: trigger desde admin panel, verificar filename JSONL
- `generate-ad-copy`: trigger desde MetaAdsPage, verificar default product en output
- Deletes: validación de ausencia (repo + `supabase functions list`)
**Target Platform**: Supabase Edge Functions (Deno hosted, proyecto `tomremkbuxvedliyywbo`)
**Project Type**: Backend cleanup + rebrand. Frontend (`src/**`) completamente fuera de scope.
**Performance Goals**: N/A — el cleanup reduce el total de functions deployadas (de ~38 a ~27-28). Rebrand preserva performance baseline.
**Constraints**:
- **Zero edits a `src/**`** (FR-011)
- **Signatures preservadas** (FR-008) — `clinic-invitations`, `prepare-training-data`, `generate-ad-copy` mantienen mismo body request + response format
- **Sincronía repo ↔ deployment remoto** (FR-002) — los deletes deben aplicarse tanto localmente (`rm -rf`) como remotamente (`supabase functions delete`)
- **Git history como safety net** (A-08) — ninguna borradura es catastrófica (recuperable via `git show`)
**Scale/Scope**: ~14 edge functions afectadas (10 delete + 3-4 rebrand + 1 verify). 0 líneas en `src/**` cambian. Estimado de 40-60 LOC netas cambiadas en rebrandeos (solo strings).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Justificación |
|---|---|---|---|
| **I. Compliance-First (Ley 20.584 / 21.719)** | No | ✅ PASS | Cleanup no toca PHI ni datos clínicos. Edge functions afectadas manejan: invitations (emails transaccionales, no PHI), training data export (metadata admin), ad copy (strings marketing). |
| **II. RLS-First Security** | No | ✅ PASS | No modifica policies RLS ni tablas. Edge functions rebrandeadas mantienen mismos accesos DB (vía service_role, patrón pre-existente). |
| **III. Append-Only Clinical Audit** | No | ✅ PASS | No toca `clinical_audit_log` ni `clinical_access_log`. Ninguna edge function afectada lee PHI. |
| **IV. Micro-Bloques** | **Sí (driver principal)** | ✅ PASS | Scope tight: cleanup + rebrand específico, sin mezcla features/fixes. Out of Scope explícita 9 items (meta-spec MP, pricing tier, UI rebrand, etc.). Commit único (FR-012). |
| **V. UI Honesty** | Parcial | ✅ PASS | Edge functions rebrandeadas mantienen error messages claros + 400/500 responses con JSON body descriptivo. Zero silent fails introducidos. |
| **VI. Schema Drift Zero** | No | ✅ PASS | 0 migraciones nuevas. 0 cambios a columnas. Solo strings en código. |

**Resultado inicial**: Todos los gates PASS. Sin `[CONSTITUTION-EXCEPTION]` requerido.

**Re-check post-Phase 1**: ejecutado al final de este plan — ver sección "Post-Phase 1 Constitution Re-check".

---

## Project Structure

### Documentation (this feature)

```text
specs/021-cleanup-fonokit-legacy/
├── plan.md              # Este archivo
├── spec.md              # /speckit-specify output (230 líneas)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (tabla de deletes + rebrands)
├── quickstart.md        # Phase 1 output (guía ejecutable)
├── contracts/           # Phase 1 output (vacío — no aplica)
├── checklists/
│   └── requirements.md  # 13/13 PASS
└── tasks.md             # /speckit-tasks output (si se genera)
```

### Source Code (repository root)

**Archivos a ELIMINAR** (10 directories + contenido):

```text
supabase/functions/
├── process-scheduled-emails/     # DELETE
├── welcome-sequence/             # DELETE
├── rag-query/                    # DELETE
├── form-auto-responder/          # DELETE
├── setup-ads/                    # DELETE
├── setup-ads-v3/                 # DELETE
├── setup-campaigns/              # DELETE
├── meta-ads-manager/             # DELETE
├── test-email/                   # DELETE
└── send-marketing-campaign/      # DELETE
```

**Archivos a REBRANDEAR** (3 confirmados + 1 defense-in-depth):

```text
supabase/functions/
├── clinic-invitations/index.ts          # REBRAND (used: ClinicInvitationsPanel + InviteAcceptPage)
├── prepare-training-data/index.ts       # REBRAND (used: fonoLevelApi)
├── generate-ad-copy/index.ts            # REBRAND (used: MetaAdsPage)
└── marketplace-ai-description/index.ts  # REBRAND defense-in-depth (marketplace OFF)
```

**Archivos a VERIFICAR en Phase A** (decisión dependiente de findings):

```text
supabase/functions/
├── og-preview/                  # VERIFY (invocado externamente por crawlers SEO)
└── export-leads-csv/            # VERIFY (puede tener cron admin externo)
```

**Archivos a NO tocar** (scope bound explícito):
- `src/**` (todo el frontend)
- `supabase/migrations/**`
- `supabase/policies.sql`
- `supabase/functions/_shared/`
- Cualquier otra edge function (las 3 MP del spec 020 ya cerradas)
- Variables de entorno Supabase (`FRONTEND_URL` si existe con override)

**Archivos a actualizar** (post-implement):
- `.specify/memory/architecture.md` — subsección §"Legacy FonoKit cleanup (spec 021)"
- `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` — update con Parte 7 final
- `CLAUDE.md` — Active feature pointer actualizado

---

## Phase 0: Research & Discovery

### Research tasks

Como es cleanup + rebrand sobre código ya identificado, no hay "unknowns" arquitectónicos grandes. Las tareas de research son:

1. **Verificación de invocaciones externas para los 10 deletes** (FR-003):
   - Panel Supabase → Cron Jobs (si existe): listar todos los schedules activos
   - Panel Supabase → Database → Triggers: buscar triggers que invoquen edge functions
   - Panel MercadoPago → Webhooks: confirmar que solo apuntan a `mercadopago-webhook` (único configurado)
   - Si algún delete candidato tiene invocación externa → reclasificar

2. **Verificación de `og-preview` (FR-005)**:
   - Contar posts publicados en blog (query SQL simple: `SELECT COUNT(*) FROM blog_posts WHERE published = true`)
   - Check analytics (si hay): tráfico real al blog en últimos 30 días
   - Decisión: rebrand ahora (si blog activo) vs diferir (si blog vacío o sin tráfico)

3. **Verificación de `export-leads-csv` (FR-004)**:
   - Grep en codebase frontend: `grep -rin "export-leads-csv" src/`
   - Verificar panel admin marketing: ¿hay botón que lo invoque?
   - Si 0 callsites y 0 crons → delete. Si hay algún callsite → reclasificar a rebrand.

4. **Inventario exhaustivo confirmatorio de strings "fonokit"** en las 3-4 edge functions a rebrandear (para no perder matches):
   - `grep -rin "fonokit" supabase/functions/clinic-invitations supabase/functions/prepare-training-data supabase/functions/generate-ad-copy supabase/functions/marketplace-ai-description`
   - Mapear cada match a patrón FR-006

5. **Pre-flight operacional**:
   - ✅ Supabase CLI instalado + autenticado (verified sesión 2026-04-22)
   - ✅ `dentalspot.cl` responde (verified sesión 2026-04-22)
   - ✅ Branch `021-cleanup-fonokit-legacy` checked out (verified por setup-plan.sh)

**Output**: `research.md` con findings consolidados + decisión sobre og-preview/export-leads-csv + inventory de strings a reemplazar en 3-4 archivos.

---

## Phase 1: Design & Contracts

### 1. Data model (`data-model.md`)

No hay entities nuevas. El archivo documenta:
- **Tabla de deletes** (10-11 archivos, cada uno con path + razón + comando de delete)
- **Tabla de rebrands** (3-4 archivos con mapping exhaustivo de strings: file:line_approx | valor actual | valor post-rebrand)
- **Sincronía repo ↔ Supabase remoto** — comando por cada archivo eliminado
- **Risk register de rebrand**: preservación de signatures (mismo body request, mismo response format)

### 2. Contracts (`contracts/`)

**No aplica**. Este spec no introduce APIs nuevas ni cambia schemas. Las 3-4 edge functions rebrandeadas mantienen:
- Mismo body request (signature preservada vía FR-008)
- Mismo response format JSON
- Mismos error codes 400/500

Los cambios son exclusivamente **cosméticos** (strings en emails, filenames, headers HTTP outbound, prompts AI). Directorio `contracts/` queda vacío intencionalmente.

### 3. Quickstart (`quickstart.md`)

Guía ejecutable copy-paste para `/speckit-implement` con comandos bash + verificaciones por phase + rollback procedures.

### 4. Agent context update

Actualizar CLAUDE.md `Active feature` con pointer al plan de spec 021.

---

## Phase 2: Implementation Strategy

### Fases de ejecución (para `/speckit-tasks`)

Dividido en 5 phases con stop points (SP):

#### **Phase A — Pre-flight verification** (~30 min)

Zero risk (solo lecturas):
- Listar crons Supabase + triggers DB para las 10 functions candidate delete
- Verificar `og-preview` (contar blog_posts published)
- Verificar `export-leads-csv` (grep + admin panel)
- Grep confirmatorio de strings "fonokit" en 4 archivos a rebrandear
- Pre-flight: branch correcto, working tree clean en `supabase/functions/`

T-checks A1-A5 → **SP-A**

#### **Phase B — Delete dead code** (~45 min)

Secuencial (un archivo a la vez para poder revertir si algo falla):

Para cada una de las 10 functions:
- `rm -rf supabase/functions/<name>/` (delete local)
- `supabase functions delete <name> --project-ref tomremkbuxvedliyywbo` (delete remoto)
- Confirmar con `ls supabase/functions/` post-delete

Post-delete global:
- `grep -rin "fonokit" supabase/functions/` → solo deberían quedar matches en los 3-4 que vamos a rebrandear + quizás og-preview/export-leads-csv si se defirieron
- `supabase functions list --project-ref tomremkbuxvedliyywbo` → confirmar que las 10 ya no aparecen

T-checks B1-B3 → **SP-B**

#### **Phase C — Rebrand used edge functions** (~1.5-2 h)

Secuencial por archivo:

1. **`clinic-invitations/index.ts`** (~30-40 min) — el más complejo por HTML templates
   - Edit: `from:`, `reply_to:`, `FRONTEND_URL` default, banner HTML, tagline footer
   - Diff review manual: preservar signature (body request format, response)

2. **`prepare-training-data/index.ts`** (~15 min) — 1 edit de filename
   - Edit: template literal filename

3. **`generate-ad-copy/index.ts`** (~20 min) — 3 edits (default product + 2 headers)
   - Edit: default `product`, `HTTP-Referer` header, `X-Title` header

4. **`marketplace-ai-description/index.ts`** (~15 min) — defense-in-depth
   - Edit: prompt user strings

Post-edit global:
- `grep -rin "fonokit" supabase/functions/<4 files>` = 0 matches
- Diff review: signatures intactas

T-checks C1-C4 → **SP-C**

#### **Phase D — Deploy + smoke test** (~1 h)

Deploy de las 4 edge functions rebrandeadas:
```bash
supabase functions deploy clinic-invitations prepare-training-data generate-ad-copy marketplace-ai-description \
  --project-ref tomremkbuxvedliyywbo
```

Smoke tests:

- **D1 (clinic-invitations)**: Desde `ClinicInvitationsPanel`, enviar invitation test a email propio → inspeccionar email recibido (remitente, banner, footer, link)
- **D2 (prepare-training-data)**: Desde panel admin fonolevel, trigger export → descargar archivo → verificar filename empieza con `dentalspot_`
- **D3 (generate-ad-copy)**: Desde MetaAdsPage, generar ad copy sin especificar producto → inspeccionar output default
- **D4 (marketplace-ai-description)**: Skip (marketplace OFF, defense-in-depth validado en diff review)

T-checks D1-D4 → **SP-D**

#### **Phase E — Close** (~30 min)

- Update `.specify/memory/architecture.md` con subsección §"Legacy FonoKit cleanup (spec 021)"
- Update `CLAUDE.md` Active feature pointer
- Update `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` con Parte 7 final
- Commit único con mensaje comprehensive
- Merge a main (sin push — Danissa hace push)

T-checks E1-E4 → **SP-E**

### Risk Register

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | Edge function en lista de delete tiene invocación externa no detectada (cron, trigger, webhook) | **Media** | Alto (email envío pendiente falla post-delete) | Phase A pre-flight verifica cron/triggers/webhooks. Si encuentra → reclasificar a rebrand o skip. |
| **R-02** | `rm -rf` local no tiene equivalente en remote (Supabase CLI no hace sync) | Alta (esperado) | Medio si no se hace | FR-002 explicita `supabase functions delete <name>` para cada uno. Checklist explícito. |
| **R-03** | Rebrand de `clinic-invitations` rompe template HTML (remitente o banner mal escapado) | Media | Alto (emails invitation fallan) | Phase C diff review manual + Phase D smoke test D1 (envío real de test email) |
| **R-04** | Signature change accidental en rebrand (ej. renombrar field del body request) | Baja | Alto (rompe callsite en `src/**`) | FR-008 explicit preservation. Diff review Phase C + smoke tests D1-D3 catches. |
| **R-05** | `og-preview` decisión Phase A diferida resulta en ambiguous state (SEO broken parcial) | Baja | Bajo | Criterio explícito (blog activo → rebrand ahora; sino → diferir completo con doc). |
| **R-06** | Delete remote Supabase falla (timeout, permisos) | Baja | Medio (local borrado pero remote vive) | Phase B secuencial con verificación post-delete + `supabase functions list` al final. Si falla → retry individual. |
| **R-07** | Git history safety net no funciona si algún archivo tiene binarios grandes excluidos por `.gitignore` | **Muy baja** | Bajo (los 10 archivos son text puro) | N/A — todos son `.ts` TypeScript, sin binarios. |

### Stop Points

| SP | Trigger | T-checks | Acción si fail |
|---|---|---|---|
| **SP-A** | Post pre-flight | A1-A5 listados arriba | Pausa + resolución individual. Si invocación externa → actualizar scope. |
| **SP-B** | Post 10 deletes | B1: `ls` muestra 10 carpetas menos · B2: `supabase functions list` coincide · B3: grep fonokit solo en los 4 a rebrandear + quizás og-preview | Rollback individual: `git checkout supabase/functions/<name>` + `supabase functions deploy <name>`. |
| **SP-C** | Post 4 rebrands | C1: grep fonokit 0 en 4 archivos · C2: signatures intactas (diff review) · C3: 0 edits a src/** · C4: 0 migraciones | ROLLBACK edits: `git checkout supabase/functions/<file>`. Re-review. |
| **SP-D** | Post deploy + smoke | D1-D3 tests manuales PASS · D4 skip OK | Urgent rollback si D1 rompe (invitations es P1). Investigar + fix antes de close. |
| **SP-E** | Post close | E1-E4 docs + commit + merge | Push delegado a Danissa. |

---

## Time Budget

| Phase | Tiempo estimado | Actividad |
|---|---|---|
| Phase A — Pre-flight | 30 min | Verificación crons/triggers/webhooks + decisiones og-preview/export-leads-csv |
| Phase B — Delete 10 dead code | 45 min | `rm -rf` + `supabase functions delete` × 10 + verificación |
| Phase C — Rebrand 3-4 used | 1.5-2 h | Edits clinic-invitations (complejo HTML) + prepare-training-data + generate-ad-copy + marketplace-ai-description |
| Phase D — Deploy + smoke | 1 h | Deploy + 3 smoke tests manuales (email, filename, ad copy) |
| Phase E — Close | 30 min | Docs update + commit único + merge |
| Buffer | 15-30 min | Si dispara algún riesgo (R-01 invocación externa, R-03 template HTML break) |
| **Total técnico** | **4-5 h** | Post `/speckit-plan` y `/speckit-tasks` |

---

## References

- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Quickstart: [quickstart.md](./quickstart.md)
- Spec 020 precedente (patrón rebrand): `specs/020-migrate-mp-brand/`
- Spec 019 audit origen: `specs/019-audit-mercadopago-flow/`
- Session log diagnóstico: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- Constitution: `.specify/memory/constitution.md`

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | **Sin violaciones**. Cleanup + rebrand con scope tight (Constitution §IV). Patrón canónico de "Micro-Bloque híbrido" — 2 operaciones relacionadas (delete + rebrand) con scope overlapping claro, sin mezcla con features nuevas. |

---

## Post-Phase 1 Constitution Re-check

Ejecutado al final de Phase 1 design:

- §I Compliance-First: ✅ sin cambios (edge functions afectadas no manejan PHI)
- §II RLS-First: ✅ sin cambios
- §III Audit Append-Only: ✅ sin cambios
- §IV Micro-Bloques: ✅ **reafirmado** — scope tight preservado, zero scope creep detectado en research. og-preview y export-leads-csv van a Phase A decision, no a scope expansion.
- §V UI Honesty: ✅ error messages preservados (FR-008 signature preservation)
- §VI Schema Drift Zero: ✅ 0 migraciones

**Resultado**: PASS. Plan listo para `/speckit-tasks`.

---

## Next Step

**`/speckit-tasks`** — generar task list ordenada con dependencies, mapeada a phases A/B/C/D/E del plan + stop points. Estimación: 15-20 min para generar, 5 min review.

**Hook optional antes de `/speckit-tasks`**: `speckit.git.commit` (recomendado SÍ — commit de spec + plan + research + data-model + quickstart + requirements para snapshot histórico).
