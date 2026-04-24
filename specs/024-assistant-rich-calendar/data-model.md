# Data Model: Assistant Rich Calendar

**Feature**: 024-assistant-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 1 complete

Este spec no introduce entidades nuevas — reusa tablas existentes. Documentamos los campos clave que se leen/escriben y la nueva política RLS para `blocked_times`.

---

## Entidades usadas (todas existentes)

### 1. `organization_members`

Mapa de quién pertenece a qué org con qué rol.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `user_id` | uuid → auth.users | Identidad del asistente/dentista |
| `organization_id` | uuid → organizations | Scope principal del feature |
| `role` | text CHECK IN ('clinic_admin','dentist','assistant') | Determina permisos |
| `is_active` | boolean | Filtro obligatorio en todas las queries |
| `joined_at` | timestamptz | — |
| `deactivated_at` | timestamptz | — |

**Queries del feature**:
- Listado de dentistas de la org: `WHERE organization_id = X AND role = 'dentist' AND is_active = true`
- Validación del asistente actual: via `is_org_member(organization_id, 'assistant')` helper

---

### 2. `appointments`

Citas entre dentista y paciente.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `organization_id` | uuid → organizations | Scope RLS obligatorio |
| `clinic_id` | uuid → clinics | Ubicación física |
| `therapist_id` | uuid → auth.users | Dentista seleccionado en calendar |
| `patient_id` | uuid → patients | Paciente asignado |
| `service_id` | uuid → therapist_services (nullable) | Servicio del dentista |
| `date` | date | Día de la cita |
| `start_time` | time | Hora inicio |
| `end_time` | time | Hora fin (editable por resize) |
| `status` | text | scheduled / confirmed / completed / cancelled / no-show |
| `notes` | text | Notas administrativas (visibles al asistente) |
| `created_by_user_id` | uuid (nullable) | Trazabilidad — puede ser el asistente |
| `created_at`, `updated_at` | timestamptz | Audit timestamps |

**Queries del feature**:
- Listar citas de la semana: `WHERE organization_id = X AND therapist_id = Y AND date BETWEEN startOfWeek AND endOfWeek`
- Crear cita: `INSERT` con todos los campos (organization_id obligatorio para RLS)
- Editar cita: `UPDATE` por id, validar `is_org_member('assistant')` en policy
- Cancelar: `UPDATE SET status = 'cancelled'` (NO `DELETE` — preserva histórico)

**RLS policies relevantes (ya existentes en `20260415100007_rls_phase1_administrative.sql`)**:
- `appt_assistant_select`: asistente ve citas de su org
- `appt_assistant_insert`: asistente crea citas en su org
- `appt_assistant_update`: asistente edita citas de su org
- *(NO hay `appt_assistant_delete` — intencional, cancelamos por status)*

---

### 3. `blocked_times`

Bloqueos horarios del dentista.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `therapist_id` | uuid → auth.users | Dentista cuyo slot está bloqueado |
| `clinic_id` | uuid → clinics | Clínica donde el bloqueo aplica |
| `date` | date | Día del bloqueo |
| `start_time` | time | Hora inicio |
| `end_time` | time | Hora fin |
| `reason` | text (nullable) | Ej: "Lunch", "Reunión externa" |
| `created_at` | timestamptz | — |

**Queries del feature**:
- Listar bloqueos de la semana: `WHERE therapist_id = Y AND date BETWEEN startOfWeek AND endOfWeek`
- Crear bloqueo: `INSERT` — valida que el asistente puede crear en nombre del dentista
- Eliminar bloqueo: `DELETE` — valida permisos

**RLS policies**:
- **Existentes**: `"Therapists can manage their own blocked times"` — solo el dueño therapist.
- **A crear** (migration `20260424XXXXXX_blocked_times_assistant_rls.sql`):
  - `blocked_times_assistant_select`
  - `blocked_times_assistant_insert`
  - `blocked_times_assistant_delete`
  - (no update — se borra y recrea)

Ver detalle de policies en `research.md §R-04`.

---

### 4. `therapist_availability`

Horario base semanal del dentista.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `therapist_id` | uuid → auth.users | — |
| `clinic_id` | uuid → clinics | — |
| `day_of_week` | int 0-6 | — |
| `start_time`, `end_time` | time | — |

**Queries del feature**:
- Listar disponibilidad: read-only via el servicio existente `getTherapistAvailability` adaptado a `getOrgAvailability(organization_id, therapist_id, startDate, days)`.
- El asistente **NO modifica** esta tabla.

**RLS**: ya permite lectura a miembros de la org (via policies existentes).

---

### 5. `therapist_services`

Servicios ofrecidos por cada dentista.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `therapist_id` | uuid → auth.users | Dentista dueño del servicio |
| `name` | text | Nombre visible del servicio |
| `duration_minutes` | int | Duración default |
| `price_clp` | numeric | Precio en CLP |
| `is_active` | boolean | Filtro obligatorio |

**Queries del feature**:
- Listar servicios activos de un dentista (al crear cita): `WHERE therapist_id = Y AND is_active = true`
- El asistente **NO modifica** esta tabla.

---

### 6. `patients`

Pacientes de la clínica.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `organization_id` | uuid → organizations | Scope RLS |
| `profile_id` | uuid → profiles | Relación con datos personales |
| `is_active` | boolean | Filtro en autocomplete |

**Queries del feature**:
- Autocomplete para selección en modal: `SELECT p.id, prof.full_name, prof.email, prof.phone FROM patients p JOIN profiles prof ON prof.id = p.profile_id WHERE p.organization_id = X AND p.is_active = true AND (prof.full_name ILIKE '%term%' OR prof.email ILIKE '%term%') LIMIT 20`
- El asistente **NO ve** ficha clínica detallada (`patient_clinical_record`).

**RLS**: `pat_assistant_select` (spec 023) permite al asistente ver pacientes de su org.

---

### 7. `profiles`

Datos personales de cada usuario (dentista, paciente, asistente).

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK = auth.users.id | — |
| `full_name` | text | Visible en selector de dentista y autocomplete paciente |
| `email` | text | Visible en autocomplete paciente |
| `phone` | text | Visible en modal de cita |
| `role` | user_role enum | — |

**RLS relevante**:
- `"Clinic admins can view org members profiles"` (spec 023 migration 20260423000005) — permite al clinic_admin leer profiles de cualquier org member.
- Para el asistente: usa `profiles_select_own` + la policy del org admin indirectamente. Necesitamos verificar si el **asistente** puede leer profiles de sus co-miembros.

**Verificación pendiente en Phase 2**: revisar si `profiles` tiene policy que permite al asistente leer profiles de dentistas/pacientes de su org. Si no existe, agregar:

```sql
CREATE POLICY "Org assistants can view member profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om_self
      JOIN organization_members om_other
        ON om_self.organization_id = om_other.organization_id
      WHERE om_self.user_id = auth.uid()
        AND om_self.role = 'assistant'
        AND om_self.is_active = true
        AND om_other.user_id = profiles.id
        AND om_other.is_active = true
    )
  );
```

**Decisión**: incluir esta verificación en tasks (Phase 2). Si falta, agregar a la migration de `blocked_times_assistant_rls.sql` como complemento.

---

### 8. `clinical_audit_log`

Log append-only de accesos a datos clínicos por terceros.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `actor_user_id` | uuid → auth.users | El asistente actuante |
| `action` | text | `create_appointment`, `edit_appointment`, `cancel_appointment`, `view_patient_in_appointment` |
| `target_patient_id` | uuid → patients | Paciente afectado |
| `metadata` | jsonb (nullable) | Contexto adicional (appointment_id, changes) |
| `created_at` | timestamptz | — |

**Queries del feature**:
- INSERT via `useClinicalAccessLogger` hook — el hook ya filtra por role y escribe solo si es necesario.

**RLS**: INSERT permitido a cualquier authenticated user. SELECT solo a admin plataforma.

---

### 9. `clinics`

Clínicas físicas.

| Campo | Tipo | Uso en este spec |
|---|---|---|
| `id` | uuid PK | — |
| `organization_id` | uuid → organizations | Relación con org |
| `therapist_id` | uuid → auth.users | Admin/dueño (legacy column name — se mantiene) |
| `name` | text | Mostrado en header del calendario |
| `timezone` | text | Usada para renderizar horas locales |

**Queries del feature**:
- Obtener clinic de la org actual (para timezone + color coding): `WHERE organization_id = X LIMIT 1`

---

## State Transitions

### Appointment status

Estados y transiciones permitidas desde la vista del asistente:

```
scheduled ──(asistente confirma)──> confirmed
scheduled ──(asistente cancela)──> cancelled
confirmed ──(asistente cancela)──> cancelled
confirmed ──(dentista / auto)──> completed
```

El asistente NO puede cambiar `completed` o `cancelled` a otros estados (lógica en modal edit).

### Blocked_time lifecycle

```
(nonexistent) ──(asistente crea)──> exists
exists ──(asistente borra)──> (nonexistent)
```

No hay estados intermedios. Update no aplica — borrar + crear si se quiere mover.

---

## Relationship diagram

```
organizations ─┬── clinics ── [referenced by] ── appointments, blocked_times
               └── organization_members (user_id) ── profiles
                                                         └── [user_id = therapist_id of] ── appointments, blocked_times, therapist_services, therapist_availability

appointments ──(patient_id)── patients ──(profile_id)── profiles

clinical_audit_log ──(actor_user_id)── auth.users
                   ──(target_patient_id)── patients
```

---

## Migration pending (Phase 2 task)

**File**: `supabase/migrations/20260424XXXXXX_blocked_times_assistant_rls.sql`

**Content**: ver research.md §R-04 para el SQL completo.

**Objetivo**: permitir a role='assistant' gestionar bloqueos de dentistas de su organización sin romper el patrón existente (dentistas siguen gestionando los propios).

**Verificación adicional**: si la policy `"Org assistants can view member profiles"` no existe en profiles, incluirla en la misma migration.

---

## No changes to existing tables

Este spec **no** agrega columnas, constraints, índices ni triggers nuevos a tablas existentes. Solo agrega RLS policies. Cumple Constitution §VI (Schema Drift Zero) porque las policies nuevas están en migration versionada.
