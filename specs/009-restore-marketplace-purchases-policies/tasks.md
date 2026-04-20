# Tasks: Restore Marketplace Purchases RLS Policies

**Branch**: `009-restore-marketplace-purchases-policies` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-04-20

Tasks ejecutables del ciclo, agrupadas por Phase del plan. **Stop Points (SP-*) son gates, no tasks** — requieren 🟢 GO explícito de Danissa antes de continuar al siguiente grupo. Tiempo total estimado: **90 min** (budget del plan).

Leyenda de columnas:

- **ID**: identificador único.
- **Phase**: Phase del plan (P1 / P2 / P3 / FINAL).
- **Task**: acción concreta.
- **File:Line**: ubicación exacta cuando aplica; MCP/SQL Editor para queries; `—` si no toca archivos.
- **Dependencies**: tasks que deben completarse antes (o `GATE SP-N` si requiere STOP POINT previo).
- **Reference**: patrón canónico, FR del spec, riesgo mitigado.
- **Est. min**: estimación de tiempo (acumulable contra budget 90).

---

## Phase 1 — Audit Defensivo

**Prerequisito**: plan aprobado por Danissa ✅ (commit `e756f11`).

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P1-A` | P1 | Ejecutar Query A (`pg_policies` con `cmd + qual + with_check` para `marketplace_purchases`); capturar literalmente el `qual` de `"Admins update"` para replicar en Phase 2 | MCP: `execute_sql` o Supabase SQL Editor · project `tomremkbuxvedliyywbo` | — | plan.md §Phase 1 P1.1 · FR-001 · Risk R-02/R-03 | 3 |
| `TASK-P1-B` | P1 | Ejecutar Query B (`information_schema.columns` para `marketplace_purchases`); identificar `<buyer_col>` entre candidatos (`buyer_id` / `user_id` / `purchaser_id` / `customer_id`); flag `is_nullable` y presencia de columna vendor/PHI/financial | MCP: `execute_sql` o SQL Editor | — | plan.md §Phase 1 P1.2 · FR-003 (V1) · Risk R-01/R-04/R-05/R-06 | 3 |
| `TASK-P1-C` | P1 | Ejecutar Query C baseline: `COUNT(*) AS total_purchases, COUNT(DISTINCT <buyer_col>), COUNT(*) FILTER (WHERE <buyer_col> IS NULL)` para comparar pre/post admin (SC-004) y cuantificar orphan purchases | MCP: `execute_sql` o SQL Editor | `TASK-P1-B` (necesita `<buyer_col>`) | plan.md §Phase 1 P1.3 · SC-004 · Risk R-05 | 2 |
| `TASK-P1-GREP` | P1 | 3 greps dirigidos desde repo root: (1) inventario `from('marketplace_purchases')`, (2) filtros por `eq('<buyer_col>')`, (3) patrones admin en `src/features/admin/`. Categorizar 13+ callsites en matrix pattern × operation | `bash` desde `~/Documents/DENTALSPOT` | `TASK-P1-B` | plan.md §Phase 1 P1.4 · FR-002 · `PATTERNS.md §5` | 3 |
| `TASK-P1-DECISION` | P1 | Aplicar heurística de P1.5 sobre conteo `N_read / N_update / N_insert / N_delete` admin resultante del grep; elegir **Estrategia A (coexistencia)** / **B (replace con ALL)** / **C (granular)** con justificación escrita | conversación (decisión que va en data-model.md) | `TASK-P1-A`, `TASK-P1-GREP` | plan.md §Phase 1 P1.5 · FR-006a · Risk R-07 | 3 |
| `TASK-P1-DATAMODEL` | P1 | Escribir `specs/009-restore-marketplace-purchases-policies/data-model.md` con 6 secciones mínimas: §Column inventory · §Live policies · §Callsite matrix · §Policy strategy decision · §Phase 3 baseline · §Pending SP-1 checks | `specs/009-restore-marketplace-purchases-policies/data-model.md` (create) | `TASK-P1-A`, `TASK-P1-B`, `TASK-P1-C`, `TASK-P1-GREP`, `TASK-P1-DECISION` | plan.md §Phase 1 P1.6 · FR-001/002/003 | 4 |
| `TASK-P1-REPORT` | P1 | Generar Phase 1 Report para Danissa con checks T1–T6 del SP-1 + recomendación 🟢 GO / 🔴 STOP; pegar snapshots del output de Query A/B/C y estrategia admin elegida | conversación | `TASK-P1-DATAMODEL` | plan.md §Phase 1 P1.7 · FR-004 | 2 |

**Tiempo Phase 1**: 20 min (budget plan).

---

### 🚧 GATE SP-1 — STOP POINT (hard block)

**Criterio**: Phase 1 Report entregado con checks T1–T6 evaluados. **Requiere 🟢 GO explícito de Danissa**.

- **T1** (`<buyer_col>` existe, uuid FK) — si falla: STOP, R-01, abrir spec de schema fix.
- **T2** (`policy_count_live = 1`) — si >1 con nombre desconocido → STOP R-03; si 0 → documentar y decidir.
- **T3** (`qual` de `"Admins update"` decodificable) — si sintaxis no anticipada → documentar y replicar literalmente.
- **T4** (Estrategia admin A/B/C elegida + justificada) — sin decisión explícita, no avanzar.
- **T5** (matrix de 13+ callsites completa) — si aparecen callsites no inventariados → actualizar spec §Regression + continuar.
- **T6** (`orphan_purchases` cuantificado) — documentar si > 0.

**Sin 🟢 GO, no se ejecuta ninguna task de Phase 2.**

---

## Phase 2 — Migration Write (no apply)

**Prerequisito**: GATE SP-1 superado. Las 7 tasks son **bloques secuenciales del archivo único** `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`. Cada task escribe su bloque correspondiente según el canonical de `20260420000001_enable_rls_quick_wins.sql` (spec 006). **Ningún bloque se aplica en DB** durante Phase 2.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P2-BLOCK-HEADER` | P2 | **Bloque 1 — Header comment**: spec 009 ref, fecha, origen (spec 006 diferido + §RLS coverage audit), tabla cubierta, Constitution I + II, Estrategia admin elegida (A/B/C + justificación corta de P1.5). **Template param usado**: ninguno | `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql:1-22` (new file) | `GATE SP-1` · `TASK-P1-DECISION` | plan.md §Phase 2 P2.2 Bloque 1 · estructura spec 006 (`20260420000001_enable_rls_quick_wins.sql:1-21`) | 2 |
| `TASK-P2-BLOCK-PRECHECK` | P2 | **Bloque 2 — `DO $$ PRE-CHECK`**: confirmar tabla `marketplace_purchases` existe + `policy_count_live = 1` (esperado) + `<buyer_col>` existe en `information_schema.columns`. `RAISE EXCEPTION` si falla, `RAISE NOTICE` con estado capturado. **Template param usado**: `<buyer_col>` de `TASK-P1-B` | `.../20260420000002_...sql:~24-55` | `TASK-P2-BLOCK-HEADER`, `TASK-P1-B` | plan.md §Phase 2 P2.2 Bloque 2 · estructura spec 006 (`20260420000001:27-55`) · Risk R-01/R-03 | 2 |
| `TASK-P2-BLOCK-DROP` | P2 | **Bloque 3 — `DROP POLICY IF EXISTS`** para idempotencia: una línea por cada policy que Phase 2 creará. Si Estrategia B (replace con ALL), incluir `DROP POLICY IF EXISTS "Admins update marketplace_purchases"` adicional. **Template param usado**: ninguno (nombres fijos FR-006b) | `.../20260420000002_...sql:~57-70` | `TASK-P2-BLOCK-PRECHECK`, `TASK-P1-DECISION` | plan.md §Phase 2 P2.2 Bloque 3 · FR-006b · idempotencia pattern | 1 |
| `TASK-P2-BLOCK-CREATE` | P2 | **Bloque 4 — `CREATE POLICY`**: (a) `"Buyers read own marketplace_purchases"` SELECT con `auth.uid() = <buyer_col>`, (b) `"Buyers insert marketplace_purchases"` INSERT con WITH CHECK `auth.uid() = <buyer_col>`, (c) admin policies según Estrategia elegida (B: `"Admin manage"` ALL / C: `"Admin select"` + opcionales / A: ninguna), (d) `"Vendors read own marketplace_purchases"` si P3 activo. **Template params usados**: `<buyer_col>`, `<is_admin_clause>` (qual literal de P1.1), `<vendor_col>` si aplica | `.../20260420000002_...sql:~72-110` (variable según estrategia) | `TASK-P2-BLOCK-DROP`, `TASK-P1-A`, `TASK-P1-B`, `TASK-P1-DECISION` | plan.md §Phase 2 P2.3 templates · FR-006/006a/006b · Risk R-02/R-07 | 4 |
| `TASK-P2-BLOCK-ENABLE` | P2 | **Bloque 5 — `ALTER TABLE`**: `ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;` (idempotente — no-op si ya enabled). **Template param usado**: ninguno | `.../20260420000002_...sql:~112-114` | `TASK-P2-BLOCK-CREATE` | plan.md §Phase 2 P2.2 Bloque 5 · estructura spec 006 (`20260420000001:57-61`) | 1 |
| `TASK-P2-BLOCK-POSTCHECK` | P2 | **Bloque 6 — `DO $$ POST-CHECK`**: verificar `rowsecurity = true` vía `pg_tables WHERE schemaname='public' AND tablename='marketplace_purchases'`, verificar `policy_count` final = esperado según Estrategia (A=3, B=3, C=4, +1 si P3 activo). `RAISE EXCEPTION` / `RAISE NOTICE`. **Template param usado**: ninguno (query interna) | `.../20260420000002_...sql:~116-145` | `TASK-P2-BLOCK-ENABLE`, `TASK-P1-DECISION` | plan.md §Phase 2 P2.2 Bloque 6 · estructura spec 006 (`20260420000001:63-88`) · FR-009 | 2 |
| `TASK-P2-BLOCK-ROLLBACK` | P2 | **Bloque 7 — Rollback block comentado** (no ejecutable): `DROP POLICY IF EXISTS` para las nuevas + re-CREATE `"Admins update"` literal si Estrategia B dropeó + `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`. Debe ser copy-pasteable directamente al SQL Editor en caso de abort. **Template param usado**: `<is_admin_clause>` si Estrategia B | `.../20260420000002_...sql:~147-170` | `TASK-P2-BLOCK-POSTCHECK` | plan.md §Phase 2 P2.2 Bloque 7 · FR-007 · spec §Rollback Plan | 3 |

**Tiempo Phase 2**: 15 min (budget plan).

---

### 🚧 GATE SP-2 — STOP POINT (review SQL, NO APPLY)

**Criterio**: archivo `20260420000002_...sql` escrito en disco (~80-120 líneas), **NO aplicado en DB**. Danissa revisa integralmente y confirma:
- Nombres de policies siguen FR-006b exacto.
- `<buyer_col>` reemplazado en todas las ocurrencias (Bloques 2 y 4).
- `<is_admin_clause>` replica el `qual` capturado en P1.1 literalmente (Bloque 4 admin + Bloque 7 rollback si aplica).
- Estrategia A/B/C de P1.5 se refleja correctamente en Bloques 3 + 4 + 6 + 7.
- Rollback block (Bloque 7) coherente con policies creadas (cubre DROP exacto de cada policy nueva).
- `policy_count` esperado en post-check (Bloque 6) coincide con la Estrategia (A=3, B=3, C=4, +1 vendor).

**Sin 🟢 GO, no se avanza a Phase 3.**

---

## Phase 3 — Verificación en 4 Partes

**Prerequisito**: GATE SP-2 superado. Migration.sql commiteada en repo, **pendiente de aplicar en DB**.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-PART1` | P3 | **Parte 1 — Pre-check read-only en SQL Editor**: Danissa re-ejecuta Query A + Query B + Query C en producción sin aplicar DDL. Verifica que el estado live no cambió entre Phase 1 y ahora (drift check). Si hay drift → re-evaluar SP-1 | Supabase SQL Editor · project `tomremkbuxvedliyywbo` | `GATE SP-2` · `TASK-P1-A`, `TASK-P1-B`, `TASK-P1-C` (para comparar) | plan.md §Phase 3 P3.1 · Risk R-03 | 10 |
| `TASK-P3-PART2` | P3 | **Parte 2 — Aplicar migration** en SQL Editor: copiar contenido de `20260420000002_...sql` y ejecutar. Verificar mensajes `RAISE NOTICE` del pre-check + `ALTER TABLE` OK + post-check OK. Inmediatamente re-ejecutar Query A para confirmar `policy_count` final coincide con Estrategia (A=3, B=3, C=4, +1 si P3 activo). Si pre/post-check hace `RAISE EXCEPTION` → transaction rollback automático, pasar a SP-3 rollback branch | Supabase SQL Editor (copy de `supabase/migrations/20260420000002_restore_marketplace_purchases_policies.sql`) | `TASK-P3-PART1` | plan.md §Phase 3 P3.2 · SC-001/SC-002 · estructura spec 006 | 10 |

**Tiempo Phase 3 (pre-smoke)**: 20 min.

---

### 🚧 GATE SP-3 — STOP POINT (post-apply, pre-smoke)

**Criterio**: migration aplicada OK, `policy_count` verificado = esperado, `rowsecurity = true`. Danissa confirma 🟢 GO para smoke tests.

**Si el post-check del migration hizo `RAISE EXCEPTION`** o si `policy_count` no coincide → **ejecutar rollback**: copiar Bloque 7 (descomentado) del migration al SQL Editor y ejecutar. Notificar root cause hipotetizado para abrir spec 009.1.

---

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-PART3` | P3 | **Parte 3 — Smoke test buyer flow (B1–B5 bundled)**: Danissa loguea como therapist/buyer de prueba con ≥1 compra previa. Ejecuta en orden: **B1** abrir `TherapistMarketplacePage` (ver mis compras sin error) · **B2** intentar comprar producto nuevo (sin 403) · **B3** abrir `MyMarketplaceResourcesSection` (productos propios OK) · **B4** refrescar dashboard → `OnboardingChecklist` hidrata sin error · **B5** opcional: DB cross-check con usuario distinto — ver solo filas propias. Cada error → formato forense 5 campos | browser manual · DevTools Console · callsites: `TherapistMarketplacePage.jsx:60`, `marketplaceApi.js:94`, `MyMarketplaceResourcesSection.jsx:39`, `OnboardingChecklist.jsx:171` | `GATE SP-3` | plan.md §Phase 3 P3.4 · SC-003/SC-005 · user story 1 · spec §Regression Inventory | 10 |
| `TASK-P3-PART4` | P3 | **Parte 4 — Smoke test admin flow (A1–A5 bundled)**: Danissa cambia a cuenta admin (`is_admin = true`). Ejecuta: **A1** abrir `MarketplaceMetricsPage` (total = P1.3 `total_purchases`, diff = 0) · **A2** abrir `SalesPage` (listado completo) · **A3** click venta → `SaleDetailPage` (detalle visible) · **A4** abrir `VendorPerformancePage` (performance data, ajustado si P3 activo/inactivo) · **A5** UPDATE admin si hay flujo (cobertura "Admins update" o Estrategia B/C). Callsites incidentales `marketplacePlansApi.js:273,295,362` verificar si se tocan; flag si no. Cada error → formato forense 5 campos | browser manual · DevTools Console · callsites: `MarketplaceMetricsPage.jsx:46`, `useMarketplaceDashboard.js:33`, `SalesPage.jsx:46,60`, `SaleDetailPage.jsx:38,48,67`, `VendorPerformancePage.jsx:83,91` | `GATE SP-3`, `TASK-P3-PART3` (mismo GATE, orden no bloqueante) | plan.md §Phase 3 P3.5 · SC-004 diff=0 · user story 2/3 | 10 |
| `TASK-P3-REPORT` | P3 | **Phase 3 Report (SP-4)**: consolidar resultados Parte 1–4, contabilizar regresiones nuevas (introducidas por migration `20260420000002`) vs pre-existentes. Evaluar contra Rollback Plan triggers (≥2 callsites rotos / buyer vacío / admin 0 / vendor crash). Decidir **close / follow-up / rollback** | conversación | `TASK-P3-PART1`, `TASK-P3-PART2`, `TASK-P3-PART3`, `TASK-P3-PART4` | plan.md §Phase 3 P3.7 · spec §Rollback Plan | 5 |

**Tiempo Phase 3 (smoke + report)**: 25 min. **Total Phase 3**: 45 min (budget plan).

---

### 🚧 GATE SP-4 — STOP POINT (evaluación final)

**Criterio**: Phase 3 Report entregado. Danissa decide:

- **Close**: 0 regresiones nuevas introducidas por `20260420000002` + buyer/admin flows cumplen SC-001..SC-005 → avanzar a `TASK-FINAL`.
- **Follow-up**: 1 callsite con workaround <10min / edge case admin menor / feature flag desactivada → `TASK-FINAL` + issue para follow-up.
- **Rollback**: ≥2 callsites rompen / buyer vacío cuando debería tener datos / admin 0 sales / vendor crash → ejecutar Bloque 7 (rollback) + `git revert <commit-merge-009>` + abrir spec 009.1 con scope ajustado.

---

## Final — Documentación post-spec

**Prerequisito**: GATE SP-4 decisión = Close o Follow-up.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-FINAL` | FINAL | Actualizar `.specify/memory/architecture.md §"RLS coverage audit (2026-04-20)"`: **NO modificar la tabla histórica del audit** (preserva registro original). Agregar una subsección `#### Resueltos post-audit (spec 009 — 2026-MM-DD)` inmediatamente después de la tabla P0 RLS DISABLED (después de la línea `Spec 006 (...) queda diferido...`), con tabla: `| Tabla · escenario | Policies agregadas | Strategy | Migration | Commit |`. Remover también la línea `2. Spec siguiente P0 — marketplace_purchases restore policies (1-2h)` del §"Ruta de remediación priorizada" (ya resuelto) o marcarla como "✅ cerrado en spec 009" | `.specify/memory/architecture.md:~264` (insert subsección) + `:289` (update ruta) | `GATE SP-4` (close/follow-up) | plan.md §Complexity Tracking · spec §FR-008 análogo · Constitution §IV documentation pattern | 5 |

**Plantilla sugerida para la subsección** (queda a criterio del ejecutor el texto final post-Phase 3):

```markdown
#### Resueltos post-audit (spec 009 — 2026-MM-DD)

`marketplace_purchases` cerrada: migration `20260420000002_restore_marketplace_purchases_policies.sql` aplicada + smoke test OK. Commit `<hash>`.

| Tabla · escenario | Policies agregadas | Strategy | Migration | Commit |
|---|---|---|---|---|
| `marketplace_purchases` · Buyer isolation + Admin coverage | Buyers read own + Buyers insert + [Admin manage / Admin select según Estrategia] [+ Vendors read own si P3] | A / B / C (elegida en P1.5) | `20260420000002` | `<hash>` |

Total tiempo real: [N min]. Regressions detectadas: [0 / M con follow-up].
```

---

## Resumen ejecutivo de tasks

| Phase | # tasks | Tiempo | Gate posterior |
|---|---|---|---|
| Phase 1 (audit defensivo) | 7 | 20 min | **SP-1** (hard block, Danissa 🟢 GO requerido) |
| Phase 2 (migration write) | 7 | 15 min | **SP-2** (review SQL, NO apply) |
| Phase 3 (verification) | 5 | 45 min | **SP-3** embebido (post-apply pre-smoke) · **SP-4** (close/follow-up/rollback) |
| Final | 1 | 5 min | — |
| **Total ejecutable** | **20 tasks** | **85 min** | 4 gates explícitos (SP-1, SP-2, SP-3, SP-4) + SP-0 implícito |

Buffer de 5–10 min del plan cubre desvíos menores (Query C opcional si R-05 se activa, drift en Parte 1). Si total real > **120 min** → STOP implícito y consultar.

---

## Referencias cruzadas

- `plan.md` — queries SQL exactas, canonical blocks, stop points, risk register.
- `spec.md` — FRs (001–011 + 006a + 006b), Rollback Plan, Regression Inventory.
- `supabase/migrations/20260420000001_enable_rls_quick_wins.sql` (spec 006, commit `9e15c80`) — estructura canónica réplica.
- `.specify/memory/constitution.md §I + §II` — fundamento Compliance-First + RLS-First.
- `.specify/memory/constitution.md §IV` — Micro-Bloques (abort triggers scope bound).
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) · `§5` (preventive mini-audit information_schema).
- Spec 007 Phase 3 (commit `97c34b6`) — protocolo test en partes + formato forense 5 campos.
