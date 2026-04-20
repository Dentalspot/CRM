# Tasks: Fix Patient Dashboard Schema Drifts

**Branch**: `007-fix-patient-dashboard-schema-drifts` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-04-20

Tasks executables del ciclo, agrupadas por Phase del plan. **Stop Points (SP-*) son gates, no tasks** — requieren 🟢 GO explícito de Danissa antes de continuar al siguiente grupo. Tiempo total estimado: **45–75 min** (budget del plan).

Leyenda de columnas:

- **ID**: identificador único.
- **Phase**: Phase del plan (P1 / P2 / P3 / FINAL).
- **Task**: acción concreta.
- **File:Line**: ubicación exacta cuando aplica; MCP/CLI para queries; `—` si no toca archivos.
- **Dependencies**: tasks que deben completarse antes (o `GATE SP-N` si requiere STOP POINT previo).
- **Reference**: patrón canónico, FR del spec, riesgo mitigado.
- **Est. min**: estimación de tiempo (acumulable contra budget 45–75).

---

## Phase 1 — Audit Defensivo

**Prerequisito**: plan aprobado por Danissa ✅.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P1-A` | P1 | Ejecutar Query A (`information_schema.columns` WHERE `table_name IN ('session_activities','appointments','clinical_reports')`); capturar output tabular completo | MCP: `execute_sql` · project `tomremkbuxvedliyywbo` | — | plan.md §Phase 1 P1.1 · `PATTERNS.md §5` · FR-001 | 2 |
| `TASK-P1-B` | P1 | Ejecutar Query B (FKs de `session_activities` y `plan_sessions`); confirmar `session_activities.plan_session_id → plan_sessions.id` y `plan_sessions.patient_id → patients.id` | MCP: `execute_sql` · project `tomremkbuxvedliyywbo` | `TASK-P1-A` | plan.md §Phase 1 P1.1 · Risk R-01 | 2 |
| `TASK-P1-C` | P1 | **CONDICIONAL** — Ejecutar Query C (buscar `fee/price/amount` en `invoices`, `service_bookings`) **solo si** Query A no encontró columna de precio en `appointments` | MCP: `execute_sql` | `TASK-P1-A` | plan.md §Phase 1 P1.1 · Risk R-03 · FR-003.c | 1 |
| `TASK-P1-GREP` | P1 | 3 greps dirigidos: (1) `from('appointments')` + fee/price/amount, (2) `plan_sessions!inner` existente en src/, (3) `session_activities.*patient_id` directo | `bash` desde `~/Documents/DENTALSPOT` | — | plan.md §Phase 1 P1.2 · `PATTERNS.md §5` · Risk R-05 | 2 |
| `TASK-P1-BASELINE` | P1 | Baseline test: recorrer las 14 rutas del Regression Test Inventory en `main` (pre-fix) con DevTools Console; documentar estado de cada ruta (OK / Warning / Error pre-existente) | `npm run dev` + browser manual | — | plan.md §Phase 1 P1.3 · Risk R-04 | 5 |
| `TASK-P1-DATAMODEL` | P1 | Escribir `specs/007-fix-patient-dashboard-schema-drifts/data-model.md` con: tabla de verdad por drift, output de Query B, pre-fix baseline, hallazgos laterales | `specs/007-fix-patient-dashboard-schema-drifts/data-model.md` (create) | `TASK-P1-A`, `TASK-P1-B`, `TASK-P1-C` (si aplica), `TASK-P1-GREP`, `TASK-P1-BASELINE` | plan.md §Phase 1 P1.4 · FR-002 | 3 |
| `TASK-P1-REPORT` | P1 | Generar Phase 1 Report para Danissa con checks T1–T5 del SP-1 y recomendación 🟢 GO / 🔴 STOP | conversación | `TASK-P1-DATAMODEL` | plan.md §Phase 1 P1.5 · FR-003 | 2 |

**Tiempo Phase 1**: 10 min (budget plan). Real puede ser 10–17 min si todas las condicionales disparan.

---

### 🚧 GATE SP-1 — STOP POINT

**Criterio**: Phase 1 Report entregado con checks T1–T5 evaluados. **Requiere 🟢 GO explícito de Danissa**.

- **T1** (tablas driftadas ≤ 3) — si falla: abort, spec hermano.
- **T2** (archivos a tocar ≤ 5) — si falla: reducir scope o dividir.
- **T3** (sin re-modelado semántico) — si falla: spec 008 separado (FR-003.c).
- **T4** (FKs del join presentes) — si falla: fallback a 2 queries o spec hermano (R-01).
- **T5** (baseline documentado) — si falla: completar antes de avanzar.

**Sin 🟢 GO, no se ejecuta ninguna task de Phase 2.**

---

## Phase 2 — Aplicar Fixes

**Prerequisito**: GATE SP-1 superado.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P2-D1-A` | P2 | **Drift 1 · sin condicional** — Reescribir primera query: `.select()` agrega embed `plan_sessions!inner(patient_id)`, `.eq('patient_id', pId)` → `.eq('plan_sessions.patient_id', pId)` | `src/features/patient-dashboard/PatientDashboardPageV2.jsx:162-165` | `GATE SP-1` · `TASK-P1-B` (confirma FKs) | plan.md §Phase 2 Drift 1 · FR-004 · patrón canónico = los 7 callsites del Regression Test Inventory bloque B | 3 |
| `TASK-P2-D1-B` | P2 | **Drift 1 · sin condicional** — Reescribir segunda query del mismo archivo con mismo patrón que `TASK-P2-D1-A` | `src/features/patient-dashboard/PatientDashboardPageV2.jsx:240-244` | `TASK-P2-D1-A` | plan.md §Phase 2 Drift 1 · FR-004 | 2 |
| `TASK-P2-D1-AUDIT` | P2 | **R-06 check (Constitution §III)** — `grep useClinicalAccessLogger src/features/patient-dashboard/PatientDashboardPageV2.jsx`. Si 0 matches → **acción = document + defer** a spec follow-up `fix-audit-logger-missing-on-patient-dashboard` (anotar en data-model.md §"Compliance findings" con path + línea + evidencia). **NO fix inline** (scope creep §IV). **NO block spec 007** (spec 007 sigue avanzando sin esperar el follow-up) | `src/features/patient-dashboard/PatientDashboardPageV2.jsx` (read-only) | `TASK-P2-D1-B` | plan.md §Constitution Check §III VERIFY · Risk R-06 · Constitution §IV (Micro-Bloques) | 2 |
| `TASK-P2-D2` | P2 | **Drift 2 · decision tree** — Aplicar Case A/B/C según Query A de Phase 1: **Case A** `.select('fee:<nombre_real>')` (alias PostgREST) · **Case B.1** eliminar cálculo del widget (dead query) · **Case B.2 / C** → STOP, FR-003.c disparado | `src/pages/TherapistDashboardPage.jsx:143-146` | `GATE SP-1` · `TASK-P1-A`, `TASK-P1-C` (si aplica) | plan.md §Phase 2 Drift 2 · `PATTERNS.md §1` (alias) · spec 005 commit `580408d` · FR-005 | 5 |
| `TASK-P2-D3` | P2 | **Drift 3 · decision tree** — Aplicar Case A/B/C/D según Query A: **Case A** 2 alias en mismo `.select()` (`file_url:<real>`, `report_type:<real>`) · **Case B** 1 alias + eliminar col que no existe · **Case C** fallback `.select('*')` · **Case D** alias + coerce del lado cliente si `data_type` cambió (R-02) | `src/features/patient-dashboard/PatientDashboardPageV2.jsx:182-185` | `GATE SP-1` · `TASK-P1-A` | plan.md §Phase 2 Drift 3 · `PATTERNS.md §1` (alias múltiple) · FR-006 · Risk R-02 | 5 |
| `TASK-P2-LINT` | P2 | `npm run lint` — debe pasar clean (baseline pre-spec es clean) | `npm run lint` (root) | `TASK-P2-D1-B`, `TASK-P2-D2`, `TASK-P2-D3` | plan.md §Phase 2 P2 post-fix | 2 |
| `TASK-P2-BUILD` | P2 | `npm run build` — debe compilar sin warnings nuevos | `npm run build` (root) | `TASK-P2-LINT` | plan.md §Phase 2 P2 post-fix | 2–5 |

**Tiempo Phase 2**: 15–25 min (budget plan).

**Nota embebida (GATE SP-2)**: durante `TASK-P2-D1-A` o `TASK-P2-D3` (al abrir `PatientDashboardPageV2.jsx`), si aparece una 4ta query driftada del mismo patrón → **STOP intra-phase (SP-2)**, consultar con Danissa antes de expandir scope. Se contabiliza como hallazgo R-05.

---

### 🚧 GATE SP-3 — STOP POINT

**Criterio**: `TASK-P2-LINT` y `TASK-P2-BUILD` pasan clean. Si lint falla o build emite warnings nuevos → resolver antes de Phase 3; no iniciar tests manuales con código roto localmente.

**Sin lint+build clean, no se ejecuta ninguna task de Phase 3.**

---

## Phase 3 — Regression Test Manual

**Prerequisito**: GATE SP-3 superado.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-A` | P3 | **Bloque A — User-story routes fixeadas** (2 rutas): P1 patient dashboard (login paciente + widget actividades + widget reportes; validar 0 errores en consola, N>0 actividades, reportes visibles); P2 therapist dashboard (login terapeuta + widget ingresos; validar monto consistente con citas `completed` del mes, 0 errores). **Por cada ruta con error reportar en formato forense (ver §Forensic Reporting Format abajo).** | browser manual · DevTools Console | `GATE SP-3` | plan.md §Phase 3 Bloque A · SC-001, SC-002, SC-003, SC-004 · Forensic format (R-04 compensation) | 5 |
| `TASK-P3-B` | P3 | **Bloque B — Regression `session_activities`** (7 rutas del inventory): B1 PatientActivitiesPage.jsx:54 · B2 MyProgressPage.jsx:78 · B3 ClinicalQualityPanel.jsx:125 · B4 clinicalPlanningApi.js:322 · B5 PlanningTab.jsx:167 · B6 SessionManagerModal.jsx:300+323 · B7 aiToolsApi.js:176. 0 errores nuevos vs lo que funcionaba antes. **Formato forense obligatorio para cada error (§Forensic Reporting Format).** Líneas actualizadas post data-model.md §H-1 | browser manual · DevTools Console | `GATE SP-3` | plan.md §Phase 3 Bloque B · SC-005 · Forensic format (R-04 compensation) | 10 |
| `TASK-P3-C` | P3 | **Bloque C — Regression `clinical_reports`** (7 rutas del inventory): C1 PatientDashboardPage.jsx:168+172 · C2 ReportsPage.jsx:33 · C3 ReportDetailPage.jsx:21 · C4 TemplateFormModal.jsx:151+159 · C5 usePatientAdmin.js:81 · C6 useReportGeneration.js:199 · C7 usePatientData.js:126. 0 errores nuevos. **Formato forense obligatorio (§Forensic Reporting Format).** Líneas actualizadas post data-model.md §H-1 | browser manual · DevTools Console | `GATE SP-3` | plan.md §Phase 3 Bloque C · SC-005 · Forensic format (R-04 compensation) | 10 |
| `TASK-P3-REPORT` | P3 | Generar Phase 3 Report: contabilizar regresiones vs criterio Rollback Plan (0–2 menores → follow-up · >2 o 1 crítica → `git revert` + spec 007.1); decidir close / follow-up / rollback. **Usar output forense de P3-A/B/C para separar regresiones nuevas de errores pre-existentes (R-04 compensation).** | conversación | `TASK-P3-A`, `TASK-P3-B`, `TASK-P3-C` | plan.md §Phase 3 P3 reporte · spec §Rollback Plan | 3 |

**Tiempo Phase 3**: 20–30 min (budget plan).

### Forensic Reporting Format (R-04 compensation — baseline no ejecutado pre-fix)

Baseline T5 del SP-1 quedó DEFERRED (decisión Q2 del SP-1 review). Para compensar esa falta de comparación A/B, cada ruta con error en P3-A/B/C **debe** reportarse con las 3 columnas:

| Campo | Qué capturar | Cómo obtenerlo |
|---|---|---|
| **(a) HTTP status code** | Status numérico exacto de la request failed (ej. `400`, `401`, `404`, `500`) | DevTools → Network tab → click la request fallida → header response |
| **(b) Console error literal** | Mensaje exacto emitido por el browser console, sin parafrasear (ej. `column clinical_reports.file_url does not exist`) | DevTools → Console → copy-paste del error tal cual |
| **(c) Evaluación pre-existente vs nuevo** | ¿El error fue introducido por spec 007 o ya existía? Método: `git log -p -S "<snippet de la query>" src/ruta/del/archivo.jsx` para ubicar cuándo se introdujo el patrón | Comparar fecha de introducción vs fecha del commit del spec 007 |

**Ejemplo de entry en Phase 3 Report**:

```markdown
### Regresión en B4 (clinicalPlanningApi.js:322)

- (a) HTTP: 400 Bad Request
- (b) Console: `column plan_sessions.legacy_patient_id does not exist`
- (c) git blame: patrón introducido en commit abc1234 (2025-09-15, 7 meses antes de spec 007) → **pre-existente, NO regresión nueva**
- Acción: documentar como follow-up candidato, NO cuenta para Rollback triggers.
```

**Criterio de cuenta**:
- Errores con `(c) = pre-existente` → **NO** cuentan para Rollback triggers. Se reportan como follow-ups.
- Errores con `(c) = introducido por spec 007` → **SÍ** cuentan. Al llegar a >2 o 1 crítica → disparar Rollback.

---

### 🚧 GATE SP-4 — STOP POINT

**Criterio**: Phase 3 Report entregado. Danissa decide:

- **Close**: 0 regresiones + Bloque A cumple SC-001…SC-004 → avanzar a `TASK-FINAL`.
- **Follow-up**: 0–2 regresiones menores (no rompen flujo del rol) → `TASK-FINAL` + abrir issue para follow-up.
- **Rollback**: >2 regresiones o 1 crítica → ejecutar protocolo del spec §Rollback Plan (`git revert <commit>` + abrir spec 007.1 con scope reducido); **NO ejecutar `TASK-FINAL`**.

---

## Final — Documentación post-spec

**Prerequisito**: GATE SP-4 decisión = Close o Follow-up.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-FINAL` | FINAL | Actualizar `architecture.md §"Known drift non-urgent"`: agregar subsección `#### Drifts resueltos post-audit (spec 007)` inmediatamente después de la tabla existente (antes de "Técnica aplicada"), con tabla complementaria de los 3 drifts resueltos (tabla · campo · acción aplicada · commit hash del PR mergeado · fecha). **No** modifica la tabla histórica existente (preserva registro del audit original). | `.specify/memory/architecture.md:~196` (insert after row `patients.patient_type`) | `GATE SP-4` (close/follow-up) | spec §FR-008 análogo · `PATTERNS.md §5` cierre de ciclo · Constitution §VI | 5 |

**Plantilla sugerida para la subsección** (queda a criterio del ejecutor el texto final):

```markdown
#### Drifts resueltos post-audit (spec 007 · 2026-MM-DD)

Fix del patient dashboard post-spec 006 testing manual. Status cerrado con spec 007 commit `<hash>`.

| Tabla · campo pedido | Acción aplicada | Archivo afectado | Commit |
|---|---|---|---|
| `session_activities.patient_id` (no existe) | Rewrite con join indirecto `plan_sessions!inner(patient_id)` | `PatientDashboardPageV2.jsx:162, 240` | `<hash>` |
| `appointments.fee` | [alias PostgREST / dead query / rewrite — llenar según Phase 1] | `TherapistDashboardPage.jsx:143` | `<hash>` |
| `clinical_reports.file_url / report_type` | [alias / fallback `*` / otro — llenar según Phase 1] | `PatientDashboardPageV2.jsx:182` | `<hash>` |

Tiempo total spec 007: [N min]. Regression routes testeadas: 14/14 OK (o M/14 con follow-ups listados).
```

---

## Resumen ejecutivo de tasks

| Phase | # tasks | Tiempo | Gate posterior |
|---|---|---|---|
| Phase 1 (audit defensivo) | 7 | 10 min | **SP-1** (Danissa 🟢 GO requerido) |
| Phase 2 (fixes) | 7 | 15–25 min | **SP-3** (lint+build) · embebido **SP-2** (R-05 intra-phase) |
| Phase 3 (regression) | 4 | 20–30 min | **SP-4** (close/follow-up/rollback) |
| Final | 1 | 5 min | — |
| **Total ejecutable** | **19 tasks** | **50–70 min** | 4 gates + 1 embebido |

Buffer de 5–10 min del plan cubre desvíos menores (queries condicionales, R-01/R-02 si se disparan). Si el total real excede 90 min → STOP implícito y consultar.

## Referencias cruzadas

- `plan.md` — decision trees, stop points, risk register.
- `spec.md` — FRs, Regression Test Inventory (14 rutas), Rollback Plan.
- `docs/PATTERNS.md §1` — alias SQL PostgREST (Drifts 2 y 3 Path A).
- `docs/PATTERNS.md §4` — audit defensivo como Phase 1.
- `docs/PATTERNS.md §5` — queries `information_schema` + grep dirigido.
- `.specify/memory/constitution.md §IV` — Micro-Bloques (abort triggers FR-003).
- `.specify/memory/constitution.md §VI` — Schema Drift Zero (objetivo del spec).
- Spec 005 commit `580408d` — caso canónico alias.
