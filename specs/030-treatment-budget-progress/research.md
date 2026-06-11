# Phase 0 Research — Treatment Budget With Progress

**Spec**: 030 | **Date**: 2026-06-03

Investigación del Bloque 0 ya consolidada + research adicional necesario para Phase 1.

---

## R-01: Estructura actual de `treatment_budget_items`

**Hallazgo**: tabla existente con columnas: `id`, `budget_id`, `service_id`, `description`, `quantity`, `unit_price`, `subtotal`, `sort_order`, `created_at`. NO tiene `status`, `completed_at`, `completed_in_appointment_id`.

**Decisión**: agregar las 3 columnas vía migration con default seguro:
- `status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed'))`
- `completed_at timestamptz NULL`
- `completed_in_appointment_id uuid NULL REFERENCES appointments(id) ON DELETE SET NULL`

**Rationale**: existing rows automatically get `status='pending'` por default. Cero data migration. Vínculo a appointment con ON DELETE SET NULL para que si se borra una cita histórica (poco probable) no se rompa el budget.

**Alternatives considered**:
- (a) Crear tabla `budget_item_completions` separada con (item_id, appointment_id, completed_at) → over-engineering para un dato 1:1
- (b) Status enum tipo PG vs text con CHECK → CHECK es más simple, no requiere CREATE TYPE

---

## R-02: ¿Existe `patient_payments.appointment_id`?

**Hallazgo**: SÍ existe ✓. Verificado con `SELECT column_name FROM information_schema.columns WHERE table_name='patient_payments'`. La tabla tiene: `appointment_id`, `budget_id`, `amount`, `currency`, `payment_method`, `payment_reference`, `status`, `concept`, `notes`, `payment_date`, `created_at`, `organization_id`, `commission_percent`.

**Decisión**: usar columna existente para vincular pago a sesión. NO migration adicional.

**Rationale**: el sistema ya estaba parcialmente preparado para este vínculo.

---

## R-03: ¿`odontograms.treatments` jsonb existe?

**Hallazgo**: NO existe columna `treatments`. La tabla tiene: `id`, `patient_id`, `therapist_id`, `tooth_type`, `teeth_data` (jsonb), `notes`, `odontogram_type`, `organization_id`.

**Decisión**: cambio de plan vs mi suposición inicial. Los tratamientos viven DENTRO de cada cell de `teeth_data` jsonb (por diente). El "migration de legacy" significa: iterar por cada cell de teeth_data en cada odontogram, extraer los tratamientos planificados y materializarlos como rows de `treatment_budget_items` en un budget nuevo o existente del paciente.

**Rationale**: el modelo es más limpio de lo esperado. teeth_data sigue siendo source of truth visual (qué diente está sano/cariado/etc.) pero los tratamientos económicos van a la tabla normalizada.

**Alternatives considered**:
- Mantener treatments dentro de teeth_data y sincronizar bidireccional → rechazado por riesgo de drift
- Migrar TODO teeth_data a tablas normalizadas → out of scope, el JSON sirve para el render visual

---

## R-04: Estructura actual de `PostSessionModal.jsx`

**Hallazgo**: el modal usa wizard pattern con 4 STEPS: `'document'`, `'payment'`, `'schedule'`, `'done'`. Tiene `StepIndicator` con icons (FileText, DollarSign, CalendarPlus). El step `payment` ya soporta los 5 PAYMENT_METHODS: efectivo, transferencia, debito, credito, mercadopago.

Llama 3 funciones del API:
- `createSessionRecord` — crea registro de la sesión
- `registerSessionPayment` — registra pago en `patient_payments`
- `scheduleNextAppointment` — agenda próxima cita

**Decisión**:
- Insertar nuevo step `'items'` entre `'document'` y `'payment'`
- STEPS pasa a: `['document', 'items', 'payment', 'schedule', 'done']`
- Nuevo componente `BudgetItemsChecklistStep.jsx` con: fetch items pending → checklist UI → "Continuar al pago"
- El step `payment` existente recibe el `suggestedAmount = SUM(unit_price * quantity de items tildados)` como prop
- Si no hay budget activo → mostrar UI alternativa con CTA "Crear presupuesto rápido" + skip al step de pago

**Rationale**: extiende el wizard sin reescribir. La lógica de pago + commission ya está implementada en `registerSessionPayment`, solo extender para aceptar `budget_id` (probablemente ya lo acepta — verificar en research adicional).

**Alternatives considered**:
- Reescribir PostSession entero → over-engineering
- Hacer el step de items ANTES del documento clínico → rompe el flow natural (primero documenta, después tilda lo hecho, después cobra)

---

## R-05: `postSessionApi.registerSessionPayment` — ¿acepta budget_id?

**Hallazgo pendiente**: necesito leer el código para confirmar. Si acepta → solo pasarlo desde el modal. Si NO → extender la función para incluir `budget_id` en el payload de INSERT.

**Decisión tentativa**: extender la función con un parámetro `budgetId` (opcional para retro-compat). Si null, sigue el comportamiento actual.

**Rationale**: backward compatible.

---

## R-06: Vista `v_budget_balance` performance

**Hallazgo**: definición de la vista:
```sql
SELECT b.id AS budget_id, b.budget_number, b.patient_id, b.therapist_id, b.clinic_id,
       b.title, b.status, b.subtotal, b.discount_percentage, b.total, b.currency,
       COALESCE(sum(pp.amount) FILTER (WHERE pp.status = 'completed'), 0) AS total_paid,
       (b.total - (COALESCE(sum(pp.amount) FILTER (WHERE pp.status = 'completed'), 0))) AS balance_due,
       count(pp.id) FILTER (WHERE pp.status = 'completed') AS payment_count
FROM treatment_budgets b
LEFT JOIN patient_payments pp ON pp.budget_id = b.id
GROUP BY b.id;
```

**Decisión**: reutilizar sin cambios. Index existente en `patient_payments.budget_id` (verificar) o crear si falta.

**Rationale**: el cálculo es simple, performance < 500ms para budgets normales. SC-007 fácil de cumplir.

**Action item**: verificar índice en `patient_payments.budget_id` durante implementación.

---

## R-07: Vocabulario CHECK de `clinical_audit_log`

**Hallazgo**: spec 028 amplió `clinical_audit_log_action_check` para incluir 'view', 'create', 'update', 'cancel', 'appointment_reassigned'. Y `clinical_audit_log_resource_type_check` para incluir 'appointment'.

**Decisión**: ampliar `resource_type_check` para incluir `'budget_item'` y `'payment'`. Action ya cubre create/update/cancel.

**Migration delta**:
```sql
ALTER TABLE public.clinical_audit_log DROP CONSTRAINT clinical_audit_log_resource_type_check;
ALTER TABLE public.clinical_audit_log ADD CONSTRAINT clinical_audit_log_resource_type_check
  CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment',
    'budget_item', 'payment'   -- NEW spec 030
  ));
```

**Rationale**: spec 028 ya estableció el patrón. Patrón idempotente, sin riesgo de regresión.

---

## R-08: Trigger de validación de reversión (FR-016)

**Decisión**: trigger BEFORE UPDATE en `treatment_budget_items`:
- Solo dispara si `OLD.status = 'completed' AND NEW.status = 'pending'`
- Valida que `auth.uid()` sea:
  - El dentista de `completed_in_appointment_id.therapist_id`, OR
  - Un `clinic_admin` de la org del item
- Si no → `RAISE EXCEPTION 'unauthorized_revert'`

**Rationale**: FR-016 requiere esta lógica que no se puede expresar puramente en RLS (RLS no puede consultar columnas de OLD).

**Alternative considered**:
- Hacerlo solo en frontend → rechazado por Constitution §II (RLS-First, defense in depth)

---

## R-09: Auto-creación de budget desde odontograma (FR-004)

**Hallazgo**: hoy el odontograma no toca treatment_budgets. La sincronización es nueva.

**Decisión**: en `Odontogram.jsx`, al detectar un tratamiento nuevo marcado en un diente:
- Llamar `getOrCreateActiveBudget(patient_id)` que retorna el budget activo o crea uno nuevo en draft
- Llamar `createBudgetItemFromOdontogram({budget_id, tooth, treatment, service_id, unit_price})` que crea el row

Ambas funciones viven en `src/features/odontogram/api/budgetSyncApi.js` (nuevo archivo).

**Title autogenerado del budget nuevo**: `"Plan de tratamiento — {patient.full_name}"`.

**Rationale**: separación de concerns. El componente UI dispara la API call, la API encapsula lógica de "create-if-not-exists" + auto-link al catálogo.

---

## R-10: Hook entry-point — ¿dónde detectar "cita pasa a completed"?

**Hallazgo**: el modal PostSession se abre desde `AppointmentModal.jsx` cuando el status pasa a 'completed' (callback `onSessionCompleted`). Ya está implementado en spec 028.

**Decisión**: cero cambio en el cableado. El callback `onSessionCompleted(savedApt)` ya pasa la cita al PostSession. Lo que cambiamos es que ahora el modal lista items pending del budget del paciente.

**Rationale**: reuso completo del trigger UI existente.

---

## R-11: Manejo de "paciente sin budget" (FR-022)

**Decisión**: cuando PostSession abre y `patient.budget_count === 0`:
- Mostrar UI alternativa: "Solange no tiene un presupuesto. ¿Querés crear uno rápido para esta sesión?"
- 2 opciones:
  - **Crear rápido inline**: 1 input descripción + 1 input precio + botón "Crear y marcar completado". Crea budget en draft + item con esos datos + status='completed' + appointment_id en una sola operación atómica
  - **Saltar tildado**: avanza al step de pago directamente (sin items tildados). Si dentista quiere cobrar igual, va al step payment normal con monto vacío

**Rationale**: cubre el caso edge sin bloquear el flow.

---

## R-12: Performance del INSERT atómico de varios items completed (FR-008)

**Decisión**: usar Supabase batch UPDATE con `.in('id', itemIds).update({...})` en una sola llamada. Postgres lo procesa en una transacción implícita.

Alternativa más estricta: PL/pgSQL RPC `mark_budget_items_completed(item_ids uuid[], appointment_id uuid)` que hace BEGIN/COMMIT explícito. Útil si necesitamos rollback en algún edge case.

**Rationale tentativo**: empezar con `.update().in('id', itemIds)` simple. Si descubrimos edge cases en smoke (ej. parcial fail), refactor a RPC.

---

## Resumen de decisiones

| ID    | Decisión clave                                                                    |
|-------|----------------------------------------------------------------------------------|
| R-01  | 3 columnas nuevas en `treatment_budget_items` con CHECK simple                   |
| R-02  | `patient_payments.appointment_id` ya existe → cero migration extra               |
| R-03  | Tratamientos viven en `teeth_data` jsonb por diente, no en columna separada      |
| R-04  | Insertar nuevo step `'items'` en wizard PostSession, no reescribir               |
| R-05  | Extender `registerSessionPayment` con param `budgetId` opcional                  |
| R-06  | `v_budget_balance` reusada sin cambios. Verificar índice en `pp.budget_id`       |
| R-07  | Ampliar CHECK `resource_type` con `'budget_item'`, `'payment'`                   |
| R-08  | Trigger BEFORE UPDATE para validar autoridad de reversión (FR-016)               |
| R-09  | Auto-create budget al primer tratamiento marcado en odontograma                  |
| R-10  | Reuso del `onSessionCompleted` callback ya implementado en spec 028              |
| R-11  | UI alternativa "crear budget rápido inline" para paciente sin budget             |
| R-12  | UPDATE batch con `.in()` simple. Refactor a RPC solo si smoke descubre edge case |
