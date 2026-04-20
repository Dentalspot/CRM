---

description: "Tasks for spec 003-fix-audit-log-silent — P0 compliance fix, 1 SQL migration touching production"
---

# Tasks: Fix — `clinical_audit_log` silencioso

**Input**: `specs/003-fix-audit-log-silent/spec.md` + `plan.md`
**Prerequisites**: spec.md + plan.md aprobados. Pre-flight queries Q1–Q4 ejecutadas por Danissa con resultado **Q2.`orphan_count` > 0** confirmado (hipótesis validada).

## Leyenda de íconos

- 🤖 — ejecuta el ejecutor (Claude Code CLI)
- 👤 — ejecuta Danissa (humano, en terminal / browser / Supabase SQL Editor)
- 🚨 — punto de no retorno (modifica artefacto físico o estado compartido)
- **[P]** — task paralelizable con sus hermanas de la misma fase

## Scope reminders (Constitution III + IV + VI)

- **No fabricar entradas retroactivas** en `clinical_audit_log` (SC-005). Append-only es sagrado.
- **No relajar la policy RLS** (FR-005). La migración agrega infraestructura, no afloja restricciones.
- **No tocar frontend** (FR-008). Logger y hook son correctos.
- **No tocar** `DashboardRouter.jsx`, `src/lib/audit/*`, `is_in_care_team`, `cal_dentist_insert`, `clinical_audit_log` (schema/triggers), `clinical_access_log`, otros módulos clínicos, los 4 docs fundacionales, `CLAUDE.md`, o artifacts de spec 001/002.
- **Git add/commit/push son tareas 👤 de Danissa** (Phase 7). El ejecutor 🤖 no los ejecuta.

---

## Phase 1 🤖 — Pre-implementación (read-only)

**Propósito**: confirmar que el terreno cuadra con el plan antes de crear la migración. Sin ediciones.

- [ ] **T-01** 🤖 [transversal] Releer `spec.md` (156 líneas) y `plan.md` (425 líneas) completos. Confirmar que la hipótesis del plan sigue vigente y que Q2 pre-flight fue confirmada por Danissa.
  - File(s): read-only (`specs/003-fix-audit-log-silent/spec.md`, `plan.md`).
  - Depends on: —.
  - Pass criterion: declarar "spec + plan leídos; Q2 pre-flight confirmada con `orphan_count > 0` por Danissa; fix = 1 migración SQL (backfill + trigger)".

- [ ] **T-02** 🤖 [P] [transversal] Confirmar `git status` limpio para los paths que la migración va a tocar. Esperado: ningún archivo en `supabase/migrations/` modified; rama activa `003-fix-audit-log-silent` o `main` según workflow.
  - File(s): no file (comando `git status` + `git branch --show-current`).
  - Depends on: T-01.
  - Pass criterion: `supabase/migrations/` sin modified/untracked no relacionado. Working tree limpio salvo pre-existentes conocidos (`supabase/schema.sql`, `.specify/feature.json`, `Dentalspot_Estado_y_Roadmap.pdf`, y posibles artifacts ya commiteados de 003).

- [ ] **T-03** 🤖 [P] [transversal] Leer las columnas reales de `patient_care_team` en la migración creadora para confirmar que el INSERT del backfill + trigger usa los nombres correctos.
  - File(s): read-only (`supabase/migrations/20260415100000_organization_model_schema.sql:100-128`).
  - Depends on: T-01.
  - Pass criterion: confirmar que las columnas objetivo son exactamente `patient_id`, `dentist_id`, `organization_id`, `role`, `is_active`, `assigned_at` (nombres y tipos coinciden con lo propuesto en plan.md §"Technical Change Propuesto"). Si alguna columna difiere, **detener y reportar** — el plan tendría que ajustarse.

- [ ] **T-04** 🤖 [P] [transversal] Determinar el timestamp del nuevo archivo de migración. Regla: posterior a la última migración (`20260418000002_*`), formato `YYYYMMDDHHMMSS` sugerido `20260419<HHMMSS>` usando hora actual.
  - File(s): no file (comando `ls supabase/migrations/ | tail -5` para confirmar el último timestamp existente).
  - Depends on: T-01.
  - Pass criterion: timestamp seleccionado es estrictamente mayor al último existente (`20260418000002`) y contiene la fecha del fix. Nombre propuesto: `20260419000001_repair_patient_care_team.sql` (siguiendo el patrón de 6-dígitos de las migraciones previas). Alternativa: `20260419NNN_repair_patient_care_team.sql` si se prefiere sufijo variable.

**Checkpoint Phase 1 🤖 → 🚨 Phase 2**: si T-01..T-04 pasan sin discrepancia, el asesor autoriza por adelantado avanzar a T-05 sin pausa task-por-task. **Detener solo si hay discrepancia real** (ej. columnas difieren, timestamp conflicto).

---

## Phase 2 🤖 🚨 — Crear archivo SQL de migración

**⚠ T-05 es la única task que crea un archivo nuevo en `supabase/migrations/`.** Aún no se aplica a producción; eso es Phase 4 👤.

- [ ] **T-05** 🤖 🚨 [US1] Crear archivo `supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql` con el contenido definido en plan.md §"Technical Change Propuesto" → Archivo. El contenido tiene 3 secciones:
  - (a) Comentario de cabecera con trazabilidad completa: referencia a spec 003, ventana de compliance violada `2026-04-18 06:57 UTC → <timestamp del fix>`, causa raíz, ley aplicable (21.719 ARCO), principios violados (Constitution III).
  - (b) **Backfill reparador** — `INSERT INTO public.patient_care_team (...) SELECT ... FROM public.patients p WHERE <3 condiciones originales del backfill 15-abr> AND NOT EXISTS (<la misma tupla ya activa>) ON CONFLICT DO NOTHING;`.
  - (c) **Función + trigger sync** — `CREATE OR REPLACE FUNCTION public.sync_patient_care_team()` (SECURITY DEFINER, con guard de membership activa) + `CREATE TRIGGER trg_sync_patient_care_team_insert AFTER INSERT ON public.patients ...` + `CREATE TRIGGER trg_sync_patient_care_team_update AFTER UPDATE OF therapist_id, organization_id ON public.patients WHEN (...)`.
  - File(s): `supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql` (archivo nuevo, ~80-100 líneas).
  - Depends on: T-01, T-02, T-03, T-04.
  - Pass criterion: archivo existe; contiene exactamente las 3 secciones descritas; sintaxis SQL válida (backticks, comillas, punto y coma); `ON CONFLICT DO NOTHING` presente en el backfill; `SECURITY DEFINER` + `SET search_path = public` presentes en la función; ambos triggers usan `DROP TRIGGER IF EXISTS` antes del `CREATE TRIGGER` (idempotencia).
  - **Rollback si T-05 sale mal** (antes de apply): `rm supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql`. <10s, sin efectos en DB.

---

## Phase 3 🤖 — Validación local de la migración

**Propósito**: sanity-check estático del archivo antes de entregar a Danissa para apply. NO corre SQL.

- [ ] **T-06** 🤖 [P] [transversal] Confirmar que el archivo nuevo existe y tiene el comentario de cabecera con trazabilidad (ventana 18-abr, causa raíz, spec 003, Ley 21.719, Constitution III).
  - File(s): read-only (el archivo creado en T-05).
  - Depends on: T-05.
  - Pass criterion: `grep -c "spec 003\|2026-04-18\|Constitution III\|21.719" supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql` devuelve ≥ 4 matches totales.

- [ ] **T-07** 🤖 [P] [transversal] Confirmar estructura SQL coherente: presencia de INSERT/SELECT, CREATE OR REPLACE FUNCTION, 2× CREATE TRIGGER, paréntesis balanceados, `ON CONFLICT DO NOTHING` en el INSERT, `SECURITY DEFINER` + `SET search_path` en la función.
  - File(s): read-only (el archivo creado en T-05).
  - Depends on: T-05.
  - Pass criterion: los siguientes grep counts en el archivo:
    - `INSERT INTO public.patient_care_team` ≥ 1
    - `ON CONFLICT DO NOTHING` ≥ 1
    - `CREATE OR REPLACE FUNCTION public.sync_patient_care_team` = 1
    - `SECURITY DEFINER` ≥ 1
    - `CREATE TRIGGER trg_sync_patient_care_team_insert` = 1
    - `CREATE TRIGGER trg_sync_patient_care_team_update` = 1
    - `DROP TRIGGER IF EXISTS` ≥ 2
    Si alguno falla, **detener y reportar**; rollback via `rm` + re-crear.

**Checkpoint Phase 3 🤖 → 👤 Phase 4**: el ejecutor emite reporte intermedio con resumen del archivo generado, diff de `git status` (archivo nuevo untracked), y las salidas de T-06 + T-07. **Pasa la manija a Danissa**.

---

## Phase 4 👤 🚨 — Apply a producción

**⚠ T-08 modifica estado compartido de producción (tabla `patient_care_team` de DentalSpot).** Es hecha por Danissa desde su terminal.

- [ ] **T-08** 👤 🚨 [US1] Ejecutar `npx supabase db push --linked` desde la raíz del repo. Confirmar al prompt "Do you want to apply ... ?" con `y` tras revisar el diff que muestra la CLI.
  - File(s): aplicación remota contra proyecto Supabase `tomremkbuxvedliyywbo` (DentalSpot prod).
  - Depends on: T-07.
  - Pass criterion: output de `supabase db push` termina con `Finished supabase db push.` o equivalente sin errores. Si la CLI reporta error, **detener; no hay rollback automático** — ver "Rollback manual" abajo.
  - **Rollback manual si apply falla o introduce regresión**: ejecutar en SQL Editor:
    ```sql
    DROP TRIGGER IF EXISTS trg_sync_patient_care_team_insert ON public.patients;
    DROP TRIGGER IF EXISTS trg_sync_patient_care_team_update ON public.patients;
    DROP FUNCTION IF EXISTS public.sync_patient_care_team();
    -- (las filas insertadas en patient_care_team son datos legítimos, no se revierten)
    ```
    Luego re-probar con spec 003 revisada.

---

## Phase 5 👤 — Validación SQL post-apply

**Propósito**: confirmar que el backfill pobló lo esperado y que los triggers están instalados. Todo vía SQL Editor, read-only.

- [ ] **T-09** 👤 [US1] Repetir la query **Q2** del plan (huérfanos pre-fix):
  ```sql
  SELECT count(*) AS orphan_count
  FROM public.patients p
  WHERE p.therapist_id IS NOT NULL
    AND p.organization_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.patient_care_team pct
      WHERE pct.patient_id = p.id
        AND pct.dentist_id = p.therapist_id
        AND pct.is_active = true
    );
  ```
  - File(s): no file (SQL Editor).
  - Depends on: T-08.
  - Pass criterion: `orphan_count = 0`. Si devuelve > 0, algún paciente quedó sin qualify (p. ej. dentista sin membership activa en la org del paciente). Esperado que sean 0 o muy pocos casos borde documentables.

- [ ] **T-10** 👤 [transversal] Confirmar que los 2 triggers están instalados en la tabla `patients`:
  ```sql
  SELECT tgname, tgrelid::regclass AS table_name
  FROM pg_trigger
  WHERE tgname LIKE '%patient_care_team%'
  ORDER BY tgname;
  ```
  - File(s): no file (SQL Editor).
  - Depends on: T-08.
  - Pass criterion: exactamente 2 filas:
    - `trg_sync_patient_care_team_insert` en `public.patients`
    - `trg_sync_patient_care_team_update` en `public.patients`
  Si devuelve menos o más, **detener y reportar**.

---

## Phase 6 👤 — Test manual E2E

**Propósito**: validar acceptance de US1 + US2 en staging/prod con la cuenta de prueba. Flujo end-to-end en browser + queries de confirmación en SQL Editor.

**Setup previo (no es task, es precondición)**: login como Cristóbal (`dentalspot.cl@gmail.com`, `user_id = 4e55fb74-b3b5-4233-9b5d-88d7a01a9046`). Paciente huérfano original conocido: `5ffc5695-9c98-4f33-9538-a80338215ea6` (del test manual de spec 001 que falló).

- [ ] **T-11** 👤 [US1] Abrir en browser la ficha del paciente **huérfano original** (`5ffc5695-...`) → `/dashboard/patients/5ffc5695-9c98-4f33-9538-a80338215ea6`.
  - File(s): no file (browser).
  - Depends on: T-09, T-10.
  - Pass criterion: la ficha carga sin toast de error. El componente `PatientFilePage` se monta correctamente.

- [ ] **T-12** 👤 🎯 [US1] Inmediatamente tras T-11, ejecutar en SQL Editor:
  ```sql
  SELECT id, user_id, patient_id, organization_id, resource_type, action, created_at
  FROM public.clinical_audit_log
  WHERE patient_id = '5ffc5695-9c98-4f33-9538-a80338215ea6'
    AND user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
    AND created_at > NOW() - INTERVAL '2 minutes'
  ORDER BY created_at DESC;
  ```
  - File(s): no file (SQL Editor).
  - Depends on: T-11.
  - Pass criterion: **exactamente 1 fila nueva** con `resource_type = 'clinical_record'`, `action = 'view_record'`, `organization_id` de la org activa, `created_at` dentro del último minuto. **Esta es la task que confirma que el fix funciona para pacientes que eran huérfanos.**

- [ ] **T-13** 👤 [transversal] Crear un paciente nuevo desde la UI (`/dashboard/patients` → botón "Nuevo Paciente" → completar formulario con `therapist_id = Cristóbal` y `organization_id` válido → guardar). Anotar el `patient_id` devuelto.
  - File(s): no file (browser).
  - Depends on: T-12.
  - Pass criterion: el paciente se crea sin error; queda visible en el listado.

- [ ] **T-14** 👤 [transversal] Confirmar que el trigger `trg_sync_patient_care_team_insert` se disparó:
  ```sql
  SELECT patient_id, dentist_id, organization_id, role, is_active, assigned_at
  FROM public.patient_care_team
  WHERE patient_id = '<patient_id_de_T-13>';
  ```
  - File(s): no file (SQL Editor).
  - Depends on: T-13.
  - Pass criterion: exactamente 1 fila con `role = 'primary'`, `is_active = true`, `dentist_id = Cristóbal`, `assigned_at` ≈ timestamp de creación del paciente (±5s).

- [ ] **T-15** 👤 [US1] Abrir en browser la ficha del paciente nuevo (`/dashboard/patients/<patient_id_de_T-13>`).
  - File(s): no file (browser).
  - Depends on: T-14.
  - Pass criterion: la ficha carga sin error.

- [ ] **T-16** 👤 🎯 [US1] Confirmar que el log registró el acceso al paciente nuevo:
  ```sql
  SELECT id, patient_id, resource_type, action, created_at
  FROM public.clinical_audit_log
  WHERE patient_id = '<patient_id_de_T-13>'
    AND user_id = '4e55fb74-b3b5-4233-9b5d-88d7a01a9046'
    AND created_at > NOW() - INTERVAL '2 minutes';
  ```
  - File(s): no file (SQL Editor).
  - Depends on: T-15.
  - Pass criterion: exactamente 1 fila nueva con `resource_type = 'clinical_record'`. **Confirma que el trigger + policy + hook funcionan juntos para pacientes creados post-fix.**

- [ ] **T-17** 👤 [transversal — cierre spec 001] Retomar test manual de spec 001 (crear evaluación de odontograma para el paciente nuevo o para el orphan original). Seguir los 7 pasos de `specs/001-fix-odontogram-audit-log/tasks.md` §"Phase 4". El Paso 3 (query SQL core sobre `clinical_audit_log` con `resource_type='odontogram'`) debe devolver 1 fila nueva.
  - File(s): no file (browser + SQL Editor).
  - Depends on: T-14 o T-16 (necesita paciente en care_team).
  - Pass criterion: test manual de spec 001 pasa **7/7** (el 6/7 previo + el Paso 3 que ahora funciona). **Cierra el acceptance E2E de spec 001 pendiente en el commit `dd7f02c`.**

---

## Phase 7 👤 — Commit + push

**Propósito**: documentar la brecha de compliance en el mensaje del commit (FR-006, SC-004) y dejar el fix en `origin/main`.

- [ ] **T-18** 👤 [transversal] `git add supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql` y crear commit con mensaje obligatorio que cumpla FR-006:
  - Menciona explícitamente la ventana `2026-04-18 06:57 UTC → <timestamp del fix> UTC`.
  - Nombra la causa raíz (`patient_care_team` no sincronizado con `patients` post-backfill one-shot del 15-abr).
  - Cita Constitution III y Ley 21.719 ARCO.
  - Referencia spec 003 y commit de spec 001 (`dd7f02c`) que quedó bloqueado por este fix.
  - Template exacto disponible en `plan.md` §"Documentación de brecha (FR-006, SC-004)".
  - File(s): `supabase/migrations/<TIMESTAMP_T04>_repair_patient_care_team.sql` (staged).
  - Depends on: T-17.
  - Pass criterion: `git log --oneline -1` muestra el commit; `git show HEAD --name-only` lista solo el archivo de migración (sin archivos colaterales).

- [ ] **T-19** 👤 [transversal] `git push origin main` (o `origin 003-fix-audit-log-silent` si se prefiere PR flow antes del merge).
  - File(s): no file (acción remota).
  - Depends on: T-18.
  - Pass criterion: push exitoso. Si se pushea a branch `003-*`, abrir PR con título "fix(rls): repair patient_care_team sync — restore clinical_audit_log writes (spec 003 P0)".

---

## Dependencies & Execution Order

### Task graph

```
T-01 ─┬→ T-02 ┐
      ├→ T-03 ┼→ T-05 🚨 🤖 ──┬→ T-06 ─┐
      └→ T-04 ┘                 └→ T-07 ─┴→ [👤 handoff] → T-08 🚨 👤 → T-09 ─┐
                                                                          T-10 ─┴→ T-11 → T-12 → T-13 → T-14 → T-15 → T-16 → T-17 → T-18 → T-19
```

### Tabla resumen dependencias

| Task | Ejecutor | Depende de | Paralelizable con |
|---|---|---|---|
| T-01 | 🤖 | — | — |
| T-02 [P] | 🤖 | T-01 | T-03, T-04 |
| T-03 [P] | 🤖 | T-01 | T-02, T-04 |
| T-04 [P] | 🤖 | T-01 | T-02, T-03 |
| **T-05 🚨** | 🤖 | T-01, T-02, T-03, T-04 | — |
| T-06 [P] | 🤖 | T-05 | T-07 |
| T-07 [P] | 🤖 | T-05 | T-06 |
| **T-08 🚨** | 👤 | T-07 | — |
| T-09 | 👤 | T-08 | T-10 |
| T-10 | 👤 | T-08 | T-09 |
| T-11 | 👤 | T-09, T-10 | — |
| T-12 🎯 | 👤 | T-11 | — |
| T-13 | 👤 | T-12 | — |
| T-14 | 👤 | T-13 | — |
| T-15 | 👤 | T-14 | — |
| T-16 🎯 | 👤 | T-15 | — |
| T-17 | 👤 | T-14 o T-16 | — |
| T-18 | 👤 | T-17 | — |
| T-19 | 👤 | T-18 | — |

### Separación 🤖 / 👤

- **Tasks del ejecutor 🤖 (Claude Code):** T-01 a T-07 (7 tasks). Crean el archivo SQL y lo validan localmente. Sin ejecutar SQL contra producción.
- **Tasks humanas 👤 (Danissa):** T-08 a T-19 (12 tasks). Aplican migración, validan, ejecutan test manual E2E, commitean y pushean.

### Puntos de no retorno 🚨

- **T-05 🤖 🚨** — crea archivo SQL en `supabase/migrations/`. Rollback: `rm <archivo>` (<10s), sin efecto en DB.
- **T-08 👤 🚨** — aplica migración a producción. Rollback: DROP TRIGGER + DROP FUNCTION vía SQL Editor (<2min); filas añadidas a `patient_care_team` son datos legítimos y no se revierten.

### Parallel opportunities

- **Phase 1**: T-02, T-03, T-04 (distintos comandos read-only independientes).
- **Phase 3**: T-06, T-07 (diferentes grep counts sobre el mismo archivo; técnicamente secuenciales pero independientes conceptualmente).
- **Phase 5**: T-09 y T-10 (queries SQL independientes).
- **Phase 6**: no paralelizable — cada task depende del estado acumulado del flujo E2E.

---

## Notes

- **Total de tasks: 19** (7 🤖 + 12 👤, 2 🚨).
- **Total de archivos tocados: 1** (1 migración SQL nueva; cero cambios frontend).
- **Commit/push son tasks 👤 explícitas** (T-18, T-19); el ejecutor no los ejecuta.
- **Ventana de compliance violada** se documenta en mensaje de commit (FR-006) + opcionalmente en `.specify/memory/data-compliance.md` (micro-bloque separado si se decide).
- **Test manual E2E incluye cierre de spec 001** (T-17) — al pasar 7/7, el acceptance que quedó 6/7 en el commit `dd7f02c` se completa.
- **Este ciclo toca producción** — Danissa ejecuta T-08 en persona con el comando exacto `npx supabase db push --linked`; el ejecutor nunca corre `supabase db push`, `apply_migration`, ni `execute_sql` contra prod.
