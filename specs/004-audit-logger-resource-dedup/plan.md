# Implementation Plan: Fix — `resource_id` en el bucketKey anti-spam

**Branch**: `004-audit-logger-resource-dedup` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-audit-logger-resource-dedup/spec.md`

---

## Summary

El hook `src/lib/audit/useClinicalAccessLogger.js` genera la clave de dedup anti-spam por hora (`hourBucketKey`) usando `userId + patientId + action + resourceType + YYYY-MM-DD-HH`, **sin `resourceId`**. Resultado: dos recursos distintos (ej. evaluaciones A y B) del mismo paciente en la misma hora producen el mismo bucketKey → la 2ª quedá bloqueada por `sessionStorage.getItem(bucketKey)` → NO se registra en `clinical_audit_log`. **Fix quirúrgico de 3 líneas** en 1 archivo: añadir `resourceId` al destructuring de la firma, añadir `${resourceId ?? ''}` al template string del return, y pasar `resourceId` al callsite. Comportamiento retro-compatible para consumidores donde `resourceId === patientId` (ej. `PatientFilePage`) y correcto para consumidores con recurso específico (ej. `OdontogramEvaluationPage` con `evaluationId`).

## Technical Context

**Language/Version**: JavaScript (JSX), React 18.2.0
**Primary Dependencies**: React `useEffect` + `useRef`; `sessionStorage` (browser API); `@supabase/supabase-js` (vía util `clinicalAuditLogger.js`, no tocado).
**Storage**: `sessionStorage` del browser (bucketKey); tabla `clinical_audit_log` (lectura indirecta via logger, sin cambios de schema).
**Testing**: manual QA por Danissa con queries SQL sobre `clinical_audit_log`, cuenta de prueba Cristóbal.
**Target Platform**: Navegador moderno (Chrome, Firefox, Safari).
**Project Type**: Web SPA.
**Performance Goals**: O(0) impacto — solo cambia la composición de un string.
**Constraints**: 1 archivo, ~3 líneas modificadas. NO tocar logger util (FR-005), NO tocar consumidores (a menos que falten callsites sin `resourceId` — gate explícito), NO tocar RLS/migrations/edge functions, NO tocar otros módulos.
**Scale/Scope**: 1 archivo (`src/lib/audit/useClinicalAccessLogger.js`), 3 ediciones puntuales.

## Verificación del código actual (requisito 1 del asesor)

Lectura directa del hook + grep dirigido confirman:

| Ítem | Línea | Contenido actual |
|---|---|---|
| Firma de `hourBucketKey` | **9** | `function hourBucketKey({ userId, patientId, action, resourceType }) {` |
| Template string del return | **15** | `return \`clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${y}-${m}-${d}-${h}\`;` |
| Callsite de `hourBucketKey({...})` | **41–46** | `const bucketKey = hourBucketKey({ userId: user.id, patientId, action, resourceType });` (multi-línea) |
| `resourceId` como parámetro del hook | **22** | `resourceId = null,` — ya existe con default `null`, no requiere cambio |
| `tupleKey` intra-mount (no tocar) | **38** | `const tupleKey = \`${patientId}\|${action}\|${resourceType}\|${resourceId ?? ''}\`;` — ya incluye `resourceId`, correcto según spec 004 out-of-scope |
| `useEffect` dependency array (no tocar) | **78** | `[patientId, action, resourceType, resourceId, user?.id, currentOrganizationId, userOrgRoles]` — `resourceId` ya listado |

**Sin discrepancias con la spec.** El fix se limita exactamente a las 3 ediciones propuestas.

## Technical Change Propuesto (requisito 2 del asesor)

### Edit 1 — Firma de `hourBucketKey` (línea 9)

```js
// contexto (línea 8):
// dentro de la misma hora (p.ej. navegar ficha → odontograma → ficha).
ANTES:
function hourBucketKey({ userId, patientId, action, resourceType }) {

DESPUÉS:
function hourBucketKey({ userId, patientId, action, resourceType, resourceId }) {
  const now = new Date();   // contexto (línea 10), sin cambio
```

### Edit 2 — Template string del return (línea 15)

```js
// contexto (línea 14):
//   const h = String(now.getHours()).padStart(2, '0');
ANTES:
  return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${y}-${m}-${d}-${h}`;

DESPUÉS:
  return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${resourceId ?? ''}:${y}-${m}-${d}-${h}`;
}   // contexto (línea 16), sin cambio
```

**Posición elegida**: `resourceId` insertado **después de `resourceType` y antes del segmento horario**. Razón: agrupa los identificadores semánticos (user/patient/action/resourceType/resourceId) contiguos, antes del sufijo temporal. Cualquier posición es funcionalmente equivalente; elegimos la más legible.

### Edit 3 — Callsite (líneas 41–46)

```js
// contexto (línea 40):
    // sessionStorage puede fallar en modo privado; continuamos sin bucket.
ANTES:
    const bucketKey = hourBucketKey({
      userId: user.id,
      patientId,
      action,
      resourceType,
    });

DESPUÉS:
    const bucketKey = hourBucketKey({
      userId: user.id,
      patientId,
      action,
      resourceType,
      resourceId,
    });
// contexto (línea 47):
    try {
```

**Nota de implementación**: los 3 edits pueden hacerse con `Edit replace_all: false` porque cada `old_string` tiene contexto único en el archivo. **NO usar `replace_all: true`** — el template string de `tupleKey` en línea 38 tiene patrón similar (`resourceType`) y podría confundir el matcher.

## Callsites del hook y análisis de impacto (requisitos 3 y 4 del asesor)

`grep -rn "useClinicalAccessLogger" src/ | grep -v "src/lib/audit/"` devuelve:

| Archivo:línea | ¿Pasa `resourceId`? | Valor pasado | Comportamiento post-fix |
|---|---|---|---|
| `src/pages/therapist/PatientFilePage.jsx:24` | import (N/A) | — | — |
| `src/pages/therapist/PatientFilePage.jsx:136` | ✅ SÍ | `resourceId: patientData?.patient?.id \|\| null` | bucketKey incluye `patient.id`. Dos aperturas de la MISMA ficha = misma key → dedup funciona. Dos pacientes distintos = keys distintas → ambos loggean (esto ya pasaba antes porque `patientId` ya diferenciaba). **US3 cumplida — compat total.** |
| `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:24` | import (N/A) | — | — |
| `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:81` | ✅ SÍ | `resourceId: evaluationId \|\| null` | bucketKey incluye `evaluation.id`. Dos evaluaciones distintas del mismo paciente en la misma hora = 2 bucketKeys distintos → 2 INSERTs independientes. **US1 cumplida.** Refresh en la misma evaluación = misma key → dedup intra-evaluación funciona. **US2 cumplida.** |
| `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:176` | — (comentario) | — | Solo referencia textual ("required for `useClinicalAccessLogger` to fire"), no es invocación. Ignorar. |

**Total consumidores efectivos:** 2. **Ambos ya pasan `resourceId` explícitamente**, con valores que coinciden con el comportamiento esperado:
- `PatientFilePage`: `resourceId = patient.id` → equivalente a usar `patient.id` como desambiguador. Para este flujo el `resourceType='clinical_record'` siempre apunta al mismo paciente, así que `resourceId` redundante con `patientId` → no cambia la semántica, sí cumple US3.
- `OdontogramEvaluationPage`: `resourceId = evaluationId` → desambigua entre múltiples evaluaciones del mismo paciente. Cumple US1 y US2.

**Hallazgo adicional**: los 2 consumidores actuales del hook YA pasan `resourceId` correctamente. No existe un callsite que lo omita y requiera fix adicional. Si en el futuro alguien agrega un consumidor que omita el parámetro, el default `resourceId = null` (línea 22) lo maneja vía `${resourceId ?? ''}` del template post-fix — bucketKey estable y único por (user, patient, action, resourceType, hora). Comportamiento back-compatible.

**Conclusión**: no hay callsites que requieran cambio adicional. El scope queda estrictamente en 1 archivo (`useClinicalAccessLogger.js`). ✅

## Manual Test Procedure (requisito 6 del asesor)

### Setup

Login como Cristóbal (`dentalspot.cl@gmail.com`, `user_id = 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`). Paciente de prueba: `e0f26605-...` (o cualquiera con `patient_care_team` activo tras spec 003).

### Paso 1 — Baseline SQL

```sql
SELECT
  count(*) AS total_last_hour,
  max(created_at) AS last_entry
FROM public.clinical_audit_log
WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
  AND patient_id = '<PATIENT_ID_DE_PRUEBA>'
  AND resource_type = 'odontogram'
  AND created_at > NOW() - INTERVAL '1 hour';
```

Anotar `N` = `total_last_hour` inicial. **Pass criterion:** query ejecuta sin error.

### Paso 2 — Crear evaluación A

Browser: `/dashboard/therapist/odontograma/nueva?patient=<PATIENT_ID>` → completar Step 1 → "Iniciar Evaluación". Anotar el `evaluation_id_A` (visible en la URL `/dashboard/therapist/odontograma/<uuid>`).

### Paso 3 — Query post-A

```sql
SELECT id, resource_id, created_at
FROM public.clinical_audit_log
WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
  AND patient_id = '<PATIENT_ID>'
  AND resource_type = 'odontogram'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

**Pass criterion:** count = `N + 1`, la fila nueva tiene `resource_id = <evaluation_id_A>`.

### Paso 4 — Crear evaluación B (MISMA hora, MISMO paciente)

Volver al listado → "Nueva Evaluación" → MISMO paciente → "Iniciar Evaluación". Anotar `evaluation_id_B` (distinto de A).

### Paso 5 — Query post-B (🎯 la que valida el fix)

Re-ejecutar query del Paso 3.

**Pass criterion:** count = `N + 2`. Dos filas: una con `resource_id = <evaluation_id_A>`, otra con `resource_id = <evaluation_id_B>`. **Pre-fix este paso fallaría con count = `N + 1` (la B bloqueada por dedup).**

### Paso 6 — Refresh intra-recurso (🎯 regresión check)

Navegar a `/dashboard/therapist/odontograma/<evaluation_id_A>`. F5 refresh 3 veces. Re-ejecutar query del Paso 3.

**Pass criterion:** count **sigue siendo `N + 2`** (ni +3 ni +5). Dedup intra-recurso mantenido por `sessionStorage` bucket estable para el mismo (user, patient, action, resourceType, resourceId, hora).

### Paso 7 — Regresión `PatientFilePage` (US3)

Query baseline para `clinical_record`:
```sql
SELECT count(*) AS baseline FROM public.clinical_audit_log
WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
  AND patient_id = '<PATIENT_ID>'
  AND resource_type = 'clinical_record'
  AND created_at > NOW() - INTERVAL '1 hour';
```

Abrir `/dashboard/patients/<PATIENT_ID>` (la ficha). Re-ejecutar query.

**Pass criterion:** count = baseline + 1 (primer acceso en la hora) o baseline (si ya había uno dentro de la hora). F5 refresh sobre la ficha no añade más filas.

## Risk Analysis (requisito 7 del asesor)

### Riesgos potenciales

1. **Consumidor oculto que omite `resourceId`** y dependía del comportamiento anterior de dedup cruzado-recursos (improbable pero posible).
   - **Mitigación**: grep exhaustivo confirmó solo 2 consumidores (`PatientFilePage`, `OdontogramEvaluationPage`), ambos pasan `resourceId` explícitamente. El default `null` del parámetro preserva el comportamiento antiguo vía `${null ?? ''}` = `''` en el template. Riesgo residual mínimo.
2. **Colisión de UUID entre `resourceType` distintos** (ej. un `clinical_record` y un `odontogram` con el mismo UUID simultáneamente).
   - **Mitigación**: `resourceType` sigue en el bucketKey — desambigua. No es un riesgo real.
3. **`sessionStorage` llena** por bucketKeys más largos.
   - **Mitigación**: cada bucketKey crece ~36 chars (UUID length). Con 200 aperturas por sesión = ~14 KB total. Muy por debajo del límite ~5 MB. Despreciable.
4. **Usuario en modo incógnito** donde `sessionStorage` falla.
   - **Mitigación**: el hook ya tiene el `try/catch` correspondiente (líneas 48–55) y el `loggedRef` intra-mount sigue previniendo doble-fire. Sin cambios ni regresión.

### Rollback

Si el fix introduce regresión en staging/prod:

```bash
git checkout -- src/lib/audit/useClinicalAccessLogger.js
```

<10 segundos. Sin migraciones que revertir, sin redeploy de edge functions. El build de Vercel regenera con el código previo.

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| **I. Compliance-First** | ✅ Cierra un gap de Ley 21.719 ARCO (la 2ª evaluación en la misma hora del mismo paciente deja de ser silenciosa). |
| **II. RLS-First Security** | ✅ Sin cambios a RLS. El fix opera puramente en el lado cliente (bucketKey de sessionStorage). La policy `cal_dentist_insert` sigue intacta. |
| **III. Append-Only Clinical Audit** | ✅ Restaura el contrato: todo acceso clínico deja rastro. Ninguna entrada retroactiva fabricada (FR-006). Triggers append-only del DB sin tocar. |
| **IV. Micro-Bloques** | ✅ 1 archivo, 3 líneas modificadas. Out of Scope enumerado en spec (8 ítems). Rollback <10s. |
| **V. UI Honesty** | ✅ Sin cambios a toasts ni UI. El fix es invisible al usuario final salvo por el efecto correcto de ver sus accesos completos en `PatientAccessHistoryPage`. |
| **VI. Schema Drift Zero** | ✅ Sin cambios a DB, schema, migraciones ni columnas. Cero drift introducido. |

## Scope estricto — NO tocar (requisito 5 del asesor)

Lista explícita:

- **`src/lib/audit/clinicalAuditLogger.js`** — logger util, intacto.
- **`src/pages/therapist/PatientFilePage.jsx:136`** — consumidor; ya pasa `resourceId` correctamente, no requiere cambio.
- **`src/features/odontogram/pages/OdontogramEvaluationPage.jsx:81`** — consumidor; ya pasa `resourceId = evaluationId`, no requiere cambio.
- **`OdontogramEvaluationPage.jsx:176`** — comentario referencial, no es invocación del hook.
- **Policies RLS** (`cal_dentist_insert`, `cal_admin_insert`, etc.) y función `is_in_care_team` — intactos.
- **`supabase/migrations/`, `supabase/policies.sql`, `supabase/functions/`** — sin cambios de data layer.
- **Otros módulos** clínicos, admin, marketplace, etc. — intactos.
- **Los 4 docs fundacionales de `.specify/memory/`** — intactos (data-compliance.md ya lista esta spec como deuda resuelta tras cerrar 004; la actualización del texto "pendiente → cerrada" es micro-bloque posterior opcional).
- **`CLAUDE.md`** — intacto.
- **Artifacts de specs previas** (`specs/001-*`, `specs/002-*`, `specs/003-*`) — intactos.
- **Commits y pushes** — los hace Danissa tras test manual.

## Project Structure

### Documentation (this feature)

```text
specs/004-audit-logger-resource-dedup/
├── spec.md                         # Specification (ya creada)
├── plan.md                         # This file
├── checklists/
│   └── requirements.md             # Quality checklist (ya creada)
└── tasks.md                        # [Pending /speckit-tasks]
```

No se generan `research.md`, `data-model.md`, `quickstart.md` ni `contracts/`:
- Research: inline en este plan (verificación de líneas exactas + grep de consumidores).
- Data model: no hay cambio de schema.
- Quickstart: cubierto por "Manual Test Procedure".
- Contracts: no aplica.

### Source Code (repository root) — archivos afectados

```text
src/
└── lib/
    └── audit/
        └── useClinicalAccessLogger.js   # 3 ediciones puntuales (líneas 9, 15, 41-46)
```

**1 archivo modificado. 0 archivos nuevos. 0 archivos eliminados.**

## Complexity Tracking

Sin violaciones a justificar. El plan es el cambio mínimo posible que cierra el gap (1 parámetro, 1 inserción en template, 1 paso-de-parámetro). No hay alternativas arquitectónicas a comparar.

## Pre-flight checklist para `/speckit-tasks`

- [ ] Spec 004 aprobada (review 5 líneas).
- [ ] Plan 004 aprobado por el asesor (este documento).
- [ ] Confirmación de que el test manual lo ejecuta Danissa (esperado, mismo patrón que specs 001/002/003).
- [ ] Decisión sobre si actualizar `data-compliance.md` §"Deuda compliance conocida" para marcar "Agregar `resource_id` al bucketKey" como cerrada — puede ir en el mismo commit del fix o en micro-bloque posterior.

---

**Last updated**: 2026-04-20
**Readiness**: Plan listo para review. Cero discrepancias con código actual. Scope cerrado. Listo para `/speckit-tasks` tras aprobación del asesor.
