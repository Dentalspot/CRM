# Feature Specification: Audit Cross-Org Query Isolation

**Feature Branch**: `017-audit-cross-org-isolation`
**Created**: 2026-04-20
**Status**: Draft (discovery pure)
**Input**: Hallazgo lateral de spec 013 Phase 1 — durante Playwright baseline pre-fix, Cristóbal (multi-org: Los Álamos + Bulnes) con dropdown en `"Seleccionar organización"` y `currentOrganizationId = null` aún veía 4 pacientes en `/patients`. Tres hipótesis posibles: (a) queries filtran solo por `therapist_id` (org ignorado); (b) queries usan `currentOrganizationId` pero con fallback si null; (c) coincidencia (los 4 pacientes son de una sola org). Spec de **discovery pure**: auditar queries consumers + verificar empíricamente + decidir si leak es real y merece spec P0 follow-up.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Confirmar o descartar leak cross-org en `/patients` (Priority: P1)

Danissa sospecha un leak cross-org real porque un dentista multi-org visualizó pacientes sin haber seleccionado una organización explícitamente. Necesita saber: ¿el bug existe? ¿Cuál es el alcance (cuántas tablas + cuántos callsites afectados)? Sin esta respuesta, no puede priorizar el fix.

**Why this priority**: si el leak es real, es bug P0 de seguridad (data de clínica A visible a terapeuta de clínica B por accidente) — cierra ventana de exposición que afecta a cualquier dentist multi-org (patrón real en Chile: dentistas trabajando en 2+ clínicas simultáneas). Si el leak NO es real, el tiempo invertido en discovery evita spec innecesario (anti-scope-creep).

**Independent Test**: al cierre de este spec, Danissa tiene (a) matriz de callsites consumers con filter usado + null-handling + veredicto; (b) evidencia empírica directa (queries SQL) mostrando si hay rows de organization_id no seleccionada visible al user; (c) veredicto binario: **LEAK CONFIRMADO** (→ abrir spec P0 fix) o **LEAK DESCARTADO** (→ documentar como hipótesis (c) y cerrar).

**Acceptance Scenarios**:

1. **Given** spec 017 cerrado con LEAK CONFIRMADO, **When** Danissa consulta `data-model.md §Verdict`, **Then** encuentra scope preparado para spec follow-up `fix-cross-org-query-isolation` (listado archivos a editar + tablas afectadas).
2. **Given** spec 017 cerrado con LEAK DESCARTADO, **When** Danissa consulta `architecture.md §"Cross-org isolation audit"`, **Then** encuentra nota documentando que el hallazgo spec 013 fue falso positivo + explicación (coincidencia o diseño intencional).
3. **Given** Phase 1 detecta N callsites con null-handling ambiguo, **When** se ejecuta Phase 2 empírica, **Then** para cada callsite ambiguo hay evidencia SQL directa que clasifica "leak real" o "diseño correcto".

---

### User Story 2 — Preparar scope para spec follow-up si leak confirmado (Priority: P2)

Si el audit revela leak, el siguiente paso es fixearlo. Para evitar que el fix se disperse (Constitution §IV Micro-Bloques), este spec prepara el scope del follow-up: lista exacta de archivos, tablas, callsites a modificar, estrategia (RLS policy tightening vs query-level filter), y estimación tiempo.

**Why this priority**: reduce fricción para arrancar el fix. Sin scope preparado, spec P0 tardaría más en diseñarse. Priority P2 porque es output condicional de US1 (solo aplica si leak confirmado).

**Independent Test**: si `data-model.md §Verdict = LEAK CONFIRMADO`, la sección `§Follow-up spec scope` contiene:
- Lista exhaustiva de callsites a fixear con línea exacta.
- Tablas afectadas con columna filter faltante.
- Estimación tiempo del fix (T-shirt sizing: S/M/L).
- Decisión recomendada: RLS policy ajustada (preferido per Constitution §II) vs frontend filter added (más rápido pero menos robusto).

**Acceptance Scenarios**:

1. **Given** LEAK CONFIRMADO, **When** Danissa abre follow-up spec, **Then** puede copiar el scope desde `data-model.md §Follow-up spec scope` directo al prompt de `/speckit-specify`.
2. **Given** LEAK CONFIRMADO con N tablas afectadas, **When** el follow-up se divide en micro-bloques per §IV, **Then** `§Follow-up spec scope` sugiere división (ej. "split en 2 specs: P0 patients table + P1 appointments table").

---

### User Story 3 — Actualizar architecture.md con findings (Priority: P3)

Post-spec, `architecture.md` tiene subsección `§"Cross-org isolation audit"` con: fecha auditoría, metodología (grep + empírica), veredicto, cuántos callsites auditados, enlace al follow-up spec si se abrió. Consolidación para que futuras sesiones tengan contexto.

**Why this priority**: P3 porque es consolidación documental, no bloquea la decisión operativa. Pero importante para que el audit no se pierda en el histórico de specs.

**Independent Test**: post-close, Danissa consulta `architecture.md` y encuentra la subsección nueva con fecha, resultado, y link al spec follow-up (si aplica).

**Acceptance Scenarios**:

1. **Given** spec 017 cerrado, **When** Danissa greps `"Cross-org isolation"` en `architecture.md`, **Then** encuentra subsección con verdict + metodología + N callsites auditados.
2. **Given** LEAK DESCARTADO (hipótesis c), **When** se actualiza architecture.md, **Then** la subsección clasifica el hallazgo como "Known non-bug" con explicación para evitar re-auditoría futura.

---

### Edge Cases

- **Phase 1 revela mezcla de callsites**: algunos null-safe, algunos no. Veredicto mixto — spec clasifica cada callsite individualmente en matriz, y `§Verdict` decide si el leak agregado es material. Si >0 callsites leak y >0 rows de test confirman → LEAK CONFIRMADO. Si todos los callsites sospechosos retornan vacío empíricamente → veredicto NULO (inconclusive) → documentar como "Low-risk, no urgent fix" en architecture.md.
- **RLS policies ya existen cerrando el leak**: es posible que aunque el código frontend no filter por `organization_id`, la policy RLS sí lo haga via `patient_care_team` subquery u otra barrera. Phase 1 Query D (schema) + revisión policies existentes determina si RLS es suficiente aunque frontend no filter explícito. Si RLS sí filtra → LEAK DESCARTADO (defense-in-depth con RLS es el patrón canónico DentalSpot).
- **Callsite usa hook wrapper que filtra internamente**: algunos hooks (ej. `useAppointments`) pueden recibir `organizationId` como argumento y filtrar internamente. Phase 1 debe trazar el data flow, no quedarse en el callsite inmediato.
- **Admin users con ver-todo**: admin role legítimamente ve data cross-org. Phase 1 excluye admin callsites del análisis de leak (admin policy FOR ALL es diseño, no bug).
- **Service role edge functions**: bypass RLS por diseño. Excluir del análisis.
- **Cristóbal efectivamente tiene 4 pacientes en una sola org**: Phase 2 Query C descarta esta hipótesis empíricamente — si todos los pacientes tienen el mismo `organization_id`, y ese match la org "seleccionada implícitamente" como primera org del user, no es leak.
- **currentOrganizationId=null vs currentOrganizationId="first-org"**: tras spec 013 Phase 3 fix, el default ya NO es null sino primera org. Este spec audita el comportamiento que existió PRE-spec 013 fix (null) + el comportamiento post-fix (first-org) — ambos deben ser cross-org safe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Phase 1 audit MUST identificar todos los callsites de `useCurrentOrganization` en `src/` + todos los callsites de queries a tablas que tienen columna `organization_id` (greps independientes, cruzados en matriz).
- **FR-002**: Para cada callsite identificado, la matriz MUST clasificar: (a) archivo:línea, (b) tabla consultada, (c) filter usado (`.eq('organization_id', X)` o `therapist_id` o combinado), (d) null-handling (qué pasa si `currentOrgId === null`), (e) veredicto (`cross-org safe` / `leak potencial` / `unclear — requiere Phase 2 empírica`).
- **FR-003**: Phase 2 MUST ejecutar ≥3 queries directas de verificación empírica en SQL Editor via Danissa:
  - Query α: tablas que tienen columna `organization_id` (listar desde `information_schema`).
  - Query β: para Cristóbal (user multi-org confirmado), `SELECT DISTINCT organization_id FROM <tabla>` para cada tabla candidata, filtrado por `therapist_id = '<cristobal-uuid>'` (o equivalente según schema).
  - Query γ: si Query β revela que Cristóbal tiene data en ≥2 organizations en una tabla, verificar vía policy simulation que al autenticar como Cristóbal + setear `currentOrganizationId='Los Álamos'`, solo ve rows de Los Álamos.
- **FR-004**: Spec MUST emitir veredicto binario claro en `data-model.md §Verdict`: **LEAK CONFIRMADO** o **LEAK DESCARTADO** o (casos mixtos) **LEAK PARCIAL — N callsites afectados**. No ambigüedad.
- **FR-005**: Si veredicto = LEAK CONFIRMADO, MUST preparar `data-model.md §Follow-up spec scope` con:
  - Lista archivos a editar (línea exacta).
  - Tablas afectadas + columna filter faltante.
  - Decisión recomendada (RLS tightening vs frontend filter).
  - Estimación tiempo (S/M/L).
- **FR-006**: Post-close, `architecture.md` MUST tener nueva subsección `§"Cross-org isolation audit (2026-04-20)"` con: fecha, metodología, callsites auditados count, veredicto, link al spec follow-up (si aplica).
- **FR-007**: Spec MUST NO modificar código fuente (`src/**`), migraciones (`supabase/migrations/**`), ni edge functions. Discovery pure — si se detecta fix necesario, el fix va en spec separado (Constitution §IV).
- **FR-008**: Spec MUST NO crear migration file. Si Phase 2 sugiere cambios RLS policy, es input para follow-up spec.
- **FR-009**: Phase 1 MUST excluir del análisis de leak: (a) callsites admin con policy FOR ALL (acceso cross-org diseño), (b) edge functions con service_role (bypass RLS diseño), (c) wrappers de hooks que solo pasan argumentos sin query directa.
- **FR-010**: Phase 2 empírica MUST ejecutarse vía Danissa en Supabase SQL Editor (MCP execute_sql denegado por contexto). Ejecutor provee SQL copy-paste.

### Key Entities

- **`useCurrentOrganization` hook** (`src/hooks/useCurrentOrganization.js`): wrapper del `OrganizationContext` que expone `currentOrganizationId`. Fuente canónica de la "org seleccionada".
- **Callsite types**: (a) query directa Supabase (`.from('tabla').select(...).eq(...)`), (b) wrapper hook que recibe `organizationId` como arg, (c) constante/display only.
- **Tablas candidatas para leak**: cualquier tabla con columna `organization_id` (enumerada Phase 2 Query α). Candidatos probables según architecture.md: `patients`, `appointments`, `billing_invoices`, `clinical_records`, `treatment_plans`, etc.
- **User multi-org de referencia**: Cristóbal (`4e55fb74-b3b5-4233-9b5d-88d7a01a9046`), confirmado pertenecer a Los Álamos + Bulnes vía spec 013 Playwright baseline.
- **Policies RLS existentes**: tablas como `patients`, `patient_evaluations`, `patient_goals` tienen policies via `patient_care_team.dentist_id + is_active` (specs 014/015). Audit verifica si esas policies son suficientes para cross-org isolation o si queda gap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: matriz de callsites en `data-model.md` cubre ≥95% de callsites consumers (verificable por re-grep cruzado). Missing <5% aceptable para casos edge (ej. callsites en scripts deprecated).
- **SC-002**: ≥3 queries empíricas ejecutadas via Danissa, outputs documentados en `data-model.md §Empirical verification`.
- **SC-003**: veredicto emitido sin ambigüedad (1 de 3 valores: CONFIRMADO / DESCARTADO / PARCIAL). 0 casos "inconclusive" sin razón documentada.
- **SC-004**: si LEAK CONFIRMADO, scope de follow-up spec preparado en <10 min (copy-paste al `/speckit-specify`).
- **SC-005**: post-close, `architecture.md §"Cross-org isolation audit"` existe con fecha 2026-04-20 + veredicto + N callsites auditados.
- **SC-006**: tiempo total del ciclo spec 017 ≤ **45 min**, bound superior 60 min antes de STOP.

## Assumptions

- **Phase 2 via Danissa**: MCP execute_sql denegado (contexto heredado de specs 007-016). Queries SQL Editor.
- **Cristóbal multi-org usable**: user `4e55fb74-...` sigue siendo multi-org (Los Álamos + Bulnes) como confirmado en spec 013.
- **Discovery pure, no code changes**: si el audit detecta fix, se abre spec separado. Constitution §IV estricto.
- **`organization_id` column es el identificador canónico**: el schema DentalSpot usa este nombre (no `org_id`, no `clinic_id`). Phase 1 Query α confirma.
- **RLS policies tardías pueden cerrar el leak**: defense-in-depth es el patrón canónico — el frontend puede no filtrar pero RLS sí. Phase 1 considera ambas capas.
- **Admin + service_role excluidos**: diseño intencional, no bugs.
- **Time budget 30-45 min**: spec es lightweight (discovery, sin code edits).

## Scope Bounds

- **In scope**: grep exhaustivo callsites + matriz de análisis + ≥3 queries empíricas + veredicto documentado + (condicional) scope follow-up + update `architecture.md`.
- **Out of scope** (hard boundaries):
  - Fix del leak (spec separado si confirmado).
  - Modificación código fuente (`src/**`).
  - Modificación migraciones / RLS policies (`supabase/**`).
  - Edge functions.
  - Tests automatizados.
  - Auditoría de otras modalidades de leak (cross-role, cross-feature, etc.) — solo cross-org.
  - Tabla `profiles` (org-less, no aplica).
  - Audit queries de admin dashboard (FR-009 excluye).

## Rollback Plan

**N/A — discovery pure**. No hay cambios aplicables al codebase ni al DB. Si el veredicto resulta erróneo post-close (p.ej. descartó leak que luego aparece), se re-abre audit en nuevo spec con hallazgos adicionales.

**Única acción reversible**: actualización de `architecture.md §"Cross-org isolation audit"`. Si el veredicto original se invalida, edit directo sin spec (doc hygiene).

## Dependencies

- **Constitution §II (RLS-First Security)**: driver principal. Si leak confirmado, es violación §II.
- **Constitution §IV (Micro-Bloques)**: discovery pure sin code changes. Fix es spec separado.
- **spec 013 (`ux-persistent-org-context`)**: fuente del hallazgo lateral (Phase 1 Playwright baseline reveló 4 pacientes con currentOrgId=null). data-model.md spec 013 documenta el hallazgo.
- **spec 014 (`apply-policies-billing-evaluations`)**: referencia para policies `patient_evaluations` via `patient_care_team.dentist_id + is_active`. Phase 1 verifica si estas policies cubren cross-org.
- **spec 015 (`apply-policies-goals`)**: referencia adicional (patient_goals policies similares).
- **architecture.md §"RLS coverage audit"**: contexto RLS policies, si existen, para tablas como `patients`, `patient_evaluations`.
- **PATTERNS.md §4 (audit defensivo)**: Phase 1 grep + empírica cruzada.
- **Constitution §V (UI Honesty)**: el dropdown vacío con data visible SERÍA violación §V si confirmado (user engañado sobre el alcance de su vista).
