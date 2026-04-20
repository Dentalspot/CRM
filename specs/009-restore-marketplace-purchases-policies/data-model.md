# Data Model: Restore Marketplace Purchases RLS Policies

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Tasks**: [tasks.md](./tasks.md)
**Date**: 2026-04-20
**Source of evidence**: `src/types/database.ts` (schema generado) + grep local del repo para callsite matrix + **Query A & Query C pendientes (Danissa los ejecuta en SQL Editor)** porque MCP `execute_sql` retorna permission denied en el token de esta sesión para project `tomremkbuxvedliyywbo` (igual que spec 007).

---

## §Column inventory (Query B equivalent desde `database.ts`)

Capturado de `src/types/database.ts:5025-5117`. FKs extraídas de `Relationships` block.

| column_name | data_type | is_nullable | notes |
|---|---|---|---|
| `id` | uuid | NO | PK |
| **`buyer_id`** | uuid (string type) | **NO** | **FK → `profiles.id`** (constraint `marketplace_purchases_buyer_id_fkey`). **Este es `<buyer_col>`** |
| `marketplace_plan_id` | uuid | NO | FK → `marketplace_plans.id` |
| `cloned_plan_id` | uuid | YES | FK → `treatment_plans.id` (plan clonado al comprar un template) |
| `price_paid` | numeric | NO | Monto pagado — **columna financiera** |
| `currency` | text | YES | ej. 'CLP' |
| `discount_applied` | numeric | YES | descuento aplicado — **columna financiera** |
| `license_type` | text | YES | ej. 'single_use', 'lifetime' |
| `license_expires_at` | timestamptz | YES | expiración licencia |
| `payment_method` | text | YES | ej. 'mp_transfer', 'stripe' — **columna financiera sensible** |
| `payment_reference` | text | YES | ID externo del pago — **columna financiera sensible** |
| `payment_status` | text | YES | ej. 'pending', 'completed', 'refunded' |
| `completed_at` | timestamptz | YES | cuándo se completó el pago |
| `created_at` | timestamptz | YES | default `now()` |

**Flag resolutions**:
- **R-01 (buyer name)**: ✅ RESUELTO — columna es `buyer_id`, mismo nombre asumido por spec. T1 PASS.
- **R-04 (vendor_id)**: ❌ **CONFIRMADO ausente** — **NO existe `vendor_id` ni `seller_id`**. El vendor se identifica indirectamente via `marketplace_plan_id → marketplace_plans.<author_col>`. **User Story 3 (P3) queda N/A** — no se crea policy "Vendors read own" en spec 009 (requeriría subquery JOIN, out-of-scope de un CREATE POLICY simple).
- **R-05 (nullable buyer)**: ✅ RESUELTO POR SCHEMA — `buyer_id NOT NULL`. **0 orphan purchases posibles por diseño**. T6 quedará en `orphan_purchases = 0` sin necesidad de ejecutar query.
- **R-06 (PHI/financial)**: ⚠️ ACTIVO NO BLOQUEANTE — tabla tiene 5 columnas financieras (`price_paid`, `discount_applied`, `currency`, `payment_method`, `payment_reference`). Buyer ve sus propias filas completas (es SU información) → no requiere column-level masking. Admin ve todo. **Se mantiene OUT-OF-SCOPE de spec 009** per user instruction; documentado acá para backlog.

---

## §Live policies (Query A — ✅ RESUELTO 2026-04-20)

**Query ejecutada por Danissa en Supabase SQL Editor, project `tomremkbuxvedliyywbo`**:

```sql
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'marketplace_purchases'
ORDER BY cmd, policyname;
```

**Output literal**:

| policyname | cmd | permissive | roles | qual | with_check |
|---|---|---|---|---|---|
| `Admins update marketplace_purchases` | `UPDATE` | `PERMISSIVE` | `{public}` | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role)` | `NULL` |

**1 fila total → `policy_count_live = 1` → T2 PASS.**

**Hallazgo importante sobre el `qual`**: la hipótesis del spec asumía el patrón `is_admin` boolean en `profiles`. El live usa enum: `profiles.role = 'admin'::user_role`. Esto se captura como `<is_admin_clause>` literal para replicar en Phase 2 Bloque 4:

```sql
-- <is_admin_clause> (copiar literal, sin parafrasear)
EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
)
```

`with_check` era `NULL` en la policy original (típico de FOR UPDATE cuando se deja implícito = qual). Para Estrategia B (FOR ALL), **vamos a usar el mismo `<is_admin_clause>` tanto en USING como en WITH CHECK** para permitir INSERT/UPDATE admin simétricamente.

**R-02 (qual inesperado)**: neutralizado — el qual es standard, reproducible literalmente sin riesgo.
**R-07 (DROP rompería lógica fina)**: neutralizado — el qual es simple `is_admin` check, no tiene filtros adicionales (ej. ownership). Replicarlo en "Admin manage" preserva cobertura completa.

**R-03 (4ta policy no documentada)**: neutralizado — 1 sola policy live, coincide exactamente con lo asumido. T2 PASS clean.

---

## §Callsite matrix

Grep ejecutado: `grep -rn "from('marketplace_purchases')" src/ -A5`. 13 matches confirmados (consistente con inventario del spec §Regression). Categorización:

| # | Callsite | Operation | Filter | Pattern | Policy requerida |
|---|---|---|---|---|---|
| 1 | `src/features/marketplace/api/marketplaceApi.js:94` | SELECT `*` | `.eq('buyer_id', userId)` | **buyer-read** | `"Buyers read own marketplace_purchases"` |
| 2 | `src/features/marketplace/api/marketplacePlansApi.js:273` | SELECT | `.eq('buyer_id', userId)` + plan/status | **buyer-read** | `"Buyers read own marketplace_purchases"` |
| 3 | `src/features/marketplace/api/marketplacePlansApi.js:295` | SELECT con JOIN plans | — (requiere verificar; el contexto sugiere buyer-read de compras propias) | **buyer-read** (probable) | `"Buyers read own marketplace_purchases"` |
| 4 | `src/features/marketplace/api/marketplacePlansApi.js:362` | **INSERT** | `buyer_id: userId, marketplace_plan_id` | **buyer-insert** | `"Buyers insert marketplace_purchases"` (WITH CHECK) |
| 5 | `src/features/therapist/components/OnboardingChecklist.jsx:171` | SELECT `id` | `.eq('buyer_id', user.id)` | **buyer-read** | `"Buyers read own marketplace_purchases"` |
| 6 | `src/components/therapist-profile/sections/MyMarketplaceResourcesSection.jsx:39` | SELECT con JOIN plans | `.eq('buyer_id', user.id)` + `payment_status='completed'` | **buyer-read** | `"Buyers read own marketplace_purchases"` |
| 7 | `src/features/marketplace/pages/TherapistMarketplacePage.jsx:60` | SELECT | `.in('marketplace_plan_id', planIds)` + `payment_status='completed'` | **vendor-read (via plan ownership)** | **requiere análisis — ver nota abajo** |
| 8 | `src/features/admin/modules/marketplace/pages/MarketplaceMetricsPage.jsx:46` | SELECT `*` | ORDER BY created_at (sin filter de user) | **admin-read** | Admin (Estrategia B o C) |
| 9 | `src/features/admin/modules/marketplace/pages/SalesPage.jsx:46` | SELECT `*` + JOINs | sin filter de user | **admin-read** | Admin |
| 10 | `src/features/admin/modules/marketplace/pages/SalesPage.jsx:60` | SELECT `*` fallback | sin filter de user | **admin-read** | Admin (mismo que #9, fallback sin JOIN) |
| 11 | `src/features/admin/modules/marketplace/pages/SaleDetailPage.jsx:38` | SELECT `*` + JOINs | `.eq('id', id).single()` | **admin-read** | Admin |
| 12 | `src/features/admin/modules/marketplace/pages/SaleDetailPage.jsx:48` | SELECT `*` fallback | `.eq('id', id)` | **admin-read** | Admin |
| 13 | `src/features/admin/modules/marketplace/pages/SaleDetailPage.jsx:67` | **UPDATE** | `payment_status = 'refunded'` `.eq('id', id)` | **admin-update** | `"Admins update"` ya existente |
| 14 | `src/features/admin/modules/marketplace/pages/VendorPerformancePage.jsx:83` | SELECT con JOIN | `.eq('payment_status', 'completed')` | **admin-read** | Admin |
| 15 | `src/features/admin/modules/marketplace/pages/VendorPerformancePage.jsx:91` | SELECT fallback | `.eq('payment_status', 'completed')` | **admin-read** | Admin (fallback) |
| 16 | `src/features/admin/modules/marketplace/hooks/useMarketplaceDashboard.js:33` | SELECT `*` + JOINs | ORDER BY created_at | **admin-read** | Admin |

**Nota #7 — vendor pattern via plan ownership**:
`TherapistMarketplacePage.jsx:60` filtra por `marketplace_plan_id IN (planIds)` donde `planIds` son los plans del therapist (vendor). **No usa `buyer_id`** — es un therapist viendo ventas de sus propios productos. 

**Decisión sobre esta callsite**:
- Si no hay columna `vendor_id` en marketplace_purchases (confirmado R-04), una policy "Vendors read own" requeriría `EXISTS (SELECT 1 FROM marketplace_plans WHERE id = marketplace_plan_id AND author_id = auth.uid())` — subquery con JOIN.
- **En spec 009 scope, NO se crea esa policy**. Alternativas:
  - (a) Confiar que Estrategia B/C admin lo cubre si el therapist tiene flag admin → no siempre cierto.
  - (b) Este callsite **rompe post-enable RLS** si el therapist no es admin y solo quiere ver sus ventas → dispara **Rollback trigger #4** ("Vendor performance page crashea o muestra data de otros vendors").
  - (c) **Recomendación**: documentar como hallazgo, considerar spec 009.1 para policy vendor con subquery si Phase 3 confirma que rompe.

**Conteo para heurística P1.5**:
- Admin callsites únicos por PÁGINA (no por línea): **5 pages admin** (Metrics, Sales, SaleDetail, VendorPerf, useMarketplaceDashboard).
- Operaciones admin:
  - N_read (SELECT admin) = **5+ callsites distintos** (MetricsPage:46, SalesPage:46+60, SaleDetailPage:38+48, VendorPerf:83+91, dashboard:33).
  - N_update = **1** (SaleDetailPage:67 refund, ya cubierto por "Admins update").
  - N_insert = **0** (admin no inserta; buyers insertan).
  - N_delete = **0**.
- Buyer callsites: 5 read + 1 insert = 6.
- Vendor callsite: 1 (TherapistMarketplacePage:60).

---

## §Policy strategy decision (P1.5)

**Heurística del plan**:
- N_read > 0 y (N_insert + N_delete == 0) → **Estrategia C recomendada**.

Sin embargo, hay un factor adicional no capturado en la heurística: **el master file `supabase/policies.sql` histórico documenta `"Admin manage marketplace_purchases"` (ALL)** como policy admin original. "Admins update" live sería un artefacto incompleto — alguien dropeó "Admin manage" en algún momento y solo creó/dejó "Admins update".

### Opciones viables

**Opción B — Replace con ALL** (restaurar al canonical histórico):

- `DROP POLICY IF EXISTS "Admins update marketplace_purchases"` + `CREATE POLICY "Admin manage marketplace_purchases" FOR ALL`.
- **Ventajas**: alinea live con `policies.sql` master canonical; simplifica a 1 policy admin; futuro-proof si admin necesita INSERT/DELETE más tarde.
- **Desventajas**: requiere replicar `qual` exacto de "Admins update" literalmente (Query A lo proporciona).
- **policy_count final esperado**: 3 (Buyers read own + Buyers insert + Admin manage).

**Opción C — Granular (keep + add)**:

- Keep "Admins update" + `CREATE POLICY "Admin select marketplace_purchases" FOR SELECT`.
- **Ventajas**: mínimo cambio, no dropea policy existente, preserva fidelidad a `live` actual.
- **Desventajas**: diverge de `policies.sql` master (deja dos policies admin: update y select); más surface para mantener.
- **policy_count final esperado**: 4 (Admins update + Buyers read own + Buyers insert + Admin select).

### ✅ Decisión confirmada 2026-04-20: **Estrategia B (replace con ALL)**

**Justificación archivable**:

1. El `qual` de `"Admins update"` live es simple y estándar: `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role)`. Reproducible literalmente en una policy FOR ALL sin riesgo de perder lógica fina (R-07 neutralizado).
2. Alinea live con `supabase/policies.sql` master canonical que documenta `"Admin manage marketplace_purchases"` (ALL) históricamente.
3. Future-proof: si admin necesita INSERT o DELETE en el futuro (ej. crear compra manual para refund testing, o borrar compra de testing), la policy ya lo cubre sin migration adicional.
4. Simplifica `policy_count` a 3 (menos surface que C con 4).

**Policy final que Phase 2 debe crear** (Bloque 4 del canonical):

```sql
DROP POLICY IF EXISTS "Admins update marketplace_purchases"
  ON public.marketplace_purchases;

CREATE POLICY "Admin manage marketplace_purchases"
  ON public.marketplace_purchases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::user_role
    )
  );
```

**Nota sobre `WITH CHECK`**: la policy original `"Admins update"` tenía `with_check = NULL` (heredaba de `qual`). Para FOR ALL en la nueva, escribimos `WITH CHECK` explícito con el mismo clause → permite al admin INSERT/UPDATE simétricamente (no solo UPDATE existente).

**Rollback literal** (Bloque 7 del migration):

```sql
-- Revert a estado pre-009:
DROP POLICY IF EXISTS "Admin manage marketplace_purchases"   ON public.marketplace_purchases;
DROP POLICY IF EXISTS "Buyers read own marketplace_purchases" ON public.marketplace_purchases;
DROP POLICY IF EXISTS "Buyers insert marketplace_purchases"   ON public.marketplace_purchases;

CREATE POLICY "Admins update marketplace_purchases"
  ON public.marketplace_purchases
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::user_role
    )
  );

ALTER TABLE public.marketplace_purchases DISABLE ROW LEVEL SECURITY;
```

**`policy_count` esperado post-migration**: `3` (Buyers read own + Buyers insert + Admin manage).

---

## §Phase 3 baseline (Query C — ✅ RESUELTO 2026-04-20)

**Query ejecutada por Danissa en SQL Editor**:

```sql
SELECT
  COUNT(*)                                  AS total_purchases,
  COUNT(DISTINCT buyer_id)                  AS distinct_buyers,
  COUNT(*) FILTER (WHERE buyer_id IS NULL)  AS orphan_purchases
FROM public.marketplace_purchases;
```

**Output literal**:

| total_purchases | distinct_buyers | orphan_purchases |
|---|---|---|
| `0` | `0` | `0` |

**Implicaciones**:
- **Tabla vacía** → impact hoy de enable RLS = **cero** para cualquier usuario. No hay data existente que pueda ser bloqueada por policies mal construidas en run-time.
- **SC-004 (admin total diff = 0)**: trivialmente satisfecho — `0 == 0`.
- **SC-003 (buyer ve sus N compras)**: no aplica hoy con N=0. Si Phase 3 Parte 3 se corre sobre cuenta de prueba, se prueban empty states, no data real.
- **Orphan purchases = 0**: confirmado por schema + confirmado por query. R-05 doble-mitigado.
- **Callsite #7 `TherapistMarketplacePage.jsx:60` (vendor-via-plan)**: **impact hoy cero** — sin compras, cualquier query filtrada por `marketplace_plan_id IN (...)` devuelve `[]` independiente de RLS. Refuerza la decisión de diferir policy vendor a spec 009.1.

**Consecuencia para Phase 3**: smoke tests serán principalmente validaciones de **empty state + HTTP status code 200 sin 4xx** — no validaciones de data populated. El budget de 45 min de Phase 3 se reduce efectivamente porque no hay data que comparar pre/post.

---

## §Pending SP-1 checks

| Check | Estado | Notas |
|---|---|---|
| **T1** `<buyer_col>` existe, uuid FK | ✅ PASS | `buyer_id` → `profiles.id` via `marketplace_purchases_buyer_id_fkey`, uuid, NOT NULL |
| **T2** `policy_count_live = 1` | ✅ PASS | Query A confirma 1 fila única ("Admins update marketplace_purchases") |
| **T3** `qual` de "Admins update" decodificable | ✅ PASS | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role)` — standard, reproducible literal |
| **T4** Estrategia admin A/B/C elegida | ✅ PASS | **Estrategia B** confirmada por Danissa. Policy final: `"Admin manage marketplace_purchases"` FOR ALL con `<is_admin_clause>` replicado literal |
| **T5** Matrix 13+ callsites completa | ✅ PASS | 16 matches del grep categorizados. Callsite #7 (vendor-via-plan) **deferred X2 a spec 009.1** — impact hoy cero por Query C |
| **T6** `orphan_purchases` cuantificado | ✅ PASS | Query C: `total_purchases=0, distinct_buyers=0, orphan_purchases=0`. Tabla vacía → SC-004 diff trivial |

**🟢 6/6 checks PASS. SP-1 cleared.**

**Hallazgos activos no bloqueantes**:
- **R-04 ACTIVO**: no hay `vendor_id` → User Story 3 queda N/A, NO se crea policy vendor en spec 009.
- **R-06 activo no bloqueante**: column-level masking out-of-scope (documentado para backlog).
- **Callsite #7 `TherapistMarketplacePage.jsx:60`**: **deferred X2 a spec 009.1** (ver §Deferred Follow-up abajo). Impact hoy **cero** (tabla vacía confirmada por Query C).

---

## §Deferred Follow-up (spec 009.1, trigger condicional)

**Razón de diferir**: al cierre de spec 009 (Phase 1 completo con decisiones confirmadas), la callsite `src/features/marketplace/pages/TherapistMarketplacePage.jsx:60` presenta un gap de cobertura RLS en el patrón vendor-via-plan-ownership — pero el impact hoy es **cero** por Query C (`total_purchases = 0`). Micro-Bloques discipline (Constitution §IV): spec 009 mantiene su scope de **3 policies** (Buyer read own + Buyer insert + Admin manage). Ampliar para cubrir el vendor pattern sería scope creep sin beneficio operativo hoy.

### Contexto del gap

- **Callsite**: `src/features/marketplace/pages/TherapistMarketplacePage.jsx:60`
- **Query actual**:
  ```js
  supabase
    .from('marketplace_purchases')
    .select('id, price_paid, payment_status, payment_method, created_at')
    .in('marketplace_plan_id', planIds)   // planIds = plans del therapist (vendor)
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);
  ```
- **Patrón**: vendor (therapist) viendo ventas de sus propios plans. Filtra por `marketplace_plan_id IN (...)`, NO por `buyer_id`.
- **Comportamiento post-spec 009 con RLS enabled**:
  - Si el therapist es admin → cubierto por `"Admin manage"` → ve todo, OK.
  - Si el therapist NO es admin → NO cubierto por `"Buyers read own"` (el filtro es por plan, no por buyer) → **array vacío silencioso**. El componente muestra "Sin ventas aún" incorrectamente.

### Trigger para abrir spec 009.1

Se abre spec 009.1 `add-vendor-read-policy-to-marketplace-purchases` cuando **CUALQUIERA** de:

1. **Primera compra real aparezca** en `marketplace_purchases` (monitorear `SELECT COUNT(*) FROM marketplace_purchases > 0`).
2. **Ataque de backlog P1/P2** (próximos sprints de remediación RLS — la tabla del §RLS coverage audit de architecture.md tiene varios pendientes).
3. **Usuario reporta** que la sección "Mis ventas como vendor" en `TherapistMarketplacePage` no funciona.

### Policy SQL ya diseñada (para spec 009.1)

```sql
CREATE POLICY "Vendors read own plan purchases"
  ON public.marketplace_purchases
  FOR SELECT
  USING (
    marketplace_plan_id IN (
      SELECT id
      FROM public.marketplace_plans
      WHERE author_id = auth.uid()
    )
  );
```

**Nota sobre performance**: la subquery a `marketplace_plans` ejecuta por cada row evaluada en RLS. Para tablas grandes podría ser costoso, pero:
- `marketplace_purchases` no es tabla de alto volumen (no es event log).
- `marketplace_plans.author_id` debería estar indexada (verificar en spec 009.1 Phase 1).
- `marketplace_plans.id` es PK, ya indexada.

Si Phase 1 de spec 009.1 detecta que `author_id` no está indexada, considerar agregar índice como parte del spec.
