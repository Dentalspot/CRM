# Contract: Org Calendar API

**Feature**: 024-assistant-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 1 complete
**Location**: `src/lib/api/org.api.js` (new file)

Contrato del nuevo módulo `org.api.js` que encapsula las queries contra Supabase para el calendario scopeado por `organization_id`. Paralelo a `src/features/therapist/services/therapist.api.js` pero para el rol assistant (y futuro clinic_admin en spec 025).

Todas las funciones:
- Son **async**, retornan `Promise<data | throws Error>`.
- Usan el cliente `supabase` del singleton `@/lib/supabaseClient`.
- Confían en RLS para enforcement — NO hacen verificaciones de autorización en JS.
- Loguean errores no-fatales con `logger.warn`.
- Formato de fechas: **string ISO** (`'yyyy-MM-dd'`) consistente con `therapist.api.js`.

---

## 1. `getOrgDentists(organizationId)`

Lista dentistas activos de una organización (para popular el selector de dentista).

**Signature**:
```js
async function getOrgDentists(organizationId: string): Promise<Array<{
  id: string,           // therapist user_id
  full_name: string,
  email: string,
  role: 'dentist',
  is_active: true
}>>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('organization_members')
  .select(`
    user_id,
    profiles:user_id (id, full_name, email)
  `)
  .eq('organization_id', organizationId)
  .eq('role', 'dentist')
  .eq('is_active', true)
  .order('profiles(full_name)', { ascending: true });

if (error) throw error;
return (data || []).map(row => ({
  id: row.user_id,
  full_name: row.profiles?.full_name || 'Sin nombre',
  email: row.profiles?.email,
}));
```

**Preconditions**: user actual es miembro activo de `organizationId`.
**Postconditions**: retorna array vacío si no hay dentistas. Nunca retorna null.
**Errors**: throws si `organization_id` es inválido o RLS rechaza.

---

## 2. `getOrgAppointments(organizationId, therapistId, startDate, endDate)`

Lista citas de un dentista específico en un rango de fechas.

**Signature**:
```js
async function getOrgAppointments(
  organizationId: string,
  therapistId: string,
  startDate: string,  // 'yyyy-MM-dd'
  endDate: string
): Promise<Array<Appointment>>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('appointments')
  .select(`
    id, organization_id, clinic_id, therapist_id, patient_id, service_id,
    date, start_time, end_time, status, notes, created_at, updated_at,
    patient:patients!appointments_patient_id_fkey(
      id, profile:profiles!patients_profile_id_fkey(full_name, phone, email)
    ),
    therapist:profiles!appointments_therapist_id_fkey(id, full_name)
  `)
  .eq('organization_id', organizationId)
  .eq('therapist_id', therapistId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date')
  .order('start_time');

if (error) throw error;
return data || [];
```

**Preconditions**: `user_id` actual tiene `organization_members.role IN ('assistant','clinic_admin')` con `is_active=true` en `organizationId` (RLS enforcement).
**Postconditions**: retorna array vacío si no hay citas. Incluye citas `cancelled` (UI filtra).
**Errors**: throws si RLS rechaza (org no coincide).

---

## 3. `getOrgBlockedTimes(organizationId, therapistId, startDate, endDate)`

Lista bloqueos horarios de un dentista.

**Signature**:
```js
async function getOrgBlockedTimes(
  organizationId: string,
  therapistId: string,
  startDate: string,
  endDate: string
): Promise<Array<BlockedTime>>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('blocked_times')
  .select('id, therapist_id, clinic_id, date, start_time, end_time, reason')
  .eq('therapist_id', therapistId)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date')
  .order('start_time');

if (error) throw error;
return data || [];
```

**Preconditions**: RLS `blocked_times_assistant_select` (a crear) permite al asistente ver bloqueos de dentistas de su org.
**Postconditions**: array vacío si no hay bloqueos.
**Errors**: throws si RLS rechaza.

**Nota**: `organizationId` no se pasa a la query (blocked_times no tiene organization_id column), se pasa al param para forward-compat + future org-level filtering si la tabla se amplía.

---

## 4. `getOrgAvailability(organizationId, therapistId, startDate, days)`

Disponibilidad (horario base) del dentista para N días desde startDate.

**Signature**:
```js
async function getOrgAvailability(
  organizationId: string,
  therapistId: string,
  startDate: string,
  days: number
): Promise<Array<{ availability_date: string, time_slots: Array<{ time: string, available: boolean }> }>>
```

**Implementation**: reusa la RPC o función existente que consulta `therapist_availability`. Investigar si existe una RPC `get_therapist_availability` y usarla. Si no, replicar la lógica de `getTherapistAvailability` de `therapist.api.js`.

**Preconditions**: user es miembro activo de la org.
**Postconditions**: array de días con slots.

---

## 5. `searchOrgPatients(organizationId, term)`

Autocomplete de pacientes de la organización (para asignar cita).

**Signature**:
```js
async function searchOrgPatients(
  organizationId: string,
  term: string
): Promise<Array<{
  id: string,            // patient.id
  profile_id: string,
  full_name: string,
  email: string | null,
  phone: string | null
}>>
```

**Implementation**:
```js
if (!term || term.length < 2) return [];

const { data, error } = await supabase
  .from('patients')
  .select(`
    id,
    profile_id,
    profile:profiles!patients_profile_id_fkey(full_name, email, phone)
  `)
  .eq('organization_id', organizationId)
  .eq('is_active', true)
  .or(`profile.full_name.ilike.%${term}%,profile.email.ilike.%${term}%`)
  .limit(20);

if (error) throw error;
return (data || []).map(p => ({
  id: p.id,
  profile_id: p.profile_id,
  full_name: p.profile?.full_name || 'Sin nombre',
  email: p.profile?.email,
  phone: p.profile?.phone,
}));
```

**Preconditions**: `term.length >= 2`. Policy RLS `pat_assistant_select` (spec 023) permite al asistente ver pacientes de su org.
**Postconditions**: max 20 resultados. Solo pacientes activos.
**Errors**: throws si RLS rechaza o query falla.

**Compliance**: NO retorna RUT, ficha clínica, ni datos más sensibles. Solo `full_name + email + phone` — minimización Ley 21.719.

---

## 6. `getOrgServicesForTherapist(therapistId)`

Lista servicios activos de un dentista (para elegir al crear cita).

**Signature**:
```js
async function getOrgServicesForTherapist(therapistId: string): Promise<Array<{
  id: string,
  name: string,
  duration_minutes: number,
  price_clp: number,
  is_active: true
}>>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('therapist_services')
  .select('id, name, duration_minutes, price_clp, is_active')
  .eq('therapist_id', therapistId)
  .eq('is_active', true)
  .order('name');

if (error) throw error;
return data || [];
```

**Preconditions**: RLS permite al asistente leer servicios del dentista (verificar en Phase 2).
**Postconditions**: array vacío si el dentista no tiene servicios — la UI mostrará warning.

---

## 7. `createOrgAppointment(payload)`

Crea una cita nueva en nombre del asistente.

**Signature**:
```js
async function createOrgAppointment(payload: {
  organization_id: string,
  clinic_id: string,
  therapist_id: string,
  patient_id: string,
  service_id: string | null,
  date: string,        // 'yyyy-MM-dd'
  start_time: string,  // 'HH:mm:ss'
  end_time: string,
  notes: string | null,
  status: 'scheduled' | 'confirmed',
}): Promise<{ id: string, ...fullAppointment }>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('appointments')
  .insert({
    ...payload,
    status: payload.status || 'scheduled',
    created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
  })
  .select('*, patient:patients!appointments_patient_id_fkey(*, profile:profiles!patients_profile_id_fkey(full_name))')
  .single();

if (error) throw error;
if (!data) throw new Error('Insert no devolvió data — posible RLS reject silencioso');
return data;
```

**Preconditions**: RLS `appt_assistant_insert` valida permisos.
**Postconditions**: devuelve la cita creada con datos de paciente (para render inmediato). **Si no retorna data → throw** (Constitution §V UI Honesty).
**Side effects**: `useClinicalAccessLogger({ action: 'create_appointment', target_patient_id })` se invoca desde el componente que llama.

---

## 8. `updateOrgAppointment(id, changes)`

Edita una cita existente.

**Signature**:
```js
async function updateOrgAppointment(
  id: string,
  changes: Partial<{
    date: string,
    start_time: string,
    end_time: string,
    status: string,
    notes: string,
    service_id: string,
  }>
): Promise<{ id: string, ...fullAppointment }>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('appointments')
  .update(changes)
  .eq('id', id)
  .select('*')
  .single();

if (error) throw error;
if (!data) throw new Error('Update no devolvió data — posible RLS reject');
return data;
```

**Preconditions**: RLS `appt_assistant_update` valida.
**Postconditions**: cita actualizada devuelta.
**Side effects**: audit log desde el caller con action adecuado (`edit_appointment`, `cancel_appointment`).

---

## 9. `createOrgBlockedTime(payload)`

Crea un bloqueo horario.

**Signature**:
```js
async function createOrgBlockedTime(payload: {
  therapist_id: string,
  clinic_id: string,
  date: string,
  start_time: string,
  end_time: string,
  reason: string | null,
}): Promise<{ id: string, ...fullBlockedTime }>
```

**Implementation**:
```js
const { data, error } = await supabase
  .from('blocked_times')
  .insert(payload)
  .select('*')
  .single();

if (error) throw error;
if (!data) throw new Error('Insert blocked_time no devolvió data');
return data;
```

**Preconditions**: RLS `blocked_times_assistant_insert` (a crear en migration) valida que el asistente puede crear bloqueos de ese dentista.
**Postconditions**: bloqueo devuelto.
**Side effects**: NO audit log (no toca paciente).

---

## 10. `deleteOrgBlockedTime(id)`

Elimina un bloqueo.

**Signature**:
```js
async function deleteOrgBlockedTime(id: string): Promise<void>
```

**Implementation**:
```js
const { error } = await supabase
  .from('blocked_times')
  .delete()
  .eq('id', id);

if (error) throw error;
```

**Preconditions**: RLS `blocked_times_assistant_delete` valida.
**Postconditions**: row eliminada.

---

## Error handling contract

Todas las funciones:
1. Throwean `Error` de Supabase en caso de error DB/RLS.
2. Nunca devuelven `null` — usan array vacío `[]` o throw.
3. El componente caller es responsable de:
   - Try/catch en handlers
   - Toast de error user-friendly
   - No mostrar toast de success sin validar data devuelta (§V UI Honesty)

---

## Contract tests (Phase 2 tasks)

Cada función debe tener, al menos, manual smoke test documentado en quickstart.md:
1. Input válido → output esperado.
2. Input inválido (RLS rechaza) → throws con mensaje útil.
3. Scope cruzado (org ajena) → RLS throws.

No hay unit tests automatizados (coherente con codebase actual).

---

## Summary

10 funciones nuevas en `src/lib/api/org.api.js`. Contrato estable, sin dependencias a cambios de schema salvo las 3 policies RLS para `blocked_times`. Reusable por `AssistantCalendarPage` ahora y `ClinicAdminCalendarPage` (spec 025) en el futuro.
