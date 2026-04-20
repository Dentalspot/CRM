# Data Model: Add Missing FK Indexes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Date**: 2026-04-20
**Source of evidence**: 3 queries ejecutadas por Danissa en Supabase SQL Editor (project `tomremkbuxvedliyywbo`) — MCP `execute_sql` denegado por política de shared infrastructure (patrón conocido de sesión).

---

## §Phase 1 Pre-check snapshot (queries ejecutadas 2026-04-20)

### Query A — existencia de los 7 FKs

`SELECT ... FROM pg_constraint c JOIN pg_class/pg_attribute ... WHERE c.contype='f' AND filter 7 FKs ORDER BY table, column`.

**Output**: **7 filas** (T1 PASS clean). Los 7 FKs listados por el Express block audit existen vigentes en live state con los nombres de tabla + columna esperados.

### Query B — índices pre-existentes sobre las 7 columnas

`SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN (4 tablas) AND indexdef LIKE` con 3 variantes por columna (`(col)`, `(col,`, `, col)`).

**Output**: **0 filas cubriendo ninguna de las 7 columnas** (T2 PASS clean). No hay índice pre-existente sobre:
- `appointments.service_id`
- `commissions.therapist_id`
- `commissions.sale_id`
- `clinic_invoices.patient_id`
- `clinic_invoices.therapist_id`
- `clinical_history.entry_type`
- `clinical_history.diagnosis_id`

**Confirmación operativa**: las 7 columnas están sin índice. Todas proceden a `CREATE INDEX` en Phase 2 sin skip.

### Query C — row counts baseline

`SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' AND relname IN (4 tablas) ORDER BY n_live_tup DESC`.

**Output**:

| table_name | n_live_tup |
|---|---|
| `appointments` | 14 |
| `clinical_history` | 5 |
| `clinic_invoices` | 0 |
| `commissions` | 0 |

**Observaciones críticas**:

- **Todas las tablas son diminutas** (< 100 rows). El beneficio inmediato del índice será imperceptible — PostgreSQL correctamente usará `Seq Scan` por ser más rápido que random seek en tablas tan chicas.
- **CONCURRENTLY NO es necesario**: con <100 rows por tabla, `CREATE INDEX` es instantáneo y el ShareLock es imperceptible. `CONCURRENTLY` se omite de la migration.
- **Los índices son preventivos**: se crean ahora para que cuando las tablas crezcan (meses/años adelante), el planner ya tenga la herramienta disponible sin requerir intervención manual. Evita el retorno al audit en el futuro.

---

## §FK verification matrix

Las 7 filas finales que alimentan el Phase 2. Acción uniforme: todas proceden a `CREATE INDEX` (R-02 mitigation clean, ningún skip).

| # | FK (table.column → ref) | Exists (A) | Pre-existing index (B) | Row count (C) | Action Phase 2 | Index name |
|---|---|---|---|---|---|---|
| 1 | `appointments.service_id → therapist_services.id` | ✅ yes | none | 14 | CREATE | `idx_appointments_service_id` |
| 2 | `clinic_invoices.patient_id → patients.id` | ✅ yes | none | 0 | CREATE | `idx_clinic_invoices_patient_id` |
| 3 | `clinic_invoices.therapist_id → profiles.id` | ✅ yes | none | 0 | CREATE | `idx_clinic_invoices_therapist_id` |
| 4 | `clinical_history.diagnosis_id → patient_diagnoses.id` | ✅ yes | none | 5 | CREATE | `idx_clinical_history_diagnosis_id` |
| 5 | `clinical_history.entry_type → clinical_entry_types.id` | ✅ yes | none | 5 | CREATE | `idx_clinical_history_entry_type` |
| 6 | `commissions.sale_id → sales.id` | ✅ yes | none | 0 | CREATE | `idx_commissions_sale_id` |
| 7 | `commissions.therapist_id → profiles.id` | ✅ yes | none | 0 | CREATE | `idx_commissions_therapist_id` |

**Total**: 7 CREATE INDEX. 0 skip. 0 ajustes.

---

## §Policy strategy decision

### Policy count esperado post-migration

- Pre-check del migration: `fk_count == 7` AND `idx_count == 0` (sobre las 7 columnas objetivo).
- Post-check: `fk_count == 7` (FKs intactos) AND `idx_count == 7` (los 7 nuevos).

### CONCURRENTLY

**Omitido**. Justificación: tabla más grande es `appointments` con 14 rows. `CREATE INDEX` estándar es instantáneo y el ShareLock es imperceptible (< 1ms). `CONCURRENTLY` agregaría complejidad (necesita estar fuera del DO block / fuera de transacción) sin beneficio real.

Si en el futuro las tablas crecen a >1M rows y hace falta otro pase, spec dedicada lo justificaría.

### EXPLAIN ANALYZE expectation (Phase 3 Parte 4)

**FR-009 tolerancia activada**: las 4 tablas tienen < 100 rows (appointments=14 es la mayor). PostgreSQL planner correctamente elegirá `Seq Scan` sobre `Index Scan` porque es más rápido en tablas diminutas (~14 rows cabe en una sola página — random seek con índice es overhead puro).

**Esperado en Phase 3**: EXPLAIN ANALYZE sobre `appointments.service_id` y `commissions.therapist_id` muestran **`Seq Scan`** — esto es **PASS tolerado** (FR-009 + edge case del spec), NO dispara R-03. El test confirma que (a) el índice existe en `pg_indexes`, (b) el planner es consciente de él y lo descartó por volumen. Validación indirecta: si se corre `SET enable_seqscan = OFF; EXPLAIN ANALYZE ...;` el planner elegirá el índice — prueba disponible opcional si se duda.

**R-03 no-dispara con tablas <100 rows**. Solo dispararía si, en el futuro, alguna tabla crece a >100 rows y el planner sigue eligiendo Seq Scan tras ANALYZE — escenario fuera de este spec.

---

## §SP-1 checks

| # | Check | Criterio | Estado |
|---|---|---|---|
| **T1** | Query A retorna 7 FKs | `COUNT = 7` | ✅ PASS |
| **T2** | Query B retorna 0 índices cubriendo las 7 columnas | `0 rows covering` | ✅ PASS |
| **T3** | Query C retorna 4 row counts con valor numérico | 4 filas, max 14 | ✅ PASS (tablas <100, FR-009 tolerance activada para Phase 3) |

**3/3 PASS. SP-1 cleared. 🟢 GO Phase 2** (confirmado por advisor en turno 2026-04-20).

### Hallazgos laterales (no bloqueantes)

- **R-01 (FK renombrado) NO DISPARADO**: los 7 FKs existen con los nombres del spec, literal.
- **R-02 (índice no estándar pre-existente) NO DISPARADO**: Query B con 3 variantes LIKE retornó 0 covers.
- **R-03 (Seq Scan post-apply) PRE-EMPTIVAMENTE ACEPTADO**: por tamaño de tabla, se espera Seq Scan en Phase 3. Documentado como non-failure; no dispara abort.
- **Tabla más grande**: `appointments` con 14 rows. Lejos del umbral de 1M que requeriría `CONCURRENTLY`.
- **Beneficio preventivo**: los 7 índices sostendrán queries futuros cuando las tablas crezcan sin requerir otro audit manual.
