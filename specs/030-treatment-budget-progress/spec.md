# Feature Specification: Treatment Budget With Progress (MVP)

**Feature Branch**: `030-treatment-budget-progress`
**Created**: 2026-06-03
**Status**: Draft
**Input**: User description: "Unificar el flow clínico-económico de DentalSpot: presupuesto desde odontograma, evolución por sesión que tilda acciones completadas, registro de cobro contextual. MVP = Bloques 1+2+5: items del presupuesto con estado + PostSession enriquecido + polish/smokes. Out of scope: vista paciente (Bloque 3) y split notas público/privado (Bloque 4) — quedan para sesión siguiente."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista cierra una sesión y registra qué se hizo + cobro (Priority: P1) 🎯 MVP

El Dr. Cristobal terminó la sesión con Solange Vulasich. Solange tenía un presupuesto con 3 intervenciones planificadas (endodoncia diente 36, limpieza completa, obturación diente 22). En esta sesión Cristobal hizo la endodoncia y la limpieza. Al marcar la cita como completada, se abre el modal PostSession con la lista de las 3 intervenciones pendientes. Cristobal tilda endodoncia + limpieza. El sistema calcula automáticamente el monto: $80.000 + $25.000 = $105.000. Aparece un modal de cobro pre-rellenado con ese monto. Cristobal elige "Efectivo" y registra. Las dos intervenciones quedan marcadas como completadas en el presupuesto, vinculadas a esta cita, y el pago de $105.000 queda registrado con la comisión correspondiente integrado automáticamente a Ingresos.

**Why this priority**: Es el flow central de la propuesta. Sin esto, las acciones ya hechas no quedan registradas como completadas y el cobro requiere abrir otra pantalla. Resuelve el dolor principal: hoy el dentista abre 4 pantallas. Este flow las unifica en una sola interacción.

**Independent Test**: Crear un presupuesto con 3 items pendientes, cerrar una cita, marcar 2 items como completados, registrar un pago, y verificar que (a) los items quedan en estado `completed` con `completed_at` y `completed_in_appointment_id` poblados, (b) el pago queda en `patient_payments` vinculado al budget, (c) el `balance_due` calculado en la vista `v_budget_balance` se actualiza correctamente, (d) la comisión del dentista vs clínica se aplica según `payment_commission_percent`.

**Acceptance Scenarios**:

1. **Given** una cita de Solange con Cristobal que se marca como completada, **And** Solange tiene un presupuesto activo con 3 items pendientes, **When** el dentista cierra la sesión, **Then** el modal PostSession muestra la lista de los 3 items con checkboxes y precios visibles
2. **Given** el dentista tilda 2 items (endodoncia $80.000 + limpieza $25.000), **When** confirma la sesión, **Then** los 2 items pasan a estado `completed` con `completed_at = now()` y `completed_in_appointment_id = id de esta cita`
3. **Given** los 2 items completados, **When** se cierra el wizard de la sesión, **Then** se abre automáticamente el modal de cobro con monto pre-rellenado = $105.000
4. **Given** el dentista elige método "Efectivo" y confirma, **When** se registra el pago, **Then** entra en `patient_payments` con `budget_id` correcto, `amount = 105000`, `status = 'completed'`, y la comisión calculada según `payment_commission_percent` de la clínica
5. **Given** el dentista cierra el modal de cobro sin registrar pago, **When** confirma "Cobrar después", **Then** los items quedan marcados completed igual, pero `patient_payments` no registra entry — el saldo queda pendiente y visible en `v_budget_balance`
6. **Given** una cita completada sin items tildados, **When** el dentista intenta cerrar sin tildar nada, **Then** aparece warning amable "No marcaste ninguna intervención completada en esta sesión. ¿Confirmar igual?" con opciones Cancelar / Confirmar

---

### User Story 2 — Asistente/admin crea presupuesto sin tocar evolución (Priority: P2)

La asistente Robotina recibe a Solange en recepción. Cristobal le pidió que cargue el presupuesto antes de empezar el tratamiento. Robotina abre el perfil de Solange, va a "Presupuestos", crea uno nuevo con 3 items, cada uno vinculado a un servicio del catálogo con su precio. El estado del presupuesto queda en `draft`. Al guardar, el presupuesto queda listo para que el dentista lo use en la próxima sesión.

**Why this priority**: Permite separación clara de tareas (asistente carga el costo, dentista ejecuta y cobra). Hoy ya existe la UI para crear presupuestos pero está desconectada del flow del dentista. Esta US confirma que el rol asistente puede CREAR/EDITAR presupuestos pero NO marcar items como completados (decisión clínica del dentista).

**Independent Test**: Login como Robotina, crear presupuesto para Solange con 3 items, intentar marcar uno como `completed` desde la UI → debe estar deshabilitado. Login como Cristobal → SÍ puede marcar como completed.

**Acceptance Scenarios**:

1. **Given** Robotina logueada como asistente, **When** abre el perfil de Solange y va a "Presupuestos", **Then** ve los presupuestos existentes y puede crear uno nuevo
2. **Given** Robotina crea un presupuesto con 3 items y guarda, **When** el presupuesto se persiste, **Then** queda en estado `draft` con `created_by = robotina_user_id`
3. **Given** un presupuesto con items pendientes, **When** Robotina abre el detalle, **Then** los items se muestran con su precio pero el control "marcar completado" NO está disponible para su rol
4. **Given** Cristobal logueado como dentista, **When** abre el mismo presupuesto, **Then** SÍ puede tildar items como completados (en el flow del PostSession, no editando el presupuesto directamente)

---

### User Story 3 — Odontograma como entry point para crear items de presupuesto (Priority: P2)

El Dr. Cristobal está evaluando la boca de Solange por primera vez. Abre el odontograma y empieza a marcar tratamientos por diente: en el diente 36 marca "endodoncia", en el diente 22 marca "obturación", arriba general marca "limpieza completa". A medida que marca cada tratamiento, el sistema:
- Detecta si Solange tiene un presupuesto activo. Si no, crea uno automáticamente en estado `draft` con title generado
- Agrega un item al presupuesto con `description` que incluye diente + tratamiento, `service_id` vinculado al catálogo de servicios del dentista para auto-llenar el precio
- Si el dentista NO tiene el servicio configurado en su catálogo, el precio queda editable manualmente

Al terminar la evaluación, Solange ya tiene un presupuesto coherente y el odontograma muestra el diagnóstico visual.

**Why this priority**: Es el natural entry point para el dentista. Hoy crear un presupuesto requiere abrir una pantalla separada y volver a definir todo. Esta US conecta los 2 sistemas.

**Independent Test**: Abrir odontograma de paciente sin presupuesto, marcar 1 tratamiento → verificar budget creado con item. Marcar 2 más → mismo budget, 3 items.

**Acceptance Scenarios**:

1. **Given** Solange sin presupuesto activo, **When** Cristobal marca "endodoncia diente 36" en el odontograma, **Then** se crea un budget nuevo `status='draft'` con `title='Plan de tratamiento — Solange Vulasich'` y un item con `description='Endodoncia diente 36'`
2. **Given** el servicio "Endodoncia" existe en `therapist_services` del Dr. Cristobal con precio $80.000, **When** se crea el item, **Then** `service_id` se vincula automáticamente y `unit_price=80000`
3. **Given** el servicio "Limpieza" NO existe en el catálogo de Cristobal, **When** marca "limpieza completa", **Then** el item se crea con `service_id=null` y `unit_price=0`, mostrando un input editable para que Cristobal complete el precio manualmente
4. **Given** Solange ya tiene un budget en `draft`, **When** Cristobal marca un segundo tratamiento, **Then** el nuevo item se agrega al budget EXISTENTE (no se crea uno nuevo)

---

### Edge Cases

- **Cita sin paciente asignado**: el modal PostSession no debe abrirse — la cita no tiene budget que cargar
- **Paciente con múltiples budgets activos**: el modal PostSession muestra un selector para elegir cuál usar. Default: el más reciente en `draft` o `accepted`
- **Cita reasignada de un dentista a otro** (spec 028): los items completados quedan vinculados al `completed_in_appointment_id` — la reasignación posterior del therapist_id no afecta el historial
- **Cita cancelada después de marcar items**: los items quedan completed igual (la intervención ya se realizó) pero reportes deberían marcarlo como inconsistencia
- **Item completado por error**: reversible. UI permite des-marcar volviendo a pending, solo por: el dentista que la marcó originalmente OR un clinic_admin. Cada cambio queda en audit log
- **Pago superior al monto sugerido** (anticipo): el sistema permite editar el monto antes de confirmar. `balance_due` puede quedar negativo
- **Pago menor al monto sugerido** (parcial): se registra el valor real. `balance_due` queda positivo
- **Item sin service_id ni precio**: bloquear el cierre de la sesión hasta que el dentista complete un precio manual o decida descartar el item
- **Dentista pure intenta editar el budget** (no solo tildar items): puede tildar items en PostSession pero NO editar precios o eliminar items — eso es decisión administrativa
- **Sesión con cita aún `scheduled`** (no completed): el modal PostSession NO debe abrirse hasta que la cita esté marcada como `completed`

## Requirements *(mandatory)*

### Functional Requirements

#### Items del presupuesto con estado (Bloque 1)

- **FR-001**: El sistema MUST tener tres estados posibles para cada item del presupuesto: `pending` (default), `completed`. Persistido en una columna nueva con CHECK constraint
- **FR-002**: Cada item completado MUST registrar `completed_at` (timestamp) y `completed_in_appointment_id` (FK a la cita). Ambas columnas nullables, solo pobladas cuando status='completed'
- **FR-003**: El sistema MUST migrar el contenido de `odontograms.treatments` (JSONB legacy) a la tabla de items, asegurando que cada tratamiento del JSON se convierta en una row de items con precio, descripción y diente. Después de la migración el JSONB queda deprecated
- **FR-004**: Cuando un dentista marca un tratamiento en el odontograma, el sistema MUST crear automáticamente un item en el budget activo del paciente. Si no existe budget activo, MUST crear uno en estado `draft` con título generado
- **FR-005**: El item creado desde odontograma MUST tener `description` que incluya diente + tratamiento (ej. "Endodoncia diente 36"), `service_id` vinculado al catálogo si el servicio existe en `therapist_services`, y `unit_price` autocompletado desde el servicio. Si no existe en el catálogo: `service_id=null` y `unit_price=0` con input editable

#### PostSession enriquecido + cobro contextual (Bloque 2)

- **FR-006**: Cuando una cita pasa de `scheduled` a `completed`, el sistema MUST abrir el modal PostSession con la lista de items `pending` del budget activo del paciente. Si el paciente tiene múltiples budgets activos, mostrar selector con default = budget más reciente en `draft` o `accepted`
- **FR-007**: El modal PostSession MUST presentar cada item pendiente con: checkbox, descripción, precio, indicación de si tiene precio configurado. Items sin precio MUST mostrar input editable
- **FR-008**: Al confirmar la sesión con items tildados, el sistema MUST actualizar cada item tildado: `status='completed'`, `completed_at=now()`, `completed_in_appointment_id=apt.id`. Operación atómica — si una falla, ninguna se aplica
- **FR-009**: Inmediatamente después de marcar items como completed, el sistema MUST abrir el modal de cobro contextual con monto pre-rellenado = `SUM(unit_price * quantity)` de los items recién tildados
- **FR-010**: El modal de cobro MUST ofrecer métodos de pago: efectivo, transferencia bancaria, link Mercado Pago. También "Cobrar después" para saltar el pago manteniendo items completados
- **FR-011**: Si el dentista registra un pago, el sistema MUST insertar row en `patient_payments` con: `budget_id`, `amount` (puede ser distinto al sugerido), `status='completed'`, `payment_method`, `commission_percent` derivado del `payment_commission_percent` de la clínica, `commission_amount` calculado, `appointment_id` (vínculo a la sesión)
- **FR-012**: El cálculo de balance MUST usar la vista existente `v_budget_balance` que ya calcula `total_paid`, `balance_due`, `payment_count`. Sin cambios a la vista
- **FR-013**: Si el dentista intenta cerrar la sesión sin tildar items, el sistema MUST mostrar warning amable "No marcaste ninguna intervención completada en esta sesión. ¿Confirmar igual?" con opciones Cancelar / Confirmar

#### Permisos por rol

- **FR-014**: Solo `dentist` y `clinic_admin` MUST poder tildar items como `completed`. El rol `assistant` NO ve el control de tildado. Backend RLS rechaza el UPDATE si el actor no es dentist/clinic_admin
- **FR-015**: El rol `assistant` MUST poder crear y editar presupuestos (items, precios, descripciones) pero NO marcar items como completados ni registrar pagos clínicos desde la flow PostSession
- **FR-016**: Un item `completed` puede ser revertido a `pending` solo por: el dentista que lo marcó (`completed_in_appointment_id` debe referenciar a su cita) OR un `clinic_admin` de la org. La reversión queda en audit log
- **FR-017**: Solo `dentist` y `clinic_admin` MUST poder registrar pagos clínicos desde el flow PostSession. El asistente puede registrar pagos desde el módulo de pagos administrativos (flow existente)

#### Audit y compliance

- **FR-018**: Cada UPDATE de item a `completed` MUST registrar entry en `clinical_audit_log` con `action='update'`, `resource_type='budget_item'`, `resource_id=item.id`, `reason='completed_in_appointment:<apt_id>'`
- **FR-019**: Cada INSERT en `patient_payments` desde el flow PostSession MUST registrar entry en `clinical_audit_log` con `action='create'`, `resource_type='payment'`, `resource_id=payment.id`, `reason='from_postsession:<apt_id>'`
- **FR-020**: Cada reversión de item completed → pending MUST registrar entry con `action='update'`, `resource_type='budget_item'`, `reason='reverted_by:<user_id>;original_appointment:<apt_id>'`
- **FR-021**: UI Honesty: el toast verde "Pago registrado" SOLO aparece si el INSERT en `patient_payments` retornó la row creada (data.length > 0)

#### Edge cases

- **FR-022**: Si un paciente NO tiene budget cuando se cierra la sesión, el modal PostSession MUST ofrecer al dentista: (a) crear budget rápido inline con un solo item para esta sesión, (b) saltar el flow de tildado
- **FR-023**: Si una cita se cancela después de tener items completados, el sistema MUST mantener los items como `completed` pero generar warning en reportes administrativos
- **FR-024**: Si el dentista cobra MÁS del monto sugerido (anticipo), `patient_payments.amount` se registra con el valor real. `balance_due` puede quedar negativo
- **FR-025**: Si el dentista cobra MENOS (pago parcial), `patient_payments.amount` se registra con el valor real. `balance_due` queda positivo

### Key Entities

- **Presupuesto (treatment_budget)**: Entidad existente. patient_id, therapist_id, clinic_id, total, status. Sin cambios estructurales
- **Item del presupuesto (treatment_budget_item)**: Entidad existente extendida con 3 columnas nuevas: `status`, `completed_at`, `completed_in_appointment_id`
- **Pago (patient_payment)**: Entidad existente con `budget_id`. Spec 030 agrega flow de creación desde PostSession con vínculo opcional a `appointment_id` (verificar si la columna existe)
- **Vista balance (v_budget_balance)**: Vista existente que calcula `total_paid` y `balance_due`. Reusada sin cambios
- **Sesión (appointment con status='completed')**: Trigger natural del flow. Sin nueva tabla
- **Log de auditoría clínica (clinical_audit_log)**: Recibe entries de marcado/reversión de items y creación de pagos desde PostSession

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de las citas marcadas como `completed` post-deploy MUST disparar el modal PostSession con la lista de items pendientes del budget del paciente
- **SC-002**: 100% de los items marcados como `completed` MUST tener `completed_at` y `completed_in_appointment_id` no-null (validable con count = 0)
- **SC-003**: 100% de los pagos registrados desde PostSession MUST quedar registrados en `clinical_audit_log` con `action='create'` + `resource_type='payment'`
- **SC-004**: El dentista completa el flow "cerrar sesión + tildar 2 items + registrar pago" en menos de 90 segundos desde el click "Marcar como completada" hasta el toast verde
- **SC-005**: 0 casos de items en estado `completed` sin `completed_in_appointment_id` (integridad referencial garantizada por backend)
- **SC-006**: 0 casos de pagos desde PostSession sin entry en `clinical_audit_log` (validable por count cruzado mensual)
- **SC-007**: La vista `v_budget_balance` retorna el balance correcto en menos de 500ms para presupuestos de hasta 50 items
- **SC-008**: 80% de las citas completadas tildan al menos 1 item del budget dentro de las primeras 4 semanas post-deploy (medible por sampling)

## Assumptions

- La tabla `treatment_budget_items` ya existe con columnas: `id`, `budget_id`, `service_id`, `description`, `quantity`, `unit_price`, `subtotal`, `sort_order`, `created_at`. Solo agregamos `status`, `completed_at`, `completed_in_appointment_id`
- La vista `v_budget_balance` ya existe y calcula `total_paid`, `balance_due`, `payment_count` correctamente. No requiere cambios
- La tabla `patient_payments` ya tiene `budget_id`. La columna `appointment_id` para vínculo con la sesión puede ya existir o requerir migration adicional — se verificará en `/speckit-plan`
- El catálogo de servicios `therapist_services` ya tiene precios en CLP. Los items del presupuesto heredan el precio del servicio al crearse
- El campo `payment_commission_percent` ya vive en la tabla `clinics` y se aplica en patient_payments — se reusa sin cambios
- El odontograma actual (componente `Odontogram.jsx`) tiene un mecanismo para marcar tratamientos por diente. Este spec lo extiende para que cada marcado dispare creación de un item del budget. UI puede requerir cambios moderados — se evaluará en `/speckit-plan`
- El modal `PostSessionModal.jsx` actual NO referencia `treatment_budgets` ni `odontograms`. La modificación es significativa — agregar fetch de items pendientes, checklist UI, lógica de marcado, integración con modal de cobro
- Solo 2 budgets existen en producción al momento del spec → la migración de `odontograms.treatments` JSONB legacy a la tabla normalizada es de bajo riesgo
- Los pagos registrados desde el flow PostSession reusan el sistema existente de `patient_payments` con commission tracking. No se modifica la lógica de cálculo
- El módulo de pagos administrativos (asistente registra pagos fuera del flow clínico) sigue funcionando como antes — este spec NO lo modifica
- Out of scope: vista paciente con barra de progreso y lista de intervenciones (Bloque 3 — sesión siguiente). Split de notas público/privado entre paciente y dentista (Bloque 4 — sesión siguiente). La vista del paciente y la confidencialidad de notas técnicas quedan como están
- Out of scope: integración con Mercado Pago para procesar el pago online dentro del flow PostSession. Si el dentista elige "Link MP" hoy, el sistema genera un link estándar que el paciente paga en su tiempo
- Out of scope: notificaciones push o email automáticas cuando se cierra una sesión, se registra pago o se actualiza el progreso del presupuesto
