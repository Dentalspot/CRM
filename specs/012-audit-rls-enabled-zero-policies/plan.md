# Implementation Plan: Audit RLS-Enabled Zero-Policies Tables

**Branch**: `012-audit-rls-enabled-zero-policies` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-audit-rls-enabled-zero-policies/spec.md`

## Summary

Discovery-pure spec: inventario priorizado de tablas `RLS enabled + 0 policies`. Phase 1 = 2 queries SQL (Query A lista live de tablas afectadas vía `pg_tables LEFT JOIN pg_policies`; Query B `n_live_tup` baseline). Phase 2 = grep sistemático en `src/` + `supabase/functions/` por cada tabla detectada, con classifier frontend activo / edge function / feature-flagged / dead code. Phase 3 = categorización determinística en 4 GROUPs (A rojo / B amarillo / C verde / D gris) por reglas binarias. Phase 4 = deliverables (data-model.md matrix + architecture.md subsección + templates spec follow-up por tabla GROUP A). **Cero código tocado.** Time budget: **1h** (10+20+20+10 min). Patrón canónico de referencia: `docs/PATTERNS.md §5` (preventive mini-audit).

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 Supabase) para Phase 1. Bash/grep para Phase 2. No JS/TS.
**Primary Dependencies**: Catálogos Postgres (`pg_tables`, `pg_policies`, `pg_stat_user_tables`). grep local sobre repo.
**Storage**: N/A. Sin escrituras en DB. Sin migrations.
**Testing**: manual — lector externo valida que puede decidir próximo sprint en ≤10 min (SC-004).
**Target Platform**: producción Supabase (read-only) + repo local para grep.
**Project Type**: Discovery / audit. Output = 2 archivos .md.
**Performance Goals**: N/A. Scope chico, minutos.
**Constraints**:
- **FR-007**: 0 DDL, 0 policies.
- **FR-008**: 0 cambios en `src/`, `supabase/migrations/`, `supabase/policies.sql`.
- **FR-009**: exactamente 2 artefactos output (`data-model.md` crear + `architecture.md` subsección append).
- **FR-011**: solo RLS enabled + 0 policies; otras categorías del RLS coverage audit fuera de scope.
**Scale/Scope**: ~20 tablas detectadas esperadas (contexto del user). Si Phase 1 retorna muy distinto (>30 o <10), documentar como hallazgo lateral.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Sí (indirecto) | ✅ PASS | Identificar gaps §II es paso 1 del compliance posterior. Discovery no modifica acceso a PHI. |
| **II. RLS-First Security** | Sí (driver) | ✅ PASS | Este spec es aplicación correctiva preventiva — produce inventario para habilitar remediación disciplinada. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca `clinical_audit_log` ni hooks. |
| **IV. Micro-Bloques** | Sí | ✅ PASS con guardrail | FR-006 anti-scope-creep: si GROUP A > 5 → meta-spec en vez de N specs individuales. Scope discovery-pure ya respeta Principio IV al no intentar fixear acá. |
| **V. UI Honesty** | No | ✅ N/A | No toca UI. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No agrega ni renombra columnas. |

**Resultado**: sin violaciones. El spec es literalmente meta-work para otras specs — Principio IV aplicado antes de abrir las de remediación.

## Project Structure

### Documentation (this feature)

```text
specs/012-audit-rls-enabled-zero-policies/
├── spec.md                    # /speckit-specify (commit 0a3c0aa)
├── plan.md                    # este archivo
├── data-model.md              # output Phase 1-4 — matrix + templates
├── checklists/
│   └── requirements.md        # /speckit-specify (12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**Nada.** Este spec no autoriza tocar `src/`, `supabase/`, ni otros docs salvo el que FR-009 especifica.

```text
.specify/memory/
└── architecture.md            # MODIFY — append subsección §"RLS enabled zero-policies audit (2026-04-20)"
```

**Archivos NO autorizados** (dispara FR-007/008):
- Todo `src/**`.
- Todo `supabase/**`.
- Otros docs fuera de `architecture.md`.

**Structure Decision**: discovery con 2 deliverables. `data-model.md` contiene detalle completo (Phase 1-4). `architecture.md §RLS enabled zero-policies audit` es el resumen auto-referente (SC-004 — lector externo decide sprint en ≤10 min sin volver a queries).

---

## Phase 0 — Risk Register

### R-01. Tabla categorizada A pero en realidad es edge-function-only

**Síntoma potencial**: grep de frontend retorna match en un archivo que en realidad es un hook o API wrapper que SOLO se invoca desde un edge function (indirectamente) o desde un contexto admin con service_role. Clasifico como GROUP A por error → el template de spec follow-up se escribe para una "feature rota" que en realidad no está rota.

**Mitigación**: el classifier de Phase 2 no es binario "hay match = frontend activo". Se valida el contexto:
- Archivo bajo `supabase/functions/` → edge function (service_role bypass) → GROUP C.
- Archivo bajo `src/lib/api/` o `src/features/<x>/api/` → leer 3 líneas de contexto para ver si se invoca desde componente visual o desde un wrapper que solo se llama desde backend.
- Si ambiguo → marcar "UNCLEAR — verificar manualmente" y NO asignar A automáticamente. Spec template NO se genera para ambiguos.

### R-02. GROUP A demasiado grande (>5 tablas) → meta-spec obligatorio

**Síntoma potencial**: la priorización revela que >5 tablas tienen usuarios activos impactados hoy. Generar N templates individuales violaría el spirit del spec (discovery → acción ordenada) y sobrecargaría el backlog. Intentar fixear todo en una spec violaría Principio IV.

**Mitigación**: FR-006 lo formaliza. Si GROUP A > 5:
1. No generar N templates individuales.
2. Generar **1 template de meta-spec** con criterio de agrupación (por dominio: paciente / facturación / AI / contenido).
3. El meta-spec decide si se abre 1 spec por dominio o 1 spec total que cubre varias tablas por cercanía funcional.
4. Documentar explícitamente la decisión en `data-model.md §Follow-up specs — meta-spec recommendation`.

### R-03. Feature flag cambió estado sin documentar

**Síntoma potencial**: el classifier de Phase 2 categoriza una tabla como GROUP D (feature-flag OFF) basándose en un `FEATURE_FLAGS.XXX = false` en `src/constants/featureFlags.js`. Pero la lista de feature flags cambió entre el Express block audit (2026-04-20) y hoy — quizá una flag se activó o una se removió (ej. `VOICE_VISUALIZER` removido en spec 010). Sin re-verificar flag state, GROUP D puede estar mal.

**Mitigación**: Phase 2 incluye lectura de `src/constants/featureFlags.js` fresh como paso previo al classifier. El estado actual del archivo es la fuente de verdad (no snapshot). Cualquier callsite envuelto en un `FEATURE_FLAGS.XXX` referencia el valor leído fresh — si la flag ya no existe (fue removida), el código probablemente está roto (grep separado lo detectaría como hallazgo lateral).

---

## Phase 1 — Audit Live State (~10 min, STOP POINT SP-1)

**Objetivo**: capturar la lista actual y verificable de tablas `RLS enabled + 0 policies` + sus row counts. Base de todo el resto del spec.

**Regla operativa** (`PATTERNS.md §5`): queries a catálogos Postgres, read-only, 0 efectos secundarios.

### P1.1 — Query A: tablas RLS enabled + 0 policies

Danissa ejecuta en Supabase SQL Editor (MCP denegado para DentalSpot project, patrón conocido). Query A:

```sql
SELECT
  t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname
  AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;
```

**Output esperado**: lista de ~20 tablas (contexto del user, ± 5).

**Scope checks**:
- Si retorna `< 10` → hallazgo lateral (muchas tablas fueron remediadas entre audit original y hoy).
- Si retorna `> 30` → hallazgo lateral (hay drift entre `architecture.md §RLS coverage audit` y live DB).
- Cotejar con lista del contexto del user. Diferencias documentadas en `data-model.md §Discrepancies vs audit original`.

### P1.2 — Query B: row counts baseline

Para las tablas retornadas por Query A, Danissa ejecuta:

```sql
SELECT
  relname AS table_name,
  n_live_tup AS estimated_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (<lista de Query A, ej. 'billing_invoices', 'orders', ...>)
ORDER BY n_live_tup DESC, relname ASC;
```

**Output esperado**: una fila por tabla con row count estimado.

**Uso**: alimenta el classifier GROUP A vs B (row count > 0 vs = 0).

### P1.3 — Persistir en `data-model.md §Phase 1 snapshot`

- Output literal de Query A (lista de tablas).
- Output literal de Query B (tabla con row counts).
- **Discrepancias vs contexto user**: tablas nuevas detectadas / tablas ya remediadas / coincidencias exactas.
- Total esperado post-Phase 1: ~20 filas con `table_name` + `estimated_rows`.

### P1.4 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | Query A retorna lista | `COUNT >= 1` | Si 0 → el audit original está completamente desactualizado; investigar. |
| **T2** | Query B retorna row counts para cada tabla de Query A | `rows_B == rows_A` | Si alguna tabla de Query A no aparece en Query B → tabla inactiva (probable), documentar y continuar con `n_live_tup = 0`. |
| **T3** | Discrepancia vs contexto ≤ 5 tablas | `|live| - |contexto| ≤ 5` | Si >5 → reportar como hallazgo material y consultar con Danissa antes de Phase 2 (puede ser drift severo). |

**Reporte a Danissa**:

```markdown
## Phase 1 Report — spec 012

- Query A output: [N tablas listadas]
- Query B output: [row counts por tabla, descendente]
- Discrepancias: [X tablas nuevas vs contexto, Y ya remediadas, Z coincidencia exacta]
- Scope check: T1 ✅ · T2 ✅ · T3 ✅
- Recomendación: proceder a Phase 2 / ajustar lista / consultar

🟢 GO / 🔴 STOP
```

**Sin GO, no se ejecuta Phase 2.**

---

## Phase 2 — Callsite Census (~20 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO.

### P2.1 — Lectura inicial de feature flags (R-03 mitigation)

Leer `src/constants/featureFlags.js` fresh antes del classifier. Identificar qué flags están `false` actualmente. Ejemplo post-spec 010:

```
PIE_ESCOLAR: false
ADOS2: false
ADIR: false
TEA: false
SENSORIAL_PROFILE: false
EDUCATOR: false
(VOICE_VISUALIZER removido en spec 010)
```

Este set es la fuente de verdad para clasificar GROUP D en FR-004.

### P2.2 — Grep sistemático por tabla

Para **cada tabla** de la lista Phase 1, ejecutar 2 greps:

```bash
# Grep 1: callsites frontend (src/)
grep -rn "from(['\"]\?<table>['\"]\\?" src/ 2>/dev/null

# Grep 2: callsites edge function (supabase/functions/)
grep -rn "from(['\"]\?<table>['\"]\\?" supabase/functions/ 2>/dev/null
```

Notación `['"]\?` captura ambos estilos de quote (`'table'` y `"table"`).

### P2.3 — Classifier por callsite

Para cada match del grep, leer **3 líneas de contexto** (`-B1 -A2`) para determinar:

| Contexto | Señal | Categoría callsite |
|---|---|---|
| Match bajo `supabase/functions/` | cualquiera | **edge_function** (usa service_role, no afectado por RLS) |
| Match bajo `src/` envuelto en `FEATURE_FLAGS.<X> &&` con `<X>` en set de false | condicional OFF | **feature_flagged_off** |
| Match bajo `src/pages/`, `src/features/<x>/pages/`, `src/components/` y render visible | archivo user-facing | **frontend_activo** |
| Match bajo `src/features/<x>/api/`, `src/hooks/`, `src/lib/api/` invocado desde archivo user-facing | wrapper con consumer activo | **frontend_activo** (verificar chain con grep del wrapper) |
| Match bajo `src/features/<x>/api/` o `src/hooks/` invocado desde archivo admin-only o edge function | wrapper sin consumer frontend | **dead_code** o **edge_function_only** |
| Ambiguo (no se puede clasificar sin lectura profunda) | — | **UNCLEAR** (marcar, NO auto-asignar GROUP) |

### P2.4 — Matrix CSV-like en `data-model.md §Phase 2 census`

Por cada tabla:

```text
| Tabla | Row count | Callsites totales | Frontend activo | Edge function | Feature-flagged OFF | Dead code | Unclear | Notas |
|---|---|---|---|---|---|---|---|---|
| billing_invoices   | N1 | 3 | 3 | 0 | 0 | 0 | 0 | BillingHistory, useInvoices, commissionsApi |
| patient_evaluations| N2 | 2 | 2 | 0 | 0 | 0 | 0 | lib/patientApi.js (2 queries) |
| course_lessons     | N3 | 1 | 0 | 0 | 1 | 0 | 0 | EDUCATOR flag OFF |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
```

### P2.5 — **STOP POINT SP-2**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T4** | Matrix cubre todas las tablas de Phase 1 | `rows_matrix == rows_Phase1` | Si alguna tabla no aparece, documentar motivo. |
| **T5** | UNCLEAR ≤ 10% del total | `unclear_count / total ≤ 0.1` | Si >10% → grep no fue suficiente; leer callsites manualmente. |
| **T6** | Time budget Phase 2 ≤ 25 min | stopwatch | Si >25 min → aplicar heurística: reducir scope a 10 tablas más probables de GROUP A (mayores row counts + callsites no-nulos) y deferir el resto a Phase 4 como "pendiente de análisis". |

**Reporte intermedio a Danissa** (optativo si sale rápido):

```markdown
## Phase 2 Intermediate — spec 012

- Matrix filled: [N/N tablas]
- Unclear: [M tablas con motivo]
- Time: [Y min]
- Ready for Phase 3 priorización
```

---

## Phase 3 — Priorización Determinística (~20 min, STOP POINT SP-3)

**Prerequisito**: SP-2 pasa (matrix completa).

### P3.1 — Reglas de asignación GROUP (FR-004 formalizado)

Para cada tabla de la matrix, aplicar en este orden (el primer match gana):

```text
IF feature_flagged_off > 0 AND frontend_activo = 0 AND edge_function = 0:
  → GROUP D (gris — dormant por flag; reevaluar al activar)

ELSE IF frontend_activo = 0:
  → GROUP C (verde — 0 callsites frontend activos; intencional o dead)

ELSE IF row_count > 0 AND frontend_activo > 0:
  → GROUP A (rojo — usuarios impactados HOY; remediar con spec dedicada)

ELSE IF row_count = 0 AND frontend_activo > 0:
  → GROUP B (amarillo — feature pre-launch; remediar antes del primer usuario)

ELSE:
  → UNCLEAR_GROUP (requiere decisión humana; marcar y escalate)
```

### P3.2 — User impact estimation para GROUP A

Por cada tabla en GROUP A, documentar:

- **¿Qué usuarios afectados?** Ej. "todos los terapeutas que consultan historial de facturación" para `billing_invoices`.
- **¿Qué ven rotos?** Ej. "lista de facturas aparece vacía cuando sí hay facturas en DB".
- **Frecuencia estimada**: frequency basada en flujo (diaria si es dashboard principal; ocasional si es vista secundaria).
- **Severidad**: bloqueante / degradación / cosmético.

### P3.3 — Persistir en `data-model.md §Phase 3 priorización`

```markdown
| Tabla | GROUP | Row count | Frontend activo | User impact summary |
|---|---|---|---|---|
| billing_invoices | 🔴 A | N | 3 | Terapeutas ven lista vacía de facturas; bloqueante en dashboard |
| patient_evaluations | 🔴 A | M | 2 | Pacientes + terapeutas ven evaluaciones vacías; bloqueante en ficha |
| course_lessons | ⚪ D | 0 | 0 (EDUCATOR OFF) | Dormant; reevaluar si EDUCATOR se activa |
| ... | ... | ... | ... | ... |
```

### P3.4 — **STOP POINT SP-3** · decisión meta-spec vs N specs

Contar tablas en GROUP A. **Criterio crítico de FR-006**:

| Conteo GROUP A | Decisión Phase 4 |
|---|---|
| 0 | No se generan templates (non-failure per SC-002 clause). Documentar "no urgencia detectada". |
| 1-5 | Generar N templates individuales, 1 por tabla. Nombre sugerido: `write-policies-<table>`. |
| > 5 | **NO generar N templates**. Generar 1 template de meta-spec + criterio de agrupación (por dominio). Escalate a Danissa en el reporte final. |

**Reporte de Phase 3 a Danissa**:

```markdown
## Phase 3 Report — spec 012

- GROUP A: [N tablas] — [lista]
- GROUP B: [M tablas] — [lista]
- GROUP C: [X tablas] — [lista]
- GROUP D: [Y tablas] — [lista]
- UNCLEAR_GROUP: [Z tablas] — [lista con razones]
- Decisión Phase 4: N templates individuales / 1 meta-spec / no templates
- User impact highlight: [tabla con mayor severidad]

🟢 GO a Phase 4 con estrategia [X]
```

---

## Phase 4 — Deliverables (~10 min)

**Prerequisito**: SP-3 con decisión de estrategia.

### P4.1 — Completar `data-model.md`

Agregar secciones finales:

- **§Phase 4 Follow-up specs**: templates por tabla GROUP A (o 1 meta-spec si GROUP A > 5).
- **§Backlog para architecture.md**: GROUP B/C/D clasificados para el backlog formal.
- **§Hallazgos laterales**: discrepancias con contexto original, UNCLEAR items pendientes, drift con `architecture.md §RLS coverage audit`.

### P4.2 — Agregar subsección a `architecture.md`

Nueva subsección **después** del bloque existente `§RLS coverage audit`:

```markdown
### RLS enabled zero-policies audit (2026-04-20)

Complemento al §RLS coverage audit: auditoría dedicada a las tablas con
RLS enabled + 0 policies (deny-all silent para auth users).

**Summary** (de spec 012):

| GROUP | Cuenta | Significado | Acción |
|---|---|---|---|
| 🔴 A | N | Active hoy, usuarios impactados | Spec dedicada (o meta-spec si >5) |
| 🟡 B | M | Pre-launch | Backlog, fix preventivo |
| 🟢 C | X | Intencional / edge-function-only | Documentado, dejar |
| ⚪ D | Y | Feature-flagged OFF | Reevaluar al activar flag |

**Follow-up specs preparados en** `specs/012-.../data-model.md §Follow-up specs`:
- `write-policies-<table_a>` (1 por tabla GROUP A, o meta-spec si >5)

[resumen de 3-5 líneas con user impact crítico y próximo paso]
```

### P4.3 — Template de spec follow-up (por tabla GROUP A)

Formato en `data-model.md`:

```markdown
### Template: spec `write-policies-<table>`

**Contexto**: `<table>` está en GROUP A del audit 012 (commit `<hash>`):
- Row count: N
- Callsites frontend activos: M
- User impact: <descripción>

**Scope sugerido** (para `/speckit-specify`):
- Crear migration `supabase/migrations/<timestamp>_write_policies_<table>.sql`
- 2-4 policies candidatas basadas en patrón de callsites:
  * [si callsite filtra por `user_id`] `Users read own <table>` FOR SELECT USING (auth.uid() = user_id)
  * [si hay INSERT] `Users insert own <table>` FOR INSERT WITH CHECK (auth.uid() = user_id)
  * [si aplica] `Admin manage <table>` FOR ALL con is_admin check
- Referencia canonical: spec 009 migration `20260420000002` + `PATTERNS.md §4/§5`
- Phase 3 verification: EXPLAIN ANALYZE + smoke test del callsite principal

**Callsites literales a validar post-fix**:
- [lista del grep]
```

### P4.4 — Commit final

1 commit único cubriendo los 2 artefactos (data-model.md creado + architecture.md subsección appended):

```
docs: close spec 012 — RLS enabled zero-policies audit + [N] follow-up templates
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio Phase 1 | Plan aprobado | Danissa ejecuta Query A + B en SQL Editor |
| **SP-1** | Fin Phase 1 | Lista de tablas + row counts T1-T3 PASS | Solo entonces → Phase 2 grep |
| **SP-2** | Fin Phase 2 | Matrix completa T4-T6 PASS (unclear ≤10%, time ≤25min) | Solo entonces → Phase 3 priorización |
| **SP-3** | Fin Phase 3 | GROUP A count + decisión estrategia Phase 4 | Solo entonces → Phase 4 deliverables |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit live state | **10 min** | Query A + Query B + snapshot + SP-1 report |
| Phase 2 — Callsite census | **20 min** | featureFlags.js read + grep ~20 tablas + classifier + matrix |
| Phase 3 — Priorización | **20 min** | Reglas GROUP A/B/C/D + user impact estimation + SP-3 report |
| Phase 4 — Deliverables | **10 min** | data-model.md §Follow-up + architecture.md §nueva + commit |
| **Total** | **1h (60 min)** | Cumple bound del spec |

**Fallback de FR-006/T6**: si Phase 2 grep tarda >25 min (por grep interactivo, re-reads, unclear chase), reducir scope a **10 tablas más probables de GROUP A** (criterio: mayores `n_live_tup` + nombres con señales de feature activa — `billing_*`, `patient_*`, `commissions_*`). El resto queda documentado como "pendiente de análisis Phase 2 completa" en `data-model.md`. Esta decisión se comunica en el reporte intermedio de SP-2.

---

## References

- `.specify/memory/constitution.md §II` (RLS-First Security) — driver del spec.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento de FR-006 (meta-spec si GROUP A > 5).
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) · `§5` (preventive mini-audit con information_schema / pg_catalog).
- `.specify/memory/architecture.md §RLS coverage audit (2026-04-20)` — punto de partida del spec (lista pre-conocida de tablas).
- Spec 006 commit `9e15c80` — patrón canónico de `ALTER TABLE ENABLE RLS` con policies ya existentes.
- Spec 009 commit `0b89ba3` — patrón canónico de crear policies antes de enable RLS.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Spec discovery-pure proporcional al scope. Los 3 riesgos tienen mitigación sin ampliar alcance; FR-006 resuelve anticipadamente el caso de GROUP A > 5. |
