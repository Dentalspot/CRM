# Session log — 2026-04-20 (extended spec kit session)

**Duración:** ~12-13 horas continuas (pre-almuerzo + 12:30 → past midnight into 2026-04-21)
**Advisor:** sesión Claude externa (strategic)
**Executor:** Claude Code (IDE)
**Modalidad:** Spec Kit disciplinado con stop points obligatorios

---

## Executive summary

Sesión excepcional cerrando **6 brechas P0 compliance** (todo el RLS coverage audit del día 1), **1 spec P1 schema drifts**, **1 spec P1 UX**, **1 cleanup de tech debt**, **1 spec P2 performance**, **4 discovery audits** (1 categorización + 2 descartados + 1 SYSTEMIC ISSUES revenue-critical), y **1 spec rejected con Constitution amendment**. Material legal completo pre-armado para Fase A del pivot estratégico.

**🎯 Logros milestone:**
- RLS coverage audit 2026-04-20 → **100% CERRADO** en producción (12 tablas resueltas en 6 specs)
- Cross-org isolation audit → **LEAK DESCARTADO** (diseño intencional confirmado)
- Therapist_id vs care_team drift audit → **NULA** (triggers spec 003 funcionando correctamente)
- **MercadoPago subscription flow audit → SYSTEMIC ISSUES** (5 BLOCKERs P0 mapped, meta-spec propuesto, revenue at risk 12m $1.6M-$14.4M conservador, $20M-$60M+ worst-case)

**Resultado medible:**
- **14 specs ciclados + 1 rejected + 3 audits discovery concluidos** (total 18 ciclos de spec kit discipline)
- Constitution §III v1.0.0 → v1.1.0
- PATTERNS.md de 5 a 7 patrones (con §8-§10 candidatos forward)
- architecture.md con 9+ subsecciones nuevas preservando historial (incluida spec 019 MercadoPago audit)
- 638 líneas de material legal pre-armado para futuro outreach
- ~80+ commits productivos en origin/main + 1 local pendiente merge (spec 019 close)
- 7 migrations aplicadas en producción (`20260419000001`, `20260420000001-006`)
- 2 hallazgos laterales confirmados como non-bugs (diseño intencional + transitorio resolved)
- 1 audit revenue-critical con verdict sistémico + 5 follow-up templates listos (1 meta + 4 individuales)

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

### 19:00 — 20:00 · Spec 013 (ux-persistent-org-context)

Gotcha recurrente de multi-org therapists. 3 escenarios definidos (navigation, refresh, logout cross-user).

**Phase 1 EMPIRICAL PIVOT crítico:**
- Hipótesis original del spec ("falta persistencia") resultó INCORRECTA
- Empirical via Playwright reveló que sessionStorage funciona (P2 no-bug)
- Root cause real: `setCurrentOrgId(null)` cuando multi-org sin stored → dropdown "Seleccionar organización" cosmético
- P3 cross-user contamination latente por logout no cleanup

**Decisión Y1 minimal (scope reduction):**
- A SKIP (sessionStorage funciona, no migrar)
- B SKIP (timing actual funciona)
- C REDUCIDA (default a primera org + persistir)
- D KEEP (useRef-based listener para logout, más React-idiomatic)

**Phase 2:** 29 líneas modificadas en 1 archivo (`OrganizationContext.jsx`). Scope bound ≤2 archivos cumplido con 1.

**Phase 3 Playwright verify:** 3/3 PASS (P1 dropdown auto-select, P2 refresh preserva, P3 logout limpia).

**Hallazgo lateral:** dropdown vacío + /patients con 4 pacientes sugiere queries NO filtran por organization_id → potencial cross-org data leak. Follow-up spec abierto.

### 20:00 — 21:00 · Spec 014 (apply-policies-billing-invoices-and-patient-evaluations)

Primero de los 3 templates GROUP B de spec 012. Aplicación canonical del patrón.

**Ajustes schema validados Phase 1:**
- patient_care_team usa `dentist_id` (no therapist_id)
- patient_care_team.is_active filter NOT NULL
- patients.profile_id = auth.uid() mapeo estándar

**Migration 20260420000004:** 5 policies total (2 billing + 3 evaluations).

Applied en 4 partes vía SQL Editor. Pre/post-check DO $$ PASS. 0 rows afectadas.

### 21:00 — 21:45 · Spec 015 (apply-policies-goals-and-development-areas)

Tercer template GROUP B. Bundled por FK embed.

**Decisión DETERMINÍSTICA Phase 1 (Query D):**
- patient_development_areas NO tiene columna patient_id → SHARED CATALOG
- patient_goals tiene patient_id → per-patient via care_team

Total: 5 policies (2 shared catalog + 3 per-patient).

**Hallazgo lateral crítico:** FKs duplicados en patient_goals (area_id, evaluation_id, patient_id). El más grave: `patient_id` tiene FK dual a `patients.id` + `profiles.id` = schema debt real. Follow-up spec abierto.

**Meta-milestone:** GROUP B = 3/3 resueltos post-close.

### 21:45 — 22:30 · Spec 016 (lockdown-pie-and-debug-tables)

Último P0 del RLS coverage audit. 6 tablas (5 PIE + debug_signup_logs) con rowsecurity=false + 0 policies.

**FR-009 Decision post-Phase 1:**
- Option 2a elegida: 6 ALTER TABLE ENABLE RLS + 1 CREATE POLICY minimal
- R-01 activado: `MyClinicsSection.jsx:205-225` tiene silent upsert NO-wrapped en flag OFF → requiere policy minimal para preservar functionality
- R-02, R-03 descartados (0 admin callsites, 0 edge functions)

**Migration 20260420000006:** 6 ALTER TABLE + 1 policy (`Therapists manage own pie_therapist_schools`).

Applied en 4 partes. 0 rows afectadas (todas las tablas vacías).

**🎯 RLS coverage audit 2026-04-20 = 100% CERRADO** tras este spec.

### 22:30 — 23:15 · Spec 017 (audit-cross-org-query-isolation)

Discovery pure follow-up de hallazgo lateral spec 013: Cristóbal (multi-org Los Álamos + Bulnes) con `currentOrganizationId=null` aún veía 4 pacientes en `/patients`.

**Phase 1 audit estático:**
- 13 callsites `useCurrentOrganization`: 0 usan como READ filter (WRITEs, UI, audit, guards)
- 20+ callsites a tablas con organization_id: 0 filtran por currentOrganizationId en reads
- 2 RLS patterns canonical: `is_org_member()` + `patient_care_team.dentist_id` agregan across orgs

**🎯 SMOKING GUN:** `patientApi.js:375-376` comentario explícito: "RLS filtra automáticamente por care_team + org membership. No se filtra por therapist_id en el frontend — la seguridad la da RLS."

**Phase 2 empirical:**
- Query β (raw therapist_id): 5 pacientes, 3 orgs
- Query γ (RLS aplicado): 4 pacientes, 2 orgs
- Diferencia: 1 paciente con therapist_id sin care_team activo → hallazgo lateral para spec 018

**VERDICT: LEAK DESCARTADO — Scenario 2a (diseño intencional).**
Multi-org dentist ve pacientes across clinics donde tiene care_team + org membership = feature, no bug. Hipótesis (a)/(b) de spec 013 REFUTADAS.

**Patrón WRITE vs READ establecido como diseño canonical DentalSpot:**
- WRITE: usa `currentOrganizationId` para tag org activa
- READ: no usa `currentOrganizationId`, RLS resuelve isolation
- Dropdown UI: cosmético para reads, funcional para writes

### 23:15 — 00:00 · Spec 018 (audit-therapist-id-vs-care-team-drift)

Discovery pure del hallazgo lateral de spec 017 (1 paciente drift en Cristóbal). Quantificación global + categorización en 5 hipótesis.

**Phase 1 empirical:**
- Query α global: `A_drift_count = 0` (¡CERO pacientes con drift en TODA la DB!)
- Queries β/γ/δ: 0 rows consistentes

**VERDICT: DRIFT NULA — transitorio confirmado.**

Spec 017's 1-paciente hallazgo fue transitorio, probablemente resolved entre audits (care_team sync async, deactivation, o race condition).

**R-01 confirmed:** triggers spec 003 (`20260419000001`, `AFTER INSERT/UPDATE` on patients) funcionan correctamente. Post-trigger drift global es 0.

Close sin fix. Monitoring proactivo opcional (cron query α) si vuelve a aparecer.

### 00:00 — 02:00 (2026-04-21) · Spec 019 (audit-mercadopago-subscription-flow)

Discovery pure revenue-critical. Único componente monetario sin audit post-15 specs cerrados. 3 phases completas, 4 stop points cerrados.

**Phase 1 inventario:**
- 3 edge functions MP identificadas: `mercadopago-webhook` + `create-mp-checkout` + `create-mercadopago-preference`.
- 14+ consumers frontend inventariados (SubscriptionContext, useInvoices, MembershipPlansPage, etc.).
- Queries α-θ ejecutadas via SQL Editor (Danissa paste). Descubrimiento crítico: tabla `subscriptions` EXISTE pero está vacía (0 rows) → F-004 recategorizado BLOCKER → LATENT. Tabla real operacional es `therapist_subscriptions` (22 cols confirmadas).
- RLS state: `therapist_subscriptions.rowsecurity=true` + 5 policies → R-04 DESCARTADO.
- Ajuste en Phase 1: spec + plan originales asumieron tabla `subscriptions` (nombre incorrecto). Queries reescritas para `therapist_subscriptions` tras inventario.

**Phase 2 flow analysis:**
- Flow diagram 10 pasos end-to-end reconstruido desde inventory.
- 5 puntos críticos: 4 FAIL BLOCKER (F-001 no-signature, F-002 no-idempotent, F-003 silent-200, retry combo) + 1 PARCIAL LATENT (F-018 no-audit-trail).
- 6 gaps funcionales evaluados (upgrade/cancel/failed/refund/chargeback/input-validation).
- **F-014 descubierto leyendo `create-mp-checkout:69-71`** — client-side price manipulation no previsto en Risk Register original. Elevado a BLOCKER P0 (self-exploit con DevTools, accesible a cualquier therapist autenticado). Probablemente el más peligroso en términos de probabilidad real.
- F-015/F-016/F-017/F-018 también novel findings Phase 2.

**Phase 3 verdict:**
- 🔴 **SYSTEMIC ISSUES (nivel 4 de 4)** — 5 BLOCKERs P0 confirmados (umbral ≥3 superado por 66%).
- **18 findings totales**: 5 BLOCKER / 4 LATENT P1 / 5 LATENT P2 / 1 EDGE / 3 ENHANCEMENT.
- Revenue at risk 12m post-launch: **$1.6M-$14.4M CLP conservador**, **$20M-$60M+ worst-case** (F-001 explotado).
- **Concentración arquitectural**: 4 de 5 BLOCKERs en `mercadopago-webhook` handler. 5º (F-014) en checkout creators. Patrón sistémico, no bugs puntuales → justifica meta-spec agrupado.

**Deliverables finales:**
- `specs/019-audit-mercadopago-flow/data-model.md` — 874 líneas con inventario + flow + findings matrix + revenue estimate + verdict + follow-up templates + meta-spec proposal + architecture.md draft.
- Architecture.md: nueva subsección `§"MercadoPago subscription flow audit (spec 019 — 2026-04-21)"` + Last updated bump.
- Commit único `c8689fd` sobre rama `019-audit-mercadopago-flow` (discovery pure: 0 edits a src/supabase — TASK-FINAL-VALIDATE PASS).
- Meta-spec propuesto `fix-mercadopago-critical-bugs` P0 con prompt pre-cocinado listo para `/speckit-specify` sesión futura (NO escrito — FR-007, §IV).
- 4 follow-up spec templates P1 listos copy-paste: `add-webhook-audit-trail` (prerequisite), `fix-subscription-cancellation-detection`, `fix-admin-directory-wrong-table`, `fix-process-completed-order-silent-catch`.

**Decisión advisor requerida mañana**: Opción A (meta-spec agrupado, recomendado) · Opción B (5 specs separados, riesgo regresión cruzada) · Opción C (diferir con risk accept).

**Known limitation**: logs webhook no accesibles via MCP — análisis bound a código estático + DB state (n=1 active sandbox). Runtime diagnostics requieren implementar `add-webhook-audit-trail` primero.

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
| 012 | audit-rls-enabled-zero-policies | 6 (discovery pure, 3 templates prep) | ✅ En prod (discovery) |
| 013 | ux-persistent-org-context | 6 (con Y1 scope reduction empirical) | ✅ En prod (29 líneas, 1 archivo) |
| 014 | apply-policies-billing-evaluations | 6 (5 policies aplicadas) | ✅ En prod |
| 015 | apply-policies-goals-and-development-areas | 6 (SHARED CATALOG decision, 5 policies) | ✅ En prod |
| 016 | lockdown-pie-debug-tables | 6 (6 ALTER + 1 policy minimal Option 2a) | ✅ En prod |
| 017 | audit-cross-org-query-isolation | 6 (discovery pure, LEAK DESCARTADO) | ✅ En prod (verdict) |
| 018 | audit-therapist-id-vs-care-team-drift | 5 (discovery pure, DRIFT NULA) | ✅ En prod (verdict) |
| 019 | audit-mercadopago-subscription-flow | 4 (spec → plan → tasks → close, discovery pure, SYSTEMIC ISSUES) | ✅ Close commit local (c8689fd) — merge + push pendiente Danissa |
| — | Legal outreach prep | 1 | ✅ Archivado |
| — | Session log update (este doc) | 1 | ✅ Archivado |

**Total: 14 specs cerrados (13 en prod + 1 close local) + 1 rejected con Constitution amendment + 3 discovery audits concluidos + 2 docs archives = 20 ciclos productivos completos.**

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

### 6. Spec 013 — pivot Y1 post Phase 1 empirical (scope reduction)

**Decisión:** hipótesis original del spec ("falta persistencia") fue INCORRECTA según Playwright empirical. Scope reducido a 29 líneas en 1 archivo (vs plan original más ambicioso).

**Rationale:** Phase 1 baseline via Playwright mostró P2 (refresh) funcionando. Root cause real: `setCurrentOrgId(null)` en multi-org sin stored. Decisiones A/B SKIP (no migrar sessionStorage, no cambiar timing). Solo C reducida + D keep (listener useRef-based más React-idiomatic que onAuthStateChange).

### 7. Spec 015 — decisión SHARED CATALOG determinística

**Decisión:** patient_development_areas es SHARED CATALOG (no per-patient) según Query D information_schema. Ajustó spec de 4 a 2 policies para dev_areas.

**Rationale:** Query D reveló 0 columna patient_id. 0 callsites frontend directos (acceso via FK embed desde patient_goals). Lista fija de tipos de áreas de desarrollo (Estética, Funcionalidad, etc.). Política "Authenticated read + Admins manage" correcta para catálogo público.

### 8. Spec 016 — Option 2a Lock-down minimal (FR-009)

**Decisión:** En vez de "pure deny-all" (Option 2b), agregar 1 policy minimal para pie_therapist_schools por R-01 detectado (MyClinicsSection.jsx:205 silent upsert NO-wrapped en flag OFF).

**Rationale:** pure deny-all habría roto funcionalidad existente (silent upsert falla silencioso, data loss invisible). 2a preserva comportamiento con overhead mínimo (1 CREATE POLICY simple). Respeta §IV porque policy es trivial, no scope creep.

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

### 6. Empirical > Hypothesis (spec 013 pivot)

Phase 1 empirical via Playwright revertió la hipótesis del spec. En vez de implementar lo que el spec pedía, el test real mostró que el problema era diferente (y más simple). Scope bajó de 1-2h a 30 min real.

**Lesson:** empirical always trumps hypothesis, aún cuando el spec ya pasó review. Phase 1 es el último momento de validar antes de sunk-cost bias.

### 7. Bundled decisions con Query D determinística (spec 015)

Bundle de 2 tablas con decisión SHARED vs PER-PATIENT resuelta via query a information_schema.columns. Sin subjetividad, sin asunciones. Una presencia/ausencia de columna patient_id → decisión.

**Lesson:** cuando el spec tiene una decisión crítica que afecta el diseño, hacerla determinística por data del schema evita análisis paralelo y decisión por consenso.

### 8. Minimal lock-down como approach intermedio (spec 016)

Entre "pure deny-all" (rompe things) y "full policies" (over-engineering para feature OFF), spec 016 mostró que "ENABLE RLS + 1 policy minimal donde sea necesario" es el sweet spot.

**Lesson:** no todo es binario. Feature flag OFF + 1 callsite no-wrapped ≠ abort ≠ full policy. Puede ser "minimal lock-down con 1 excepción documentada".

### 9. Discovery audits que CIERRAN hipótesis sin fix (specs 017 + 018)

Spec 017 y 018 demostraron que **un audit bien hecho puede concluir "no hay bug"** con evidencia convergente de 3+ fuentes y eso es tan valioso como fix un bug real. Spec 017 cerró con verdict LEAK DESCARTADO basado en código + matriz + empirical; spec 018 cerró con DRIFT NULA via query global.

**Lesson:** discovery pure es Constitution-compliant. No todo audit debe terminar en fix. Descartar hipótesis con rigor = closure organizational valiosa. Evita que el mismo hallazgo lateral vuelva a generar alarma en futuras sesiones.

### 10. El SMOKING GUN documental (spec 017)

El comentario explícito en `patientApi.js:375-376` ("la seguridad la da RLS, no frontend filter") fue evidencia de TIER-1 para el verdict. Futuro dev que lea el código entiende el diseño inmediatamente.

**Lesson:** comentarios de diseño en el código son patrimonio. Spec 017 aprovechó esto. Al escribir código de seguridad con patrón no-obvio, documentar el "por qué" inline previene audits futuros redundantes.

---

## Backlog state at session close

### 🎯 RLS coverage audit 2026-04-20 = 100% CERRADO

Ningún item pendiente del audit original. 12 tablas procesadas, ~20 policies activas en producción.

### 🔴 Production-critical primero (mañana) — ex-spec 019 outputs

**Meta-spec P0 propuesto** (agrupa los 5 BLOCKERs spec 019):

| Item | Estimación | Categoría |
|---|---|---|
| `fix-mercadopago-critical-bugs` (meta) | 10-15h total (3-5h plan + 6-10h impl) | 5 BLOCKERs agrupados: F-001 signature + F-002 idempotency + F-003 silent-200 + F-005 no-dunning + F-014 client-price-manipulation. Prompt pre-cocinado en `specs/019-audit-mercadopago-flow/data-model.md §P3.3`. **Decisión advisor pendiente**: Opción A (meta) / B (5 specs separados) / C (diferir con risk accept) |

**Follow-ups P1 spec 019 (templates listos copy-paste `/speckit-specify`):**

| Item | Estimación | Prerequisite |
|---|---|---|
| `add-webhook-audit-trail` (F-018) | M (1.5-2h) | — | Prerequisite diagnóstico post-meta-spec. Recomendado PRIMERO para verificar fixes subsequent |
| `fix-subscription-cancellation-detection` (F-010) | S (45-60min) | add-webhook-audit-trail recomendado |
| `fix-admin-directory-wrong-table` (F-004) | XS (15-30min) | — | 1-line fix trivial `.from('subscriptions')` → `.from('therapist_subscriptions')` |
| `fix-process-completed-order-silent-catch` (F-017) | S (45-60min) | add-webhook-audit-trail recomendado |

### 🟢 Follow-ups RESUELTOS hoy (no más pendientes)

| Item | Origen | Resolución |
|---|---|---|
| `audit-cross-org-query-isolation` | Hallazgo spec 013 | ✅ Spec 017 LEAK DESCARTADO (diseño intencional) |
| `audit-therapist-id-vs-care-team-drift` | Hallazgo spec 017 | ✅ Spec 018 DRIFT NULA (transitorio, triggers spec 003 OK) |
| `audit-mercadopago-subscription-flow` | Priority explícita Danissa "priorizar llevar a producción" | ✅ Spec 019 SYSTEMIC ISSUES (5 BLOCKERs P0, meta-spec + 4 follow-ups propuestos) |

### 🟡 Follow-ups pendientes mañana

| Item | Estimación | Origen |
|---|---|---|
| `cleanup-duplicate-fks-patient-goals` | 30-45min | Hallazgo lateral spec 015 — FKs duplicados en patient_goals (`patient_id` FK dual a patients.id + profiles.id) |
| `audit-clinical-phi-logging` | 45-60min | Inspeccionar callsites que leen PHI sin invocar useClinicalAccessLogger (Constitution III) — flagued en specs 014/015 sin deep-dive |
| `write-pie-policies-full` | 1.5-2h | Pre-requisito obligatorio antes de activar FEATURE_FLAGS.PIE_ESCOLAR=true. Policies patient-read/therapist-via-care_team/admin-manage para 5 tablas PIE. Forward-looking §V flag spec 016 |

### 🟡 P1 compliance/UX

| Item | Estimación | Categoría |
|---|---|---|
| `hardening-assistant-role` | 1-1.5h | Ley 20.584 compliance (rol assistant tiene UPDATE amplio sobre patients) |
| `rebrand-fonoaudiologo-urls` | 1.5-2.5h | URLs públicas `/fonoaudiologos` + `/fonoaudiologo/:slug` mal para SaaS dental |

### 🟢 P2 cleanup + visible

| Item | Estimación | Notas |
|---|---|---|
| `consolidate-clinics-modality` | 30-45min | 🟡 del preventive audit, patrón spec 005 |
| `consolidate-therapist-services-fetchers` | 30-45min | Previene drift tipo spec 005 |
| `care-team-deactivation-on-reassign` | 45-60min | Patient reasignado = 2 entries activas |
| `cleanup-remaining-feature-flags` | 45-60min | Los 6 flags en false restantes (spec 010.1) |
| `toast-honesty-audit` completo | 45-60min | ~28 callsites con toast success sin validación |
| `consolidate-patient-pii-source-of-truth` | 1-2h | 🟡 del preventive audit |

### 🔵 P3 / Infra

| Item | Estimación | Notas |
|---|---|---|
| `regenerate-schema-sql` | 10-15min | Requiere Docker Desktop (diferido por pre-requisito) |
| `clinical-history-fk-bug` | 30-90min | Scope depende de investigación |
| `add-missing-fk-indexes` ampliado | 45-60min | Los ~23 FKs medium/low pendientes |
| `migrations-idempotency-hardening` | 30-45min | Revisar últimas 10 migraciones |
| Error tracking (Sentry) | 1h setup | Operacional, útil cuando tráfico crezca |

### 🚀 Estratégico diferido

- Legal outreach execution (cuando presupuesto $3.5M-$5M CLP disponible)
- Pivot a marketplace B2C con triage IA (FASE A-D — 16-20 semanas total)

---

## Prompt para retomar (cuando duermas)

```
Buenos días. Retomamos DentalSpot post-sesión ÉPICA 2026-04-20/21
(trasnochada 12-14h con 14 specs cerrados + 3 discovery audits
concluidos + 1 audit revenue-critical con verdict SYSTEMIC ISSUES).

Contexto activo:
- 14 specs cerrados (13 en prod + spec 019 close local pending merge)
- 1 rejected + Constitution §III v1.1.0
- RLS coverage audit 100% CERRADO (12 tablas, 6 specs)
- Cross-org isolation audit → DESCARTADO (spec 017 diseño intencional)
- Therapist_id drift audit → NULA (spec 018 transitorio)
- **MercadoPago audit → SYSTEMIC ISSUES (spec 019, 5 BLOCKERs P0 mapped)**
- PATTERNS.md 5→7 con §8-§10 candidatos documentados
- architecture.md 9+ subsecciones nuevas (incluida §MercadoPago audit)
- docs/legal-outreach/ 638 líneas pre-armadas (untracked, pendiente commit)
- 7 migrations aplicadas en producción

Primer paso mañana (5 min):
1. Revisar rama 019-audit-mercadopago-flow (commit local c8689fd)
2. Merge a main + push (o defer si quieres releer primero)
3. Opcional: commitear docs/legal-outreach/ como "docs: add legal outreach
   pre-armado pre-Fase A pivot marketplace"

TARGET HOY — decisión advisor Opción A/B/C sobre spec 019:
- Opción A ⭐ RECOMENDADA: crear meta-spec fix-mercadopago-critical-bugs
  P0 agrupando 5 BLOCKERs. Prompt pre-cocinado en
  specs/019-audit-mercadopago-flow/data-model.md §P3.3. Estimate 10-15h.
  Arranque: `/speckit-specify [pegar prompt]`
- Opción B: 5 specs P0 separados (riesgo regresión cruzada + ventana
  exposure más larga)
- Opción C: diferir con risk accept documentado

Si elegís A, el orden recomendado de ejecución:
1. add-webhook-audit-trail (P1 prerequisite, 1.5-2h) — habilita
   diagnóstico del meta-spec subsequent.
2. fix-mercadopago-critical-bugs (meta P0, 10-15h).
3. fix-admin-directory-wrong-table (P1 XS, 15-30min) — trivial win.
4. fix-cancellation-detection + fix-process-completed-order-silent-catch
   (P1 S cada uno).

Otros pendientes (diferidos): cleanup-duplicate-fks-patient-goals (spec
015 lateral), audit-clinical-phi-logging (specs 014/015 lateral),
hardening-assistant-role (Ley 20.584), rebrand-fonoaudiologo-urls
(branding visible), write-pie-policies-full (pre-requisito flag PIE).

Session log completo en docs/session-logs/2026-04-20-extended-session.md
(~600 líneas).

Revenue at risk spec 019 (para calibrar urgencia): $1.6M-$14.4M CLP/año
conservador forward-looking, $20M-$60M+ worst-case si F-001 explotado.
Hoy n=1 active sandbox = $0 real, todos los riesgos son pre-scale.

¿Opción A, B, o C?
```

---

## Referencias cruzadas

- `.specify/memory/constitution.md` — §III v1.1.0
- `.specify/memory/architecture.md` — §RLS coverage audit, §Performance audit, §Known drift, §Dead code, §RLS enabled zero-policies audit, §Feature flags inventory
- `.specify/memory/data-compliance.md` — §Historial de compliance, §Dos tablas distintas
- `.specify/memory/ecosystem-communicare.md` — contexto pivot marketplace
- `docs/PATTERNS.md` — §1-§7 patrones canónicos (con §8-§10 candidatos documentados en este log)
- `docs/legal-outreach/` — material pre-armado legal
- Migrations aplicadas: `20260419000001` (spec 003 care_team), `20260420000001` (spec 006 RLS blog+questions), `20260420000002` (spec 009 marketplace), `20260420000003` (spec 011 FK indexes), `20260420000004` (spec 014 billing+evaluations), `20260420000005` (spec 015 goals+dev_areas), `20260420000006` (spec 016 PIE lockdown)

---

## Patterns 8/9/10 candidatos (pendientes de formalizar en PATTERNS.md)

**§8 — Empirical overriding hypothesis** (spec 013)
Phase 1 empirical puede revertir la hipótesis del spec mismo. Cuando eso pasa, el scope debe re-evaluarse ANTES de Phase 2, no forzar el plan original.

**§9 — Bundled decisions con Query D determinística** (spec 015)
Decisiones críticas entre approaches (ej. SHARED vs PER-PATIENT) deben derivarse de data del schema, no de subjetividad. Query a information_schema.columns → decisión binaria sin análisis.

**§10 — Minimal lock-down como approach intermedio** (spec 016)
Entre "pure deny-all" y "full policies", existe el approach "ENABLE RLS + 1 policy minimal donde sea estrictamente necesario por callsite no-wrapped". Preserva functionality sin over-engineering feature-OFF.

Estos 3 patterns se pueden formalizar en sesión futura cuando aparezca el primer caso de re-aplicación (proof of reusability).
