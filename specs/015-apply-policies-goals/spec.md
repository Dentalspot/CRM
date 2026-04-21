# Feature Specification: Apply Policies — patient_goals + patient_development_areas (bundled)

**Feature Branch**: `015-apply-policies-goals`
**Created**: 2026-04-20
**Status**: Draft
**Input**: Cierre de la 3ra (y última) tabla de GROUP B del audit spec 012. `patient_goals` + `patient_development_areas` se bundlean en 1 sola migración porque `patient_development_areas` se accede principalmente via FK embed desde `patient_goals` — policies coordinadas evitan que un embed válido caiga por falta de policy en la tabla embebida. Constitution §II driver, réplica del patrón canónico aplicado en spec 014 migration `20260420000004` (con ajustes schema ya validados: `patient_care_team.dentist_id`, `is_active=true`, `patients.profile_id`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Terapeuta asignado gestiona objetivos con áreas de desarrollo embebidas (Priority: P1)

Un terapeuta del `patient_care_team` de un paciente crea/edita/lee los `patient_goals` del paciente. En la consulta de `patient_goals`, el cliente hace FK embed a `patient_development_areas` (el "área" del objetivo, p.ej. "estética", "funcionalidad", "preventivo"). Ambas lecturas deben retornar data.

**Why this priority**: este es el flujo principal que consumen los 2 callsites frontend conocidos de `patient_goals`. Si el embed falla porque `patient_development_areas` no tiene policy, el terapeuta ve el goal sin el área → UX rota pero no crash. La policy sobre la tabla embebida es **requisito del bundle**.

**Independent Test**: como terapeuta T1 asignado al care_team del paciente P1, crear 1 `patient_goal` referenciando un `patient_development_area` existente. Luego `SELECT *, area:patient_development_areas!...(name) FROM patient_goals WHERE patient_id = P1` retorna el goal con el área embebida poblada (no null). Como T2 NO en care_team, la misma query retorna array vacío (aislamiento correcto).

**Acceptance Scenarios**:

1. **Given** terapeuta T1 con `patient_care_team.dentist_id = T1 AND patient_id = P1 AND is_active = true`, **When** T1 ejecuta `INSERT INTO patient_goals (patient_id, development_area_id, ...) VALUES (P1, DA1, ...)`, **Then** el goal se crea.
2. **Given** mismo estado + al menos 1 goal creado, **When** T1 ejecuta `SELECT *, area:patient_development_areas!patient_goals_development_area_id_fkey (id, name) FROM patient_goals WHERE patient_id = P1`, **Then** retorna goal(s) con `area` populado (no null).
3. **Given** terapeuta T2 NO en care_team de P1, **When** ejecuta la misma SELECT, **Then** retorna array vacío.
4. **Given** terapeuta T2 NO en care_team de P1 que intenta leer directamente `patient_development_areas`, **When** `SELECT * FROM patient_development_areas WHERE id = DA1`, **Then** depende de diseño: si DA es "global" (shared catalog), podría ser visible; si es "per-patient" filtrado vía care_team, retorna vacío. **Phase 1 Query D** confirma estructura y FK.

---

### User Story 2 — Paciente lee sus propios goals (Priority: P2)

Un paciente autenticado (mapping `patients.profile_id = auth.uid()`) puede leer sus propios `patient_goals` (visibilidad de su plan terapéutico). Lectura read-only — no puede editar.

**Why this priority**: `patient_goals` contiene data clínica que el paciente debe poder consultar (Ley 20.584 art. 12 — derecho del paciente a acceder a su información clínica). Aunque la feature UI para el paciente pueda no estar 100% activa, la policy debe existir pre-launch.

**Independent Test**: paciente P1 autenticado con `patients.profile_id = auth.uid()`. Ejecutar `SELECT * FROM patient_goals WHERE patient_id = self` devuelve sus goals. Intentar `INSERT/UPDATE/DELETE` retorna error 42501 (permission denied).

**Acceptance Scenarios**:

1. **Given** paciente P1 autenticado mapeado via `patients.profile_id = auth.uid()`, **When** ejecuta SELECT sobre sus `patient_goals`, **Then** retorna sus goals.
2. **Given** mismo estado, **When** intenta INSERT/UPDATE/DELETE, **Then** rechazo con permission denied (policy solo FOR SELECT).

---

### User Story 3 — Admin manage + edge functions service_role siguen operando (Priority: P3)

Admin dashboard (futuro — spec 012 no listó callsites admin de `patient_goals`) tiene acceso completo vía policy admin. Las 4 edge functions que consumen `patient_goals` (`suggest-treatment`, `rag-query`, `analyze-progress`, `recommend-purchases`) usan `service_role` → **bypass RLS**, no afectadas por las policies nuevas.

**Why this priority**: garantiza que las policies no rompen infra existente (edge functions AI) ni cierran la puerta a admin tooling futuro. P3 porque es validación no-regresión, no nueva funcionalidad.

**Independent Test**: simular llamada con `service_role` JWT sobre `patient_goals` — debe continuar retornando todas las filas sin filtro RLS. Admin autenticado con `profiles.role = 'admin'::user_role` hace CRUD sobre `patient_goals` y `patient_development_areas` sin restricción.

**Acceptance Scenarios**:

1. **Given** edge function con `service_role` key, **When** hace CRUD sobre `patient_goals` o `patient_development_areas`, **Then** opera sin aplicación de RLS (bypass estándar Supabase).
2. **Given** admin autenticado, **When** ejecuta CRUD sobre ambas tablas, **Then** opera sin restricción.
3. **Given** rollback del spec 015 ejecutado, **When** Danissa verifica pg_policies, **Then** count=0 para ambas tablas + rowsecurity sigue true.

---

### Edge Cases

- **Shared vs per-patient `patient_development_areas`**: la tabla puede ser (a) catálogo global compartido entre todos los pacientes (p.ej. lista fija de áreas "estética/funcionalidad/preventivo") o (b) per-patient (cada paciente tiene sus propias áreas custom). Si es (a), la policy "Therapists manage" vía care_team **rompería** accesos globales — necesitaríamos policy "Everyone read patient_development_areas" FOR SELECT. Si es (b), care_team policy es correcta. **Phase 1 Query D decide**: si la tabla tiene columna `patient_id` → per-patient (b); si no → catálogo (a) y policies distintas.
- **FK embed path naming**: el cliente probablemente usa `area:patient_development_areas!patient_goals_development_area_id_fkey(...)`. Phase 1 valida el constraint name real via `information_schema.table_constraints`.
- **Edge functions service_role bypass**: spec 012 confirmó 4 edge functions. Si una nueva edge function se creó entre spec 012 y spec 015 sin `service_role` (con `anon` o usuario-auth), podría fallar post-apply. Phase 1 Query E re-verifica listado de edge functions que consumen estas tablas.
- **Admin policy redundancia con `is_admin` EXISTS**: mismo patrón aplicado en specs 006/009/014. Bajo riesgo. Phase 1 no requiere validación adicional.
- **State drift desde spec 012 a hoy (PATTERNS.md §7)**: mismo patrón de mitigación que spec 014 — pre-check DO $$ aborta si `policy_count > 0` pre-apply.
- **Row count inesperado**: spec 012 documentó 0 filas. Si Phase 1 Query C revela filas, puede ser test data de dev o data real por service_role. No bloquea apply si policies son correctas.
- **Bundle atómico**: las 2 tablas se commitean en 1 migración. Si la parte `patient_goals` aplica pero `patient_development_areas` falla, el DO $$ post-check aborta → rollback inmediato de ambas vía transacción implícita de DDL. Supabase aplica cada CREATE POLICY como statement separado, pero el post-check consolidado captura partial-state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La migración MUST crear 2-3 policies sobre `patient_goals` (Therapists via care_team + Patients read own + Admins manage). Conteo final determinado por Phase 1 (si Phase 1 revela que `patients read` se usa efectivamente, mantener 3; si el flujo no es transparente al paciente aún, evaluar si incluir o no).
- **FR-002**: La migración MUST crear 1-2 policies sobre `patient_development_areas`. Conteo final depende de Phase 1 decisión "shared catalog" vs "per-patient" (edge case). Si catálogo global → probablemente 1-2 policies: "Everyone read" FOR SELECT + "Admins manage" FOR ALL. Si per-patient → 2 policies replicando patrón `patient_goals` (Therapists via care_team + Admins manage).
- **FR-003**: Total policies esperadas: **4-5**. Conteo definitivo en Phase 2 post-Phase 1 decisions.
- **FR-004**: La migración MUST ser idempotente — `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY`.
- **FR-005**: La migración MUST incluir pre-check `DO $$` que aborta si `rowsecurity = false` o `policy_count > 0` pre-apply en alguna de las 2 tablas (detecta state drift PATTERNS.md §7).
- **FR-006**: La migración MUST incluir post-check `DO $$` con `policy_count` exacto esperado por tabla (valor definitivo en Phase 2 según decisiones de FR-001/-002) + `rowsecurity=true` preservado en ambas.
- **FR-007**: La migración MUST NO modificar schema ni cambiar `rowsecurity` ni alterar grants. Sin ALTER TABLE salvo el caso improbable que Phase 1 revele `rowsecurity=false` en alguna — en cuyo caso spec abre `[NEEDS CLARIFICATION]` para decidir enable.
- **FR-008**: 1 archivo nuevo exclusivamente: `supabase/migrations/20260420000005_apply_policies_goals_development_areas.sql`.
- **FR-009**: El spec MUST contener batch `DROP POLICY IF EXISTS` de rollback copy-pasteable para las 4-5 policies que se creen.
- **FR-010**: Phase 1 audit MUST validar schema real via `information_schema.columns` para `patient_goals`, `patient_development_areas`, `patient_care_team` (refresh), `patients` (refresh), `profiles` (refresh). Decide "shared vs per-patient" para `patient_development_areas` observando presencia/ausencia de columna `patient_id` en esa tabla (Constitution §VI Schema Drift Zero).
- **FR-011**: La migración MUST NO tocar edge functions ni service_role grants. Edge functions con service_role continúan operando sin cambios (bypass RLS es propiedad del role, no del schema).
- **FR-012**: Phase 3 apply en 4 partes para trazabilidad: Parte 1 pre-check read-only, Parte 2 apply `patient_goals` policies, Parte 3 apply `patient_development_areas` policies, Parte 4 post-check consolidado.

### Key Entities

- **patient_goals**: tabla de objetivos terapéuticos por paciente. Estructura asumida: `id`, `patient_id` (FK patients), `development_area_id` (FK patient_development_areas), campos de objetivo (título, descripción, status, fechas). RLS enabled, 0 policies pre-spec. 2 callsites frontend + 4 edge functions service_role (`suggest-treatment`, `rag-query`, `analyze-progress`, `recommend-purchases`).
- **patient_development_areas**: tabla de áreas de desarrollo/dominios clínicos. Estructura incierta (Phase 1 resuelve): si tiene `patient_id` es per-patient; si solo tiene `id`, `name`, `description` es catálogo global. Accedida principalmente via FK embed desde `patient_goals`. RLS enabled, 0 policies pre-spec.
- **patient_care_team**: ya usado en spec 014 con ajustes confirmados (`dentist_id` + `is_active`). Re-usado aquí.
- **patients**: ya usado en spec 014 con `profile_id = auth.uid()` mapping. Re-usado.
- **profiles**: mismo patrón `is_admin` via `role = 'admin'::user_role`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: post-migration, `pg_policies` count para ambas tablas suma **4 a 5** (valor exacto fijado en Phase 2 post-decisión shared vs per-patient).
- **SC-002**: ambas tablas siguen con `rowsecurity = true` post-migration.
- **SC-003**: 0 regresiones en 2 callsites frontend de `patient_goals` (spec 012 lista las rutas). Si Phase 1 re-grep revela más callsites, cobertura extendida a todos.
- **SC-004**: 4 edge functions (service_role) siguen retornando data al invocarse (smoke test opcional con 1 edge function — p.ej. `suggest-treatment` — para confirmar bypass funciona).
- **SC-005**: smoke test con rows manuales en SQL Editor (patrón spec 014): crear 1 `patient_development_area` + 1 `patient_goal` referenciándola, verificar que T1 (en care_team) ve ambos con embed; T2 (fuera de care_team) ve vacío; admin ve todo; paciente ve sus goals.
- **SC-006**: tiempo total del ciclo spec 015 (Phase 1 + Phase 2 + Phase 3) ≤ **60 min**. Bound superior 90 min antes de STOP + re-evaluar.
- **SC-007**: rollback batch ejecutable en <1 minuto — `pg_policies` count baja a 0 para ambas tablas sin errores.
- **SC-008**: post-spec, `architecture.md §RLS enabled zero-policies audit` refleja GROUP B como 3/3 resueltos (0 pendientes).

## Assumptions

- **Live state estable**: ambas tablas siguen con RLS enabled + 0 policies + row_count=0 (documentado spec 012). Phase 1 confirma.
- **Callsites frontend estables**: los 2 callsites de `patient_goals` documentados en spec 012 siguen existiendo. Phase 1 re-grep confirma.
- **Edge functions service_role**: las 4 edge functions conocidas siguen con `service_role` key (bypass RLS). Sin cambios a su invocación.
- **Schema estable**: `patient_care_team.dentist_id` + `is_active` y `patients.profile_id` confirmados en spec 014. Phase 1 Query D re-valida + descubre estructura de `patient_development_areas`.
- **Admin role stable**: `profiles.role = 'admin'::user_role` patrón canónico ya validado en specs 006/009/014.
- **No nueva tabla derivada**: `patient_development_areas` no fue reemplazada entre spec 012 y 015 por otra tabla o view.
- **Deploy por Danissa**: ejecutor escribe la migración, Danissa aplica en SQL Editor. Split ejecutor/advisor per CLAUDE.md.
- **MCP execute_sql denegado**: mismo contexto operativo que spec 014. Queries via copy-paste al SQL Editor.
- **Constitution §III logger flag**: si Phase 1 detecta lecturas de PHI clínico en `patient_goals` desde frontend sin `useClinicalAccessLogger`, documentar como follow-up (no bloquea 015).

## Scope Bounds

- **In scope**: 1 archivo migration nuevo (`20260420000005_*.sql`), 2 tablas (`patient_goals`, `patient_development_areas`), 4-5 policies totales.
- **Out of scope** (hard boundaries):
  - Otras tablas GROUP C (19 tablas dormant) — scope bound spec 012.
  - Cambios a edge functions de `patient_goals` (service_role bypass permanece).
  - Código aplicación (`src/`): NO edits. Si Phase 1 detecta que el frontend no maneja RLS fail-closed con UX, follow-up UI honesty spec.
  - Audit `useClinicalAccessLogger` en consumidores (follow-up, no bloquea).
  - Tests automatizados.
  - Meta-audit de edge functions que bypassan RLS — ya documentado en spec 012 + architecture.md.
  - Nuevas tablas o columnas.

## Rollback Plan

**Triggers** (cualquiera dispara rollback):
1. **Feature rota post-apply**: consumidor frontend (`patient_goals`) crashea o muestra goals sin `area` embebida donde antes aparecía (solo aplicable si se introdujo row de test — pre-test tabla vacía es empty state esperado).
2. **policy_count post ≠ esperado** (4 o 5 según Phase 2): post-check `DO $$` aborta.
3. **Edge function service_role falla**: smoke test de `suggest-treatment` (u otra) retorna error post-apply cuando pre-apply retornaba success — indica que algo en la migration rompió el bypass (no esperado pero cobertura defensiva).

**Acción**:
```sql
-- Batch rollback spec 015 (copy-paste al SQL Editor)
-- Ajustar nombres según Phase 2 decisión (shared vs per-patient para patient_development_areas)

DROP POLICY IF EXISTS "Therapists manage own patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Patients read own goals" ON patient_goals;
DROP POLICY IF EXISTS "Admins manage patient_goals" ON patient_goals;
DROP POLICY IF EXISTS "Therapists manage own patient development areas" ON patient_development_areas;
-- Si Phase 2 eligió shared catalog, reemplazar la line anterior con:
-- DROP POLICY IF EXISTS "Everyone read patient_development_areas" ON patient_development_areas;
DROP POLICY IF EXISTS "Admins manage patient_development_areas" ON patient_development_areas;

-- Verificar
SELECT tablename, COUNT(*) FROM pg_policies
WHERE tablename IN ('patient_goals', 'patient_development_areas')
GROUP BY tablename;
-- Esperado: 0 rows (ambas tablas sin policies), estado pre-spec 015 restaurado
```

**NO rollback** (falsos positivos):
- Array vacío para terapeuta sin care_team assignments reales (0 rows match = empty state correcto).
- Admin dashboard paginación vacía si tablas están vacías.
- Time overrun del 60-min estimate si no hay bugs.

**Non-rollback alternative**: si post-apply se detecta predicate incorrecto en 1 policy específica (p.ej., constraint name erróneo en FK embed, patrón dentist_id mal escrito), corregir con spec micro-fix 015.1. Reservar full rollback para fallas sistémicas.

## Dependencies

- **Constitution §II (RLS-First Security)**: driver principal.
- **Constitution §IV (Micro-Bloques)**: bound a 1 migration + 2 tablas (bundled por FK embed, justificado).
- **Constitution §VI (Schema Drift Zero)**: FR-010 Phase 1 Query D.
- **Constitution §III (Append-Only Audit)**: flag indirecto — si `patient_goals` tiene lecturas de PHI clínico desde staff, consumer debe invocar `useClinicalAccessLogger`. Follow-up si ausente, no bloquea.
- **spec 012 (`audit-rls-enabled-zero-policies`)**: fuente del Template 3 (`data-model.md §Follow-up specs` líneas 235-255). Este spec aplica Template 3 ajustado con schema validado en spec 014.
- **spec 014 (`apply-policies-billing-evaluations`)**: patrón canónico directo — replica de la migration `20260420000004` con 5 policies + DO $$ pre/post-check + ajustes de schema ya validados en producción. Bar-raiser para este spec.
- **spec 009 (`restore-marketplace-purchases-policies`)**: patrón original de DO $$ pre-check + DROP IF EXISTS + rollback comentado.
- **PATTERNS.md §4 (audit defensivo)**: Phase 1.
- **PATTERNS.md §7 (state drift re-verification)**: pre-check.
- **spec 003 migration `20260419000001_repair_patient_care_team.sql`**: fuente del schema `patient_care_team` (`dentist_id` + `is_active`).
