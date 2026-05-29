# Contract: Frontend Components — Appointment Dentist Assignment

**Spec**: 028 | **Date**: 2026-05-29

Cambios de contrato (props, state, behavior) en cada componente frontend tocado. Sin breaking changes — todos los callers existentes siguen funcionando.

---

## 1. `src/lib/api/org.api.js`

### Cambio 1: `getOrgAppointments` admite `therapistId = null`

**Antes**:
```js
async function getOrgAppointments(organizationId, therapistId, startDate, endDate) {
  // SIEMPRE filtra por therapist_id
  .eq('organization_id', organizationId)
  .eq('therapist_id', therapistId)
  .gte('date', startDate)
  .lte('date', endDate)
}
```

**Después**:
```js
/**
 * Lista citas de la organización en un rango de fechas.
 * @param {string} organizationId
 * @param {string|null} therapistId - null = todas las citas de la org (todos los dentistas)
 * @param {string} startDate
 * @param {string} endDate
 */
async function getOrgAppointments(organizationId, therapistId, startDate, endDate) {
  let query = supabase.from('appointments').select(/* fields */)
    .eq('organization_id', organizationId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (therapistId) {
    query = query.eq('therapist_id', therapistId);
  }

  query = query.order('date').order('start_time');
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

**Backward compat**: callers que pasan therapistId siguen funcionando. Nuevo comportamiento: `null` = todas.

### Cambio 2: `getOrgBlockedTimes` y `getOrgAvailability` — sin cambio

Se siguen llamando solo cuando hay dentista filtrado. En modo "Todos los dentistas", el caller (`OrgCalendarView`) NO llama estas funciones (no se muestra availability shading ni blocked times).

---

## 2. `src/components/calendar/OrgCalendarView.jsx`

### Cambio principal: estado del filtro de dentista

**Antes**:
```js
const [selectedDentistId, setSelectedDentistId] = useState(null);
// Auto-select primer dentista alfabético
useEffect(() => {
  if (dentistList.length > 0 && !selectedDentistId) {
    setSelectedDentistId(dentistList[0].id);
  }
}, ...);
```

**Después**:
```js
import { useSearchParams } from 'react-router-dom';

const [searchParams, setSearchParams] = useSearchParams();
const selectedDentistId = searchParams.get('dentist') || null;  // null = "Todos"

const setSelectedDentistId = useCallback((id) => {
  if (!id || id === 'all') {
    searchParams.delete('dentist');
  } else {
    searchParams.set('dentist', id);
  }
  setSearchParams(searchParams, { replace: true });
}, [searchParams, setSearchParams]);

// Validación cross-org: si el dentista del URL no es de esta org, limpiar
useEffect(() => {
  if (!selectedDentistId || dentists.length === 0) return;
  const exists = dentists.some(d => d.id === selectedDentistId);
  if (!exists) {
    setSelectedDentistId(null);  // FR-011
  }
}, [selectedDentistId, dentists]);
```

### Cambio: fetch de agenda data depende del modo

```js
const fetchAgendaData = useCallback(async () => {
  if (!organizationId) return;
  setLoadingAgenda(true);
  const weekStart = format(currentWeek, 'yyyy-MM-dd');
  const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
  
  try {
    if (selectedDentistId) {
      // Modo single-dentista: fetch appointments + blocks + availability
      const [apts, blocks, availability] = await Promise.all([
        getOrgAppointments(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgBlockedTimes(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgAvailability(organizationId, selectedDentistId, weekStart, 7, clinics[0]?.id),
      ]);
      setAppointments(apts);
      setBlockedTimes(blocks);
      setAvailabilityData(availability);
    } else {
      // Modo "Todos los dentistas": solo citas, sin blocks/availability shading
      const apts = await getOrgAppointments(organizationId, null, weekStart, weekEnd);
      setAppointments(apts);
      setBlockedTimes([]);
      setAvailabilityData([]);
    }
  } catch (err) {
    /* ... */
  } finally {
    setLoadingAgenda(false);
  }
}, [organizationId, selectedDentistId, currentWeek, clinics, toast]);
```

### Cambio: UI del Card "Filters + navegación" reemplazado por Card "Ubicación" teal

Match visual con `AgendaSidebar.jsx` línea 133:
```jsx
<Card className="shadow-sm border-2 border-primary bg-primary text-white">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white">
      <MapPin className="h-4 w-4" />
      Ubicación
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* Clínica (single en Fase 1) */}
    <Select value={clinics[0]?.id} disabled>
      <SelectTrigger className="bg-white text-slate-900">
        <SelectValue>{clinics[0]?.name || 'Sin clínica'}</SelectValue>
      </SelectTrigger>
    </Select>

    {/* Box (placeholder por ahora — Fase 2) */}
    {/* TODO Fase 2: box selector si la clínica tiene múltiples boxes */}

    {/* NUEVO: Dentista filter */}
    <Select
      value={selectedDentistId || 'all'}
      onValueChange={(v) => setSelectedDentistId(v === 'all' ? null : v)}
    >
      <SelectTrigger className="bg-white text-slate-900">
        <SelectValue placeholder="Todos los dentistas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los dentistas</SelectItem>
        {dentists.map(d => (
          <SelectItem key={d.id} value={d.id}>
            Dr. {d.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </CardContent>
</Card>
```

### Cambio: navegación semanal en Card separado

```jsx
<Card>
  <CardContent className="pt-4 flex items-center gap-2">
    <Button onClick={handlePreviousWeek}>← </Button>
    <span>{weekRange}</span>
    <Button onClick={handleNextWeek}>→</Button>
    <Button variant="ghost" onClick={handleToday}>Hoy</Button>
    <Badge>{filteredAppointments.length} citas</Badge>
  </CardContent>
</Card>
```

### Cambio: pasar `dentists` a `WeeklyAgendaView` para color coding

```jsx
<WeeklyAgendaView
  currentWeek={currentWeek}
  appointments={filteredAppointments}
  blockedTimes={blockedTimes}
  availabilityData={availabilityData}
  clinics={virtualClinics}
  dentists={dentists}                      {/* NUEVO */}
  selectedDentistId={selectedDentistId}    {/* NUEVO — para resaltar el seleccionado */}
  /* ... resto igual */
/>
```

### Eliminar el filtro `statusFilter` actual

Decisión menor: el filtro "Todos los estados / Agendadas / Confirmadas..." se mantiene pero se mueve a la card de navegación. NO se elimina (no es parte de este spec).

---

## 3. `src/components/calendar/WeeklyAgendaView.jsx`

### Cambio 1: nuevo prop `dentists` y helper `getDentistColor`

Agregar al inicio del archivo:
```js
const DENTIST_COLORS = [
  { border: 'border-l-teal-500', text: 'text-teal-700', dot: 'bg-teal-500' },
  { border: 'border-l-pink-500', text: 'text-pink-700', dot: 'bg-pink-500' },
  { border: 'border-l-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' },
  { border: 'border-l-violet-500', text: 'text-violet-700', dot: 'bg-violet-500' },
  { border: 'border-l-cyan-500', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  { border: 'border-l-rose-500', text: 'text-rose-700', dot: 'bg-rose-500' },
];

export const getDentistColor = (dentistId, dentists) => {
  if (!dentistId || !dentists?.length) return null;
  const idx = dentists.findIndex(d => d.id === dentistId);
  if (idx < 0) return null;
  return DENTIST_COLORS[idx % DENTIST_COLORS.length];
};
```

### Cambio 2: aceptar `dentists` como prop

```js
const WeeklyAgendaView = ({
  /* props existentes */
  dentists = [],   // NUEVO
  /* ... */
}) => { ... }
```

### Cambio 3: aplicar border-l-4 + footer en chip de cita

Buscar el render del chip de cita (probablemente alrededor de línea 750-850). Agregar:

```jsx
{appointmentsInSlot.map(apt => {
  const dentistColor = getDentistColor(apt.therapist_id, dentists);
  const dentistName = dentists.find(d => d.id === apt.therapist_id)?.full_name || '';
  const dentistLastName = dentistName.split(' ').slice(-1)[0] || dentistName;
  
  return (
    <div
      key={apt.id}
      className={cn(
        "appointment-chip ...",
        dentistColor?.border || 'border-l-gray-300',
        "border-l-4"
      )}
      onClick={() => onAppointmentClick(apt)}
    >
      <div className="patient-name">{apt.patient?.profile?.full_name}</div>
      {dentists.length > 1 && dentistName && (
        <div className={cn("text-[10px] mt-0.5", dentistColor?.text || 'text-gray-500')}>
          Dr. {dentistLastName}
        </div>
      )}
    </div>
  );
})}
```

**Caveat**: el footer "Dr. {apellido}" solo se muestra si hay más de un dentista en la org (caso single-dentist, el footer es ruido visual).

### Backward compat
- `dentists` default a `[]` → si caller (CalendarPage del dentista) no lo pasa, helper retorna null, comportamiento actual preserved
- `border-l-gray-300` como fallback → chips sin dentista_id no se ven rotos

---

## 4. `src/components/calendar/AppointmentModal.jsx` (vista del dentista)

### Cambio 1: nuevo estado `therapistId` con default smart

**Antes**: `therapist_id: user.id` hardcoded en payload (línea 320).

**Después**:
```js
const [formData, setFormData] = useState({
  /* fields existentes */
  therapist_id: '',                  // NUEVO — selector explícito
});

// Default: dentista logueado por defecto (FR-004)
useEffect(() => {
  if (isOpen && !isEditing && !formData.therapist_id && user?.id) {
    setFormData(prev => ({ ...prev, therapist_id: user.id }));
  }
}, [isOpen, isEditing, user?.id]);

// Edit mode: cargar desde slotInfo o appointmentData
useEffect(() => {
  if (isEditing && (appointmentData || slotInfo)) {
    setFormData(prev => ({
      ...prev,
      therapist_id: appointmentData?.therapist_id || slotInfo?.therapistId || user.id
    }));
  }
}, [isEditing, appointmentData, slotInfo]);
```

### Cambio 2: Select de dentista en el form

Agregar entre "Lugar de atención" (línea 432) y "Paciente" (línea 459):

```jsx
{/* NUEVO — Dentista responsable */}
<div className="space-y-2">
  <Label>Dentista *</Label>
  <Select
    value={formData.therapist_id || ''}
    onValueChange={(v) => setFormData({...formData, therapist_id: v})}
    required
    disabled={
      // FR-014: dentista no puede reasignar cita ajena a sí mismo
      isEditing && appointmentData?.therapist_id && appointmentData.therapist_id !== user.id
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Seleccionar dentista" />
    </SelectTrigger>
    <SelectContent>
      {dentists.map(d => (
        <SelectItem key={d.id} value={d.id}>
          Dr. {d.full_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Cambio 3: nuevo fetch de `dentists`

Reusar `getOrgDentists(currentOrganizationId)`:
```js
const [dentists, setDentists] = useState([]);
useEffect(() => {
  if (isOpen && currentOrganizationId) {
    getOrgDentists(currentOrganizationId)
      .then(setDentists)
      .catch(err => logger.warn('getOrgDentists failed', err));
  }
}, [isOpen, currentOrganizationId]);
```

### Cambio 4: payload usa `formData.therapist_id` no `user.id` directo

```js
const payload = {
  therapist_id: formData.therapist_id || user.id,  // fallback de seguridad
  /* resto igual */
};
```

### Cambio 5: audit log en create/update/cancel

```js
// Después de insert/update exitoso:
import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';

const action = isEditing
  ? (formData.therapist_id !== appointmentData?.therapist_id
      ? 'appointment_reassigned'
      : 'update')
  : 'create';

const reason = action === 'appointment_reassigned'
  ? `from:${appointmentData.therapist_id};to:${formData.therapist_id}`
  : null;

await logClinicalAccess({
  organization_id: currentOrganizationId,
  user_id: user.id,
  patient_id: formData.patient_id,
  action,
  resource_type: 'appointment',
  resource_id: savedApt.id,
  grant_id: null,
  reason,
  ip_address: null,
});
```

Análogo en `handleCancelAppointment` con action `'cancel'`, y en `handleDeleteAppointment` con action `'cancel'` también (semánticamente equivalente desde audit perspective).

---

## 5. `src/components/calendar/assistant/AssistantAppointmentModal.jsx`

### Cambio 1: nuevo prop `dentists` desde OrgCalendarView

```js
const AssistantAppointmentModal = ({
  isOpen, onClose, prefilledSlot, appointmentId,
  organizationId, clinicId, onCreated, onUpdated,
  dentists = [],          // NUEVO
}) => { ... }
```

### Cambio 2: default smart por rol

Usar nuevo hook `useUserRoleInOrg`:
```js
import useUserRoleInOrg from '@/hooks/useUserRoleInOrg';

const { isDentist } = useUserRoleInOrg(organizationId);

useEffect(() => {
  if (!isOpen || isEditMode) return;
  // CREATE mode default
  if (prefilledSlot?.therapistId) {
    setTherapistId(prefilledSlot.therapistId);     // si vino del drag, respetar
  } else if (isDentist && user?.id) {
    setTherapistId(user.id);                       // admin+dentista → self
  } else {
    setTherapistId('');                            // admin/asistente puro → vacío
  }
}, [isOpen, isEditMode, prefilledSlot, isDentist, user?.id]);
```

### Cambio 3: Select de dentista visible

Agregar después del Date/Time grid (línea 379) y antes del Patient search (línea 382):

```jsx
{/* NUEVO — Dentista responsable */}
<div className="space-y-1.5">
  <Label className="text-xs">Dentista *</Label>
  <Select
    value={therapistId || ''}
    onValueChange={setTherapistId}
    disabled={
      // FR-014: dentista no puede reasignar cita ajena
      isEditMode
        && isDentist
        && originalTherapistId !== user?.id
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Seleccionar dentista" />
    </SelectTrigger>
    <SelectContent>
      {dentists.map(d => (
        <SelectItem key={d.id} value={d.id}>
          Dr. {d.full_name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {isEditMode && therapistId !== originalTherapistId && (
    <p className="text-xs text-amber-600">
      Esta cita se reasignará a otro dentista. La acción quedará registrada.
    </p>
  )}
</div>
```

### Cambio 4: state nuevo `originalTherapistId`

```js
const [originalTherapistId, setOriginalTherapistId] = useState(null);

// En el useEffect de edit:
setOriginalTherapistId(data.therapist_id);
```

### Cambio 5: audit log distingue reassign

```js
// Edit mode submit:
const isReassign = therapistId !== originalTherapistId;

const action = isReassign
  ? 'appointment_reassigned'
  : (status !== originalStatus && status === 'cancelled' ? 'cancel' : 'update');

const reason = isReassign
  ? `from:${originalTherapistId};to:${therapistId}`
  : null;

await logClinicalAccess({
  organization_id: organizationId,
  user_id: user.id,
  patient_id: selectedPatient.id,
  action,
  resource_type: 'appointment',
  resource_id: appointmentId,
  grant_id: null,
  reason,
  ip_address: null,
});
```

### Cambio 6: validación `canSubmit`

Ya cubierto — `therapistId` ya es required en `canSubmit` actual (línea 240-244). Sin cambio.

---

## 6. Nuevo hook `src/hooks/useUserRoleInOrg.js`

```js
/**
 * Hook que devuelve los roles del user logueado en una org específica.
 * @param {string|null} organizationId
 * @returns {{ roles: string[], isDentist: boolean, isClinicAdmin: boolean, isAssistant: boolean, loading: boolean }}
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

export default function useUserRoleInOrg(organizationId) {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId || !user?.id) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (error) {
          logger.warn('useUserRoleInOrg failed:', error.message);
          setRoles([]);
        } else {
          setRoles((data || []).map(r => r.role));
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, organizationId]);

  return {
    roles,
    isDentist: roles.includes('dentist'),
    isClinicAdmin: roles.includes('clinic_admin'),
    isAssistant: roles.includes('assistant'),
    loading,
  };
}
```

---

## Tabla resumen de cambios

| Archivo                                        | Tipo cambio | Líneas estimadas |
|------------------------------------------------|-------------|------------------|
| `supabase/migrations/20260529000001_...sql`    | NUEVO       | ~120             |
| `src/lib/api/org.api.js`                       | EDIT (1 fn) | +5 / -1          |
| `src/components/calendar/OrgCalendarView.jsx`  | EDIT mayor  | +60 / -30        |
| `src/components/calendar/WeeklyAgendaView.jsx` | EDIT (helper + chip render) | +40 / -2 |
| `src/components/calendar/AppointmentModal.jsx` | EDIT mayor  | +70 / -5         |
| `.../assistant/AssistantAppointmentModal.jsx`  | EDIT mayor  | +50 / -5         |
| `src/hooks/useUserRoleInOrg.js`                | NUEVO       | ~50              |
| **Total neto**                                 |             | **~390 nuevas, ~45 borradas** |
