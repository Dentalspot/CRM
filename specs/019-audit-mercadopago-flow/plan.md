# Implementation Plan: Audit MercadoPago Subscription Flow

**Branch**: `019-audit-mercadopago-flow` | **Date**: 2026-04-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/019-audit-mercadopago-flow/spec.md`

## Summary

Discovery pure revenue-critical: auditar flow MercadoPago end-to-end (único componente prod monetario sin audit post-15 specs cerrados). **0 código editado, 0 migration**. Phase 1 (30 min) inventario exhaustivo vía greps locales + 3 queries empíricas sobre `subscriptions`. Phase 2 (30 min) evalúa ≥5 puntos críticos del flow + categoriza findings por severidad (BLOCKER/LATENT/EDGE/ENHANCEMENT) con revenue impact estimate. Phase 3 (20 min) veredicto + (condicional) template follow-up specs + (condicional) meta-spec sugerencia si ≥3 BLOCKERs. Total **90 min** bound. Constitution §I (compliance PII), §IV driver (audit ≠ fix), §V (silent fails UI).

## Technical Context

**Language/Version**: N/A (discovery pure — análisis código existente + SQL queries).
**Primary Dependencies**: Grep tool (local code analysis), Supabase SQL Editor (Danissa queries empíricas). MercadoPago API no invocado (análisis estático + DB state, no integration testing).
**Storage**: N/A — no se crean/modifican tablas. Solo lecturas sobre `subscriptions` + (si existe) `billing_invoices`.
**Testing**: empírico via queries SQL. MCP execute_sql denegado — queries copy-paste a Danissa.
**Target Platform**: dev machine (grep + análisis) + Supabase SQL Editor (Danissa).
**Project Type**: audit documental puro, más amplio que specs 017/018 por multi-surface (backend + frontend + DB + external API integration).
**Performance Goals**: Phase 1 + 2 + 3 ≤90 min. Bound superior 120 min antes de STOP.
**Constraints**:
- **FR-008**: 0 edits a `src/**`, `supabase/functions/**`, `supabase/migrations/**`.
- **FR-007**: meta-spec solo sugerido, NO escrito.
- Deploy via Danissa SQL Editor (MCP denegado).
**Scale/Scope**: ~5-15 edge functions + ~10-30 frontend callsites + ~5-10 queries empíricas + findings matriz con severidad + (condicional) templates follow-up.

## Constitution Check

*GATE: Must pass before Phase 0. Re-check post-Phase 2.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Sí (potencial) | ✅ PASS | `subscriptions` + `billing_invoices` contienen PII (emails, data pago). Si Phase 2 revela exposure no-autorizado, es violación §I + §II. Audit detecta. |
| **II. RLS-First Security** | Sí (cross-check) | ✅ PASS | `subscriptions` debería tener policies RLS (spec 014 aplicó `billing_invoices`). Si `subscriptions` NO tiene policies, finding BLOCKER inmediato. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit logger clínico (financial audit trail es scope distinto). |
| **IV. Micro-Bloques** | Sí (driver secundario) | ✅ PASS | Discovery pure. Cada fix = spec separado. Meta-spec solo sugerido — no escrito — respetando "un spec por vez". |
| **V. UI Honesty** | Sí (driver si silent fails) | ✅ PASS | Si pago falla y UI no notifica user → violación §V. Audit clasifica como BLOCKER/LATENT según gravity. |
| **VI. Schema Drift Zero** | Indirecto | ✅ PASS | Phase 1 valida schema `subscriptions` real vs asumido. Si drift, documentar. |

**Resultado**: sin violaciones. Audit es mecanismo Constitution-compliant para detectar violaciones §II/§V latentes en superficie monetaria.

## Project Structure

### Documentation (this feature)

```text
specs/019-audit-mercadopago-flow/
├── spec.md                          # /speckit-specify (commit 802c17d)
├── plan.md                          # este archivo
├── data-model.md                    # Phase 1 inventory + Phase 2 findings + Phase 3 verdict
├── checklists/
│   └── requirements.md              # 12/12 PASS
└── tasks.md                         # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**0 archivos autorizados a editar**. Discovery pure (patrón specs 017/018).

**Archivos tocados por este spec**:
- `specs/019-audit-mercadopago-flow/**` (spec/plan/tasks/data-model/checklists)
- `.specify/memory/architecture.md` (post-close — subsección `§"MercadoPago subscription flow audit (2026-04-21, spec 019)"`)

**Archivos NO autorizados** (FR-008):
- Cualquier archivo bajo `src/**`.
- Cualquier archivo bajo `supabase/functions/**` (edge functions tocadas).
- Cualquier `.sql` en `supabase/migrations/`.
- Meta-spec file (si ≥3 BLOCKERs, solo sugerencia en data-model, NO crear spec dir).

**Structure Decision**: audit documental multi-surface. `data-model.md` crece más que specs 017/018 por inventario + findings + templates follow-up. TASK-FINAL-VALIDATE enforcement discovery pure vía `git diff --name-only`.

---

## Phase 0 — Risk Register

### R-01. Webhook signature validation ausente → BLOCKER probable

**Síntoma potencial**: Phase 1 grep de edge function MercadoPago revela que el handler **no valida header `x-signature`** (o equivalente MercadoPago) antes de procesar el payload. Cualquier atacante que conozca el endpoint puede forjar eventos y crear subscriptions, confirmar pagos falsos, cancelar subscriptions de otros.

**Impacto**: **BLOCKER P0**. Security hole que permite revenue manipulation directo. Muy probable que sea el finding principal del audit.

**Mitigación**: Phase 1 grep específico busca patrones `x-signature`, `xSignature`, `HMAC`, `crypto.verify`, `MP_WEBHOOK_SECRET`. Si ausente, documentar con reproduction steps + template fix spec `fix-mercadopago-webhook-signature` P0.

**Probabilidad**: **media-alta**. Startups típicamente implementan signature validation post-MVP. DentalSpot no tuvo audit explícito.

### R-02. Idempotencia webhook no manejada → LATENT crítico

**Síntoma potencial**: handler procesa event sin check de duplicate (no lookup de `mp_payment_id` o equivalent antes de UPDATE/INSERT). MercadoPago reintenta webhooks N veces (default 3 en 3 días si 5xx response), así que duplicates son esperables.

**Impacto**: duplicate `subscriptions` inserts, double-counting `billing_invoices`, revenue stats infladas, user cobrado 2x si el handler triggera payment retry. **LATENT P1** — no disparado aún activamente pero dispara en primer webhook retry real.

**Mitigación**: Phase 1 grep `unique constraint` en schema + análisis del handler para idempotency key. Phase 2 Query θ (opcional): `SELECT mp_payment_id, COUNT(*) FROM billing_invoices GROUP BY mp_payment_id HAVING COUNT(*) > 1` detecta duplicates retrospective.

**Probabilidad**: **media**. Patrón común anti-pattern en primeras implementaciones.

### R-03. Logs webhook inaccesibles vía MCP (discovery bound)

**Síntoma**: Phase 2 quiere verificar empíricamente si handler está procesando webhooks correctamente observando logs. Supabase Edge Function logs están en Supabase dashboard. MCP execute_sql denegado + logs dashboard no accesibles vía ejecutor → análisis bound a código estático + queries a `subscriptions` state.

**Impacto**: algunos findings no validables empíricamente. Ejemplo: "webhook llegó pero no escribió a DB" requiere logs para confirmar. Audit degrada a "análisis estático + DB empirical" sin logs.

**Mitigación**: Phase 2 documenta explícitamente qué findings son "code-level only" vs "DB-empirical". Queries sobre `subscriptions` (ej. distribution de `updated_at` vs `created_at` diff) proxy indirecto de "webhook está actualizando". Si Danissa accede a logs por separado, puede enriquecer findings post-close. NO blocker — limita depth pero no corta discovery.

**Probabilidad**: **alta**. Constraint operacional conocido.

### R-04. `subscriptions` sin RLS policies → BLOCKER compliance

**Síntoma**: Phase 1 `information_schema` query revela `subscriptions.rowsecurity = false` o policies count = 0. Cualquier user autenticado puede leer data de subscriptions de otros users (PII leak).

**Impacto**: **BLOCKER P0**. Violación §II + §I (Ley 21.719 data minimization). Similar al hallazgo spec 012 (tabla `billing_invoices` tenía 0 policies pre-spec 014).

**Mitigación**: Phase 1 Query β sobre `pg_tables` + `pg_policies` para `subscriptions`. Si 0 policies, template fix spec inmediato `apply-policies-subscriptions` siguiendo patrón spec 014.

**Probabilidad**: **baja-media**. Spec 012 audit cubrió 22 tablas RLS, pero `subscriptions` no está listada explícitamente en architecture.md §RLS coverage audit — gap posible.

### R-05 (menor). Plan upgrade/downgrade no implementado → ENHANCEMENT

**Síntoma**: no hay flow en frontend para cambiar plan (solo subscribe/unsubscribe). Users quieren upgradear pero tienen que cancelar + re-subscribir manualmente.

**Impacto**: UX friction, potencial churn. NO revenue leak directo — **ENHANCEMENT**, no BLOCKER. Follow-up bajo priority.

**Mitigación**: Phase 1 grep frontend por "upgrade", "change plan", "cambio plan". Si ausente, documentar como ENHANCEMENT.

**Probabilidad**: alta. Feature avanzada típicamente post-MVP.

### R-06 (menor). Revenue estimate incompleto sin logs

**Síntoma**: FR-012 pide revenue impact estimate. Sin logs de webhook/payment, los números se basan en code analysis + DB current state, no en event history real.

**Mitigación**: documentar estimates con "calibrated honesty" — rangos con rationale, no números puntuales falsos. Ej. "BLOCKER R-01: **potencialmente** afecta a N users activos × $X → $Y rango, probabilidad explotación baja hoy (endpoint no-público conocido) pero sube al primer discovery".

**Probabilidad**: alta. Contraint operacional.

---

## Phase 1 — Inventario (~30 min, STOP POINT SP-1)

**Objetivo**: inventario exhaustivo de componentes MercadoPago + schema `subscriptions` + row state actual. Cero SQL de escritura.

### P1.1 — Grep edge functions MercadoPago (ejecutor local)

```bash
grep -rn "mercadopago\|MercadoPago\|MP_\|webhook" supabase/functions/
grep -rn "x-signature\|xSignature\|HMAC" supabase/functions/
grep -rln "subscriptions" supabase/functions/
```

**Para cada edge function encontrada**, leer completa (Read tool) y documentar en `data-model.md §Inventory > Edge functions`:
- Path + propósito.
- Eventos MercadoPago suscritos (ej. `payment.created`, `subscription.updated`).
- ¿Valida signature? (sí/no + location en código).
- ¿Maneja idempotencia? (sí/no + mecanismo).
- ¿Log events? (sí/no).
- Error handling (qué pasa si DB update falla).

### P1.2 — Grep frontend consumers `subscriptions`

```bash
grep -rn "\.from('subscriptions')" src/ --include="*.js" --include="*.jsx"
grep -rn "subscriptionApi\|useSubscription\|BillingHistory\|useInvoices" src/ --include="*.js" --include="*.jsx"
grep -rn "mercadopago\|mp_" src/ --include="*.js" --include="*.jsx"
```

**Para cada callsite**, clasificar en matriz `data-model.md §Inventory > Frontend`:
- `file:line`
- tabla consultada
- tipo (read / write / both)
- propósito (display billing / init checkout / poll status)

### P1.3 — Query α: schema `subscriptions` (Danissa SQL Editor)

```sql
-- Spec 019 Phase 1 Query α — schema validation
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Query β: RLS state
SELECT tablename, rowsecurity,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public' AND tablename = 'subscriptions';

-- Query γ: distribución status actual
SELECT status, COUNT(*) AS n
FROM subscriptions GROUP BY status ORDER BY n DESC;

-- Query δ: edades de last_payment_at
SELECT
  CASE
    WHEN last_payment_at IS NULL THEN 'never'
    WHEN last_payment_at > NOW() - INTERVAL '30 days' THEN 'recent (<30d)'
    WHEN last_payment_at > NOW() - INTERVAL '60 days' THEN 'warning (30-60d)'
    ELSE 'stale (>60d)'
  END AS age_bucket,
  status,
  COUNT(*) AS n
FROM subscriptions
GROUP BY age_bucket, status
ORDER BY n DESC;

-- Query ε: subscriptions "zombi" (status='active' pero last_payment_at viejo)
SELECT id, user_id, plan_id, status, last_payment_at, current_period_end
FROM subscriptions
WHERE status = 'active'
  AND (last_payment_at IS NULL OR last_payment_at < NOW() - INTERVAL '35 days')
LIMIT 20;
```

**Danissa pega outputs. Ejecutor documenta en `data-model.md §Inventory > Schema + state`.**

### P1.4 — Query opcional: `billing_invoices` relación (Danissa)

Si Phase 1 callsites sugieren que `billing_invoices` está relacionado con `subscriptions`:

```sql
-- Query ζ: duplicates potenciales (idempotency check retrospective)
SELECT mp_payment_id, COUNT(*) AS dup_count
FROM billing_invoices
WHERE mp_payment_id IS NOT NULL
GROUP BY mp_payment_id
HAVING COUNT(*) > 1
LIMIT 20;
```

Output informa R-02 idempotency check.

### P1.5 — Output `data-model.md §Inventory`

Secciones:
- `§Edge functions` — matriz por edge function: propósito, eventos, security checks, idempotency, logging.
- `§Frontend callsites` — matriz callsites consumers.
- `§Schema + state` — Query α (columnas) + β (RLS) + γ (status dist) + δ (ages) + ε (zombi).
- `§Events subscribed` — listado MercadoPago events que el sistema maneja.

### P1.6 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Edge functions inventariadas | ≥1 edge function MercadoPago identificada (o confirmado 0 = finding BLOCKER) | Si 0 y debería haber ≥1 → STOP, investigar env vars |
| **T2** | Frontend callsites inventariados | Lista completa de consumers `subscriptions` | Si vacío y hay $80k evidencia → grep ampliado |
| **T3** | Schema `subscriptions` documentado | Query α output con columnas | — |
| **T4** | Row state capturado | Query γ+δ+ε outputs documentados | — |
| **T5** | RLS state documentado | Query β output (policies count + rowsecurity) | Si 0 policies → R-04 BLOCKER inmediato |

**Reporte a Danissa** (bloquea Phase 2):

```markdown
## Phase 1 Report — spec 019

- Edge functions MercadoPago: [N identificadas / 0 = finding]
- Eventos suscritos: [lista o "unclear"]
- Frontend callsites: [N consumers + tipos]
- subscriptions schema: [N columnas + columnas clave]
- subscriptions RLS: [rowsecurity=T/F, policy_count=N]
- Status distribution: [active=N / cancelled=N / pending=N / etc.]
- Last_payment ages: [recent=N / warning=N / stale=N]
- Zombie candidates: [N potenciales]
- Checks: T1-T5

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Flow Analysis End-to-End (~30 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO.

### P2.1 — Mapear flow completo

Basado en inventario Phase 1, reconstruir secuencia en `data-model.md §Flow diagram`:

```
1. User click "Subscribe" → Frontend llama MP checkout URL generator
2. MP checkout page → usuario ingresa datos
3. MP procesa → fires webhook event (payment.created o subscription.created)
4. Edge function recibe POST + signature header
5. Edge function valida signature (¿?)
6. Edge function extrae event data, idempotency key (¿?)
7. Edge function UPDATE/INSERT subscriptions + billing_invoices
8. Edge function responde 200 a MP (o 5xx → MP reintenta)
9. Frontend poll o subscribe realtime → UI refresh
```

Por cada paso, documentar: ¿evidencia código existe? ¿gap identificado?

### P2.2 — Evaluar 5 puntos críticos

Para cada uno, clasificar como OK / finding + severidad:

1. **Webhook security**: ¿valida `x-signature`? R-01. Si ausente → BLOCKER.
2. **Idempotencia**: ¿check duplicate events? R-02. Si ausente → LATENT (o BLOCKER si Query ζ revela duplicates reales).
3. **Error handling**: ¿edge function captura errors DB + retorna 5xx (para que MP reintente) vs 200 (pretender success)? Si "pretender success" → BLOCKER silent data loss.
4. **Retry logic**: ¿edge function es idempotent enough para soportar MP retry default (3 reintentos en 3 días)?
5. **Logging / audit trail**: ¿edge function logea cada webhook con event_id + timestamp + outcome? Si NO → imposible diagnosticar post-hoc.

### P2.3 — Evaluar gaps funcionales

Para cada gap, clasificar ENHANCEMENT (no-revenue leak) o LATENT (revenue pending):

- **Plan upgrade/downgrade**: R-05. Usually ENHANCEMENT.
- **Cancellation flow**: si user cancela, ¿edge function recibe subscription.cancelled y actualiza status? Si NO → LATENT (user cree cancelled pero sigue cobrándose).
- **Failed payment handling / dunning**: ¿hay notification al user + grace period + auto-suspend? Si NO → LATENT (user pierde acceso sin explicación).
- **Refund handling**: ¿edge function procesa `payment.refunded` y ajusta `billing_invoices`? Si NO → ENHANCEMENT (refunds manuales OK inicialmente) o LATENT (compliance eventual).

### P2.4 — Clasificar findings con severidad

Por cada finding encontrado en P2.2 + P2.3, documentar en `data-model.md §Findings`:

| finding_id | descripción | severidad | revenue impact | users afectados | probabilidad | evidencia (file:line o query) |
|---|---|---|---|---|---|---|
| F-001 | [descripción] | BLOCKER/LATENT/EDGE/ENHANCEMENT | [$X range] | [N est.] | baja/media/alta | [pointer] |
| ... | ... | ... | ... | ... | ... | ... |

### P2.5 — Revenue impact estimate agregado

Suma simple para comunicar escala:

```
Total revenue at risk estimate:
- BLOCKERs: [$X - $Y rango]
- LATENTs: [$X - $Y rango]
- Total: [$X - $Y rango]

Calibrated honesty note: estimates based on code analysis + DB state;
sin logs de webhook reales, probabilidades son inferred.
```

### P2.6 — **STOP POINT SP-2**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T6** | 5 puntos críticos evaluados | Cada uno con verdict OK/finding+severidad | Si <5 → completar |
| **T7** | Gaps funcionales evaluados | Plan upgrade + cancellation + failed payment + refund clasificados | — |
| **T8** | Findings matriz completa | Cada finding con 6 columnas (FR-005 determinístico) | Si "unclear" → re-evaluar criterio severidad |
| **T9** | Revenue estimate agregado | Total range con rationale | — |

**Reporte a Danissa** (bloquea Phase 3):

```markdown
## Phase 2 Report — spec 019

- Flow diagram: [pasos mapeados + gaps]
- 5 puntos críticos: [N OK / N findings]
- Gaps funcionales: [lista con severidad]
- Findings totales: [N BLOCKER / N LATENT / N EDGE / N ENHANCEMENT]
- Revenue at risk: [$X - $Y estimate]
- Checks: T6-T9

🟢 GO / 🔴 STOP
```

---

## Phase 3 — Verdict + Follow-up Scope (~20 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO.

### P3.1 — Veredicto agregado

Basado en Phase 2 findings, asignar veredicto binario-multinivel:

- **AUDIT PASSED** (0 BLOCKER, 0 LATENT): close. Doc como "MercadoPago flow sano".
- **MINOR GAPS** (0 BLOCKER, ≥1 LATENT, ≥0 EDGE/ENHANCEMENT): close + follow-up P1.
- **CRITICAL FINDINGS** (≥1 BLOCKER, <3 BLOCKER): follow-up specs individuales P0.
- **SYSTEMIC ISSUES** (≥3 BLOCKERs): **meta-spec sugerido** `fix-mercadopago-critical-bugs` + rationale agrupación.

Documentar en `data-model.md §Verdict` con rationale 2-3 sentences.

### P3.2 — Si BLOCKER/LATENT: preparar follow-up spec templates

Para cada BLOCKER, template en `data-model.md §Follow-up specs`:

```markdown
### Follow-up spec: fix-<name> (P0)

**Scope**:
- File affected: `<path:line>`
- Fix proposal: [1-2 sentences]
- Estimated size: S/M/L
- Dependencies: [ej. "requires MP_WEBHOOK_SECRET env var"]
- Rollback plan: [breve]

**Copy-paste prompt for /speckit-specify**:
```
<pre-filled prompt>
```
```

Para LATENTs, mismo formato con P1 priority.

### P3.3 — Si ≥3 BLOCKERs: sugerir meta-spec (NO escribir)

```markdown
### Meta-spec proposed: fix-mercadopago-critical-bugs (P0)

**Rationale**: 3+ BLOCKERs relacionados al flow MercadoPago. Agrupar en
1 meta-spec permite:
- Testing integral del flow post-fix (vs 3 tests aislados).
- Rollback atómico si fix introduce regression.
- Comunicación clara "MercadoPago flow hardened" en 1 release.

**Bugs incluidos**: [F-001, F-002, F-003, ...]

**NOT WRITTEN** — advisor decide si crear el meta-spec o 3 specs separados.
```

### P3.4 — Draft subsección `architecture.md`

```markdown
### MercadoPago subscription flow audit (spec 019 — 2026-04-21)

**Verdict**: [AUDIT PASSED / MINOR GAPS / CRITICAL FINDINGS / SYSTEMIC ISSUES]

**Origen**: único componente revenue-critical sin audit post-15 specs
cerrados. Evidencia pre-audit: $80k dashboard Cristóbal (spec 007).

**Metodología**: inventario (edge functions + frontend + schema + 6
queries empíricas) + 5 puntos críticos + gaps funcionales + severidad
4 niveles + revenue impact estimate.

**Findings**:
- BLOCKERs: [N]
- LATENTs: [N]
- EDGEs: [N]
- ENHANCEMENTs: [N]

**Revenue at risk estimate**: [$X - $Y rango]

**Action**:
- [AUDIT PASSED: closed, no follow-up]
- [MINOR GAPS: follow-up P1 specs]
- [CRITICAL: follow-up P0 specs individuales]
- [SYSTEMIC: meta-spec sugerido fix-mercadopago-critical-bugs]

**Known limitation**: logs webhook no accesibles via MCP — análisis bound
a código estático + DB state. Diagnóstico runtime requiere Supabase
dashboard logs access.
```

### P3.5 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T10** | Veredicto emitido | 1 de 4 valores (PASSED/MINOR/CRITICAL/SYSTEMIC) sin ambigüedad | — |
| **T11** | Follow-up templates si BLOCKER/LATENT | count(templates) == count(BLOCKER + LATENT) | Si missing → completar |
| **T12** | Meta-spec sugerido si ≥3 BLOCKERs | rationale + bug list | Si <3 BLOCKERs → skip |
| **T13** | architecture.md draft ready | subsección completa | — |

**Reporte final a Danissa**:

```markdown
## Phase 3 Report — spec 019

- Verdict: [PASSED / MINOR / CRITICAL / SYSTEMIC]
- Findings distribution: [B=N L=N E=N EN=N]
- Revenue at risk: [$X - $Y]
- Follow-up specs preparados: [N]
- Meta-spec sugerido: [sí/no + nombre]
- architecture.md update: ready
- Decisión: close / abrir N follow-ups / abrir meta-spec

🟢 CLOSE / 🔴 RE-EVALUATE
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO Danissa |
| **SP-1** | Fin Phase 1 | T1-T5 PASS + inventario + schema state | 🟢 GO → Phase 2 |
| **SP-2** | Fin Phase 2 | T6-T9 PASS + 5 críticos + gaps + findings matriz + revenue estimate | 🟢 GO → Phase 3 |
| **SP-3** | Fin Phase 3 | T10-T13 PASS + veredicto + templates + arch draft | Decisión close / follow-up / meta-spec |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Inventario | **30 min** | Greps edge + frontend + 4-6 queries + data-model §Inventory + SP-1 |
| Phase 2 — Flow analysis | **30 min** | Flow diagram + 5 críticos + gaps + findings matriz + revenue estimate + SP-2 |
| Phase 3 — Verdict + docs | **20 min** | Verdict + follow-up templates + (meta-spec si ≥3) + arch draft + SP-3 |
| Buffer | **10 min** | Si disparan R-01/R-02/R-03/R-04 |
| **Total** | **90 min** | Dentro bound spec (max 120 antes de STOP) |

---

## References

- `specs/007-fix-patient-dashboard-schema-drifts/` — evidencia $80k dashboard Cristóbal confirmó revenue real.
- `specs/009-restore-marketplace-purchases-policies/` — patrón RLS billing table (applicable a `subscriptions` si 0 policies).
- `specs/014-apply-policies-billing-evaluations/` — `billing_invoices` policies canonical reference.
- `.specify/memory/architecture.md §RLS coverage audit` — contexto global (check si `subscriptions` fue auditada).
- `.specify/memory/constitution.md §I` (Compliance) — PII en subscriptions + billing_invoices.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fix = spec separado, meta-spec solo sugerencia.
- `.specify/memory/constitution.md §V` (UI Honesty) — silent fails en payment flow.
- `docs/PATTERNS.md §4` (audit defensivo) — metodología.
- MercadoPago webhook docs (external): signature validation, retry policy, event types.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Discovery pure más amplio que specs 017/018 (multi-surface backend+frontend+DB+external API), pero alcance acotado a audit — fixes son specs separados. Meta-spec solo sugerido, no escrito (§IV strict). |
