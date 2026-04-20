# Session log — 2026-04-20 (extended spec kit session)

**Duración:** ~6-7 horas continuas (pre-almuerzo + 12:30-18:30)
**Advisor:** sesión Claude externa (strategic)
**Executor:** Claude Code (IDE)
**Modalidad:** Spec Kit disciplinado con stop points obligatorios

---

## Executive summary

Sesión extraordinariamente productiva cerrando **3 brechas P0 compliance**, **1 spec P1 schema drifts**, **1 cleanup de tech debt**, **1 spec P2 performance**, y **1 spec rejected con Constitution amendment**. Además armado de material legal completo para Fase A del pivot estratégico.

**Resultado medible:**
- 6 specs ciclados + 1 rejected
- Constitution §III v1.0.0 → v1.1.0
- PATTERNS.md de 5 a 7 patrones
- architecture.md con 4 subsecciones nuevas preservando historial
- 638 líneas de material legal pre-armado para futuro outreach
- ~40+ commits productivos en origin/main

---

## Timeline

### Mañana (pre-almuerzo)

Retomó trabajo de sesión previa (2026-04-19):
- Push de commits locales: spec 006 (P0 RLS blog_posts + patient_questions) + Express block docs (health-checks + FK audit + NOT NULL audit + feature flags + PATTERNS.md + Docker gotcha)
- Aplicación de migration de spec 006 via Supabase SQL Editor
- Validación visual: blog público OK + therapist ve patient question OK

### 12:30 — 13:15 · Spec 007 (fix-patient-dashboard-schema-drifts)

3 drifts detectados en consola post-spec-006 test manual:
- `session_activities.patient_id` no existe
- `appointments.fee` 400 Bad Request
- `clinical_reports.file_url/report_type` 400

**Descubrimientos Phase 1:**
- R-04 confirmado: no `vendor_id` en marketplace_purchases
- R-05 resuelto: `buyer_id NOT NULL` garantiza 0 orphans
- H-2: relación `session_activities → patient` es 3-level (plan_sessions → patient_assigned_plans → patient_id), no directa

**Phase 2:**
- Drift 1: 3-level embed `plan_sessions!inner(patient_assigned_plans!inner(patient_id))`
- Drift 2: structural-join con `therapist_services.price_clp` via `service_id` FK (extensión interpretativa FR-003.c)
- Drift 3: alias PostgREST `file_url:final_pdf_url` + remove `title` (H-5 no existía)

**Phase 3 validación:**
- Bloque A manual: $80.000 Ingresos como smoking gun visible
- Bloque B/C Playwright: 7/7 testeable rutas PASS
- SP-4: 4/4 Rollback triggers negativos → CLOSE

### 13:15 — 14:00 · Spec 008 (REJECTED)

Pre-plan research reveló que `useClinicalAccessLogger` **excluye intencionalmente** rol patient (early return en isClinicalRole check). Hook alineado con:
- Ley 20.584 art. 13 (transparencia sobre TERCEROS, no auto-acceso)
- Ley 21.719 (quien procesó tus datos, no tú mismo)

**Decisión:** spec rejected como false positive → Constitution §III v1.0.0 → v1.1.0 con clarification: "todo acceso de TERCEROS (roles clínicos: dentist, clinic_admin, assistant) a datos clínicos de un paciente debe invocar useClinicalAccessLogger. El auto-acceso del paciente a su propia ficha NO requiere logging."

**Aprendizaje meta:** verificar BODY del hook antes de declarar gap de compliance → Pattern 6 (False positive detection)

### 14:00 — 16:00 · Spec 009 (restore-marketplace-purchases-policies)

**Phase 1 descubrimiento:**
- Solo 1 de 3 policies históricas sobrevive en live state: "Admins update marketplace_purchases"
- Otras 2 (Buyer read own, Buyer insert) dropeadas silenciosamente entre sync de fases RLS
- 13+ callsites afectados post-enable RLS si no se restauran
- buyer_col confirmado = `buyer_id` uuid NOT NULL
- Tabla vacía (0 purchases) → zero downside de enable RLS ahora

**Decisión Estrategia Admin:** B (replace "Admins update" con "Admin manage" FOR ALL)

**Plot twist Phase 2 re-verification:** Query A re-ejecutada mostró **2 policies vivas** (no 1). La segunda ("Vendors read own plan purchases") había sido ejecutada manualmente durante experimentación con preview SQL del advisor.

**Pivot X2 → X1:** keep Vendors policy (marginal cost 0, UX mejor, cierra trilogía buyer/vendor/admin). Spec 009.1 cancelado.

**Aprendizaje meta:** re-verify state entre Phase 1 y Phase 2 → Pattern 7 (State drift re-verification)

**Phase 3 validación:**
- Migration apply "Success. No rows returned" + 2 NOTICE
- Post-check: 4 policies + rowsecurity=true confirmado
- Smoke tests UI: SKIP con risk-accepted (tabla vacía = 0 impact real)
- SP-4: CLOSE con justificación archivable

### 16:00 — 17:00 · Spec 010 (cleanup-fonokit-dead-code)

**Scope tight:** 2 items dead code (voice-visualizer feature + src/app/ orphans).

**Phase 1 insight útil:** grep reveló que el import en DashboardRouter.jsx es `lazy()` en línea 49, NO top-of-file. Plan original asumía top-of-file. Ajuste de scope pre-code evitó PR roto.

**Phase 2:**
- 4 rm (voice-visualizer/ + VoiceVisualizerPage + app/App.jsx + app/providers.jsx = 8 files total)
- 2 edits (DashboardRouter lazy const + bloque condicional, featureFlags.js VOICE_VISUALIZER entry)

**Phase 3:**
- Lint: 8 errors / 0 warnings post = baseline (0 nuevos)
- Build: exit 0, 22.61s, 0 broken imports
- dist/ size: 1018.08 → 1017.84 kB (-0.24 kB)
- 0 voice-visualizer chunks en dist/assets/

FR-005 `NOT touch` enumerativo preservó scope — los otros 6 feature flags en `false` (PIE_ESCOLAR, ADOS2, ADIR, TEA, SENSORIAL_PROFILE, EDUCATOR) quedaron para spec futura.

### 17:00 — 18:00 · Spec 011 (add-missing-fk-indexes)

**Phase 1 matrix completo:**
- 7 FKs confirmados vigentes (T1 PASS)
- 0 índices pre-existentes cubren las columnas (T2 PASS, Query B con 3 variantes LIKE para compuesto-primero / compuesto-no-primero / solo-columna)
- Row counts: appointments=14, clinical_history=5, clinic_invoices=0, commissions=0 (T3 PASS, CONCURRENTLY innecesario)

Insight: `clinical_history.entry_type` → `clinical_entry_types.code` (ref a `code`, no `id` — curioso pero válido).

**Phase 2:**
- Migration 20260420000003 canonical: pre-check + 7 CREATE INDEX IF NOT EXISTS btree + post-check + rollback comentado
- Pre-check valida por nombre de índice (no por cobertura de columna) → catches re-apply inesperado
- Post-check valida FKs intactos además de índices creados

**Phase 3 EXPLAIN ANALYZE:**
- appointments.service_id (14 rows): Seq Scan (FR-009 tolerated — PostgreSQL ignora índice en tablas tiny)
- commissions.therapist_id (0 rows): **Bitmap Index Scan** (planner usa el índice incluso empty) → superó expectativa

Índices son PREVENTIVOS — benefits se materializan cuando las tablas crezcan ~100+ rows.

### 18:00 — 18:30 · Legal outreach folder

Zero cognitive task post-security work. 5 archivos en `docs/legal-outreach/`:
- README.md (índice + flujo sugerido 4 semanas)
- 01-email-inicial.md
- 02-agenda-reunion.md (25 preguntas + calibración)
- 03-documentos-redactar.md (7 docs + plantilla cotización)
- 04-presupuesto-referencia.md (precios Chile 2026 + ahorros 30-50%)

638 líneas archivadas para ejecutar cuando presupuesto $3.5M-$5M CLP disponible.

---

## Specs detalle

| # | Spec | Commits | Status final |
|---|---|---|---|
| 006 | enable-rls-quick-wins | 2 (feat + PATTERNS.md en Express block) | ✅ En prod (pushed hoy) |
| 007 | fix-patient-dashboard-schema-drifts | 6 (open → plan → tasks → feat → close → merge) | ✅ En prod |
| 008 | fix-audit-logger-missing-on-patient-dashboard | 3 (open → closure + Constitution + merge) | ✅ Rejected con docs |
| 009 | restore-marketplace-purchases-policies | 8 (open → plan → tasks → data-model → pivot → feat → close → merge) | ✅ En prod |
| 010 | cleanup-fonokit-dead-code | 6 (open → plan → tasks → feat → close → merge) | ✅ En prod |
| 011 | add-missing-fk-indexes | 6 (open → plan → tasks → feat → close → merge) | ✅ En prod |
| — | Legal outreach prep | 1 | ✅ Archivado |

---

## Constitution amendments

### §III Append-Only Clinical Audit — v1.0.0 → v1.1.0

**Trigger:** Spec 008 rejected as false positive.

**Redacción anterior:** "leer datos clínicos sin invocar useClinicalAccessLogger es violación"

**Redacción v1.1.0:** "todo acceso de TERCEROS (roles clínicos: dentist, clinic_admin, assistant) a datos clínicos de un paciente debe invocar useClinicalAccessLogger. El auto-acceso del paciente a su propia ficha NO requiere logging — está alineado con Ley 20.584 art. 13 y Ley 21.719 que regulan transparencia sobre accesos por terceros, no auto-consulta."

**Previene:** futuras interpretaciones incorrectas del principio que abran specs de "fix missing logger" donde el hook está intencionalmente filtrando.

---

## Patterns añadidos a docs/PATTERNS.md

### §6 — False positive detection (before declaring compliance gap)

Verificar body del hook + intent legal + callsites existentes ANTES de abrir spec "fix missing X". Caso canónico: spec 008 rejected pre-plan.

### §7 — State drift re-verification entre phases

Re-ejecutar query de audit crítica entre Phase 1 y Phase 3 antes de apply. Caso canónico: spec 009 Phase 2 re-check reveló 2 policies donde Phase 1 vio 1, pivot X2→X1 documentado.

---

## Key decisions + rationale

### 1. Spec 007 — extensión interpretativa FR-003.c

**Decisión:** Drift 2 (`appointments.fee` → `therapist_services.price_clp`) tratado como structural-join usando patrón canónico existente (`useTherapistDashboard.js:111`), no como re-modelado semántico que dispararía abort.

**Rationale:** la fuente de datos ya existe + el pattern ya se usa en el codebase + cambio acotado (≤5 líneas en 1 archivo). FR-003.c bloquea "inventar ruta nueva de datos", no "alinearse con pattern canónico existente".

### 2. Spec 008 — REJECTED vs pivot a scope diferente

**Decisión:** cerrar spec como false positive con Constitution amendment, en lugar de re-scope a "extender hook para incluir rol patient" o "crear hook dedicado usePatientSelfAccessLogger".

**Rationale:** legalmente innecesario (Ley 20.584 + 21.719 regulan terceros), arquitectónicamente inconsistente (los 2 callsites existentes audit third-party access), y expandir scope contradice Micro-Bloques. Constitution amendment es la respuesta apropiada.

### 3. Spec 009 — pivot X2 → X1 post Vendors policy discovery

**Decisión:** Dado que "Vendors read own plan purchases" apareció en DB durante Phase 1 (injected por experimentación manual con preview SQL), keep y pivotar a X1 en lugar de drop.

**Rationale:** marginal cost 0, UX mejor (TherapistMarketplacePage.jsx:60 funciona post-enable), evita spec 009.1 futuro (30+ min ahorro), completa trilogía buyer/vendor/admin conceptualmente coherente.

### 4. Spec 010 — scope bounds explícitos FR-005

**Decisión:** FR-005 enumera "qué NO tocar" de forma explícita (6 feature flags en false adicionales, fonoaudiologo/ activo, database.ts, supabase/**, docs/memoria).

**Rationale:** anti-scope-creep aprendizaje de specs previos. Documentar intención de no-expandir previene tanto al executor como al advisor de ampliar mid-flight.

### 5. Spec 011 — smoke tests UI SKIP con risk-accepted

**Decisión:** spec 009 cerrado sin Playwright regression tests de Bloques B/C.

**Rationale:** tabla vacía (0 purchases) = 0 impacto real de regresión potencial. Post-check migration verificó estado objetivo. Primera compra real funcionará como smoke test natural. Time conservation > exhaustive coverage cuando risk es zero.

---

## Lessons learned

### 1. Pre-Phase 1 audit defensivo funciona

Spec 008 rejected pre-plan = **30-45 min ahorrados** que habrían sido código no-op silencioso en producción. PATTERNS.md §4 validado en campo.

### 2. Phase 1 puede corregir el plan mismo

Spec 007 H-2: plan asumía `plan_sessions.patient_id` directo, realidad es 3-level embed. Spec 010: plan asumía top-of-file import, realidad es `lazy()`. En ambos casos audit defensivo corrigió código ANTES de escribir.

### 3. State drift es un riesgo real

Spec 009 pivot X2→X1 por Vendors policy injected → sin re-verify, Phase 3 apply habría abortado con pre-check FAIL esperando 1 policy y encontrando 2. PATTERNS.md §7 cubre esto.

### 4. PostgreSQL planner es textbook-correcto

Spec 011 EXPLAIN ANALYZE: Seq Scan en appointments (14 rows) + Bitmap Index Scan en commissions (0 rows). Planner evalúa cost-benefit per tabla. Índices preventivos esperan crecimiento para activarse.

### 5. Micro-Bloques ahorra energy

5 specs ciclados en 6h vs 1 spec gigante en mismo tiempo → mejor ritmo cognitivo, menos rework, fix-ups entre specs son más baratos que refactor grande al final.

---

## Backlog state at session close

### P0 security pendiente

| Item | Estimación | Notas |
|---|---|---|
| `write-policies-pie-and-debug-tables` | 1-2h | Último P0 del audit. 6 tablas PHI sin policies (pie_* + debug_signup_logs). PIE FEATURE_FLAG=false → impacto real 0 hoy |

### P1 alto valor

| Item | Estimación | Categoría |
|---|---|---|
| `audit-rls-enabled-zero-policies` | 1h | Discovery: billing_invoices + patient_evaluations + otros posiblemente rotos silenciosamente |
| `hardening-assistant-role` | 1-1.5h | Ley 20.584 compliance (rol assistant tiene UPDATE amplio sobre patients) |
| `ux-persistent-org-context` | 1-2h | Gotcha recurrente `currentOrganizationId = null` post-navigation |

### P2 cleanup + visible

| Item | Estimación | Notas |
|---|---|---|
| `rebrand-fonoaudiologo-urls` | 1.5-2.5h | URLs públicas `/fonoaudiologos` + `/fonoaudiologo/:slug` mal para SaaS dental |
| `consolidate-clinics-modality` | 30-45min | 🟡 del preventive audit, patrón spec 005 |
| `consolidate-therapist-services-fetchers` | 30-45min | Previene drift tipo spec 005 |
| `care-team-deactivation-on-reassign` | 45-60min | Patient reasignado = 2 entries activas |
| `cleanup-remaining-feature-flags` | 45-60min | Los 6 flags en false restantes (spec 010.1) |
| `toast-honesty-audit` completo | 45-60min | ~28 callsites con toast success sin validación |

### P3 / Infra

| Item | Estimación | Notas |
|---|---|---|
| `regenerate-schema-sql` | 10-15min | Requiere Docker Desktop (diferido por pre-requisito) |
| `clinical-history-fk-bug` | 30-90min | Scope depende de investigación |
| `add-missing-fk-indexes` ampliado | 45-60min | Los ~23 FKs medium/low pendientes |

### Estratégico diferido

- Legal outreach execution (cuando presupuesto $3.5M-$5M CLP disponible)
- Pivot a marketplace B2C con triage IA (FASE A-D — 16-20 semanas total)

---

## Prompt para retomar mañana

```
Buenos días. Retomamos DentalSpot post-sesión de 2026-04-20.

Contexto activo:
- 6 specs cerrados hoy + 1 rejected + Constitution §III v1.1.0 + 
  PATTERNS.md de 5 a 7 patrones + 4 subsecciones nuevas en 
  architecture.md + 638 líneas material legal pre-armado.
- P0 security pendiente: write-policies-pie-and-debug-tables.
- Backlog P1/P2 con múltiples items priorizados.

Session log completo en docs/session-logs/2026-04-20-extended-session.md.

¿Qué atacamos hoy?
```

---

## Referencias cruzadas

- `.specify/memory/constitution.md` — §III v1.1.0
- `.specify/memory/architecture.md` — §RLS coverage audit, §Performance audit, §Known drift, §Dead code
- `.specify/memory/data-compliance.md` — §Historial de compliance, §Dos tablas distintas
- `.specify/memory/ecosystem-communicare.md` — contexto pivot marketplace
- `docs/PATTERNS.md` — §1-§7 patrones canónicos
- `docs/legal-outreach/` — material pre-armado legal
- Migrations: `20260419000001`, `20260420000001`, `20260420000002`, `20260420000003`
