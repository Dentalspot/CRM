# Feature Specification: Fix Audit Logger Missing on Patient Dashboard

**Feature Branch**: `008-fix-audit-logger-missing-on-patient-dashboard`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "fix-audit-logger-missing-on-patient-dashboard — F-1 de spec 007 (PatientDashboardPageV2.jsx lee PHI sin useClinicalAccessLogger)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compliance Constitution §III restaurada cuando el paciente ve su dashboard (Priority: P1)

Un paciente ingresa a su dashboard y el sistema carga en su pantalla información clínica protegida (actividades del plan, reportes clínicos). Por Principio III de la constitución de DentalSpot y por Ley 20.584 (art. 13: derecho del paciente a saber qué profesionales han visto su ficha), **toda lectura de PHI debe quedar asentada** en la bitácora de auditoría clínica. Hoy el dashboard del paciente es un punto ciego: 3+ tablas con PHI se leen en cada load sin dejar registro. Un auditor revisando la actividad de la cuenta no vería esos accesos.

**Why this priority**: Es compliance NON-NEGOTIABLE (Principio III). El gap convierte a DentalSpot en no-auditable para el flujo más frecuente del producto (auto-acceso del paciente). Cualquier inspección formal bajo Ley 20.584 o auditoría interna detecta la omisión en el primer query que cruce `clinical_audit_log` con `auth.users`.

**Independent Test**: un evaluador (a) se loguea como paciente de prueba, (b) abre el dashboard, (c) ejecuta `SELECT * FROM clinical_audit_log WHERE actor_id = <auth_user_id> ORDER BY created_at DESC LIMIT 5` y confirma que hay al menos 1 entrada con timestamp del último minuto y `action` coherente con "view_dashboard" (o el enum que use el hook canónico).

**Acceptance Scenarios**:

1. **Given** un paciente con data clínica vigente (al menos 1 sesión + 1 reporte), **When** abre su dashboard, **Then** aparece al menos 1 entrada nueva en `clinical_audit_log` asociada a su `actor_id` dentro de los primeros 5 segundos post-load.
2. **Given** un paciente sin data clínica (0 sesiones, 0 reportes — empty state), **When** abre el dashboard, **Then** aparece entrada de auditoría igualmente (el acceso al dashboard con intención de leer PHI sí se loguea; la decisión del hook es consistente incluso con result-set vacío).
3. **Given** la cuenta de un paciente nunca logueada antes, **When** abre su dashboard por primera vez, **Then** la entrada de auditoría se genera sin depender de entradas previas.

---

### User Story 2 - Dedup anti-spam para no inflar la bitácora (Priority: P2)

El mismo paciente vuelve a refrescar su dashboard varias veces en una hora (comportamiento normal: checkear nueva actividad, verificar reportes). Sin deduplicación se generarían N entradas por cada refresh, inflando `clinical_audit_log` y afectando la trazabilidad útil. El patrón canónico establecido en spec 004 + `docs/PATTERNS.md §3` requiere deduplicación por ventana horaria con `resource_id` en el `bucketKey`.

**Why this priority**: Sin dedup, el P1 sigue cumpliéndose pero el log queda ruidoso. Auditores prefieren 1 entrada/paciente/hora que 50. La lección de spec 004 (`clinical_audit_log` indexada y con un row por read no es viable a escala) obliga a respetar el patrón dedup desde el primer commit.

**Independent Test**: un evaluador hace 5 cargas seguidas del dashboard del mismo paciente dentro de 15 minutos, y después consulta `clinical_audit_log` filtrando por `actor_id` + ventana horaria. Resultado esperado: **1 entrada** por cada recurso clínico distinto leído (no 5).

**Acceptance Scenarios**:

1. **Given** un paciente ya tiene 1 entrada de auditoría de hace 10 minutos para el recurso X, **When** refresca el dashboard, **Then** el sistema no genera una 2da entrada para ese mismo recurso dentro de la misma hora.
2. **Given** han pasado más de 60 minutos desde la última entrada del paciente para el recurso X, **When** el paciente refresca, **Then** sí se genera una nueva entrada (la ventana horaria reinicia).
3. **Given** el paciente accede a un recurso Y distinto dentro de la misma hora (ej. después de mirar actividades, carga reportes), **When** pasa eso, **Then** se genera **una** entrada para Y (no se deduplica con la entrada de X porque `resource_id` es distinto → `bucketKey` distinto).

---

### User Story 3 - Falla graceful si el logger no puede escribir (Priority: P3)

El dashboard del paciente no debe bloquearse ni mostrar error si el logger falla por cualquier razón (RLS temporal, red inestable, ventana de deploy, etc.). El paciente sigue viendo su información; la falta del audit entry queda loggeada solo en consola para debugging futuro.

**Why this priority**: La UX del paciente es crítica. Una pantalla vacía o un toast de error "no se pudo registrar auditoría" sería peor que el gap actual desde el punto de vista del paciente. P3 porque es un path de error menor.

**Independent Test**: simular fallo del logger (mockear error) y verificar que el dashboard carga completo y visible, y que el error solo aparece en el console log.

**Acceptance Scenarios**:

1. **Given** un ambiente donde el hook devuelve error de red simulado, **When** el paciente abre el dashboard, **Then** los 4 widgets (actividades, reportes, progreso, próximas citas) siguen cargando con sus datos reales y no hay toast rojo visible.

---

### Edge Cases

- **Paciente recién creado sin `patient.id` resoluble todavía** (race entre creación de auth user y fila en `patients`): el hook debe no-opear sin romper el dashboard. Si no hay `patient_id` válido → no se intenta insert, no se loguea error dramático.
- **El canonical callsite usa el hook con una API distinta de lo esperado**: Phase 1 audit defensivo debe detectar si el hook fue refactoreado. Si sí → replanear Phase 2 respecto a la firma real del hook, no la asumida.
- **Spec 004 dedup rompe con nuestra composición de `bucketKey`**: si nuestro bucketKey no incluye `resource_id`, saltamos la protección de spec 004 y reintroducimos el bug del bucketKey global. Phase 2 debe verificar explícitamente que `bucketKey` incluye `resource_id` antes de mergear.
- **El dashboard hace 2+ lecturas paralelas (ej. `session_activities` + `clinical_reports` vía `Promise.all`)**: cada lectura es un `resource_type` distinto. Si las invocaciones al hook se hacen desde ambos callbacks → 2 entradas por hora (una por recurso). Ese es el resultado correcto. No agrupar artificialmente.
- **Patient views dashboard during middle of existing 1h bucket**: comportamiento documentado — la entrada se suma solo si `resource_id` nuevo. Ver acceptance scenario 3 de User Story 2.
- **Session_activities y clinical_reports ya son scope de spec 007**: este spec 008 **no tocará las queries existentes**. Solo agrega la invocación al hook en los 3 callbacks que hacen lectura PHI. Phase 2 valida que no se modifican las queries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cuando el paciente abre su dashboard (`PatientDashboardPageV2.jsx`), el sistema DEBE invocar el hook canónico de auditoría clínica (`useClinicalAccessLogger`) en los callbacks que cargan PHI — actividades (`session_activities`), reportes clínicos (`clinical_reports`), documentos (`clinical_history` informe_tea), y citas (`appointments`).
  - *Nota sobre scope PHI*: `appointments` entra en el alcance del logging defensivamente aunque solo exponga metadatos (fechas, status, duraciones) — porque esos metadatos son clínicamente relevantes (agenda de sesiones revela frecuencia de tratamiento, patrones de consulta) y el Principio III no distingue entre "ficha clínica" y "agenda clínica". Bajo la misma lógica que `PatientFilePage.jsx` audita cuando carga la ficha, el dashboard audita cuando carga las próximas citas del paciente.
- **FR-002**: La invocación DEBE seguir el patrón del callsite canónico existente en el repo (`src/pages/therapist/PatientFilePage.jsx` u `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` — Phase 1 determina cuál tomar como referencia).
- **FR-003**: El `bucketKey` del hook DEBE incluir `resource_id` para habilitar deduplicación granular por recurso (lección canónica de spec 004 commit `8acef16`, patrón `docs/PATTERNS.md §3`).
- **FR-004**: La ventana de deduplicación DEBE ser 1 hora (default establecido en spec 004), para que N refreshes del mismo paciente en ≤60 min generen **1** entrada por `resource_id`.
- **FR-005**: La invocación al hook DEBE dispararse **al cargar los datos clínicos**, no en every React render. Acoplarla al success path del fetch (dentro del callback que setea state).
- **FR-006**: Si el hook falla por cualquier razón (RLS, red, timeout), el dashboard DEBE seguir renderizando completo y los datos clínicos DEBEN seguir visibles. El error se maneja internamente (console log) sin toast visible.
- **FR-007**: El spec NO DEBE modificar las queries SQL existentes de `PatientDashboardPageV2.jsx` (son scope de spec 007, ya cerrado).
- **FR-008**: El spec NO DEBE modificar el hook `useClinicalAccessLogger` ni su dependencia `src/lib/audit/clinicalAuditLogger.js`.
- **FR-009**: El spec NO DEBE agregar nuevas migraciones, policies RLS, o triggers.
- **FR-010**: El spec NO DEBE extender el scope a otros archivos que tengan el mismo gap (ej. dashboard legacy `PatientDashboardPage.jsx`). Si Phase 1 los detecta, se documenta como hallazgo y se abre spec hermano — no se fixea en spec 008.
- **FR-011**: Post-deploy, si el hook canónico fue refactorado desde spec 004 (firma distinta, nuevos argumentos, tabla destino cambiada), Phase 2 DEBE detener y reportar antes de propagar el cambio.

### Key Entities *(include if feature involves data)*

- **`clinical_audit_log`** (destino de escritura): tabla append-only que registra cada acceso a PHI. Columnas relevantes: `actor_id` (auth.users.id del que accedió), `patient_id` (paciente cuyo dato se vio), `resource_type` (tipo de recurso accedido), `resource_id` (id específico del registro accedido), `action` (verbo de acceso), `created_at`.
- **`useClinicalAccessLogger`** (hook canónico): capa de orquestación que encapsula el insert + dedup. Firma a confirmar en Phase 1. No se modifica.
- **Bucket key**: cadena composable usada para dedup dentro de una ventana de 1h. Incluye al menos `actor_id + resource_type + resource_id`. Patrón canónico: `docs/PATTERNS.md §3`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Después del deploy, el 100% de los accesos de un paciente a su propio dashboard producen al menos 1 fila nueva en `clinical_audit_log` dentro de los primeros 5 segundos post-load. Medición: `COUNT(*) FROM clinical_audit_log WHERE actor_id = <patient_auth_id> AND created_at >= <timestamp_de_apertura>`.
- **SC-002**: Un mismo paciente que refresca su dashboard 5 veces en 15 minutos genera **1 entrada por recurso** (no 5). Medición: `COUNT(*) FILTER (WHERE actor_id = X AND resource_type = 'session_activities' AND created_at > NOW() - INTERVAL '1 hour')` debe ser exactamente 1.
- **SC-003**: Post-deploy, 0 regresiones en el renderizado del dashboard (los 4 widgets siguen funcionando igual que post-spec 007). Validado por test manual comparando el dashboard pre/post spec 008 con la misma cuenta.
- **SC-004**: Si se simula falla del logger (interrupción de red, RLS denegando insert), el dashboard sigue rendereando al 100% con todos los widgets visibles y sin toast de error.
- **SC-005**: En los primeros 7 días post-deploy, el ratio de entradas `clinical_audit_log` / sesiones de dashboard activas en paciente ≥ 0.5 (hay 1 entrada por cada 2 sesiones al menos — margen bajo porque dedup puede absorber múltiples refreshes).
- **SC-006**: Una consulta de auditoría que pregunta "¿qué pacientes accedieron a su ficha en la última semana?" devuelve el listado correcto con 0 falsos negativos atribuibles a gaps de logging en el dashboard.

## Assumptions

- El hook `useClinicalAccessLogger` existe y es estable. Confirmado por constitution §III (actualización 2026-04-20) y por los 2 callsites detectados en Phase 2 de spec 007 (`PatientFilePage.jsx`, `OdontogramEvaluationPage.jsx`).
- La tabla `clinical_audit_log` tiene triggers append-only funcionales (confirmado por health-check de `architecture.md §Post-spec health-checks`: "9 writes en 2026-04-20 ✅ Trigger OK").
- El patrón canónico del bucketKey con `resource_id` descrito en `docs/PATTERNS.md §3` sigue siendo válido post-spec 004.
- No se requiere migración ni cambio de RLS — el insert del paciente a `clinical_audit_log` sobre su propia fila ya está permitido por la policy existente.
- El dashboard `PatientDashboardPageV2.jsx` es el único consumidor del patient dashboard V2 (el legacy `PatientDashboardPage.jsx` es ruta distinta; Phase 1 lo documenta como candidato a spec futuro pero no entra al scope).
- El deploy lo hace Danissa (founder). El ejecutor prepara el commit y test manual.
- Si Phase 1 detecta que `useClinicalAccessLogger` firma no coincide con la suposición (ej. ahora requiere un argumento nuevo que no es `resource_id`), **se detiene antes de Phase 2** y se replantea.

## Rollback Plan

Criterios de abort y protocolo de rollback si el fix degrada la experiencia del paciente o introduce regresiones de auditoría.

### Abort triggers post-deploy

Se dispara rollback si se observa CUALQUIERA de:

1. **≥2 crashes del dashboard** (white screen / React error boundary) reportados o detectados en logs durante las primeras 24h post-deploy. Un crash = el usuario ve pantalla blanca o error de React en lugar del dashboard funcional.
2. **Timeout añadido por el logger > 3s** en el p95 del tiempo de carga del dashboard. Medición: comparar el tiempo entre login → dashboard visible pre-deploy y post-deploy. Si el overhead introducido por el hook supera 3s consistentemente, es inaceptable.
3. **Write error rate > 5%** en `clinical_audit_log` durante las primeras 24h post-deploy. Medición: ratio `(intentos fallidos por el hook) / (total de loads del dashboard)`. Errores sostenidos > 5% sugieren RLS mal configurada, tabla bloqueada, o regresión en el trigger append-only.
4. **Regresión visible en alguno de los 4 widgets** del dashboard (actividades, reportes, progreso, próximas citas) — datos distintos o faltantes comparado con post-spec 007.

### Protocolo de rollback

1. **Stop** — no más cambios en la branch.
2. **`git revert <commit-del-fix>`** del PR completo. No `reset --hard` en main.
3. **Notificar** a Danissa con:
   - Trigger que disparó el rollback (cuál de los 4 arriba).
   - Evidencia: logs, screenshots, o métricas exactas.
   - Inferencia de root cause si hay hipótesis.
4. **Abrir spec 008.1** con scope ajustado:
   - Si fue crash → hipótesis hook API cambió (R-11 del spec) → plan alternativo.
   - Si fue timeout → logger tiene contención o requiere async no bloqueante.
   - Si fue write error → problema de RLS o trigger — requiere spec compañero en DB antes de reintentar el hook.
5. **Ejecutar** spec 008.1 con el mismo ciclo `/speckit-*` desde cero.

### Non-rollback triggers (no disparan abort)

- **1 crash aislado no reproducible** durante las primeras 24h → investigar, NO abortar inmediatamente.
- **Timeout entre 1–3s agregado** → documentar como follow-up de optimización, NO rollback.
- **Write errors aislados < 5%** → tolerable (dedup puede generar errores esperados si el hook colisiona; son no-bloqueantes por FR-006).
- **Ausencia de entradas en `clinical_audit_log` para casos edge específicos** (ej. patient.id null durante race condition) → documentar, NO abort (cubierto por edge cases del spec).

## Scope Bounds

- **Archivos autorizados a modificar**: `src/features/patient-dashboard/PatientDashboardPageV2.jsx` (único).
- **Archivos NO autorizados**: `src/lib/audit/*` (hook + logger), `src/pages/therapist/PatientFilePage.jsx` (canonical callsite — read-only), `supabase/migrations/*`, `supabase/policies.sql`, `src/pages/PatientDashboardPage.jsx` legacy.
- **Si Phase 1 revela que se requiere tocar archivos fuera del bound**: STOP → reportar → decidir con Danissa si amplía scope o se divide en sub-spec.
- **Si se detecta gap idéntico en otros archivos** (ej. dashboard legacy, o componentes hijo de `PatientDashboardPageV2.jsx`): documentar y abrir spec hermano. NO fixear en spec 008.
