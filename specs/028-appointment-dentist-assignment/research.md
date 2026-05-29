# Phase 0 Research — Appointment Dentist Assignment

**Spec**: 028 | **Date**: 2026-05-29

Investigación del codebase actual para validar suposiciones y resolver decisiones técnicas antes de Phase 1.

---

## R-01: ¿Existe ya una columna para el dentista responsable en `appointments`?

**Pregunta**: La spec asume que `therapist_id` (legacy de FONOKIT/Communicare) es semánticamente "dentista". ¿Es así? ¿Está NOT NULL? ¿Qué FK tiene?

**Hallazgo** (`supabase/migrations/20260401000000_baseline_schema.sql:3023-3049`):
```sql
CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,        -- ← LEGACY NAME, FK a profiles
    clinic_id uuid,
    organization_id uuid,
    box_id uuid,                       -- agregado spec 022 (clinic_boxes)
    ...
);

-- Línea 21232:
ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_therapist_id_fkey
    FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

**Decisión**: Reutilizar `therapist_id` semánticamente como "dentista responsable". NO renombramos la columna en DB (rompería refs en todo el codebase: `org.api.js`, `therapist.api.js`, ~30 archivos). El código JS sigue usando el nombre `therapist_id` para FK, pero el LABEL en UI dice "Dentista".

**Rationale**:
- NOT NULL ya enforza FR-001 (obligatorio) — sin necesidad de validación adicional a nivel DB
- ON DELETE CASCADE es razonable (si se borra el profile del dentista, sus citas también se eliminan — caso muy raro porque profiles tampoco se borran normalmente)
- Renombrar `therapist_id → dentist_id` sería un refactor cross-cutting puro → viola Principio IV (Micro-Bloques)

**Alternatives considered**:
- (a) Agregar columna nueva `dentist_id` con FK + backfill desde `therapist_id` → rechazado: duplicación, drift potencial entre dos columnas que significan lo mismo
- (b) Rename `therapist_id → dentist_id` con migration de columna + actualizar TODOS los callers → rechazado: scope creep masivo, ~30 archivos JS + 20+ migrations RLS afectadas

---

## R-02: ¿Las RLS policies actuales de `appointments` cubren FR-013/FR-014?

**Pregunta**: ¿La policy UPDATE para dentista bloquea que cambie el `therapist_id` de citas ajenas a sí mismo? ¿Permite reasignar a colega?

**Hallazgo** (`supabase/migrations/20260415100007_rls_phase1_administrative.sql:200-204`):
```sql
CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()
  );
```

**Análisis**:
- USING: el dentista solo VE citas donde `therapist_id = auth.uid()` (sus propias)
- SIN WITH CHECK: el dentista PUEDE cambiar el `therapist_id` a CUALQUIER otro uuid (incluso a un patient_id o a un dentista de otra org) si tiene acceso a la fila vía USING
- Esto ROMPE FR-022 (aislamiento entre clínicas) y FR-013 a medias (la dirección "reassign to colleague" funciona pero sin validar que sea de la misma org)

**Decisión**: La migration nueva agrega `WITH CHECK` a `appt_dentist_update`:
```sql
DROP POLICY IF EXISTS appt_dentist_update ON public.appointments;
CREATE POLICY appt_dentist_update ON public.appointments
  FOR UPDATE
  USING (
    is_org_member(organization_id, 'dentist')
    AND therapist_id = auth.uid()   -- dueño actual debe ser el caller
  )
  WITH CHECK (
    is_org_member(organization_id, 'dentist')
    AND EXISTS (                    -- nuevo therapist_id debe ser dentista activo de la org
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = therapist_id
        AND om.organization_id = appointments.organization_id
        AND om.role = 'dentist'
        AND om.is_active = true
    )
  );
```

Además, el trigger nuevo `trg_check_appointment_dentist` valida lo mismo a nivel global (cubre INSERTs del admin/asistente también).

**Rationale**: dos capas de defensa — RLS (rápida, simple) + trigger (defense in depth para los roles que la RLS permite update libre, admin/asistente).

**Alternatives considered**:
- Solo trigger sin tocar RLS → rechazado: USING sin WITH CHECK es una omisión, el WITH CHECK es la mejora correcta
- Solo RLS sin trigger → rechazado: admin/asistente tienen policies UPDATE libres (`USING (is_org_member(organization_id, 'clinic_admin'))`) y podrían asignar dentista de otra org si saben el uuid

---

## R-03: ¿El CHECK constraint de `clinical_audit_log` acepta las acciones que necesitamos?

**Pregunta**: FR-016/017 exigen `'appointment_reassigned'` + `dentist_id` en payload de create/update/cancel. ¿El CHECK actual lo permite?

**Hallazgo** (`supabase/migrations/20260415100000_organization_model_schema.sql:162-170`):
```sql
action text NOT NULL CHECK (action IN (
    'view_record', 'edit_record', 'create_record',
    'export_file', 'print_record',
    'grant_exceptional_access', 'exceptional_access'
)),
resource_type text NOT NULL CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file'
)),
```

**Bug pre-existente descubierto**: `AssistantAppointmentModal.jsx` invoca `logClinicalAccess` con:
- `action: 'view'` (línea 196) — NO está en CHECK
- `action: 'create'` (línea 307) — NO está en CHECK
- `action: 'update'` (línea 274) — NO está en CHECK
- `action: 'cancel'` (línea 274) — NO está en CHECK
- `resource_type: 'appointment'` (línea 198, 277, 309) — NO está en CHECK

Todos esos inserts fallan silenciosamente porque `clinicalAuditLogger.js:10` swallowea el error con `console.warn` y retorna `{ok: false}` (que el caller no inspecciona). El bug venía de spec 024.

**Decisión**: La migration nueva expande ambos CHECKs:
```sql
ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT clinical_audit_log_action_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_action_check CHECK (action IN (
    'view_record', 'edit_record', 'create_record',
    'export_file', 'print_record',
    'grant_exceptional_access', 'exceptional_access',
    -- nuevas para appointments (spec 028 + cierra bug pre-existente):
    'view', 'create', 'update', 'cancel',
    'appointment_reassigned'
  ));

ALTER TABLE public.clinical_audit_log
  DROP CONSTRAINT clinical_audit_log_resource_type_check;

ALTER TABLE public.clinical_audit_log
  ADD CONSTRAINT clinical_audit_log_resource_type_check CHECK (resource_type IN (
    'clinical_record', 'clinical_entry', 'odontogram',
    'diagnosis', 'document', 'full_file',
    'appointment'
  ));
```

**Rationale**: Spec 028 NECESITA `appointment_reassigned` + `resource_type='appointment'` para cumplir FR-016/017. El bonus es que el audit log del módulo asistente empieza a funcionar (los inserts ya no fallan en CHECK). NO refactorizamos los call sites existentes (eso sería spec aparte) — solo expandimos el dominio aceptado.

**Alternatives considered**:
- (a) Renombrar todos los call sites a usar el vocabulario antiguo (`'view_record'` etc.) → scope creep, viola Principio IV
- (b) Spec aparte solo para arreglar el audit bug → válido pero deja FR-016/017 de esta spec sin poder cumplirse hasta que esa otra spec haga merge
- (c) Acción `appointment_reassigned` propia → SÍ, esta es nueva y única para reasignación

---

## R-04: ¿Cómo modela hoy `OrgCalendarView` la selección de dentista?

**Pregunta**: La spec quiere "Todos los dentistas" default + filtro opcional. El componente actual ¿soporta multi-dentista o es uno por vez?

**Hallazgo** (`src/components/calendar/OrgCalendarView.jsx`):
- Línea 74: `const [selectedDentistId, setSelectedDentistId] = useState(null);`
- Línea 113-115: auto-select primer dentista alfabético al cargar → siempre hay UNO seleccionado
- Línea 133: `if (!organizationId || !selectedDentistId) return;` → no fetcha agenda sin dentista
- Línea 141: `getOrgAppointments(organizationId, selectedDentistId, ...)` → query exige therapistId
- Línea 463-474: dropdown lista dentistas, sin opción "Todos"
- Línea 506-521: `WeeklyAgendaView` recibe `clinics=virtualClinics` (array sintético con el dentista como única "clínica" para colorear) y `selectedClinic=selectedDentistId || 'all'`

**Decisión**: Refactor de `OrgCalendarView` para soportar tres estados de filtro:
- `selectedDentistId = null` → "Todos los dentistas" (default)
- `selectedDentistId = 'uuid'` → filtro por dentista específico
- Eliminar auto-select alfabético; default es null = todos

Cambios derivados:
1. `getOrgAppointments` admite `therapistId = null` → query sin `.eq('therapist_id')`
2. `getOrgBlockedTimes` y `getOrgAvailability` SOLO se ejecutan cuando `selectedDentistId !== null` (todos-mode no muestra availability shading — solo citas)
3. URL sync: `?dentist=uuid` o ausente. Hook `useSearchParams` de react-router-dom 6
4. `virtualClinics` se reemplaza por `dentistsArray` para colorear cada chip por dentista (helper `getDentistColor` nuevo, analógico a `getClinicColor`)

**Alternatives considered**:
- Mantener UI single-dentist y agregar pestañas tipo "Dr. Tagle | Dr. Ceballos | Todos" → más complejo, sin ventaja sobre dropdown
- Multiselect → over-engineered para el caso de uso (la asistente quiere ver todo OR uno, no subsets)

---

## R-05: ¿Dónde se renderiza el "cuadro teal Box 1" que la founder pidió como ubicación del dropdown?

**Pregunta**: Danissa especificó "debajo de Box 1 en el cuadro teal de Ubicación". ¿Dónde vive ese cuadro?

**Hallazgo** (`src/components/calendar/AgendaSidebar.jsx:133`):
```jsx
<Card className="shadow-sm border-2 border-primary bg-primary text-white">
  <CardHeader>... Ubicación</CardHeader>
  <CardContent>
    <Select> Clinic dropdown </Select>
    {boxes.length > 0 && <Select> Box dropdown </Select>}
    ...
  </CardContent>
</Card>
```

`AgendaSidebar` se usa SOLO en `CalendarPage.jsx` (vista del dentista). `OrgCalendarView` (asistente/admin) NO usa `AgendaSidebar` — tiene su propio header.

**Análisis**: La founder vio el cuadro teal en su vista de dentista. Pero el filtro de dentista solo tiene sentido en views multi-dentista (asistente/admin), porque el dentista RLS-bound solo ve sus propias citas — un filtro ahí no tiene contenido que filtrar.

**Decisión**: Replicar visualmente el cuadro teal "Ubicación" en `OrgCalendarView` (asistente/admin). Reemplazar el actual `<Card>` con "Filters + navegación" (línea 442-496 de OrgCalendarView) por un layout similar al de AgendaSidebar:
- Card teal con título "Ubicación"
- Dropdown de clínica (single — ya hoy `clinics[0]` es la única; placeholder por si org tiene varias)
- Dropdown de box (si aplica)
- Dropdown nuevo de dentista — default "Todos los dentistas"

En `CalendarPage.jsx` (dentista) NO agregamos el filtro — el dentista RLS solo ve lo suyo, el dropdown sería confuso (UX nullo). Esto sí cambia la interpretación literal de FR-008, pero respeta la intención (multi-dentista clinics necesitan el filtro; single-dentist clinics no).

**Trade-off documentado en la spec como assumption**: el filtro aplica a las páginas `/dashboard/assistant/agenda` y `/dashboard/clinic/agendas`. El dentista puro (`/dashboard/calendar`) no recibe filtro porque ve solo sus propias citas.

---

## R-06: ¿Cómo se persiste hoy estado de filtros en URL?

**Pregunta**: FR-010 exige que el filtro de dentista sobreviva refresh vía URL. ¿Hay patrón existente?

**Hallazgo**: NO hay uso de `useSearchParams` en `OrgCalendarView` ni en `AssistantCalendarPage` actualmente. Otros componentes del repo usan `useSearchParams` (react-router-dom 6) — patrón estándar disponible.

**Decisión**: Usar `useSearchParams` de `react-router-dom` en `OrgCalendarView`:
```jsx
import { useSearchParams } from 'react-router-dom';
const [searchParams, setSearchParams] = useSearchParams();
const selectedDentistId = searchParams.get('dentist');
const setSelectedDentistId = (id) => {
  if (id === null || id === 'all') {
    searchParams.delete('dentist');
  } else {
    searchParams.set('dentist', id);
  }
  setSearchParams(searchParams, { replace: true });
};
```

`replace: true` para no contaminar el history stack con cada cambio de filtro.

**Validación de cross-org**: FR-011 exige ignorar dentist_id de otra org. Al cargar `dentists` (línea 107 OrgCalendarView), verificar `dentists.find(d => d.id === searchParams.get('dentist'))`. Si no existe en la lista, llamar `setSelectedDentistId(null)` para limpiar el query param.

---

## R-07: ¿Cuál es el patrón existente para colorear chips del calendario?

**Pregunta**: FR-005/006 exigen "border-l-4 con color por dentista consistente". El componente actual colorea por clínica.

**Hallazgo** (`src/components/calendar/WeeklyAgendaView.jsx:19-34`):
```jsx
const CLINIC_COLORS = [
  { bg: 'bg-primary/40', border: 'border-primary', dot: 'bg-primary', label: 'text-primary' },
  { bg: 'bg-indigo-50/40', border: 'border-indigo-200', ... },
  ...
];

export const getClinicColor = (clinicId, clinics) => {
  if (!clinicId) return null;
  const idx = clinics.findIndex(c => c.id === clinicId);
  if (idx < 0) return null;
  return CLINIC_COLORS[idx % CLINIC_COLORS.length];
};
```

Patrón: índice de la lista → color del array. Determinístico mientras la lista no cambie de orden. Hoy se aplica al BG del header del día.

**Decisión**: Crear helper paralelo `getDentistColor(dentistId, dentists)` con la misma lógica. Donde se renderiza el chip de cita (también en WeeklyAgendaView), agregar `border-l-4` y `border-{color}` según `getDentistColor(apt.therapist_id, dentists)`. El footer del chip recibe texto "Dr. {apellido}".

La lista de `dentists` viene como prop nueva desde OrgCalendarView (la cual ya la tiene en estado).

**Caveat**: el orden de la lista debe ser estable. `getOrgDentists` ya hace `.sort((a, b) => a.full_name.localeCompare(b.full_name))` → stable across renders.

---

## R-08: ¿El modal del dentista (`AppointmentModal.jsx`) hace audit log hoy?

**Pregunta**: La spec exige audit log en create/update/cancel. `AssistantAppointmentModal` ya lo hace. ¿Y `AppointmentModal.jsx`?

**Hallazgo** (`src/components/calendar/AppointmentModal.jsx`):
- Línea 309-393: `handleSubmitCita` NO invoca `logClinicalAccess`
- Línea 247-264: `handleCancelAppointment` NO invoca audit
- Línea 267-291: `handleDeleteAppointment` NO invoca audit

**Decisión**: Agregar `logClinicalAccess` calls en los 3 handlers, action = `'create'`/`'update'`/`'cancel'`, resource_type = `'appointment'`. Estas actions/resource_types YA aceptadas por la CHECK ampliada de la migration.

Esto cierra otro hueco pre-existente (constitution §III gap), pero es directamente requerido por FR-016 para que todas las citas tengan trazabilidad — no se puede tener "el asistente loggea pero el dentista no".

**Rationale**: Aunque el dentista es el "dueño" de la cita (auto-acceso parcial), está modificando datos clínicos de un TERCERO (el paciente) → §III aplica.

---

## R-09: Default smart por rol — ¿cómo detecto si el user es admin+dentista vs solo admin?

**Pregunta**: FR-004 diferencia "rol dentist (puro o combinado)" → auto-self vs "clinic_admin puro" → vacío.

**Hallazgo** (`src/contexts/AuthContext.jsx` + `useCurrentOrganization` hook):
- `user.id` está disponible vía `useAuth`
- El rol del user en la org actual se determina vía consulta a `organization_members` con `user_id` y `organization_id`
- Helper `is_org_member(org_id, role)` existe a nivel SQL — pero en JS necesitamos query directa

**Decisión**: Crear util `useUserRoleInOrg(organizationId)` que devuelve `{ roles: string[], isDentist: boolean, isClinicAdmin: boolean }`. La lógica de default es:
```js
const defaultDentistId = isDentist ? user.id : null;
```

Si el user es admin+dentista, `isDentist = true` → default = self. Si es admin puro, default = null → placeholder "Seleccionar dentista".

**Implementación**: query simple:
```js
const { data } = await supabase
  .from('organization_members')
  .select('role')
  .eq('user_id', user.id)
  .eq('organization_id', organizationId)
  .eq('is_active', true);
const roles = data.map(r => r.role);
```

Cache en el hook (ref) para no re-querer en cada render.

**Alternative**: leer `user.user_metadata` — rechazado: el rol vive en `organization_members`, no en JWT (puede cambiar sin re-login).

---

## R-10: ¿Hay legacy appointments con `therapist_id` inválido que requieren backfill?

**Pregunta**: FR-019/020 hablan de backfill al `owner_user_id` de la clínica. ¿Hay rows con `therapist_id` NULL o inválido?

**Hallazgo**: `therapist_id` es `NOT NULL` desde el baseline. NO hay rows con NULL. La columna SIEMPRE tiene un uuid → la regla FR-019/020 de la spec es VACUA (no hay datos a backfilear).

**Decisión**: Eliminar el bloque de backfill de la migration. NO se aplica. FR-019/020 quedan como "documentación defensiva" en la spec — confirmamos en data-model.md que el caso no se da en producción.

Validación adicional: la migration agrega un trigger que valida que CADA `therapist_id` corresponde a un dentista activo de la org. Esto es un CHECK ex-post: si hay rows existentes donde el dentista YA NO es activo en la org (caso: dentista revocado), el trigger no las afecta (solo dispara en INSERT/UPDATE). Las citas existentes quedan visibles con el dentista anterior.

**Rationale**: NOT NULL desde día 1 + ON DELETE CASCADE → no se acumula data huérfana → backfill innecesario.

---

## R-11: ¿`AssistantAppointmentModal` necesita refactor profundo o un cambio quirúrgico?

**Pregunta**: La spec exige selector de dentista explícito. El modal actual recibe `prefilledSlot.therapistId` desde drag sin mostrar UI.

**Hallazgo**:
- Estado `therapistId` ya existe (línea 86)
- Estado `setTherapistId` se llama en línea 141 (edit) y 163 (create)
- No hay UI Select de dentista — el valor viene implícito del calendario (qué dentista estaba viendo)

**Decisión** (quirúrgico, no refactor):
1. Agregar `<Select>` "Dentista" en el form, después de Fecha/Horas y antes de "Paciente"
2. Opciones = `dentists` prop nueva pasada desde `OrgCalendarView`
3. En `useEffect` de init (línea 112-173):
   - Edit mode: setTherapistId desde data como hoy
   - Create mode: setTherapistId desde `prefilledSlot.therapistId` si está, sino desde `useUserRoleInOrg` (admin+dentista = self, admin/asistente = null)
4. Validación `canSubmit` ya incluye `!therapistId` → bloquea submit (FR-001)
5. En edit, gate permission FR-013/014:
   - Si user.id !== currentTherapistId Y user no es admin/asistente → disabled (con tooltip)
   - Si user es dentista NO asignado a la cita → disabled

**Reassign detection**: en `handleSubmit` edit mode, si `therapistId !== originalTherapistId`, registrar audit log con `action='appointment_reassigned'` (en lugar de `'update'`) y payload `{from: originalTherapistId, to: therapistId}`.

---

## R-12: ¿La function `is_org_member` puede usarse en el trigger nuevo?

**Pregunta**: El trigger BEFORE INSERT/UPDATE valida que `NEW.therapist_id` es dentista activo de la org. ¿Existe función reusable?

**Hallazgo**: `is_org_member(organization_id, role)` existe y usa `auth.uid()` implícito → NO sirve para validar un user_id arbitrario.

**Decisión**: El trigger hace query directa a `organization_members`:
```sql
CREATE OR REPLACE FUNCTION check_appointment_dentist()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = NEW.therapist_id
      AND om.organization_id = NEW.organization_id
      AND om.role = 'dentist'
      AND om.is_active = true
  ) THEN
    RAISE EXCEPTION 'dentist_not_active_in_org: el usuario % no es dentista activo de la org %', NEW.therapist_id, NEW.organization_id
      USING HINT = 'Solo se pueden asignar citas a dentistas activos de la misma organización.';
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_check_appointment_dentist
  BEFORE INSERT OR UPDATE OF therapist_id, organization_id
  ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_dentist();
```

**Rationale**: defense in depth — incluso si la app envía un therapist_id válido para Org A pero la cita es de Org B (vía bug o ataque), el trigger lo rechaza.

**Performance**: el SELECT EXISTS sobre `organization_members` con index existente `(user_id, organization_id)` → < 1ms overhead por INSERT/UPDATE.

---

## Resumen de decisiones

| ID    | Decisión                                                                          |
|-------|-----------------------------------------------------------------------------------|
| R-01  | Reutilizar `appointments.therapist_id` (no agregar columna nueva)                 |
| R-02  | Agregar `WITH CHECK` a `appt_dentist_update` + trigger global                     |
| R-03  | Expandir CHECK de `clinical_audit_log.action` y `.resource_type`                  |
| R-04  | Refactor de `OrgCalendarView` para soportar "Todos los dentistas"                 |
| R-05  | Filtro solo en `OrgCalendarView` (asistente/admin), NO en `CalendarPage` dentista |
| R-06  | URL sync vía `useSearchParams` con `replace: true`                                |
| R-07  | Helper `getDentistColor` paralelo a `getClinicColor` + border-l-4 + footer        |
| R-08  | Agregar `logClinicalAccess` en `AppointmentModal.jsx` (dentista)                  |
| R-09  | Hook `useUserRoleInOrg` para detectar admin+dentista                              |
| R-10  | NO backfill — `therapist_id` siempre NOT NULL en data existente                   |
| R-11  | Cambio quirúrgico en `AssistantAppointmentModal` (Select + audit reassign)        |
| R-12  | Trigger `check_appointment_dentist` con query directa a `organization_members`    |
