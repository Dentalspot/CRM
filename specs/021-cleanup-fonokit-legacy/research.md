# Research — Spec 021 Cleanup FonoKit Legacy

**Phase**: 0 (Outline & Research)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

---

## 1. Inventory de edge functions con branding FonoKit

### Research pre-spec (grep exhaustivo, ya ejecutado)

Grep case-insensitive de "fonokit" en `supabase/functions/` post-spec 020 reveló ~25 matches distribuidos en 15 archivos. Cruzado con grep de `supabase.functions.invoke('<name>')` en `src/**` para identificar quién invoca qué.

### Categorización final (post-research)

#### Categoría 1: DELETE (10 functions, 0 callsites en `src/**`)

| # | Function | Contenido con FonoKit | Razón para delete |
|---|---|---|---|
| 1 | `process-scheduled-emails` | `from: "Fonokit <no-reply@fonokit.cl>"` + `unsubscribeUrl: https://fonokit.cl/api/unsubscribe` | Scheduler email sin callsite frontend; probable cron legacy FonoKit. **Phase A verifica cron activo**. |
| 2 | `welcome-sequence` | `from: "Fonokit <no-reply@fonokit.cl>"` + unsubscribe URL | Onboarding email FonoKit. Sin callsite DentalSpot. |
| 3 | `rag-query` | Prompt: `"Eres un asistente clínico especializado en fonoaudiología"` | Chatbot FonoKit. DentalSpot usa `chat-evidence` + `chat-with-ai` en su lugar. |
| 4 | `form-auto-responder` | HTML email templates con "Fonokit", "fonoaudiólogos" + `FRONTEND_URL` default `https://fonokit.cl` + secret hardcoded `'fonokit-afi-2026'` | Auto-reply forms FonoKit. Sin callsite. |
| 5 | `setup-ads` | Meta Ads campañas para fonoaudiólogas CORFO | One-time setup FonoKit. DentalSpot no corre ads Meta (A-05). |
| 6 | `setup-ads-v3` | `"Fonokit v3 growth strategy"` + ~25 variants de copy dirigido a fonoaudiólogas | v3 iteration FonoKit. |
| 7 | `setup-campaigns` | 3 campañas Meta FonoKit (TOFU awareness, BOFU conversion, etc.) | Setup one-time FonoKit. |
| 8 | `meta-ads-manager` | Descripciones `"Leads Fonokit"` + `"Retargeting Fonokit"` | Manager FonoKit. DentalSpot usa `new-meta-capi` + `generate-ad-copy`. |
| 9 | `test-email` | `subject: 'Test campaña Fonokit'` + `from: "Fonokit <no-reply@fonokit.cl>"` | Debug one-shot. Sin callsite ni cron. |
| 10 | `send-marketing-campaign` | Email outbound FonoKit con unsubscribe + from Fonokit | Sin callsite DentalSpot. |

**Total delete candidates**: 10 functions confirmadas.

#### Categoría 2: REBRAND (3 functions invocadas + 1 defense-in-depth)

| # | Function | Callsite | Strings a cambiar |
|---|---|---|---|
| 1 | `clinic-invitations` | `src/components/clinic/ClinicInvitationsPanel.jsx:21,50` + `src/pages/InviteAcceptPage.jsx:26,53` | `from:`, `FRONTEND_URL` default, banner HTML `"FONOKIT"`, tagline footer |
| 2 | `prepare-training-data` | `src/features/admin/modules/fonolevel/api/fonoLevelApi.js:73` | filename template `fonokit_${dataset_type}_${date}.jsonl` |
| 3 | `generate-ad-copy` | `src/features/admin/modules/marketing/pages/MetaAdsPage.jsx:850` | default `product`, `HTTP-Referer` header, `X-Title` header |
| 4 | `marketplace-ai-description` | `src/features/marketplace/components/AiDescriptionButton.jsx:23` (marketplace OFF) | prompt user strings (defense-in-depth) |

**Total rebrand**: 4 functions.

#### Categoría 3: VERIFY en Phase A (decisión dependiente)

| Function | Contenido FonoKit | Decisión criterio |
|---|---|---|
| `og-preview` | `meta_title: 'FONOKIT Blog'`, description "FONOKIT", og:site_name, image default | **FR-005**: si blog activo con posts publicados → rebrand ahora; si no → diferir. Verificar en Phase A. |
| `export-leads-csv` | filename `fonokit_leads_meta_<date>.csv` | **FR-004**: grep frontend + verificar cron admin. Si dead code → incluir en delete (total 11). Si usado → reclasificar a rebrand (total 5). |

---

## 2. Decisiones de diseño

### D-01: Delete sincronizado repo + remote Supabase

**Decisión**: Ejecutar BOTH `rm -rf supabase/functions/<name>/` AND `supabase functions delete <name>` para cada dead code.

**Rationale**:
- Supabase CLI NO sincroniza deletes automáticamente (verified empíricamente). Deploy solo sube, no elimina.
- Si solo borramos del repo pero dejamos deploy remoto → archivos zombies que siguen ejecutando si algo los invoca.
- Si solo borramos del remote pero dejamos repo → próximo `supabase functions deploy` puede re-deployar inadvertidamente.

**Mitigación del riesgo**: secuencial (un archivo a la vez) con verificación post cada delete + `supabase functions list` al final para confirmar.

**Alternativa considerada**: Solo borrar local y que Danissa borre en panel Supabase manualmente. Rechazada por higiene operacional + risk de olvido.

### D-02: Rebrand preserva signatures (FR-008)

**Decisión**: Ninguna edge function rebrandeada cambia body request format, response format, ni error codes.

**Rationale**:
- `src/**` tiene callsites con `body: { ... }` + expected response structure. Cambiar signature rompería el frontend inmediatamente.
- El objetivo del rebrand es cosmético (strings visibles), no refactor funcional.
- Scope tight §IV Micro-Bloques.

**Validación**: diff review manual post-edit + smoke tests Phase D.

### D-03: `clinic-invitations` FRONTEND_URL default

**Decisión**: Cambiar fallback default `FRONTEND_URL = 'https://fonokit.cl'` → `'https://dentalspot.cl'` en el código. **NO tocar env var Supabase secrets** (fuera de scope per Out of Scope section).

**Rationale**:
- Si el env var `FRONTEND_URL` está configurado en Supabase secrets, domina sobre el fallback (`??=` operator). El fallback solo se usa si secret ausente.
- Phase A NO verifica el secret value (solo presencia). Si Danissa tiene `FRONTEND_URL=https://fonokit.cl` como secret, requeriría spec separado de secret update.
- Pragmatic: si fallback nunca se usa porque secret existe, el cambio es defense-in-depth. Si secret ausente (sin configurar), fallback activo recibe el rebrand correcto.

**Riesgo residual**: si secret está con valor `fonokit.cl` explícito, emails siguen apuntando allí post-rebrand. Mitigación: Phase D smoke test D1 (envío email real) detecta inmediatamente.

### D-04: `marketplace-ai-description` defense-in-depth rebrand

**Decisión**: Rebrandear aunque marketplace está OFF.

**Rationale**:
- Marketplace está deshabilitado via `FEATURE_FLAGS.MARKETPLACE: false` desde spec 020, pero el código sigue invocable por URL directa si alguien conoce el endpoint.
- Rebrand cosmético es cheap (15 min) y evita un "item residual" cuando eventualmente marketplace se reactive.
- Consistencia con decisión D-04 del spec 020 (ambas MP edge functions rebrandeadas aunque marketplace estaba OFF).

### D-05: og-preview — criterio explícito para Phase A

**Decisión en Phase A basada en**:
- Query simple: `SELECT COUNT(*) FROM blog_posts WHERE published = true` (asumiendo tabla `blog_posts`, confirmar en Phase A)
- Si `count = 0` → diferir (blog no está en producción, no hay tráfico real a og-preview)
- Si `count > 0` → rebrandear ahora (meta_title/og:site_name visibles en shares sociales)

**Rationale**: og-preview es invocado por crawlers externos (Meta, Twitter, Google), no desde `src/`. El grep cruzado no lo detecta pero sí tiene tráfico real si blog activo.

### D-06: export-leads-csv — criterio explícito para Phase A

**Decisión en Phase A basada en**:
- Grep: `grep -rin "export-leads-csv" src/` — si retorna 0 matches y panel admin marketing no lo invoca → dead code → delete.
- Verificar panel Supabase Cron Jobs (si existe): si hay cron que lo invoca semanalmente para reporting → reclasificar a rebrand.

**Default esperado**: dead code (delete). Confirmación Phase A.

---

## 3. Pre-flight operacional

### ✅ Confirmado previamente (no re-verificar)

- Supabase CLI v2.90.0 instalado + autenticado (sesión 2026-04-22)
- Proyecto linked: `tomremkbuxvedliyywbo` (única cuenta Supabase de Danissa)
- Dominio `dentalspot.cl` responde HTTP 200 en paths post-checkout (spec 020 Phase A)
- `fonokit.cl` es dominio de otra app (FonoKit real en otro proyecto Supabase — verified 2026-04-22)
- Git history funcional como safety net (commits previos intactos: `3593b12` F-014, `ce4b619` spec 020 close)

### Phase A pre-flight (a ejecutar)

| # | Check | Comando / método |
|---|---|---|
| A1 | Verificar cron jobs Supabase activos para las 10 delete candidates | Panel Supabase → Database → Cron Jobs. Si no hay panel, query `SELECT jobname, schedule, command FROM cron.job` (requiere extension pg_cron). |
| A2 | Verificar triggers DB que invoquen edge functions | Query `SELECT event_object_table, trigger_name, action_statement FROM information_schema.triggers WHERE action_statement LIKE '%net.http_post%'` |
| A3 | Verificar webhooks externos configurados (MP, Resend, Meta) | Revisar panels de integraciones que puedan tener URLs hardcoded a `.../functions/v1/<name>` |
| A4 | Decisión og-preview (FR-005) | `SELECT COUNT(*) FROM blog_posts WHERE published = true` (confirmar nombre tabla) |
| A5 | Decisión export-leads-csv (FR-004) | `grep -rin "export-leads-csv" src/` + verificar admin marketing panel |

**Output esperado Phase A**:
- Lista confirmada de 10 deletes (o N si algún reclassify por invocación externa)
- Decisión sobre og-preview (rebrand ahora vs diferir)
- Decisión sobre export-leads-csv (delete vs rebrand vs skip)

---

## 4. NEEDS CLARIFICATION resolution

**Resultado**: 0 `[NEEDS CLARIFICATION]` markers en spec o plan. Decisiones ambiguas están explícitamente diferidas a Phase A con criterios verificables (D-05, D-06).

---

## 5. Riesgos + mitigaciones prevés

Ver [plan.md §Risk Register](./plan.md#risk-register) para los 7 riesgos identificados con probabilidad + impacto + mitigación. Highlights:

- **R-01 (invocación externa no detectada)**: mitigado por Phase A verifications A1-A3
- **R-03 (clinic-invitations template HTML rompe)**: mitigado por diff review + smoke test D1
- **R-04 (signature change accidental)**: mitigado por FR-008 + smoke tests D1-D3

---

## 6. Timing & complejidad

### Comparación con spec 020 (precedente)

| Aspecto | Spec 020 | Spec 021 (este) |
|---|---|---|
| Operaciones | 1 tipo (rebrand) | 2 tipos (delete + rebrand híbrido) |
| Archivos afectados | 3 edge functions | ~14 (10 delete + 4 rebrand) |
| Edits LOC | 14 string replacements | 10 deletes atómicos + ~40-60 LOC en rebrands |
| Dependencias externas | MP account + secret swap | 0 nuevas (reusar MP ya configurado del spec 020) |
| Risk F-014 regression | 🔴 Alto | 🟢 Bajo (no toca MP edge functions) |
| Risk breaking change | 🟡 Medio (deploy sincronizado) | 🟡 Medio (signature preservation crítica) |
| Estimate | 65-75 min | 4-5 h (más volumen pero scope más simple) |

### Por qué 4-5h (no más)

- Deletes son atómicos (rm + delete CLI, ~3-5 min por archivo × 10 = 30-50 min)
- Rebrands siguen patrón conocido spec 020 (string replacement con preservación de signatures)
- Smoke test D1 (clinic-invitations email) es lo más "humano" — depende de email recibido OK
- Phase A + E son ~30 min cada una, relativamente estándar

---

## Next

Plan proceeds to Phase 1 outputs:
- [data-model.md](./data-model.md) — tabla exhaustiva de deletes + rebrands mapping
- [quickstart.md](./quickstart.md) — guía ejecutable step-by-step
- `contracts/` — vacío intencionalmente (signatures preservadas, sin APIs nuevas)

Post-Phase 1 → `/speckit-tasks` para task list dependency-ordered.
