# Feature Specification: Add Missing FK Indexes (7 High-Priority)

**Feature Branch**: `011-add-missing-fk-indexes`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "add-missing-fk-indexes — 7 FKs sin índice de alta prioridad según Express block audit 2026-04-20"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calendar del terapeuta rinde cuando crece el volumen de citas (Priority: P1)

Un terapeuta abre su calendario y la aplicación necesita join entre `appointments` y `therapist_services` (para mostrar precio/servicio por cita). Hoy `appointments.service_id` no tiene índice — la DB hace sequential scan completo de `appointments` cada vez que filtra o joinea por ese FK. Con una clínica de 50 citas totales es imperceptible. Con 5.000 citas, la respuesta sube a cientos de ms; con 50.000 a varios segundos. Este spec corta ese problema antes de que el volumen lo haga visible.

**Why this priority**: `appointments` es la tabla que más crece en producción (1 row por sesión clínica). El calendar render se ejecuta en cada login de terapeuta/paciente. Es la ruta más sensible a degradación por seq scan.

**Independent Test**: ejecutar `EXPLAIN ANALYZE SELECT * FROM appointments WHERE service_id = '<uuid>'` pre y post-migration. Pre: `Seq Scan` en el plan. Post: `Index Scan using idx_appointments_service_id`. El beneficio es más evidente cuando la tabla tiene volumen — se valida también con un SELECT con JOIN.

**Acceptance Scenarios**:

1. **Given** la migración aplicada, **When** se corre `EXPLAIN ANALYZE` sobre un SELECT filtrado por `appointments.service_id`, **Then** el plan usa `Index Scan` en lugar de `Seq Scan`.
2. **Given** el calendar del terapeuta post-deploy, **When** el terapeuta abre el calendario con ≥1 cita, **Then** la pantalla renderiza sin regresión visible de tiempo (percepción idéntica o mejor que pre-deploy).

---

### User Story 2 - Dashboard de comisiones del terapeuta y admin responde consistente a escala (Priority: P2)

Dos tablas críticas para la feature de comisiones: `commissions.therapist_id` y `commissions.sale_id`. El dashboard del terapeuta filtra sus comisiones (`WHERE therapist_id = auth.uid()`); el admin filtra por venta (`WHERE sale_id = X` para inspección de una transacción). Ambas columnas son FKs sin índice hoy. Mismo argumento de escalabilidad que User Story 1, aplicado a una feature de flujo de dinero.

**Why this priority**: feature financiera (fluye dinero de comisiones), no afecta seguridad pero sí confianza del terapeuta en la plataforma. P2 porque impacta rol therapist + admin, frecuencia menor que calendar.

**Independent Test**: `EXPLAIN ANALYZE` sobre cada una de las 2 queries pre/post-migration. Post: ambas usan `Index Scan` sobre `idx_commissions_therapist_id` y `idx_commissions_sale_id` respectivamente.

**Acceptance Scenarios**:

1. **Given** la migración aplicada, **When** el dashboard del terapeuta consulta sus comisiones, **Then** `EXPLAIN ANALYZE` muestra `Index Scan` sobre `idx_commissions_therapist_id`.
2. **Given** el admin abre detalle de una venta, **When** el sistema consulta comisiones por `sale_id`, **Then** `Index Scan` sobre `idx_commissions_sale_id`.

---

### User Story 3 - Ficha clínica + facturación clínica responden bajo volumen normal (Priority: P3)

Los 4 FKs restantes son de features más nicho pero que siguen creciendo:

- `clinic_invoices.patient_id` — ver facturas de un paciente en su ficha.
- `clinic_invoices.therapist_id` — terapeuta consulta su historial de facturación.
- `clinical_history.entry_type` — filtrar entradas del historial por tipo (anamnesis, indicación, informe).
- `clinical_history.diagnosis_id` — lookup de diagnóstico asociado a una entrada.

Todos en features clínicas donde se consulta con JOIN/filtro por el FK. Al volumen actual no hay regresión visible; al crecer 10x-100x (escenario realista en 12-18 meses), sí.

**Why this priority**: features secundarios que hoy no muestran dolor de performance. El beneficio es preventivo — evitar retorno al audit dentro de 12 meses por el mismo problema. P3 porque no son crisis actual.

**Independent Test**: `EXPLAIN ANALYZE` sobre cada uno pre/post. Los 4 índices post-migration usan `Index Scan` en lugar de `Seq Scan`.

**Acceptance Scenarios**:

1. **Given** post-migration, **When** `EXPLAIN ANALYZE SELECT * FROM clinic_invoices WHERE patient_id = '<uuid>'`, **Then** plan usa `idx_clinic_invoices_patient_id`.
2. **Given** post-migration, **When** `EXPLAIN ANALYZE SELECT * FROM clinic_invoices WHERE therapist_id = '<uuid>'`, **Then** plan usa `idx_clinic_invoices_therapist_id`.
3. **Given** post-migration, **When** `EXPLAIN ANALYZE SELECT * FROM clinical_history WHERE entry_type = '<tipo>'`, **Then** plan usa `idx_clinical_history_entry_type`.
4. **Given** post-migration, **When** `EXPLAIN ANALYZE SELECT * FROM clinical_history WHERE diagnosis_id = '<uuid>'`, **Then** plan usa `idx_clinical_history_diagnosis_id`.

---

### Edge Cases

- **FK con nombre distinto en live vs spec**: si Phase 1 audit revela que `commissions.therapist_id` fue renombrada a `commissions.therapist_profile_id` (ejemplo hipotético), la migration debe usar el nombre real. Spec FR-001 lo formaliza.
- **Índice ya existe**: uno de los 7 FKs puede ya tener un índice (creado manualmente o por otra migración previa). Phase 1 detecta y elimina de la lista el que ya esté indexado — evitamos `ERROR: relation "idx_..." already exists`. Spec FR-002.
- **Tabla vacía (0 rows)**: el índice se crea igual y es útil para crecimiento futuro. No hay acción especial.
- **Tabla con millones de rows**: `CREATE INDEX` sin `CONCURRENTLY` adquiere `ShareLock` y bloquea writes durante la operación. Para tablas chicas (< 100K rows) es instantáneo. Para tablas grandes (> 1M) puede ser segundos-minutos. Phase 1 captura row counts para estimar; si alguna excede umbral, considerar `CONCURRENTLY` (spec FR-005). Al 2026-04-20, ninguna de las 7 tablas está en ese rango según el audit previo.
- **Una columna FK con CAST peculiar**: ej. `clinical_history.entry_type` podría ser `text` mientras `clinical_entry_types.id` es `text` también — o uno podría ser enum. Phase 1 Query B captura `data_type` por si hay mismatch que afecte performance del índice.
- **Índice btree default vs parcial**: este spec usa **btree estándar sin predicado**. Ningún FK listado tiene un patrón de consulta que se beneficie de un índice parcial (ej. `WHERE status = 'active'`). Si Phase 3 EXPLAIN ANALYZE sugiere lo contrario, se documenta como candidato para spec futura de tuning.
- **EXPLAIN ANALYZE usa Seq Scan post-index**: posible en tablas tan chicas que el planner decide que Seq Scan es más rápido. No es falla — el índice existe y se usará cuando crezca. FR-007 tolera este caso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ejecutar un audit defensivo previo que confirme los 7 FKs listados existen en live state del schema (`pg_constraint` + `pg_attribute`) — por si alguna tabla fue renombrada o constraint cambió entre el audit original (2026-04-20 Express block) y el momento de apply.
- **FR-002**: El audit defensivo DEBE confirmar que **NO existe índice** en ninguna de las 7 columnas FK (`pg_indexes`), para evitar errores por duplicado. Si alguno ya está indexado, se elimina de la lista de esta migration y se documenta.
- **FR-003**: El audit DEBE capturar row counts aproximados por tabla (`pg_class.reltuples` o equivalente) como baseline — no bloqueante, informativo para decidir si hace falta `CONCURRENTLY` y para dimensionar tiempo esperado de apply.
- **FR-004**: Si el audit revela una discrepancia (FK no existe, índice ya existe, columna con nombre distinto), el sistema DEBE detener la ejecución y reportar antes de aplicar cualquier migration (respeta Principio IV Micro-Bloques).
- **FR-005**: La migration DEBE crearse como archivo `supabase/migrations/20260420000003_add_missing_fk_indexes.sql`, con estructura canonical replicando specs 006/009: header comment + DO $$ pre-check + statements CREATE INDEX + DO $$ post-check + rollback comentado.
- **FR-006**: Cada índice DEBE seguir la naming convention `idx_<table>_<column>` (ej. `idx_appointments_service_id`). Los 7 nombres finales:
  - `idx_appointments_service_id`
  - `idx_commissions_therapist_id`
  - `idx_commissions_sale_id`
  - `idx_clinic_invoices_patient_id`
  - `idx_clinic_invoices_therapist_id`
  - `idx_clinical_history_entry_type`
  - `idx_clinical_history_diagnosis_id`
- **FR-007**: Los índices DEBEN ser btree estándar (default de PostgreSQL), sin predicado `WHERE`. Esto cubre el patrón de consulta de las 7 columnas (equality filter en FK); tuning adicional queda para spec futura si Phase 3 lo justifica.
- **FR-008**: El post-check de la migration DEBE verificar que los 7 índices existen en `pg_indexes` y que los 7 FK constraints siguen intactos (no mutados).
- **FR-009**: Phase 3 DEBE ejecutar `EXPLAIN ANALYZE` sobre al menos 2 queries representativas (una de appointments, una de commissions) para confirmar que el query planner usa `Index Scan`. Si el planner usa `Seq Scan` por volumen pequeño, **no es falla** (tolerado por el edge case) — se documenta.
- **FR-010**: El spec NO DEBE modificar ninguna otra parte del schema (no ALTER TABLE, no nuevas columnas, no cambios de RLS).
- **FR-011**: El spec NO DEBE tocar frontend (`src/**`). Todas las queries existentes siguen funcionando con índice o sin él — los índices son transparentes al cliente.
- **FR-012**: El spec NO DEBE crear índices sobre los ~23 FKs de prioridad media/baja (admin_*, arco_*, blog_*, cookie_consents, coupon_uses, etc.). Esos quedan para spec futura dedicada.
- **FR-013**: La migration DEBE usar `CREATE INDEX IF NOT EXISTS` (no `CREATE INDEX`) como defensa extra — aún si Phase 1 confirmó que no existe, el `IF NOT EXISTS` neutraliza cualquier drift entre Phase 1 y Phase 2.

### Key Entities *(include if feature involves data)*

- **`pg_constraint`**: catálogo Postgres de constraints (incluye FKs). Se consulta en Phase 1 para confirmar existencia de los 7 FKs.
- **`pg_attribute`**: catálogo de columnas. Se cruza con `pg_constraint` para validar nombres de columnas FK.
- **`pg_indexes`**: vista de índices vigentes. Se consulta pre-apply (esperando 0 en las columnas objetivo) y post-apply (esperando 7 nuevos).
- **`pg_class.reltuples`**: estimación de row count por tabla (actualizada por `ANALYZE`). No preciso pero suficiente como baseline.
- **Los 7 FKs** (ya listados en FR-006) son las entidades operativas del spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-migration, `SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname IN (<7 nombres>)` devuelve **7** (todos creados).
- **SC-002**: Post-migration, los 7 FK constraints siguen existentes en `pg_constraint` con los mismos nombres que pre-migration (verificable con conteo + nombres).
- **SC-003**: `EXPLAIN ANALYZE SELECT * FROM appointments WHERE service_id = '<uuid-real>'` post-migration muestra `Index Scan using idx_appointments_service_id` (o `Seq Scan` si tabla < umbral del planner, documentado como non-failure).
- **SC-004**: `EXPLAIN ANALYZE SELECT * FROM commissions WHERE therapist_id = '<uuid-real>'` post-migration muestra `Index Scan using idx_commissions_therapist_id` (o `Seq Scan` tolerado).
- **SC-005**: 0 regresiones visibles en frontend post-deploy — los índices son transparentes al cliente (SC implícito pero medible por absencia de reportes en los 7 días post-deploy).
- **SC-006**: El tiempo de apply de la migration es < 30 segundos total (para las 7 tablas actuales; si alguna excede, se documenta como hallazgo y se considera `CONCURRENTLY`).
- **SC-007**: El spec NO modifica `supabase/policies.sql`, ni crea migraciones previas en `supabase/migrations/` — validable por `git diff` sobre esos paths.

## Assumptions

- El proyecto Supabase activo es `tomremkbuxvedliyywbo` (DentalSpot). Schema `public`.
- Los 7 FKs listados existen hoy con los nombres de tabla y columna tal como aparecen — Phase 1 lo confirma empíricamente.
- Ninguna de las 7 tablas tiene más de 1M rows al 2026-04-20. Si Phase 1 Query C (row counts) revela >1M en alguna, se decide si usar `CONCURRENTLY` (FR-005 lo permite).
- `CREATE INDEX` sin `CONCURRENTLY` toma ShareLock breve; para tablas < 100K rows es instantáneo, < 1M es sub-segundo. Aceptable para Supabase SQL Editor.
- La naming convention `idx_<table>_<column>` es consistente con el resto del repo (a validar con `grep idx_ supabase/migrations/` si hay duda).
- Danissa aplica la migration vía SQL Editor. El ejecutor (Claude) escribe el archivo y las queries; no aplica por sí solo (misma regla operativa que spec 009).
- Las queries `EXPLAIN ANALYZE` de Phase 3 se corren con un uuid real (cualquier row existente) en un entorno con data mínima. Si la tabla está vacía, el EXPLAIN omite el scan completamente — se documenta como non-failure.

## Rollback Plan

### Abort triggers

1. **Pre-check FAIL**: Phase 1 (o la DO $$ pre-check del migration) detecta que un FK listado no existe en live O que un índice ya existe en una columna objetivo. Acción: ajustar lista de la migration y re-validar antes de apply.
2. **Post-check FAIL**: al aplicar la migration, la DO $$ post-check detecta que `pg_indexes` count != 7 O que algún FK constraint mutó. Acción: `DROP INDEX IF EXISTS` de los que alcanzaron a crearse + revert.
3. **Query planner rechaza los índices sistemáticamente**: Phase 3 EXPLAIN ANALYZE sobre 2 queries muestra que el planner no usa los índices ni con `SET enable_seqscan = OFF`. Raro pero posible por estadísticas desactualizadas. Acción: `ANALYZE <tabla>` explícito y reintento. Si persiste, investigar root cause (posible corrupción de índice) y considerar DROP + recreate.

### Protocolo de rollback

1. **Stop** — no más cambios en la branch.
2. **Ejecutar en SQL Editor**:
   ```sql
   DROP INDEX IF EXISTS public.idx_appointments_service_id;
   DROP INDEX IF EXISTS public.idx_commissions_therapist_id;
   DROP INDEX IF EXISTS public.idx_commissions_sale_id;
   DROP INDEX IF EXISTS public.idx_clinic_invoices_patient_id;
   DROP INDEX IF EXISTS public.idx_clinic_invoices_therapist_id;
   DROP INDEX IF EXISTS public.idx_clinical_history_entry_type;
   DROP INDEX IF EXISTS public.idx_clinical_history_diagnosis_id;
   ```
3. **`git revert <commit-merge-011>`** para retirar la migration del historial.
4. **Abrir spec 011.1** con scope ajustado según el trigger disparado.

### Non-rollback triggers

- **Post EXPLAIN ANALYZE usa `Seq Scan` en 1 tabla específica** porque la tabla es muy chica y el planner decide que Seq Scan es óptimo → documentar, no revertir. El índice existe y se usará cuando crezca.
- **Apply toma > 30s pero < 5 min** en alguna tabla (SC-006 excedido pero dentro de tolerancia) → documentar como hallazgo, no revertir. Considerar `CONCURRENTLY` para spec futura.
- **Estadísticas desactualizadas hacen que el primer EXPLAIN ANALYZE post-apply no use índice**, pero `ANALYZE <tabla>` + re-EXPLAIN sí → documentar como non-event.

## Scope Bounds

- **Archivos autorizados a crear**: `supabase/migrations/20260420000003_add_missing_fk_indexes.sql` (único archivo nuevo).
- **Archivos NO autorizados a modificar**:
  - `src/**` — FR-011 (código cliente no se toca).
  - `supabase/policies.sql`, otros archivos bajo `supabase/` fuera de `migrations/20260420000003`.
  - `supabase/migrations/` pre-existentes — append-only.
- **FKs NO incluidos** (fuera de scope, spec futura dedicada):
  - `admin_*_table` FKs (admin_audit_log, admin_sessions, etc.).
  - `arco_*` tablas (arco_requests, arco_attachments).
  - `blog_*` tablas (blog_posts, blog_tags, blog_article_tags).
  - `cookie_consents`, `coupon_uses`, `course_*`, `educator_*`, `legal_*`, `marketing_*`, `marketplace_review_votes`, `membership_*`, `meta_*`, `patient_reviews`, `pie_*`, `plan_*` (excepto ya cubiertos), `session_activities.*` (excepto ya cubiertos), `specialty_*`, `therapist_*` (excepto ya cubiertos), `wallet_*`.
  - Total excluidos: ~23 FKs según architecture.md §Performance audit.
- **Si Phase 1 revela que el audit original mal-identificó un FK** (ej. la columna no existe con ese nombre): STOP → reportar → decidir con Danissa si se ajusta el FK de la lista o se defiere.
