# Feature Specification: Fix — `resource_id` en el bucketKey anti-spam del audit logger

**Feature Branch**: `004-audit-logger-resource-dedup`
**Created**: 2026-04-20
**Status**: Draft
**Priority**: 🟡 P1 — Compliance gap (edge case silencioso; menor que P0 de spec 003, pero mismo principio violado)
**Input**: User description: "El hook `src/lib/audit/useClinicalAccessLogger.js` tiene un dedup anti-spam por hora usando sessionStorage. La función `hourBucketKey()` (líneas 9–16) genera la clave con userId + patientId + action + resourceType + hora, PERO omite `resourceId`. Consecuencia: si un dentista crea/abre 2 evaluaciones distintas del mismo paciente en la misma hora (UUIDs distintos de odontograma), el bucketKey es idéntico para ambas → la 2da queda bloqueada por el dedup → NO se registra en `clinical_audit_log`. Gap detectado durante investigación de spec 003 (commit `c55d1a5`) y documentado como deuda pendiente en `data-compliance.md`."

## 🟡 Compliance Impact

Constitution III (Append-Only Clinical Audit) se viola en un edge case concreto: cuando el dentista accede a 2 recursos **distintos** (ej. evaluaciones A y B del mismo paciente) dentro de la misma ventana horaria, solo el primer acceso queda registrado. El segundo queda bloqueado por el dedup anti-spam, silenciosamente.

- **Ley 21.719 ARCO comprometido parcialmente** — el paciente que solicita historial de accesos vía `PatientAccessHistoryPage` ve un subconjunto incompleto: la evaluación B no aparece porque nunca se registró.
- **No es tan grave como spec 003** (que era silencio total por 44h), pero es un edge case persistente que seguirá erosionando el log a medida que los dentistas generen múltiples evaluaciones por paciente-hora.
- **Defensa del profesional (historia fundacional #3)** — si un paciente reclama "usted abrió mi evaluación B sin mi consentimiento", el dentista no puede probar que la abrió legítimamente porque ese acceso está ausente del log.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dos evaluaciones distintas del mismo paciente dejan 2 rastros (Priority: P1 🎯)

Cuando un dentista abre/crea evaluación A de odontograma del paciente X a las 10:05, y luego abre/crea evaluación B del mismo paciente X a las 10:30 (dentro de la misma hora), ambas apariciones quedan registradas en `clinical_audit_log` como **2 filas distintas** con `resource_id` diferente.

**Why this priority**: es el objetivo primario de la spec. El bug ya está identificado con evidencia; cerrar el gap restaura el contrato de Constitution III para el caso multi-recurso-por-hora.

**Independent Test**: con la cuenta de prueba (Cristóbal, `user_id = 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`), crear 2 evaluaciones de odontograma del mismo paciente dentro de la misma hora. Post-fix, `SELECT count(*) FROM clinical_audit_log WHERE user_id = '<cristobal>' AND patient_id = '<paciente>' AND resource_type = 'odontogram' AND action = 'view_record' AND created_at > NOW() - INTERVAL '1 hour'` devuelve 2 (con `resource_id` distintos). Pre-fix devolvería 1.

**Acceptance Scenarios**:

1. **Given** un dentista con rol `dentist` activo y relación legítima al paciente X, **When** crea la evaluación A de odontograma a las 10:05 y luego la evaluación B del mismo paciente X a las 10:30 (misma hora natural), **Then** `clinical_audit_log` tiene exactamente 2 filas nuevas con `resource_id_A ≠ resource_id_B`, ambas con `action='view_record'` y `resource_type='odontogram'`.
2. **Given** la misma situación, **When** el paciente X consulta su `PatientAccessHistoryPage`, **Then** ve las 2 aperturas listadas, con timestamp y referencia al recurso distinta.

---

### User Story 2 — Refresh del mismo recurso NO duplica (preservar invariante actual) (Priority: P2 🎯)

El dedup anti-spam existente, que evita que un refresh F5 o re-apertura del **mismo** recurso en la misma hora genere duplicados, sigue operando sin cambios perceptibles.

**Why this priority**: es el contrato actual del hook. Romperlo sería regresión que re-introduce spam en el log. Esta US no es nueva funcionalidad — es protección.

**Independent Test**: abrir la evaluación A, anotar count de filas en `clinical_audit_log`. Refrescar F5 sobre la misma URL 3 veces dentro de la misma hora. Re-consultar count: sigue siendo el mismo (no +3).

**Acceptance Scenarios**:

1. **Given** una evaluación A creada hace 5 minutos con 1 fila registrada, **When** el dentista presiona F5 3 veces sobre la misma URL dentro de la misma hora, **Then** sigue habiendo exactamente 1 fila para esa combinación (`user_id + patient_id + action + resource_type + resource_id` en esa hora).
2. **Given** el dentista navega away de evaluación A y vuelve (dentro de la misma hora), **When** el componente re-monta, **Then** sigue habiendo 1 sola fila para esa evaluación (dedup intra-mount + sessionStorage bucket mantienen el invariante).

---

### User Story 3 — Páginas sin `resourceId` específico siguen comportándose igual (compat) (Priority: P3)

Páginas que invocan el hook sin `resourceId` (ej. `PatientFilePage` que loggea `resource_type='clinical_record'` con `resourceId=patient.id` o null según contrato) NO tienen regresión de comportamiento: el bucketKey sigue siendo único por la combinación de campos que ya incluía + el nuevo `resourceId` (que será `''` si es null).

**Why this priority**: garantizar compatibilidad hacia atrás; los consumidores actuales del hook no necesitan refactor.

**Independent Test**: abrir ficha de paciente Y → count en log = N. Refrescar F5 → sigue N. Volver a abrir ficha mismo paciente → sigue N (misma hora). Abrir ficha paciente Z distinto → count = N+1.

**Acceptance Scenarios**:

1. **Given** `PatientFilePage.jsx:136` invoca el hook con `resourceId = patient.id` (o `null`), **When** el dentista abre la ficha, **Then** se registra exactamente 1 fila (primer acceso) y refresh / re-apertura dentro de la misma hora no añade más.

---

### Edge Cases

- **`resourceId` es `null`**: el bucketKey lo incluye como string vacío `''` (igual que el `tupleKey` actual en línea 38 del hook, que ya normaliza `resourceId ?? ''`). Comportamiento compatible con el dedup actual para consumidores que no pasan `resourceId`.
- **`resourceId` cambia entre renders del mismo mount**: `loggedRef.current` (línea 39) usa `tupleKey` que ya incluye `resourceId`, así que el re-render con nuevo id dispara correctamente otro intento de log (si el bucketKey resultante difiere). No es escenario común en producción pero el hook lo tolera.
- **`sessionStorage` no disponible (modo incógnito)**: mismo fallback que hoy (línea 53 del hook) — continúa sin bucket; el `tupleKey` por-mount sigue previniendo doble-fire en el mismo mount.
- **Dos evaluaciones distintas creadas con <1 segundo de diferencia**: ambas entran al hook con bucketKeys distintos (porque `resource_id` difiere), ambas intentan INSERT. La policy `cal_dentist_insert` acepta ambas independientemente (assume care_team OK vía spec 003 sync). Comportamiento esperado: 2 filas, 0 duplicados.
- **`resourceType` distinto, mismo `resourceId`**: por construcción extremadamente raro (el mismo UUID como evaluación y como clinical_record simultáneamente es casi imposible), pero si ocurre, bucketKey diferencia correctamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST incluir `resourceId` (normalizado a `''` si es `null`) como componente del `hourBucketKey` usado por el dedup anti-spam de `sessionStorage` en `src/lib/audit/useClinicalAccessLogger.js`.
- **FR-002**: Dos invocaciones del hook con los mismos `userId + patientId + action + resourceType + hora` pero **distintos** `resourceId` MUST generar **dos bucketKeys distintos** en `sessionStorage` y, como resultado, dos intentos de INSERT independientes en `clinical_audit_log`.
- **FR-003**: Dos invocaciones con los mismos `userId + patientId + action + resourceType + hora + resourceId` (incluyendo refresh F5 o re-apertura intra-hora) MUST generar **el mismo bucketKey** y, por tanto, **solo una** fila en `clinical_audit_log` para esa combinación en esa hora.
- **FR-004**: Si `resourceId` es `null` (caso legacy de consumidores como `PatientFilePage` sin resource específico), el bucketKey MUST ser estable y único por (user, patient, action, resourceType, hora) — comportamiento idéntico al actual para ese flujo.
- **FR-005**: El fix MUST limitarse a **un solo archivo**: `src/lib/audit/useClinicalAccessLogger.js`. Ningún cambio a `clinicalAuditLogger.js`, a consumidores del hook, ni a policies/migraciones/edge functions.
- **FR-006**: No se fabrican entradas retroactivas en `clinical_audit_log` para cubrir accesos perdidos por el gap pre-fix (SC-005 de spec 003 sigue vigente — append-only inviolable).
- **FR-007**: Los `useEffect` dependency arrays del hook (línea 78 actual) NO requieren cambio — `resourceId` ya está listado allí. Si el implementer detecta que sí lo requiere, reportar antes de tocar.

### Key Entities

Esta spec opera exclusivamente sobre una cadena de texto (el bucketKey) en `sessionStorage`. No toca DB, schema ni entidades persistentes.

- **`hourBucketKey`** (función interna, líneas 9–16 del hook): genera la clave para el dedup por hora. Actualmente compuesta por `userId + patientId + action + resourceType + YYYY-MM-DD-HH`. Post-fix añade `resourceId ?? ''`.
- **`sessionStorage` bucket**: key-value store del browser; persistencia dentro de la pestaña. Si el dedup falla (p.ej. modo incógnito), el hook continúa sin bucket — el `tupleKey` por-mount sigue previniendo doble-fire intra-mount.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los casos US1 (2 evaluaciones distintas, mismo paciente, misma hora) generan 2 filas distintas en `clinical_audit_log` con `resource_id` diferente — validado por query SQL con la cuenta de prueba en staging/prod.
- **SC-002**: 100% de los casos US2 (refresh F5 sobre el mismo recurso) mantiene 1 fila exacta — el dedup intra-recurso sigue operando.
- **SC-003**: 0 regresiones en consumidores actuales del hook: `PatientFilePage.jsx:136` (loggea `clinical_record`) y `OdontogramEvaluationPage.jsx:81` (loggea `odontogram`). Validado por flujo manual.
- **SC-004**: 0 errores nuevos de ESLint introducidos por el cambio; 0 errores de `npm run build`.
- **SC-005**: Post-fix, `grep -n "hourBucketKey" src/lib/audit/useClinicalAccessLogger.js` muestra la función con el parámetro `resourceId` en la firma y en el template string de retorno.
- **SC-006**: El commit que cierra esta spec documenta en su mensaje la lógica exacta del cambio (una línea) y el gap cerrado, referenciando el hallazgo del ciclo de spec 003.

## Assumptions

- **El hook se invoca siempre con `resourceId` o `null`** — contrato actual. Consumidores: `PatientFilePage.jsx:136` (pasa `patient.id`), `OdontogramEvaluationPage.jsx:81` (pasa `evaluationId`). Si hay un consumidor no enumerado que omite el parámetro, el default `resourceId = null` (línea 22 del hook) lo maneja.
- **`sessionStorage` permite strings arbitrariamente largos** — el bucketKey con un UUID adicional sigue dentro del límite práctico (<5MB por origen). No rompe.
- **El ciclo de spec 003 ya resolvió la causa raíz del silencio total** (commit `c55d1a5`) — sin esa spec cerrada, US1 no pasaría aunque este fix se aplicara, porque la policy RLS `cal_dentist_insert` seguiría rechazando. Esta spec es de mejora marginal sobre terreno ya estable.
- **Los 2 `useEffect` del hook no requieren cambios** de dependency array (línea 78 ya lista `resourceId`).
- **El test manual lo ejecuta Danissa** en producción con la cuenta de prueba, siguiendo el "Test manual previsto" del input.
- **No hay consumidores que dependan del comportamiento actual** (dedup cruzado por recurso) — ningún componente quiere "suprimir la 2ª evaluación" deliberadamente; si existiera, el fix lo expondría como bug.

## Out of Scope

Enumeración explícita por Constitution IV:

- **Cualquier cambio a `src/lib/audit/clinicalAuditLogger.js`** (el logger util es correcto y tiene su propio contrato).
- **Cambios a los consumidores del hook** — `PatientFilePage.jsx`, `OdontogramEvaluationPage.jsx` y otros. Este fix es transparente para ellos.
- **Cambios a policies RLS** (`cal_dentist_insert`, `cal_admin_insert`, etc.) o a la función `is_in_care_team`.
- **Cambios a migraciones / edge functions / tablas**.
- **Backfill de entradas retroactivas** en `clinical_audit_log` (prohibido por Constitution III y FR-006).
- **Cambios al `tupleKey` intra-mount** (líneas 38–39 del hook) — ya incluye `resourceId`.
- **Renombrar el hook** (`useClinicalAccessLogger` nombre histórico que escribe a `clinical_audit_log`) — deuda de naming, spec futura separada.
- **Commits y pushes** — los hace Danissa tras aprobar el test manual.

## Compliance Alignment

- **Constitution I (Compliance-First)**: cierra un edge case persistente de Ley 21.719 ARCO que acumula silenciosamente accesos no registrados.
- **Constitution III (Append-Only Clinical Audit)**: restaura el contrato completo — todo acceso clínico deja rastro, incluyendo aperturas de recursos distintos del mismo paciente en la misma hora.
- **Constitution IV (Micro-Bloques)**: 1 archivo, ~2–3 líneas modificadas. Out of Scope enumerado explícitamente. Reporte post-implementación obligatorio.
- **Constitution VI (Schema Drift Zero)**: no introduce drift; no toca DB.

## Relationship with prior specs

- **Spec 001 (`dd7f02c`)**: cerró el bug de `replaceState` en `OdontogramEvaluationPage.jsx` — hace que el hook se invoque correctamente al crear una evaluación. Pre-001 el hook nunca disparaba en ese flujo; post-001 sí dispara. Esta spec 004 complementa 001 asegurando que la 2ª evaluación en la misma hora también quede registrada.
- **Spec 002 (`28878b6` + `8cb77da`)**: alineó los callsites de odontograma al prefijo `/therapist/`. Hizo el módulo alcanzable desde la UI.
- **Spec 003 (`c55d1a5`)**: reparó `patient_care_team` + triggers de sincronización — hace que la policy RLS `cal_dentist_insert` acepte el INSERT. Sin 003, este fix 004 no tendría efecto observable (los INSERTs seguirían siendo rechazados por RLS). 004 es la siguiente capa de calidad sobre un log ya funcional.

**Secuencia lógica**: 001 → 002 → 003 → 004. Los tres primeros restauran la funcionalidad; 004 cierra el gap fino del dedup.

## References

- `.specify/memory/constitution.md` — Principios III (Append-Only), IV (Micro-Bloques), VI (Schema Drift Zero).
- `.specify/memory/data-compliance.md` — esta spec es el item "Agregar `resource_id` al bucketKey del dedup — spec `audit-logger-resource-dedup`" mencionado en spec 003 §Out of Scope.
- `src/lib/audit/useClinicalAccessLogger.js` líneas 9–16 (función `hourBucketKey`) y 41–46 (invocación actual).
- Commit `c55d1a5` (spec 003) — prerequisito operativo; sin la reparación del care_team + trigger, este fix no es observable en prod.

---

**Spec creada 2026-04-20 | Branch `004-audit-logger-resource-dedup` | Prioridad P1 | Cierra gap fino de dedup post-spec 003**
