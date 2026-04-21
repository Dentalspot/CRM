# Data Model — Lockdown PIE + debug_signup_logs Tables (spec 016)

**Generado**: 2026-04-20 Phase 1 audit.

---

## Pre-apply snapshot

*Pendiente queries A/B/C de Danissa en SQL Editor. Ver §Queries consolidadas.*

| Query | Target | Expected | Actual |
|---|---|---|---|
| A | `rowsecurity` + `policy_count` para 6 tablas | 6 rows, rowsecurity=false, policy_count=0 | — |
| B | `COUNT(*)` de 6 tablas | bajo (0 PIE dormant, variable debug) | — |
| C | `information_schema.columns` 6 tablas | 6 tablas existentes con ≥3 columnas | — |

---

## Queries consolidadas (copy-paste a Supabase SQL Editor)

```sql
-- Spec 016 Phase 1 audit — read-only, ejecutar en bloque

-- Query A: rowsecurity + policy_count
SELECT
  'A' AS query,
  t.tablename,
  t.rowsecurity,
  (SELECT COUNT(*) FROM pg_policies p
   WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'pie_sessions', 'pie_students', 'pie_paci',
    'pie_schedule_blocks', 'pie_therapist_schools',
    'debug_signup_logs'
  )
ORDER BY t.tablename;

-- Query B: row counts
SELECT 'pie_sessions' AS tbl, COUNT(*)::text AS row_count FROM pie_sessions
UNION ALL SELECT 'pie_students', COUNT(*)::text FROM pie_students
UNION ALL SELECT 'pie_paci', COUNT(*)::text FROM pie_paci
UNION ALL SELECT 'pie_schedule_blocks', COUNT(*)::text FROM pie_schedule_blocks
UNION ALL SELECT 'pie_therapist_schools', COUNT(*)::text FROM pie_therapist_schools
UNION ALL SELECT 'debug_signup_logs', COUNT(*)::text FROM debug_signup_logs;

-- Query C: schema validation
SELECT 'C' AS query, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'pie_sessions', 'pie_students', 'pie_paci',
    'pie_schedule_blocks', 'pie_therapist_schools',
    'debug_signup_logs'
  )
ORDER BY table_name, ordinal_position;
```

---

## Callsite wrap analysis (TASK-P1-GREP-FRONTEND completado)

### Feature flag canónico confirmado

`src/constants/featureFlags.js:10-20`:
```js
export const FEATURE_FLAGS = {
  PIE_ESCOLAR: false,
  ADOS2: false,
  ADIR: false,
  TEA: false,
  SENSORIAL_PROFILE: false,
  EDUCATOR: false,
};
```

**`FEATURE_FLAGS.PIE_ESCOLAR = false` confirmado** (spec 010 reconfirm 2026-04-20).

### Tabla de callsites por tabla

| Tabla | Callsite count | Wrap status | Path |
|---|---|---|---|
| `pie_sessions` | 3 | ✅ transitively wrapped | `src/features/pie/PieSessionsTab.jsx:40,92` + `PieReportsTab.jsx:54`. Rendered via `PieDashboardPage` declared inside `DashboardRouter.jsx:131 {FEATURE_FLAGS.PIE_ESCOLAR && ...}`. |
| `pie_students` | 0 | ✅ safe | Sin callsites activos frontend. |
| `pie_paci` | 4 | ✅ transitively wrapped | `src/features/pie/PiePaciTab.jsx:111,236,239` + `PieReportsTab.jsx:46`. Misma ruta PIE gated. |
| `pie_schedule_blocks` | 0 | ✅ safe | Sin callsites activos frontend. |
| `pie_therapist_schools` | **1** | **🚨 NOT wrapped — R-01** | `src/components/therapist-profile/sections/MyClinicsSection.jsx:205-225` — silent UPSERT al guardar una clínica type='colegio'. Ver §R-01 detail abajo. |
| `debug_signup_logs` | 0 | ✅ safe | Sin callsites frontend ni edge function. |

### R-01 detail: `pie_therapist_schools` silent upsert en MyClinicsSection

**Código (MyClinicsSection.jsx:203-225)**:

```jsx
// --- LUGAR EXACTO DONDE LA CLÍNICA ES GUARDADA EXITOSAMENTE ---
// Task 1 & 2: Verificar si es colegio y realizar upsert silencioso en pie_therapist_schools
if (user?.id && savedClinicId && payloadToSave.type === 'colegio') {
  try {
    const { error: pieError } = await supabase
      .from('pie_therapist_schools')
      .upsert(
        {
          therapist_id: user.id,
          school_id: savedClinicId,
          hours_assigned: 0,
          academic_year: new Date().getFullYear()
        },
        { onConflict: 'therapist_id,school_id,academic_year', ignoreDuplicates: true }
      );
    if (pieError) {
      logger.error("Error silent upsert in pie_therapist_schools:", pieError);
    }
  } catch (err) {
    logger.error("Exception silent upsert in pie_therapist_schools:", err);
  }
}
```

**Características**:
- Condicional es `payloadToSave.type === 'colegio'` (runtime check), **NO** `FEATURE_FLAGS.PIE_ESCOLAR`.
- Envuelto en `try/catch` con logger (silent fail — no toast, no throw).
- Comentario explícito dice "upsert silencioso" — el autor diseñó tolerancia a fallo.
- Dispara para cualquier terapeuta que guarda clínica de tipo "colegio".

**Impact post-lockdown**:
- Pure deny-all sin policy → `pieError` = 42501 (`permission denied`).
- Silent fail comportamiento existente absorbe el error (UI no muestra nada).
- **Dato perdido**: `pie_therapist_schools` no se popula para nuevas clínicas colegio.
- PIE_ESCOLAR=false → este dato NO se consume hoy (el módulo PIE está apagado).

**Dos paths forward para FR-009 Decision**:

**Sub-opción 2a (recomendada)**: agregar 1 policy mínima `"Therapists manage own pie_therapist_schools"` FOR ALL con `USING (therapist_id = auth.uid())`. Resultado: upsert funciona, dato se popula para cuando PIE se active en el futuro. Sin scope creep.

**Sub-opción 2b**: aceptar silent-fail, skip policy, documentar como known trade-off. Dato se pierde hasta que se active PIE + policies proper. Justificación: silent-fail es comportamiento ya tolerado por el código, PIE OFF significa que el dato no se consume, agregar policy ahora violaría FR-002 default (0 policies).

---

## Edge functions audit (TASK-P1-GREP-EDGE completado)

```bash
grep -rn "pie_sessions|pie_students|pie_paci|pie_schedule_blocks|pie_therapist_schools|debug_signup_logs" supabase/functions/
# Output: No matches found
```

**Resultado**: **0 edge functions consumen estas 6 tablas**. R-03 descartado.

**Implicación**: ni siquiera `debug_signup_logs` tiene edge function escribiendo. El dato probablemente viene de:
- Triggers PL/pgSQL (nivel DB) en `auth.users` o similar.
- O fue creado manualmente para debug y nunca se uso.

Si es trigger pgSQL, **NO afectado por RLS** (triggers corren con `SECURITY DEFINER` del owner, típicamente postgres). Lock-down es seguro.

---

## Admin tooling audit

```bash
grep -rn "pie_|debug_signup_logs" src/features/admin/
# Output: No matches found
```

**Resultado**: **0 callsites admin** para estas 6 tablas. R-02 descartado.

**Implicación**: admin dashboard NO consume estas tablas. Pure lock-down NO rompe admin tooling existente.

---

## FR-009 Decision

### Inputs de Phase 1

| Criterio | Resultado |
|---|---|
| Callsites user-facing NO wrapped en flag | **1 callsite** (MyClinicsSection.jsx:205 → pie_therapist_schools) |
| Callsites admin sin policy dedicada | **0** |
| Edge functions sin service_role | **0** (hay 0 edge functions que tocan estas tablas) |
| Feature flag PIE_ESCOLAR | **false** confirmed |
| Comportamiento del callsite no-wrapped | **silent-fail con try/catch existente** (tolera fallo) |

### Decisión propuesta: **Option 2 (variante 2a) — Lock-down + 1 admin/therapist policy mínima**

**Rationale**:
- 5 de 6 tablas safe para pure lock-down.
- `pie_therapist_schools` tiene callsite no-wrapped → **requiere decisión entre 2a / 2b** (advisor).
- **Recomendación del ejecutor: Option 2a** — agregar 1 policy minimal "Therapists manage own pie_therapist_schools" via `therapist_id = auth.uid()`. Razones:
  1. Preserva funcionalidad existente (silent upsert sigue escribiendo data).
  2. Policy es simple (auth.uid() match, sin subquery).
  3. Data escrita será útil cuando PIE se reactive (nothing to backfill).
  4. Alternativa 2b (silent-fail aceptado) genera ruido de log + perdida de data silenciosa.
- Otras 5 tablas → pure deny-all (sin policies).

### Alternativa — Decisión del advisor

Si advisor prefiere **Option 2b** (silent-fail, sin policy nueva):
- Pure lock-down para las 6 tablas.
- Documentar en architecture.md como trade-off conocido: `pie_therapist_schools` pierde tracking post-lockdown hasta reactivación PIE.
- Ventaja: 0 policies creadas, máxima adherencia a FR-002.
- Desventaja: noise en logs + data perdida.

### Conteo final esperado por decisión

| Option | policy_count esperado post-apply | Tablas con policies |
|---|---|---|
| **2a (recomendado)** | **1** | `pie_therapist_schools` (1 policy) |
| **2b (fallback)** | **0** | ninguna |

---

## Phase 1 local report

### TASK-P1-GREP-FRONTEND ✅
- 5 de 6 tablas: 0 callsites activos o transitively wrapped.
- 1 tabla (`pie_therapist_schools`): callsite NO wrapped en MyClinicsSection.jsx:205-225.

### TASK-P1-GREP-EDGE ✅
- 0 edge functions consumen estas tablas. R-03 descartado.

### Admin audit (bonus)
- 0 callsites admin. R-02 descartado.

### Feature flag confirmation
- PIE_ESCOLAR=false, todos los otros flags OFF (consistente con spec 010).

### Pendiente para SP-1

- TASK-P1-A/B/C outputs de Danissa (SQL Editor).
- **DECISIÓN ADVISOR**: Option 2a (1 policy minimal) vs 2b (pure lock-down, silent-fail aceptado).
