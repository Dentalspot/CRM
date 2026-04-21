# Data Model — Apply Policies billing_invoices + patient_evaluations (spec 014)

**Generado**: 2026-04-20 Phase 1 audit.

---

## Pre-apply snapshot

*Pendiente queries A/B/C/D de Danissa en SQL Editor. Ver §Queries consolidadas para copy-paste.*

| Query | Target | Expected | Actual (paste by Danissa) |
|---|---|---|---|
| A | `pg_tables.rowsecurity` para `billing_invoices` + `patient_evaluations` | 2 rows, both true | — |
| B | `pg_policies` count por tabla | empty result (0 both) | — |
| C | `COUNT(*)` de ambas tablas | 0 rows both | — |
| D | `information_schema.columns` 5 tablas | Ver §Schema confirmed | — |

---

## Queries consolidadas (copy-paste a Supabase SQL Editor)

```sql
-- Spec 014 Phase 1 audit — read-only, ejecutar en bloque
-- Query A: RLS enabled check
SELECT 'A_rowsecurity' AS query, schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
ORDER BY tablename;

-- Query B: policy_count (PATTERNS.md §7 state drift)
SELECT 'B_policy_count' AS query, tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('billing_invoices', 'patient_evaluations')
GROUP BY tablename
ORDER BY tablename;

-- Query C: row count
SELECT 'C_billing_invoices' AS query, COUNT(*)::text AS row_count FROM billing_invoices
UNION ALL
SELECT 'C_patient_evaluations', COUNT(*)::text FROM patient_evaluations;

-- Query D: schema validation (FR-010, Constitution §VI)
SELECT 'D_schema' AS query, table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('billing_invoices', 'patient_evaluations', 'patient_care_team', 'patients', 'profiles')
ORDER BY table_name, ordinal_position;
```

**Instrucciones Danissa**: ejecutar en Supabase SQL Editor, pegar los 4 outputs en el thread como texto. El ejecutor actualiza las secciones correspondientes abajo.

---

## Schema confirmed (pending Query D output)

### Asunciones del spec (a validar con Danissa)

| Tabla | Columna asumida | Uso en policy | Status |
|---|---|---|---|
| `billing_invoices` | `therapist_id` UUID | Policy "Therapists read own" filter | **Pre-confirmado via FK embed** en `useInvoices.js:14` (`billing_invoices_therapist_id_fkey`). Query D confirma tipo. |
| `patient_evaluations` | `patient_id` UUID | Policy "Patients read own" + "Therapists via care_team" filter | **Pre-confirmado via INSERT** en `patientApi.js:191` (`patient_id: patientId`). Query D confirma tipo. |
| `patient_evaluations` | `therapist_id` UUID | (No usado por policy actual, pero existe en schema per FK embed) | **Pre-confirmado via FK embed** en `patientApi.js:160` (`patient_evaluations_therapist_id_fkey`). Query D confirma. |
| `patient_care_team` | `user_id` UUID + `patient_id` UUID | Policy "Therapists manage" EXISTS subquery | Query D confirma nombres. R-03 mitiga. |
| `patients` | `patient_user_id` UUID (o `user_id`) | Policy "Patients read own" EXISTS subquery | Query D confirma nombre real. |
| `profiles` | `id` UUID PK, `role` user_role enum | Admin policies `is_admin` pattern | Ya usado en specs 006/009 — alto nivel de confianza. Query D confirma. |

**If mismatch en Query D**: ajustar predicates SQL en Phase 2 ANTES de escribir la migration. Si columna asumida no existe del todo, **STOP** + re-evaluar template con advisor.

---

## Callsites verified (TASK-P1-GREP completado)

### billing_invoices — 3 callsites activos + 2 comentarios inocuos

| Archivo | Línea | Patrón acceso | Cubierto por policy |
|---|---|---|---|
| `src/features/membership/components/BillingHistory.jsx` | `:27` | Therapist propio via session `.from('billing_invoices').select(...)` | ✅ "Therapists read own billing_invoices" FOR SELECT USING `therapist_id = auth.uid()` |
| `src/features/admin/modules/billing/hooks/useInvoices.js` | `:13-14` | Admin read all (`.select('*, therapist:profiles!billing_invoices_therapist_id_fkey(full_name, email)')`) | ✅ "Admins manage billing_invoices" FOR ALL via `is_admin` |
| `src/features/admin/api/commissionsApi.js` | `:30` | Admin read con join a comisiones | ✅ "Admins manage billing_invoices" |
| `src/features/admin/api/analyticsApi.js` | `:5` | **Solo comentario** (`// In a real app, this would aggregate data from 'billing_invoices' or 'payments'`) — sin query real | N/A |
| `src/shared/api/edge/billing.edge.js` | `:14` | **Solo comentario** (`* - RLS: Verified by backend against 'billing_invoices'...`) — stub edge | N/A |

**Drift detectado**: NONE. Mismas líneas ±0. 2 comentarios no-query adicionales pero no afectan policy design.

### patient_evaluations — 2 callsites activos

| Archivo | Línea | Patrón acceso | Cubierto por policy |
|---|---|---|---|
| `src/lib/patientApi.js` | `:158-162` (función desde `:157`) | `fetchPatientEvaluations(patientId)` — SELECT filtrado por `.eq('patient_id', patientId)` con FK embed a `profiles` via `patient_evaluations_therapist_id_fkey` | ✅ "Therapists manage own patient evaluations" (care_team subquery) cubre lectura por terapeutas asignados + "Patients read own evaluations" cubre paciente propio |
| `src/lib/patientApi.js` | `:187-197` (función `savePatientEvaluation`) | INSERT con `{ patient_id, therapist_id, evaluation_date, ...evaluationData }` | ✅ "Therapists manage own patient evaluations" con WITH CHECK via care_team valida INSERT |

**Drift detectado**: líneas shifted +1 respecto a spec 012 (`:159` → actual `:158` SELECT, `:189` → `:187` INSERT). Cambio menor aceptable ±5.

**Nuevo hallazgo schema**: `patient_evaluations` tiene **tanto `patient_id` como `therapist_id`**. La FK embed `patient_evaluations_therapist_id_fkey` + el INSERT explícito de `therapist_id: therapistId` lo confirman. El spec eligió policy vía care_team (multi-terapeuta support). Alternativa más simple sería `therapist_id = auth.uid()` directo, pero pierde flexibilidad cross-therapist.

### Decisión pendiente (policy patient_evaluations)

**Opción A — vía `patient_care_team` (template spec 012 Template 2, plan default)**:
- Pros: multi-terapeuta — T1 crea, T2 del care_team puede leer/editar.
- Contras: EXISTS subquery performance (requiere índice en `patient_care_team(user_id, patient_id)`).

**Opción B — simple `therapist_id = auth.uid()`**:
- Pros: más simple, no depende de schema de `patient_care_team`.
- Contras: solo el creador puede leer/editar; no soporta clínicas colaborativas.

**Recomendación**: **Opción A** (plan default). Razón: consistencia con el patrón spec 012 Template 2, alineado con el diseño multi-terapeuta del `patient_care_team` (ver spec 003 migration). Si Phase 1 Query D revela que `patient_care_team` tiene schema distinto, re-evaluar.

---

## Audit flags (TASK-P1-QUERY-E)

### R-04 CONFIRMADO: `useClinicalAccessLogger` AUSENTE en patientApi.js

```bash
grep -n "useClinicalAccessLogger\|logClinicalAccess" src/lib/patientApi.js
# Output: No matches found
```

**Impact**: `fetchPatientEvaluations` (`patientApi.js:157`) es lectura de PHI por staff clínico. Constitution §III v1.1.0 exige logging via `useClinicalAccessLogger` o equivalente. Actualmente el fetch NO loguea.

**Scope decisión**: **NO bloquea spec 014**. Per spec.md §Scope Bounds, el logger es responsabilidad del consumer, no del spec de policies. Agregar el logger implicaría tocar `src/lib/patientApi.js` — fuera de FR-008.

**Follow-up spec sugerido**: `audit-evaluations-clinical-logger` — investigar qué otras funciones de `patientApi.js` acceden a PHI sin logger (`fetchPatientActivityLogs`, etc.), luego agregar `useClinicalAccessLogger` en los callsites del frontend que consumen `fetchPatientEvaluations` (Constitution §III responsabilidad del consumer, no del lib `patientApi.js` directamente — ver spec 008 para patrón).

### R-05 — admin auth context

Callsites admin (`useInvoices.js:13` + `commissionsApi.js:30`) usan `supabase` default client con session-auth de admin user (no `service_role` explícito). Policy "Admins manage billing_invoices" via `profiles.role = 'admin'::user_role` las cubre. R-05 descartado como bloqueante.

---

## Loss scenarios / risks status

| Risk | Status tras Phase 1 |
|---|---|
| R-01 (schema drift columnas) | **Parcialmente mitigado** via pre-confirm de FK embeds. Query D final valida. |
| R-02 (callsites nuevos desde spec 012) | **Sin drift crítico** — mismos 5 callsites (2 nuevos comment-only inocuos). |
| R-03 (`patient_care_team` schema cambió) | **Pendiente Query D** — tabla validada por spec 003 migration pero últimos cambios no auditados aquí. |
| R-04 (logger §III ausente) | **CONFIRMADO ausente**. Follow-up spec, no bloquea 014. |
| R-05 (admin service_role) | **Descartado** — session-auth estándar. |

---

## Phase 1 local report

### TASK-P1-GREP ✅
- 3 billing callsites + 2 comment-only = **5 matches totales, 3 con queries reales**.
- 2 evaluations callsites confirmados en `patientApi.js:158 + :187` (shifted +1 de spec 012).

### TASK-P1-QUERY-E ✅
- §III logger AUSENTE en `patientApi.js`. R-04 flag para follow-up spec.

### Pendiente para SP-1

- TASK-P1-QUERY-A/B/C/D outputs de Danissa en SQL Editor.
- Consolidación final + checks T1-T5 en TASK-P1-REPORT.
