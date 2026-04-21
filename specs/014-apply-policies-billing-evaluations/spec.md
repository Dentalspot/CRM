# Feature Specification: Apply Policies — billing_invoices + patient_evaluations

**Feature Branch**: `014-apply-policies-billing-evaluations`
**Created**: 2026-04-20
**Status**: Draft
**Input**: Aplicación preventiva de 2 de los 3 templates GROUP B identificados en spec 012 (`audit-rls-enabled-zero-policies`). Tablas con RLS enabled + 0 policies = fail-closed. Cuando alguna feature inserte la primera fila, cualquier `SELECT` sin `service_role` retornará vacío silencioso. Fix es escribir las policies antes de que llegue data real. Constitution §II driver.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Billing visible para terapeuta con policies aplicadas (Priority: P1)

Un terapeuta (dentista) abre `BillingHistory` en la webapp (`src/features/membership/components/BillingHistory.jsx:27`). Hoy — pre-spec 014 — si la tabla `billing_invoices` llegara a tener filas, el terapeuta vería array vacío silencioso (RLS fail-closed, 0 policies = 0 filas visibles). Post-spec 014, el terapeuta verá **sus** facturas (filter `therapist_id = auth.uid()`) y NO las de otros terapeutas.

**Why this priority**: `billing_invoices` es la tabla más próxima a recibir data real — la integración de cobros se está preparando para Q2-2026. Si llega la primera fila antes del fix, la feature se rompe silenciosamente y el bug es difícil de diagnosticar (dropdown y listados vacíos sin error visible — violación Constitution §V UI Honesty). Priorizarla primero mitiga riesgo de fallo en producción.

**Independent Test**: aplicar solo las 2 policies de `billing_invoices` (skip `patient_evaluations`) y validar con test row manual en SQL Editor: `INSERT INTO billing_invoices (therapist_id, ...) VALUES (<cristobal_uuid>, ...); SELECT ... FROM billing_invoices;` como terapeuta Cristóbal devuelve la fila; como otro terapeuta devuelve vacío; como admin devuelve la fila.

**Acceptance Scenarios**:

1. **Given** `billing_invoices` con RLS enabled + 2 nuevas policies aplicadas, **When** terapeuta autenticado ejecuta `SELECT * FROM billing_invoices`, **Then** ve solo filas donde `therapist_id = auth.uid()`.
2. **Given** mismo estado, **When** admin autenticado ejecuta `SELECT * FROM billing_invoices`, **Then** ve todas las filas.
3. **Given** mismo estado, **When** admin ejecuta `UPDATE billing_invoices SET amount = ... WHERE id = ...`, **Then** la update pasa (policy FOR ALL con `WITH CHECK (is_admin)`).

---

### User Story 2 — patient_evaluations escribible por care_team + legible por paciente (Priority: P2)

Un terapeuta del `patient_care_team` de un paciente crea una evaluación (`src/lib/patientApi.js:189`). El paciente propio puede ver su evaluación (`:159`). Otro terapeuta NO en el care_team NO puede leerla. Admin manage completo.

**Why this priority**: `patient_evaluations` también está en GROUP B (pre-launch preventivo). Menor urgencia que billing porque la UI del feature aún no está en producción activa, pero igual requiere cerrar antes de primer insert. Patrón más complejo que billing: involucra `patient_care_team` subquery (multi-terapeuta) + lectura por paciente.

**Independent Test**: post-policy aplicada, insertar fila como terapeuta asignado al care_team del paciente (INSERT OK), leerla como ese mismo terapeuta (SELECT devuelve), leerla como otro terapeuta NO en care_team (SELECT vacío), leerla como el propio paciente (SELECT devuelve).

**Acceptance Scenarios**:

1. **Given** terapeuta T1 asignado al care_team del paciente P1, **When** T1 ejecuta `INSERT INTO patient_evaluations (patient_id, ...) VALUES (P1, ...)`, **Then** la fila se crea y T1 puede leerla.
2. **Given** terapeuta T2 NO en care_team de P1, **When** T2 ejecuta `SELECT * FROM patient_evaluations WHERE patient_id = P1`, **Then** retorna array vacío.
3. **Given** paciente P1 autenticado con perfil que mapea a `patients.patient_user_id = auth.uid()`, **When** P1 ejecuta `SELECT * FROM patient_evaluations WHERE patient_id = self`, **Then** ve sus evaluaciones.
4. **Given** admin autenticado, **When** ejecuta cualquier CRUD sobre `patient_evaluations`, **Then** opera sin restricción.

---

### User Story 3 — Rollback seguro si smoke tests detectan regresión (Priority: P3)

El ejecutor aplica la migración. Phase 3 smoke tests (BillingHistory.jsx + flow patient_evaluations si hay UI activa) revelan regresión (feature rota, crash, data mostrada incorrectamente). Danissa ejecuta `DROP POLICY IF EXISTS` batch documentado — las 5 policies se remueven idempotentemente, RLS permanece enabled (estado pre-spec restaurado: enabled + 0 policies). Si el problema es catastrófico (storage corrupto, etc.), fallback a `DISABLE RLS` temporal.

**Why this priority**: todo cambio a RLS tiene riesgo. Un rollback ordenado cierra el ciclo — sin rollback plan, un bug post-apply deja el sistema en estado inconsistente.

**Independent Test**: dry-run del batch DROP POLICY en dev branch de Supabase: `DROP POLICY IF EXISTS ... ON billing_invoices; ...` 5 veces, luego `SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('billing_invoices', 'patient_evaluations')` debe retornar 0.

**Acceptance Scenarios**:

1. **Given** migración aplicada con 5 policies, **When** Danissa ejecuta el batch de rollback `DROP POLICY IF EXISTS`, **Then** `pg_policies` count baja a 0 sin error.
2. **Given** rollback ejecutado, **When** Danissa verifica `pg_tables.rowsecurity`, **Then** ambas tablas siguen con rowsecurity=true (no se desactivó RLS).

---

### Edge Cases

- **Callsite drift desde spec 012**: los callsites pueden haber cambiado nombre, ruta o desaparecido. Phase 1 de este spec **re-greps** los callsites literales antes de escribir la migration. Si un callsite desapareció, documentar y ajustar.
- **Schema drift sobre columna filtro**: las policies asumen `billing_invoices.therapist_id UUID NOT NULL` y `patient_evaluations.patient_id UUID FK patients(id)`. Si el schema real difiere (p.ej., la columna se llama `dentist_id` o `professional_id`), las policies quedan rotas. Phase 1 Query A ampliada: inspeccionar columnas de ambas tablas via `information_schema.columns` antes de escribir la policy.
- **Rows > 0 inesperadas**: spec 012 documentó row_count=0 en ambas. Si Phase 1 Query C revela filas inesperadas, investigar origen antes de aplicar (pueden haber llegado entre audit y apply). Las policies deben seguir siendo correctas aunque haya data, pero un insert silencioso inesperado sugiere service_role bypass no previsto.
- **Audit §III clinical access logging**: `patient_evaluations` contiene PHI. Post-policy, las lecturas por staff clínico deben invocar `useClinicalAccessLogger` en el frontend (Constitution §III v1.1.0). El logger no es parte de este spec (es responsabilidad del consumer), pero se documenta como pre-requisito en Phase 3 verification — confirmar que `patientApi.js:159` ya invoca el logger o marcar follow-up.
- **`patient_care_team` schema no confirmado**: la policy "Therapists manage own patient evaluations" depende de la estructura exacta de `patient_care_team`. Phase 1 Query A debe leer columnas de esa tabla para escribir el EXISTS correcto (probable `user_id`/`therapist_id` + `patient_id`).
- **Usuario paciente mapping**: la policy "Patients read own evaluations" requiere mapear `auth.uid()` al `patient_id` de la fila via `patients.patient_user_id` (o columna equivalente). Si el schema usa otro nombre, ajustar. Phase 1 confirma.
- **State drift de spec 012 a hoy (PATTERNS.md §7)**: entre el audit (spec 012 cerrado 2026-04-20) y esta ejecución, alguien puede haber creado policies manualmente. Phase 1 Query B confirma que ambas tablas siguen con policy_count=0. Si ya hay policies, re-evaluar scope antes de avanzar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La migración MUST crear exactamente 2 policies sobre `billing_invoices` (1 SELECT para terapeutas propios + 1 ALL para admins). Nombres canónicos: `"Therapists read own billing_invoices"` y `"Admins manage billing_invoices"`.
- **FR-002**: La migración MUST crear exactamente 3 policies sobre `patient_evaluations` (1 ALL para terapeutas del care_team + 1 SELECT para paciente propio + 1 ALL para admins). Nombres canónicos: `"Therapists manage own patient evaluations"`, `"Patients read own evaluations"`, `"Admins manage patient_evaluations"`.
- **FR-003**: La migración MUST ser idempotente — incluir `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY` para permitir re-run sin error.
- **FR-004**: La migración MUST incluir un pre-check `DO $$ ... $$` que aborta si (a) `rowsecurity = false` en alguna de las 2 tablas, (b) `policy_count > 0` pre-apply en alguna de las 2 (detecta state drift PATTERNS.md §7).
- **FR-005**: La migración MUST incluir un post-check `DO $$ ... $$` que aborta si `policy_count` post ≠ esperado (2 en `billing_invoices`, 3 en `patient_evaluations`).
- **FR-006**: La migración MUST NO incluir ni tocar `patient_goals` ni `patient_development_areas`. Esas 2 tablas quedan out-of-scope (spec futura dedicada cuando bandwidth permita).
- **FR-007**: La migración MUST NO modificar schema de ninguna otra tabla, ni cambiar `rowsecurity` (asume ambas ya están enabled), ni alterar grants ni roles.
- **FR-008**: El spec MUST NO incluir cambios a código aplicación (`src/`) — solo 1 archivo nuevo `supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql`.
- **FR-009**: El documento del spec MUST contener un batch `DROP POLICY IF EXISTS` de rollback copy-pasteable, que al ejecutarse lleva policy_count a 0 sin tocar `rowsecurity`.
- **FR-010**: Phase 1 audit MUST incluir estado de columnas reales via `information_schema.columns` para ambas tablas + `patient_care_team` + `patients`, asegurando que los predicados SQL de las policies referencian columnas existentes (Constitution §VI Schema Drift Zero).

### Key Entities

- **billing_invoices**: tabla de facturación terapeuta. Estructura asumida: `id`, `therapist_id` (FK `auth.users`/`profiles`), `amount`, campos de cobro. RLS enabled, 0 policies pre-spec. 3 callsites frontend (1 therapist + 2 admin).
- **patient_evaluations**: tabla de evaluaciones clínicas por paciente. Estructura asumida: `id`, `patient_id` (FK `patients`), campos evaluación. RLS enabled, 0 policies pre-spec. 2 callsites frontend (`lib/patientApi.js:159` SELECT + `:189` INSERT).
- **profiles**: ya RLS-protected. Se usa en policy admin check via `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'::user_role)`.
- **patient_care_team**: tabla link many-to-many entre `patients` y terapeutas del equipo clínico. Estructura exacta a confirmar en Phase 1 (probable `user_id` + `patient_id`). Se usa en policy `"Therapists manage own patient evaluations"` EXISTS subquery.
- **patients**: fuente para mapear `auth.uid() → patient_id` via columna `patient_user_id` (nombre a confirmar Phase 1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: post-migration, `SELECT COUNT(*) FROM pg_policies WHERE tablename = 'billing_invoices'` retorna **2**; para `patient_evaluations` retorna **3**. Total 5 policies nuevas.
- **SC-002**: post-migration, ambas tablas siguen con `pg_tables.rowsecurity = true` (no se desactivó RLS accidentalmente).
- **SC-003**: 0 regresiones en 3 callsites frontend de `billing_invoices` (`BillingHistory.jsx`, `useInvoices.js`, `commissionsApi.js`) y 2 callsites de `patient_evaluations` (`patientApi.js:159/:189`) durante smoke tests manuales. "Sin regresión" = empty state correcto si tabla vacía, sin errores de consola RLS-related ("permission denied", "insufficient privilege").
- **SC-004**: smoke test con row manual en SQL Editor: insertar 1 fila en `billing_invoices` con `therapist_id = <cristobal>` y 1 en `patient_evaluations` con `patient_id = <paciente_test>` + terapeuta T1 en `patient_care_team`. Luego verificar: Cristóbal ve su factura, otro terapeuta no ve esa factura, admin ve ambas filas. T1 puede leer+escribir la evaluación, T2 no.
- **SC-005**: tiempo total del ciclo spec 014 (Phase 1 audit → Phase 2 migration escrita → Phase 3 apply + verify) ≤ **60 min**. Bound superior 90 min antes de STOP + re-evaluar.
- **SC-006**: rollback batch ejecutable en <1 minuto si se dispara trigger — `pg_policies` count baja a 0 para ambas tablas sin errores.

## Assumptions

- **Live state estable**: las tablas `billing_invoices` y `patient_evaluations` aún están con RLS enabled + 0 policies + 0 rows. Phase 1 confirma antes de proceder (PATTERNS.md §7 state drift detection).
- **Callsites estables**: los 5 callsites documentados en spec 012 (3 billing + 2 evaluations) siguen existiendo en los mismos archivos/líneas ±5 líneas por edits minor. Phase 1 re-grep confirma.
- **Schema de `billing_invoices`**: columna `therapist_id` existe con tipo UUID. Si el nombre difiere, Phase 1 lo detecta via `information_schema.columns` y se ajusta el SQL.
- **Schema de `patient_care_team`**: tabla existe, tiene columnas que vinculan paciente con usuario/terapeuta (probable `patient_id` + `user_id`). Si no existe o el naming difiere, la policy de evaluations debe ajustarse. Phase 1 Query A lo confirma.
- **Schema de `patients`**: columna que mapea `auth.uid() → patient_id` existe (probable `patient_user_id` o `user_id`). Se confirma Phase 1.
- **Admin role stable**: `profiles.role = 'admin'::user_role` es el patrón canónico para admin check. Confirmar en migraciones previas (specs 006/009).
- **Sin edge functions service_role dependency**: no hay edge function actualmente insertando en `billing_invoices` o `patient_evaluations` que dependa de bypass service_role especial. Si surge una en el futuro, policy adicional "Service role manage ..." puede añadirse en spec follow-up.
- **No patient_goals bundled**: `patient_goals` + `patient_development_areas` quedan out-of-scope explícitamente (spec futura si aplica). Evita scope creep Constitution §IV.
- **Deploy lo hace Danissa**: ejecutor escribe la migración pero NO la aplica. Danissa ejecuta parts 1-3 (pre-check, apply, post-verify) en Supabase SQL Editor. Split ejecutor/advisor per CLAUDE.md §Workflow.
- **MCP execute_sql unavailable**: desde sesiones previas, el MCP Supabase execute_sql está denegado para este proyecto. Todas las queries van por Danissa en SQL Editor (ejecutor provee SQL copy-pasteable).
- **No UI de `patient_evaluations` activa**: smoke test Phase 3 se hace via SQL Editor con rows de test; no se requiere test UI end-to-end (la feature frontend está parcialmente desarrollada).

## Scope Bounds

- **In scope**: 1 archivo migration nuevo (`supabase/migrations/20260420000004_apply_policies_billing_evaluations.sql`), 2 tablas (`billing_invoices`, `patient_evaluations`), 5 policies totales.
- **Out of scope** (hard boundaries):
  - `patient_goals` + `patient_development_areas` (spec futura).
  - `service_role` policies (follow-up si surge edge function que las necesite).
  - Cambios a `profiles`, `auth.users`, `patient_care_team`, `patients` (asumen schema estable).
  - Código aplicación (`src/`): NO edits. Si Phase 1 detecta que el frontend no maneja correctamente RLS fail-closed (array vacío sin mensaje), queda como follow-up spec UI honesty, no bloquea spec 014.
  - Nuevas tablas o columnas.
  - Audit `useClinicalAccessLogger` en `patientApi.js`: documentar como follow-up si falta, no bloquea migration.
  - Tests automatizados (el proyecto no tiene test harness RLS aún — bound documentado en `architecture.md`).

## Rollback Plan

**Triggers** (cualquiera dispara rollback):
1. **Feature rota post-apply**: `BillingHistory.jsx` crashea o muestra array vacío consistente donde antes mostraba data (solo aplicable si se introdujo row de test — pre-test tabla vacía es empty state esperado).
2. **policy_count post ≠ esperado**: post-check `DO $$` del script aborta, o manual `SELECT COUNT(*) FROM pg_policies WHERE tablename = ...` retorna valor distinto a 2 o 3.
3. **Consumer frontend crashea**: uno de los 5 callsites (`BillingHistory.jsx:27`, `useInvoices.js:13`, `commissionsApi.js:30`, `patientApi.js:159`, `patientApi.js:189`) lanza error RLS-related visible en DevTools console (`PostgrestError` con código `42501` u otro permission denied).

**Acción**:
```sql
-- Batch rollback spec 014 (copy-paste al SQL Editor)
DROP POLICY IF EXISTS "Therapists read own billing_invoices" ON billing_invoices;
DROP POLICY IF EXISTS "Admins manage billing_invoices" ON billing_invoices;
DROP POLICY IF EXISTS "Therapists manage own patient evaluations" ON patient_evaluations;
DROP POLICY IF EXISTS "Patients read own evaluations" ON patient_evaluations;
DROP POLICY IF EXISTS "Admins manage patient_evaluations" ON patient_evaluations;

-- Verificar
SELECT tablename, COUNT(*) FROM pg_policies
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
GROUP BY tablename;
-- Esperado: 0 rows (ambas tablas sin policies), estado pre-spec restaurado
```

**NO rollback** (falsos positivos):
- Array vacío en `BillingHistory` para terapeuta sin facturas reales (0 rows en tabla = empty state correcto, no es bug).
- Admin UI en `useInvoices.js` mostrando paginación vacía si `billing_invoices` está vacía.
- Time overrun del 60-min estimate si no hay bugs (documentar en session log como aprendizaje).

**Non-rollback alternative**: si post-apply se detecta que una policy específica tiene predicate incorrecto (p.ej., `therapist_id` debe ser `dentist_id`), corregir con spec micro-fix 014.1 en lugar de revert completo. Reservar full rollback para fallas sistémicas.

## Dependencies

- **Constitution §II (RLS-First Security)**: driver principal del spec.
- **Constitution §IV (Micro-Bloques)**: bound a 1 migration + ≤2 tablas. Rechazo de patient_goals bundle es aplicación directa.
- **Constitution §VI (Schema Drift Zero)**: Phase 1 lee `information_schema.columns` para confirmar que cada columna referenciada en policies existe.
- **spec 012 (`audit-rls-enabled-zero-policies`)**: fuente de los templates (`data-model.md §Follow-up specs` líneas 198-234). Este spec aplica Template 1 + Template 2.
- **spec 009 (`restore-marketplace-purchases-policies`)**: patrón canónico de migration structure (`supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`) — réplica estructural con DO $$ pre/post-check + DROP IF EXISTS + rollback comentado.
- **spec 006 (`enable-rls-blog-patient-questions`)**: patrón canónico de ENABLE RLS validation (`20260420000001`). Este spec NO hace ENABLE RLS (ya está), pero la estructura del DO $$ es la misma.
- **PATTERNS.md §4 (audit defensivo)**: Phase 1 re-verifica estado antes de escribir migration.
- **PATTERNS.md §7 (state drift re-verification)**: pre-check del script aborta si `policy_count > 0` pre-apply, detectando policies manuales añadidas entre spec 012 y hoy.
