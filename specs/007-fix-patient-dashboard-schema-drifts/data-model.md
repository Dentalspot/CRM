# Data Model: Fix Patient Dashboard Schema Drifts

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Date**: 2026-04-20
**Source of truth**: `src/types/database.ts` (schema generado por Supabase, verificado contra grep de callsites que sí funcionan en producción).

---

## ⚠️ Source of evidence note

Queries SQL originalmente planeadas (Phase 1 P1.1 vía MCP `execute_sql` contra `tomremkbuxvedliyywbo`) **no se pudieron ejecutar** — el token MCP disponible en esta sesión no tiene acceso al proyecto DentalSpot (solo tiene acceso a `fonokit`, `klage`, `POS`). El CLI `supabase` local tampoco lista el proyecto (falta link).

**Fallback ejecutado**: lectura de `src/types/database.ts` (types file generado por `supabase gen types typescript`) + grep de callsites reales que funcionan en producción. Esta fuente puede ser ligeramente stale respecto al live schema, pero (a) para cambios recientes son minutos/horas a lo sumo, (b) Drifts 1 y 2 dependen de columnas inexistentes — muy difícil de contradecir con stale types, (c) Drift 3 se confirma contra la columna `final_pdf_url` presente en types.

**Caveat**: Danissa puede validar contra el dashboard Supabase si queda duda residual. Si Query A real contradice algo de este data-model, volver a Phase 1 antes de Phase 2.

---

## Tabla de verdad por drift

| Drift | Columna pedida | Existe en live schema | Nombre real | Tipo DB | Decisión Phase 2 |
|---|---|---|---|---|---|
| 1 | `session_activities.patient_id` | **❌ NO** | N/A — patient vía cadena `session_activities.session_id → plan_sessions.assigned_plan_id → patient_assigned_plans.patient_id` | — | Embed 3-level: `plan_sessions!inner(patient_assigned_plans!inner(patient_id))` |
| 2 | `appointments.fee` | **❌ NO** (ni con ningún alias — el concepto `fee` no vive en appointments) | Precio vive en `therapist_services.price_clp` accedido vía `appointments.service_id` FK | `therapist_services.price_clp`: `numeric` | **Case structural-join**: rewrite con `service:therapist_services!appointments_service_id_fkey(price_clp)` + sum client-side. NO es alias puro. **Requiere decisión de Danissa** (ver SP-1 report). |
| 3a | `clinical_reports.file_url` | **❌ NO** (renombrado) | `final_pdf_url` | `text \| null` | Case A (rename): alias PostgREST `file_url:final_pdf_url` |
| 3b | `clinical_reports.report_type` | **✅ SÍ existe** con ese mismo nombre | `report_type` | `text` (NOT NULL) | No-op para esta columna — el 400 lo causa **solo** `file_url`. Una vez fixed 3a, `report_type` funciona as-is. |

---

## Schema real de las 3 tablas afectadas + puente `plan_sessions` + `patient_assigned_plans`

Capturado desde `src/types/database.ts` el 2026-04-20. Solo columnas `Row` (lo que PostgREST retorna).

### `session_activities` (línea 9782)

```text
id                   uuid     NOT NULL
session_id           uuid     NOT NULL    ← FK a plan_sessions.id (nombre real del FK column)
activity_id          uuid     nullable    FK a plan_objective_activities.id
exercise_id          uuid     nullable    FK a therapist_exercises.id
objective_id         uuid     nullable    FK a plan_objectives.id
name                 text     NOT NULL
description          text     nullable
instructions         text     nullable
materials            text     nullable
duration_minutes     number   nullable
display_order        number   NOT NULL
status               text     nullable    (valores: 'pending' / 'completed' / otros)
achievement_level    text     nullable
notes                text     nullable
created_at           string   nullable
updated_at           string   nullable
```

**Observación crítica**: el FK a `plan_sessions` usa columna **`session_id`**, no `plan_session_id` como asumí en plan.md. No afecta el fix (PostgREST resuelve el embed por nombre de tabla, no por nombre de columna), pero hay que corregir la documentación.

### `plan_sessions` (línea 8298)

```text
id                   uuid     NOT NULL
assigned_plan_id     uuid     NOT NULL    ← FK a patient_assigned_plans.id
clinical_history_id  uuid     nullable
session_number       number   NOT NULL
scheduled_date       string   nullable
completed_date       string   nullable
duration_minutes     number   nullable
status               text     nullable
notes                text     nullable
created_at           string   nullable
updated_at           string   nullable
```

**NO tiene `patient_id`** — la relación paciente va vía `patient_assigned_plans`. Mi plan.md asumía `plan_sessions.patient_id`. **ERROR MATERIAL del plan que necesita fix antes de Phase 2.**

### `patient_assigned_plans` (línea 6351)

```text
id                     uuid     NOT NULL
patient_id             uuid     NOT NULL    ← acá vive la relación paciente
therapist_id           uuid     NOT NULL
plan_template_id       uuid     nullable
name                   text     NOT NULL
notes                  text     nullable
progress_percentage    number   nullable
current_session        number   nullable
total_sessions         number   nullable
completed_sessions     number   nullable
start_date             string   NOT NULL
end_date               string   nullable
specialty_id           uuid     nullable
status                 text     nullable
created_at             string   nullable
updated_at             string   nullable
```

### `appointments` (línea 1083)

```text
id                      uuid     NOT NULL
patient_id              uuid     NOT NULL    FK a patients
therapist_id            uuid     NOT NULL    FK a profiles
clinic_id               uuid     nullable    FK a clinics
service_id              uuid     nullable    FK a therapist_services  ← acá vive el link al precio
specialty_id            uuid     nullable
date                    string   NOT NULL
start_time              string   NOT NULL
end_time                string   NOT NULL
duration_minutes        number   NOT NULL
status                  string   NOT NULL
block_type              text     nullable
color                   text     nullable
modality_patient        text     nullable
notes                   text     nullable
recurring_group_id      uuid     nullable
send_email_reminder     boolean  nullable
confirmation_status     text     nullable
created_at              string   nullable
updated_at              string   nullable
```

**CONFIRMADO: NO existe `fee`, `price`, `amount`, `total`, ni ninguna columna de precio en `appointments`.** El precio de la sesión se deriva del servicio vía `service_id`.

### `clinical_reports` (línea 2493)

```text
id                   uuid     NOT NULL
patient_id           uuid     NOT NULL    FK a patients
therapist_id         uuid     NOT NULL    FK a profiles
specialty_id         uuid     nullable
template_id          uuid     nullable
document_id          uuid     nullable
encounter_id         uuid     nullable
editable_json        Json     NOT NULL
report_type          text     NOT NULL    ✅ existe con ese nombre
status               enum     (report_status)
visibility_scope     text     NOT NULL
final_pdf_url        text     nullable    ← lo que el user pidió como "file_url"
delivery_status      text     nullable
hash_integrity       text     nullable
signed_hash          text     nullable
signed_at            string   nullable
signed_by            uuid     nullable
locked_at            string   nullable
locked_reason        text     nullable
validated_at         string   nullable
validated_by         uuid     nullable
version              number   nullable
created_at           string   nullable
created_by           uuid     nullable
updated_at           string   nullable
```

**CONFIRMADO**:
- `file_url` → renombrado a `final_pdf_url` (alias PostgREST canónico).
- `report_type` → existe con ese nombre, el 400 es causado solo por `file_url`.

---

## Estado de FKs (Query B output equivalente desde database.ts)

| Child table | Child column | Parent table | Parent column | Constraint name |
|---|---|---|---|---|
| `session_activities` | `session_id` | `plan_sessions` | `id` | `session_activities_session_id_fkey` |
| `session_activities` | `activity_id` | `plan_objective_activities` | `id` | `session_activities_activity_id_fkey` |
| `session_activities` | `exercise_id` | `therapist_exercises` | `id` | `session_activities_exercise_id_fkey` |
| `session_activities` | `objective_id` | `plan_objectives` | `id` | `session_activities_objective_id_fkey` |
| `plan_sessions` | `assigned_plan_id` | `patient_assigned_plans` | `id` | `plan_sessions_assigned_plan_id_fkey` |
| `plan_sessions` | `clinical_history_id` | `clinical_history` | `id` | `plan_sessions_clinical_history_id_fkey` |
| `patient_assigned_plans` | `patient_id` | `patients` | `id` | `patient_assigned_plans_patient_id_fkey` |
| `patient_assigned_plans` | `therapist_id` | `profiles` | `id` | `patient_assigned_plans_therapist_id_fkey` |
| `appointments` | `service_id` | `therapist_services` | `id` | `appointments_service_id_fkey` |
| `clinical_reports` | `patient_id` | `patients` | `id` | `clinical_reports_patient_id_fkey` |

**R-01 mitigation**: las 3 FKs necesarias para el embed 3-level del Drift 1 existen y PostgREST las puede resolver automáticamente por nombre de tabla:

```
session_activities --(session_id_fkey)--> plan_sessions --(assigned_plan_id_fkey)--> patient_assigned_plans --(patient_id_fkey)--> patients
```

---

## Grep complementario (P1-GREP output)

### Grep 1 — callsites adicionales `from('appointments')` con fee/price/amount

Single match fuera del que ya conocemos:

```
src/pages/TherapistDashboardPage.jsx:144:  .select('fee')                 ← el drift en scope (Drift 2)
src/hooks/useTherapistDashboard.js:111:    service:therapist_services!appointments_service_id_fkey(price_clp)   ← patrón canónico de cómo SÍ se lee precio desde appointments
```

**Implicación**: `useTherapistDashboard.js:111` ya aplica el patrón correcto para obtener precio. **El fix de Drift 2 es replicar este patrón canónico en `TherapistDashboardPage.jsx:144`.** NO es un re-modelado semántico (la fuente de datos + relación ya están establecidas en el codebase).

### Grep 2 — callsites existentes de `plan_sessions!inner`

4 callsites que funcionan hoy:

```
src/pages/PatientActivitiesPage.jsx:54           plan_sessions!inner(
src/pages/PatientDashboardPage.jsx:168           plan_sessions!inner(
src/features/patient/pages/MyProgressPage.jsx:78 plan_sessions!inner(
src/features/clinic-dashboard/components/ClinicalQualityPanel.jsx:125 plan_sessions!inner(
```

Pattern de filtro (en los 3 que usan `.eq`):

```
src/pages/PatientActivitiesPage.jsx:61     .eq('plan_sessions.patient_assigned_plans.patient_id', patientData.id)
src/pages/PatientDashboardPage.jsx:173     .eq('plan_sessions.patient_assigned_plans.patient_id', patientData.id)
src/features/patient/pages/MyProgressPage.jsx:85  .eq('plan_sessions.patient_assigned_plans.patient_id', patientData.id)
```

**Implicación**: la sintaxis canónica es `plan_sessions!inner(patient_assigned_plans!inner(patient_id))` (3-level embed) + filtro `plan_sessions.patient_assigned_plans.patient_id`. **Esto es lo que el fix de Drift 1 debe replicar, no el 2-level que asumía el plan.md.**

### Grep 3 — callsites de `session_activities` que acceden `patient_id` directo

```
src/features/patient-dashboard/PatientDashboardPageV2.jsx:163-164  .select(..., exercise_id).eq('patient_id', pId)  ← Drift 1 (query 1)
src/features/patient-dashboard/PatientDashboardPageV2.jsx:242-243  .select('id, status, updated_at').eq('patient_id', pId)  ← Drift 1 (query 2)
```

Solo 2 matches, ambos del archivo ya identificado en el spec. **No hay 4ta query driftada oculta** — R-05 NO disparado.

---

## Hallazgos laterales

### H-1. Regression Test Inventory: líneas reales vs spec

Las líneas reportadas en spec §Regression Test Inventory difieren levemente de las reales (drift de 3–4 líneas por evolución del archivo entre reporte y audit):

| Ruta | Línea en spec | Línea real (grep) |
|---|---|---|
| `PatientActivitiesPage.jsx` | 50 | 54 |
| `MyProgressPage.jsx` | 74 | 78 |
| `ClinicalQualityPanel.jsx` | 122 | 125 |
| `PatientDashboardPage.jsx` (legacy) | 182 | 168 + 172 (es DOS queries, no una) |

No afecta el fix. Se actualizan en el reporte final. El inventory SIGUE siendo 7 callsites + 7 callsites, nadie se agrega ni se quita.

### H-2. Error material en plan.md (Phase 2 Drift 1 pseudocódigo)

El pseudocódigo del plan dice:

```js
.select(..., plan_sessions!inner(patient_id))
.eq('plan_sessions.patient_id', pId)
```

Esto es **incorrecto** — `plan_sessions` no tiene `patient_id`. La versión correcta:

```js
.select(..., plan_sessions!inner(patient_assigned_plans!inner(patient_id)))
.eq('plan_sessions.patient_assigned_plans.patient_id', pId)
```

**No es bug de scope, es bug de documentación del plan**. El fix real aplicado en Phase 2 debe usar el pattern canónico (3-level embed), no lo que dice el pseudocódigo del plan. Esto se documentará en el PR post-Phase 2.

### H-3. Drift 2: es structural-join, no rename puro

Hipótesis original en spec: "probablemente renamed como price_clp, amount o similar". Evidencia real: el precio nunca estuvo en `appointments`. Vive en `therapist_services.price_clp` vía `appointments.service_id` FK.

El fix NO es `.select('fee:price_clp')` (alias) porque no existe una columna de `appointments` que se pueda aliasar. El fix ES:

```js
.select('service:therapist_services!appointments_service_id_fkey(price_clp)')
```

+ cambio en el consumer de `apt.fee` a `apt.service?.price_clp || 0`.

**Gray zone**: ¿esto cuenta como "re-modelado semántico" (FR-003.c abort) o como "aplicar pattern canónico ya existente en el codebase" (in-scope)? El patrón ya está en `useTherapistDashboard.js:111` y funciona — no estamos inventando una fuente nueva. Inclino a **in-scope** pero **requiere decisión explícita de Danissa en SP-1** (ver reporte).

### H-4. `session_activities.session_id` (no `plan_session_id`)

Corrección menor: el FK column de session_activities a plan_sessions se llama `session_id` (singular, sin prefijo), no `plan_session_id` como dije en plan.md R-01. Para PostgREST embed esto no importa (se resuelve por tabla), solo para documentación. Ya corregido en la tabla de FKs de este doc.

### H-5. Drift 3 tiene también `title` inexistente (descubierto durante Phase 2, NO amplía scope)

El query original del spec §Drift 3 (`PatientDashboardPageV2.jsx:182-185`) era:

```js
.select('id, title, file_url, created_at, report_type')
```

Phase 1 confirmó que `file_url` no existe (renombrado a `final_pdf_url`) y que `report_type` sí existe. **No auditamos `title` porque no estaba en la lista de drifts reportados por el user.**

Durante Phase 2, al leer el schema completo de `clinical_reports`, se confirma que **`title` tampoco existe** en la tabla:

```
id, created_at, created_by, delivery_status, document_id, editable_json, encounter_id,
final_pdf_url, hash_integrity, locked_at, locked_reason, patient_id, report_type,
signed_at, signed_by, signed_hash, specialty_id, status, template_id, therapist_id,
updated_at, validated_at, validated_by, version, visibility_scope
```

**Por qué el user no lo reportó**: PostgREST devuelve en el error body solo la primera columna faltante detectada. El console error mencionó `file_url` o `report_type`, pero el query ya hubiera fallado igual por `title`. Este es un artefacto del error handler de PostgREST, no un bug adicional.

**Decisión aplicada**: `title` **también removido del select** como parte del fix de Drift 3 (cumple FR-006 "pedir solo columnas existentes").

**¿Es scope creep?** NO. Análisis:
- FR-006 manda "pedir solo columnas existentes" — removerla cumple la regla.
- Mismo archivo, misma query (1 edit), mismo drift conceptual — NO es archivo/query adicional.
- Consumer `loadDocuments()` ya hace `title: r.title || 'Documento'` → el comportamiento visible se preserva (el default 'Documento' ya existía como fallback).
- No dispara FR-003.b (sigue siendo ≤5 archivos) ni FR-003.c (no hay re-modelado).

**Fix aplicado**: `select('id, title, file_url, created_at, report_type')` → `select('id, file_url:final_pdf_url, created_at, report_type')`. Removido `title`, aliasedo `file_url`, preservado `report_type`.

---

## Compliance findings (§III VERIFY del Constitution Check)

### 🟢 Finding F-1 [RESUELTO — FALSE POSITIVE]: `PatientDashboardPageV2.jsx` NO invoca `useClinicalAccessLogger`

> **Status update 2026-04-20 (post spec 008 pre-plan)**: Este finding se resolvió como FALSE POSITIVE. Spec 008 pre-plan research reveló que `useClinicalAccessLogger` excluye intencionalmente el rol `patient` (`src/lib/audit/useClinicalAccessLogger.js:31-36` → early return si `!isClinicalRole`). El hook está alineado con Ley 20.584 art. 13 y Ley 21.719, que regulan transparencia sobre accesos de **terceros**, no auto-consulta. Ver `specs/008-fix-audit-logger-missing-on-patient-dashboard/spec.md §Spec rejected` para el análisis completo. Constitution §III enmendado a v1.1.0 con clarificación explícita. El registro debajo se preserva como evidencia histórica del razonamiento original.

---

Ejecutado `TASK-P2-D1-AUDIT` (R-06 check):

```bash
grep -rn "useClinicalAccessLogger\|clinicalAccessLog\|clinical_access" \
  src/features/patient-dashboard/PatientDashboardPageV2.jsx
# → No matches found
```

Global sanity check:

```bash
grep -rn "useClinicalAccessLogger" src/
# → 3 files:
#   src/lib/audit/useClinicalAccessLogger.js       (el hook)
#   src/features/odontogram/pages/OdontogramEvaluationPage.jsx
#   src/pages/therapist/PatientFilePage.jsx
```

**Evidencia**: `PatientDashboardPageV2.jsx` accede a múltiples tablas con PHI (`session_activities` actividades del paciente, `clinical_reports` reportes clínicos, `appointments` citas) sin invocar el hook de audit clínico. Esto es una potencial violación del **Constitution §III (Append-Only Audit)**:
> "leer datos clínicos sin invocar `useClinicalAccessLogger` es violación. El hook escribe a `clinical_audit_log`."

**Acción tomada (protocolo acordado en tasks.md TASK-P2-D1-AUDIT)**:

- **📝 Document** — este hallazgo queda registrado aquí en data-model.md §Compliance findings.
- **🔀 Defer** — se abre spec follow-up `fix-audit-logger-missing-on-patient-dashboard` (número a asignar cuando se cree).
- **🚫 NO fix inline** — agregar el hook en el mismo PR violaría Principio IV (Micro-Bloques).
- **🚫 NO block spec 007** — el fix de schema drift procede independiente. El dashboard ya leía PHI sin audit antes del spec 007 (las queries fallaban pero parcialmente, y cuando había data la leía igual).

**Path del follow-up**:
- Título sugerido: `fix-audit-logger-missing-on-patient-dashboard`
- Scope: agregar `useClinicalAccessLogger` en `PatientDashboardPageV2.jsx` para cubrir las 4 queries que leen PHI (session_activities, clinical_reports, appointments, clinical_history).
- Precondición: spec 007 cerrado (si no, el archivo está en flujo de cambio y se pisan).
- Revisar también: el dashboard legacy (`src/pages/PatientDashboardPage.jsx`) probablemente tenga el mismo gap — incluir en el follow-up.

**Por qué no es un bug de spec 007**: spec 007 arregla que las queries no devuelvan 400. El gap de audit existe desde antes y persistirá hasta su propio spec. Spec 007 no lo introduce ni lo empeora.

---

## Pre-fix baseline (R-04 mitigation)

**⚠️ Pendiente — no ejecutado por Claude** (requiere navegación manual con DevTools).

Plan original P1.3: Danissa recorre las 14 rutas del Regression Test Inventory en `main` pre-fix y documenta status (OK / Warning / Error pre-existente).

**Status**: DEFERRED. Si Danissa lo ejecuta antes del GO a Phase 2, ideal. Si no, el riesgo R-04 persiste (una regresión en Phase 3 puede ser pre-existente y no introducida por spec 007). Phase 3 Report debe contemplar esto.
