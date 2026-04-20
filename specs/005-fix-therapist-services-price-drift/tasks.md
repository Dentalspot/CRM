---

description: "Tasks for spec 005-fix-therapist-services-price-drift — 1 Edit en odontogramEvalApi.js (alias SQL)"
---

# Tasks: Fix — schema drift `therapist_services.price` en odontogramEvalApi

**Input**: `specs/005-fix-therapist-services-price-drift/spec.md` + `plan.md`
**Prerequisites**: spec + plan aprobados. Mini-audit del 2026-04-20 confirmó 0/6 drifts ocultos en consumidores de `therapist_services`.

## Leyenda de íconos

- 🤖 — ejecuta el ejecutor (Claude Code CLI)
- 👤 — ejecuta Danissa (humano, browser + terminal)
- 🚨 — punto de no retorno (modifica código)
- 🎯 — task crítica (confirma el fix o previene regresión)
- **[P]** — task paralelizable con sus hermanas de la misma fase

## Scope reminders (Constitution IV + VI)

- **1 archivo, 1 línea, 1 edit.** Enfoque A (alias SQL `price:price_clp`) elegido por el plan.
- **NO tocar consumidores** de `therapist_services` (9 confirmados immunes, 6 revalidados en Phase 1 del plan — todos immunes).
- **NO tocar `OdontogramEvaluationPage.jsx`**: Opción A preserva el consumidor sin cambios (FR-002).
- **NO modificar** schema, migrations, policies, ni otros módulos.
- **`replace_all: true` innecesario** (old_string único en el archivo).
- Git add/commit/push son tareas 👤 de Danissa (Phase 5). El ejecutor 🤖 no los ejecuta.

---

## Phase 1 🤖 — Pre-implementación (read-only)

**Propósito**: confirmar que el código no drift desde el plan. Sin ediciones.

- [ ] **T-01** 🤖 [transversal] Releer `spec.md` (139 líneas) y `plan.md` (247 líneas) completos. Confirmar el entendimiento: Opción A (alias), 1 edit en línea 172 de `odontogramEvalApi.js`, consumidor no se toca.
  - File(s): read-only (spec.md, plan.md).
  - Depends on: —.
  - Pass criterion: declarar "spec + plan leídos; fix = 1 edit con alias `price:price_clp` en `odontogramEvalApi.js:172`; `OdontogramEvaluationPage.jsx` no se toca".

- [ ] **T-02** 🤖 [P] [transversal] Confirmar que `src/features/odontogram/api/odontogramEvalApi.js` NO aparece como `modified` en `git status` — garantía de que el archivo no drifteó desde el plan.
  - File(s): no file (comando `git status`).
  - Depends on: T-01.
  - Pass criterion: el archivo NO aparece como `modified`. Si lo hace, **detener y reportar** — posible cambio concurrente que invalida el plan.

- [ ] **T-03** 🤖 [P] [transversal] Confirmar que el callsite `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:103` sigue siendo `const { data } = await fetchTherapistServices(user.id);` — que no haya sido modificado entre el plan y ahora.
  - File(s): read-only (`OdontogramEvaluationPage.jsx`).
  - Depends on: T-01.
  - Command sugerido: `grep -n "fetchTherapistServices" src/features/odontogram/pages/OdontogramEvaluationPage.jsx`
  - Pass criterion: línea 103 contiene la invocación esperada; líneas 247, 276, 553 usan `.price` como documenta el plan. Si las líneas cambiaron, **detener y reportar** — el contexto del plan no aplica.

**Checkpoint Phase 1 🤖 → 🚨 Phase 2**: si T-01..T-03 pasan sin discrepancia, autorización por adelantado aplicada → T-04 se ejecuta automáticamente. Solo detener si hay discrepancia real.

---

## Phase 2 🤖 🚨 — Implementación

**⚠ T-04 es la única task que modifica código.** 1 Edit sobre `odontogramEvalApi.js:172`.

- [ ] **T-04** 🤖 🚨 [US1] Aplicar el alias SQL en `src/features/odontogram/api/odontogramEvalApi.js:172`.
  - File(s): `src/features/odontogram/api/odontogramEvalApi.js` — **1 archivo, 1 edit**.
  - Depends on: T-02, T-03.
  - **Acción** (`Edit replace_all: false`):
    - `old_string`: `    .select('id, service_name, price, duration_minutes')`
    - `new_string`: `    .select('id, service_name, price:price_clp, duration_minutes')`
  - Pass criterion: el archivo contiene exactamente una ocurrencia de `'id, service_name, price:price_clp, duration_minutes'` y cero ocurrencias de `'id, service_name, price, duration_minutes'`. La estructura del archivo (funciones, exports, otros bloques) permanece sin cambios.
  - **Rollback si aparece error de sintaxis o inconsistencia**: `git checkout -- src/features/odontogram/api/odontogramEvalApi.js` (<10s).

---

## Phase 3 🤖 — Verificación automática

**Propósito**: sanity checks post-edición. Paralelizables.

- [ ] **T-05** 🤖 [P] [transversal] Grep post-fix verificando la edición.
  - File(s): read-only.
  - Depends on: T-04.
  - Commands:
    ```
    grep -n "price:price_clp" src/features/odontogram/api/odontogramEvalApi.js
    grep -n "'id, service_name, price," src/features/odontogram/api/odontogramEvalApi.js
    ```
  - Pass criterion:
    - Primer grep devuelve exactamente **1 match** en línea 172.
    - Segundo grep devuelve **0 matches** (la query vieja ya no existe).
    - Si los counts difieren, **detener y reportar**. Rollback via `git checkout --`.

- [ ] **T-06** 🤖 [P] [transversal] ESLint sobre el archivo modificado.
  - File(s): read-only para el linter.
  - Depends on: T-04.
  - Command: `npx eslint src/features/odontogram/api/odontogramEvalApi.js`
  - Pass criterion: exit code 0. El archivo no tenía warnings pre-existentes según los greps de specs 003/004. Esperado 0 warnings post-fix.

- [ ] **T-07** 🤖 [P] [transversal] `vite build` completa sin errores.
  - File(s): no file; el build regenera `dist/`.
  - Depends on: T-04.
  - Command: `npm run build`
  - Pass criterion: exit code 0, `✓ built in Xs`. Si el pipeline `tools/generate-llms.js` regenera `public/llms.txt` (side-effect observado en specs previas), **revertir con `git checkout -- public/llms.txt` ANTES del reporte final**.

**Checkpoint Phase 3 🤖 → 👤 Phase 4**: el ejecutor emite reporte intermedio con el diff de T-04, outputs de T-05/T-06/T-07, y `git status` limpio. Handoff a Danissa.

---

## Phase 4 👤 — Test manual E2E

**Propósito**: validar US1 (dropdown no-vacío, auto-fill, total correcto) + US2 (no-regresión) con la cuenta de prueba.

**Setup**: login como Cristóbal (`dentalspot.cl@gmail.com`). Paciente de prueba sugerido: `5ffc5695-...` (el orphan original que ya pasó por specs 001/003) o cualquier paciente con `patient_care_team` activo. Asegurar que el dentista tiene al menos 1 servicio activo en `therapist_services` con `price_clp > 0`.

- [ ] **T-08** 👤 [transversal] Hard refresh del browser para garantizar bundle nuevo.
  - File(s): no file (browser).
  - Depends on: T-05, T-06, T-07.
  - Acción: en la app corriendo en `localhost:3000` (o staging), presionar `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win/Linux) para forzar reload sin caché.
  - Pass criterion: página recargada. Sin errores en consola relacionados al bundle.

- [ ] **T-09** 👤 [transversal] Abrir DevTools → Console y filtrar por "Error".
  - File(s): no file (DevTools browser).
  - Depends on: T-08.
  - Pass criterion: DevTools abiertas, pestaña Console visible, filtro en "Error" activo. Baseline: cualquier error pre-existente queda visible para comparar.

- [ ] **T-10** 👤 🎯 [US1] Navegar a `/dashboard/therapist/odontograma/nueva?patient=5ffc5695-...` (o el PATIENT_ID elegido).
  - File(s): no file (browser).
  - Depends on: T-09.
  - Pass criterion: la página carga mostrando Step 1 (Configuración). **En DevTools Console NO aparece el error `42703 column "price" does not exist`** ni el mensaje `[odontogramEvalApi] fetchTherapistServices error`. **Pre-fix este paso fallaba con esos errores presentes.**

- [ ] **T-11** 👤 🎯 [US1] Avanzar al Step 3 y verificar el dropdown + auto-fill de precios.
  - File(s): no file (browser).
  - Depends on: T-10.
  - Acción:
    1. Seleccionar paciente, tipo "inicial" → "Iniciar Evaluación".
    2. En Step 2: marcar ≥1 diente con una condición (p.ej. caries).
    3. Click "Resultados" → Step 3.
    4. Click "Agregar Procedimiento" (o usar el sugerido automáticamente).
    5. Abrir el dropdown "Procedimiento" de la fila.
    6. Seleccionar una opción.
    7. Observar el campo "Precio (CLP)" de esa fila.
  - Pass criterion:
    - El dropdown muestra **≥1 opción** con formato `<service_name> ($<precio>)` — los nombres y precios son del catálogo real del dentista.
    - Tras seleccionar una opción, el campo "Precio (CLP)" se auto-completa con el valor numérico de `price_clp` (no queda en 0, NaN, ni vacío).
    - **Esta es la task que confirma el fix efectivo.** Pre-fix el dropdown estaba vacío y el auto-fill no ocurría.

- [ ] **T-12** 👤 [US1] Verificar total del presupuesto con ≥2 procedimientos.
  - File(s): no file (browser).
  - Depends on: T-11.
  - Acción: agregar un segundo procedimiento distinto, seleccionar otra opción del dropdown. Observar el "Total" (esquina superior derecha de la Card).
  - Pass criterion: el Total muestra la suma correcta de los 2 precios en formato CLP (ej. `$45.000`). NO es 0, NaN, ni `$undefined`.

- [ ] **T-13** 👤 [US2] Regresión check en el listado de odontogramas.
  - File(s): no file (browser).
  - Depends on: T-12.
  - Acción: navegar a `/dashboard/therapist/odontograma` (listado).
  - Pass criterion: el listado carga sin errores en Console ni UI rota. Las evaluaciones previas se muestran con sus datos. Si Cristóbal ya tenía evaluaciones, estas siguen visibles. Sin regresión observable. Opcionalmente, abrir DevTools en otras páginas consumidoras de `therapist_services` (Dashboard Therapist, perfil público, Calendar) para validar SC-005.

---

## Phase 5 👤 — Commit + push

**Propósito**: documentar el fix y dejarlo en `origin/main`.

- [ ] **T-14** 👤 [transversal] Commit + push del fix.
  - File(s): `src/features/odontogram/api/odontogramEvalApi.js` staged.
  - Depends on: T-13.
  - Template de mensaje sugerido (cumple FR-006 de spec 005 y referencia el patrón de spec 004):
    ```
    fix(odontogram): alias SQL price:price_clp en fetchTherapistServices (spec 005)

    El query de src/features/odontogram/api/odontogramEvalApi.js:172 pedía
    la columna 'price' que no existe en therapist_services. La columna real
    es price_clp (confirmado en information_schema.columns el 2026-04-20).
    PostgreSQL devolvía error 42703 en cada mount de OdontogramEvaluationPage,
    el dropdown de procedimientos quedaba vacío y los totales en 0.

    Fix: alias SQL `price:price_clp` en el .select() — el frontend consumidor
    (OdontogramEvaluationPage.jsx líneas 247, 276, 553) sigue leyendo s.price
    sin cambios. Enfoque A (mínimo scope, 1 línea) elegido sobre enfoque B
    (cambio completo, 4 líneas en 2 archivos). Justificación en plan.md.

    Mini-audit del 2026-04-20 confirmó que los 14 consumidores de la tabla
    therapist_services son todos immunes a este drift (9 confirmados + 6
    revalidados en Phase 1 del plan). Scope final: 1 archivo, 1 línea.

    Cumple Constitution VI (Schema Drift Zero) — restaura alineamiento
    entre código y schema. Sin cambios a policies, migraciones, ni otros
    módulos. No afecta el ciclo de compliance de specs 001/003/004.
    ```
  - Pasos:
    ```bash
    git add src/features/odontogram/api/odontogramEvalApi.js
    git commit -m "..."   # mensaje de arriba vía heredoc
    git push origin 005-fix-therapist-services-price-drift   # o main directo
    ```
  - Pass criterion: commit creado, push exitoso. `git log --oneline -1` muestra el commit.

---

## Dependencies & Execution Order

### Task graph

```
T-01 ─┬→ T-02 [P] ┐
      └→ T-03 [P] ┴→ T-04 🚨 🤖 ──┬→ T-05 [P] ─┐
                                    ├→ T-06 [P] ─┼→ [👤 handoff] → T-08 → T-09 → T-10 🎯 → T-11 🎯 → T-12 → T-13 → T-14
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
| **T-10 🎯** | 👤 | T-09 | — |
| **T-11 🎯** | 👤 | T-10 | — |
| T-12 | 👤 | T-11 | — |
| T-13 | 👤 | T-12 | — |
| T-14 | 👤 | T-13 | — |

### Puntos de no retorno 🚨 y tasks críticas 🎯

- **T-04 🚨** — única task que modifica código. Rollback: `git checkout -- src/features/odontogram/api/odontogramEvalApi.js` (<10s).
- **T-10 🎯** — confirma que el error 42703 desapareció (test negativo — ausencia de error esperada).
- **T-11 🎯** — confirma que el dropdown se hidrata y el auto-fill funciona (test positivo — funcionalidad restaurada).

### Parallel opportunities

- **Phase 1**: T-02 ∥ T-03 (git status + grep independientes).
- **Phase 3**: T-05 ∥ T-06 ∥ T-07 (grep + ESLint + build independientes).
- **Phase 4**: secuencial (cada task depende del estado del flujo E2E).
- **Phase 5**: secuencial (commit antes de push).

### Rollback global (si Phase 2 o 3 introducen error)

```bash
git checkout -- src/features/odontogram/api/odontogramEvalApi.js
```

Sin migraciones, sin edge functions. `dist/` se regenera al siguiente build. `public/llms.txt` (si el build lo tocó) ya fue revertido en T-07. Tiempo total: <30 segundos.

---

## Notes

- **Total de tasks: 14** (7 🤖 + 7 👤).
- **1 punto de no retorno 🚨** (T-04) + **2 tasks críticas 🎯** (T-10, T-11).
- **Total archivos tocados: 1** (`src/features/odontogram/api/odontogramEvalApi.js`, 1 edit de 1 token añadido).
- **Commit/push son tareas 👤 explícitas** (T-14); el ejecutor no los ejecuta.
- **Scope más pequeño del ciclo** junto con spec 004 — bug aislado, cambio mínimo, 0 riesgo de regresión sistémica.
