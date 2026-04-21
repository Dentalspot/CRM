# Data Model — Apply Policies patient_goals + patient_development_areas (spec 015)

**Generado**: 2026-04-20 Phase 1 audit.

---

## Pre-apply snapshot

*Pendiente queries A/B/C/D/D-ext de Danissa en SQL Editor. Ver §Queries consolidadas.*

| Query | Target | Expected | Actual |
|---|---|---|---|
| A | `pg_tables.rowsecurity` ambas tablas | 2 rows, both true | — |
| B | `pg_policies` count por tabla | empty result (0 both) | — |
| C | `COUNT(*)` ambas tablas | 0 rows both | — |
| D | `information_schema.columns` 5 tablas | patient_development_areas TIENE o NO `patient_id` → decide shared/per-patient | — |
| D-ext | `information_schema.table_constraints` FKs | `patient_goals_area_id_fkey` confirmado + otros FKs | — |

---

## Queries consolidadas (copy-paste a Supabase SQL Editor)

```sql
-- Spec 015 Phase 1 audit — read-only, ejecutar en bloque

-- Query A: RLS enabled check
SELECT 'A_rowsecurity' AS query, schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('patient_goals', 'patient_development_areas')
ORDER BY tablename;

-- Query B: policy_count (PATTERNS.md §7 state drift)
SELECT 'B_policy_count' AS query, tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename IN ('patient_goals', 'patient_development_areas')
GROUP BY tablename
ORDER BY tablename;

-- Query C: row count
SELECT 'C_patient_goals' AS query, COUNT(*)::text AS row_count FROM patient_goals
UNION ALL
SELECT 'C_patient_development_areas', COUNT(*)::text FROM patient_development_areas;

-- Query D: schema validation (FR-010, CRITICAL para decisión shared/per-patient)
SELECT 'D_schema' AS query, table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('patient_goals', 'patient_development_areas', 'patient_care_team', 'patients', 'profiles')
ORDER BY table_name, ordinal_position;

-- Query D-extended: FK constraints
SELECT
  'D_ext_fk' AS query,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('patient_goals', 'patient_development_areas');
```

**Instrucciones Danissa**: ejecutar en Supabase SQL Editor, pegar los 5 outputs en thread.

---

## Schema asumido vs pre-confirmado via callsites

### Pre-confirmación desde código frontend

El grep local (TASK-P1-GREP) reveló info de schema antes de Query D:

| Fuente | Hallazgo | Implicación |
|---|---|---|
| `patientApi.js:115-117` | `SELECT ... FROM patient_goals` con filter `.eq('patient_id', patientId)` | `patient_goals.patient_id` existe ✅ |
| `patientApi.js:116` | FK embed `area:patient_development_areas!patient_goals_area_id_fkey` | **Columna FK es `area_id`, NO `development_area_id`**. Constraint name: `patient_goals_area_id_fkey`. **AJUSTE CRÍTICO vs plan** |
| `usePatientsPanel.js:258-261` | UPDATE `patient_goals SET patient_id = ... WHERE patient_id = ...` (merge patients) | `patient_goals.patient_id` confirmed + flow es UPDATE (necesita RLS USING + WITH CHECK ambos matching) |

### Matriz de columnas (plan vs realidad pre-Query D)

| Tabla | Columna plan | Columna real (pre-confirm) | Status |
|---|---|---|---|
| `patient_goals` | `patient_id` UUID FK patients | `patient_id` ✅ | Confirmado |
| `patient_goals` | `development_area_id` UUID FK patient_development_areas | **`area_id`** (NO `development_area_id`) | **Ajuste requerido en Phase 2 predicates** |
| `patient_development_areas` | `patient_id` UUID (per-patient) o ausente (shared) | **Pendiente Query D** | Decisión crítica TASK-P1-DECISION |
| `patient_care_team` | `dentist_id` + `patient_id` + `is_active` | Confirmado por spec 014 (mismo día) | Alto nivel de confianza, Query D re-valida |
| `patients` | `profile_id = auth.uid()` | Confirmado por spec 014 | Alto nivel de confianza |
| `profiles` | `id` + `role` enum | Confirmado por specs 006/009/014 | Alto nivel de confianza |

---

## Callsites verified (TASK-P1-GREP completado)

### patient_goals — 2 callsites frontend confirmados

| Archivo | Línea | Patrón acceso | Cubierto por policy |
|---|---|---|---|
| `src/lib/patientApi.js` | `:113-122` (función `fetchPatientGoals`) | SELECT `.eq('patient_id', patientId)` con FK embed `area:patient_development_areas!patient_goals_area_id_fkey (name, description)` | ✅ "Therapists manage own patient goals" (care_team FOR ALL cubre SELECT) + "Patients read own goals" |
| `src/features/patients/hooks/usePatientsPanel.js` | `:258-261` (merge flow) | UPDATE `patient_goals SET patient_id = primary WHERE patient_id = secondary` — transfiere goals entre pacientes al merge | ✅ "Therapists manage own patient goals" (FOR ALL cubre UPDATE) IF therapist está en care_team de AMBOS pacientes (secondary USING + primary WITH CHECK). Alternativamente admin policy cubre todo. |

**Drift detectado**: spec 012 documentó solo `patientApi.js:115` (SELECT). **Nuevo callsite confirmado**: `usePatientsPanel.js:258` (UPDATE en merge flow). Este callsite ya está cubierto por policy FOR ALL — no requiere policy adicional.

### patient_development_areas — accesos vía FK embed

- Sólo vía FK embed desde `patient_goals` (`patientApi.js:116`). Sin queries directas detectadas.
- Implicación: si la policy de `patient_development_areas` es deny-all para el user que lee, el embed retorna `area: null` — UX rota pero no crash.

### Edge functions — 4 confirmadas (TASK-P1-GREP extendido a supabase/functions/)

| Edge function | Path | Usa service_role (presunto) |
|---|---|---|
| suggest-treatment | `supabase/functions/suggest-treatment/index.ts` | ✅ (bypass RLS) |
| analyze-progress | `supabase/functions/analyze-progress/index.ts` | ✅ (bypass RLS) |
| rag-query | `supabase/functions/rag-query/index.ts` | ✅ (bypass RLS) |
| recommend-purchases | `supabase/functions/recommend-purchases/index.ts` | ✅ (bypass RLS) |

R-03 riesgo: si alguna no usa service_role, post-apply rompería. Query E opcional (smoke invocar 1 edge function en Phase 3 Parte 4a) cubre validación.

---

## Decision log (TASK-P1-DECISION — pendiente Query D)

**Pending**: decisión shared catalog vs per-patient para `patient_development_areas`.

**Criterio determinístico**:
- Si Query D output incluye columna `patient_id` en `patient_development_areas` → **per-patient** → 5 policies totales (3 goals + 2 dev_areas via care_team).
- Si Query D output NO incluye `patient_id` → **shared catalog** → 4 policies totales (3 goals + 2 dev_areas con "Everyone read" + "Admins manage").

**Rationale adicional pre-Query D** (hint):
- El grep frontend NO mostró queries directas a `patient_development_areas` — solo via FK embed. Esto sugiere **catálogo compartido** donde el terapeuta elige un área desde una lista fija para asignar al goal. Pero es inferencia, no evidencia. Query D decide.
- Si es catálogo shared, "Everyone read" USING (true) es seguro — el nombre del área ("Estética", "Funcionalidad") no es data sensible.

---

## Audit flags

### R-04 — useClinicalAccessLogger ausente en `fetchPatientGoals`

```bash
grep -n "useClinicalAccessLogger\|logClinicalAccess" src/lib/patientApi.js
# Output: No matches found (confirmado spec 014 Phase 1)
```

**Status**: R-04 CONFIRMADO ausente (mismo estado que spec 014). Follow-up spec agregado para bundle `patient_evaluations` + `patient_goals` + eventuales otros PHI reads.

**NO bloquea spec 015**. Consumer responsibility.

### R-05 — FK constraint naming validado

Query D-ext confirmará si `patient_goals_area_id_fkey` es el nombre canónico. El grep del código (`patientApi.js:116`) ya lo usa — si Query D-ext retorna un nombre distinto, hay drift entre código y schema (diagnóstico).

---

## Phase 1 local report

### TASK-P1-GREP ✅
- 2 patient_goals callsites confirmados (frontend). Drift vs spec 012: +1 callsite (usePatientsPanel.js:258 merge flow, cubierto por FOR ALL).
- 4 edge functions confirmadas (service_role presunto).
- **Ajuste crítico**: FK column es `area_id` (NO `development_area_id`).

### TASK-P1-QUERY-E (§III logger) ✅
- R-04 confirmado ausente (heredado de spec 014).

### Pendiente para SP-1

- TASK-P1-A/B/C/D/D-EXT outputs de Danissa.
- TASK-P1-DECISION con Query D output.
- TASK-P1-REPORT consolidado SP-1.
