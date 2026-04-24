# Quickstart: Assistant Rich Calendar

**Feature**: 024-assistant-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 1 complete
**Purpose**: Pasos manuales para validar el feature post-implementación. Runbook de smoke test.

---

## Pre-requisitos

Antes de correr el smoke:

- [ ] Migration `20260424XXXXXX_blocked_times_assistant_rls.sql` aplicada en DB (producción).
- [ ] Código merged a `main` y desplegado vía Vercel.
- [ ] Cuenta `clinic_admin` con clínica configurada (ej: `clinicadental.los.alamos@gmail.com`).
- [ ] Cuenta `assistant` activa en esa clínica (ej: `dentalspot.cl+asistente@gmail.com` — usar Kobe Bean Bryant, reactivar si sigue inactivo post-spec 023).
- [ ] Al menos un dentista activo en la org (o sea, row en `organization_members` con `role='dentist'`, `is_active=true`).
- [ ] El dentista tiene al menos 1 servicio activo en `therapist_services`.
- [ ] Al menos 1 paciente en la org.

Si no están cumplidos, el smoke falla en pasos específicos — el runbook señala dónde.

---

## Step 1: Reactivar Kobe (si sigue inactivo desde spec 023)

```sql
-- Reactivar Kobe como asistente activo de Los Álamos
UPDATE public.organization_members
SET is_active = true, deactivated_at = NULL
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com')
  AND role = 'assistant';
```

Verificar: `is_active = true` en query de confirmación.

---

## Step 2: Crear un dentista en la org Los Álamos (si no existe)

Esto requiere invitar a un dentista. Si no hay uno para testing, usar SQL directo:

```sql
-- Agregar un dentista ficticio (ya existente en profiles con role='therapist')
-- Elegir un user_id de profiles.role='therapist' y darle membership
INSERT INTO public.organization_members (user_id, organization_id, role, is_active, joined_at)
SELECT
  (SELECT id FROM auth.users WHERE email = 'cristobal.tagle.morales@gmail.com'),
  (SELECT organization_id FROM public.clinics WHERE therapist_id = (SELECT id FROM auth.users WHERE email = 'clinicadental.los.alamos@gmail.com')),
  'dentist',
  true,
  NOW()
ON CONFLICT (organization_id, user_id) DO UPDATE SET is_active = true, role = 'dentist';
```

Verificar que `organization_members` tiene la row nueva.

---

## Step 3: Login como Kobe (asistente)

1. Logout de sesión actual.
2. Login con `dentalspot.cl+asistente@gmail.com` + password.
3. Esperado: `RoleLandingRedirect` → `/dashboard/assistant`.

---

## Step 4: Navegar a Agenda

1. Click en "Agenda" del sidebar del asistente.
2. Esperado: se carga `AssistantCalendarPage` con:
   - Header con nombre de la clínica
   - Selector de dentista poblado con Cristóbal (u otros dentistas que hayas agregado)
   - Grid semanal Lunes-Domingo con horas 08:00-20:00
   - Navegación "Semana anterior / Hoy / Semana siguiente"
   - Toggle "Modo: Crear cita / Bloquear hora"

✅ **US1 PASSED** si ves el calendario renderizado correctamente.
❌ Si muestra "Selecciona una organización" — tu `organization_members` no está activo. Revisar Step 1.

---

## Step 5: Crear cita con drag-to-create (US2)

1. Elegir un dentista en el selector (ej: Dr. Cristóbal).
2. Asegurar que estás en modo "Crear cita" (no "Bloquear hora").
3. En el grid, arrastrar desde un slot libre (ej: 10:00 del Martes) hasta 11:00.
4. Esperado: se abre modal con fecha/hora/dentista pre-cargados.
5. En el autocomplete de paciente, buscar por nombre (ej: "Ana").
6. Seleccionar un paciente.
7. Elegir un servicio.
8. Agregar nota opcional.
9. Click "Guardar".
10. Esperado:
    - Toast verde "Cita creada"
    - Bloque azul aparece en el grid en el slot del Martes 10:00-11:00
    - NO hay refresh de página

**Verificación DB**:

```sql
SELECT id, therapist_id, patient_id, date, start_time, end_time, status, organization_id, created_by_user_id
FROM public.appointments
WHERE organization_id = (SELECT organization_id FROM public.clinics WHERE therapist_id = (SELECT id FROM auth.users WHERE email = 'clinicadental.los.alamos@gmail.com'))
ORDER BY created_at DESC
LIMIT 3;
```

Debería aparecer la cita recién creada con `created_by_user_id` = user_id de Kobe.

**Verificación audit log**:

```sql
SELECT action, actor_user_id, target_patient_id, metadata, created_at
FROM public.clinical_audit_log
WHERE actor_user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com')
  AND action = 'create_appointment'
ORDER BY created_at DESC
LIMIT 3;
```

Debería haber 1 row nueva con action='create_appointment'.

✅ **US2 PASSED** si cita se crea + audit log se escribe.

---

## Step 6: Bloquear hora con drag (US3)

1. En el calendario, activar toggle "Modo: Bloquear hora" (botón debe cambiar a rojo).
2. Arrastrar desde un slot libre (ej: 14:00 Miércoles) hasta 15:00.
3. Esperado: modal opcional con campo "Razón".
4. Escribir "Lunch" y guardar (o cancelar si el modal permite skip).
5. Esperado:
    - Toast verde "Hora bloqueada"
    - Bloque rojo semitransparente aparece en el slot 14:00-15:00 del Miércoles
    - Texto "Lunch" visible en el bloque

**Verificación DB**:

```sql
SELECT id, therapist_id, date, start_time, end_time, reason
FROM public.blocked_times
WHERE therapist_id = (SELECT id FROM auth.users WHERE email = 'cristobal.tagle.morales@gmail.com')
ORDER BY created_at DESC
LIMIT 3;
```

Debería aparecer el bloqueo recién creado.

**Verificación**: NO debe haber audit log para esta acción.

```sql
SELECT COUNT(*) FROM public.clinical_audit_log
WHERE action LIKE '%block%'
  AND actor_user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com');
-- Debe ser 0
```

✅ **US3 PASSED**.

---

## Step 7: Verificar conflicto de overlap

1. Intentar drag-to-create sobre el bloque recién creado (14:00-15:00 Miércoles).
2. Esperado: toast error "Ya existe una cita o bloqueo en ese horario" — modal NO se abre.

✅ PASSED si el conflicto se detecta client-side.

---

## Step 8: Editar cita existente (US4)

1. Click en la cita creada en Step 5.
2. Esperado: modal edit con todos los datos cargados.
3. Cambiar start_time a 10:30.
4. Guardar.
5. Esperado: cita se mueve visualmente en el grid + toast verde.

**Verificación audit**:

```sql
SELECT action, metadata FROM public.clinical_audit_log
WHERE actor_user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com')
  AND action = 'edit_appointment'
ORDER BY created_at DESC LIMIT 1;
```

Debe haber row con action='edit_appointment'.

---

## Step 9: Cancelar cita

1. Click en la cita, abrir modal edit.
2. Cambiar status a "cancelled".
3. Guardar.
4. Esperado: cita cambia a color rojo en el grid + toast.

**Verificación**:

```sql
SELECT status FROM public.appointments
WHERE id = <id_de_la_cita>;
-- status = 'cancelled'

SELECT action FROM public.clinical_audit_log
WHERE actor_user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com')
  AND action = 'cancel_appointment'
ORDER BY created_at DESC LIMIT 1;
-- action = 'cancel_appointment'
```

✅ **US4 PASSED**.

---

## Step 10: Resize de cita (US5)

1. Crear una cita nueva.
2. Tomar el borde inferior y arrastrar hacia abajo 30 min (ej: de 60 min → 90 min).
3. Esperado: end_time actualizado + cita re-renderizada con nueva duración.

**Verificación**:

```sql
SELECT start_time, end_time, updated_at FROM public.appointments
WHERE id = <id>;
```

end_time debe reflejar el resize.

✅ **US5 PASSED**.

---

## Step 11: Verificar permisos RLS (crítico)

Intentar crear una cita en **OTRA organización** via devtools:

1. Abrir DevTools → Console.
2. Ejecutar:

```js
const supabase = window.__DS_SUPABASE__ || (await import('/src/lib/supabaseClient.js')).supabase;
const result = await supabase.from('appointments').insert({
  organization_id: '00000000-0000-0000-0000-000000000000', // org ajena
  therapist_id: '11111111-1111-1111-1111-111111111111',
  patient_id: '22222222-2222-2222-2222-222222222222',
  date: '2026-12-31',
  start_time: '10:00',
  end_time: '11:00',
  status: 'scheduled'
});
console.log(result);
```

Esperado: `error` con mensaje de RLS violation. `data` = null.

✅ **SC-004 PASSED** si RLS rechaza.

---

## Step 12: Verificar que NO se expone ficha clínica

1. Click en una cita existente del asistente.
2. Esperado modal: muestra nombre paciente, teléfono, email, notas.
3. Esperado **NO** mostrado: odontograma, tratamientos, evoluciones, notas clínicas, alergias, diagnósticos, radiografías.

✅ **SC-005 PASSED** si modal es admin-level.

---

## Cleanup post-smoke

Si las citas de test ensucian la DB:

```sql
-- Eliminar citas creadas por Kobe durante smoke
DELETE FROM public.appointments
WHERE created_by_user_id = (SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente@gmail.com')
  AND date >= CURRENT_DATE;

-- Eliminar bloqueos creados por Kobe
DELETE FROM public.blocked_times
WHERE therapist_id IN (
  SELECT user_id FROM public.organization_members
  WHERE organization_id = (SELECT organization_id FROM public.clinics WHERE therapist_id = (SELECT id FROM auth.users WHERE email = 'clinicadental.los.alamos@gmail.com'))
    AND role = 'dentist'
)
AND date >= CURRENT_DATE;
```

Dejar Kobe con `is_active=true` o `false` según convención (spec 023 lo dejó inactivo).

---

## Success Criteria check

| Criterio | Validación |
|---|---|
| SC-001 ≤2s render | Observable en DevTools Performance tab |
| SC-002 ≤30s crear cita | Cronómetro manual |
| SC-003 100% audit log | Queries Step 5/8/9 |
| SC-004 0 RLS violations | Step 11 |
| SC-005 0 ficha clínica leak | Step 12 |
| SC-006 ≤1 min flujo completo | Cronómetro manual |
| SC-007 50fps navegando | DevTools Performance |
| SC-008 95% success rate drag | Telemetría Sentry post-deploy |

---

## Rollback plan

Si el smoke falla crítico post-deploy:

1. Revert commit en `main` (git revert).
2. Migration RLS nueva para `blocked_times` queda viva pero **inofensiva** (no rompe nada existente).
3. Si urge, rollback de policy manualmente:

```sql
DROP POLICY IF EXISTS blocked_times_assistant_select ON public.blocked_times;
DROP POLICY IF EXISTS blocked_times_assistant_insert ON public.blocked_times;
DROP POLICY IF EXISTS blocked_times_assistant_delete ON public.blocked_times;
```

---

## Known limitations (post-MVP)

- Vista multi-dentista (P3) no implementada — el asistente ve 1 dentista a la vez.
- Mobile no responsivo — desktop only.
- Resize de cita sin snap visual avanzado (snap a 15min funcional pero sin handle visual).
- Drag-to-move entre dentistas NO soportado — tiene que cancelar + crear nueva en el dentista correcto (o usar modal edit).

Todos documentados en spec §Assumptions + §Fuera de scope MVP.
