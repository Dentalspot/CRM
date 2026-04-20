# Feature Specification: Fix Patient Dashboard Schema Drifts

**Feature Branch**: `007-fix-patient-dashboard-schema-drifts`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "fix-patient-dashboard-schema-drifts — 3 drifts confirmados durante test manual de spec 006"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paciente entra a su dashboard y ve sus actividades sin errores en consola (Priority: P1)

Al iniciar sesión como paciente y navegar al dashboard principal, el usuario espera ver sus actividades pendientes del plan terapéutico (ejercicios, tareas asignadas por el terapeuta). Hoy el dashboard carga visualmente pero la consola del browser arroja el error `column session_activities.patient_id does not exist`, las listas de actividades quedan vacías aunque haya datos, y el paciente percibe que "no tiene actividades asignadas" cuando sí las tiene. Otras páginas del mismo dominio (lista de actividades dedicada, mi progreso) sí funcionan porque usan un camino distinto para alcanzar los mismos datos.

**Why this priority**: Es la ruta principal que usa el paciente cuando se loguea — si está rota, la percepción del producto es "no funciona", incluso si el resto de la app está OK. Además, el síntoma es el mismo patrón que provocó el spec 005 (schema drift frontend vs live), lo cual confirma que el problema tiene raíz estructural conocida y reparable.

**Independent Test**: Un evaluador puede (a) loguearse como paciente con al menos una actividad pendiente, (b) ir al dashboard y (c) confirmar que la lista de actividades muestra el mismo conteo que la página "Mis Actividades" dedicada y que la consola del browser no emite errores 400/406 de `session_activities`.

**Acceptance Scenarios**:

1. **Given** un paciente con N actividades pendientes en el plan terapéutico, **When** el paciente abre su dashboard, **Then** el widget de actividades muestra N actividades y la consola no registra error alguno de la tabla `session_activities`.
2. **Given** un paciente sin actividades pendientes, **When** abre su dashboard, **Then** el widget muestra el estado vacío correcto (mensaje informativo) y no hay errores en consola.
3. **Given** la página "Mis Actividades" dedicada, **When** se compara con el dashboard para el mismo paciente, **Then** ambos muestran el mismo conteo de actividades pendientes (consistencia cross-vista).

---

### User Story 2 - Terapeuta ve sus ingresos del mes en su dashboard (Priority: P2)

Al iniciar sesión como terapeuta y abrir su dashboard, el widget de ingresos del mes debe mostrar la suma de las citas completadas. Hoy la request falla con `400 Bad Request` porque el campo de precio pedido no existe o fue renombrado (patrón ya visto en spec 005 con `therapist_services.price → price_clp`). El widget queda en estado error o vacío, y el terapeuta no ve métricas de negocio.

**Why this priority**: Afecta solo al rol terapeuta en una métrica secundaria del dashboard (ingresos estimados, no bloqueante de operaciones clínicas). Es P2, no P1, porque el terapeuta puede seguir trabajando sin esa métrica, pero igual la espera como valor añadido de la plataforma.

**Independent Test**: Evaluador se loguea como terapeuta con al menos una cita `completed` en el mes, abre su dashboard y verifica que el widget de ingresos muestra un monto consistente con el sumatorio manual de las citas del mes, sin errores 400 en consola.

**Acceptance Scenarios**:

1. **Given** un terapeuta con 3 citas completadas en el mes a valores conocidos, **When** abre su dashboard, **Then** el widget de ingresos muestra la suma correcta y no hay errores en consola.
2. **Given** un terapeuta sin citas completadas este mes, **When** abre su dashboard, **Then** el widget muestra `$0` o estado vacío correspondiente sin errores.

---

### User Story 3 - Paciente ve sus reportes clínicos en el dashboard (Priority: P3)

El dashboard del paciente incluye un widget que muestra los últimos reportes clínicos generados (evaluaciones, informes). Hoy la request devuelve `400 Bad Request` porque el query selecciona columnas específicas (`file_url`, `report_type`) que no existen con ese nombre en la tabla. Otras vistas (página de reportes completa, detalle del paciente) funcionan porque usan `select('*')`. El widget del dashboard queda en error.

**Why this priority**: La funcionalidad existe en otra vista (página de reportes dedicada), por lo que el paciente puede acceder a sus reportes por otro camino. Es cosmético en el dashboard. P3.

**Independent Test**: Paciente con al menos un reporte generado abre el dashboard y verifica que el widget de reportes lista al menos uno con título y fecha visibles, sin errores 400 en consola.

**Acceptance Scenarios**:

1. **Given** un paciente con 2 reportes clínicos generados, **When** abre su dashboard, **Then** el widget de reportes muestra ambos con al menos título y fecha, sin errores en consola.
2. **Given** un paciente sin reportes, **When** abre el dashboard, **Then** el widget muestra estado vacío correcto.

---

### Edge Cases

- **Paciente sin plan terapéutico activo**: el fix del Drift 1 usa join indirecto via `plan_sessions`. Si el paciente no tiene sesiones creadas, la query debe devolver lista vacía sin error (no 400, no crash de UI).
- **Phase 1 revela que el scope es más grande** (más tablas con drift, más callsites del mismo patrón): el spec queda in-scope solo para las 3 tablas listadas. Si Phase 1 detecta N>3 tablas con drift en el flujo dashboard, se documenta en plan.md y se decide humano si se expande o se crea spec paralelo (respeta Principio IV de Micro-Bloques).
- **Drift 2 o 3 resulta "nunca existió esa columna"** (no fue renombrada, fue error original del código): la solución no es alias PostgREST sino reemplazo por columna correcta O eliminación del campo del select. Phase 1 determina cuál aplica.
- **Drift 2: ganancia `completed` está en `invoices` y no en `appointments`**: la query está mal conceptualmente, no solo drifteada. Si Phase 1 lo confirma, el fix puede requerir cambiar la fuente de datos (de `appointments` a `invoices`), no solo renombrar columna. Queda fuera de alcance si implica nuevo query con otras joins — se marca como candidato a spec futuro.
- **Regresión en páginas que sí funcionan** (`PatientActivitiesPage`, `MyProgressPage`, `ClinicalQualityPanel`, las 5 páginas que usan `select('*')` en clinical_reports): el fix no debe introducir regresiones. Phase 3 valida explícitamente que estas siguen funcionando.
- **Paciente con actividades en planes múltiples**: el join indirecto via `plan_sessions` debe traer actividades de todos los planes del paciente, no solo uno. Validar en Phase 3.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ejecutar un audit defensivo previo al fix que consulte el live schema (information_schema) para cada una de las 3 tablas afectadas (`session_activities`, `appointments`, `clinical_reports`) y documente las columnas reales con su tipo y constraint de nullability.
- **FR-002**: El audit defensivo DEBE documentarse en `specs/007-fix-patient-dashboard-schema-drifts/plan.md` antes de tocar código de aplicación (patrón canónico `docs/PATTERNS.md §5`).
- **FR-003**: El sistema DEBE detener la ejecución y reportar a Danissa antes de aplicar cualquier fix si se cumple CUALQUIERA de estas condiciones (respeta Principio IV Micro-Bloques):
  - (a) Phase 1 revela drift en **tablas adicionales** del flujo patient dashboard no incluidas en este spec (más de las 3 tablas listadas).
  - (b) El fix, una vez mapeado, requeriría tocar **más de 5 archivos distintos** de `src/`. El bound se mide contando archivos únicos (no callsites), no incluye tests ni docs, e incluye cualquier archivo que el fix obligue a editar incluso si es "un cambio menor de consumo de alias".
  - (c) Phase 1 revela que el fix implica un **re-modelado semántico** (ej. Drift 2 resulta ser "fee vive en `invoices`, no en `appointments`"), no solo un rename o alias.
  Si se dispara el stop, Danissa decide si el spec 007 se re-plantea, se divide (spec 007 + 007.1) o se congela.
- **FR-004 (Drift 1)**: Las 2 queries a `session_activities` en `src/features/patient-dashboard/PatientDashboardPageV2.jsx` (líneas 162–165 y 240–244) DEBEN filtrar por paciente a través del join indirecto `plan_sessions!inner(patient_id)` (patrón canónico usado en `src/pages/PatientActivitiesPage.jsx:50-57`, `src/features/patient/pages/MyProgressPage.jsx:74-78`, `src/features/clinic-dashboard/components/ClinicalQualityPanel.jsx:122`), en lugar de `.eq('patient_id', pId)` directo.
- **FR-005 (Drift 2)**: La query a `appointments` en `src/pages/TherapistDashboardPage.jsx:143-146` DEBE leer el campo de precio usando el nombre real según information_schema:
  - Si la columna existe con otro nombre (patrón spec 005 `price → price_clp`) → usar alias PostgREST `select('... fee:nombre_real ...')` para preservar la interfaz del componente consumidor.
  - Si la columna nunca existió con ningún nombre en `appointments` → el spec documenta el gap y aplica el fix mínimo sugerido por Phase 1 (puede ser: eliminar el cálculo del widget, reemplazar por `0`, o marcar como requiere spec adicional).
- **FR-006 (Drift 3)**: La query a `clinical_reports` en `src/features/patient-dashboard/PatientDashboardPageV2.jsx:182-185` DEBE pedir solo columnas existentes:
  - Si `file_url` y/o `report_type` existen con otro nombre → usar alias PostgREST para preservar la interfaz.
  - Si no existen con ningún nombre → reemplazar con columnas reales equivalentes identificadas en Phase 1 (si no hay equivalente, eliminar el campo del render o mostrar placeholder).
- **FR-007**: Post-fix, el dashboard del paciente NO DEBE emitir errores HTTP 400 ni 406 relacionados con `session_activities`, `clinical_reports` ni las tablas afectadas en la consola del browser durante el flujo de login → dashboard.
- **FR-008**: Post-fix, el dashboard del terapeuta NO DEBE emitir error 400 relacionado con el campo de precio de `appointments`.
- **FR-009**: Post-fix, las páginas que hoy funcionan correctamente (`PatientActivitiesPage`, `MyProgressPage`, `ClinicalQualityPanel`, `ReportsPage`, y los 4 otros callsites que leen `clinical_reports` con `select('*')`) DEBEN seguir funcionando igual — sin regresiones medibles por test manual.
- **FR-010**: El spec NO DEBE modificar el schema de la base de datos (no se crean migraciones nuevas). Si Phase 1 revela que el schema está mal y debería renombrarse o agregarse columnas, eso genera un spec separado (respeta Principio IV).
- **FR-011**: El spec NO DEBE tocar policies de RLS ni el audit logger (`useClinicalAccessLogger`). El scope es exclusivo de schema drift en queries del cliente.
- **FR-012**: El spec NO DEBE modificar el render de los widgets más allá de lo estrictamente necesario para consumir los nuevos nombres de campo (preserva UX vigente).

### Key Entities *(include if feature involves data)*

- **session_activities**: tabla de actividades asignadas a una sesión del plan. Actor del drift: el código pide columna `patient_id` que no existe; la relación con paciente vive en `plan_sessions` (tabla padre).
- **appointments**: tabla de citas. Actor del drift: campo de precio (`fee`) pedido por el código no existe con ese nombre o no existe.
- **clinical_reports**: tabla de reportes clínicos. Actor del drift: columnas `file_url` y/o `report_type` pedidas no existen con ese nombre.
- **plan_sessions**: tabla puente entre paciente y actividades. Sus columnas reales (en particular `patient_id`) son el camino correcto para el filtro del Drift 1.
- **information_schema.columns**: vista de postgres consultada en Phase 1 para tener ground truth de qué columnas existen realmente en las 3 tablas afectadas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los errores HTTP 400/406 relacionados con `session_activities.patient_id`, con el campo de precio de `appointments`, y con `clinical_reports.file_url/report_type` desaparecen de la consola durante el flujo patient-dashboard y therapist-dashboard (verificado con DevTools abierto durante test manual en los 2 roles).
- **SC-002**: El conteo de actividades pendientes mostrado en el dashboard del paciente coincide con el conteo mostrado en la página "Mis Actividades" dedicada (diferencia absoluta = 0) en al menos 2 cuentas de paciente de prueba con volumen distinto (ej. 0, 5 actividades).
- **SC-003**: El monto de ingresos del mes mostrado en el dashboard del terapeuta coincide (diferencia absoluta = 0) con la suma manual de las citas `completed` del mes para al menos 1 cuenta de terapeuta de prueba con volumen conocido.
- **SC-004**: El widget de reportes clínicos del dashboard del paciente muestra al menos 1 reporte con título + fecha visibles para al menos 1 cuenta de paciente con reportes generados.
- **SC-005**: Las rutas de regresión obligatorias (listadas abajo en **Regression Test Inventory**) siguen cargando sin errores en consola después del fix — verificado por test manual explícito rut por ruta. Diferencia aceptable: 0 errores nuevos atribuibles al spec 007.
- **SC-006**: Phase 1 (audit defensivo) queda documentado en `plan.md` con el output literal de la query a `information_schema.columns` para las 3 tablas, antes de tocar cualquier archivo de `src/`.
- **SC-007**: El spec cierra sin modificar migraciones en `supabase/migrations/` ni policies en `supabase/policies.sql` (validable por `git diff` sobre esos paths).
- **SC-008**: Durante los 14 días posteriores al deploy, el número de reportes nuevos de error "column does not exist" en el flujo patient-dashboard es 0 (si hay monitoreo) o no hay issues reportadas por usuarios (si no hay monitoreo).

## Assumptions

- El proyecto Supabase activo es el del CLAUDE.md (ref `tomremkbuxvedliyywbo`). Las 3 tablas afectadas viven en el schema `public` (default).
- Los 5 callsites de `clinical_reports` con `select('*')` citados por el user (`PatientDashboardPage`, `usePatientAdmin`, `useReportGeneration`, `ReportsPage`, `usePatientData`) están en el estado "funcionan" al 2026-04-20. Phase 1 verifica rápidamente que siguen funcionando antes del fix.
- La hipótesis del user sobre drift de nombres (`fee → price_clp|amount|…`, `file_url/report_type → otro nombre`) puede o no confirmarse; Phase 1 es quien decide el camino final (FR-005, FR-006).
- El test manual post-fix lo ejecuta Danissa en las 2 cuentas de rol (paciente y terapeuta) con data real o de prueba suficiente para detectar los SC.
- No se introducen dependencias nuevas (`zod`, `react-query`, etc. siguen ausentes — ese es otro spec futuro).
- La ejecución sigue el workflow asesor/ejecutor del CLAUDE.md: Claude Code escribe spec/plan/tasks/implement; Danissa hace commits y deploy.
- El spec 005 commit `580408d` es la referencia canónica del patrón alias PostgREST que aplicamos aquí si hay renames.
- `docs/PATTERNS.md §1 (alias SQL)`, `§4 (audit defensivo Phase 1)`, `§5 (preventive mini-audit)` son los patrones referenciados por el user y se citan en plan.md cuando corresponda.
- Si Phase 1 revela que el scope es mayor (>3 tablas driftadas en el flujo o >5 archivos a tocar), el spec se detiene antes de Phase 2 y se reporta; esto respeta Principio IV (un PR = un bundle coherente de bug del mismo síntoma) y está formalizado en FR-003.

## Regression Test Inventory

Rutas que hoy funcionan y DEBEN seguir funcionando post-fix. Se testean manualmente una por una antes de considerar Phase 3 cerrada. El contador de regresiones de esta lista alimenta el criterio de abort del **Rollback Plan** (§ siguiente).

### Consumidores de `session_activities` (usan join `plan_sessions!inner` — patrón canónico que replicamos en Drift 1)

| Ruta | Línea | Rol afectado | Qué debe seguir viendo |
|---|---|---|---|
| `src/pages/PatientActivitiesPage.jsx` | 50 | patient | Lista completa de actividades del plan con estados |
| `src/features/patient/pages/MyProgressPage.jsx` | 74 | patient | Progreso agregado por sesión |
| `src/features/clinic-dashboard/components/ClinicalQualityPanel.jsx` | 122 | clinic | Métricas de calidad clínica |
| `src/features/clinical-planning/api/clinicalPlanningApi.js` | 322 | therapist/clinic | CRUD de planes y sesiones |
| `src/features/clinical-planning/components/PlanningTab.jsx` | 167 | therapist | Tab de planning del paciente |
| `src/features/clinical-planning/components/SessionManagerModal.jsx` | 300, 323 | therapist | Modal de gestión de sesión (2 queries) |
| `src/features/ai/api/aiToolsApi.js` | 176 | therapist | Herramientas IA que consumen actividades |

### Consumidores de `clinical_reports` (usan `select('*')` — no afectados por Drift 3 pero SE VERIFICA que siguen OK)

| Ruta | Línea | Rol afectado | Qué debe seguir viendo |
|---|---|---|---|
| `src/pages/PatientDashboardPage.jsx` | 182 | patient (legacy) | Widget de reportes en dashboard legacy |
| `src/features/reports/pages/ReportsPage.jsx` | 33 | patient/therapist | Página completa de reportes |
| `src/features/reports/pages/ReportDetailPage.jsx` | 21 | patient/therapist | Detalle individual de un reporte |
| `src/features/reports/components/TemplateFormModal.jsx` | 151, 159 | therapist | Modal de generación desde template (2 queries) |
| `src/hooks/usePatientAdmin.js` | 81 | clinic/admin | Hook de administración de paciente |
| `src/hooks/useReportGeneration.js` | 199 | therapist | Hook de generación de reportes |
| `src/features/patient-file/hooks/usePatientData.js` | 126 | therapist/clinic | Hook de datos del paciente (ficha) |

### Consumidores del campo de precio en `appointments` (Drift 2)

El user no reportó otros callsites a `appointments.fee` más allá de `TherapistDashboardPage.jsx:143`. Phase 1 debe confirmar con `grep -rn "appointments.*fee\|fee.*appointments" src/` si hay otros. Si aparecen, se agregan a esta lista antes de proceder.

**Total inventariado al 2026-04-20**: 14 rutas (7 de session_activities + 7 de clinical_reports) + N a confirmar de appointments. Este es el set mínimo de pruebas de regresión.

## Rollback Plan

Criterios de abort y protocolo de rollback si el fix introduce regresiones.

### Abort triggers post-Phase 2

Se dispara rollback si se observa CUALQUIERA de:

1. **Regresiones en Regression Test Inventory**: durante test manual post-fix, **> 2 rutas** de las listadas arriba presentan errores nuevos en consola que no estaban antes del fix. El conteo se mide sobre el total de 14+ rutas; tolerancia máxima: 2 rutas con error menor que no bloquee el flujo del rol. Cualquier ruta con error que **rompa funcionalidad visible al usuario** cuenta doble (equivale a 2 regresiones, dispara rollback sola).
2. **Regresión en user-story fixeada**: el dashboard del paciente o el dashboard del terapeuta presenta un error nuevo distinto de los 3 drifts originales (ej. nuevos 400/406, crash de UI, blanco total).
3. **Build o lint roto**: `npm run build` o `npm run lint` falla en la branch post-fix y no se resuelve en < 30 min.
4. **Phase 1 incorrecto**: durante test manual se descubre que el audit defensivo del Phase 1 tenía un error (ej. se asumió columna real que no lo era) y el fix quedó incorrecto en ≥1 drift.

### Protocolo de rollback

1. **Stop** — no más cambios en la branch.
2. **`git revert <commit-del-fix>`** del PR completo (si fue un solo commit) o revert del merge commit (si fue merge a main). **No** `reset --hard` en main — usar revert para preservar historia.
3. **Notificar** a Danissa con:
   - Listado de rutas con regresión (de la inventory).
   - Output de consola exacto de la regresión.
   - Diff entre lo que Phase 1 asumió y lo real.
4. **Abrir spec 007.1** con scope reducido:
   - Si la regresión se concentra en Drift 1 → spec 007.1 solo para session_activities, deferir Drift 2/3.
   - Si la regresión es del patrón `!inner` en el join → reconsiderar método (ej. RPC) en 007.1.
   - Si es drift de re-modelado (fee en invoices) → spec 008 separado para ese caso.
5. **Ejecutar** spec 007.1 con el mismo ciclo `/speckit-*` desde cero.

### Non-rollback triggers (cosas que NO disparan abort)

- **0–2 regresiones menores** (mensajes de warning en consola, no errores, o errores en rutas que no están en el inventory) → documentar como follow-up, no abortar.
- **Regresión en ruta fuera del inventory** pero no crítica → documentar, decidir con Danissa si amerita rollback o follow-up.
- **Phase 1 tardó más de lo estimado** → no es causa de abort, solo documentar y ajustar expectativas del próximo spec.
