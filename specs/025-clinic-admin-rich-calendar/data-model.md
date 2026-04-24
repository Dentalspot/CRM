# Data Model: Clinic Admin Rich Calendar

**Feature**: 025-clinic-admin-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 1 complete

## 0 entidades nuevas

Spec 025 NO introduce tablas, columnas, constraints ni triggers nuevos. Solo agrega **6 policies RLS** para extender permisos del role `clinic_admin` a dos tablas existentes.

Todas las entidades usadas son las mismas que spec 024. Ver `specs/024-assistant-rich-calendar/data-model.md` para el detalle completo:

- `organization_members` (usa role='clinic_admin' + role='dentist')
- `appointments` (policies `appt_admin_*` ya existen desde spec 023)
- `blocked_times` (policies admin a crear en esta spec)
- `scheduled_reminders` (policies admin a crear en esta spec)
- `patients`
- `profiles`
- `therapist_services`
- `clinical_audit_log`

---

## Migration pendiente

**File**: `supabase/migrations/20260424000004_blocked_times_reminders_admin_rls.sql`

**Objetivo**: agregar 6 policies RLS para que el rol `clinic_admin` pueda operar sobre `blocked_times` y `scheduled_reminders` en nombre de dentistas de su organización.

### Policies en `blocked_times`

| Policy | Operación | Check |
|---|---|---|
| `blocked_times_admin_select` | SELECT | target dentist pertenece a la org del admin |
| `blocked_times_admin_insert` | INSERT | idem + target dentist is_active=true |
| `blocked_times_admin_delete` | DELETE | target dentist pertenece a la org del admin |

**SQL pattern** (análogo a spec 024 migration):

```sql
CREATE POLICY blocked_times_admin_select ON public.blocked_times
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om_target
      WHERE om_target.user_id = blocked_times.therapist_id
        AND om_target.is_active = true
        AND public.is_org_member(om_target.organization_id, 'clinic_admin')
    )
  );
-- Análogo para insert (con is_active=true + role='dentist' en el target) y delete.
```

### Policies en `scheduled_reminders`

| Policy | Operación | Check |
|---|---|---|
| `"Org admins insert reminders"` | INSERT | target dentist en org del admin |
| `"Org admins update reminders"` | UPDATE | idem |
| `"Org admins delete reminders"` | DELETE | idem |

Siguen el mismo patrón que las del asistente (spec 024 migration `20260424000002`), reemplazando `'assistant'` por `'clinic_admin'` en `is_org_member()`.

---

## Relationship diagram (sin cambios)

Mismo que spec 024. Ver `specs/024-assistant-rich-calendar/data-model.md`.

---

## Verification pattern

Post-migration, verificar con:

```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename IN ('blocked_times', 'scheduled_reminders')
  AND (policyname ILIKE '%admin%' OR policyname ILIKE '%clinic_admin%');
```

Esperado: 6 filas (3 blocked_times + 3 scheduled_reminders).

---

## No changes to existing tables

Como spec 024, este spec **no** agrega columnas, constraints, índices ni triggers. Solo RLS policies en migration versionada. Cumple Constitution §VI.
