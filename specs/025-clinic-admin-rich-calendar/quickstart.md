# Quickstart: Clinic Admin Rich Calendar

**Feature**: 025-clinic-admin-rich-calendar
**Purpose**: Runbook smoke test post-implementación.

---

## Pre-requisitos

- [ ] Migration `20260424000004_blocked_times_reminders_admin_rls.sql` aplicada.
- [ ] Frontend deployado (merge a main + Vercel).
- [ ] Cuenta clinic_admin con clínica configurada (`clinicadental.los.alamos@gmail.com` — Odontología Los Álamos).
- [ ] Al menos 1 dentista activo en `organization_members` (Cristóbal está como dentist desde spec 024 smoke prep).
- [ ] Al menos 1 paciente en la org (Kobe Paciente quedó linkeado desde spec 024).

---

## Step 1: Login como clinic_admin

1. Logout de cualquier sesión activa.
2. Login con `clinicadental.los.alamos@gmail.com`.
3. `RoleLandingRedirect` debe rutear a `/dashboard/clinic`.

---

## Step 2: Navegar a Agendas

1. Sidebar → click en **Agendas**.
2. URL: `/dashboard/clinic/agendas`.

**Esperado**:
- Grid semanal Lun-Dom con horas 08:00-20:00.
- Selector de dentista arriba con Cristóbal listado.
- Badges "Click = crear / Drag = bloquear".
- Navegación prev/hoy/next.
- Filtro por estado.

**Failure mode común**:
- Si ves `ClinicAgendasPage` legacy (vista lista) → route no se actualizó.
- Si ves "Sin dentistas asociados" → `getOrgDentists` query falló (chequear DevTools).

✅ **US1 PASSED** si ves el calendario rich.

---

## Step 3: Crear cita con drag (US2)

1. Elegir Cristóbal en el selector.
2. Drag sobre slot libre (ej. Martes 10:00 → 11:00).
3. Modal "Nueva cita" abre.
4. Autocomplete paciente → buscar "Kobe" → seleccionar.
5. Servicio (warning si Cristóbal no tiene servicios — dejar "Sin servicio").
6. Click "Crear cita".

**Esperado**:
- Toast "✅ Cita creada".
- Cita azul aparece en el grid.

**Verificación DB**:
```sql
SELECT a.id, a.date, a.start_time, a.status, t.email AS therapist_email
FROM appointments a
JOIN auth.users t ON t.id = a.therapist_id
WHERE a.organization_id = '0d07b61c-cb45-4bd8-97f7-ec4c82ba80ec'
ORDER BY a.created_at DESC LIMIT 1;
```

Row reciente con therapist_email=Cristóbal.

✅ **US2 PASSED**.

---

## Step 4: Bloquear hora con drag (US3)

1. Drag sobre slots libres (ej. Jueves 14:00-15:00).
2. Dialog "Bloquear hora" abre.
3. Escribir razón "Reunión" → Bloquear.

**Esperado**:
- Bloque rojo semitransparente en el grid.
- Toast "✅ Hora bloqueada".

**Verificación DB**:
```sql
SELECT id, therapist_id, start_time, end_time, reason
FROM blocked_times
WHERE therapist_id = (SELECT id FROM auth.users WHERE email = 'cristobal.tagle.morales@gmail.com')
ORDER BY created_at DESC LIMIT 1;
```

Esperado: row nueva con el rango correcto. Si **PGRST** / RLS error → migration no aplicada.

### Test: desbloquear

1. Click en el bloque rojo.
2. Dialog "¿Desbloquear esta hora?" → Desbloquear.
3. Bloque desaparece.

✅ **US3 PASSED**.

---

## Step 5: Editar cita (US4)

1. Click en la cita creada en Step 3.
2. Modal "Editar cita" abre con datos cargados.
3. Cambiar status a **Confirmada** → Guardar.

**Esperado**:
- Cita cambia a **azul** (color confirmed).
- Toast "✅ Cita actualizada".
- `appointments.status='confirmed'` + `updated_at` refresh.

### Test: drag-to-move

1. Drag la cita a otro slot libre (ej. Miércoles 15:00).
2. Soltar.

**Esperado**:
- Cita se mueve visualmente.
- Toast "✅ Cita movida".

✅ **US4 PASSED**.

---

## Step 6: Regression check — asistente sigue funcionando

1. Logout.
2. Login como Kobe (`dentalspot.cl+asistente@gmail.com`).
3. Navegar a Agenda (`/dashboard/assistant/agenda`).

**Esperado**:
- Calendario rich visible (mismo comportamiento que spec 024 smoke).
- Las citas que el admin creó en Step 3-5 aparecen también (cross-sync).

✅ **SC-003 PASSED** — 0 regresiones en asistente.

---

## Step 7: RLS security check (SC-004)

Como Kobe (sesión del Step 6), abrir DevTools Console:

```js
// Intentar crear cita en otra org (no Los Álamos)
const { data, error } = await window.supabase
  .from('appointments')
  .insert({
    organization_id: '00000000-0000-0000-0000-000000000000',
    therapist_id: '11111111-1111-1111-1111-111111111111',
    patient_id: '22222222-2222-2222-2222-222222222222',
    date: '2026-12-31',
    start_time: '10:00',
    end_time: '11:00',
    status: 'scheduled'
  });
console.log({ data, error });
```

**Esperado**:
- `error` con RLS violation.
- `data: null`.

Luego logueate como Cristóbal admin y repetir con otra org_id. **Esperado**: mismo RLS reject.

✅ **SC-004 PASSED**.

---

## Success Criteria check

| Criterio | Validación |
|---|---|
| SC-001 ≤2s carga | Observable en DevTools Performance |
| SC-002 paridad admin vs asistente | Steps 3-5 vs spec 024 steps 5-10 |
| SC-003 0 regresiones asistente | Step 6 |
| SC-004 0 RLS violations | Step 7 |
| SC-005 95% success drag | Telemetría post-deploy (Sentry) |
| SC-006 sin downtime deploy | Vercel deploy log |

---

## Rollback plan

Si smoke falla crítico post-deploy:

1. Revert commits (git revert).
2. Migration: las 6 policies nuevas son **seguras por sí solas** (solo agregan permisos, no quitan). Si hay que rollback por otra razón:
   ```sql
   DROP POLICY IF EXISTS blocked_times_admin_select ON public.blocked_times;
   DROP POLICY IF EXISTS blocked_times_admin_insert ON public.blocked_times;
   DROP POLICY IF EXISTS blocked_times_admin_delete ON public.blocked_times;
   DROP POLICY IF EXISTS "Org admins insert reminders" ON public.scheduled_reminders;
   DROP POLICY IF EXISTS "Org admins update reminders" ON public.scheduled_reminders;
   DROP POLICY IF EXISTS "Org admins delete reminders" ON public.scheduled_reminders;
   ```

---

## Known limitations (heredadas de spec 024)

- Audit log de appointments: falla silenciosamente (CHECK constraint). Followup registrado.
- Resize de cita con handles: no implementado. Alternativa: editar end_time via modal.
- Multi-dentista view: out of scope MVP.
- Reasignar cita a otro dentista: out of scope MVP.
