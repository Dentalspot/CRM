# Contracts: Clinic Admin Rich Calendar

**Feature**: 025-clinic-admin-rich-calendar

## 0 contratos nuevos

Spec 025 reusa íntegramente el contrato de spec 024:

> Ver: [`specs/024-assistant-rich-calendar/contracts/org-calendar-api.md`](../../024-assistant-rich-calendar/contracts/org-calendar-api.md)

`src/lib/api/org.api.js` es **RLS-transparent** — las mismas 10 funciones funcionan idénticamente para role `assistant` y `clinic_admin`. El cambio de permisos vive 100% en las policies DB, no en el código cliente.

## Funciones reusadas

1. `getOrgDentists(organizationId)` — policy `om_member_select` permite ambos roles
2. `getOrgClinics(organizationId)` — policy similar
3. `getOrgAppointments(organizationId, therapistId, startDate, endDate)` — `appt_admin_select` ya existe
4. `getOrgBlockedTimes(organizationId, therapistId, startDate, endDate)` — **necesita `blocked_times_admin_select`** (nueva migration)
5. `getOrgAvailability(organizationId, therapistId, startDate, days, clinicId)` — RPC `get_therapist_availability` funciona para ambos
6. `searchOrgPatients(organizationId, term)` — `pat_admin_select` + policy profiles existente
7. `getOrgServicesForTherapist(therapistId)` — lectura de therapist_services (policies existentes cubren)
8. `createOrgAppointment(payload)` — `appt_admin_insert` ya existe
9. `updateOrgAppointment(id, changes)` — `appt_admin_update` ya existe
10. `createOrgBlockedTime(payload)` — **necesita `blocked_times_admin_insert`** (nueva migration)
11. `deleteOrgBlockedTime(id)` — **necesita `blocked_times_admin_delete`** (nueva migration)

## Compliance del contrato

El contrato NO cambia. RLS es el único diferenciador de permisos. Esto preserva:
- Principio §II RLS-First Security (la seguridad vive en DB, no en código cliente)
- Principio §IV Micro-Bloques (cero refactor de API layer)

## Nuevo "contrato" implícito

`ClinicAdminCalendarPage` expone una API de una sola función:

```jsx
<ClinicAdminCalendarPage />
```

Sin props. Usa `useCurrentOrganization()` hook para resolver el contexto + renderiza `OrgCalendarView scope='clinic_admin' organizationId={currentOrganizationId}`.

No hay contratos REST/GraphQL externos — es una SPA internal page.
