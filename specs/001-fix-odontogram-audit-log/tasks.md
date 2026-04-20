---

description: "Tasks for spec 001-fix-odontogram-audit-log — surgical 1-line fix"
---

# Tasks: Fix — First Odontogram Evaluation Not Logged to clinical_audit_log

**Input**: `specs/001-fix-odontogram-audit-log/spec.md` + `plan.md`
**Prerequisites**: spec.md, plan.md (both approved)

## Format

- **[ID]** — short task id (T-01 … T-15)
- **[Story]** — which spec user story it serves (US1 / US2 / US3 / transversal)
- **File(s)** — exact paths touched (or "read-only" / "no file")
- **Depends on** — explicit predecessor task IDs
- **Pass criterion** — concrete, verifiable outcome

## Scope reminders (Constitution IV + VI)

- Out of scope (do **not** touch): `src/lib/audit/*`, other files in `src/features/odontogram/`, `supabase/migrations/`, `supabase/policies.sql`, edge functions, other clinical modules, package.json, config files.
- Git add/commit/push are **NOT** tasks — Danissa commits manually after approving the implementation.

---

## Phase 1 — Pre-implementation (read-only)

**Purpose**: confirm mental model + environment before the single-line change. No code edits in this phase.

- [ ] **T-01** [transversal] Confirmar lectura completa de `spec.md` (incl. Schema Drift Note) y `plan.md`.
  - File(s): read-only (`specs/001-fix-odontogram-audit-log/spec.md`, `plan.md`).
  - Depends on: —.
  - Pass criterion: declarar por escrito "spec + plan leídos; entiendo que el fix es 1 línea y que `clinical_audit_log` es la tabla target".

- [ ] **T-02** [US1] Releer el bloque `handleStartEvaluation` en `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` (líneas 140–182) y confirmar dos cosas:
  - (a) tras `setEvaluationId(data.id)` (línea 170), `data.id` es el UUID válido que vamos a usar en el navigate;
  - (b) el `setStep(2)` (línea 173) ya ocurrió antes del `replaceState` — no hay dependencia adicional del orden.
  - File(s): read-only (`src/features/odontogram/pages/OdontogramEvaluationPage.jsx`).
  - Depends on: T-01.
  - Pass criterion: ambos puntos confirmados leyendo el código; no hay side-effects ocultos entre línea 170 y 176.

- [ ] **T-03** [US1] Verificar que `useNavigate` ya está importado (línea 2) y que `navigate` está inicializado en el componente (línea 34) — no hay imports nuevos.
  - File(s): read-only (`src/features/odontogram/pages/OdontogramEvaluationPage.jsx`).
  - Depends on: T-01.
  - Pass criterion: `grep -n "useNavigate\|const navigate = useNavigate" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` muestra exactamente 2 matches (línea 2 import + línea 34 init). **Si aparece algo distinto, detener y reportar.**

- [ ] **T-04** [transversal] Confirmar que `git status` muestra working tree limpio (o sólo con modificaciones ajenas pre-existentes: `supabase/schema.sql`, `.specify/extensions.yml`, `specs/`, `.specify/feature.json`, `Dentalspot_Estado_y_Roadmap.pdf`) — ningún archivo de `src/` modificado antes de empezar.
  - File(s): no file (comando `git status`).
  - Depends on: T-01.
  - Pass criterion: `git status` no muestra modificaciones pendientes en `src/` ni en `supabase/migrations/`.

**Checkpoint Phase 1**: ningún archivo modificado. Asesor debe aprobar explícitamente antes de Phase 2 ("proceder con T-05").

---

## Phase 2 — Implementation (🚨 PUNTO DE NO RETORNO)

**⚠ T-05 es la única task que modifica código en `src/`. Asesor debe marcar checkpoint de review ANTES de ejecutarla.**

- [ ] **T-05** 🚨 [US1] **Reemplazar línea 176** de `src/features/odontogram/pages/OdontogramEvaluationPage.jsx`:
  - **Antes** (líneas 175–176):
    ```js
          // Update URL without full navigation
          window.history.replaceState(null, '', `/dashboard/odontograma/${data.id}`);
    ```
  - **Después** (líneas 175–177):
    ```js
          // Navigate to canonical URL so React Router state stays in sync
          // (required for useClinicalAccessLogger to fire — see spec 001).
          navigate(`/dashboard/therapist/odontograma/${data.id}`, { replace: true });
    ```
  - File(s): `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` — **1 archivo, 1 reemplazo**.
  - Depends on: T-01, T-02, T-03, T-04.
  - Pass criterion: `grep -n "replaceState" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` devuelve **0 matches**; `grep -n "navigate(\`/dashboard/therapist/odontograma/" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` devuelve al menos 1 match con `{ replace: true }`.

---

## Phase 3 — Verificación automática

**Purpose**: descartar errores de sintaxis, imports rotos y warnings nuevos. Tasks pueden correrse en paralelo.

- [ ] **T-06** [P] [transversal] ESLint pasa sin warnings nuevos en el archivo tocado.
  - File(s): `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` (read-only para el linter).
  - Depends on: T-05.
  - Command: `npx eslint src/features/odontogram/pages/OdontogramEvaluationPage.jsx`
  - Pass criterion: exit code 0; si hay warnings, que sean los mismos que había antes del fix (no hay regresión lint-side).

- [ ] **T-07** [P] [transversal] `vite build` completa sin errores.
  - File(s): no file (comando `npm run build`).
  - Depends on: T-05.
  - Command: `npm run build`
  - Pass criterion: build termina con status OK y `dist/` se regenera. Si aparece un error de resolución, revertir T-05 (ver rollback en plan.md) y reportar.

**Checkpoint Phase 3**: si T-06 o T-07 fallan por el cambio, revertir `git checkout -- src/features/odontogram/pages/OdontogramEvaluationPage.jsx` y detener.

---

## Phase 4 — Test manual procedimental (7 pasos del plan)

**Purpose**: reproducir los 7 pasos del plan (sección "Manual Test Procedure") en ambiente de staging — no se reinventan, se ejecutan tal cual.

**Setup previo (no es task, es precondición)**: staging accesible, dentista de prueba con al menos 1 paciente asignado, SQL Editor de Supabase disponible, `patient_id` de prueba anotado.

- [ ] **T-08** [US1] Ejecutar **Paso 1 del plan** — query baseline: `SELECT ... FROM clinical_audit_log WHERE patient_id = '<PATIENT_ID>' AND resource_type = 'odontogram' AND created_at > NOW() - INTERVAL '2 hours'`. Anotar `N = count inicial`.
  - File(s): no file (SQL Editor).
  - Depends on: T-06, T-07.
  - Pass criterion: la query ejecuta sin error y devuelve N filas. N queda anotado como baseline.

- [ ] **T-09** [US1] Ejecutar **Paso 2 del plan** — login como dentista → Dashboard → Odontograma → Nueva Evaluación → seleccionar paciente → "Iniciar Evaluación".
  - File(s): no file (browser).
  - Depends on: T-08.
  - Pass criterion: URL cambia a `/dashboard/therapist/odontograma/<uuid>` (no `nueva`), wizard muestra Step 2, sin toast de error.

- [ ] **T-10** 🎯 [US1] Ejecutar **Paso 3 del plan** — query "core": `SELECT ... FROM clinical_audit_log WHERE patient_id = '<PATIENT_ID>' AND resource_type = 'odontogram' AND action = 'view_record' AND created_at > NOW() - INTERVAL '2 minutes'`.
  - File(s): no file (SQL Editor).
  - Depends on: T-09.
  - Pass criterion: devuelve exactamente **1 fila nueva** (count total = N + 1), con `user_id` = dentista logueado, `patient_id` = paciente de prueba, `resource_id` = UUID de la evaluación (coincide con la URL), `organization_id` de la clínica activa, `created_at` dentro del último minuto. **Esta es la task que confirma el fix.**

- [ ] **T-11** [US3] Ejecutar **Paso 4 del plan** — refresh F5 sobre `/dashboard/therapist/odontograma/<uuid>` y re-ejecutar la query de T-10.
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-10.
  - Pass criterion: count sigue siendo N + 1 (dedup anti-spam vía `sessionStorage` funciona).

- [ ] **T-12** [US2] Ejecutar **Paso 5 del plan** — botón atrás del navegador + verificación:
  - (a) URL destino no es `/dashboard/therapist/odontograma/nueva`.
  - (b) Query `SELECT count(*) FROM odontogram_evaluations WHERE patient_id = '<PATIENT_ID>' AND evaluation_type = 'inicial' AND created_at > NOW() - INTERVAL '5 minutes'` devuelve 1 (no 2).
  - (c) Re-ejecutar query de T-10: count sigue siendo N + 1.
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-11.
  - Pass criterion: los 3 sub-checks pasan.

- [ ] **T-13** [US2] Ejecutar **Paso 6 del plan** — desde el listado, click en la evaluación recién creada; re-ejecutar query de T-10.
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-12.
  - Pass criterion: count sigue siendo N + 1 (dedup por-hora sigue respetado al re-abrir la misma evaluación).

- [ ] **T-14** [transversal] Ejecutar **Paso 7 del plan** — regresiones en flujos existentes del módulo Odontograma: guardar borrador, reabrir, Step 3, agregar procedimiento, completar evaluación, guardar en ficha.
  - File(s): no file (browser).
  - Depends on: T-13.
  - Pass criterion: los 5 sub-pasos del Paso 7 del plan completan sin errores visibles ni errores en consola del navegador. Toasts esperados aparecen ("Borrador guardado", "Evaluación completada", "Informe guardado en la ficha del paciente").

---

## Phase 5 — Validación consolidada en BD

**Purpose**: una única query consolidada tras el test completo, para cerrar con un "número de filas esperado vs. observado" explícito.

- [ ] **T-15** [transversal] Ejecutar query consolidada final:

  ```sql
  -- Delta de líneas de audit para la evaluación de prueba en la ventana completa del test
  SELECT
    count(*)            AS total_rows,
    count(DISTINCT resource_id) AS distinct_evaluations_logged,
    min(created_at)     AS first_seen,
    max(created_at)     AS last_seen
  FROM clinical_audit_log
  WHERE patient_id = '<PATIENT_ID_DE_PRUEBA>'
    AND resource_type = 'odontogram'
    AND action = 'view_record'
    AND created_at > '<TIMESTAMP_BASELINE_T08>';
  ```

  - File(s): no file (SQL Editor).
  - Depends on: T-14.
  - Pass criterion:
    - `total_rows` = exactamente 1 (la del primer acceso a la evaluación creada; la dedup anti-spam impidió que F5, atrás→adelante, y re-click añadieran filas).
    - `distinct_evaluations_logged` = 1 (mismo `resource_id` en todas las filas).
    - `first_seen` coincide con el timestamp inmediatamente posterior a T-09.
  - **Si `total_rows = 0`** → el fix no funcionó: revertir T-05 con `git checkout -- src/features/odontogram/pages/OdontogramEvaluationPage.jsx` y reportar al asesor antes de re-intentar.
  - **Si `total_rows > 1`** → se rompió dedup anti-spam: revertir T-05, reportar, y evaluar si se escaló el scope al logger (spec separada).

---

## Dependencies & Execution Order

### Task graph

```
T-01 → T-02 ─┐
        T-03 ─┼→ T-05 ──┬→ T-06 ─┐
        T-04 ─┘          └→ T-07 ─┴→ T-08 → T-09 → T-10 → T-11 → T-12 → T-13 → T-14 → T-15
```

- **T-01** es la raíz (lectura general).
- **T-02, T-03, T-04** pueden ir en paralelo entre sí, pero todas antes de T-05.
- **T-05** es el único cambio de código — ⚠ **punto de no retorno**.
- **T-06 y T-07** pueden correr en paralelo (`[P]`).
- **T-08 … T-15** son estrictamente secuenciales (dependen del estado acumulado del test manual).

### Parallel opportunities

- Phase 1: T-02 ∥ T-03 ∥ T-04 (distintas lecturas / comandos).
- Phase 3: T-06 ∥ T-07 (lint y build independientes).

### Punto de no retorno

- **T-05** es la única task que modifica código.
- Antes de ejecutar T-05, el asesor debe aprobar explícitamente el plan (checkpoint).
- Rollback de T-05: `git checkout -- src/features/odontogram/pages/OdontogramEvaluationPage.jsx` (<5 min por Constitution IV).

## Notes

- **[P]** = task paralelizable con su hermana.
- El número de tasks (15) incluye 4 de pre-implementación, 1 implementación, 2 automatizadas, 7 manuales (los 7 pasos del plan), y 1 validación BD consolidada.
- Tests automatizados de unit/integration NO se incluyen: el repo no tiene suite de componentes JSX (deuda documentada en `architecture.md`). El test manual procedimental es la verificación principal.
- Commits: tras aprobar T-15, Danissa crea el commit manual (fuera del alcance de estas tasks, Constitution IV + workflow advisor/executor).
