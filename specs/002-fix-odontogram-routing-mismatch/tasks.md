---

description: "Tasks for spec 002-fix-odontogram-routing-mismatch — 7 callsites across 4 files"
---

# Tasks: Fix — Odontogram Routing Mismatch (callsites alignment)

**Input**: `specs/002-fix-odontogram-routing-mismatch/spec.md` + `plan.md`
**Prerequisites**: spec.md, plan.md (both approved)

## Format

- **[ID]** — short task id (T-01 … T-13)
- **[Story]** — which spec user story it serves (US1 / US2 / transversal)
- **[P]** — task paralelizable con sus hermanas
- **File(s)** — exact paths touched (or "read-only" / "no file")
- **Depends on** — explicit predecessor task IDs
- **Pass criterion** — concrete, verifiable outcome

## Scope reminders (Constitution IV + VI)

- Out of scope (do **not** touch): `OdontogramEvaluationPage.jsx:176` (reservado para spec 001 paused), `DashboardRouter.jsx`, `src/lib/audit/*`, `supabase/migrations/`, `supabase/policies.sql`, otras rutas de módulos hermanos, los 4 docs fundacionales, `CLAUDE.md`, `supabase/schema.sql`, `public/llms.txt`.
- `Edit replace_all: true` está **prohibido en `OdontogramEvaluationPage.jsx`** porque mataría la línea 176 (violaría FR-009).
- Git add/commit/push son **NO tasks** — Danissa commitea tras aprobar Phase 4 (test manual).

---

## Phase 1 — Pre-implementation (read-only)

**Purpose**: confirmar que el terreno cuadra con el plan antes de tocar código. Sin ediciones.

- [ ] **T-01** [transversal] Confirmar lectura completa de `spec.md` (124 líneas) y `plan.md` (288 líneas).
  - File(s): read-only (`specs/002-fix-odontogram-routing-mismatch/spec.md`, `plan.md`).
  - Depends on: —.
  - Pass criterion: declarar "spec + plan leídos; entiendo que el fix son 7 strings de path con patrón uniforme (insertar `/therapist` entre `/dashboard` y `/odontograma`), 4 archivos tocados, línea 176 blindada".

- [ ] **T-02** [P] [transversal] Confirmar que `git status` no muestra modificaciones en los 4 archivos target antes de empezar.
  - File(s): no file (comando `git status`).
  - Depends on: T-01.
  - Pass criterion: ninguno de estos 4 archivos aparece como `modified`:
    - `src/components/layout/Sidebar.jsx`
    - `src/pages/therapist/PatientFilePage.jsx`
    - `src/features/odontogram/pages/OdontogramListPage.jsx`
    - `src/features/odontogram/pages/OdontogramEvaluationPage.jsx`
  - Si alguno aparece `modified`, **detener y reportar** — posible edición previa que rompería las líneas esperadas.

- [ ] **T-03** [P] [transversal] Confirmar que la línea 176 de `OdontogramEvaluationPage.jsx` sigue conteniendo el `window.history.replaceState` sin prefijo (FR-009).
  - File(s): read-only (`src/features/odontogram/pages/OdontogramEvaluationPage.jsx`).
  - Depends on: T-01.
  - Command: `grep -n "replaceState" src/features/odontogram/pages/OdontogramEvaluationPage.jsx`
  - Pass criterion: exactamente 1 match en línea 176 con contenido `window.history.replaceState(null, '', \`/dashboard/odontograma/${data.id}\`);`. **Si aparece modificado o en otra línea, detener y reportar.**

- [ ] **T-04** [P] [transversal] Confirmar los 7 callsites siguen en las líneas exactas del plan mediante grep global.
  - File(s): read-only (grep sobre `src/`).
  - Depends on: T-01.
  - Command: `grep -rn "/dashboard/odontograma" src/`
  - Pass criterion: exactamente **8 matches** en total — los 7 callsites (Sidebar:161, PatientFilePage:363, OdontogramListPage:72+150+199, OdontogramEvaluationPage:112+346) + la línea 176 de OdontogramEvaluationPage (reservada). **Si el conteo es ≠ 8 o las líneas difieren, detener y reportar.**

**Checkpoint Phase 1** — 🚦 **PUNTO DE PAUSA DEL ASESOR**: si T-01 a T-04 pasan sin discrepancia, el asesor autoriza por adelantado avanzar a Phase 2 (T-05…T-08) sin aprobación task-por-task. Si alguna discrepancia aparece, detener e informar.

---

## Phase 2 — Implementación (🚨 puntos de no retorno)

**⚠ Las 4 tasks de esta fase modifican código en `src/`.** Cada una edita exclusivamente los callsites enumerados — cero refactor adicional. Patrón único: insertar `/therapist` entre `/dashboard` y `/odontograma` en el string del path. Rollback por archivo: `git checkout -- <archivo>` (<10s).

- [ ] **T-05** 🚨 [P] [US1] Editar `src/components/layout/Sidebar.jsx` línea 161.
  - File(s): `src/components/layout/Sidebar.jsx` — **1 callsite, 1 edit**.
  - Depends on: T-02, T-03, T-04.
  - Acción: `Edit replace_all: false` con:
    - `old_string`: `{ name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/odontograma' },`
    - `new_string`: `{ name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/therapist/odontograma' },`
  - Pass criterion: `grep -n "'/dashboard/odontograma'" src/components/layout/Sidebar.jsx` devuelve **0 matches**; `grep -n "'/dashboard/therapist/odontograma'" src/components/layout/Sidebar.jsx` devuelve exactamente 1 match en línea 161.
  - Rollback: `git checkout -- src/components/layout/Sidebar.jsx` (<10s).

- [ ] **T-06** 🚨 [P] [US1] Editar `src/pages/therapist/PatientFilePage.jsx` línea 363.
  - File(s): `src/pages/therapist/PatientFilePage.jsx` — **1 callsite, 1 edit**.
  - Depends on: T-02, T-03, T-04.
  - Acción: `Edit replace_all: false` con:
    - `old_string`: `onClick={() => navigate(\`/dashboard/odontograma/nueva?patient=${id}\`)}`
    - `new_string`: `onClick={() => navigate(\`/dashboard/therapist/odontograma/nueva?patient=${id}\`)}`
  - Pass criterion: `grep -n "/dashboard/odontograma/nueva" src/pages/therapist/PatientFilePage.jsx` devuelve **0 matches**; `grep -n "/dashboard/therapist/odontograma/nueva?patient=" src/pages/therapist/PatientFilePage.jsx` devuelve exactamente 1 match en línea 363. Query string `?patient=${id}` preservado idéntico (FR-008).
  - Rollback: `git checkout -- src/pages/therapist/PatientFilePage.jsx` (<10s).

- [ ] **T-07** 🚨 [US1 + US2] Editar `src/features/odontogram/pages/OdontogramListPage.jsx` líneas 72, 150, 199 — **3 callsites, secuenciales dentro del archivo**.
  - File(s): `src/features/odontogram/pages/OdontogramListPage.jsx` — 3 edits.
  - Depends on: T-02, T-03, T-04.
  - **IMPORTANTE**: los 3 callsites tienen distinto contexto textual (línea 72 usa `'nueva'` literal, líneas 150 y 199 usan template literal `` `${ev.id}` ``). Aplicar los 3 edits secuencialmente con `replace_all: false`, cada uno con contexto único suficiente para identificar su línea.
  - Acciones (en orden):
    1. **Línea 72** — `old_string`: `<Button onClick={() => navigate('/dashboard/odontograma/nueva')} className="bg-pink-500 hover:bg-pink-600">` → `new_string`: `<Button onClick={() => navigate('/dashboard/therapist/odontograma/nueva')} className="bg-pink-500 hover:bg-pink-600">`
    2. **Línea 150** — `old_string`: `<Button variant="ghost" size="sm" onClick={() => navigate(\`/dashboard/odontograma/${ev.id}\`)}>` → `new_string`: `<Button variant="ghost" size="sm" onClick={() => navigate(\`/dashboard/therapist/odontograma/${ev.id}\`)}>`
    3. **Línea 199** — `old_string`: `<Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => navigate(\`/dashboard/odontograma/${ev.id}\`)}>` → `new_string`: `<Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => navigate(\`/dashboard/therapist/odontograma/${ev.id}\`)}>`
  - Pass criterion: `grep -n "/dashboard/odontograma" src/features/odontogram/pages/OdontogramListPage.jsx` devuelve **0 matches**; `grep -n "/dashboard/therapist/odontograma" src/features/odontogram/pages/OdontogramListPage.jsx` devuelve exactamente **3 matches** en líneas 72, 150, 199.
  - Rollback: `git checkout -- src/features/odontogram/pages/OdontogramListPage.jsx` (<10s).

- [ ] **T-08** 🚨 [US1 + US2] Editar `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` líneas 112 y 346 — **2 callsites, secuenciales; la línea 176 NO se toca**.
  - File(s): `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` — 2 edits.
  - Depends on: T-02, T-03, T-04.
  - **CRÍTICO**: **`replace_all: true` está prohibido aquí.** Ese flag cambiaría también la línea 176 (reservada por FR-009), violando spec 001's contrato. Usar `replace_all: false` con `old_string` específico de cada línea.
  - Acciones (en orden):
    1. **Línea 112** — `old_string`: `navigate('/dashboard/odontograma');` → `new_string`: `navigate('/dashboard/therapist/odontograma');` (aparece solo 1 vez con ese exacto punto-y-coma al final, dentro del fallback de error en `loadEvaluation`).
    2. **Línea 346** — `old_string`: `<Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/odontograma')}>` → `new_string`: `<Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/therapist/odontograma')}>` (botón Volver del header, contexto único por el `<Button variant="ghost" ...>` del header).
  - Pass criterion:
    - `grep -n "/dashboard/odontograma" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` devuelve exactamente **1 match** — la línea 176 (intacta, FR-009).
    - `grep -n "/dashboard/therapist/odontograma" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` devuelve exactamente **2 matches** en líneas 112 y 346.
    - `grep -n "replaceState" src/features/odontogram/pages/OdontogramEvaluationPage.jsx` sigue devolviendo exactamente 1 match en línea 176 (la línea no fue tocada).
  - Rollback: `git checkout -- src/features/odontogram/pages/OdontogramEvaluationPage.jsx` (<10s).

**Checkpoint Phase 2** — los 4 archivos tocados. 7 callsites actualizados. Línea 176 intacta.

---

## Phase 3 — Verificación automática

**Purpose**: descartar errores de lint, build rotos, y confirmar SC-004 con grep global. Las 4 tasks pueden correrse en paralelo.

- [ ] **T-09** [P] [transversal] ESLint sobre los 4 archivos modificados.
  - File(s): read-only para el linter.
  - Depends on: T-05, T-06, T-07, T-08.
  - Command: `npx eslint src/components/layout/Sidebar.jsx src/pages/therapist/PatientFilePage.jsx src/features/odontogram/pages/OdontogramListPage.jsx src/features/odontogram/pages/OdontogramEvaluationPage.jsx`
  - Pass criterion: exit code 0; 0 errores. Warnings nuevos ≤ warnings pre-existentes (los 2 warnings conocidos de `OdontogramEvaluationPage.jsx:75,79` sobre `react-hooks/exhaustive-deps` son pre-existentes y aceptables).

- [ ] **T-10** [P] [transversal] `vite build` completa sin errores.
  - File(s): no file.
  - Depends on: T-05, T-06, T-07, T-08.
  - Command: `npm run build`
  - Pass criterion: exit code 0; build termina con `✓ built in Xs`. Warning sobre chunk size >500kB es pre-existente y aceptable.

- [ ] **T-11** [P] 🎯 [transversal] **Grep SC-004** — confirmar que post-fix solo queda 1 match al patrón antiguo.
  - File(s): no file.
  - Depends on: T-05, T-06, T-07, T-08.
  - Command: `grep -rn "/dashboard/odontograma" src/`
  - Pass criterion: exactamente **1 match**: `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:176` (la línea reservada por FR-009). **Cualquier otro match es failure:** rollback de los 4 archivos con `git checkout --` y reportar.

- [ ] **T-12** [P] [transversal] Grep complementario — confirmar los 7 callsites corregidos.
  - File(s): no file.
  - Depends on: T-05, T-06, T-07, T-08.
  - Command: `grep -rn "/dashboard/therapist/odontograma" src/`
  - Pass criterion: exactamente **7 matches** en `src/`:
    - Sidebar.jsx:161
    - PatientFilePage.jsx:363
    - OdontogramListPage.jsx:72, 150, 199
    - OdontogramEvaluationPage.jsx:112, 346
  - Si devuelve ≠ 7 matches, investigar qué callsite quedó fuera y reportar.

**Checkpoint Phase 3** — lint OK, build OK, grep SC-004 confirmado (1 match), grep complementario confirma 7 callsites. Si cualquiera falla: rollback completo (`git checkout -- <los 4 archivos>`) y detener.

---

## Phase 4 — Test manual (humano, responsabilidad de Danissa)

**Purpose**: ejecutar los 7 acceptance scenarios definidos en `spec.md` §"User Story 1/2 — Acceptance Scenarios" + regression check en módulos hermanos (§"Success Criteria SC-002").

**⚠ Esta fase la ejecuta Danissa en su navegador real, NO el ejecutor Claude Code.**

- [ ] **T-13** [US1 + US2 + transversal] Test manual procedimental según spec 002.
  - File(s): no file (browser + staging).
  - Depends on: T-09, T-10, T-11, T-12.
  - **Pasos:** referenciar spec 002 §"User Story 1 — Acceptance Scenarios" (3 escenarios) + §"User Story 2 — Acceptance Scenarios" (3 escenarios) + §"Success Criteria" (SC-001 a SC-005).
  - **Resumen rápido para el test (no reemplaza la spec):**
    1. Login como dentista (cuenta `dentalspot.cl@gmail.com`).
    2. Click en "Odontograma" del Sidebar → listado debe cargar sin 404 (SC-001, US1-AS1).
    3. Desde el listado, click "Nueva Evaluación" → formulario Step 1 sin 404 (US1-AS2).
    4. Desde ficha de paciente (`PatientFilePage`), click "Nueva Evaluación" del tab Odontograma → formulario con `?patient=<id>` sin 404 (US1-AS3, SC-003).
    5. Click en un item existente del listado → detalle sin 404 (US2-AS1).
    6. Dentro del detalle, botón "Volver" → listado sin 404 (US2-AS2).
    7. Verificar regresión en 2+ módulos hermanos (ej. notiz, pie, questions) → deben seguir funcionando (SC-002).
  - Pass criterion: los 7 flujos pasan sin NotFoundPage. Query param `patient` preservado en el paso 4. Módulos hermanos intactos.
  - **Si falla:** rollback con `git checkout -- src/components/layout/Sidebar.jsx src/pages/therapist/PatientFilePage.jsx src/features/odontogram/pages/OdontogramListPage.jsx src/features/odontogram/pages/OdontogramEvaluationPage.jsx` y reportar al asesor.

**Checkpoint Phase 4** — si el test manual pasa, Danissa procede a `git add` + commit manual (fuera de las tasks de este plan, workflow advisor/executor).

---

## Dependencies & Execution Order

### Task graph

```
T-01 ─┬─→ T-02 ┐
      ├─→ T-03 ┼─→ [T-05, T-06, T-07, T-08 pueden ir en paralelo entre sí]
      └─→ T-04 ┘      │
                      ↓
           [T-09, T-10, T-11, T-12 pueden ir en paralelo entre sí]
                      ↓
                    T-13 (humano, Danissa)
```

### Tabla resumen dependencias

| Task | Depende de | Paralelizable con |
|---|---|---|
| T-01 | — | — |
| T-02 | T-01 | T-03, T-04 |
| T-03 | T-01 | T-02, T-04 |
| T-04 | T-01 | T-02, T-03 |
| T-05 🚨 | T-02, T-03, T-04 | T-06, T-07, T-08 |
| T-06 🚨 | T-02, T-03, T-04 | T-05, T-07, T-08 |
| T-07 🚨 | T-02, T-03, T-04 | T-05, T-06, T-08 (los 3 edits internos son secuenciales dentro del archivo) |
| T-08 🚨 | T-02, T-03, T-04 | T-05, T-06, T-07 (los 2 edits internos son secuenciales dentro del archivo) |
| T-09 | T-05, T-06, T-07, T-08 | T-10, T-11, T-12 |
| T-10 | T-05, T-06, T-07, T-08 | T-09, T-11, T-12 |
| T-11 | T-05, T-06, T-07, T-08 | T-09, T-10, T-12 |
| T-12 | T-05, T-06, T-07, T-08 | T-09, T-10, T-11 |
| T-13 | T-09, T-10, T-11, T-12 | — |

### Parallel opportunities

- **Phase 1**: T-02, T-03, T-04 en paralelo (distintos comandos read-only independientes).
- **Phase 2**: T-05, T-06, T-07, T-08 en paralelo entre archivos (cero dependencias entre ellos). **Pero** los edits DENTRO de T-07 y T-08 son secuenciales (replace_all: false sobre el mismo archivo).
- **Phase 3**: T-09, T-10, T-11, T-12 en paralelo (ESLint, build, y los 2 greps son independientes).

### Puntos de no retorno (🚨)

Las 4 tasks de Phase 2 modifican código:

- **T-05** — Sidebar.jsx
- **T-06** — PatientFilePage.jsx
- **T-07** — OdontogramListPage.jsx (3 edits internos)
- **T-08** — OdontogramEvaluationPage.jsx (2 edits internos; **línea 176 protegida por FR-009**)

Checkpoint del asesor: **antes de T-05**, tras completar Phase 1. Autorización por adelantado si Phase 1 pasa sin discrepancias.

### Rollback global (si algo va mal en Phase 2 o 3)

```bash
git checkout -- \
  src/components/layout/Sidebar.jsx \
  src/pages/therapist/PatientFilePage.jsx \
  src/features/odontogram/pages/OdontogramListPage.jsx \
  src/features/odontogram/pages/OdontogramEvaluationPage.jsx
```

Tiempo total: <30 segundos. Sin migraciones, edge functions ni builds que revertir (el `dist/` se regenera al siguiente build).

---

## Notes

- **[P]** = task paralelizable con sus hermanas de misma fase.
- **[Story]** = enlace a las user stories de la spec para trazabilidad.
- Total de tasks: **13** (4 pre-impl + 4 impl + 4 verificación + 1 test manual).
- Total de archivos tocados: **4**. Total de líneas modificadas: **7**.
- Commits: tras aprobar T-13, Danissa crea el commit manual (fuera del alcance de estas tasks, Constitution IV + workflow advisor/executor).
- Una vez spec 002 cierre, spec 001 (paused) reanuda con ajuste mínimo: la línea 176 pasa de `window.history.replaceState(null, '', \`/dashboard/odontograma/${data.id}\`)` a `navigate(\`/dashboard/therapist/odontograma/${data.id}\`, { replace: true })` — path ya alineado gracias a este fix.
