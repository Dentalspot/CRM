# Feature Specification: Lockdown PIE + debug_signup_logs Tables (deny-all default)

**Feature Branch**: `016-lockdown-pie-debug-tables`
**Created**: 2026-04-20
**Status**: Draft
**Input**: Último P0 security pendiente del RLS coverage audit 2026-04-20 (`architecture.md §"RLS coverage audit"`). 6 tablas con `rowsecurity=DISABLED` + 0 policies — cualquier usuario autenticado puede leer/escribir libremente. Todas PHI-adjacent (PIE Escolar module + debug logs). Fix **minimalista**: ENABLE RLS sin policies = deny-all default para non-service-role. Edge functions (service_role) siguen bypass. Callsites frontend (presumiblemente wrapped en `FEATURE_FLAGS.PIE_ESCOLAR = false`) quedan inocuos. Constitution §II driver.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Lock-down de tablas PIE Escolar (flag OFF) cierra ventana de exposición (Priority: P1)

Las 5 tablas del módulo PIE Escolar (`pie_sessions`, `pie_students`, `pie_paci`, `pie_schedule_blocks`, `pie_therapist_schools`) contienen datos de sesiones de educación especial y estudiantes (PHI Ley 20.584 por contener info clínica indirecta sobre menores). Hoy tienen `rowsecurity=false` — si algún usuario autenticado apuntara un query contra estas tablas (p.ej. via consola DevTools, cliente REST autenticado, o feature flag flip accidental), obtendría/escribiría sin restricción. El módulo frontend está wrapped en `FEATURE_FLAGS.PIE_ESCOLAR = false` (spec 010 confirmó), por lo que no hay queries activas desde UI, pero el API endpoint sí responde a cualquier request autenticado.

**Why this priority**: es el único P0 security pendiente del RLS coverage audit. Cierra ventana de exposición inmediata sin requerir diseño de policies complejas (PIE no está activo en producción). Reactivación futura del feature requerirá spec dedicado con policies proper — Constitution §IV preservada.

**Independent Test**: tras apply, un usuario autenticado (no-admin, no-service_role) que intente `SELECT * FROM pie_sessions` debe recibir array vacío (o error RLS según configuración cliente — deny-all via RLS enabled + 0 policies). Edge functions con service_role siguen recibiendo data (bypass RLS). Dashboard therapist (con `PIE_ESCOLAR=false`) NO debe mostrar cambio alguno — no hay callsites activos.

**Acceptance Scenarios**:

1. **Given** las 5 tablas PIE post-apply con `rowsecurity=true` y 0 policies, **When** usuario autenticado no-admin ejecuta `SELECT * FROM pie_sessions`, **Then** retorna array vacío (deny-all).
2. **Given** mismo estado, **When** edge function con `service_role` key consulta las mismas tablas, **Then** opera sin RLS aplicado (bypass estándar Supabase).
3. **Given** dashboard therapist cargado con `FEATURE_FLAGS.PIE_ESCOLAR = false`, **When** usuario navega normalmente (vistas non-PIE), **Then** cero diferencias de comportamiento — no hay callsites activos que se rompan.
4. **Given** admin autenticado con `profiles.role = 'admin'::user_role` sin policy específica, **When** ejecuta queries contra estas tablas, **Then** **también** retorna vacío (deny-all incluye admin post-migration — esto es aceptable hasta spec futura de reactivación PIE que agregue policies).

---

### User Story 2 — Lock-down de debug_signup_logs (logs sistema) (Priority: P2)

`debug_signup_logs` almacena trazas de signup para diagnóstico de bugs. Probable que solo edge functions (signup flow) escriban en ella vía service_role; lectura idealmente limitada a admin tooling. Hoy `rowsecurity=false` → cualquier usuario autenticado puede leer logs de OTROS signups (potencial leakage de emails/metadata). Fix: deny-all via ENABLE RLS — edge function sigue escribiendo (bypass), lectura queda cerrada para usuarios regulares.

**Why this priority**: P2 vs P1 porque el dato no es PHI estricto, pero sí metadata (emails, timestamps, error traces) que no debe exponerse cross-user. Cierra gap de principio menor que PIE pero del mismo tipo.

**Independent Test**: tras apply, usuario autenticado regular ejecutando `SELECT * FROM debug_signup_logs` retorna vacío. Edge function signup sigue haciendo INSERT sin error.

**Acceptance Scenarios**:

1. **Given** `debug_signup_logs` post-apply con `rowsecurity=true` y 0 policies, **When** usuario autenticado no-admin ejecuta SELECT, **Then** retorna vacío.
2. **Given** mismo estado, **When** edge function signup ejecuta `INSERT INTO debug_signup_logs ...` con service_role, **Then** insert exitoso (bypass RLS).

---

### User Story 3 — Rollback limpio si alguna feature rompe (Priority: P3)

Si Phase 3 smoke detecta que alguna feature rompió post-apply (p.ej. una feature activa usa una de estas tablas sin wrap de flag), Danissa ejecuta `DISABLE ROW LEVEL SECURITY` para las 6 tablas restaurando el estado pre-spec. Sin policies que drop (este spec no crea ninguna).

**Why this priority**: bound del fix. Rollback trivial porque es reversal de ALTER TABLE, no DROP de policies.

**Independent Test**: dry-run del batch `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` × 6 → `pg_tables.rowsecurity` vuelve a false para las 6 tablas.

**Acceptance Scenarios**:

1. **Given** spec 016 aplicado, **When** Danissa ejecuta el batch DISABLE del §Rollback Plan, **Then** las 6 tablas vuelven a `rowsecurity=false` sin error.
2. **Given** rollback ejecutado, **When** verifica `pg_policies` count, **Then** sigue en 0 (este spec no creó policies).

---

### Edge Cases

- **Callsite frontend NO wrapped en flag OFF**: si Phase 1 grep revela callsite activo (no wrapped) para alguna tabla PIE, pure deny-all lo romperá silencioso. **Decisión requerida**: (a) wrappear el callsite en flag → fuera de scope spec 016 (toca `src/`), (b) policy específica para ese callsite → abre scope, (c) STOP y re-evaluar spec. Phase 1 detecta, SP-1 bloquea si aplica.
- **Admin dashboard usa estas tablas sin filter**: admin tooling que lista signup logs o PIE data sin policy admin dedicada quedará vacío post-apply. Impacto bajo (tabla admin raramente consumida) pero documentable. Phase 1 grep abarca `src/features/admin/**`.
- **Edge function NO usa service_role**: si alguna edge function (p.ej. nueva) usa `anon` key, post-apply romperá. Phase 1 grep `supabase/functions/` verifica. Improbable para PIE (inactivo) pero verify `debug_signup_logs` edge function.
- **State drift desde audit 2026-04-20**: si alguien ya ejecutó ALTER TABLE ENABLE entre audit y hoy para alguna tabla, pre-check detecta y salta (skip enable duplicado) o aborta si policy_count > 0 inesperado. PATTERNS.md §7.
- **`debug_signup_logs` es en realidad anon read**: si el signup flow sin autenticación necesita leer su propio log (edge case improbable), deny-all lo romperá. Phase 1 grep valida. Si aplica, requiere policy "Users read own signup log" — abre scope.
- **PIE_ESCOLAR flag flip accidental post-apply**: si el flag se activa sin que se haya escrito policies proper, PIE UI cargará y todas las queries retornarán vacío silencioso (empty state). Violación Constitution §V (UI honesty) pero estado superior al actual (data leak cerrado). Mitigación: el spec de reactivación PIE debe escribir policies antes de flip flag.
- **Table `pie_paci` semantics unclear**: el nombre sugiere "pacientes PIE" pero sin documentación clara. Phase 1 no requiere entender semántica — lock-down aplica por igual a todas las 5 tablas PIE.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La migración MUST ejecutar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` para las 6 tablas exactas: `pie_sessions`, `pie_students`, `pie_paci`, `pie_schedule_blocks`, `pie_therapist_schools`, `debug_signup_logs`.
- **FR-002**: La migración MUST NO crear ninguna policy nueva (pure lock-down). Excepción: si Phase 1 detecta callsite NO wrapped en flag OFF para alguna tabla específica, el spec abre `[NEEDS CLARIFICATION]` y puede agregar policy mínima — pero el default es zero policies.
- **FR-003**: La migración MUST ser idempotente — si alguna tabla ya tiene `rowsecurity=true` por drift, el script salta esa específica (`ALTER TABLE IF EXISTS` no aplica a RLS state, pero un `DO $$` conditional sí). Mantenerlo simple: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` es idempotente por default en PostgreSQL (no error si ya enabled).
- **FR-004**: La migración MUST incluir pre-check `DO $$` que aborta si (a) alguna tabla no existe en `public`, (b) alguna tabla YA tiene `rowsecurity=true` con `policy_count > 0` (state drift con policies manuales — consultar antes de apply).
- **FR-005**: La migración MUST incluir post-check `DO $$` verificando las 6 tablas con `rowsecurity=true` post-apply. Policy count esperado por default: 0 total (o valor específico si Phase 1 forzó policy añadida).
- **FR-006**: La migración MUST NO modificar schema, grants, roles, ni feature flags. Sin CREATE/DROP salvo el ENABLE RLS.
- **FR-007**: 1 archivo nuevo exclusivamente: `supabase/migrations/20260420000006_lockdown_pie_debug_tables.sql`.
- **FR-008**: Spec MUST contener batch `DISABLE ROW LEVEL SECURITY` de rollback copy-pasteable para las 6 tablas.
- **FR-009**: Phase 1 audit MUST grep callsites frontend de las 6 tablas y documentar para cada tabla: ¿wrapped en `FEATURE_FLAGS.PIE_ESCOLAR` o equivalente? ¿sin callsites? ¿callsite activo no-wrapped? Decisión crítica SP-1.
- **FR-010**: Phase 1 audit MUST grep callsites edge functions (`supabase/functions/**`) para confirmar que ninguna requiere policy (todas usan service_role si tocan estas tablas).
- **FR-011**: Scope bound estricto: NO policies complejas para PIE en este spec. Si Phase 1 revela que una tabla PIE requiere policy específica (callsite no-wrapped), STOP + re-evaluar. Reactivación PIE es spec futura.
- **FR-012**: NO edits a `src/features/FEATURE_FLAGS.js` o equivalente. Flags quedan OFF como están.

### Key Entities

- **pie_sessions**: sesiones del módulo PIE Escolar (Programa de Integración Escolar). Contenido presumible: session records (fecha, duración, notas) vinculadas a estudiantes.
- **pie_students**: estudiantes del programa PIE. PHI-adjacent (menores con necesidades educativas especiales).
- **pie_paci**: likely "pacientes PIE" o registro de atención individualizada. Semántica exacta out-of-scope.
- **pie_schedule_blocks**: bloques horarios de atención PIE.
- **pie_therapist_schools**: mapping terapeutas ↔ colegios donde hacen PIE.
- **debug_signup_logs**: logs del flujo de signup. Metadata de diagnóstico (email, timestamp, errores). No PHI, pero cross-user leakage potencial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: post-migration, `SELECT rowsecurity FROM pg_tables WHERE tablename IN (<6 tablas>)` retorna 6 rows, todas `true`.
- **SC-002**: post-migration, `SELECT COUNT(*) FROM pg_policies WHERE tablename IN (<6 tablas>)` retorna 0 (salvo excepción Phase 1 documentada).
- **SC-003**: 0 regresiones en features activas. Dashboard therapist con `PIE_ESCOLAR=false` renderiza idéntico pre/post apply. Signup flow (edge function) sigue creando logs sin error.
- **SC-004**: smoke manual — como usuario autenticado no-admin, `SELECT * FROM pie_sessions` retorna 0 rows o `permission denied` (deny-all comportamiento esperado).
- **SC-005**: tiempo total del ciclo spec 016 (Phase 1 + Phase 2 + Phase 3) ≤ **60 min**, bound superior 90 min.
- **SC-006**: rollback batch ejecutable en <1 minuto — 6 DISABLE ROW LEVEL SECURITY sin error.
- **SC-007**: post-spec, `architecture.md §"RLS coverage audit"` refleja estos 6 tablas como ✅ resueltos (deny-all default aplicado).

## Assumptions

- **PIE_ESCOLAR flag OFF confirmado**: spec 010 verificó todos los feature flags en false. Re-confirmar Phase 1 grep.
- **0 callsites activos PIE en frontend**: wrapped en flag OFF, por lo que el UI no invoca queries. Phase 1 confirma.
- **debug_signup_logs: solo edge function signup escribe**: assumption, Phase 1 valida.
- **Todas las edge functions usan service_role**: standard pattern Supabase. Phase 1 verifica.
- **Admin dashboard NO consume estas tablas sin policy dedicada**: asunción — si falla, admin tooling rompe pero impacto bajo (data crítica está en otras tablas).
- **Live state estable desde audit 2026-04-20**: 6 tablas siguen rowsecurity=false + 0 policies. PATTERNS.md §7 pre-check captura drift.
- **No hay test data clínica activa en PIE tablas**: row_count probablemente bajo o 0 (feature dormant).
- **Deploy por Danissa**: ejecutor escribe migration, Danissa aplica via SQL Editor. MCP execute_sql denegado.
- **Reactivación PIE es futura**: cuando se active, spec dedicado escribirá policies proper (Therapists via patient_care_team o equivalent). Out-of-scope spec 016.

## Scope Bounds

- **In scope**: 1 archivo migration (`20260420000006_*.sql`), 6 tablas (5 PIE + 1 debug), 6 ALTER TABLE ENABLE RLS, 0 policies por default.
- **Out of scope** (hard boundaries):
  - Policies complejas PIE (reactivación futura).
  - Cambios a `FEATURE_FLAGS.*` (preservar OFF).
  - Edits a `src/**` (no cambia consumers).
  - Edge functions modificación.
  - Otras tablas del RLS coverage audit (solo las 6 listadas).
  - Tests automatizados.
  - Si Phase 1 revela >1 tabla requiere policy specific → STOP + re-evaluar en lugar de expandir scope.

## Rollback Plan

**Triggers** (cualquiera dispara rollback):
1. **Feature activa rompe post-apply**: alguna UI non-PIE muestra empty state donde antes tenía data, o crash por `permission denied` en consola.
2. **Edge function signup falla**: `debug_signup_logs` INSERT retorna error post-apply — indica service_role bypass no funciona como esperado (muy improbable, pero defensivo).
3. **Admin dashboard pie-adjacent rompe**: si hay admin tool que lista PIE data o signup logs sin admin policy → empty state o error.

**Acción**:
```sql
-- Batch rollback spec 016 (copy-paste al SQL Editor)
ALTER TABLE public.pie_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_paci DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_schedule_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pie_therapist_schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_signup_logs DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('pie_sessions','pie_students','pie_paci','pie_schedule_blocks','pie_therapist_schools','debug_signup_logs')
ORDER BY tablename;
-- Esperado: 6 rows, todas rowsecurity=false (estado pre-spec 016 restaurado)
```

**NO rollback** (falsos positivos):
- Usuario no-admin ve empty array en PIE tablas = **comportamiento esperado** (deny-all funciona).
- Dashboard therapist con flag OFF renderiza idéntico = comportamiento esperado.

**Non-rollback alternative**: si Phase 3 detecta que UNA tabla específica necesita policy dedicada (p.ej. debug_signup_logs necesita "Service role insert" explícito por edge function no-service_role), agregar policy mínima en spec 016.1 (micro-fix) en lugar de DISABLE RLS completo.

## Dependencies

- **Constitution §II (RLS-First Security)**: driver principal. Cierra el último P0 del RLS coverage audit.
- **Constitution §IV (Micro-Bloques)**: scope tight — 1 migration, 6 tablas, 0 policies (salvo excepción documentada). Reactivación PIE es spec propia.
- **spec 006 (`enable-rls-blog-patient-questions`)**: patrón canónico de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + DO $$ pre/post-check.
- **spec 010 (feature flags inventory)**: confirmó `PIE_ESCOLAR = false` y todos los demás flags OFF. Pre-requisito para asunción "0 callsites activos".
- **spec 014 + 015 (apply policies)**: patrones recientes de DO $$ pre/post-check + ajustes schema (no aplica ajustes acá, sin policies con predicates).
- **PATTERNS.md §7 (state drift re-verification)**: pre-check del script aborta si drift desde audit.
- **PATTERNS.md §4 (audit defensivo)**: Phase 1 re-greps callsites.
- **`architecture.md §"RLS coverage audit"`**: fuente del listado de 6 tablas.
