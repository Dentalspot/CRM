# Research: Assistant Rich Calendar

**Feature**: 024-assistant-rich-calendar
**Date**: 2026-04-24
**Status**: Phase 0 complete

Resuelve las decisiones técnicas y alternativas descartadas antes del diseño. Cero `NEEDS CLARIFICATION` pendientes — todas las opciones se decidieron con defaults razonables documentados en spec.md §Assumptions.

---

## R-01: ¿Reutilizar `WeeklyAgendaView` o crear componente nuevo?

**Decision**: Reutilizar `WeeklyAgendaView` **sin modificar**.

**Rationale**:
- Lectura del componente (`src/components/calendar/WeeklyAgendaView.jsx`) muestra que ya es genérico:
  - Acepta `appointments`, `blockedTimes`, `availabilityData`, `clinics` como arrays de props.
  - No asume nada sobre scope (user.id vs org_id) — solo renderiza lo que recibe.
  - Handlers como `onSlotClick`, `onAppointmentClick`, `onBlockDragCreate` delegan la acción al padre.
- No tocar el componente respeta Constitution §IV (micro-bloques — evita mezclar refactor con feature nueva) y §V (no romper UI del dentista en este bloque).

**Alternatives considered**:
- Crear `WeeklyAgendaViewV2` con soporte multi-dentista (colores por dentista en vez de por clínica) — **descartado**: P3 multi-dentista está fuera de scope MVP. Se pospone a spec futuro.
- Forkear a `AssistantWeeklyAgendaView` con lógica específica — **descartado**: duplicación prematura. Si surge necesidad de branching lógico, se extrae a subcomponente después.

**Nota**: el color coding del componente actual es "por clínica" (`CLINIC_COLORS` mapea clinicId → color). Para el asistente pasaremos clinics=[{id: selectedDentist, ...}] emulando "1 dentista = 1 clínica virtual" para coherencia visual. Es un hack temporal aceptable — si el color se vuelve problemático se parametriza en spec separado.

---

## R-02: ¿`OrgCalendarView` o `AssistantCalendarPage` directo?

**Decision**: Crear `OrgCalendarView` como componente **genérico** en `src/components/calendar/`. `AssistantCalendarPage` es solo un wrapper fino que le pasa `scope='assistant'` (futuro `scope='clinic_admin'` para spec 025).

**Rationale**:
- User input explícito durante el spec: "despues podemos replicar lo mismo con la Agenda de la vista de la Clinica cierto?" → SÍ, y el wrapper genérico es la forma de hacer el spec 025 un trabajo trivial (1-2h).
- `OrgCalendarView` encapsula:
  - Fetch de citas/bloqueos/disponibilidad via `org.api.js`
  - Selector de dentista
  - Manejo de estado del calendario (semana actual, filtros, modales)
  - Invocación de `useClinicalAccessLogger` al crear/editar citas
- El prop `scope` solo controla diferencias menores de UI (posible futuro: botones "Reasignar a otro dentista" visible solo para clinic_admin).

**Alternatives considered**:
- Hacer lógica en `AssistantCalendarPage` directamente — **descartado**: fuerza duplicar 80% del código cuando lleguemos al clinic_admin.
- Extraer después vía refactor — **descartado**: sabemos que el clinic_admin va en 025 (user confirmó), el refactor ex-post es más caro.

---

## R-03: ¿Crear `org.api.js` nuevo o adaptar `therapist.api.js`?

**Decision**: Crear `src/lib/api/org.api.js` **paralelo** a `therapist.api.js`. No modificar el existente.

**Rationale**:
- `therapist.api.js` tiene funciones scopeadas por `therapist_id` (SELECT WHERE therapist_id = X). Agregar un param opcional `organization_id` contaminaría la API y podría romper callers.
- El nuevo `org.api.js` tiene funciones diferentes en firma: `getOrgAppointments(organizationId, therapistId, startDate, endDate)` — el `therapistId` es el dentista seleccionado (no el user actual).
- Constitution §IV: micro-bloques. No mezclar refactor de therapist.api con feature nueva.

**Alternatives considered**:
- Modificar `therapist.api.js` con params opcionales — **descartado**: riesgo de regresión en `CalendarPage` del dentista.
- Crear `assistant.api.js` específico — **descartado**: menos reutilizable para spec 025 clinic_admin. `org.api.js` es el nombre más descriptivo del scope.

**Funciones previstas** en `org.api.js`:
```
getOrgAppointments(organizationId, therapistId, startDate, endDate)
getOrgBlockedTimes(organizationId, therapistId, startDate, endDate)
getOrgAvailability(organizationId, therapistId, startDate, days)
getOrgDentists(organizationId)         // list de dentistas activos de la org
getOrgClinics(organizationId)          // clinica(s) de la org para color coding + availability
searchOrgPatients(organizationId, term)  // reemplaza searchPatientsForAgenda scopeado por org
```

---

## R-04: RLS policies para `blocked_times` — ¿crear nuevas o usar policy genérica?

**Decision**: Crear migration `20260424XXXXXX_blocked_times_assistant_rls.sql` con 3 policies específicas + mantener la policy existente del dentista.

**Hallazgo**: la única policy existente sobre `blocked_times` es `"Therapists can manage their own blocked times" ON blocked_times TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()))`. Esta permite al dentista CRUD sus propios bloqueos pero NO permite al asistente crearlos en nombre de un dentista.

**Policies a crear** (siguiendo el patrón de `appt_assistant_*`):

```sql
-- Assistant puede SELECT bloqueos de dentistas de su organization
CREATE POLICY blocked_times_assistant_select ON public.blocked_times
  FOR SELECT USING (
    is_org_member(
      (SELECT organization_id FROM organization_members
       WHERE user_id = blocked_times.therapist_id LIMIT 1),
      'assistant'
    )
  );

-- Assistant puede INSERT bloqueos en nombre de dentistas activos de su org
CREATE POLICY blocked_times_assistant_insert ON public.blocked_times
  FOR INSERT WITH CHECK (
    -- El dentista referenciado debe ser miembro activo de la misma org que el asistente
    EXISTS (
      SELECT 1 FROM organization_members om_target
      WHERE om_target.user_id = therapist_id
        AND om_target.role = 'dentist'
        AND om_target.is_active = true
        AND is_org_member(om_target.organization_id, 'assistant')
    )
  );

-- Assistant puede DELETE bloqueos creados en su org
CREATE POLICY blocked_times_assistant_delete ON public.blocked_times
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om_target
      WHERE om_target.user_id = therapist_id
        AND om_target.is_active = true
        AND is_org_member(om_target.organization_id, 'assistant')
    )
  );
```

**Alternatives considered**:
- Agregar `organization_id` column a `blocked_times` para query más directa — **descartado**: requiere backfill + trigger de sync (Constitution §VI patrón canónico). Costo mayor a beneficio en MVP. El join vía `organization_members` es aceptable performance-wise (indice existente).
- Usar RPC function en vez de policies — **descartado**: RLS es el patrón del proyecto (Constitution §II). RPCs son reserva para lógica compleja.

**Enforcement adicional en policy INSERT**:
- Si el `therapist_id` del bloqueo NO es un dentista activo de la org del asistente → REJECT.
- Si el asistente no es miembro activo de la org del dentista → REJECT.

---

## R-05: Audit log — ¿qué eventos y con qué action name?

**Decision**: invocar `useClinicalAccessLogger` en 4 puntos:

| Momento | action | target_patient_id | Razón |
|---|---|---|---|
| Crear cita exitosamente (ON SUCCESS) | `create_appointment` | patient_id de la cita creada | Paciente ajeno accedido |
| Abrir modal de edit con data de paciente cargada | `view_patient_in_appointment` | patient_id visible | Apertura de ficha (contacto) |
| Guardar cambios en edit de cita | `edit_appointment` | patient_id | Modificación de cita ajena |
| Cancelar cita (status='cancelled') | `cancel_appointment` | patient_id | Cambio de estado sensible |

**No se audita**:
- Bloquear/desbloquear horas (`blocked_times`) — no hay paciente involucrado (FR-017).
- Navegar entre semanas o aplicar filtros — no hay mutación.
- Ver la grid — renderiza datos ya decretados accesibles por RLS; logging en render es ruido.

**Rationale**:
- Constitution §III v1.1.0: "acceso de TERCEROS a datos clínicos de paciente ajeno" → el asistente es tercero. El hook `useClinicalAccessLogger` ya incluye 'assistant' en `isClinicalRole()` (verificar vía Grep antes de asumir — hecho: ver `src/lib/audit/useClinicalAccessLogger.js`).
- Los 4 eventos cubren el flujo completo sin redundancia.
- Action names son consistentes con convenciones ya usadas en la tabla (view_*, create_*, edit_*, cancel_*).

**Alternatives considered**:
- Loggear también "hover sobre cita" — **descartado**: ruido. El dato de paciente se revela cuando abre el modal, no al hover.
- Loggear al llamar `searchOrgPatients` — **descartado**: autocomplete search no cuenta como "apertura de ficha". Solo retorna nombre/email/phone, no PHI.

---

## R-06: UX del "modo bloquear" — ¿toggle, modifier key, menú contextual?

**Decision**: **Toggle button visible** en el header del calendario (botón tipo "Bloquear horas" que cambia visualmente cuando está activo).

**Rationale**:
- Asistentes no son power users — modifier keys (Shift+drag) son invisibles y propensos a error.
- Toggle visible con label claro es discoverable + deterministic.
- El patrón espejar el de apps tipo Cal.com/Google Calendar's "Agendar cita / Crear evento" mode switch.
- Cuando está activo, el cursor cambia a "bloqueo" y el drag crea `blocked_times` en vez de abrir AppointmentModal.

**Alternatives considered**:
- Modifier key (Shift+drag) — **descartado**: discoverability baja, edge cases en mobile (aunque mobile no es goal).
- Menú contextual right-click en slot vacío con "Bloquear este horario" — **descartado**: right-click no es descubrible tampoco, y el drag es más natural.
- Modal separado de "Crear bloqueo" con inputs manuales de start/end — **descartado**: pierde la UX de drag que el user pidió explícitamente.

**UX del toggle**:
```
┌─ [<] Semana del 21-27 abr [>] [Hoy]    [Dentista: Dr. X ▼]   [Modo: Crear cita | ⛔ Bloquear hora] ─┐
```

Cuando está "Bloquear hora" activo:
- Botón tiene background rojo semitransparente (bg-red-50 + border-red-200).
- Cursor cambia a "not-allowed" sobre slots libres.
- Drag → crea `blocked_times` directamente (modal opcional con solo campo "reason").

---

## R-07: Manejo de conflictos — ¿bloqueo client-side, DB-side, o ambos?

**Decision**: **Ambos**. Client-side da UX rápida (evita roundtrip al rechazarse), DB-side (constraint unique parcial o check function) es la garantía real.

**Client-side**:
- Antes de abrir AppointmentModal tras drag, chequear si el rango [start, end] colisiona con:
  - Otra cita del mismo `therapist_id` en la misma `date` (estado != 'cancelled').
  - Un `blocked_times` del mismo `therapist_id` con overlap.
- Si hay conflicto, mostrar toast "Ya existe una cita o bloqueo en ese horario" y no abrir el modal.

**DB-side**:
- Verificar si existe un constraint en `appointments` que previene overlap de citas activas del mismo therapist. Si NO existe (probable), NO crear migration para ello en este spec — es orthogonal y merece spec propio para no expandir scope.
- Acotar este spec: si DB no previene overlap, confiamos en el chequeo client-side + race condition residual (aceptable para beta N<=10 clínicas).

**Alternatives considered**:
- Solo client-side — **descartado**: race conditions entre 2 usuarios. Aunque improbable en MVP, violaría Constitution §V "UI Honesty" si dos citas se crearan en el mismo slot y la segunda rompiera silenciosamente.
- Solo DB-side via trigger BEFORE INSERT que valide overlap — **descartado**: overkill para MVP, merece spec separado de "appointment overlap prevention" (backlog).

**Decisión operativa**: validar overlap client-side. Si DB rechaza por cualquier motivo, el toast UX Honesty muestra error claro. Aceptable para beta.

---

## R-08: ¿Permitir drag de cita existente a otro slot (move)?

**Decision**: **Sí en P2**, vía `WeeklyAgendaView` ya soporta `onAppointmentMove`. Invocamos handler que actualiza start_time/end_time manteniendo la misma duración.

**Rationale**:
- User story US4 (editar cita) cubre este flujo via modal, pero drag-to-move es UX mucho más rápida.
- `WeeklyAgendaView` ya tiene la mecánica de drag implementada (línea 47 de la firma: `onAppointmentMove`).
- Esfuerzo marginal: solo wiring del handler a `updateAppointment` + audit log.

**Alternatives considered**:
- Dejar drag-to-move en P3 — **descartado**: el componente ya lo soporta, el esfuerzo extra es trivial.

---

## R-09: Búsqueda de pacientes — adaptar `searchPatientsForAgenda` o crear `searchOrgPatients`?

**Decision**: Crear `searchOrgPatients(organizationId, term)` en `org.api.js` que queries `patients` WHERE `organization_id = X AND (full_name ILIKE '%term%' OR email ILIKE '%term%')`. Reusa RLS que ya existe (`pat_assistant_select` del spec 023 permite al asistente ver pacientes de su org).

**Rationale**:
- `searchPatientsForAgenda(therapistId, term)` está scopeada por therapist_id — filtra pacientes del therapist específico, no de la org completa.
- El asistente necesita ver pacientes de TODOS los dentistas de la org.
- RLS se encarga del enforcement — la query nueva no puede "ver" pacientes fuera de la org aún si el código tuviera bug.

**Alternatives considered**:
- Generalizar `searchPatientsForAgenda` con scope opcional — **descartado**: Constitution §IV (no refactor + feature).

---

## R-10: ¿Compatibilidad con flujo existente `AssistantAgendaPage`?

**Decision**: **Reemplazar** `AssistantAgendaPage` por `AssistantCalendarPage`. Actualizar route en `DashboardRouter.jsx`. Eliminar `AssistantAgendaPage.jsx` del repo (o mover a deprecated si queremos regresar).

**Rationale**:
- La lista día-por-día actual es inferior en UX a la grid semanal.
- Mantener 2 vistas paralelas genera deuda.
- Usuario pidió el reemplazo explícitamente ("que el asistente tenga el mismo calendario rich que el dentista").

**Preservar del `AssistantAgendaPage` actual**:
- `AssistantNewAppointmentDialog`: puede reutilizarse si tiene lógica de búsqueda de paciente. Evaluar si extender o envolver.
- `RegisterPaymentDialog`: el botón de "registrar pago" quedará disponible dentro del modal de edit de cita (P2) o como acción del menu contextual. **Decisión MVP**: NO preservar register-payment en este spec — lo movemos a backlog porque no era parte del request del usuario. El asistente sigue registrando pagos desde otra vista (tabla de citas hoy existe en otra página).

**Alternatives considered**:
- Mantener ambas vistas (lista + calendar) con toggle — **descartado**: complica UX por N<=10 clínicas sin señal de demanda. Simple es mejor.

---

## R-11: Zona horaria — ¿cómo renderizar horas?

**Decision**: Usar `clinics.timezone` de la clínica del asistente para renderizar horas locales. Si no está seteada, fallback a `America/Santiago` (hardcoded — todas las clínicas beta son Chile).

**Rationale**:
- DentalSpot beta es Chile-only. Todas las clínicas comparten timezone (America/Santiago).
- Chile no tiene DST desde 2022 — UTC offset es fijo -03:00 o -04:00 según zona geográfica (Continental vs Magallanes).
- `clinics.timezone` es el campo canónico — si spec futuro agrega clínicas fuera de Chile, el fallback se remueve.

**Alternatives considered**:
- Usar timezone del user (navegador) — **descartado**: si un dentista de Santiago viaja a Buenos Aires, su calendario se corrupee visualmente.
- Hardcodear -03:00 — **descartado**: rompe compliance a futuro.

---

## R-12: ¿Cómo manejar el caso "asistente sin org activa"?

**Decision**: Pantalla de guard en `AssistantCalendarPage` — si `useCurrentOrganization()` devuelve null o `currentOrganizationId` es falsy, renderizar pantalla tipo "No tenés clínica asignada" con CTA "Cerrar sesión" (aligned con followup bug #3 del smoke test spec 023).

**Rationale**:
- Ya sucede hoy en `AssistantAgendaPage` con mensaje "Selecciona una organización" (mal copy, identificado como followup en spec 023).
- Esta spec no arregla el followup del copy — mantenemos el patrón existente por ahora y el fix del copy es spec aparte.
- Alternativa: forzar logout. Decisión: **no forzar logout** porque el user podría haber sido legitimamente revocado y necesita ver el mensaje para entender.

**Gate**: fallback copy actualizado a "Esta cuenta no tiene acceso activo a ninguna clínica. Si esto es un error, contactá al administrador." — mínimo cambio que mejora UX sin escopearse en otro spec.

---

## Summary of Phase 0 Decisions

| Decision | Summary |
|---|---|
| R-01 | Reutilizar `WeeklyAgendaView` sin modificar |
| R-02 | Crear `OrgCalendarView` genérico (reutilizable para clinic_admin en spec 025) |
| R-03 | Nuevo `org.api.js` paralelo a `therapist.api.js` |
| R-04 | Migration nueva para `blocked_times_assistant_*` policies |
| R-05 | 4 eventos audit: create/view/edit/cancel appointment |
| R-06 | Toggle button "Bloquear hora" (no modifier key) |
| R-07 | Conflictos client-side + aceptar race condition residual MVP |
| R-08 | Drag-to-move de cita activado en P2 (reusa handler existente) |
| R-09 | Nueva función `searchOrgPatients` en org.api.js |
| R-10 | Reemplazar `AssistantAgendaPage`, no mantener paralela |
| R-11 | `clinics.timezone` o fallback America/Santiago |
| R-12 | Pantalla "sin org" con CTA claro (no forzar logout) |

Todo resuelto. Lista para Phase 1 (data-model + contracts + quickstart).
