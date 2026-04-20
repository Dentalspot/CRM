# Implementation Plan: Fix — `clinical_audit_log` silencioso (P0)

**Branch**: `003-fix-audit-log-silent` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-fix-audit-log-silent/spec.md`

---

## 🚨 Compliance status

Constitution III violada desde 2026-04-18 06:57 UTC (≥36h al momento de detección). Ley 21.719 ARCO comprometido retroactivamente. **Este plan NO falsifica entradas retroactivas** (FR-005, SC-005). Sólo restaura el path de escritura para eventos futuros + documenta la brecha.

---

## Summary

El hook `useClinicalAccessLogger` invoca `supabase.from('clinical_audit_log').insert(...)` correctamente. La falla está en la **policy RLS `cal_dentist_insert`** (migración `20260416000001_rls_phase3_compliance.sql:19-23`) que exige `is_in_care_team(patient_id)`. Esa función, definida en `20260415100007_rls_phase1_administrative.sql:33-46`, consulta la tabla **`patient_care_team`** (no `care_team` como asumía el diagnóstico inicial — la tabla SÍ existe). Si no hay fila activa para `(patient_id, dentist_id=auth.uid(), is_active=true)`, la policy rechaza el INSERT silenciosamente.

**Causa raíz identificada estáticamente:** la migración `20260415100002_populate_organization_model.sql:220-241` hizo un **backfill one-shot** de `patient_care_team` para pacientes con `therapist_id` + `organization_id` + dentista como miembro activo. **No hay trigger que mantenga `patient_care_team` sincronizado con `patients` post-migración.** Cualquier paciente creado/modificado después del 15-abr que no haya sido registrado manualmente en `patient_care_team` queda fuera del care_team efectivo → policy rechaza logs para él.

**Hipótesis fuerte para el 18-abr:** entre el 17 y el 18 abr hubo pacientes que aún cumplían las condiciones del backfill one-shot (7 logs ocurrieron). Luego se crearon/modificaron pacientes sin que se actualizara `patient_care_team`; desde 2026-04-18 06:57 todos los accesos de prueba fueron a pacientes fuera del care_team y la policy los rechazó. La migración `20260418000001_get_patient_consent_status.sql` NO es la causa (sólo crea una RPC que *usa* `is_in_care_team` como gate). La `20260418000002_revoke_anon_*` tampoco — solo revoca EXECUTE de `anon` sobre esa misma RPC.

**Fix propuesto (Opción A + C, respeta FR-005):**
1. **Backfill reparador** de `patient_care_team` para todos los pacientes con `(therapist_id, organization_id)` válidos que no tengan fila activa hoy.
2. **Trigger** en `patients` INSERT/UPDATE que auto-crea/actualiza `patient_care_team` cuando se asigna `therapist_id` y `organization_id` válidos — previene que el gap vuelva.

**Opción B (agregar fallback `OR therapist_id = auth.uid()` a la policy) queda descartada** porque relaja la policy de Phase 3 (compliance) para volver al comportamiento legacy de Phase 2. Contradice el design intent original y FR-005.

## Technical Context

**Language/Version**: PostgreSQL (Supabase managed); migraciones via Supabase CLI
**Primary Dependencies**: tablas `patient_care_team`, `patients`, `organization_members`; funciones SQL `is_in_care_team`, `is_org_member`
**Storage**: `patient_care_team` (escritura + trigger nuevo); `patients` (solo lectura desde el trigger)
**Testing**: manual QA por Danissa post-deploy siguiendo acceptance scenarios US1 de spec 003
**Target Platform**: Supabase PostgreSQL 17
**Project Type**: backend-only (1 migración DB, sin cambios frontend)
**Performance Goals**: trigger O(1) por INSERT de paciente; backfill O(N) ejecutado una vez (N = pacientes huérfanos, estimado cientos-miles)
**Constraints**: policy RLS NO se relaja (FR-005); append-only triggers se preservan (FR-007); no tocar `clinical_access_log` (FR-004); no tocar logger ni hook frontend (FR-008)
**Scale/Scope**: 1 migración SQL nueva (`20260419NNN_repair_patient_care_team.sql` o similar), 0 cambios frontend, 0 cambios a policies existentes

## Investigation completada (requisitos 1-4 del asesor)

### 1. Definición de `is_in_care_team()`

Localizada en `supabase/migrations/20260415100007_rls_phase1_administrative.sql:33-46`:

```sql
CREATE OR REPLACE FUNCTION public.is_in_care_team(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM patient_care_team
    WHERE patient_id = p_patient_id
      AND dentist_id = auth.uid()
      AND is_active = true
  );
$$;
```

Consulta `patient_care_team` (NO `care_team`). Devuelve `true` solo si hay fila activa para (paciente, dentista-actual, `is_active=true`). `SECURITY DEFINER` bypasea RLS para la consulta interna, así que no hay recursión.

### 2. Contenido de migraciones del 18-abril

- **`20260418000001_get_patient_consent_status.sql`** — crea la función `get_patient_consent_status(uuid)` que usa `is_in_care_team(p_patient_id)` como gate (línea 69). **No toca `is_in_care_team`, `cal_dentist_insert`, ni `clinical_audit_log`.** Propósito: exponer firma de consentimiento al dentista via RPC derivada de `legal_signatures`.
- **`20260418000002_revoke_anon_get_patient_consent_status.sql`** — revoca EXECUTE sobre la RPC anterior desde `anon` y `PUBLIC`. **No toca nada más.** Defensa en profundidad.

**Conclusión:** las migraciones del 18-abr **NO son la causa raíz** del silencio del logger. La correlación temporal es engañosa.

### 3. Estado de `patients.therapist_id` — PENDIENTE LIVE QUERY

No pude ejecutar queries contra producción (política de seguridad: "Read-only SQL via Supabase MCP against the live production project … pulls live audit/compliance data into the transcript"). Para validar la hipótesis, **Danissa debe correr estas queries manualmente en el SQL Editor de Supabase**:

```sql
-- Q1. Estado global del pool de pacientes
SELECT
  count(*)                              AS total,
  count(therapist_id)                   AS with_therapist_id,
  count(*) - count(therapist_id)        AS null_therapist_id,
  count(organization_id)                AS with_org_id,
  count(*) - count(organization_id)     AS null_org_id
FROM public.patients;

-- Q2. Huérfanos (sin fila en patient_care_team activa aunque tengan therapist_id)
SELECT count(*) AS orphan_count
FROM public.patients p
WHERE p.therapist_id IS NOT NULL
  AND p.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  );

-- Q3. Estado de clinical_audit_log
SELECT
  count(*) AS total,
  max(created_at) AS last_entry,
  min(created_at) AS first_entry
FROM public.clinical_audit_log;

-- Q4. Pacientes de Cristóbal (user_id de prueba)
SELECT count(*) AS cristobal_patients_total,
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM public.patient_care_team pct
         WHERE pct.patient_id = p.id
           AND pct.dentist_id = p.therapist_id
           AND pct.is_active = true
       )) AS in_care_team,
       count(*) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM public.patient_care_team pct
         WHERE pct.patient_id = p.id
           AND pct.dentist_id = p.therapist_id
           AND pct.is_active = true
       )) AS orphans
FROM public.patients p
WHERE p.therapist_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046';
```

**Resultado esperado si la hipótesis es correcta:** Q2.`orphan_count` > 0 (hay pacientes con `therapist_id` válido pero sin fila en `patient_care_team`). Q4 mostraría que los pacientes de Cristóbal caen en ese grupo.

### 4. Tablas con nombre "care*"

Localizado estáticamente via `grep` sobre migraciones: **`patient_care_team`** es la única tabla con "care" en el nombre. Existe desde `20260415100000_organization_model_schema.sql:100-112`. Tiene índices únicos sobre `(patient_id, dentist_id) WHERE is_active = true` y sobre `(patient_id) WHERE role = 'primary' AND is_active = true`.

La asunción original de la spec ("la tabla `care_team` NO existe") fue técnicamente correcta pero engañosa: el código referencia `patient_care_team`, no `care_team`. La función `is_in_care_team` nombra el concepto, no la tabla.

## Root cause (con evidencia de migraciones)

1. **Backfill one-shot del 15-abr** (`20260415100002_populate_organization_model.sql:220-241`): pobló `patient_care_team` con tuplas `(patient_id, therapist_id, organization_id, 'primary', true)` para pacientes que cumplían 3 condiciones: `organization_id NOT NULL`, `therapist_id NOT NULL`, dentista miembro activo de la org.
2. **Ningún trigger mantiene la tabla sincronizada**: `grep -rn "TRIGGER.*patient_care_team\|INSERT INTO patient_care_team" supabase/migrations/` sólo devuelve el backfill one-shot y dos migraciones de "resolve" para casos específicos (`resolve_cristobal_tagle`, `resolve_danissa`). No hay `CREATE TRIGGER ON patients`.
3. **Consecuencia:** cualquier paciente creado o cuyo `therapist_id`/`organization_id` haya cambiado después del 15-abr queda fuera del care_team efectivo → `is_in_care_team` devuelve `false` → policy `cal_dentist_insert` rechaza → logger no escribe, fail silencioso (console.warn solo en DEV).
4. **Por qué 7 entradas entre 17 y 18 abr**: esas 7 fueron con pacientes que SÍ fueron incluidos en el backfill inicial. Es plausible que pacientes más nuevos (creados post-backfill) acumulen accesos no registrados, hasta que el flujo de tests del 18-19 abr reveló el problema.

**Hipótesis descartada:** no hay nomenclature drift entre el hook (`userOrgRoles.includes('dentist')`) y la policy (`is_org_member(..., 'dentist')`) — ambos usan `'dentist'` literalmente (confirmado en investigación read-only del turno anterior).

## Technical Change Propuesto

Se crea **una sola migración nueva** con dos secciones:

### Archivo: `supabase/migrations/<TIMESTAMP>_repair_patient_care_team.sql`

```sql
-- ============================================================
-- Fix P0 spec 003: clinical_audit_log silencioso desde 2026-04-18 06:57
--
-- Causa raíz: patient_care_team se pobló una sola vez (15-abr) y no hay
-- trigger que lo mantenga sincronizado. Pacientes creados después quedan
-- fuera del care_team efectivo → is_in_care_team() devuelve false →
-- policy cal_dentist_insert rechaza INSERT al clinical_audit_log.
-- Compliance Constitution III + Ley 21.719 ARCO violada en la ventana.
--
-- Fix:
--   A) Backfill reparador: agregar filas faltantes en patient_care_team
--      respetando las 3 condiciones originales del backfill one-shot.
--   B) Trigger: mantener la tabla sincronizada con patients en adelante.
--
-- NO relaja policy RLS ni cambia funciones; preserva append-only triggers.
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- A. Backfill reparador (idempotente)
-- ───────────────────────────────────────────────────────────
INSERT INTO public.patient_care_team
    (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
SELECT
    p.id,
    p.therapist_id,
    p.organization_id,
    'primary',
    true,
    COALESCE(p.admission_date::timestamptz, p.created_at)
FROM public.patients p
WHERE p.organization_id IS NOT NULL
  AND p.therapist_id IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = p.organization_id
        AND om.user_id = p.therapist_id
        AND om.role = 'dentist'
        AND om.is_active = true
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id = p.therapist_id
        AND pct.is_active = true
  )
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────
-- B. Trigger: sincronizar patient_care_team con patients.
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_patient_care_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo actuar si ambos campos clave están presentes
    IF NEW.therapist_id IS NULL OR NEW.organization_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Validar membresía: el dentista debe ser miembro activo de la org.
    -- Si no lo es, NO insertamos (mantiene consistencia con el backfill original).
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = NEW.organization_id
          AND om.user_id = NEW.therapist_id
          AND om.role = 'dentist'
          AND om.is_active = true
    ) THEN
        RETURN NEW;
    END IF;

    -- INSERT idempotente: si ya existe fila activa (patient, dentist),
    -- no crear duplicado.
    INSERT INTO public.patient_care_team
        (patient_id, dentist_id, organization_id, role, is_active, assigned_at)
    VALUES (
        NEW.id,
        NEW.therapist_id,
        NEW.organization_id,
        'primary',
        true,
        now()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_patient_care_team_insert ON public.patients;
CREATE TRIGGER trg_sync_patient_care_team_insert
    AFTER INSERT ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.sync_patient_care_team();

DROP TRIGGER IF EXISTS trg_sync_patient_care_team_update ON public.patients;
CREATE TRIGGER trg_sync_patient_care_team_update
    AFTER UPDATE OF therapist_id, organization_id ON public.patients
    FOR EACH ROW
    WHEN (
        (OLD.therapist_id IS DISTINCT FROM NEW.therapist_id)
        OR (OLD.organization_id IS DISTINCT FROM NEW.organization_id)
    )
    EXECUTE FUNCTION public.sync_patient_care_team();

COMMENT ON FUNCTION public.sync_patient_care_team() IS
  'Mantiene patient_care_team sincronizado con patients (therapist_id + organization_id). Trigger instalado 2026-04-19 por spec 003 (compliance Constitution III + Ley 21.719 ARCO). Backfill one-shot del 15-abr no cubría nuevos pacientes; este trigger cierra el gap.';
```

### Por qué `ON CONFLICT DO NOTHING`

Hay un índice único parcial en `(patient_id, dentist_id) WHERE is_active = true` (migración `20260415100000_organization_model_schema.sql:120-122`). Si ya existe fila activa, `ON CONFLICT DO NOTHING` previene error. Idempotente.

### Por qué trigger AFTER (no BEFORE)

El fix no valida `NEW` ni lo modifica — solo propaga el hecho a una tabla secundaria. `AFTER` es semánticamente correcto y evita ciclos con otros triggers existentes.

### Por qué NO tocar `cal_dentist_insert`

Design intent de Phase 3 (compliance): rutas estrictas sin fallback legacy. Agregar `OR therapist_id = auth.uid()` resucita el fallback, contradice la intención y hace que el diseño multi-dentista futuro sea regresivo. FR-005 de la spec lo prohíbe explícitamente.

## Test Procedure

### Pre-deploy (staging recomendado, producción en último caso)

1. **Snapshot del estado actual** — ejecutar Q1-Q4 de la sección "Investigation 3" y anotar resultados. Esperado: Q2 > 0 (hay huérfanos).
2. **Aplicar la migración** vía `supabase db push` o `psql`.
3. **Re-ejecutar Q1-Q4** — esperado: Q2 = 0 (todos los huérfanos que califican ahora tienen fila en care_team).

### Acceptance E2E (flujos US1 de la spec 003)

4. **Login como dentista** (Cristóbal). Abrir ficha de un paciente conocido → query:
   ```sql
   SELECT count(*) FROM public.clinical_audit_log
   WHERE patient_id = '<patient_id>'
     AND user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
     AND resource_type = 'clinical_record'
     AND created_at > NOW() - INTERVAL '2 minutes';
   ```
   Esperado: **1**.
5. **Crear nueva evaluación de odontograma** (spec 001 flow) → query equivalente con `resource_type='odontogram'`. Esperado: **1**.
6. **Refresh F5** sobre la misma página → re-query → esperado: sigue siendo **1** (dedup anti-spam, FR-003).

### Regression (flujos no-clínicos)

7. **Crear paciente nuevo** con `therapist_id` + `organization_id` válidos → el trigger debe insertar automáticamente una fila `primary/active` en `patient_care_team`. Verificar:
   ```sql
   SELECT * FROM public.patient_care_team WHERE patient_id = '<nuevo_patient_id>';
   ```
   Esperado: 1 fila `role='primary'`, `is_active=true`, `assigned_at` ≈ `now()`.
8. **Re-asignar paciente** (cambiar `therapist_id` de un paciente existente al nuevo dentista) → trigger UPDATE debe insertar fila del nuevo dentista. La del anterior queda como estaba (el fix no desactiva automáticamente; esa lógica es scope de future spec "care-team-deactivation-on-reassign").

## Documentación de brecha (FR-006, SC-004)

El mensaje del commit de cierre de spec 003 MUST incluir:

```
fix(rls): repair patient_care_team sync — restore clinical_audit_log writes (spec 003)

Constitution III violada en ventana 2026-04-18 06:57 UTC → <TIMESTAMP_FIX> UTC.
Causa raíz: patient_care_team se pobló 15-abr one-shot, no hay trigger que
lo mantenga sincronizado con patients.therapist_id / organization_id.
Pacientes creados post-backfill caen en is_in_care_team() = false, policy
cal_dentist_insert los rechaza silenciosamente (console.warn solo en DEV).

Fix:
 A) Backfill reparador idempotente de patient_care_team.
 B) Trigger sync_patient_care_team en patients INSERT / UPDATE OF (therapist_id, organization_id).
Preserva policy RLS Phase 3 sin relajación (FR-005). Append-only triggers
de clinical_audit_log intactos (FR-007). No toca logger ni hook frontend.

Ley 21.719 ARCO: los accesos en la ventana 18-abr → fix NO son fabricables
retroactivamente (append-only). La brecha queda documentada y cerrada aquí.
```

**Opcional (decidir tras aprobación de plan):** agregar sección "Brechas conocidas" en `.specify/memory/data-compliance.md` citando la ventana. Si se decide, se hace en micro-bloque separado para respetar Constitution IV.

**Entrada administrativa en el log (US2-AS3):** dejada fuera del scope de este plan — implicaría INSERTS administrativos con semántica nueva (`action='technical_gap_marker'`). Proponer en spec futura si Danissa lo considera necesario.

## Risk analysis + Rollback

### Riesgos

1. **El backfill inserta más filas de las esperadas** si Q2.`orphan_count` resulta muy grande (ej. >10k). **Mitigación:** el backfill es un único `INSERT ... SELECT` transaccional; si se cae, `supabase db push` rollbackea. Si la ejecución toma >30s, considerar batching manual (ex. `WHERE p.created_at > '2026-04-01' ORDER BY p.created_at LIMIT 5000` iterado), pero para pools de unidades de miles no es necesario.
2. **Trigger introduce overhead en INSERT de `patients`** — el trigger hace 1 SELECT a `organization_members` + 1 INSERT condicional. O(1) por INSERT, ~2-5ms. Negligible.
3. **Conflicto con future specs de `care_team`** (multi-dentista, UI de gestión) — el trigger inserta `role='primary'` siempre. Si future spec quiere admitir múltiples dentistas con roles distintos, el trigger solo cubre el caso `primary`, otros roles se gestionan en la UI futura. No conflicta.
4. **El backfill ignora pacientes sin `organization_id`** (legacy pre-15-abr) — correcto, coincide con el criterio del backfill original. Esos pacientes ya estaban fuera del care_team antes del bug; no empeora nada.
5. **La policy `cal_dentist_insert` sigue rechazando para pacientes con `therapist_id = NULL`** — correcto. Esta spec NO resuelve pacientes huérfanos totales (sin `therapist_id`); esos requieren gestión administrativa, fuera de scope.

### Rollback

Si el deploy falla o introduce regresión:

```sql
-- Rollback trigger + función
DROP TRIGGER IF EXISTS trg_sync_patient_care_team_insert ON public.patients;
DROP TRIGGER IF EXISTS trg_sync_patient_care_team_update ON public.patients;
DROP FUNCTION IF EXISTS public.sync_patient_care_team();
-- (backfill NO se revierte automáticamente — las filas añadidas son legítimas
--  en el modelo de datos; dejarlas no viola ningún constraint)
```

Tiempo total rollback: <2 minutos vía SQL Editor. Sin impacto en datos existentes.

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| **I. Compliance-First** | ✅ Esta spec existe exclusivamente para restaurar compliance Ley 21.719 y cerrar la brecha. |
| **II. RLS-First Security** | ✅ El fix NO relaja ninguna policy RLS. La lógica de seguridad vive donde ya vivía (policy + función SECURITY DEFINER). |
| **III. Append-Only Clinical Audit** | ✅ Triggers append-only de `clinical_audit_log` preservados (FR-007). Ninguna entrada retroactiva fabricada (SC-005). |
| **IV. Micro-Bloques** | ✅ 1 migración única con 2 cambios relacionados (backfill + trigger). Out of scope enumerado en spec (9 ítems). Rollback <2min. |
| **V. UI Honesty** | ✅ Sin cambios a toasts ni UI. La brecha 18-abr → fix se documenta en commit (FR-006) sin ocultarla. |
| **VI. Schema Drift Zero** | ✅ No introduce drift — al contrario, cierra un drift pre-existente entre `patients.therapist_id` y `patient_care_team`. |

## NO tocar (scope estricto)

- `src/` (frontend) — cero cambios. El hook y el logger están correctos.
- `src/lib/audit/*` — sin cambios.
- `DashboardRouter.jsx`, otros módulos — intactos.
- Policy `cal_dentist_insert` y todas las demás policies existentes — sin modificación.
- Función `is_in_care_team` — sin modificación.
- Tabla `patient_care_team` — esquema sin cambio (solo se insertan filas).
- Tabla `patients` — esquema sin cambio (solo se añaden triggers sobre ella).
- Tabla `clinical_audit_log` — sin escrituras directas desde la migración; el path normal (dentista+logger) vuelve a funcionar post-fix.
- `clinical_access_log` (módulo clinical-passport) — intacto (FR-004).
- Los 4 docs fundacionales de `.specify/memory/` — intactos. Actualizar `data-compliance.md` con "Brechas conocidas" es micro-bloque separado opcional.
- `CLAUDE.md` — intacto.
- `specs/001-*`, `specs/002-*` — intactos.
- Commits — los hace Danissa.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-audit-log-silent/
├── spec.md                         # Specification (ya creada)
├── plan.md                         # This file
├── checklists/
│   └── requirements.md             # Quality checklist (ya creada)
└── tasks.md                        # [Pending /speckit-tasks]
```

No se generan `research.md`, `data-model.md`, `quickstart.md` ni `contracts/` porque:
- Research está inline en este plan (investigación completa).
- Data model: no hay columnas nuevas; solo filas y trigger.
- Quickstart: cubierto por "Test Procedure".
- Contracts: no aplica.

### Source Code (repository root) — archivos afectados

```text
supabase/
└── migrations/
    └── <TIMESTAMP>_repair_patient_care_team.sql   # nuevo, ~80 líneas
```

**1 archivo nuevo, 0 archivos modificados.**

## Complexity Tracking

Sin violaciones a justificar. El plan usa el patrón idiomático de Supabase (migración + `ON CONFLICT DO NOTHING` + `SECURITY DEFINER` function) sin introducir abstracciones nuevas.

## Pre-flight checklist para `/speckit-tasks`

Antes de proceder a generación de tasks:

- [ ] Spec 003 aprobada.
- [ ] Plan 003 aprobado por el asesor (este documento).
- [ ] Danissa ejecuta las 4 queries SQL de "Investigation 3" en staging o prod **read-only** para validar que Q2.`orphan_count` > 0. Si Q2 = 0, la hipótesis está errada y el plan debe revisarse antes de `/speckit-tasks`.
- [ ] Decisión sobre si agregar "Brechas conocidas" a `data-compliance.md` — puede ser este plan o micro-bloque separado.

---

**Last updated**: 2026-04-19
**Readiness**: Plan listo para review. Queries pre-flight no bloqueantes (pueden validarse en paralelo con review del plan). Si Q2 confirma huérfanos, proceder a `/speckit-tasks`. Si no, revisar hipótesis antes.
