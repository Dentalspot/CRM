# Feature Specification: Fix — schema drift `therapist_services.price` en odontogramEvalApi

**Feature Branch**: `005-fix-therapist-services-price-drift`
**Created**: 2026-04-20
**Status**: Draft
**Priority**: 🟡 P1 — bug funcional visible (drop-down vacío + totales 0); Constitution VI (Schema Drift Zero) violada en 1 archivo
**Input**: User description: "Error 42703 (undefined_column) en `src/features/odontogram/api/odontogramEvalApi.js:172`. La query pide `.select('id, service_name, price, duration_minutes')` pero la columna real en `therapist_services` es `price_clp` (`price_usd` también existe; `price` no). Confirmado 2026-04-20 con `information_schema.columns`. Causa raíz: drift heredado — la columna se renombró a `price_clp`/`price_usd` pero este API query quedó sin migrar. Impacto: dropdown de procedimientos vacío, auto-fill de precios no funciona, totales de presupuesto en 0 o NaN. Flujo de crear evaluación en sí sigue funcionando (error solo en `loadServices()`), pero el presupuesto queda mutilado. Mini-audit confirmó que los otros consumidores de `therapist_services` son immunes (usan `price_clp` correctamente o `SELECT *`); solo 1 archivo tiene el drift."

## 🟡 Impacto funcional + Constitution VI

Este fix resuelve un bug 100% observable por el dentista y cierra una violación de **Constitution VI (Schema Drift Zero)**. La columna `price` que el código pide nunca existió (o dejó de existir tras un rename no completo); PostgreSQL devuelve error 42703 y el feature downstream queda mutilado. Este es el tipo de drift que Constitution VI está diseñado para prevenir — queda aquí como caso de corrección, no como caso de "dejar pasar".

- **Constitution VI**: columna usada en código debe existir en `supabase/migrations/`. Una columna `price` inexistente violaba el principio; el fix restaura el alineamiento.
- **Constitution V (UI Honesty)** indirectamente: el dentista ve el dropdown vacío y los totales en 0 sin explicación — el sistema "miente" sobre el estado. Aunque no hay toast falso, la degradación silenciosa es incompatible con el espíritu del principio.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista arma presupuesto con precios sugeridos (Priority: P1 🎯)

El dentista abre una evaluación de odontograma → el dropdown de "Procedimiento" (cuando agrega un diente al presupuesto) se llena con los servicios activos de su catálogo → seleccionar un procedimiento auto-completa el campo "Precio" con el valor correcto → el total del presupuesto refleja la suma real.

**Why this priority**: es el flujo visible roto hoy. Sin este fix, el dentista arma el presupuesto con precios en 0 o escribiéndolos manualmente cada vez — pierde el beneficio del catálogo de servicios.

**Independent Test**: en staging/prod, login como dentista con al menos 1 servicio activo en `therapist_services` con `price_clp` distinto de 0. Abrir `/dashboard/therapist/odontograma/nueva?patient=<uuid>` → DevTools Console no muestra error `42703` → agregar un procedimiento al presupuesto → dropdown tiene opciones → seleccionar una → campo "Precio" se auto-completa con el número correcto.

**Acceptance Scenarios**:

1. **Given** un dentista autenticado con ≥1 fila en `therapist_services` con `is_active=true` y `price_clp` ≠ 0, **When** abre una evaluación de odontograma (creación nueva o re-apertura), **Then** la DevTools Console NO muestra error PostgreSQL `42703 column "price" does not exist` y el array de servicios se hidrata en memoria.
2. **Given** el dentista en Step 3 (Resultados y Presupuesto), **When** hace click en "Agregar Procedimiento" y selecciona una opción del dropdown, **Then** el campo "Precio (CLP)" se auto-rellena con el valor de `price_clp` de la fila seleccionada (no queda en 0, NaN ni vacío).
3. **Given** el dentista ya agregó 3 procedimientos con precios auto-completados, **When** observa el "Total" del presupuesto, **Then** el número mostrado es la suma correcta de los 3 `price_clp` (no 0, no NaN).

---

### User Story 2 — Cero regresiones en otros consumidores de `therapist_services` (Priority: P2)

Los otros archivos que consultan `therapist_services` — confirmados immunes en el mini-audit del 2026-04-20 — siguen funcionando igual. Dashboards del dentista, reportes de clínica, calendario de citas, perfil público, hooks compartidos: ninguno se ve afectado por el fix.

**Why this priority**: el scope de spec 005 es mínimo (1 archivo, 1 query), pero la tabla `therapist_services` es consultada desde ~14 puntos del codebase. Garantizar no-regresión es necesario antes de declarar el fix cerrado.

**Independent Test**: post-fix, abrir cada uno de los flujos que consumen la tabla (dashboard therapist, reportes clínica, perfil público del dentista, calendario) y verificar que no aparezcan errores en consola ni datos faltantes. El mini-audit identificó los consumidores relevantes; el plan técnico recorrerá los 6 archivos "pendientes de confirmar" en Phase 1 read-only para descartar drifts ocultos.

**Acceptance Scenarios**:

1. **Given** el fix aplicado en `odontogramEvalApi.js`, **When** el dentista abre su `TherapistDashboard`, **Then** los precios de servicios en el widget correspondiente siguen mostrándose correctamente.
2. **Given** el fix aplicado, **When** el clinic_admin abre `ClinicReportsPage`, **Then** los reportes de servicios siguen cargando sin error.
3. **Given** el fix aplicado, **When** un paciente abre `TherapistPublicProfilePage` de un dentista, **Then** el perfil público carga como antes.

---

### Edge Cases

- **Dentista sin servicios activos**: `fetchTherapistServices` devuelve `{ data: [], error: null }`. El dropdown queda vacío (caso "no hay servicios configurados"), pero SIN error 42703. El usuario ve estado vacío natural, no bug. Esto ya era el comportamiento pre-fix cuando el drift no ocurría (hipotéticamente); post-fix es el comportamiento real cuando el dentista no configuró servicios.
- **`price_clp` es `null` en alguna fila**: el dropdown muestra el servicio pero el auto-fill pone 0 (o respeta el null, depende del approach — el plan decide). Caso raro, tolerable.
- **Dentista con muchos servicios (≥50)**: el `.order('service_name')` sigue ordenando. Performance O(n log n), sin impacto práctico.
- **Re-apertura de evaluación con precios ya guardados**: los precios guardados en `odontogram_evaluations.treatments` NO cambian — son los que se guardaron en su momento (probablemente 0 o NaN históricamente por el drift). El fix no corrige datos retroactivos. Los nuevos procedimientos que el dentista agregue tras el fix sí tendrán precios correctos.
- **Otros consumidores con drift oculto**: el plan Phase 1 debe confirmar los 6 archivos "pendiente confirmar" del mini-audit (`useClinicDashboard.js:114`, `TherapistPublicProfilePage.jsx:165`, `services-fees.utils.js` (4 líneas), `BookingCalendar.jsx:91`, `EditAppointmentForm.jsx:59`). Si alguno tiene el mismo drift → reportar, decidir si incluir o abrir spec separada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `fetchTherapistServices` MUST devolver un array de servicios sin error PostgreSQL 42703, con al menos los campos necesarios para que `OdontogramEvaluationPage.jsx` acceda a `s.price` (o su equivalente) en líneas 247, 276, 553.
- **FR-002**: El código downstream del consumidor (`OdontogramEvaluationPage.jsx` líneas 247, 276, 553) MUST seguir funcionando. Dos enfoques válidos:
  - **(A)** Alias SQL en la query (`price:price_clp`) — el frontend sigue leyendo `s.price` sin tocar el archivo del consumidor. **Scope: 1 línea en 1 archivo.**
  - **(B)** Cambio completo a `price_clp` en query + actualizar las 3 referencias en `OdontogramEvaluationPage.jsx`. **Scope: 1 archivo API + 1 archivo consumidor, 4 líneas totales.**
  El plan técnico elige (A) o (B) con justificación explícita.
- **FR-003**: El fix MUST estar aplicado de forma atómica (1 commit, 1 PR). Si Opción B se elige, los 2 archivos se modifican en el mismo commit — NO en fases.
- **FR-004**: Phase 1 del plan MUST confirmar que los 6 archivos "pendiente confirmar" del mini-audit del 2026-04-20 NO tienen el mismo drift (piden `price` en lugar de `price_clp`). Si alguno lo tiene, el plan reporta y el asesor decide si incluirlo en esta spec o abrir spec separada. Scope default: NO expandir sin aprobación explícita.
- **FR-005**: El fix MUST NO modificar:
  - Otros consumidores de `therapist_services` confirmados immunes por el mini-audit (`TherapistProfileDashboardPage.jsx`, `useTherapistProfile.js`, `AppointmentModal.jsx`, `useAppointments.js`, `PatientDashboardPage.jsx`, `useTherapistDashboard.js`, `ClinicReportsPage.jsx`, `therapist.api.js`, `therapistApi.js`).
  - El esquema de la tabla `therapist_services` (migraciones, policies, etc.).
  - Otros archivos del módulo `odontogram/` (`components/`, `hooks/`, otras pages).
- **FR-006**: El fix MUST NO introducir nuevos warnings de ESLint ni errores de `npm run build`.

### Key Entities

Esta spec opera sobre una query SQL embebida en código JS; no toca DB ni schema.

- **Tabla `therapist_services`** (solo lectura, sin cambios de schema): catálogo de servicios ofrecidos por cada dentista. Columnas relevantes confirmadas en `information_schema.columns` (2026-04-20): `id`, `service_name`, `price_clp`, `price_usd`, `duration_minutes`, `therapist_id`, `is_active`, `created_at`. La columna `price` **no existe**.
- **Función `fetchTherapistServices`** (API frontend): `src/features/odontogram/api/odontogramEvalApi.js:169-179`. Única función en el codebase que pide la columna inexistente. Invocada desde `OdontogramEvaluationPage.jsx:103` en el `useEffect` de mount.
- **Consumidores downstream del campo `.price`** en `OdontogramEvaluationPage.jsx`: líneas 247 (auto-suggest de procedimientos), 276 (auto-fill on select), 553 (display en dropdown).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-fix, abrir `OdontogramEvaluationPage` con cuenta de prueba (Cristóbal) NO produce el error `42703 column "price" does not exist` en DevTools Console. Validado visualmente.
- **SC-002**: El dropdown de procedimientos muestra ≥1 opción cuando el dentista tiene servicios activos en `therapist_services`. Validado abriendo el dropdown en Step 3 del wizard.
- **SC-003**: Seleccionar un procedimiento auto-completa el campo "Precio (CLP)" con el valor numérico de `price_clp` de la fila correspondiente. Validado creando un procedimiento y leyendo el input.
- **SC-004**: El Total del presupuesto refleja la suma correcta de los precios sugeridos (no 0, no NaN, no `undefined`). Validado con al menos 2 procedimientos agregados.
- **SC-005**: 0 regresiones en los 9 consumidores immunes de `therapist_services` listados en FR-005. Validado por flujo manual en ≥3 de ellos (dashboard therapist + reportes clínica + perfil público).
- **SC-006**: 0 warnings nuevos de ESLint en el/los archivo(s) modificado(s). 0 errores de `npm run build`.
- **SC-007**: `grep -rn "price, duration_minutes\|select.*price[^_]" src/features/odontogram/` post-fix devuelve 0 matches (la query vieja ya no existe). Complementariamente, `grep -rn "price_clp\|price:price_clp" src/features/odontogram/api/` muestra la corrección aplicada.

## Assumptions

- **La columna `price_clp` contiene el valor que el dentista espera ver** como "precio del servicio" por defecto en el presupuesto. Si el producto tiene multi-moneda (`price_usd` también existe), la decisión de qué columna mostrar corresponde a una spec futura separada, no a ésta.
- **El mini-audit del 2026-04-20 fue exhaustivo** para los 14 consumidores identificados de la tabla; los 9 marcados "immunes" realmente lo son. Los 6 marcados "pendiente confirmar" se revalidan en Phase 1 del plan antes de tocar código.
- **Los precios históricamente guardados en `odontogram_evaluations.treatments`** (con probables 0 o NaN por el drift) NO se corrigen retroactivamente — son datos que el dentista escribió sabiendo que el auto-fill no funcionaba o asumiendo 0. Corregirlos sería backfill de datos clínicos, fuera de scope.
- **El test manual lo ejecuta Danissa** en producción con la cuenta de prueba (o en staging si dispone de uno).
- **Cristóbal (cuenta de prueba) tiene al menos 1 servicio activo** en `therapist_services` con `price_clp > 0`. Si no, crear uno antes del test, o usar otro dentista con servicios configurados.

## Out of Scope

Enumeración explícita por Constitution IV:

- **Otros drifts** si aparecen en los 6 archivos "pendiente confirmar" — cada uno es candidato a spec separada, no se mezclan.
- **Refactor de `fetchTherapistServices`** (p.ej. unificar las 3 implementaciones duplicadas del nombre en el codebase — `odontogramEvalApi.js`, `therapist.api.js`, `therapistApi.js` — es deuda estructural documentada en `architecture.md` §"Duplicación pages/features" que se ataca aparte).
- **Agregar `price_usd` al select** ni introducir multi-moneda en UI — spec futura dedicada si el producto lo requiere.
- **Backfill de precios históricos** en `odontogram_evaluations.treatments` — prohibido por Constitution III (append-only) y fuera de scope funcional.
- **Tests automatizados** — el repo no tiene suite de tests de componentes JSX (deuda conocida en `architecture.md`). Test manual procedimental.
- **Cambios al esquema de `therapist_services`** (migrations, policies, nuevas columnas) — la tabla está correctamente definida; el drift es solo del código.
- **Commits y pushes** — los hace Danissa tras aprobar el test manual (workflow advisor/executor).

## Compliance Alignment

- **Constitution I (Compliance-First)**: no toca PHI ni datos clínicos sensibles; el fix es de bug funcional. Sin impacto compliance directo.
- **Constitution IV (Micro-Bloques)**: scope cerrado a 1 o 2 archivos máximo (según enfoque A o B). Out of Scope enumerado explícitamente.
- **Constitution V (UI Honesty)**: el bug actual hace que la UI muestre "0" o "vacío" sin explicar por qué; el fix restaura honestidad al mostrar el estado real del catálogo de servicios.
- **Constitution VI (Schema Drift Zero)**: esta spec es exactamente el caso de corrección que el principio anticipa. "Toda columna referenciada en código debe existir en `supabase/migrations/`" — la columna `price` no existe, la referencia es drift, el fix restaura el alineamiento.

## Relationship with prior specs

- **Specs 001–004** cerraron bugs del módulo odontograma + audit log. Esta spec 005 es **independiente** de ellas — toca un archivo distinto (`odontogramEvalApi.js`, no `OdontogramEvaluationPage.jsx`).
- **Observación de secuencia**: el test manual de spec 001 en su momento pasó 6/7 (el Paso 3 fallaba por spec 003); spec 003 cerró ese bloqueador; spec 004 mejoró el dedup. **Este bug de `price` posiblemente estaba presente durante los tests manuales de 001/003 pero pasó desapercibido** porque el scope de esos tests era el audit log, no el presupuesto de la evaluación. El mini-audit del 2026-04-20 lo detectó por separado.
- **No depende de specs anteriores ni las bloquea.** Puede cerrarse en paralelo a cualquier otro flujo abierto.

## References

- `.specify/memory/constitution.md` — Principios IV (Micro-Bloques), V (UI Honesty), VI (Schema Drift Zero).
- `.specify/memory/architecture.md` — sección "Environment / operations" y "Data-migration patches" (drift documentado como deuda).
- `src/features/odontogram/api/odontogramEvalApi.js:169-179` — función con el drift.
- `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:103, 247, 276, 553` — callsite + consumidores del campo `.price`.
- Mini-audit del 2026-04-20 (sesión del asesor) — identificó 14 consumidores de `therapist_services`, confirmó que solo `odontogramEvalApi.js:172` tiene el drift; otros 9 son immunes (wildcards o `price_clp` correcto); 6 están "pendiente confirmar" en Phase 1 del plan.
- Confirmación en DB vía `information_schema.columns` (2026-04-20): `therapist_services` tiene `price_clp`, `price_usd`, pero NO `price`.

---

**Spec creada 2026-04-20 | Branch `005-fix-therapist-services-price-drift` | Prioridad P1 (bug funcional visible + Constitution VI)**
