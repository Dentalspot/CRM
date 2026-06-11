# Tasks: Treatment Budget With Progress (MVP — Bloques 1+2+5)

**Input**: Design documents from `/specs/030-treatment-budget-progress/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: No automated tests requested. Smoke testing manual via `quickstart.md` (10 smokes). Sigue el patrón DentalSpot: dev local + Cristobal/Solange en Los Álamos como driver.

**Organization**: Tasks grouped by user story. **MVP = US1 (P1)**. US2/US3 son P2 — pueden quedar para mismo PR o segunda iteración.

## Format: `[ID] [P?] [Story] Description`

- **[P]** = se puede paralelizar (archivos distintos, sin dependencias)
- **[Story]** = US1 / US2 / US3 (P1 / P2 / P2)
- Tiempo estimado en minutos al final de cada task

## Estimación global

| Fase | Tasks | Tiempo |
|---|---|---|
| Setup | T001-T002 | ~30 min |
| Foundational | T003-T008 | ~2h |
| US1 (P1) MVP | T009-T020 | ~4-5h |
| US2 (P2) | T021-T023 | ~30 min |
| US3 (P2) | T024-T029 | ~2h |
| Polish | T030-T035 | ~1h |
| Smokes | T036-T045 | ~1-2h |
| **TOTAL** | 45 tasks | **9-12h** |

---

## Phase 1: Setup (Verificación de entorno)

**Purpose**: Asegurar que el entorno local está listo y la migration es aplicable sin sorpresas.

- [X] T001 Verificar que dev server local corre (`npm run dev`) y que `npx supabase db query --linked` está cableado a project `tomremkbuxvedliyywbo` con cuenta `dentalspot.cl@gmail.com` — 10 min
- [X] T002 Verificar pre-deploy checklist del contract de migration: `SELECT clinic_id FROM treatment_budgets;` retorna 2 rows NOT NULL + `\df is_org_member` existe + dump backup de `treatment_budget_items` (es chica) — 20 min
  - **Hallazgo**: `treatment_budgets.status` usa enum `budget_status` con valores en español (`borrador`, `enviado`, `aceptado`, `en_progreso`, `pagado`, `cancelado`). Código adaptado en `budgetApi.js` para usar `['borrador','enviado','aceptado','en_progreso']` como filtro de "activo".
  - Decisión: `treatment_budget_items.status` mantiene inglés (`'pending'/'completed'`) — alineado con `patient_payments.status='completed'`

**Checkpoint**: entorno local listo + migration safe to apply.

---

## Phase 2: Foundational — DB + API base (Blocking prerequisites)

**Purpose**: Migration DB + módulos API compartidos. **MUST completarse antes que cualquier US**.

⚠️ **CRITICAL**: ninguna US arranca sin esto.

- [X] T003 Crear archivo `supabase/migrations/20260604000001_budget_items_status_and_audit.sql` copiando contenido exacto del contract `contracts/migration-20260604000001.md` (3 columnas + 2 índices parciales + función trigger + trigger + 2 RLS policies UPDATE + CHECK expansion en `clinical_audit_log`) — 30 min
- [X] T004 Aplicar migration a prod via `npx supabase db query --linked < supabase/migrations/20260604000001_budget_items_status_and_audit.sql` y correr smoke verification queries (5 checks: columnas, trigger, policies, CHECK, INSERT funcional con `budget_item`/`payment`) — 20 min
  - 3 columnas creadas, trigger `trg_check_budget_item_revert` activo, policies `tbi_dentist_update` + `tbi_admin_update` creadas, CHECK ampliado a 9 valores
- [X] T005 [P] Crear `src/lib/api/budgetApi.js` con 6 funciones: `getActiveBudgetsForPatient`, `getBudgetItems`, `createDraftBudget`, `getOrCreateActiveBudget`, `markBudgetItemsCompleted`, `revertBudgetItem`, `createQuickBudgetForSession`. Cada una valida `.select()` para UI Honesty §V. `markBudgetItemsCompleted` usa `.update().in('id', itemIds)` batch. Cada operación dispara `logClinicalAccess` con `resource_type='budget_item'` (FR-018/019/020) — 1h
- [X] T006 [P] Reuso `formatCurrency` existente en `src/lib/utils/formatters.js` (ya implementado con Intl.NumberFormat 'es-CL'). Sin código nuevo — 0 min
- [X] T007 EDIT `src/features/post-session/api/postSessionApi.js`: extender `registerSessionPayment` con param opcional `budgetId` (default null). Cuando presente, agregar al payload INSERT + audit log con `resource_type='payment'` reason `from_postsession:<apt_id>` (FR-019). Mantener backward compat para callers sin budgetId — 30 min
- [X] T008 Crear `src/features/odontogram/api/budgetSyncApi.js` con 2 funciones: `findServiceByTreatmentName(therapistId, treatmentName)` (lookup case-insensitive en `therapist_services`) + `createBudgetItemFromOdontogram({patientId, therapistId, clinicId, patientFullName, tooth, treatment})` (delega a `budgetApi.getOrCreateActiveBudget` + insert item). Si servicio no existe: `service_id=null, unit_price=0` (FR-005) — 1h

**Checkpoint**: DB lista en prod + API helpers disponibles. A partir de aquí, US1/US2/US3 pueden arrancar en paralelo si hubiera más manos.

---

## Phase 3: User Story 1 — Cierre de sesión + tildado + cobro (Priority: P1) 🎯 MVP

**Goal**: Dentista cierra cita → modal lista items pending → tilda 2 → monto pre-rellenado → cobro efectivo → balance actualizado.

**Independent Test**: Smoke 1-5 del quickstart (Cristobal + Solange con endodoncia + limpieza tildadas + pago $105.000).

### Implementation US1

- [X] T009 [US1] Crear `src/features/post-session/components/BudgetItemsChecklistStep.jsx` (~350L) con Props: `patientId`, `appointmentId`, `patientFullName`, `therapistId`, `clinicId`, `organizationId`, `onComplete(suggestedAmount, budgetId)`, `onSkip()`. Fetch + checklist + selector + total + submit + revert — 2h
- [X] T010 [US1] UI alternativa "sin budget" (FR-022): inputs descripción + precio + `createQuickBudgetForSession` + botón "Saltar al pago" — incluido en T009 — 0 min
- [X] T011 [US1] Items sin precio (FR-007): `editingPrices` state + input inline + validación pre-tildado — incluido en T009 — 0 min
- [X] T012 [US1] EDIT `PostSessionModal.jsx`: STEPS pasa a `['document','items','payment','schedule','done']`. Agregada entry `{key:'items', icon:ListChecks, label:'Hecho'}` (uso `ListChecks` en lugar de `CheckSquare` por mejor semántica visual). Imports nuevos: `ListChecks`, `BudgetItemsChecklistStep`, `formatCurrency` — 30 min
- [X] T013 [US1] State nuevo: `suggestedAmount`, `activeBudgetId`, `itemsMarkedCount`, `showSkipWarning`. Handlers: `handleItemsComplete`, `handleItemsSkip`, `confirmSkipItems`. Render `<BudgetItemsChecklistStep>` cuando `step === 'items'` — 20 min
- [X] T014 [US1] PaymentStep ahora muestra hint teal "Monto sugerido por intervenciones tildadas: $X" si `suggestedAmount > 0`. Input monto se pre-rellena con `suggestedAmount` en `handleItemsComplete` — 20 min
- [X] T015 [US1] `registerSessionPayment` ahora recibe `budgetId={activeBudgetId}`. UI Honesty §V: toast verde solo si `payment?.id` existe, throw en su defecto. Toast incluye monto formateado en CLP — 20 min
- [X] T016 [US1] Warning FR-013: si dentista hace skip sin tildar nada (`itemsMarkedCount === 0`), `showSkipWarning` se muestra como pantalla intermedia amarilla con opciones "Volver a tildar" / "Continuar igual" — 20 min
- [X] T017 [US1] Reversión integrada en `handleToggle` del checklist: si item está checked + status='completed' en esta cita, llama `revertBudgetItem`. Trigger DB error `unauthorized_revert` se convierte en toast rojo friendly — incluido en T009 — 0 min
- [X] T018 [US1] `markBudgetItemsCompleted` invoca `logClinicalAccess({action:'update', resource_type:'budget_item', reason:'completed_in_appointment:<apt_id>'})` por cada item — implementado en código (`budgetApi.js` líneas 196-210). Verificación SQL en Smoke 4 — 10 min
- [X] T019 [US1] `registerSessionPayment` con `budgetId` invoca `logClinicalAccess({action:'create', resource_type:'payment', reason:'from_postsession:<apt_id>'})` — implementado en código (`postSessionApi.js` líneas 100-115). Verificación SQL en Smoke 4 — 10 min
- [ ] T020 [US1] **PENDIENTE: requiere browser** — mini-smoke US1 con Cristobal + Solange. Detalle en Phase 7 Smokes (T036-T040). ESLint clean en todos los archivos modificados — 30 min

**Checkpoint US1**: PostSession flow completo desde modal hasta balance actualizado. MVP entregable.

### Fix UX inline (descubierto durante smoke MVP, 2026-06-03)

- [X] FIX-UX-1 EDIT `src/app/routers/DashboardRouter.jsx`: `/dashboard/patients/:id/*` ahora permite `THERAPIST + CLINIC + ASSISTANT` (era solo `THERAPIST`, bloqueaba a Cristobal logueado como admin tras priority swap spec 028). RLS sigue siendo el control real
- [X] FIX-UX-2 EDIT `src/components/calendar/assistant/AssistantAppointmentModal.jsx`: botón "Ver ficha" chip teal arriba a la derecha del DialogHeader, visible cuando `selectedPatient?.id` está cargado. Abre `/dashboard/patients/<id>` en nueva pestaña
- [X] FIX-UX-3 EDIT `src/components/calendar/AppointmentModal.jsx`: mismo botón "Ver ficha" para vista dentista puro, usando `appointmentData?.patient_id || slotInfo?.patientId || formData.patient_id` como fallback chain

---

## Phase 4: User Story 2 — Asistente crea presupuesto pero NO tilda (Priority: P2)

**Goal**: Robotina puede crear/editar presupuestos pero RLS rechaza UPDATE de status. Sin code nuevo — validar que migration cumple FR-014.

**Independent Test**: Smoke 8 del quickstart (assistant intenta UPDATE → RLS bloquea).

### Implementation US2

- [ ] T021 [US2] Verificar en código existente que la UI de "Presupuestos" en perfil del paciente NO muestra control "marcar completado" para rol assistant (FR-015). Buscar en `src/features/treatment-budgets/` o similar. Si UI muestra el control para assistant → agregar guard con `useUserRoleInOrg` para esconderlo (FR-014 también UX) — 30 min
- [ ] T022 [US2] [P] Validar manualmente via SQL: `SET ROLE assistant; UPDATE treatment_budget_items SET status='completed' WHERE id='<x>';` → debe fallar con `new row violates row-level security policy`. Esto confirma que las policies `tbi_dentist_update` + `tbi_admin_update` NO cubren assistant (por ausencia, FR-014) — 15 min
- [ ] T023 [US2] [P] Verificar que assistant SÍ puede SELECT items para mostrar el listado de items existentes en el budget que está editando. Si no puede, agregar policy `tbi_assistant_select` (READ-only). Buscar en policies existentes — 30 min

**Checkpoint US2**: separación de roles validada. Sin riesgo de bypass.

---

## Phase 5: User Story 3 — Odontograma crea items del budget (Priority: P2)

**Goal**: Cristobal marca tratamientos en odontograma → items se crean en budget automáticamente.

**Independent Test**: Smoke 1 del quickstart (3 tratamientos en odontograma → 3 items en budget).

### Implementation US3

- [ ] T024 [US3] Buscar en `src/features/odontogram/components/Odontogram.jsx` el callback que se dispara al marcar un tratamiento por diente. Identificar el nombre exacto (`onTreatmentMarked` / `onToothTreatmentChange` / similar) y los datos que pasa (tooth, treatment, etc.) — 30 min
- [ ] T025 [US3] EDIT `Odontogram.jsx` (o el componente padre): agregar handler `handleTreatmentMark({tooth, treatment})` que llama `createBudgetItemFromOdontogram({patientId, therapistId: user.id, clinicId, patientFullName, tooth, treatment})` + toast verde "✓ Item agregado al presupuesto — {description} — {CLP(unit_price)}" — 30 min
- [ ] T026 [US3] En el toast del handler, si `unit_price === 0` mostrar mensaje sugerencia "Editá el precio en el presupuesto" (FR-005 edge case) — 10 min
- [ ] T027 [US3] EDIT `Odontogram.jsx`: agregar callback opcional `onBudgetUpdated` para refrescar componentes hermanos que muestren el budget activo (si existe sidebar de items) — 20 min
- [ ] T028 [US3] En `budgetSyncApi.createBudgetItemFromOdontogram`, validar que `getOrCreateActiveBudget` genera title `"Plan de tratamiento — {patient.full_name}"` (FR-004). Verificar con SQL post-smoke — 10 min
- [ ] T029 [US3] Mini-smoke US3: con Cristobal, paciente test sin budget previo → marcar 3 tratamientos distintos en odontograma → SELECT budget y items → verificar 1 budget en `draft` + 3 items pending — 30 min

**Checkpoint US3**: odontograma sincroniza con budget. Sin trabajo manual del dentista.

---

## Phase 6: Polish & cross-cutting

**Purpose**: visual checkmarks, format CLP, edge cases finales.

- [ ] T030 [P] Verificar uso de `formatCLP` (de T006) en todas las renders de precios: `BudgetItemsChecklistStep`, footer total, toast de odontograma, modal cobro. Reemplazar cualquier `${item.unit_price}` directo — 20 min
- [ ] T031 [P] Visual: items completed en checklist deben mostrar checkmark verde + texto tachado (Tailwind `line-through text-green-600`). Items pending normal — 15 min
- [ ] T032 [P] Edge case "múltiples budgets activos" (FR-006): verificar que selector en `BudgetItemsChecklistStep` ordena por `created_at DESC` y default = primero (más reciente). Smoke con Solange con 2 budgets — 15 min
- [ ] T033 [P] Edge case "cita sin paciente" (Spec Edge Case): verificar que PostSessionModal no se abre si `appointment.patient_id IS NULL`. Si se abre, mostrar mensaje + cerrar — 15 min
- [ ] T034 [P] Edge case "anticipo / pago parcial" (FR-024/025): verificar que PaymentStep permite editar monto arriba O abajo del sugerido, y que `balance_due` puede quedar negativo o positivo respectivamente — 15 min
- [ ] T035 Logging: verificar que no quedan `console.log` dejados durante debug. Sweep en `budgetApi.js`, `budgetSyncApi.js`, `BudgetItemsChecklistStep.jsx`, `PostSessionModal.jsx` — 10 min

**Checkpoint**: feature pulido + edge cases cubiertos.

---

## Phase 7: Smokes E2E (verificación final)

**Purpose**: ejecutar los 10 smokes documentados en `quickstart.md` con Cristobal+Solange.

Cada smoke = una tarea atómica. Pueden ser [P] (independientes entre sí, pero corren sobre la misma base de datos prod).

- [ ] T036 [P] Smoke 1: crear presupuesto desde odontograma (3 tratamientos → 3 items) — 10 min
- [ ] T037 [P] Smoke 2: PostSession lista 3 items pending al cerrar cita — 10 min
- [ ] T038 [P] Smoke 3: tildar 2 items + UI muestra "Total seleccionado: $105.000" — 10 min
- [ ] T039 [P] Smoke 4: registrar pago efectivo $105.000 + verificar audit log 4 entries — 15 min
- [ ] T040 [P] Smoke 5: verificar `v_budget_balance` retorna `balance_due = $30.000` — 5 min
- [ ] T041 Smoke 6: reversión autorizada (6a Cristobal pasa + 6b Pablo Ceballos falla + 6c admin pasa) — 20 min
- [ ] T042 [P] Smoke 7: edge case paciente sin budget (UI crear quick) — 10 min
- [ ] T043 [P] Smoke 8: assistant bypass RLS rechazado — 10 min
- [ ] T044 [P] Smoke 9: audit log append-only (UPDATE rechazado por trigger) — 5 min
- [ ] T045 Smoke 10: performance — cronometrar flow completo < 90s + `v_budget_balance` < 500ms — 15 min

**Checkpoint final**: 10/10 smokes verdes. Cleanup queries del quickstart.md aplicados. Screenshots tomados para reporte a Danissa.

---

## Followups descubiertos durante smoke (registrados para futura spec)

- [ ] **FUT-1** `PostSessionModal` step Nota — adaptación a odontología (HECHO 2026-06-04):
  - Renombrado: "Notas de sesión" → "Nota de evolución", "Próximos pasos" → "Indicaciones al paciente"
  - Eliminado: "Objetivos trabajados" (concepto fonoaudiológico, no aplica odonto)
  - Placeholders chilenos odonto
- [ ] **FUT-2** **PENDIENTE para Bloque 3 (vista paciente, próxima sesión)**: las "Indicaciones al paciente" del step Nota deben llegarle al paciente en su dashboard (`/dashboard/patient/my-treatment` o equivalente). Hoy se guardan en `clinical_history.details.next_steps` pero solo el dentista las ve. Driver: post-sesión Solange debe poder leer "evitar masticar de ese lado 24h" desde su app sin llamar a la clínica. El TODO ya está cableado en `PostSessionModal.jsx` línea ~462 como comentario.
- [ ] **FUT-3** Bloque 4 (split notas público/privado, próxima sesión): la "Nota de evolución" SIGUE siendo privada (solo dentista). El paciente NO debe ver tecnicismos como "1 carpule de lidocaína 2%". Cuando se haga Bloque 4, el campo se splittea en `clinical_notes_private` (dentista) + `procedure_summary` (paciente).

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: sin dependencias, primero
- **Phase 2 (Foundational)**: depende de Phase 1, **BLOQUEA TODO**
- **Phase 3 (US1 MVP)**: depende de Phase 2
- **Phase 4 (US2)**: depende de Phase 2, **paralelizable con Phase 3** si hubiera más manos
- **Phase 5 (US3)**: depende de Phase 2, **paralelizable con Phase 3/4**
- **Phase 6 (Polish)**: depende de Phase 3 + Phase 5 (no de US2)
- **Phase 7 (Smokes)**: depende de TODAS las anteriores

### Within US1 (Phase 3)

- T009 (BudgetItemsChecklistStep) → T012 (PostSessionModal STEPS) → T013-T016 (wiring) → T017 (reversión) → T018-T019 (audit verification) → T020 (mini-smoke)
- T010, T011 pueden hacerse después de T009 sobre el mismo archivo (NO [P])
- T015 EDIT PaymentStep puede empezar después de T014 si vive en archivo separado

### Within US3 (Phase 5)

- T024 (research callback name) → T025-T028 secuencial (mismo archivo `Odontogram.jsx`) → T029 mini-smoke

### Parallel opportunities

**Phase 2**: T005, T006 son [P] (archivos distintos). T007, T008 dependen de T005 (importan `budgetApi`).

**Phase 4**: T022, T023 son [P] (queries diferentes).

**Phase 6**: T030-T034 son [P] (verificación visual de archivos distintos).

**Phase 7**: T036, T037, T038, T039, T040, T042, T043, T044 son [P] (smokes independientes). T041 NO es [P] (necesita logout/login entre dentistas). T045 NO es [P] (mide performance, debe correr sin contención).

---

## Parallel Example: Phase 2 Foundational

```bash
# T003-T004 secuenciales (apply migration prod)
# Después, en paralelo:
Task: "Crear src/lib/api/budgetApi.js con 6 funciones (T005)"
Task: "Crear src/lib/format/clp.js con formatCLP (T006)"

# T007 (postSessionApi.js) puede esperar o correr en paralelo con T008 si T005 está done
# T008 (budgetSyncApi.js) depende de T005 (importa getOrCreateActiveBudget)
```

---

## Implementation Strategy

### MVP First (US1 solo)

1. Phase 1: Setup (T001-T002) — 30 min
2. Phase 2: Foundational (T003-T008) — 2h
3. Phase 3: US1 (T009-T020) — 4-5h
4. **STOP + VALIDATE**: smoke T036-T040 con Solange. Si pasa → MVP entregable
5. Deploy local + Danissa hace deploy prod cuando confirma

### Incremental delivery (recomendado)

1. Phase 1+2+3 → MVP US1 → smokes 1-5 → Danissa aprueba → commit + deploy
2. Phase 5 US3 → odontograma sync → smoke 1 nuevamente → deploy
3. Phase 4 US2 → verificación RLS assistant → deploy
4. Phase 6 Polish → cleanup final → deploy
5. Phase 7 Smokes restantes (6-10) → sign-off

### Out-of-scope (NO incluido)

- **Bloque 3** (vista paciente con barra progreso): próxima sesión
- **Bloque 4** (split notas público/privado): próxima sesión
- Mercado Pago checkout integrado: solo genera link estándar
- Notificaciones email/push automáticas: no aplica

---

## Notes

- [P] = archivos distintos, sin dependencias activas
- [Story] = mapping a US1/US2/US3 del spec
- Audit logs son APPEND-ONLY (trigger `trg_audit_log_no_update` existente). Cualquier intento de UPDATE en `clinical_audit_log` debe fallar (validado en smoke 9)
- RLS strict: assistant NO puede UPDATE items.status — enforced por ausencia de policy (FR-014)
- Toast verde solo si `.select()` retorna row (Constitution §V UI Honesty)
- Schema drift zero: cada columna referenciada en código debe existir en migration aplicada (Constitution §VI)
- Reversión completed→pending: trigger DB valida autoridad (FR-016). Frontend confía en el error del trigger para mostrar toast rojo apropiado
- Commits: 1 commit por checkpoint (Setup, Foundational, US1, US2, US3, Polish, Smokes). Danissa hace push + deploy
- Si una task descubre que una asunción del spec/plan/research es falsa → STOP y reportar antes de continuar (Lección spec 028: descubrir bugs subyacentes durante implementación es común)
