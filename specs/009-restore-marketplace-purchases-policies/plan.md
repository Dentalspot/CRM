# Implementation Plan: Restore Marketplace Purchases RLS Policies

**Branch**: `009-restore-marketplace-purchases-policies` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-restore-marketplace-purchases-policies/spec.md`

## Summary

Restauración quirúrgica de RLS sobre `marketplace_purchases`. Phase 1 audit defensivo captura estado live (policies vigentes + schema real + patrones de acceso de 13+ callsites) y produce una **decisión fundamentada** entre las 3 estrategias admin de FR-006a (A coexistencia / B replace con ALL / C granular). Phase 2 escribe una migration idempotente en `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` replicando la estructura canónica de la migration spec 006. Phase 3 aplica la migration en partes con smoke tests de buyer + admin flows. Tiempo total estimado: **90 min** (Phase 1: 20 · Phase 2: 15 · Phase 3: 45 · buffer: 10). Patrón canónico de referencia: `supabase/migrations/20260420000001_enable_rls_quick_wins.sql` (spec 006, commit `9e15c80`).

## Technical Context

**Language/Version**: SQL (PostgreSQL 15 de Supabase). No código JS/TS en este spec.
**Primary Dependencies**: Supabase Postgres con RLS nativa. Sin librerías nuevas.
**Storage**: Tabla `marketplace_purchases` (schema `public`) en project `tomremkbuxvedliyywbo`. Tablas relacionadas read-only: `auth.users`, `profiles`, `marketplace_products`, posiblemente `organizations`.
**Testing**: Test manual en Supabase SQL Editor (pre/post-check) + navegación UI con DevTools Console para buyer + admin flows post-migration.
**Target Platform**: Producción Supabase (project ref `tomremkbuxvedliyywbo`).
**Project Type**: Migración DB quirúrgica. No introduce features de producto.
**Performance Goals**: N/A. RLS sobre `marketplace_purchases` agrega overhead mínimo por query (1 policy evaluation); volumen esperado < 10K rows.
**Constraints**:
- **FR-010**: cero cambios de schema.
- **FR-011**: cero cambios en `src/**`.
- **FR-006a**: decisión admin entre 3 estrategias se toma en Phase 1, no pre-decidida.
- **FR-006b**: naming canónico histórico obligatorio.
- El deploy de la migration lo ejecuta Danissa vía Supabase SQL Editor; el ejecutor prepara el archivo + queries.
**Scale/Scope**: 1 archivo nuevo (migration), 0 modificados en `src/`. Regression: 13+ callsites del inventario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Sí (raison d'être) | ✅ PASS | Restaurar RLS para cumplir intent de Ley 19.628/21.719 sobre aislamiento de datos personales con relación comercial. |
| **II. RLS-First Security** | Sí (raison d'être) | ✅ PASS | La vulnerabilidad actual (buyer ve compras ajenas) es exactamente el gap que §II prohíbe. |
| **III. Append-Only Audit** | No directo | ✅ N/A | `marketplace_purchases` no es PHI clínica. Audit fuera de scope. |
| **IV. Micro-Bloques** | Sí | ✅ PASS con guardrails | FR-010/FR-011 formalizan scope (1 migration). Si Phase 1 requiere tocar frontend, se abre spec hermano. |
| **V. UI Honesty** | No directo | ✅ N/A | No se tocan formularios ni mutaciones. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No se agrega ni renombra columna. Se consume schema existente. |

**Resultado**: Sin violaciones. Re-check al cierre de Phase 1.

## Project Structure

### Documentation (this feature)

```text
specs/009-restore-marketplace-purchases-policies/
├── spec.md                    # /speckit-specify (commit 26f13cf)
├── plan.md                    # este archivo
├── data-model.md              # Phase 1 output — schema + policies + matrix callsites + decisión admin
├── checklists/
│   └── requirements.md        # /speckit-specify (iteration 2, 12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase, NO en este plan)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260420000002_restore_marketplace_purchases_policies.sql   # NUEVO — único artefacto de code output

specs/009-.../
├── plan.md                 # este archivo
└── data-model.md           # creado al final de Phase 1

CLAUDE.md                   # update del SPECKIT marker a plan.md de 009 (opcional, low priority)
```

**Archivos NO autorizados** (modificar dispara abort FR-003):
- `src/**` — FR-011.
- `supabase/migrations/*` pre-existentes — append-only.
- `supabase/policies.sql` (master file) — sync post-009 en spec separado.
- Otras tablas RLS-disabled (`marketplace_plans_purchases`, `marketplace_products`): fuera scope, spec hermano si aparece.

**Structure Decision**: convención DentalSpot — migrations timestamped `YYYYMMDDHHMMSS_snake_case.sql`. La migration nueva replica la estructura interna de `20260420000001_enable_rls_quick_wins.sql`.

---

## Phase 0 — Risk Register

### R-01. Columna buyer tiene nombre distinto al asumido

**Síntoma potencial**: Phase 1 Query B revela que la columna identificadora del comprador NO es `buyer_id` (ej. `user_id`, `purchaser_id`, `customer_id`). Si la migration usa `auth.uid() = buyer_id` contra una columna inexistente, `CREATE POLICY` falla con `42703 column does not exist`.

**Mitigación**: Phase 1 Query B captura nombre real → documentado en `data-model.md §Column inventory`. Phase 2 usa ese nombre. SP-1 T1 chequea.

### R-02. `"Admins update"` live tiene USING clause inesperado

**Síntoma potencial**: la policy existente puede usar función distinta a `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)` — ej. función `is_admin()` o JOIN con `organization_users.role`. Si las nuevas policies admin (Estrategia B/C) usan sintaxis distinta, genera inconsistencia.

**Mitigación**: Phase 1 Query A captura `qual` y `with_check` exactos. Las policies nuevas admin replican la misma sintaxis literalmente.

### R-03. 4ta policy no documentada vive hoy

**Síntoma potencial**: el snapshot de spec 006 decía "solo Admins update". Phase 1 Query A puede revelar una policy extra creada manualmente entre abril y ahora. Si es permisiva, las nuevas son redundantes; si es restrictiva, puede romper buyer flows.

**Mitigación**: Phase 1 STOP & REPORT si `policy_count_live != 1` o aparece nombre no contemplado. FR-004 lo formaliza. SP-1 T2 chequea.

### R-04. P3 vendor — columna `vendor_id` no existe

**Síntoma potencial**: User Story 3 asume posible `vendor_id`. Si Query B no retorna ninguna columna vendor, User Story 3 queda N/A. No bloqueante, pero hay que documentarlo.

**Mitigación**: Phase 1 Query B decide. Si N/A, FR-006 stays mínimo (2 policies buyer + estrategia admin).

### R-05. `buyer_id` nullable permite INSERT anónimo / compras huérfanas

**Síntoma potencial**: si buyer col es `NULL` permitido, compras legacy con `<buyer_col> NULL` (creadas vía admin script) post-enable RLS quedan huérfanas — buyers no pueden leerlas (`auth.uid() = NULL` es `NULL`, no `TRUE`), admin sí vía policy admin.

**Mitigación**: Phase 1 Query B captura `is_nullable`. Query C cuenta `orphan_purchases`. Si > 0, documentar en `data-model.md §Nullability warnings`. Decisión: aceptar compras legacy como admin-only (no viola user story 1 — los buyers actuales tienen sus compras con `<buyer_col>` no-null).

### R-06. Schema tiene columnas PHI/financial que requieren filtering diferencial

**Síntoma potencial**: si la tabla tiene `vendor_commission_clp`, `internal_notes`, etc., un buyer podría necesitar ver solo subset de columnas. RLS a nivel fila no cubre column-level; requiere view separada.

**Mitigación**: Phase 1 Query B + grep de callsites buyer decide. Si los buyers hoy leen `.select('*')` sin problema → no hay issue. Si aparece columna admin-only, documentar como hallazgo y considerar spec hermano. **NO se introduce column-level masking en spec 009** (viola FR-010).

### R-07. `"Admins update"` tiene lógica que DROPearla rompería

**Síntoma potencial**: si Estrategia B (replace) se elige, requiere `DROP POLICY "Admins update"` antes de crear "Admin manage". Si "Admins update" tiene un `qual` más complejo de lo asumido, DROPearla pierde protección fina.

**Mitigación**: Phase 1 Query A captura `qual` exacto. Si Estrategia B/C se elige, la policy nueva replica el `qual` literalmente. Estrategia A evita el riesgo por completo.

---

## Phase 1 — Audit Defensivo (obligatorio, ~20 min, STOP POINT SP-1 antes de Phase 2)

**Objetivo**: capturar estado live verificable de (a) policies vigentes, (b) schema real, (c) baseline por buyer, (d) matrix de callsites × patrón de acceso. Producir decisión fundamentada de Estrategia Admin (A/B/C de FR-006a).

**Regla operativa** (`docs/PATTERNS.md §4`): cero SQL productivo ejecutado hasta que Phase 1 termine y SP-1 valide scope.

### P1.1 — Query A: Policies vigentes (FR-001)

Capturar `qual` (USING) y `with_check` exactos para replicar sintaxis en policies nuevas.

```sql
SELECT
  policyname,
  cmd,                  -- ALL / SELECT / INSERT / UPDATE / DELETE
  permissive,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'marketplace_purchases'
ORDER BY cmd, policyname;
```

**Output esperado** (hipótesis spec 006):

```text
policyname                         | cmd    | qual
-----------------------------------+--------+------------------------------------------
Admins update marketplace_purchases| UPDATE | EXISTS (SELECT 1 FROM profiles WHERE...)
```

**Scope checks**:
- Si `policy_count_live != 1` → **SP-1 STOP trigger R-03**.
- Si `qual` usa sintaxis no anticipada → documentar para replicar fielmente.

### P1.2 — Query B: Schema real (FR-003, V1)

Capturar columnas, tipos, nullability. **NO pre-asumir `buyer_id` como nombre**.

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketplace_purchases'
ORDER BY ordinal_position;
```

**Scope checks**:
- Identificar la columna buyer entre candidatos (`buyer_id`, `user_id`, `purchaser_id`, `customer_id`) — exactamente 1 debe aparecer. Documentar como `<buyer_col>`.
- Si no aparece ninguno → **SP-1 STOP trigger R-01**.
- Si `is_nullable = YES` para `<buyer_col>` → activar flag R-05.
- Si aparece columna vendor (`vendor_id`, `seller_id`, etc.) → P3 viable.
- Si aparece columna sensible (`vendor_commission_*`, `internal_*`) → flag R-06.

### P1.3 — Query C: Baseline pre/post para SC-004

```sql
-- Sustituir <buyer_col> por el nombre confirmado en P1.2.
SELECT
  COUNT(*) AS total_purchases,
  COUNT(DISTINCT <buyer_col>) AS distinct_buyers,
  COUNT(*) FILTER (WHERE <buyer_col> IS NULL) AS orphan_purchases
FROM public.marketplace_purchases;
```

**Uso en Phase 3 Parte 4**: admin post-migration abre `MarketplaceMetricsPage` y el total debe coincidir con `total_purchases`.

### P1.4 — Grep dirigido callsites (FR-002)

Categorizar los 13+ callsites. Desde `~/Documents/DENTALSPOT`:

```bash
# Inventario completo
grep -rn "from('marketplace_purchases')" src/

# Por patrón
grep -rn "from('marketplace_purchases')" src/ -A3 | grep -iE "eq\('<buyer_col>'"     # buyer SELECT/INSERT
grep -rn "from('marketplace_purchases')" src/ -A3 | grep -iE "insert|upsert"          # INSERT
grep -rn "from('marketplace_purchases')" src/ -A5 | grep -iE "update"                 # UPDATE
grep -rn "from('marketplace_purchases')" src/ -A5 | grep -iE "delete"                 # DELETE
grep -rn "marketplace_purchases" src/features/admin/ -A3                              # admin read/write
grep -rn "vendor" src/features/marketplace/ | grep -i "purchase"                      # vendor patterns
```

**Output en `data-model.md §Callsite matrix`**:

| Callsite | Pattern | Operation | Filter column | Requiere policy |
|---|---|---|---|---|
| `src/features/marketplace/api/marketplaceApi.js:94` | buyer-insert | INSERT | — | Buyers insert |
| `src/features/marketplace/pages/TherapistMarketplacePage.jsx:60` | buyer-read | SELECT | `<buyer_col>` filter | Buyers read own |
| `src/features/admin/modules/marketplace/pages/MarketplaceMetricsPage.jsx:46` | admin-read | SELECT | none | Admin (Estrategia B/C) |
| ... | ... | ... | ... | ... |

### P1.5 — Decisión Estrategia Admin (FR-006a)

Con la matrix + output Query A, decidir explícitamente:

| Estrategia | Elegir si... | Tradeoff |
|---|---|---|
| **A coexistencia** | Los 4 admin callsites NO hacen `SELECT` sobre `marketplace_purchases` directo (leen via view/RPC) | Keep "Admins update" tal cual; solo policies buyer. Admin NO puede SELECT → ROMPERÍA dashboards si usan `.select()`. Viable solo si grep lo confirma. |
| **B replace con ALL** | Admin hace SELECT + UPDATE + posibles INSERT/DELETE | DROP "Admins update" + CREATE "Admin manage" (ALL). Simple, 3 policies total. Requiere replicar `qual` exacto. |
| **C granular** | Admin hace SELECT y UPDATE pero NOT INSERT/DELETE; keep "Admins update" histórico | Keep "Admins update" + CREATE "Admin select" (+ opcionales). 4+ policies, más surface pero fidelidad histórica. |

**Heurística** (post-grep):
- Contar N_read / N_update / N_insert / N_delete admin.
- Si N_read > 0 y (N_insert + N_delete == 0) → **Estrategia C** recomendada.
- Si N_read > 0 y (N_insert > 0 OR N_delete > 0) → **Estrategia B** recomendada.
- Si N_read == 0 → **Estrategia A** recomendada.

Decisión documentada en `data-model.md §Policy strategy decision` con justificación + conteo + lista final de policies a crear.

### P1.6 — Persistir en `data-model.md`

6 secciones mínimas:

1. **§Column inventory** — Query B output, `<buyer_col>` identificado, flags R-04/R-05/R-06.
2. **§Live policies** — Query A output, estado de "Admins update" (qual exacto), cualquier policy no documentada (R-03).
3. **§Callsite matrix** — 13+ callsites categorizados por pattern/operation.
4. **§Policy strategy decision** — A/B/C elegida + justificación + conteo N_read/update/insert/delete + lista final.
5. **§Phase 3 baseline** — Query C output (total, distinct buyers, orphans).
6. **§Pending SP-1 checks** — estado R-01..R-07.

### P1.7 — **STOP POINT SP-1** · validación de scope

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | `<buyer_col>` existe, uuid FK | Query B retorna columna candidata con `data_type = uuid` | STOP, R-01, abrir spec de schema fix. |
| **T2** | `policy_count_live = 1` | Query A retorna 1 fila | Si >1 con nombre desconocido → STOP R-03. Si 0 → documentar y decidir. |
| **T3** | `qual` de "Admins update" decodificable | Query A `qual` sintácticamente razonable | Si función custom no anticipada → documentar, replicar, no refactorear. |
| **T4** | Estrategia admin elegida + justificada | P1.5 output con A/B/C | Sin decisión explícita → no avanzar. |
| **T5** | Matrix completa de 13+ callsites | P1.4 grep + categorización | Si aparecen callsites no inventariados → actualizar spec §Regression + continuar. |
| **T6** | `orphan_purchases` cuantificado | Query C | Documentar si > 0. |

**Reporte a Danissa** (bloquea Phase 2 sin 🟢 GO):

```markdown
## Phase 1 Report — spec 009

- Query A output: [N policies, qual de "Admins update"]
- Query B output: [<buyer_col> = X, schema completo]
- Query C baseline: [N total, M buyers, K orphans]
- Grep: [13+ callsites categorizados]
- Estrategia admin: A / B / C + justificación
- Riesgos activos: [R-XX disparados]
- Scope check: T1..T6 ✅/❌
- Recomendación: proceder / dividir / abortar

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Migration Write (~15 min, STOP POINT SP-2 antes de aplicar)

**Prerequisito**: SP-1 🟢 GO de Danissa.

### P2.1 Archivo a crear

`supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`

### P2.2 Estructura canonical (réplica de `20260420000001_enable_rls_quick_wins.sql`)

```text
1. HEADER comment block
   - Spec 009 ref + Fecha
   - Origen (spec 006 diferido, §RLS coverage audit)
   - Tabla cubierta: marketplace_purchases
   - Constitution I + II
   - Estrategia admin elegida (A/B/C + justificación corta)

2. DO $$ PRE-CHECK
   - Confirmar tabla existe
   - Confirmar policy_count_live = esperado (según T2)
   - Confirmar <buyer_col> existe (según T1)
   - RAISE EXCEPTION si falla, RAISE NOTICE con estado

3. DROP POLICY IF EXISTS (idempotencia)
   - Para cada policy que se va a CREATE
   - Incluye "Admins update" si Estrategia B (replace)

4. CREATE POLICY (nombres FR-006b exactos)
   - "Buyers read own marketplace_purchases" (SELECT)
   - "Buyers insert marketplace_purchases" (INSERT)
   - Admin coverage según Estrategia:
     * A: no se crea nada admin (keep "Admins update")
     * B: "Admin manage marketplace_purchases" (ALL)
     * C: "Admin select marketplace_purchases" (+ opcionales)
   - "Vendors read own marketplace_purchases" (si P3 activo)

5. ALTER TABLE ENABLE ROW LEVEL SECURITY
   - Idempotente (no-op si ya enabled)

6. DO $$ POST-CHECK
   - Verificar rowsecurity = true via pg_tables
   - Verificar policy_count final = esperado
   - RAISE EXCEPTION / RAISE NOTICE

7. ROLLBACK block (comentado, no ejecutable)
   - DROP POLICY IF EXISTS para las nuevas
   - Re-CREATE "Admins update" si Estrategia B dropeó
   - ALTER TABLE ... DISABLE ROW LEVEL SECURITY
```

### P2.3 Templates de policies (instanciar en Phase 2)

Usar `<buyer_col>` = nombre confirmado en P1.2. Usar `<is_admin_clause>` = `qual` exacto de "Admins update" capturado en P1.1.

**Buyer read own**:

```sql
CREATE POLICY "Buyers read own marketplace_purchases"
  ON public.marketplace_purchases
  FOR SELECT
  USING (auth.uid() = <buyer_col>);
```

**Buyer insert**:

```sql
CREATE POLICY "Buyers insert marketplace_purchases"
  ON public.marketplace_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = <buyer_col>);
```

**Admin manage (Estrategia B)**:

```sql
-- Prerequisito: DROP POLICY IF EXISTS "Admins update marketplace_purchases" ON public.marketplace_purchases;
CREATE POLICY "Admin manage marketplace_purchases"
  ON public.marketplace_purchases
  FOR ALL
  USING (<is_admin_clause>)
  WITH CHECK (<is_admin_clause>);
```

**Admin select (Estrategia C)**:

```sql
CREATE POLICY "Admin select marketplace_purchases"
  ON public.marketplace_purchases
  FOR SELECT
  USING (<is_admin_clause>);
-- Keep "Admins update" intacto.
```

**Vendor read (si P3 activo)**:

```sql
-- <vendor_col> confirmado en P1.2.
CREATE POLICY "Vendors read own marketplace_purchases"
  ON public.marketplace_purchases
  FOR SELECT
  USING (auth.uid() = <vendor_col>);
```

### P2.4 **STOP POINT SP-2** · review de SQL sin aplicar

**Criterio**: migration escrita en disco, **NO aplicada en DB**. Danissa revisa el archivo SQL completo (~80-120 líneas esperadas) y confirma:
- Nombres de policies siguen FR-006b exacto.
- `<buyer_col>` reemplazado en todas las ocurrencias.
- `<is_admin_clause>` replica `qual` de "Admins update" literalmente.
- Estrategia elegida en P1.5 se refleja correctamente.
- Rollback block al final coherente.

**Sin 🟢 GO, no se avanza a Phase 3.**

---

## Phase 3 — Verificación en 4 Partes (~45 min)

**Prerequisito**: SP-2 🟢 GO + migration.sql commiteada (no aplicada).

### P3.1 — Parte 1: Pre-check read-only en SQL Editor (~10 min)

Danissa abre Supabase SQL Editor en producción y ejecuta Query A + B + C **sin aplicar ningún DDL**.

**Expectativa**:
- Query A: mismo output que P1.1.
- Query B: mismo schema que P1.2.
- Query C: `total_purchases` estable o creciente (nuevas compras OK).

**Stop si hay drift** contra Phase 1 → re-evaluar SP-1.

### P3.2 — Parte 2: Aplicar migration (~10 min)

Danissa copia `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql` al SQL Editor y ejecuta.

**Expectativa**:
- `RAISE NOTICE 'Pre-check OK — ...'` en Messages.
- Todos los `CREATE POLICY` retornan sin error.
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` retorna `ALTER TABLE`.
- `RAISE NOTICE 'Post-check OK — RLS enabled en marketplace_purchases'`.

Re-ejecutar Query A para confirmar `policy_count` final:

| Estrategia | policy_count esperado |
|---|---|
| A coexistencia | 3 = Admins update + Buyers read own + Buyers insert |
| B replace con ALL | 3 = Buyers read own + Buyers insert + Admin manage |
| C granular | 4 = Admins update + Buyers read own + Buyers insert + Admin select |
| + Vendor read (cualquier estrategia) | +1 |

### P3.3 — **STOP POINT SP-3** · pausa post-aplicación pre-smoke tests (~5 min)

**Criterio**: migration aplicada OK, `policy_count` = esperado, rowsecurity = true. Danissa confirma 🟢 GO para smoke tests. Sin GO, rollback:

```sql
DROP POLICY IF EXISTS "Buyers read own marketplace_purchases" ON public.marketplace_purchases;
DROP POLICY IF EXISTS "Buyers insert marketplace_purchases" ON public.marketplace_purchases;
-- ... según estrategia ...
ALTER TABLE public.marketplace_purchases DISABLE ROW LEVEL SECURITY;
```

### P3.4 — Parte 3: Smoke test buyer flow (~10 min)

Danissa loguea como therapist/buyer de prueba con ≥1 compra previa.

| # | Acción | Expectativa | Callsite |
|---|---|---|---|
| B1 | Abrir `TherapistMarketplacePage` | Ver mis compras sin error | `TherapistMarketplacePage.jsx:60` |
| B2 | Intentar comprar producto nuevo | Compra registrada sin 403 | `marketplaceApi.js:94` |
| B3 | Abrir `MyMarketplaceResourcesSection` | Productos propios OK | `MyMarketplaceResourcesSection.jsx:39` |
| B4 | Refrescar dashboard → `OnboardingChecklist` | Checklist hidrata sin error | `OnboardingChecklist.jsx:171` |
| B5 | (opcional) DB cross-check: `SELECT <buyer_col> FROM marketplace_purchases` con usuario distinto | Solo filas propias | Validación directa user story 1 |

**Formato forense por error** (replicado de spec 007):

```
RUTA: [path:line]
STATUS HTTP: [200/400/403/406/etc.]
CONSOLE ERROR LITERAL: [copy exacto]
EVALUACIÓN PRE/POST: pre-existente vs introducido por migration 20260420000002
EFECTO FUNCIONAL: [qué ve el user]
```

### P3.5 — Parte 4: Smoke test admin flow (~10 min)

Danissa cambia a cuenta admin (con `is_admin = true`).

| # | Acción | Expectativa | Callsite |
|---|---|---|---|
| A1 | Abrir `MarketplaceMetricsPage` | Total = P1.3 `total_purchases` (diff 0) | `MarketplaceMetricsPage.jsx:46`, `useMarketplaceDashboard.js:33` |
| A2 | Abrir `SalesPage` | Listado completo OK | `SalesPage.jsx:46, 60` |
| A3 | Click venta → `SaleDetailPage` | Detalle completo visible | `SaleDetailPage.jsx:38, 48, 67` |
| A4 | Abrir `VendorPerformancePage` | Performance data OK (ajustado si P3 activo/inactivo) | `VendorPerformancePage.jsx:83, 91` |
| A5 | Ejecutar UPDATE admin (si hay flujo) | UPDATE funciona (cobertura "Admins update" o Estrategia B/C) | — |

**Callsites `marketplacePlansApi.js:273, 295, 362`**: verificar incidentalmente en A1-A5 o flag como follow-up si no se tocaron.

### P3.6 — Evaluación vs Rollback Plan (SP-4)

**Rollback triggers** (del spec §Rollback Plan):

1. ≥2 callsites del marketplace rompen post-enable RLS.
2. Buyer dashboard muestra array vacío cuando debería tener datos propios.
3. Admin dashboard muestra 0 sales cuando debería ver todas.
4. Vendor performance page crashea o muestra data de otros vendors.

Si alguno se dispara → ejecutar bloque de rollback de la migration + `git revert` + abrir spec 009.1.

**Non-rollback** (documentar pero no abortar): 1 callsite con workaround <10min, edge case admin menor, feature flag desactivada.

### P3.7 — **STOP POINT SP-4** · evaluación final

```markdown
## Phase 3 Report — spec 009

- Parte 1 (pre-check): [PASS/FAIL + notas]
- Parte 2 (apply migration): [PASS/FAIL, policy_count final: N]
- Parte 3 (buyer flow): [B1..B5 status + errores forenses]
- Parte 4 (admin flow): [A1..A5 status + diff pre/post SC-004]
- Regresiones nuevas: [lista formato forense]
- Decision: close / follow-up / rollback
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio de Phase 1 | Plan aprobado por Danissa | Ejecutar Query A + B + C + grep + P1.5 decisión |
| **SP-1** | Fin de Phase 1 | Phase 1 Report con 🟢 GO | Solo entonces → Phase 2 (migration write) |
| **SP-2** | Fin de Phase 2 (pre-apply) | migration.sql revisada sin aplicar | Solo entonces → Phase 3 Parte 2 (apply DDL) |
| **SP-3** | Post-Parte 2 Phase 3 | `policy_count` verificado + rowsecurity = true | Solo entonces → smoke tests (Partes 3 + 4) |
| **SP-4** | Fin de Phase 3 | Phase 3 Report con evaluación Rollback Plan | Close / follow-up / rollback |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit defensivo | **20 min** | Queries A + B + C + grep + P1.5 decisión + data-model.md + SP-1 report |
| Phase 2 — Migration write | **15 min** | 20260420000002 escrita replicando spec 006, templated con Phase 1, review SP-2 |
| Phase 3 — Verification | **45 min** | Parte 1 (10) + Parte 2 (10) + Parte 3 buyer (10) + Parte 4 admin (10) + SP-4 report (5) |
| Buffer | **10 min** | R-01..R-07 si se disparan |
| **Total** | **90 min** | Cumple bound del spec |

Si total real > **120 min**: STOP implícito, revisar con Danissa.

---

## References

- `.specify/memory/constitution.md §I` (Compliance-First) — fundamento del spec.
- `.specify/memory/constitution.md §II` (RLS-First Security) — principio protegido.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento de los abort triggers del scope bound.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — obliga a Query A/B/C + grep antes de migration.
- `docs/PATTERNS.md §5` (preventive mini-audit con information_schema) — patrón de Query B para schema real.
- `supabase/migrations/20260420000001_enable_rls_quick_wins.sql` (spec 006, commit `9e15c80`) — estructura canónica a replicar.
- Spec 007 Phase 3 (commit `97c34b6`) — protocolo de test en partes + formato forense.
- Spec 009 §FR-006a — enumera las 3 estrategias admin.
- Spec 009 §FR-006b — naming convention canónica.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. El plan respeta scope tight de 1 archivo nuevo. Los 7 riesgos tienen mitigación sin ampliar scope; si se materializan más allá del budget, se dividen en sub-specs. |
