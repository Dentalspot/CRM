---

description: "Tasks for spec 004-audit-logger-resource-dedup — 3 ediciones en 1 archivo (useClinicalAccessLogger.js)"
---

# Tasks: Fix — `resource_id` en el bucketKey anti-spam del audit logger

**Input**: `specs/004-audit-logger-resource-dedup/spec.md` + `plan.md`
**Prerequisites**: spec.md + plan.md aprobados. Spec 003 cerrada (commit `c55d1a5`) — sin ella este fix no es observable en prod.

## Leyenda de íconos

- 🤖 — ejecuta el ejecutor (Claude Code CLI)
- 👤 — ejecuta Danissa (humano, browser + SQL Editor + terminal)
- 🚨 — punto de no retorno (modifica código)
- 🎯 — task crítica (confirma el fix o previene regresión invariante)
- **[P]** — task paralelizable con sus hermanas de la misma fase

## Scope reminders (Constitution III + IV + VI)

- **No fabricar entradas retroactivas** en `clinical_audit_log` (SC-005 de spec 003). Append-only inviolable.
- **No relajar policy RLS** (sigue en pie post-spec 003). Fix puramente cliente.
- **No tocar `clinicalAuditLogger.js`** (logger util). Solo `useClinicalAccessLogger.js`.
- **No tocar consumidores** (`PatientFilePage.jsx:136`, `OdontogramEvaluationPage.jsx:81`). Ambos ya pasan `resourceId` explícitamente.
- **`replace_all: true` está prohibido** en `useClinicalAccessLogger.js` — el `tupleKey` línea 38 tiene patrón similar y podría cruzarse.
- Git add/commit/push son tareas 👤 de Danissa (Phase 5). El ejecutor 🤖 no los ejecuta.

---

## Phase 1 🤖 — Pre-implementación (read-only)

**Propósito**: confirmar que el código no drift desde la verificación del plan. Sin ediciones.

- [ ] **T-01** 🤖 [transversal] Releer `spec.md` (147 líneas) y `plan.md` (280 líneas) completos. Confirmar que entiendo el fix (3 ediciones en 1 archivo, sin `replace_all: true`).
  - File(s): read-only (`specs/004-audit-logger-resource-dedup/spec.md`, `plan.md`).
  - Depends on: —.
  - Pass criterion: declarar "spec + plan leídos; fix = 3 ediciones en `useClinicalAccessLogger.js` líneas 9, 15, 41-46; ambos consumidores ya pasan `resourceId`".

- [ ] **T-02** 🤖 [P] [transversal] Confirmar working tree limpio en `src/lib/audit/useClinicalAccessLogger.js` (no ha sido modificado desde el análisis del plan).
  - File(s): no file (comando `git status`).
  - Depends on: T-01.
  - Pass criterion: el archivo NO aparece como `modified` en `git status`. Si lo está, **detener y reportar** — posible drift con el plan.

- [ ] **T-03** 🤖 [P] [transversal] Confirmar que los callsites siguen como los cita el plan. Grep:
  ```
  grep -n "useClinicalAccessLogger" src/ | grep -v "src/lib/audit/"
  ```
  y verificar que las líneas reportadas siguen siendo:
  - `src/pages/therapist/PatientFilePage.jsx:24` (import) + `:136` (invocación con `resourceId: patientData?.patient?.id || null`)
  - `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:24` (import) + `:81` (invocación con `resourceId: evaluationId || null`)
  - Línea 176 del OdontogramEvaluationPage es comentario, no invocación.
  - File(s): read-only (grep sobre `src/`).
  - Depends on: T-01.
  - Pass criterion: exactamente 2 consumidores efectivos; ambos pasan `resourceId` explícitamente. Si aparece un tercer consumidor oculto o alguno no pasa `resourceId`, **detener y reportar**.

**Checkpoint Phase 1 🤖 → 🚨 Phase 2**: si T-01..T-03 pasan sin discrepancia, autorización por adelantado para avanzar a T-04. Solo detener si hay discrepancia real (código driftó, nuevo callsite oculto, etc.).

---

## Phase 2 🤖 🚨 — Implementación

**⚠ T-04 es la única task que modifica código.** 3 ediciones secuenciales dentro del mismo archivo — cada una con `replace_all: false` + contexto único. `replace_all: true` está PROHIBIDO aquí (dañaría el `tupleKey` de línea 38).

- [ ] **T-04** 🤖 🚨 [US1 + US2 + US3] Aplicar las 3 ediciones en `src/lib/audit/useClinicalAccessLogger.js` según `plan.md` §"Technical Change Propuesto", en orden.
  - File(s): `src/lib/audit/useClinicalAccessLogger.js` — **1 archivo, 3 ediciones**.
  - Depends on: T-02, T-03.
  - **Acciones (secuenciales, `replace_all: false` en las 3):**

    **Edit 1 (línea 9) — Firma de `hourBucketKey`:**
    - `old_string`: `function hourBucketKey({ userId, patientId, action, resourceType }) {`
    - `new_string`: `function hourBucketKey({ userId, patientId, action, resourceType, resourceId }) {`

    **Edit 2 (línea 15) — Template string del return:**
    - `old_string`: `` return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${y}-${m}-${d}-${h}`; ``
    - `new_string`: `` return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${resourceId ?? ''}:${y}-${m}-${d}-${h}`; ``

    **Edit 3 (líneas 41-46) — Callsite de `hourBucketKey({...})`:**
    - `old_string`:
      ```
          const bucketKey = hourBucketKey({
            userId: user.id,
            patientId,
            action,
            resourceType,
          });
      ```
    - `new_string`:
      ```
          const bucketKey = hourBucketKey({
            userId: user.id,
            patientId,
            action,
            resourceType,
            resourceId,
          });
      ```

  - Pass criterion: las 3 ediciones aplicadas exitosamente. Post-fix `grep -n "hourBucketKey\|resourceId" src/lib/audit/useClinicalAccessLogger.js` muestra `resourceId` en líneas ~9 (firma), ~15 (template) y ~46 (callsite). El `tupleKey` de línea 38 sigue intacto (su patrón `resourceId ?? ''` ya existía pre-fix).
  - **Rollback si T-04 introduce error de syntax o inconsistencia**: `git checkout -- src/lib/audit/useClinicalAccessLogger.js` (<10s).

---

## Phase 3 🤖 — Verificación automática

**Propósito**: sanity checks post-edición. Paralelizables.

- [ ] **T-05** 🤖 [P] [transversal] Grep post-fix confirmando las 3 ediciones presentes.
  - File(s): read-only.
  - Depends on: T-04.
  - Command(s):
    ```
    grep -n "function hourBucketKey" src/lib/audit/useClinicalAccessLogger.js
    grep -n "\${resourceId ?? ''}" src/lib/audit/useClinicalAccessLogger.js
    grep -n "resourceId," src/lib/audit/useClinicalAccessLogger.js
    ```
  - Pass criterion:
    - `function hourBucketKey({ userId, patientId, action, resourceType, resourceId })` presente exactamente 1 vez en línea ~9.
    - `${resourceId ?? ''}` presente al menos 2 veces: en el template de `tupleKey` (línea 38, pre-existente) Y en el template de `hourBucketKey` (línea 15, nuevo).
    - `resourceId,` (con coma, del destructuring de parámetros) presente al menos 3 veces: (a) línea 22 del hook (param default), (b) línea 9 de `hourBucketKey` (nuevo), (c) línea 46 del callsite (nuevo).
    - Si algún count difiere, **detener y reportar**. Rollback via `git checkout --`.

- [ ] **T-06** 🤖 [P] [transversal] ESLint sobre el archivo modificado.
  - File(s): read-only para el linter.
  - Depends on: T-04.
  - Command: `npx eslint src/lib/audit/useClinicalAccessLogger.js`
  - Pass criterion: exit code 0, 0 errores. Warnings nuevos ≤ warnings pre-existentes. El archivo no tenía warnings históricos según las revisiones de specs 001/003 — esperado 0 warnings post-fix.

- [ ] **T-07** 🤖 [P] [transversal] `vite build` completa sin errores.
  - File(s): no file; el build regenera `dist/`.
  - Depends on: T-04.
  - Command: `npm run build`
  - Pass criterion: exit code 0, `✓ built in Xs`. Si tocó `public/llms.txt` (side-effect del pipeline `tools/generate-llms.js`), **revertir con `git checkout -- public/llms.txt` ANTES del reporte final** (patrón observado en specs 001, 002, 003 previas).

**Checkpoint Phase 3 🤖 → 👤 Phase 4**: el ejecutor emite reporte intermedio con diff de T-04, outputs de T-05/T-06/T-07, y `git status` limpio. Handoff a Danissa.

---

## Phase 4 👤 — Test manual E2E

**Propósito**: validar acceptance US1 + US2 + US3 de spec 004 con SQL real. Flujo en browser + SQL Editor.

**Setup**: login como Cristóbal (`dentalspot.cl@gmail.com`, `user_id = 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`). Paciente de prueba: idealmente uno con `patient_care_team` activo post-spec 003 (ej. `e0f26605-...` o similar; cualquiera que pase el gate del Paso 1 de spec 003 funcionará).

- [ ] **T-08** 👤 [transversal] Baseline SQL antes de tocar la UI.
  - File(s): no file (SQL Editor).
  - Depends on: T-05, T-06, T-07.
  - Query:
    ```sql
    SELECT count(*) AS total_last_hour, max(created_at) AS last_entry
    FROM public.clinical_audit_log
    WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
      AND patient_id = '<PATIENT_ID_DE_PRUEBA>'
      AND resource_type = 'odontogram'
      AND created_at > NOW() - INTERVAL '1 hour';
    ```
  - Pass criterion: query ejecuta. Anotar `N = total_last_hour` como baseline.

- [ ] **T-09** 👤 [US1] Crear evaluación A de odontograma para el paciente de prueba.
  - File(s): no file (browser).
  - Depends on: T-08.
  - Pasos: `/dashboard/therapist/odontograma/nueva?patient=<PATIENT_ID>` → completar Step 1 (tipo "inicial") → "Iniciar Evaluación". Anotar `evaluation_id_A` (visible en URL post-creación).
  - Pass criterion: evaluación A creada sin error; URL cambia a `/dashboard/therapist/odontograma/<evaluation_id_A>`.

- [ ] **T-10** 👤 [US1] Query post-creación de A.
  - File(s): no file (SQL Editor).
  - Depends on: T-09.
  - Re-ejecutar query de T-08 con `ORDER BY created_at DESC` + listar `resource_id`:
    ```sql
    SELECT id, resource_id, created_at
    FROM public.clinical_audit_log
    WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
      AND patient_id = '<PATIENT_ID>'
      AND resource_type = 'odontogram'
      AND created_at > NOW() - INTERVAL '1 hour'
    ORDER BY created_at DESC;
    ```
  - Pass criterion: count = `N + 1`, top row tiene `resource_id = <evaluation_id_A>`.

- [ ] **T-11** 👤 [US1] Crear evaluación B en la misma hora, mismo paciente.
  - File(s): no file (browser).
  - Depends on: T-10.
  - Pasos: volver al listado (`/dashboard/therapist/odontograma`) → "Nueva Evaluación" → MISMO paciente → "Iniciar Evaluación". Anotar `evaluation_id_B` (distinto de A).
  - Pass criterion: evaluación B creada sin error. `evaluation_id_B ≠ evaluation_id_A`.

- [ ] **T-12** 👤 🎯 [US1] **Query post-B — valida el fix.**
  - File(s): no file (SQL Editor).
  - Depends on: T-11.
  - Re-ejecutar la query de T-10.
  - Pass criterion: count = `N + 2`. Exactamente **2 filas nuevas** con `resource_id = <evaluation_id_A>` y `resource_id = <evaluation_id_B>` respectivamente. **Pre-fix este paso fallaría con count = `N + 1` (la B bloqueada por bucketKey idéntico al de A).** **Esta es la task que confirma que el fix funciona.**

- [ ] **T-13** 👤 🎯 [US2] **Refresh intra-recurso — valida que dedup sigue operando.**
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-12.
  - Pasos: navegar a `/dashboard/therapist/odontograma/<evaluation_id_A>`. Presionar F5 refresh 3 veces. Luego re-ejecutar la query de T-10.
  - Pass criterion: count **sigue siendo `N + 2`**. NO +3, NO +5. El bucketKey estable para (user, patient, action, resourceType, evaluation_id_A, hora) mantiene el dedup. **Esta es la task que confirma que no hay regresión del invariante anti-spam.**

- [ ] **T-14** 👤 [US3] Regresión check sobre `PatientFilePage` (consumidor que pasa `resourceId = patient.id`).
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-13.
  - Query baseline para `clinical_record`:
    ```sql
    SELECT count(*) AS baseline FROM public.clinical_audit_log
    WHERE user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
      AND patient_id = '<PATIENT_ID>'
      AND resource_type = 'clinical_record'
      AND created_at > NOW() - INTERVAL '1 hour';
    ```
  - Abrir `/dashboard/patients/<PATIENT_ID>` (la ficha). Re-ejecutar query. F5 refresh 2 veces. Re-ejecutar query.
  - Pass criterion:
    - Tras abrir la ficha: count = `baseline + 1` (primer acceso en la hora) O count = `baseline` si ya había uno en la hora.
    - Tras F5: count **no cambia** (dedup intra-recurso preservado para `resource_id = patient.id`).
    - Sin errores en consola del navegador relacionados con el hook.

---

## Phase 5 👤 — Commit + push

**Propósito**: dejar el fix en `origin/main` con mensaje que cumple FR-006 de spec 004.

- [ ] **T-15** 👤 [transversal] Commit + push del fix.
  - File(s): `src/lib/audit/useClinicalAccessLogger.js` staged.
  - Depends on: T-14.
  - Template de mensaje obligatorio (referencia a spec 003 + gap cerrado, cumple FR-006):
    ```
    fix(audit): resource_id en bucketKey anti-spam (spec 004)

    El hook useClinicalAccessLogger deduplicaba accesos clínicos en la misma hora
    por (user, patient, action, resourceType) sin incluir resourceId. Resultado:
    la 2da evaluación distinta del mismo paciente en la misma hora quedaba
    bloqueada por sessionStorage bucketKey idéntico y no se registraba en
    clinical_audit_log (edge case, Constitution III + Ley 21.719 ARCO).

    Fix: 3 ediciones en src/lib/audit/useClinicalAccessLogger.js
     - Firma de hourBucketKey() incluye resourceId
     - Template string del return añade ${resourceId ?? ''}
     - Callsite pasa resourceId al hourBucketKey({...})

    Consumidores ya pasaban resourceId (PatientFilePage:136 con patient.id,
    OdontogramEvaluationPage:81 con evaluationId) — no requieren cambio.

    Cierra gap documentado en data-compliance.md tras diagnóstico del ciclo
    de spec 003 (commit c55d1a5). Sin este commit, spec 003 operaba sobre
    un invariante anti-spam demasiado agresivo.

    No fabrica entradas retroactivas (SC-005 spec 003 vigente). Policy RLS
    cal_dentist_insert intacta. Logger util intacto. Consumidores intactos.
    ```
  - Pasos:
    ```bash
    git add src/lib/audit/useClinicalAccessLogger.js
    git commit -m "..."   # mensaje de arriba vía heredoc
    git push origin 004-audit-logger-resource-dedup   # o main si se prefiere PR-less flow
    ```
  - Pass criterion: commit creado, push exitoso. `git log --oneline -1` muestra el commit.

---

## Dependencies & Execution Order

### Task graph

```
T-01 ─┬→ T-02 [P] ┐
      └→ T-03 [P] ┴→ T-04 🚨 🤖 ──┬→ T-05 [P] ─┐
                                    ├→ T-06 [P] ─┼→ [👤 handoff] → T-08 → T-09 → T-10 → T-11 → T-12 🎯 → T-13 🎯 → T-14 → T-15
                                    └→ T-07 [P] ─┘
```

### Tabla resumen dependencias

| Task | Ejecutor | Depende de | Paralelizable con |
|---|---|---|---|
| T-01 | 🤖 | — | — |
| T-02 [P] | 🤖 | T-01 | T-03 |
| T-03 [P] | 🤖 | T-01 | T-02 |
| **T-04 🚨** | 🤖 | T-02, T-03 | — |
| T-05 [P] | 🤖 | T-04 | T-06, T-07 |
| T-06 [P] | 🤖 | T-04 | T-05, T-07 |
| T-07 [P] | 🤖 | T-04 | T-05, T-06 |
| T-08 | 👤 | T-05, T-06, T-07 | — |
| T-09 | 👤 | T-08 | — |
| T-10 | 👤 | T-09 | — |
| T-11 | 👤 | T-10 | — |
| **T-12 🎯** | 👤 | T-11 | — |
| **T-13 🎯** | 👤 | T-12 | — |
| T-14 | 👤 | T-13 | — |
| T-15 | 👤 | T-14 | — |

### Puntos de no retorno 🚨 y tasks críticas 🎯

- **T-04 🚨** — única task que modifica código. Rollback: `git checkout -- src/lib/audit/useClinicalAccessLogger.js` (<10s).
- **T-12 🎯** — confirma que el fix funciona (2 evaluaciones distintas → 2 filas en log). Es el test positivo.
- **T-13 🎯** — confirma que el dedup intra-recurso NO se rompió (F5 sobre misma evaluación → sigue 1 fila). Es el test negativo (de regresión).

Ambos 🎯 deben pasar para que el fix se considere exitoso.

### Parallel opportunities

- **Phase 1**: T-02 ∥ T-03 (grep + git status son independientes).
- **Phase 3**: T-05 ∥ T-06 ∥ T-07 (grep + ESLint + build son independientes).
- **Phase 4**: no paralelizable — cada task depende del estado del flujo E2E.
- **Phase 5**: secuencial (commit antes de push).

### Rollback global (si Phase 2 o 3 introducen error)

```bash
git checkout -- src/lib/audit/useClinicalAccessLogger.js
```

Sin migraciones, sin edge functions. El `dist/` se regenera al siguiente build. `public/llms.txt` (si el build lo tocó) ya fue revertido en T-07. Tiempo total: <30 segundos.

---

## Notes

- **Total de tasks: 15** (7 🤖 + 8 👤).
- **1 punto de no retorno 🚨** (T-04) + **2 tasks críticas 🎯** (T-12, T-13).
- **Total archivos tocados: 1** (`src/lib/audit/useClinicalAccessLogger.js`, 3 ediciones puntuales).
- **Commit/push son tareas 👤 explícitas** (T-15); el ejecutor no los ejecuta.
- Post-cierre de spec 004, `data-compliance.md` §"Deuda compliance conocida" puede marcarse explícitamente "Agregar resource_id al bucketKey" como **cerrada** en micro-bloque posterior opcional (fuera de scope de spec 004).
