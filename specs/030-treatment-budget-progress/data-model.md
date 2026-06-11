# Phase 1 Data Model — Treatment Budget With Progress

**Spec**: 030 | **Date**: 2026-06-03

Sin nuevas tablas. 3 columnas nuevas en `treatment_budget_items` + 2 nuevas RLS policies + 1 trigger + ampliación de CHECK constraint en `clinical_audit_log`.

---

## Entidad principal: `treatment_budget_items`

### Estado actual (no se modifica)

```sql
CREATE TABLE public.treatment_budget_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id     uuid NOT NULL REFERENCES treatment_budgets(id) ON DELETE CASCADE,
  service_id    uuid REFERENCES therapist_services(id),
  description   text NOT NULL,
  quantity      integer NOT NULL DEFAULT 1,
  unit_price    numeric NOT NULL DEFAULT 0,
  subtotal      numeric NOT NULL DEFAULT 0,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

### Cambios introducidos por spec 030

#### 3 columnas nuevas

```sql
ALTER TABLE public.treatment_budget_items
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed')),
  ADD COLUMN completed_at timestamptz NULL,
  ADD COLUMN completed_in_appointment_id uuid NULL
    REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Índice parcial para queries del tipo "items pending del paciente"
CREATE INDEX IF NOT EXISTS idx_tbi_pending_by_budget
  ON public.treatment_budget_items (budget_id, status)
  WHERE status = 'pending';

-- Índice para audit / reportes "qué items se completaron en esta cita"
CREATE INDEX IF NOT EXISTS idx_tbi_completed_in_apt
  ON public.treatment_budget_items (completed_in_appointment_id)
  WHERE completed_in_appointment_id IS NOT NULL;
```

**Constraints lógicos** (no enforced en DB, validados en app):
- Si `status = 'completed'` → `completed_at NOT NULL AND completed_in_appointment_id NOT NULL`
- Si `status = 'pending'` → `completed_at NULL AND completed_in_appointment_id NULL`

Podemos enforced con CHECK adicional pero por simplicidad lo dejamos para app-level. Si vemos drift, agregamos.

#### Trigger BEFORE UPDATE — validar autoridad de reversión (FR-016)

```sql
CREATE OR REPLACE FUNCTION public.check_budget_item_revert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_original_dentist uuid;
  v_org_id uuid;
BEGIN
  -- Solo aplica cuando se está revirtiendo (completed → pending)
  IF OLD.status = 'completed' AND NEW.status = 'pending' THEN
    -- Reset de campos
    NEW.completed_at = NULL;
    NEW.completed_in_appointment_id = NULL;

    -- Obtener dentista original y org del budget
    SELECT a.therapist_id, b.clinic_id INTO v_original_dentist, v_org_id
    FROM public.appointments a
    JOIN public.treatment_budgets b ON b.id = OLD.budget_id
    JOIN public.clinics c ON c.id = b.clinic_id
    WHERE a.id = OLD.completed_in_appointment_id;

    -- Autoridad: o el dentista original, o clinic_admin de la org
    IF v_original_dentist != auth.uid() AND NOT is_org_member((SELECT organization_id FROM clinics WHERE id = v_org_id), 'clinic_admin') THEN
      RAISE EXCEPTION 'unauthorized_revert: solo el dentista que marcó este item o un admin pueden revertirlo'
        USING HINT = 'Pedile al dentista original o a un admin que haga la reversión.';
    END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_check_budget_item_revert ON public.treatment_budget_items;
CREATE TRIGGER trg_check_budget_item_revert
  BEFORE UPDATE OF status ON public.treatment_budget_items
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.check_budget_item_revert();
```

**Rationale**: RLS solo puede validar al INSERT/UPDATE/DELETE row-level. La regla "revertir solo si sos el dentista original" requiere comparar campos OLD vs NEW + lookup en otra tabla — solo posible con trigger.

#### Nuevas RLS policies sobre `treatment_budget_items`

Asumiendo que policies SELECT/INSERT/DELETE ya existen (verificar y agregar si faltan). Nuevas para UPDATE:

```sql
-- Dentist puede UPDATE items (incluido tildar como completed)
DROP POLICY IF EXISTS tbi_dentist_update ON public.treatment_budget_items;
CREATE POLICY tbi_dentist_update ON public.treatment_budget_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member((SELECT organization_id FROM clinics WHERE id = b.clinic_id), 'dentist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member((SELECT organization_id FROM clinics WHERE id = b.clinic_id), 'dentist')
    )
  );

-- Clinic_admin puede UPDATE items (full access)
DROP POLICY IF EXISTS tbi_admin_update ON public.treatment_budget_items;
CREATE POLICY tbi_admin_update ON public.treatment_budget_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member((SELECT organization_id FROM clinics WHERE id = b.clinic_id), 'clinic_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatment_budgets b
      WHERE b.id = treatment_budget_items.budget_id
        AND is_org_member((SELECT organization_id FROM clinics WHERE id = b.clinic_id), 'clinic_admin')
    )
  );
```

**Sin policy de assistant para UPDATE**: el rol assistant NO puede UPDATE → FR-014 cumplido.

---

## Entidad de apoyo: `clinical_audit_log`

### Cambios introducidos por spec 030

Ampliar `resource_type_check` para aceptar nuevos values:

```sql
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT clinical_audit_log_resource_type_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_resource_type_check
  CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment',                   -- spec 028
    'budget_item', 'payment'         -- spec 030 NEW
  ));
```

Action ya cubre `create` / `update` / `cancel` (de spec 028) — sin cambios.

### Payload típico para spec 030

#### Marcar item como completed
```json
{
  "organization_id": "uuid",
  "user_id": "uuid del dentista",
  "patient_id": "uuid del paciente del budget",
  "action": "update",
  "resource_type": "budget_item",
  "resource_id": "uuid del item",
  "reason": "completed_in_appointment:<apt_uuid>"
}
```

#### Revertir item (completed → pending)
```json
{
  "...",
  "action": "update",
  "resource_type": "budget_item",
  "resource_id": "uuid del item",
  "reason": "reverted_by:<user_uuid>;original_appointment:<apt_uuid>"
}
```

#### Crear pago desde PostSession
```json
{
  "...",
  "action": "create",
  "resource_type": "payment",
  "resource_id": "uuid del payment",
  "reason": "from_postsession:<apt_uuid>"
}
```

---

## Entidad: `treatment_budgets` (sin cambios)

Reutilizada tal cual. Solo nota: cuando spec 030 auto-crea un budget desde odontograma, se inserta en `status = 'draft'` con `title = 'Plan de tratamiento — {patient.full_name}'`.

## Entidad: `patient_payments` (sin cambios estructurales)

Verificado en R-02: ya tiene `appointment_id`, `budget_id`, `commission_percent`. Spec 030 solo extiende el flow de uso (PostSession ahora pre-rellena monto y vincula budget_id).

## Entidad: `appointments` (sin cambios)

Spec 028 ya cableó el callback `onSessionCompleted` que dispara PostSessionModal.

## Entidad: `odontograms` (sin cambios estructurales)

`teeth_data` jsonb sigue siendo source of truth visual. Spec 030 NO migra esta data — los tratamientos pasan a `treatment_budget_items` PROSPECTIVAMENTE (a partir de spec 030 cada nuevo tratamiento en odontograma crea un item). Los pocos tratamientos legacy dentro de teeth_data (estimado < 10 en producción) se materializan manualmente en una sesión administrativa post-deploy.

---

## Resumen de impacto en data

| Cambio                                                          | Tipo            | Afecta data existente |
|----------------------------------------------------------------|-----------------|----------------------|
| 3 columnas en `treatment_budget_items` (con default 'pending') | Modificación    | NO (default seguro)  |
| Índices nuevos parciales                                       | Modificación    | NO                   |
| Trigger `trg_check_budget_item_revert`                         | Nuevo           | NO (BEFORE UPDATE)   |
| 2 RLS policies UPDATE (dentist + admin)                        | Modificación    | NO (no rompe SELECT) |
| `clinical_audit_log_resource_type_check` ampliado              | Modificación    | NO (acepta más, no rechaza menos) |
| Nuevas tablas                                                  | NINGUNO         | N/A                  |
| Backfill de data                                               | NINGUNO         | N/A                  |

**Migración reversible**: sí. Rollback drop policies + drop trigger + drop columnas. Sin pérdida de data (existing rows mantienen default 'pending').
