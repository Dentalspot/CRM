# Research: Clinic Admin Rich Calendar

**Feature**: 025-clinic-admin-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 0 complete

5 decisiones técnicas. Cero NEEDS CLARIFICATION.

---

## R-01: ¿Reusar `AssistantAppointmentModal` o crear `OrgAppointmentModal` nuevo?

**Decision**: Reusar `AssistantAppointmentModal` sin renombrar.

**Rationale**:
- El componente es agnóstico al role — ya funciona con cualquier user que pase RLS.
- Renombrar implicaría actualizar imports en spec 024 → refactor + feature en mismo PR (viola §IV).
- Podemos rebautizar a `OrgAppointmentModal` en spec futuro si surge fricción semántica.

**Alternatives considered**:
- Crear wrapper `ClinicAdminAppointmentModal` vacío → duplicación innecesaria.
- Renombrar a `OrgAppointmentModal` → refactor riesgoso ahora.

---

## R-02: Policies RLS faltantes — ¿crear mínimas o todas las operaciones?

**Decision**: Crear las **6 policies faltantes** (3 para `blocked_times` + 3 para `scheduled_reminders`) en una sola migration.

**Hallazgo verificado (grep sobre migrations)**:
- `blocked_times`: existen solo `"Therapists can manage their own blocked times"` (dueño) y las 3 `blocked_times_assistant_*` del spec 024. NO hay para clinic_admin.
- `scheduled_reminders`: mismo patrón — solo therapist dueño + las 3 `scheduled_reminders_assistant_*` del spec 024. NO hay para clinic_admin.

**Policies a crear**:

Para `blocked_times`:
```sql
blocked_times_admin_select  -- SELECT bloqueos de dentistas de su org
blocked_times_admin_insert  -- INSERT en nombre de dentista activo de su org
blocked_times_admin_delete  -- DELETE bloqueos de su org
```

Para `scheduled_reminders`:
```sql
"Org admins insert reminders"  -- INSERT — cascade del trigger en appointment insert
"Org admins update reminders"  -- UPDATE — cascade si admin edita cita
"Org admins delete reminders"  -- DELETE — cascade si admin cancela cita
```

**Pattern**: seguir exactamente el mismo shape que las policies del asistente (spec 024 migrations `20260424000001` y `20260424000002`), reemplazando `'assistant'` por `'clinic_admin'` en `is_org_member()`.

**Alternatives considered**:
- Solo `_insert` (asumir que admin no borra) → restrictivo, US3 requiere delete al desbloquear.
- Consolidar en un solo policy con OR → menos mantenible, harder to audit.

---

## R-03: ¿Extender la migration existente de spec 024 o crear una nueva?

**Decision**: Crear migration nueva `20260424000004_blocked_times_reminders_admin_rls.sql`.

**Rationale**:
- Las migrations de spec 024 ya están **aplicadas en prod**. Modificarlas post-facto es antipattern (Constitution §VI Schema Drift Zero).
- Una migration por spec es el patrón del repo (resaltado en `architecture.md §Canonical patterns`).
- Número `000004` continúa la serie limpiamente.

**Alternatives considered**:
- Agregar al commit de spec 024 → ya mergeado, no posible.
- Single migration "all assistant + admin" → habría sido ideal en spec 024 si hubiéramos anticipado 025, pero es retrospectiva.

---

## R-04: `ClinicAgendasPage` actual — ¿deprecar y eliminar, o mantener paralela?

**Decision**: **Eliminar** `src/pages/clinic/ClinicAgendasPage.jsx` tras verificar cero imports residuales.

**Rationale**:
- Consistente con spec 024 que eliminó `AssistantAgendaPage.jsx`.
- La vista lista es **inferior** visualmente a la rich calendar — no hay razón product para mantener ambas.
- Reduce deuda técnica.

**Alternatives considered**:
- Mover a `_deprecated/ClinicAgendasPage.jsx` con comentario → mantiene clutter sin beneficio.
- Mantener con toggle "vista lista / vista calendar" → scope creep, viola §IV.

---

## R-05: ¿Dónde vive `ClinicAdminCalendarPage`?

**Decision**: `src/features/clinic-dashboard/ClinicAdminCalendarPage.jsx`.

**Rationale**:
- Simétrico con `src/features/assistant/pages/AssistantCalendarPage.jsx` de spec 024.
- El directorio `clinic-dashboard/` ya existe y aloja `ClinicDashboardPageV2.jsx` — coherente ubicar otra page clinic ahí.

**Alternatives considered**:
- `src/pages/clinic/ClinicAdminCalendarPage.jsx` (donde vive el legacy `ClinicAgendasPage`) → pero `/pages/` es el directorio "legacy" del repo. `/features/` es el nuevo estándar post spec 003.

---

## Summary

| # | Decision |
|---|---|
| R-01 | Reusar `AssistantAppointmentModal` sin refactor |
| R-02 | 6 policies RLS nuevas (blocked_times + scheduled_reminders para admin) |
| R-03 | Migration nueva `20260424000004` (no modificar spec 024) |
| R-04 | Eliminar `ClinicAgendasPage.jsx` legacy |
| R-05 | `src/features/clinic-dashboard/ClinicAdminCalendarPage.jsx` |

Todo resuelto. Listo para Phase 1.
