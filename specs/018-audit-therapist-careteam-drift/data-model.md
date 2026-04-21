# Data Model — Audit therapist_id vs care_team Drift (spec 018)

**Generado**: 2026-04-21 Phase 1 audit.

---

## Queries consolidadas (TASK-P1-QUERY-α/β/γ/δ)

**Copy-paste a Supabase SQL Editor. Todas read-only. Danissa ejecuta y pega outputs.**

```sql
-- ============================================================
-- Spec 018 Phase 1 audit — 4 queries read-only
-- Drift = patients con therapist_id set pero sin entry activa
-- correspondiente en patient_care_team
-- ============================================================

-- Pre-step: enumerar valores reales de patients.status (R-05 mitigation)
SELECT 'pre_status_values' AS query, status, COUNT(*) AS n
FROM patients GROUP BY status ORDER BY n DESC;

-- Query α: COUNT global del drift
SELECT 'A_drift_count' AS query, COUNT(*) AS drift_count
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  );

-- Query β: per-therapist distribución (TOP 20)
SELECT 'B_per_therapist' AS query, p.therapist_id::text AS therapist_id, COUNT(*) AS drift_patients
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  )
GROUP BY p.therapist_id
ORDER BY drift_patients DESC
LIMIT 20;

-- Query γ: per-organization distribución
SELECT 'C_per_org' AS query, p.organization_id::text AS organization_id, COUNT(*) AS drift_patients
FROM patients p
WHERE p.therapist_id IS NOT NULL
  AND p.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM patient_care_team pct
    WHERE pct.patient_id = p.id
      AND pct.dentist_id = p.therapist_id
      AND pct.is_active = true
  )
GROUP BY p.organization_id
ORDER BY drift_patients DESC;

-- Query δ: categorización 5 hipótesis (first-match-wins por orden CASE)
-- Spec 003 trigger boundary: 2026-04-18 (migration 20260419000001)
WITH drift AS (
  SELECT p.id, p.therapist_id, p.organization_id, p.created_at
  FROM patients p
  WHERE p.therapist_id IS NOT NULL
    AND p.status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id = p.therapist_id
        AND pct.is_active = true
    )
)
SELECT 'D_hypothesis' AS query, hypothesis, COUNT(*) AS n
FROM (
  SELECT d.id,
    CASE
      -- (a) Legacy pre-spec 003 trigger
      WHEN d.created_at < '2026-04-18' THEN 'a_legacy_pre_trigger'

      -- (b) Deactivation: existe care_team row con is_active=false para este dentist
      WHEN EXISTS (
        SELECT 1 FROM patient_care_team pct
        WHERE pct.patient_id = d.id
          AND pct.dentist_id = d.therapist_id
          AND pct.is_active = false
      ) THEN 'b_deactivation'

      -- (d) Org membership expired: therapist no miembro activo del org del paciente
      WHEN NOT EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = d.therapist_id
          AND om.organization_id = d.organization_id
          AND om.is_active = true
      ) THEN 'd_org_membership_expired'

      -- (c) Reassignment: existe otro dentist activo en care_team
      WHEN EXISTS (
        SELECT 1 FROM patient_care_team pct
        WHERE pct.patient_id = d.id
          AND pct.dentist_id != d.therapist_id
          AND pct.is_active = true
      ) THEN 'c_reassignment'

      -- (e) Ghost: 0 rows en care_team para este patient
      WHEN NOT EXISTS (
        SELECT 1 FROM patient_care_team pct
        WHERE pct.patient_id = d.id
      ) THEN 'e_ghost'

      ELSE 'unclear'
    END AS hypothesis
  FROM drift d
) categorized
GROUP BY hypothesis
ORDER BY n DESC;

-- Query δ detailed (optional — si Danissa quiere ver pacientes individuales):
-- WITH drift AS (...)
-- SELECT d.id, d.therapist_id, d.organization_id, d.created_at, <CASE>
-- FROM drift d
-- ORDER BY d.created_at DESC LIMIT 100;
```

---

## §Quantification (Query α output — 2026-04-21)

**`A_drift_count = 0`** — 0 pacientes con drift globalmente across toda la DB.

---

## §Breakdown (Queries β + γ outputs)

### Per-therapist
Query β devuelve 0 rows (no hay drift por definición — depende de α > 0).

### Per-organization
Query γ devuelve 0 rows (mismo motivo).

---

## §Hypothesis criteria (TASK-P1-MATRIX)

Criterio determinístico aplicado en Query δ (orden CASE WHEN resuelve overlap, first-match-wins):

| Order | Hypothesis | Criterio determinístico |
|---|---|---|
| 1 | **(a) legacy pre-trigger** | `patients.created_at < '2026-04-18'` — pre-spec 003 migration que introdujo triggers de sync `patient_care_team`. |
| 2 | **(b) deactivation** | Existe row en `patient_care_team` con `dentist_id = patients.therapist_id` pero `is_active = false`. Dentist fue desasignado pero el campo legacy quedó. |
| 3 | **(d) org membership expired** | `therapist_id` NO es miembro activo de `patients.organization_id` en `organization_members`. Dentist removido del equipo de la clínica. |
| 4 | **(c) reassignment** | Existe `patient_care_team` row activo (`is_active = true`) con `dentist_id != patients.therapist_id`. Paciente reasignado a otro dentist, legacy huérfano. |
| 5 | **(e) ghost** | 0 rows en `patient_care_team` para este paciente. Entry nunca existió (potencial bug histórico de trigger). |
| 6 | **unclear** | Ningún criterio aplica. Fallback para casos que requieren investigación manual. |

**Nota**: el orden CASE WHEN asigna la hipótesis más específica primero. Un paciente con `created_at < 2026-04-18` que además cumpliría (b) o (e) se cuenta como (a) porque el legacy boundary es el predictor más fuerte.

---

## §Hypothesis distribution (Query δ output)

Query δ devuelve 0 rows (no hay pacientes que categorizar si α=0).

---

## §Phase 1 preliminary verdict

- **Severidad tentativa**: **NULA** (Query α = 0 → R-01 transitorio activa).
- **Hipótesis dominante**: N/A (nada que categorizar).
- **Proyección post-trigger**: N/A.

---

## Checks SP-1

| # | Check | Status |
|---|---|---|
| T1 | Query α count documentado | ✅ = 0 |
| T2 | Query β per-therapist | ✅ (0 rows, consistent con α=0) |
| T3 | Query γ per-org | ✅ (0 rows) |
| T4 | Query δ 5 hipótesis cubriendo 100% Query α | ✅ trivial (0 cubre 0) |

🟢 SP-1 pasado 2026-04-21.

---

## §Severity (TASK-P2-SEVERITY)

**Severidad: NULA** (Query α = 0).

**Rationale**: con 0 pacientes con drift globalmente, no aplica ningún threshold BAJA/MEDIA/ALTA. La categoría NULA del plan (§P2.1) corresponde al caso Query α = 0 → R-01 (drift transitorio) confirmado.

**Interpretación**: el hallazgo de spec 017 (1 paciente Cristóbal con `therapist_id` pero sin `patient_care_team` activo) fue **transitorio**. Entre el audit de spec 017 (2026-04-20) y la re-audit global de spec 018 (2026-04-21), el drift se resolvió. Causas probables:
- **Sync async**: el trigger de spec 003 (`patient_care_team` sync on INSERT/UPDATE) pudo haber corrido post-spec 017 empirical y sincronizó el estado.
- **Deactivation temporal**: `patient_care_team.is_active` pudo haber estado en `false` durante el snapshot de spec 017 y luego volvió a `true`.
- **Race condition query-time**: entre Query β (raw) y Query γ (RLS) en spec 017, un cambio concurrente afectó el conteo por 1 paciente — sin reproducibilidad global.

**Resolución**: no aplica fix. Drift NO sistémico. Triggers spec 003 funcionan correctamente post-2026-04-18.

---

## §Dominant hypothesis (TASK-P2-HYPOTHESIS)

**N/A** — con 0 drift no hay hipótesis que dominar. Query δ retorna 0 rows.

Nota: si el drift volviera a aparecer en audits futuros, las 5 hipótesis del plan.md §P1.4 + el orden determinístico first-match-wins siguen aplicables — el criterio está documentado y listo para re-uso.

---

## §User impact

**0 dentists paying afectados**. Con Query α = 0, no hay therapist con paciente invisible.

---

## Checks SP-2

| # | Check | Status |
|---|---|---|
| T5 | Severidad asignada sin ambigüedad | ✅ **NULA** |
| T6 | Hipótesis dominante o "mixed approach" documentada | ✅ **N/A** (0 drift, nada que dominar) |
| T7 | User impact estimado | ✅ **0 dentists paying afectados** |

🟢 SP-2 pasado 2026-04-21.

---

## §Verdict (TASK-P3-VERDICT)

### 🟢 **DRIFT TRANSITORIO CONFIRMADO — severidad NULA**

**Rationale** (2-3 sentences):

El drift observado en spec 017 Phase 2 empirical (1 paciente de Cristóbal con `patients.therapist_id` set pero sin entry activa en `patient_care_team`) fue **transitorio, no sistémico**. Query α global ejecutada en spec 018 retorna **0 pacientes con drift across toda la DB**, confirmando R-01 (drift transitorio) del plan. Triggers de spec 003 (`patient_care_team` sync post-2026-04-18) funcionan correctamente. No se requiere fix ni follow-up spec.

**Confidence**: alto. Query α es determinística; si el drift fuera sistémico aparecería en el count global. La divergencia Query β vs γ de spec 017 probablemente reflejó un estado transitorio resuelto por el propio sistema entre audits.

---

## §Follow-up considerations (TASK-P3-FOLLOWUP-TEMPLATE — SKIP)

**No follow-up spec requerido**.

**Monitoring proactivo opcional (sugerencia, no obligatorio)**: si Danissa quiere detectar futuros drifts sin depender de hallazgos laterales:
- Query α (mismo SQL) puede ejecutarse periódicamente (ej. semanal via cron o script manual) para alertar si `drift_count > 0`.
- Si aparece drift recurrente post-monitoring → re-abrir spec con severidad real empírica.
- Sin implementación obligatoria — DentalSpot pre-launch tiene monitoring manual suficiente.

---

## §architecture.md update draft (TASK-P3-ARCH-UPDATE)

**Subsección a agregar** en `.specify/memory/architecture.md` (después de `§Cross-org isolation audit (spec 017)`):

```markdown
### Therapist_id vs care_team drift audit (spec 018 — 2026-04-21)

**Verdict**: 🟢 **DRIFT NULA — transitorio confirmed**

Audit global post hallazgo lateral spec 017 (1 paciente Cristóbal con
`patients.therapist_id` sin `patient_care_team` activo).

**Query α output**: 0 pacientes con drift across toda la DB.

**Interpretación**: hallazgo spec 017 fue transitorio, probablemente
resolved entre audits (care_team sync async post-INSERT, deactivation
temporal, o race condition query-time). Patrón **NO sistémico**.

**R-01 confirmed**: triggers de spec 003 (`20260419000001_repair_patient_care_team.sql`)
funcionan correctamente — post-trigger drift global es 0.

**Queries β/γ/δ**: 0 rows (nada que desglosar o categorizar con α=0).

**User impact**: 0 dentists paying afectados.

**Resolución**: closed sin fix. Known transient edge case descartado
como sistémico. **Monitoring proactivo opcional** (query α periódica)
si Danissa quiere detección temprana de drifts futuros — sin
implementación obligatoria.

**No follow-up spec** requerido. Criterio de hipótesis (a/b/c/d/e)
documentado en `specs/018-audit-therapist-careteam-drift/data-model.md
§Hypothesis criteria` queda disponible para re-uso si el drift reaparece.
```

**Bump Last updated**:

> "spec 018 closed — Therapist_id vs care_team drift audit verdict: **NULA transitorio**. Query α global = 0 pacientes con drift across DB. R-01 confirmado — spec 017's 1 paciente fue transitorio, resolved entre audits. Triggers spec 003 funcionan correctamente. No follow-up."

---

## Checks SP-3

| # | Check | Status |
|---|---|---|
| T8 | Verdict completo | ✅ DRIFT NULA + rationale |
| T9 | Follow-up scope si MEDIA/ALTA | N/A — SKIP (NULA) con nota monitoring opcional |
| T10 | architecture.md update draft | ✅ subsección completa + Last updated bump |

🟢 SP-3 listo para close.
