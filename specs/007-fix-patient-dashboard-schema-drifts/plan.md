# Implementation Plan: Fix Patient Dashboard Schema Drifts

**Branch**: `007-fix-patient-dashboard-schema-drifts` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-fix-patient-dashboard-schema-drifts/spec.md`

## Summary

Fix quirúrgico de 3 schema drifts en el flujo patient-dashboard, con **Phase 1 audit defensivo obligatorio** antes de tocar código (FR-001/002/003), **decision tree explícito** por drift en Phase 2, y **regression test manual** sobre 14 rutas del inventory en Phase 3. El plan no escribe código — detalla los pasos, queries SQL, decision trees y criterios de stop que aplicará `/speckit-tasks` y `/speckit-implement` después. Tiempo total estimado: **45–75 min** (Phase 1: 10 · Phase 2: 15–25 · Phase 3: 20–30 · buffer: 5–10). Patrón canónico de referencia: spec 005 commit `580408d` (`therapist_services.price → price_clp` vía alias PostgREST).

## Technical Context

**Language/Version**: JavaScript (ES2022+) — frontend React 18 SPA; sin TypeScript.
**Primary Dependencies**: `@supabase/supabase-js` 2.99 (cliente PostgREST); `react-router-dom` 6; shadcn/ui para widgets. Sin `zod`, `@tanstack/react-query`, `@hookform/resolvers` (gap conocido de la arquitectura, fuera de alcance).
**Storage**: Supabase Postgres (project ref `tomremkbuxvedliyywbo`). Tablas afectadas: `session_activities`, `appointments`, `clinical_reports` (schema `public`). Tabla puente: `plan_sessions`.
**Testing**: Test manual asistido en DevTools (no hay Vitest/Playwright). Validación contra la Regression Test Inventory del spec (14 rutas).
**Target Platform**: SPA servida desde Vercel, consumida por browsers modernos.
**Project Type**: Web application — frontend only. El fix se aplica en `src/`; no toca `supabase/migrations/`, `supabase/functions/`, ni `supabase/policies.sql`.
**Performance Goals**: N/A. El fix restaura funcionalidad que hoy falla; no cambia perfiles de rendimiento (mismo número de requests, mismo shape).
**Constraints**:
- **FR-010**: cero migraciones nuevas.
- **FR-011**: cero cambios en RLS o audit logger.
- **FR-012**: cero redesign de widgets — solo consumo de nuevos nombres de campo.
- **FR-003** (abort triggers): stop & report si >3 tablas driftadas, >5 archivos a tocar, o re-modelado semántico necesario.
**Scale/Scope**: 3 archivos primarios a modificar (`PatientDashboardPageV2.jsx`, `TherapistDashboardPage.jsx`, más 1 archivo si Drift 2 resulta dead query). Regression: 14 rutas inventariadas + 2 user-story routes = 16 flujos a testear manualmente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluación contra los 6 principios NON-NEGOTIABLE del `.specify/memory/constitution.md`:

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First (Ley 20.584 / 21.719)** | Indirecto | ✅ PASS | No se agrega ni modifica acceso a PHI. Todas las queries afectadas ya existen hoy; se corrigen los nombres de columnas para que _funcionen_. El conjunto de datos expuestos no cambia. |
| **II. RLS-First Security** | No | ✅ N/A | FR-011 prohíbe tocar policies. El fix es 100% cliente. |
| **III. Append-Only Audit (`useClinicalAccessLogger`)** | Parcial | ⚠️ VERIFY | Las queries corregidas acceden a datos clínicos (`clinical_reports`, actividades de planes). Antes del fix las queries fallan → no hay acceso real → no hay audit entry. Post-fix el acceso funciona → debe haber audit entry si corresponde. **Verificar en Phase 2** que el callsite ya invoca el hook de audit (si no lo hace hoy, el bug era _también_ de compliance, no solo de drift — sería un hallazgo que ampliaría scope o motiva spec hermano). |
| **IV. Micro-Bloques (un PR = un bug/feature)** | Sí | ✅ PASS con abort trigger | El spec bundle es coherente (mismo síntoma, mismo flujo). FR-003 formaliza los abort triggers que mantienen el scope. Si Phase 1 los dispara, el plan no avanza a Phase 2. |
| **V. UI Honesty (no toasts "Guardado" sin validar)** | No directo | ✅ N/A | No se tocan formularios ni mutaciones. Solo lecturas. |
| **VI. Schema Drift Zero** | Sí (raison d'être) | ✅ PASS | Este plan es la aplicación correctiva del principio. La Phase 1 audit defensivo asegura que el fix no reintroduzca drift ni deje residual. |

**Resultado**: 1 `VERIFY` en §III sobre audit logger que se resuelve durante Phase 2 (si el callsite ya invoca `useClinicalAccessLogger` → OK; si no → decisión: ampliar scope con spec hermano o documentar como hallazgo y seguir). Sin violaciones materiales. Re-check al cierre de Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/007-fix-patient-dashboard-schema-drifts/
├── spec.md                    # /speckit-specify (commit c9c93af)
├── plan.md                    # este archivo
├── data-model.md              # output de Phase 1 (tabla de verdad + FKs)
├── quickstart.md              # cómo reproducir el bug y validar el fix (opcional, puede quedar para /speckit-tasks)
├── checklists/
│   └── requirements.md        # /speckit-specify (iteration 2, 12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase, NO en este plan)
```

### Source Code (repository root)

Archivos que el plan **autoriza** tocar. Cualquier archivo fuera de esta lista requiere re-evaluación del scope (dispara FR-003.b).

```text
src/features/patient-dashboard/
└── PatientDashboardPageV2.jsx        # Drift 1 (líneas 162-165, 240-244) + Drift 3 (líneas 182-185)

src/pages/
└── TherapistDashboardPage.jsx        # Drift 2 (líneas 143-146)

specs/007-fix-patient-dashboard-schema-drifts/
├── plan.md                           # este archivo
└── data-model.md                     # creado al final de Phase 1

CLAUDE.md                             # update del SPECKIT marker a plan.md de 007
```

**Archivos NO autorizados** (cualquier modificación aquí dispara abort FR-003):
- `supabase/migrations/` — FR-010.
- `supabase/policies.sql` — FR-011.
- `supabase/functions/` — fuera de alcance.
- Cualquier otro consumer de `session_activities`, `clinical_reports` o `appointments` listado en el **Regression Test Inventory** del spec — son read-only para este spec.

**Structure Decision**: React 18 SPA con estructura mixta `features/` + `pages/` legacy (deuda conocida en arquitectura.md). El fix toca 2 archivos de cada estilo (uno feature, uno page) — consistente con la realidad actual. No se migra `TherapistDashboardPage.jsx` a `features/` en este spec (sería violación del Principio IV).

---

## Phase 0 — Risk Register

Normalmente Phase 0 resuelve `NEEDS CLARIFICATION`. En este plan el spec ya cerró todas las clarifications (checklist 12/12 pass). Lo que queda es **inventario de riesgos técnicos** documentado antes de Phase 1.

### R-01. `plan_sessions` puede no tener FK a `patients`

**Síntoma potencial**: el join `.select('..., plan_sessions!inner(patient_id)')` sintáctico solo funciona si PostgREST detecta una relación (FK) entre `session_activities.plan_session_id` y `plan_sessions.id`, y otra entre `plan_sessions.patient_id` y `patients.id`. Si alguna FK no existe explícitamente, PostgREST devuelve error 400 `"Could not find a relationship between..."`.

**Mitigación**: Phase 1 Query B (ver abajo) lista las FKs reales. Si falta alguna → abort T4 en SP-1; fallback a 2 queries separadas o spec hermano.

### R-02. El alias PostgREST no acepta múltiples renames en el mismo `.select()` cuando el backend hizo UNA migración semántica compleja

**Síntoma potencial**: si Drift 3 resulta `file_url → storage_path` y `report_type → report_kind`, `select('id, title, file_url:storage_path, created_at, report_type:report_kind')` debería funcionar — pero si la migración renombró con cambio de tipo (ej. enum), el alias devuelve serialización distinta y el render puede romperse.

**Mitigación**: Phase 1 mira `data_type` en information_schema. Si los tipos cambiaron, se marca como hallazgo y se decide caso por caso (alias puede seguir sirviendo si el render es tolerante; si no, se ajusta render — dentro del budget de archivos).

### R-03. Drift 2 puede ser rewrite conceptual (fee vive en `invoices`, no en `appointments`)

**Síntoma potencial**: Phase 1 descubre que `appointments` nunca tuvo columna de precio; el monto se calcula desde `invoices` o `service_bookings`. Entonces el fix no es alias, es cambiar la fuente de la query — requiere joins nuevos y potencial tocar más archivos.

**Mitigación**: formalizado como abort trigger FR-003.c ("re-modelado semántico"). Si se dispara, plan se detiene antes de Phase 2 y Danissa decide (probable: spec 008 separado).

### R-04. Algún callsite del Regression Test Inventory ya estaba roto antes del fix

**Síntoma potencial**: al testear las 14 rutas en Phase 3 aparece un error nuevo que no se introdujo en este spec (pre-existente). Confunde la evaluación del Rollback Plan.

**Mitigación**: **baseline test previo al Phase 2** — antes de tocar código, correr las 14 rutas del inventory en la branch actual (sin fix) y guardar screenshots/logs mínimos. Convierte Phase 3 en comparación A/B. Tiempo adicional ~10 min (presupuestado en Phase 1).

### R-05. `PatientDashboardPageV2.jsx` puede contener otras queries no listadas pero driftadas

**Síntoma potencial**: al abrir el archivo para Drift 1 y 3, encontramos una 4ta query con el mismo patrón. Tentación: fixear "de paso".

**Mitigación**: NO. Principio IV. Se documenta el hallazgo en data-model.md, se agrega al spec SOLO si está dentro del bound `<=5 archivos / <=3 tablas` y fue reportado _antes_ de escribir código. Si excede, se defiere a spec hermano.

### R-06. Callsite corregido puede NO invocar `useClinicalAccessLogger`

**Síntoma potencial**: pre-fix la query fallaba y nunca disparaba audit; post-fix la query funciona y debería disparar audit por lectura de PHI. Si el componente no invoca el hook, es violación latente del Principio III que quedaba oculta por el bug.

**Mitigación**: durante Phase 2, grep el archivo target por `useClinicalAccessLogger`. Si no aparece → documentar hallazgo, decidir con Danissa (ampliar scope o spec hermano de compliance).

---

## Phase 1 — Audit Defensivo (obligatorio, ~10 min, STOP POINT antes de Phase 2)

**Objetivo**: confirmar empíricamente las columnas reales de las 3 tablas afectadas, verificar FKs necesarias para el join del Drift 1, y materializar la **Tabla de Verdad** que decidirá el camino de cada drift en Phase 2.

**Regla operativa** (`docs/PATTERNS.md §4`): cero código tocado hasta que esta phase termine y el STOP POINT valide scope.

### P1.1 Queries SQL a correr (via MCP `execute_sql` contra project `tomremkbuxvedliyywbo`)

#### Query A — columnas reales de las 3 tablas afectadas

Basada en `docs/PATTERNS.md §5` (preventive mini-audit con `information_schema`).

```sql
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('session_activities', 'appointments', 'clinical_reports')
ORDER BY table_name, ordinal_position;
```

**Formato de output esperado** (tabla plana, filas hipotéticas):

```text
table_name          | column_name      | data_type         | is_nullable | column_default
--------------------+------------------+-------------------+-------------+----------------
appointments        | id               | uuid              | NO          | gen_random_uuid()
appointments        | therapist_id     | uuid              | NO          |
appointments        | patient_id       | uuid              | NO          |
appointments        | status           | text              | NO          | 'scheduled'
appointments        | date             | date              | NO          |
appointments        | <price?>         | numeric | integer | YES/NO      |
...
clinical_reports    | id               | uuid              | NO          | gen_random_uuid()
clinical_reports    | patient_id       | uuid              | NO          |
clinical_reports    | title            | text              | YES         |
clinical_reports    | <file?>          | text              | YES         |
clinical_reports    | <type?>          | text | enum       | YES         |
clinical_reports    | created_at       | timestamptz       | NO          | now()
...
session_activities  | id               | uuid              | NO          | gen_random_uuid()
session_activities  | plan_session_id  | uuid              | NO          |     ← clave del join Drift 1
session_activities  | activity_id      | uuid              | YES         |
session_activities  | exercise_id      | uuid              | YES         |
session_activities  | status           | text              | NO          | 'pending'
session_activities  | created_at       | timestamptz       | NO          | now()
```

Lo que se busca responder con Query A:

- **Drift 1**: confirmar que `session_activities.patient_id` efectivamente NO existe → valida el error reportado por el user. Identificar la columna de link al plan (hipótesis: `plan_session_id`).
- **Drift 2**: identificar el nombre real del campo de precio en `appointments` (candidatos: `price`, `price_clp`, `amount`, `total`, `fee_clp`, o inexistente).
- **Drift 3**: identificar nombres reales para `file_url` y `report_type` (candidatos: `storage_path`, `file_path`, `url`, `report_kind`, `type`, `kind`, etc.) o confirmar inexistencia.

#### Query B — FKs relevantes para el join del Drift 1

```sql
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('session_activities', 'plan_sessions')
ORDER BY tc.table_name, kcu.column_name;
```

**Formato esperado** (hipótesis a confirmar):

```text
child_table         | child_column      | parent_table     | parent_column | constraint_name
--------------------+-------------------+------------------+---------------+---------------------------------
plan_sessions       | patient_id        | patients         | id            | plan_sessions_patient_id_fkey
plan_sessions       | plan_id           | clinical_plans   | id            | plan_sessions_plan_id_fkey
session_activities  | plan_session_id   | plan_sessions    | id            | session_activities_plan_sessio..
```

Lo que se busca responder: ¿existen las 2 FKs (`session_activities → plan_sessions → patients`) que PostgREST necesita para resolver `plan_sessions!inner(patient_id)`? Si sí → join seguro. Si no → R-01 disparado, abort T4.

#### Query C — opcional, solo si Query A deja dudas sobre `appointments`

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('invoices', 'service_bookings')
  AND (column_name ILIKE '%fee%' OR column_name ILIKE '%price%' OR column_name ILIKE '%amount%');
```

Propósito: si Drift 2 sugiere que el precio no está en `appointments`, validar hipótesis alternativa "fee vive en `invoices`" o similar. Confirma o niega R-03 formalmente.

### P1.2 Grep complementario (sanity check — `PATTERNS.md §5`)

Desde `~/Documents/DENTALSPOT`:

```bash
# Otros callsites a appointments.fee que deberíamos haber capturado
grep -rn "from('appointments')" src/ -A3 | grep -iE "fee|price|amount"

# Confirmar que el patrón plan_sessions!inner ya existe en el repo (referencia del fix Drift 1)
grep -rn "plan_sessions!inner" src/

# Confirmar que los 7 callsites de session_activities del Regression Test Inventory NO consumen patient_id directo
grep -rn "session_activities" src/ -A3 | grep -B1 "patient_id"
```

Resultado esperado:
- **Primer grep**: 0 resultados adicionales (o 1–2 que entren al Regression Test Inventory si aparecen). Si aparece callsite nuevo → actualizar inventory antes de Phase 3, NO ampliar fix.
- **Segundo grep**: al menos 3 matches (los callsites que el user reportó: `PatientActivitiesPage.jsx:50`, `MyProgressPage.jsx:74`, `ClinicalQualityPanel.jsx:122`).
- **Tercer grep**: 0 resultados — ningún callsite de los 7 inventariados accede a `session_activities.patient_id` directo. Si alguno lo hace → hallazgo R-05, amplía drift.

### P1.3 Baseline test (mitigación R-04, ~5 min)

Antes de tocar código, Danissa recorre las **14 rutas del Regression Test Inventory** en `main` (pre-fix) y documenta con capturas o logs si alguna ya emite errores en consola. Esto convierte Phase 3 en comparación A/B real en lugar de pasa/falla binario.

Output: sección "Pre-fix baseline" en `data-model.md` con:

- Por ruta: `OK` / `Warning: <mensaje>` / `Error: <mensaje>`.
- Las que estén `Error` pre-fix se excluyen del conteo de regresiones (no las introdujimos nosotros).

### P1.4 Persistir hallazgos en `data-model.md`

Al final de Phase 1, escribir `specs/007-fix-patient-dashboard-schema-drifts/data-model.md` con:

1. **Tabla de verdad por drift** (estructura):

   | Drift | Columna pedida | Existe en DB | Nombre real | Tipo | Decisión Phase 2 |
   |---|---|---|---|---|---|
   | 1 | `session_activities.patient_id` | NO (esperado) | n/a (vía `plan_sessions`) | — | join indirecto (sin condicional) |
   | 2 | `appointments.fee` | TBD | TBD | TBD | alias / rewrite / abort |
   | 3a | `clinical_reports.file_url` | TBD | TBD | TBD | alias / rewrite / abort |
   | 3b | `clinical_reports.report_type` | TBD | TBD | TBD | alias / rewrite / abort |

2. **Estado de FKs** (Query B output).
3. **Pre-fix baseline** de las 14 rutas (de P1.3).
4. **Hallazgos laterales** (si Query A revela columnas con nombres sospechosos que sugieren drifts futuros, documentar y **NO fixear** — abre spec futuro).

### P1.5 **STOP POINT (SP-1) · validación de scope**

Antes de pasar a Phase 2, el ejecutor valida contra los abort triggers FR-003 y reporta a Danissa:

| Check | Criterio | Acción si falla |
|---|---|---|
| **T1. Tablas driftadas** | ¿Solo session_activities + appointments + clinical_reports? | Si aparecen >3 tablas → STOP, abrir spec hermano. |
| **T2. Archivos a tocar** | Lista final de archivos a editar ≤ 5 | Si >5 → STOP, reducir scope o dividir spec. |
| **T3. Re-modelado** | ¿Alguno de los 3 drifts requiere cambiar fuente de datos (ej. fee en invoices)? | Si sí → STOP, spec separado. |
| **T4. FKs del join Drift 1** | Query B retorna las 2 FKs necesarias | Si no → STOP, decidir fallback a 2 queries o spec hermano. |
| **T5. Baseline R-04** | Logs/capturas de las 14 rutas del inventory en main (pre-fix) | Si alguna ya está rota pre-fix → documentar, excluir de conteo de regresiones. |

**Reporte a entregar a Danissa al cierre de Phase 1** (bloquea Phase 2 hasta OK):

```markdown
## Phase 1 Report — spec 007

- Query A output: [resumen / snippet]
- Query B output: [FKs encontradas, con constraint_name]
- Grep complementario: [N matches por grep, consistente con esperado]
- Pre-fix baseline: [M/14 rutas OK, K rutas con issues pre-existentes listadas]
- Tabla de verdad: [ver data-model.md]
- Scope check: T1 ✅ · T2 ✅ (N archivos) · T3 ✅ · T4 ✅ · T5 ✅
- Recomendación: proceder a Phase 2 / abortar / dividir spec

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Aplicar Fixes (~15–25 min, decision tree por drift)

**Prerequisito**: Phase 1 Report con 🟢 GO explícito de Danissa.

### Drift 1 — `session_activities.patient_id` no existe

**Decisión**: **sin condicional, patrón confirmado.** El fix es reescritura directa de las 2 queries (líneas 162–165 y 240–244 de `PatientDashboardPageV2.jsx`) usando el patrón de join indirecto que ya funciona en los otros 7 callsites del inventory.

**Pseudocódigo del fix** (no es código, es plan):

```text
En src/features/patient-dashboard/PatientDashboardPageV2.jsx líneas 162-165 y 240-244:

ANTES:
  supabase
    .from('session_activities')
    .select('id, status, created_at, activity_id, exercise_id')
    .eq('patient_id', pId)
    .eq('status', 'pending')

DESPUÉS:
  supabase
    .from('session_activities')
    .select('id, status, created_at, activity_id, exercise_id, plan_sessions!inner(patient_id)')
    .eq('plan_sessions.patient_id', pId)
    .eq('status', 'pending')
```

**Notas de ejecución**:
- Sintaxis exacta del embed (`plan_sessions!inner(patient_id)`) depende de confirmación en Phase 1 Query B. Si la FK está nombrada estándar (`session_activities_plan_session_id_fkey`), PostgREST resuelve el embed automáticamente.
- El shape del response cambia ligeramente (cada row incluye `plan_sessions: { patient_id: ... }`). Si el componente consume solo campos originales (id, status, etc.) → 0 impacto. Si usaba `row.patient_id` localmente → buscar y actualizar (contabiliza dentro del bound `<=5 archivos`, normalmente queda in-file).
- **R-06 check** (Constitution §III): grep `useClinicalAccessLogger` en el archivo. Si no aparece → documentar hallazgo y decidir con Danissa (NO fixear en este spec).

### Drift 2 — `appointments.fee` 400 Bad Request

**Decision tree** (depende de Query A de Phase 1):

```text
Caso A — appointments tiene columna de precio con OTRO nombre (price_clp, amount, total_clp, etc.)
  → Path A (rename): usar alias PostgREST
    En src/pages/TherapistDashboardPage.jsx línea 143-146:
      ANTES: .select('fee')
      DESPUÉS: .select('fee:<nombre_real_de_phase_1>')
    Patrón canónico: docs/PATTERNS.md §1, spec 005 commit 580408d.
    El render del widget sigue leyendo row.fee → 0 cambios en consumer.

Caso B — appointments NO tiene ninguna columna de precio (nunca existió)
  → Path B.1 (widget secundario → dead query): eliminar el cálculo del widget
      Mostrar "$--" o hide con feature flag. Tiempo: ~5 min.
      Contabiliza dentro del bound (edit mínimo del archivo).

  → Path B.2 (widget crítico → re-modelado): STOP (R-03 / FR-003.c).
      Hallazgo formal: la columna nunca existió, el widget necesita rewrite conceptual.
      Abrir spec 008 con scope "cálculo de ingresos terapeuta desde invoices".

Caso C — el precio vive en invoices (Query C lo confirma)
  → STOP, abort FR-003.c disparado. Spec 008 separado.
```

**Notas**:
- Hipótesis más probable por patrón spec 005: **Caso A con rename a `price_clp` o similar**. Phase 1 lo confirma o niega.
- En Caso B.1 (eliminar widget), FR-012 permite "solo consumo de nuevos nombres" — eliminar un widget que muestra data inexistente queda dentro del spirit (no hay "redesign UX", es "stop mostrar error 400").

### Drift 3 — `clinical_reports.file_url` / `report_type` 400 Bad Request

**Decision tree** (misma lógica que Drift 2 pero 2 columnas posibles de problema):

```text
Caso A — Phase 1 revela nombres reales para file_url Y report_type (ambos renombrados)
  → Path A (2 renames): usar 2 alias en el mismo .select()
    En src/features/patient-dashboard/PatientDashboardPageV2.jsx línea 182-185:
      ANTES: .select('id, title, file_url, created_at, report_type')
      DESPUÉS: .select('id, title, file_url:<real_file>, created_at, report_type:<real_type>')
    Patrón canónico: docs/PATTERNS.md §1 (soporta múltiples alias).

Caso B — Phase 1 revela nombre real para UNA de las 2, la otra no existe
  → Path B (1 alias + 1 eliminación):
    DESPUÉS: .select('id, title, file_url:<real_file>, created_at')  // report_type eliminado
    Ajuste mínimo en render: el widget no muestra tipo de reporte.
    Si render depende de report_type para iconografía → evaluar con Danissa.

Caso C — NINGUNA de las 2 columnas existe con ningún nombre
  → Path C (fallback a select('*')):
    DESPUÉS: .select('*')  // consistente con los 7 otros callsites que sí funcionan
    El componente lee solo los campos que existan en los rows.
    Verificar que el render tolera missing file_url / report_type (probable — los
    otros 7 callsites ya viven así).

Caso D — Alias funciona pero data_type cambió (R-02 disparado)
  → Path D: alias + coerce del lado del cliente (1 línea en el render).
    Dentro del bound de archivos (se edita el mismo file).
```

**Nota transversal a los 3 drifts**: ningún path requiere tocar `supabase/migrations/` ni `supabase/policies.sql`. Si alguno lo necesita → abort trigger FR-003.c.

### P2. Post-fix local (antes de Phase 3)

1. `npm run lint` — debe pasar clean (baseline pre-spec es clean).
2. `npm run build` — debe compilar sin warnings nuevos.
3. Smoke test con `npm run dev` en los 2 roles (paciente + terapeuta) — no reemplaza Phase 3.

---

## Phase 3 — Regression Test Manual (~20–30 min)

**Prerequisito**: Phase 2 completa + lint + build OK.

### Protocolo

Danissa recorre las **16 rutas** (14 del Regression Test Inventory + las 2 user-story routes) con DevTools → Console abierto, en este orden:

#### Bloque A — User-story routes (2 rutas, ~5 min)

1. **P1 — Patient dashboard (fixeado)**
   - Login como paciente de prueba con ≥1 actividad pendiente.
   - Navegar a dashboard.
   - Validar: widget de actividades muestra N>0 actividades, 0 errores en consola relacionados con `session_activities`.
   - Abrir widget de reportes clínicos → ≥1 reporte visible (si la cuenta tiene reportes) o estado vacío limpio; 0 errores 400 de `clinical_reports`.
   - Esperado: cumple **SC-001, SC-002, SC-004**.

2. **P2 — Therapist dashboard (fixeado)**
   - Login como terapeuta de prueba con ≥1 cita `completed` en el mes.
   - Navegar a dashboard.
   - Validar: widget de ingresos muestra monto no-cero (o `$0` si Path B.1 de Drift 2), 0 errores 400 de `appointments`.
   - Esperado: cumple **SC-001, SC-003**.

#### Bloque B — Regression routes `session_activities` (7 rutas, ~10 min)

| # | Ruta / archivo | Acción | Expectativa |
|---|---|---|---|
| B1 | `src/pages/PatientActivitiesPage.jsx:50` | Login paciente → "Mis Actividades" | Lista igual a dashboard (SC-002) |
| B2 | `src/features/patient/pages/MyProgressPage.jsx:74` | Navegar a "Mi Progreso" | Progreso agregado carga |
| B3 | `src/features/clinic-dashboard/components/ClinicalQualityPanel.jsx:122` | Login clinic admin | Panel de calidad carga |
| B4 | `src/features/clinical-planning/api/clinicalPlanningApi.js:322` | Ir a planning (como therapist) | Plan se muestra |
| B5 | `src/features/clinical-planning/components/PlanningTab.jsx:167` | Abrir tab Planning | Tab renderiza |
| B6 | `src/features/clinical-planning/components/SessionManagerModal.jsx:300, :323` | Abrir modal de sesión | Ambas queries del modal resuelven |
| B7 | `src/features/ai/api/aiToolsApi.js:176` | Usar herramienta IA sobre actividades | Response OK |

0 errores nuevos en consola. Si alguno falla → contar para abort triggers del Rollback Plan.

#### Bloque C — Regression routes `clinical_reports` (7 rutas, ~10 min)

| # | Ruta / archivo | Acción | Expectativa |
|---|---|---|---|
| C1 | `src/pages/PatientDashboardPage.jsx:182` (legacy) | Si aún se renderiza | Widget reportes OK |
| C2 | `src/features/reports/pages/ReportsPage.jsx:33` | Página completa de reportes | Lista completa |
| C3 | `src/features/reports/pages/ReportDetailPage.jsx:21` | Click en un reporte | Detalle carga |
| C4 | `src/features/reports/components/TemplateFormModal.jsx:151, :159` | Abrir modal de generación | 2 queries resuelven |
| C5 | `src/hooks/usePatientAdmin.js:81` | Vista admin del paciente | Hook retorna data |
| C6 | `src/hooks/useReportGeneration.js:199` | Disparar generación de reporte | Request OK |
| C7 | `src/features/patient-file/hooks/usePatientData.js:126` | Ficha del paciente (therapist) | Hook retorna data |

### Evaluación contra Rollback Plan

Al cierre de los 3 bloques, contabilizar:

- **0–2 regresiones** en Bloques B/C que NO rompen flujo visible del rol → documentar como follow-up, NO abort.
- **>2 regresiones** o **1 regresión que rompe flujo del rol** → disparar Rollback Plan del spec.md: `git revert <commit>`, abrir spec 007.1 con scope reducido.
- **0 regresiones** + Bloque A cumple SC-001…SC-004 → cerrar spec.

### P3. Reporte de cierre

```markdown
## Phase 3 Report — spec 007

- Bloque A (fixed): P1 [✅/⚠️/❌] · P2 [✅/⚠️/❌]
- Bloque B (session_activities regression): N/7 OK
- Bloque C (clinical_reports regression): M/7 OK
- Regressions detectadas: [lista path + error]
- Decision: close spec / rollback / partial close with follow-up
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio de Phase 1 | Plan aprobado por Danissa | Ejecutar Query A + B + grep + baseline |
| **SP-1** | Fin de Phase 1 | Phase 1 Report con 🟢 GO de Danissa | Solo entonces → Phase 2 |
| **SP-2** | Mid Phase 2 (tras Drift 1) | ¿El archivo revela 4ta query del mismo patrón? | Si sí → R-05, consultar antes de expandir |
| **SP-3** | Fin de Phase 2 (pre-Phase 3) | lint + build OK | Si no → NO empezar tests, corregir primero |
| **SP-4** | Fin de Phase 3 | Criterio Rollback Plan evaluado | Close / follow-up / revert |

---

## Time Budget

| Phase | Tiempo estimado | Contenido |
|---|---|---|
| Phase 1 — Audit defensivo | **10 min** | Queries A + B (+ C opcional) + grep + baseline 14 rutas + data-model.md + SP-1 report |
| Phase 2 — Fixes | **15–25 min** | 3 drifts según decision tree + R-06 check + lint + build |
| Phase 3 — Regression | **20–30 min** | Bloques A + B + C + reporte |
| Buffer para imprevistos | **5–10 min** | R-01/R-02/R-03 si se disparan |
| **Total** | **45–75 min** | Cumple bound del user |

Si el total real supera **90 min**: STOP implícito, revisar con Danissa — algo del scope está fuera de lo estimado.

---

## References

- `docs/PATTERNS.md §1` (alias SQL PostgREST) — Drift 2 y Drift 3 Paths con rename.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — regla "cero código hasta Phase 1 OK".
- `docs/PATTERNS.md §5` (preventive mini-audit) — estructura de Query A y grep complementario.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento de los abort triggers FR-003 y los Stop Points.
- `.specify/memory/constitution.md §VI` (Schema Drift Zero) — principio que el spec restaura.
- Spec 005 commit `580408d` — caso canónico del patrón alias.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones de constitución que requieran justificación. Los 2 `VERIFY` (§III audit logger en Constitution Check, y R-06 en Risk Register) son chequeos a resolver en Phase 2, no desviaciones del principio. |
