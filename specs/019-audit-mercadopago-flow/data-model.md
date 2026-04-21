# Data Model — Audit MercadoPago Subscription Flow (spec 019)

**Generado**: 2026-04-21 Phase 1 audit.

---

## §Inventory > Edge functions

**4 edge functions identificadas**, 3 relevantes para flow MercadoPago (4ta es Resend email, NO relacionada):

| # | Edge function | Propósito | external_reference prefix | Tabla primaria | Notas |
|---|---|---|---|---|---|
| 1 | `mercadopago-webhook` | Recibe eventos MP + update DB | despacha por prefix | `therapist_subscriptions` + `marketplace_purchases` | **Handler central — multiples BLOCKERs** |
| 2 | `create-mp-checkout` | Crea preference para subscriptions | `fonokit_sub_{uuid}_{ts}` | `therapist_subscriptions` + `subscription_plans` | Limpia pending + verifica existing |
| 3 | `create-mercadopago-preference` | Crea preference para marketplace | `fonokit_order_{purchase_id}` | `marketplace_purchases` | back_urls hardcoded `fonokit.cl` |
| 4 | `resend-webhook` | Email tracking (Resend) | N/A | `email_notifications` | **NO MercadoPago — excluido del scope** |

### Matriz webhook handler (lines 1-217)

| Criterio | Estado | Severidad |
|---|---|---|
| **Signature validation (`x-signature`)** | **AUSENTE** (lines 12-74 procesan body sin check) | 🔴 **BLOCKER** R-01 |
| **Idempotency key check** | **AUSENTE** — INSERT fallback (line 169) sin dedup por `mp_payment_id` o `external_reference` | 🔴 **BLOCKER** R-02 |
| **Error handling** | **Silent 200** — catch retorna 200 OK incluso con error interno (lines 67-73) | 🔴 **BLOCKER new** — **no en risk register original** |
| **Logging** | Presente (`console.log`) pero no persiste en DB → no diagnosticable post-hoc | 🟡 LATENT |
| **Retry compatibility** | **Rompe con MP retry**: dado que siempre retorna 200, MP NUNCA reintenta. Bueno si handler procesa OK. Malo si handler falla silent (user pagó, DB no actualizó) | 🔴 **BLOCKER** (combinación R-02 + silent) |
| **Environment detection (sandbox vs prod)** | Usa `MERCADOPAGO_ACCESS_TOKEN` único — no explicit sandbox/prod toggle | 🟡 LATENT |
| **external_reference parsing (line 167)** | `parts.slice(2, -1).join('_')` — frágil si format cambia | 🟡 LATENT |
| **Brand legacy (`fonokit_*` prefixes)** | Prefixes son `fonokit_sub_` + `fonokit_order_` (brand FonoKit legacy, no DentalSpot) | ⚪ EDGE |

### Matriz `create-mp-checkout` (subscription checkout)

| Criterio | Estado | Severidad |
|---|---|---|
| Lee precio desde `subscription_plans` (dynamic) | ✅ OK | — |
| Limpia pending subscriptions (line 52-57) | ✅ OK pero race-condition si user clicks rápido | 🟡 EDGE |
| Verifica existing active (line 60-65) | ✅ allows upgrade | — |
| Missing input validation más allá de basic | 🟡 OK para MVP | — |

### Matriz `create-mercadopago-preference` (marketplace checkout)

| Criterio | Estado | Severidad |
|---|---|---|
| back_urls hardcoded `fonokit.cl` | **LATENT** — si dominio migró a `dentalspot.cl`, user vuelve a dominio equivocado post-checkout | 🟡 LATENT |
| notification_url correcto (webhook central) | ✅ OK |
| Input validation OK | ✅ OK |

---

## §Inventory > Events subscribed

**Handler webhook procesa 3 tipos** (lines 48-60):

| MP event type | Handler function | Tabla actualizada |
|---|---|---|
| `subscription_preapproval` | `handlePreapproval` (lines 76-99) | `therapist_subscriptions` UPDATE by `external_reference` |
| `subscription_authorized_payment` | `handleAuthorizedPayment` (lines 101-126) | `therapist_subscriptions` UPDATE by `mp_preapproval_id` |
| `payment` | `handlePayment` (lines 128-217) | `therapist_subscriptions` (if `fonokit_sub_*`) O `marketplace_purchases` (if `fonokit_order_*`) |

### Eventos NO suscritos (gaps funcionales)

| Event faltante | Consecuencia | Severidad |
|---|---|---|
| `payment.refunded` / refund handling | Refunds no ajustan DB | 🟢 ENHANCEMENT (manual refunds OK) |
| `subscription.cancelled` (explícito) | Cancellation depende de preapproval status=`cancelled`; si MP envía event separado, no lo procesa | 🟡 LATENT |
| `chargeback.*` | Disputes no detectadas → refund manual con delay | 🟢 ENHANCEMENT |
| `payment.failed` dedicated (vs status=`rejected` inside payment event) | Failed payments no triggera dunning flow automático | 🔴 **BLOCKER** (revenue leak silencioso) |

---

## §Inventory > Frontend callsites

### Consumers `subscriptions` / `therapist_subscriptions`

| File:line | Patrón acceso | Tipo | Notas |
|---|---|---|---|
| `src/features/admin/modules/billing/pages/DirectoryPage.jsx:41` | `.from('subscriptions')` direct | admin read | **Potencial bug**: tabla real es `therapist_subscriptions` según edge function. Schema confirma Phase 1 Query α. |
| `src/contexts/SubscriptionContext.jsx` | Wraps `fetchCurrentSubscription` from `api/subscriptionApi.js` | read context | Provider global |
| `src/api/subscriptionApi.js` | Subscription CRUD + stats | read/write | "Fusionada MP integration" |
| `src/features/admin/modules/billing/hooks/useSubscriptions.js` | Admin list | admin read | 100 rows limit |
| `src/features/admin/modules/billing/hooks/useInvoices.js` | Admin invoices | admin read | `billing_invoices` table (spec 014 policies) |
| `src/features/membership/components/BillingHistory.jsx` | Therapist history | read | `userId` prop-driven |
| `src/features/membership/api/membershipApi.js:195` | MP checkout trigger | write (invoke) | Calls `create-mp-checkout` edge function |
| `src/features/membership/pages/MembershipPlansPage.jsx` | UI planes | display | Direct activate for 100% coupons |
| `src/components/guards/PlanGuard.jsx` | Plan-based route guard | read | Uses `useSubscription()` |
| `src/components/ui/FeatureGate.jsx` | Feature-level access | read | `hasFeature` from context |
| `src/hooks/useAddOnAccess.js`, `usePlanFeatures.js` | Feature checks | read | Derived from subscription |
| `src/components/modals/AddOnUpgradeModal.jsx:26` | `createSubscriptionCheckout` invoke | write | Upgrade flow — calls checkout |
| `src/features/marketplace/hooks/useMarketplaceAccess.js` | Marketplace guard | read | — |
| `src/api/mercadoPagoApi.js` | Invokes edge function | write | Wrapper para checkout |
| `src/features/marketplace/api/marketplacePlansApi.js:396` | `purchaseWithMercadoPago` | write | Marketplace purchase flow |
| `src/features/marketplace/pages/PurchaseSuccessPage.jsx:40` | "3 estados de MP: approved, failure, pending" | display | Post-redirect state handling |

**Observación crítica**: `DirectoryPage.jsx:41` usa `.from('subscriptions')` directo pero el edge function actualiza `therapist_subscriptions`. Si la tabla `subscriptions` NO existe o es distinta → **BLOCKER data integrity** (admin directory retorna empty/error mientras webhook escribe a otra tabla).

---

## §Queries consolidadas (copy-paste a SQL Editor, Danissa ejecuta)

**⚠️ AJUSTE SCHEMA**: spec + plan originales asumieron tabla `subscriptions`. Phase 1 reveló tabla real es **`therapist_subscriptions`**. Queries ajustadas.

```sql
-- ============================================================
-- Spec 019 Phase 1 audit — queries corregidas para therapist_subscriptions
-- (no 'subscriptions' como el spec original asumía)
-- ============================================================

-- Pre-step: confirmar qué tabla(s) de subscription existen
SELECT 'pre_tables' AS query, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%subscription%' OR table_name ILIKE '%billing%')
ORDER BY table_name;

-- Query α: schema therapist_subscriptions
SELECT 'A_schema' AS query, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'therapist_subscriptions'
ORDER BY ordinal_position;

-- Query β: RLS state (BLOCKER R-04 check)
SELECT 'B_rls' AS query, tablename, rowsecurity,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public' AND tablename = 'therapist_subscriptions';

-- Query γ: distribución status actual
SELECT 'C_status' AS query, status, COUNT(*) AS n
FROM therapist_subscriptions GROUP BY status ORDER BY n DESC;

-- Query δ: edades de last_payment_id / current_period_end
SELECT 'D_ages' AS query,
  CASE
    WHEN current_period_end IS NULL THEN 'no_period_end'
    WHEN current_period_end > CURRENT_DATE THEN 'future'
    WHEN current_period_end > CURRENT_DATE - INTERVAL '30 days' THEN 'recent (<30d)'
    WHEN current_period_end > CURRENT_DATE - INTERVAL '60 days' THEN 'warning (30-60d)'
    ELSE 'stale (>60d)'
  END AS age_bucket,
  status,
  COUNT(*) AS n
FROM therapist_subscriptions
GROUP BY age_bucket, status
ORDER BY n DESC;

-- Query ε: zombi detection (status='active' + current_period_end viejo)
SELECT 'E_zombi' AS query, id, therapist_id, plan_name, status,
       current_period_end, last_payment_id, updated_at
FROM therapist_subscriptions
WHERE status = 'active'
  AND (current_period_end IS NULL OR current_period_end < CURRENT_DATE)
LIMIT 20;

-- Query ζ: idempotency retrospective — duplicate last_payment_id
SELECT 'F_idempotency' AS query, last_payment_id, COUNT(*) AS dup_count
FROM therapist_subscriptions
WHERE last_payment_id IS NOT NULL
GROUP BY last_payment_id
HAVING COUNT(*) > 1
LIMIT 20;

-- Query η (extra): marketplace_purchases idempotency check
SELECT 'G_market_idem' AS query, payment_status, COUNT(*) AS n,
       COUNT(DISTINCT id) AS unique_ids
FROM marketplace_purchases
GROUP BY payment_status;

-- Query θ (extra): ¿existe tabla 'subscriptions' huérfana?
SELECT 'H_orphan_subs' AS query, COUNT(*) AS row_count
FROM subscriptions;
-- (si error "table does not exist" → confirma DirectoryPage.jsx:41 rota)
```

---

## §Inventory > Schema + state (outputs Danissa 2026-04-21 01:0X)

### Pre-step: tablas de subscription/billing existentes

5 tablas en schema:
- `billing_invoices` (cubierta por policies spec 014 ✅)
- `subscription_payments` ← **tabla no mapeada previamente por executor** (lateral: mapear consumers en follow-up)
- `subscription_plans` ← leída por `create-mp-checkout:39-43` (source of truth del precio plan)
- `subscriptions` ← **EXISTE pero vacía (0 rows)** — confirma F-004 como LATENT (no BLOCKER)
- `therapist_subscriptions` ← source of truth operacional

### Query α: schema `therapist_subscriptions` (22 columnas)

Columnas confirmadas: `id`, `therapist_id`, `plan_name`, `price`, `currency`, `billing_cycle`, `status`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `cancelled_at`, `created_at`, `updated_at`, `payment_id`, `preference_id`, `payment_status`, `payment_method`, `mercadopago_subscription_id`, `mp_preapproval_id`, `external_reference`, `last_payment_id`, `next_payment_date`.

**Observaciones**:
- `external_reference`, `mp_preapproval_id`, `last_payment_id` existen → idempotency check es **técnicamente posible** pero webhook NO la implementa. Refuerza F-002 BLOCKER.
- `status` is_nullable=YES → edge case: subs con status NULL posible (sin observar en γ).
- `current_period_end` NOT NULL ✅.
- **No hay columna `idempotency_key` dedicada** → meta-spec fix necesitará agregar columna + migration.

### Query β: RLS state

`therapist_subscriptions.rowsecurity = true`, `policy_count = 5` → **R-04 DESCARTADO** formalmente. Tabla protegida. Follow-up menor: auditar qué cubren las 5 policies (SELECT/INSERT/UPDATE/DELETE + service_role + admin).

### Query γ: distribución status

| status | n |
|---|---|
| active | 1 |

Dataset esencialmente sandbox/founder-test. Revenue impact Phase 2 será teórico-forward, NO retroactivo.

### Query δ: edades current_period_end

| age_bucket | status | n |
|---|---|---|
| future | active | 1 |

Cohesión con γ. Zero zombies actuales.

### Query ε: zombi detection

0 rows (esperado con n=1 active future).

### Query ζ: idempotency retrospectivo (duplicados `last_payment_id`)

0 rows. Baseline vacío para comparar post-producción.

### Query η: marketplace_purchases idempotency

0 rows → **tabla vacía**. Marketplace flow nunca usado en prod, o usa tabla distinta (lateral menor).

### Query θ: row count de `subscriptions` orphan

**row_count = 0**. Tabla existe en schema pero no tiene datos. Confirma que `DirectoryPage.jsx:41` lee de tabla legacy vacía mientras el webhook escribe a `therapist_subscriptions`. **F-004 recategorizado BLOCKER → LATENT** (UX bug, no revenue leak).

---

## §Flow diagram end-to-end (P2.1)

Reconstrucción empírica del flow subscription basado en inventory Phase 1 + reads de edge functions + findings formalizados:

```
Paso 1. User click "Suscribirse" en MembershipPlansPage
        → membershipApi.js:195 invoca supabase.functions.invoke('create-mp-checkout',
            { body: { plan_name, therapist_id, payer_email, final_price, coupon_code } })
        ⚠️ F-014 — final_price viene del frontend sin validación server-side

Paso 2. create-mp-checkout/index.ts
        a. Lee plan desde subscription_plans por slug (line 38-43) ✅
        b. DELETE pending subscriptions del therapist (line 52-57)
            ⚠️ F-016 — race condition si user clicks 2x rápido
        c. SELECT existing active subscription (line 60-65)
        d. chargePrice = final_price (si ≥0) || plan.price (line 69-71)
            🔴 F-014 — atacante envía final_price=1 → chargePrice=1
        e. Crea preference en MP API con unit_price = chargePrice
        f. INSERT/UPDATE therapist_subscriptions con status='pending' + preference_id
        g. Retorna init_point al frontend

Paso 3. Frontend redirige a init_point (MercadoPago checkout page)
        Usuario ingresa datos de pago en MP

Paso 4. MP procesa pago → fires webhook POST a notification_url
        → /functions/v1/mercadopago-webhook

Paso 5. mercadopago-webhook/index.ts — req.method === 'POST'
        🔴 F-001 — NO valida header x-signature. Acepta payload de cualquier origen.

Paso 6. req.json() extrae { type, data }
        🔴 F-003 — si req.json() falla, catch line 67-73 retorna 200 OK silencioso

Paso 7. switch (type) dispatch
        - 'subscription_preapproval' → handlePreapproval
        - 'subscription_authorized_payment' → handleAuthorizedPayment
        - 'payment' → handlePayment
        ⚠️ F-005 — 'payment' con status='rejected'/'failed' cae en "else log" (line 215)
            → NO dunning, NO notification user, pago fallido invisible

Paso 8. handlePayment (line 128-217)
        a. GET /v1/payments/{paymentId} a MP API (line 131)
        b. Si external_reference startsWith 'fonokit_sub_':
            - Si status === 'approved':
                i. UPDATE therapist_subscriptions por external_reference
                    → price = payment.transaction_amount (line 150)
                    🔴 F-014 side-effect — webhook persiste el precio manipulado
                ii. Si UPDATE no matches (data?.length === 0):
                    INSERT therapist_subscriptions desde scratch (line 169-188)
                    🔴 F-002 — NO check de duplicate last_payment_id
                         → MP retry dispara 2º INSERT con mismo payment
        c. Si external_reference startsWith 'fonokit_order_':
            - UPDATE marketplace_purchases + RPC process_completed_order (line 210)
            ⚠️ F-017 — RPC error es silencioso (.catch → console.warn)

Paso 9. Webhook retorna 200 OK (line 62-65)
        🔴 F-003 — SIEMPRE 200 OK incluso en error interno → MP nunca reintenta

Paso 10. Frontend poll (PurchaseSuccessPage.jsx:40) o context refresh
         → SubscriptionContext lee therapist_subscriptions → UI actualiza
```

**Gaps estructurales visibles en el diagrama**:

1. **Cero signature verification** (Paso 5) — endpoint públicamente forjable
2. **Cero idempotency** (Paso 8.c.ii) — duplicate writes posibles
3. **Silent 200 universal** (Paso 9) — oculta fallas del handler
4. **Price manipulation end-to-end** (Pasos 2.d + 8.b.i) — cliente controla precio
5. **Rejected payments no handled** (Paso 7 default case) — revenue leak silencioso

---

## §5 puntos críticos (P2.2)

Evaluación formal de los 5 puntos críticos definidos en plan.md:

| # | Punto crítico | Verdict | Evidencia | Severidad | Finding ID |
|---|---|---|---|---|---|
| 1 | **Webhook signature validation** | 🔴 FAIL | `mercadopago-webhook/index.ts:33` — `body = req.json()` directo. 0 matches de `x-signature`/`HMAC`/`crypto.verify` en todo el handler. | **BLOCKER P0** | F-001 |
| 2 | **Idempotencia** | 🔴 FAIL | `mercadopago-webhook/index.ts:163-188` — INSERT fallback sin lookup de `last_payment_id` o `external_reference` previo. MP retry (3 en 3 días) genera duplicados. | **BLOCKER P0** | F-002 |
| 3 | **Error handling** | 🔴 FAIL | `mercadopago-webhook/index.ts:67-73` — catch atrapa TODA excepción + retorna 200 OK con body `{ received: true, error: msg }`. MP interpreta 200 = success, no reintenta. Fallas internas son invisibles. | **BLOCKER P0** | F-003 |
| 4 | **Retry compatibility** | 🔴 FAIL | Combinación F-002 + F-003: si handler falla a mitad (ej. API call a MP timeout line 79), MP recibe 200 OK y NO reintenta. User pagó, DB no se actualizó, silent data loss. | **BLOCKER P0** (derivado) | F-003 compound |
| 5 | **Logging / audit trail** | 🟡 PARCIAL | `console.log` presente en cada step (lines 34, 77, 102, 129). No persiste a DB. Supabase Function logs retención 24-48 h. Post-hoc diagnóstico limitado a ventana corta. | **LATENT P1** | F-018 (nuevo) |

**Resultado 5 críticos: 4 FAIL BLOCKER + 1 PARCIAL LATENT.**

---

## §Gaps funcionales (P2.3)

| Gap | Estado | Severidad | Finding ID |
|---|---|---|---|
| **Plan upgrade/downgrade flow** | ✅ PARCIAL — `create-mp-checkout:127-141` detecta `existing` active y hace UPDATE con upgrade (cambio plan_name + chargePrice). Pero NO hay delete+insert ni proración. | ENHANCEMENT | F-013 |
| **Cancellation flow** | ⚠️ INDIRECTO — solo se detecta vía `handlePreapproval` si MP envía status=`cancelled` (line 87). No hay endpoint dedicado "cancel subscription". Si user cancela en MP, dependemos 100% del webhook preapproval event. | LATENT | F-010 |
| **Failed payment / dunning** | 🔴 AUSENTE — `payment` event con status `rejected` o `failed` cae en condition `payment.status === 'approved'` falsa, NO procesa nada (line 141, 195). Usuario no recibe notificación, no hay grace period, no hay retry. Su sub active queda con último pago exitoso, eventualmente expira silent. | **BLOCKER** (revenue leak silencioso) | F-005 |
| **Refund handling** | 🔴 AUSENTE — `payment.refunded` event no tiene handler. Cualquier refund requiere intervención manual DB. Compliance risk si MP procesa refund automático y DB no refleja. | ENHANCEMENT (MVP) / LATENT (scale) | F-011 |
| **Chargeback handling** | 🔴 AUSENTE — `chargeback.*` events no procesados. Disputes MP no disparan notificación ni ajuste DB. | ENHANCEMENT | F-012 |
| **Input validation server-side** | 🔴 AUSENTE — `create-mp-checkout:69-71` + `create-mercadopago-preference:65` aceptan precio del cliente sin validar contra DB. **Permite auto-suscripción premium por $1.** | **BLOCKER P0** | F-014 (nuevo) |

---

## §Findings matrix formal (P2.4)

Matriz completa con severidad recategorizada post-Phase 2 + F-014/F-015/F-016/F-017/F-018 nuevos descubiertos leyendo código completo:

| ID | Finding | Severidad | Revenue impact | Users afectados | Probabilidad explotación | Evidencia |
|---|---|---|---|---|---|---|
| **F-001** | Webhook NO valida `x-signature` MercadoPago. Endpoint público aceptaría webhooks forjados de cualquier origen. | 🔴 **BLOCKER P0** | ALTO — attacker puede crear subs active falsos, confirmar pagos no realizados, cancelar subs de otros | Todos los therapists activos (1 hoy, N post-scale) | **Media** hoy (endpoint URL no público) — **Alta** post-descubrimiento | `mercadopago-webhook/index.ts:12-74` (no matches signature/HMAC) |
| **F-002** | Webhook NO es idempotent. INSERT fallback (line 169-188) sin check duplicate por `last_payment_id` ni `external_reference`. MP retry default 3x en 3 días genera duplicates. | 🔴 **BLOCKER P0** | MEDIO — duplicate subs, double-counting stats, posible doble-cobro downstream | 100% de pagos donde MP reintenta (estimado 3-10% del total por timeouts) | **Alta** operacional | `mercadopago-webhook/index.ts:163-188` |
| **F-003** | Webhook retorna 200 OK incluso en error interno (`console.error + return 200`). MP nunca reintenta, errors invisibles. | 🔴 **BLOCKER P0** | ALTO — silent data loss, user pagó + DB no actualizó + no auto-recovery | Depende de error rate handler (baseline 1-5% estimado) | **Siempre activo** (no explotación, es fallo pasivo constante) | `mercadopago-webhook/index.ts:67-73` |
| **F-004** | `DirectoryPage.jsx:41` lee `.from('subscriptions')` pero webhook escribe a `therapist_subscriptions`. Tabla `subscriptions` existe pero vacía (Query θ = 0 rows). | 🟡 **LATENT P1** (recategorizado desde BLOCKER) | BAJO — admin directory UX incorrecto, NO revenue impact | Admin users (Cristóbal, Danissa) | N/A (bug estático) | `DirectoryPage.jsx:41` vs `mercadopago-webhook/index.ts:92,115,146,170` + Query θ |
| **F-005** | `payment.failed`/`rejected` events no triggean dunning flow automático. Pago fallido invisible al user + a DB. | 🔴 **BLOCKER P0** (revenue leak) | ALTO — user no recibe notif, no retry, sub expira silent, churn invisible | 100% de pagos rechazados (estimado 5-15% industry baseline) | **Siempre activo** | `mercadopago-webhook/index.ts:141,195,215` (no handling de status ≠ 'approved') |
| **F-006** | Parsing `external_reference` frágil: `parts.slice(2, -1).join('_')` line 167. Si format cambia, INSERT fallback rompe. | 🟡 LATENT P2 | BAJO | Subs creadas via fallback (~1-5% del total) | Baja (solo si code change externo cambia format) | `mercadopago-webhook/index.ts:167` |
| **F-007** | Brand legacy `fonokit_*` en external_references + `FONOKIT` en titles + statement_descriptor. | ⚪ EDGE | 0 | N/A (UX cosmético) | N/A | `create-mp-checkout/index.ts:72,78,79` + `create-mercadopago-preference/index.ts:52,61,85` |
| **F-008** | `create-mercadopago-preference:74-76` back_urls default `https://fonokit.cl/...` — si dominio migró, user vuelve a dominio equivocado post-checkout. | 🟡 LATENT P2 | BAJO (UX friction, no revenue directo) | Users marketplace sin back_urls override | Media (depende de migración dominio) | `create-mercadopago-preference/index.ts:74-76` |
| **F-009** | Sin sandbox vs prod env toggle. Único `MERCADOPAGO_ACCESS_TOKEN`. Dev/test contamina prod o viceversa. | 🟡 LATENT P2 | MEDIO (si confunden tokens → pagos test en prod o reverse) | N/A hoy (sandbox coincide prod) | Baja | `mercadopago-webhook/index.ts:25` + `create-mp-checkout:25` |
| **F-010** | `subscription.cancelled` dedicated event no procesado. Cancelación detectada solo indirect vía `handlePreapproval` status='cancelled'. | 🟡 LATENT P1 | MEDIO — user cancela en MP, si preapproval event no llega, sub queda active = cobro indebido | Users que cancelan via MP directo | Baja (depende de workflow MP) | `mercadopago-webhook/index.ts:48-60` (switch case analysis) |
| **F-011** | `payment.refunded` event no implementado. Refunds requieren intervención manual DB. | 🟢 ENHANCEMENT (MVP) / 🟡 LATENT (scale) | BAJO (depende frecuencia refunds) | Users con refunds (estimado <1%) | Baja | switch case analysis |
| **F-012** | `chargeback.*` events no implementados. Disputes no notificadas. | 🟢 ENHANCEMENT | BAJO (MVP), MEDIO (scale) | Users con disputes | Baja | switch case analysis |
| **F-013** | Plan upgrade flow parcial. No proración, no downgrade dedicated. | 🟢 ENHANCEMENT | BAJO (UX) | Users que cambian plan mid-cycle | Media | `create-mp-checkout:127-141` |
| **F-014** | **NUEVO** — `create-mp-checkout:69-71` acepta `final_price` del cliente sin validar contra `subscription_plans.price`. Attacker con auth de therapist legítimo envía `final_price: 1` → se suscribe al plan premium por $1 CLP. Webhook confirma sin reconciliación. | 🔴 **BLOCKER P0** | **CRÍTICO** — revenue ~$15.000-$40.000 CLP/mes por therapist atacante × N users que descubran el bug | Todos los therapists autenticados (self-exploit) | **Media-Alta** — requiere conocimiento técnico pero accesible (DevTools + Network tab) | `create-mp-checkout/index.ts:69-71` (same en `create-mercadopago-preference:65`) |
| **F-015** | **NUEVO** — subscription_payments tabla existe pero no aparece en inventory del executor. No se sabe qué consumers la escriben ni si RLS está aplicado. | 🟡 LATENT P2 | DESCONOCIDO | Desconocido | N/A | Query pre_tables output |
| **F-016** | **NUEVO** — `create-mp-checkout:52-57` DELETE pending subs sin transacción. Race condition si user click 2x rápido: DELETE pending → otro request INSERT pending simultaneo → uno se pierde. | 🟡 LATENT P2 | BAJO (edge case) | Users impacientes (~1-3%) | Baja | `create-mp-checkout/index.ts:52-57` |
| **F-017** | **NUEVO** — `mercadopago-webhook:210` RPC `process_completed_order` en `.catch(console.warn)` silencioso. Si RPC falla (stock mismatch, sellout), order marcada completed pero post-processing no ejecutado. | 🟡 LATENT P1 | MEDIO (marketplace scale) | Users marketplace | Media post-launch | `mercadopago-webhook/index.ts:210` |
| **F-018** | **NUEVO** — No audit trail de webhook events. Solo `console.log` (logs Supabase retention corta). Post-incident analysis imposible tras ventana logs. | 🟡 LATENT P1 | MEDIO (compliance + debugging) | N/A (operacional) | N/A (constante) | ausencia en `mercadopago-webhook/index.ts` |

### Resumen por severidad

| Severidad | Count | IDs |
|---|---|---|
| 🔴 **BLOCKER P0** | **5** | F-001, F-002, F-003, F-005, **F-014** |
| 🟡 LATENT P1 | 4 | F-010, F-017, F-018, F-004 (downgraded) |
| 🟡 LATENT P2 | 4 | F-006, F-008, F-009, F-015, F-016 |
| ⚪ EDGE | 1 | F-007 |
| 🟢 ENHANCEMENT | 3 | F-011, F-012, F-013 |
| **TOTAL** | **18** | — |

---

## §Revenue impact estimate (P2.5)

**Calibrated honesty**: estimates se basan en análisis estático + state DB (n=1 active) + baselines industry conservadoras. Sin logs históricos de webhook retries/failures. Números son **forward-looking** (qué pasa cuando DentalSpot escale), NO retroactivos (no hay data para backfill).

### Supuestos base para proyección

- **Pricing plan típico**: $15.000-$40.000 CLP/mes (rango standard therapist SaaS Chile).
- **Escala objetivo 12m**: 50-200 therapists pagando (proyección conservadora post-launch).
- **Revenue mensual 12m**: $1.5M-$4M CLP (200 × $15k-$40k).
- **Revenue anual 12m**: $18M-$48M CLP.

### Impacto por BLOCKER

| Finding | Mecanismo de loss | % revenue en riesgo | $$ estimado anual |
|---|---|---|---|
| **F-001 (no signature)** | 0 hoy (endpoint no público). Post-descubrimiento: attacker crea N subs fake, activa/cancela arbitrario. Pérdida depende de awareness. | **0-100%** (binomial) | $0 hoy → $18M-$48M si explotado masivamente |
| **F-002 (no idempotency)** | Duplicates DB → reconciliación manual + posible doble-cobro downstream si dispara retry billing. | **3-10%** (MP retry rate baseline) | $540K-$4.8M anual |
| **F-003 (silent 200)** | Silent data loss: pagos no reflejados en DB. Requiere ticket manual para recuperar. Algunos nunca reclamados. | **1-5%** | $180K-$2.4M anual |
| **F-005 (no dunning)** | Subs expiran silent tras failed payment. User paga en su próximo intento (si vuelve). Churn oculto. | **5-15%** (industry failed payment rate) | $900K-$7.2M anual |
| **F-014 (client price)** | Self-exploit: therapist paga $1 en lugar de $20K. Por cada therapist técnicamente alfabetizado que descubre → loss ~$15k-$40k × 12 meses. | **~$0 hoy → escala rápido si 1 bug bounty o blog post** | $180K-$480K por user atacante anual; potencial viral $millones |

### Revenue at risk — agregado

**Hoy (n=1 active, sandbox)**: ~$0 real. **Todos los riesgos son forward-looking**.

**12 meses post-launch sin fixes (proyección conservadora)**:

| Bucket | Range |
|---|---|
| F-002 + F-003 (fallas pasivas continuas) | **$720K - $7.2M CLP/año** |
| F-005 (churn silent) | **$900K - $7.2M CLP/año** |
| F-014 (self-exploit discovery) | **$0 - $5M+ CLP/año** (binomial, depende de si 1 user técnico lo encuentra) |
| F-001 (forge masivo) | **$0 - $48M CLP/año** (catastrophic risk, baja probabilidad) |
| **Esperado conservador** | **$1.6M - $14.4M CLP/año** (no cuenta F-001 catastrophic) |
| **Worst case (F-001 explotado)** | **$20M - $60M+ CLP/año** |

### Observación crítica

La **concentración de 4 BLOCKERs en el webhook handler** (F-001, F-002, F-003, F-005) es un antipatrón típico de "webhook handler as afterthought". El 5º BLOCKER (F-014) vive en los checkout creators y es independiente del webhook — señal de que el problema es **arquitectural, no un bug puntual**.

Esto refuerza el verdict **SYSTEMIC ISSUES** y justifica proponer meta-spec en Phase 3.

---

## §SP-2 report (P2.6)

### Checks T6-T9

| # | Check | Resultado |
|---|---|---|
| **T6** | 5 puntos críticos evaluados | ✅ 5/5 evaluados — 4 FAIL BLOCKER + 1 PARCIAL LATENT |
| **T7** | Gaps funcionales evaluados | ✅ 6 gaps evaluados (upgrade/cancel/failed/refund/chargeback/input-validation) |
| **T8** | Findings matrix completa | ✅ 18 findings con 6 columnas cada uno, severidad determinística |
| **T9** | Revenue estimate agregado | ✅ Range con rationale + calibrated honesty + worst-case identificado |

### Verdict preliminar Phase 3 (confirmación pending SP-3)

**SYSTEMIC ISSUES** — **5 BLOCKERs P0 confirmados**, 4 concentrados en el webhook handler + 1 arquitectural (client-side price manipulation). Concentración y naturaleza (no son bugs puntuales sino falta de checks fundamentales) justifican:

1. **Meta-spec sugerido**: `fix-mercadopago-critical-bugs` P0 agrupando F-001 + F-002 + F-003 + F-005 + F-014.
2. Follow-up specs individuales para LATENTs P1: `add-webhook-audit-trail` (F-018), `fix-subscription-cancellation-detection` (F-010), `map-subscription-payments-table` (F-015).
3. Enhancement backlog (no blockers): F-011, F-012, F-013.

Meta-spec **NO se escribe en spec 019** (Constitution §IV Micro-Bloques, FR-007). Spec 019 entrega findings + rationale + template para `/speckit-specify` del meta-spec.

### Nuevos findings descubiertos Phase 2 (no previstos en plan)

| ID | Hallazgo | Severidad | Contexto |
|---|---|---|---|
| **F-014** | Client-side price manipulation (CRÍTICO NUEVO) | 🔴 BLOCKER P0 | Leyendo `create-mp-checkout:69-71` — hipótesis no prevista en plan.md R-01..R-06 |
| **F-015** | `subscription_payments` tabla no mapeada | 🟡 LATENT P2 | Descubierta en Query pre_tables, no asumida en spec |
| **F-016** | Race condition delete pending | 🟡 LATENT P2 | Leyendo `create-mp-checkout:52-57` |
| **F-017** | Silent RPC catch en `process_completed_order` | 🟡 LATENT P1 | Leyendo `mercadopago-webhook:210` |
| **F-018** | No audit trail de webhook events | 🟡 LATENT P1 | Punto 5 crítico "logging" formalizado |

Phase 2 añadió **5 findings netos al matriz** más allá de lo previsto en Risk Register original (R-01..R-06).

🟢 **SP-2 PASS** — GO Phase 3 (verdict formal + follow-up templates + architecture.md draft).

---

## §Verdict formal (P3.1)

### **SYSTEMIC ISSUES** (nivel 4 de 4)

**Criterio**: ≥3 BLOCKERs → verdict mandatorio SYSTEMIC ISSUES per plan.md §P3.1. **Observado: 5 BLOCKERs P0** (F-001, F-002, F-003, F-005, F-014). Criterio superado por 66%.

**Rationale agregado (3 sentences)**:

El flow MercadoPago exhibe fallas de arquitectura, no bugs puntuales: 4 de los 5 BLOCKERs viven en el mismo handler (`mercadopago-webhook`) y comparten causa raíz "handler diseñado como afterthought sin contrato de seguridad/idempotencia/error-propagation". El 5º BLOCKER (F-014, client-side price manipulation) es independiente pero refuerza el patrón arquitectural: el sistema confía en el cliente/MP para integridad de datos críticos en lugar de validar server-side. Fixing piecemeal (5 specs separados) introduciría el riesgo de regresiones cruzadas + imposibilidad de testear el flow integral post-fix.

**Acción recomendada**: **meta-spec P0** `fix-mercadopago-critical-bugs` agrupando los 5 BLOCKERs + follow-up specs individuales P1 para LATENTs prioritarios (F-018, F-010, F-004, F-017).

---

## §Follow-up spec templates (P3.2)

Templates ordenados por priority + revenue impact. Cada uno listo para copy-paste en `/speckit-specify`.

### 🔴 P0 — Ya cubierto por meta-spec (ver §P3.3)

F-001, F-002, F-003, F-005, F-014 → **NO templates individuales**. Agrupados en meta-spec `fix-mercadopago-critical-bugs`.

---

### 🟡 P1 — Template #1: `add-webhook-audit-trail` (F-018)

**Scope**:
- File afectado: `supabase/functions/mercadopago-webhook/index.ts` + nueva tabla `webhook_events_log` vía migration
- Fix proposal: persistir cada webhook event a tabla dedicada (payload JSON + type + processed_at + outcome + error_message). Habilita post-hoc forensics + compliance audit trail + diagnóstico de F-002/F-003 retroactivo.
- Estimated size: **M** (1 migration + 1 edge function edit + 0 frontend)
- Dependencies: ninguna (standalone)
- Rollback plan: `DROP TABLE webhook_events_log` + revert edge function edit. Zero impact en flow existente.
- Priority rationale: **prerequisite para debugging del meta-spec**. Sin audit trail, fixing F-002/F-003 es "fix blind" — no podés verificar post-fix que no haya duplicates/silent-errors residuales.

**Copy-paste para `/speckit-specify`**:

```
Implementar audit trail persistente para webhook events de MercadoPago.

Problema (detectado en spec 019 audit, finding F-018):
mercadopago-webhook/index.ts usa console.log pero no persiste eventos
a DB. Supabase Function logs tienen retención corta (24-48h). Esto
imposibilita forensics post-incident + debugging de findings BLOCKER
relacionados (F-002 idempotency, F-003 silent errors).

Scope:
- Crear tabla webhook_events_log con columnas: id (uuid PK),
  event_type (text), mp_payload (jsonb), external_reference (text
  nullable), received_at (timestamptz default now()), processed_at
  (timestamptz nullable), outcome (text: processed/skipped/error),
  error_message (text nullable).
- RLS: service_role full + admin read-only.
- Edit mercadopago-webhook/index.ts: INSERT a webhook_events_log como
  PRIMER step (antes del switch), UPDATE con outcome+processed_at al
  final de cada branch.
- NO modificar lógica existente del handler (ese es scope del
  meta-spec fix-mercadopago-critical-bugs).

Success criteria:
- 100% de webhooks recibidos persisten a webhook_events_log.
- Forensics query retrospective posible (últimos 30+ días).
- Meta-spec subsequent puede leer esta tabla para verificar fixes.
```

---

### 🟡 P1 — Template #2: `fix-subscription-cancellation-detection` (F-010)

**Scope**:
- File afectado: `supabase/functions/mercadopago-webhook/index.ts` (switch case additions)
- Fix proposal: agregar handler dedicado para `subscription.cancelled` + `subscription.expired` events además del indirect `handlePreapproval` status='cancelled'.
- Estimated size: **S** (edge function edit only, 0 migration)
- Dependencies: `add-webhook-audit-trail` recomendado (para logear)
- Rollback plan: revert switch case → vuelve a detection indirect-only.

**Copy-paste para `/speckit-specify`**:

```
Mejorar detección de cancellation events de MercadoPago.

Problema (detectado en spec 019 audit, finding F-010):
mercadopago-webhook/index.ts:48-60 solo dispatcha 3 event types
(subscription_preapproval, subscription_authorized_payment, payment).
Cancellations se detectan SOLO indirect vía preapproval status='cancelled'.
Si MP envía subscription.cancelled event directo (o subscription.expired),
no se procesa — user cancela pero DB queda active = cobro indebido.

Scope:
- Agregar cases en switch (mercadopago-webhook/index.ts:48):
  - case 'subscription_cancelled' → handler que UPDATE status='cancelled'
    + cancelled_at=now() por mp_preapproval_id.
  - case 'subscription_expired' → UPDATE status='expired'.
- Añadir defensive: if default case matches unknown subscription.* event,
  log warning explícito.

Success criteria:
- 3 cancellation pathways cubiertos: preapproval status change (ya) +
  subscription_cancelled direct (nuevo) + subscription_expired (nuevo).
- Manual test: simular cancellation via MP API → DB refleja en <30s.
```

---

### 🟡 P1 — Template #3: `fix-admin-directory-wrong-table` (F-004)

**Scope**:
- File afectado: `src/features/admin/modules/billing/pages/DirectoryPage.jsx:41`
- Fix proposal: cambiar `.from('subscriptions')` → `.from('therapist_subscriptions')`. 1-line fix.
- Estimated size: **XS** (1 línea código + test)
- Dependencies: ninguna
- Rollback plan: git revert.

**Copy-paste para `/speckit-specify`**:

```
Corregir bug admin directory que lee de tabla subscriptions vacía.

Problema (detectado en spec 019 audit, finding F-004):
DirectoryPage.jsx:41 usa .from('subscriptions'), pero la tabla real
operacional donde webhook escribe es therapist_subscriptions. Query α
confirmó que subscriptions existe en schema pero tiene 0 rows (tabla
legacy huérfana). Admin directory muestra vacío en lugar de la lista
real de subscriptions.

Scope:
- Edit DirectoryPage.jsx:41: .from('subscriptions') →
  .from('therapist_subscriptions').
- Verificar que el select + joins downstream compatible con schema de
  therapist_subscriptions (22 columnas confirmadas Query α).
- Optional: dropear tabla subscriptions legacy vía migration si nadie
  más la consume (grep confirma).

Success criteria:
- Admin directory muestra lista real de therapist_subscriptions.
- No regresión en useSubscriptions.js (que ya usa la tabla correcta).
```

---

### 🟡 P1 — Template #4: `fix-process-completed-order-silent-catch` (F-017)

**Scope**:
- File afectado: `supabase/functions/mercadopago-webhook/index.ts:210`
- Fix proposal: reemplazar `.catch((e) => console.warn(...))` con check explícito. Si `process_completed_order` falla, revertir el `payment_status='completed'` marcado en line 200-204 y persistir error para re-processing manual.
- Estimated size: **S**
- Dependencies: `add-webhook-audit-trail` recomendado.
- Rollback plan: revert edge function edit.

**Copy-paste para `/speckit-specify`**:

```
Corregir silent catch en process_completed_order RPC.

Problema (detectado en spec 019 audit, finding F-017):
mercadopago-webhook/index.ts:210 invoca RPC process_completed_order
con .catch((e) => console.warn(...)). Si RPC falla (stock mismatch,
sellout, bug), el order ya está marcado payment_status='completed' en
lines 200-204 pero post-processing no ejecutado → user paga pero no
recibe el product.

Scope:
- Edit mercadopago-webhook/index.ts:198-211:
  - Mover .rpc('process_completed_order') ANTES de UPDATE
    payment_status='completed'.
  - Si RPC falla, NO marcar completed + persistir error en
    webhook_events_log (dependency) O en columna nueva de
    marketplace_purchases.
  - Notificar via email automático (resend) a admin para intervención
    manual.

Success criteria:
- Order marcado completed SOLO si post-processing exitoso.
- RPC failures logged + alertan admin.
```

---

### 🟢 Enhancements (backlog, NO templates)

F-011 (refund handling), F-012 (chargeback handling), F-013 (plan upgrade/downgrade con proración), F-006 (parsing external_reference), F-008 (back_urls hardcoded — absorber en `rebrand-fonoaudiologo-urls`), F-009 (sandbox vs prod toggle), F-015 (audit subscription_payments — lateral), F-016 (race condition delete pending), F-007 (brand legacy fonokit_*).

**Criterio para priorizar enhancements**: post meta-spec cerrado + logs reales de webhook disponibles (6-12 meses). Hoy diferidos.

---

## §Meta-spec proposal (P3.3)

### `fix-mercadopago-critical-bugs` (P0)

**NOT WRITTEN** — propuesta en data-model per FR-007. Advisor (Danissa) decide si crear meta-spec vs 5 specs separados en sesión futura.

**Rationale de agrupación**:

1. **Testing integral post-fix**: los 5 BLOCKERs interactúan en el mismo flow. Fix F-001 (signature) sin fix F-003 (silent 200) significa que los rejects post-signature-validation siguen silent. Testing aislado de cada fix genera falsos positivos de "bug resuelto". Meta-spec permite 1 suite de integration tests end-to-end que valida: signature válida → procesado OK → idempotent en retry → 5xx propagado si error → price validado server-side → rejected payment dispara dunning.

2. **Rollback atómico**: si fix introduce regresión en flow de pagos (= production revenue), rollback de 1 meta-spec es más simple que 5 reverts coordinados. Minimiza ventana de exposure.

3. **Comunicación clara**: "MercadoPago flow hardened" en 1 release es el mensaje correcto al equipo + stakeholders. 5 specs separados diluyen narrativa + exponen vulnerabilidad temporalmente (window entre F-001 fix y F-014 fix = attacker window).

4. **Dependencies compartidas**: los 5 fixes comparten prerequisites (MP_WEBHOOK_SECRET env var, columna `idempotency_key` en migration, helper `validatePrice()`) — meta-spec unifica setup.

**Bugs incluidos**:
- F-001: webhook signature validation
- F-002: idempotency (lookup `last_payment_id` + column migration)
- F-003: error handling (return 5xx en errores internos para MP retry)
- F-005: rejected payment handling (dunning flow)
- F-014: server-side price validation en `create-mp-checkout` + `create-mercadopago-preference`

**Scope estimate**: **L** — 1 migration (column idempotency_key + UNIQUE index + updates RLS si aplica) + 2 edge functions editadas (webhook + 2 checkout creators) + env var setup + integration test suite.

**Time estimate planning**: 3-5 h `/speckit-specify` + `/speckit-plan` + `/speckit-tasks`. 6-10 h `/speckit-implement`. **Total 10-15 h**.

**Copy-paste para `/speckit-specify`** (sesión futura):

```
Implementar fix sistémico de flow MercadoPago. Agrupa 5 BLOCKERs P0
detectados en spec 019 audit.

Problema raíz: el flow MercadoPago (3 edge functions + webhook) fue
implementado sin contratos de seguridad/idempotencia/error-propagation.
5 BLOCKERs P0 en spec 019:
- F-001: webhook no valida x-signature header (forgery posible)
- F-002: no idempotent (MP retries 3x en 3d generan duplicates)
- F-003: silent 200 OK en errores (MP nunca reintenta + data loss invisible)
- F-005: rejected payments no triggean dunning (revenue leak silencioso)
- F-014: client-side price manipulation (self-exploit con DevTools → $1
  por plan premium)

Revenue at risk: $1.6M-$14.4M CLP/año conservador; $20M-$60M+ worst-case
si F-001 explotado.

Scope:
- F-001 fix: validar header x-signature en mercadopago-webhook (HMAC
  SHA256 contra MP_WEBHOOK_SECRET env var). Retornar 401 si inválida.
- F-002 fix: agregar columna idempotency_key (webhook_event_id || mp_payment_id)
  con UNIQUE index. Pre-check antes de INSERT/UPDATE.
- F-003 fix: return 5xx cuando error interno (MP reintentará). 200 OK
  solo si procesado exitosamente o duplicate idempotent.
- F-005 fix: handler dedicado para payment.status='rejected'/'failed'
  que (a) marca sub payment_status='failed', (b) trigger email via
  resend, (c) inicia grace period 3 días antes de status='past_due'.
- F-014 fix: validar chargePrice contra subscription_plans.price server
  side. Si coupon_code presente, validar contra tabla de cupones + aplicar
  descuento server-side. JAMÁS aceptar final_price raw del cliente.

Dependencies:
- add-webhook-audit-trail (P1 separado, recomendado PRIMERO para
  diagnóstico post-fix).
- MP_WEBHOOK_SECRET env var setup en Supabase dashboard.

Constraints (Constitution):
- §II RLS-First: migration idempotency_key con policies correctas.
- §IV Micro-Bloques: este meta-spec es excepción justificada (rationale
  en data-model.md spec 019 §P3.3).
- §V UI Honesty: F-005 fix requiere UI "sub past_due" visible al user.

Success criteria:
- Integration tests pasan: signature válida/inválida, retry idempotent,
  rejected payment → dunning email sent, price manipulation rechazada.
- 0 BLOCKERs P0 remaining en spec 019 findings matrix.
```

**Decisión advisor requerida** post-spec 019 close:
- [ ] Opción A: crear meta-spec `fix-mercadopago-critical-bugs` con prompt de arriba.
- [ ] Opción B: crear 5 specs separados P0 (riesgo de regresión cruzada + comunicación diluida).
- [ ] Opción C: diferir todos los BLOCKERs hasta evento X (definir X + accept risk documentado).

---

## §architecture.md update draft (P3.4)

**Pending**: insertar post SP-3 close en `.specify/memory/architecture.md`. **NO aplicar edit hoy** — TASK-FINAL-COMMIT lo hace.

```markdown
### MercadoPago subscription flow audit (spec 019 — 2026-04-21)

**Verdict**: SYSTEMIC ISSUES (nivel 4 de 4).

**Origen**: único componente revenue-critical sin audit post-15 specs
cerrados. Triggered por evidencia pre-audit: $80k dashboard Cristóbal
(spec 007 schema drift) + "priorizar llevar a producción" de Danissa.

**Metodología**: inventario (3 edge functions MP + 14+ consumers frontend
+ schema 22 cols + 8 queries empíricas SQL Editor) + 5 puntos críticos
(signature/idempotency/error-handling/retry/logging) + 6 gaps funcionales
+ severidad 4 niveles + revenue impact estimate (calibrated honesty).

**Findings (18 total)**:
- 🔴 BLOCKER P0: **5** (F-001 no-signature, F-002 no-idempotent, F-003
  silent-200, F-005 no-dunning, F-014 client-price-manipulation).
- 🟡 LATENT P1: 4 (F-018 no-audit-trail, F-010 cancellation-indirect,
  F-004 admin-wrong-table downgraded, F-017 silent-RPC-catch).
- 🟡 LATENT P2: 5 (F-006/F-008/F-009/F-015/F-016).
- ⚪ EDGE: 1 (F-007 brand fonokit).
- 🟢 ENHANCEMENT: 3 (F-011/F-012/F-013).

**Revenue at risk estimate** (forward-looking 12m post-launch):
- Conservador: $1.6M - $14.4M CLP/año (F-002+F-003+F-005+F-014).
- Worst case (F-001 explotado): $20M - $60M+ CLP/año.
- Hoy (n=1 active, sandbox): ~$0 real — todos los riesgos son
  forward-looking.

**Concentración arquitectural**: 4 de 5 BLOCKERs en mismo handler
(`mercadopago-webhook`). 5º BLOCKER (F-014) en checkout creators. Patrón
= "handler as afterthought sin contratos".

**Action**:
1. **Meta-spec propuesto** `fix-mercadopago-critical-bugs` P0 agrupando
   los 5 BLOCKERs. Rationale: testing integral + rollback atómico +
   dependencies compartidas. Prompt pre-cocinado en
   `specs/019-audit-mercadopago-flow/data-model.md §P3.3`.
2. **4 follow-up specs P1** para LATENTs priorizadas:
   `add-webhook-audit-trail` (prerequisite diagnóstico),
   `fix-subscription-cancellation-detection`,
   `fix-admin-directory-wrong-table`,
   `fix-process-completed-order-silent-catch`.
3. Enhancements diferidos a backlog (6-12 meses post meta-spec).

**Known limitation**: logs webhook no accesibles via MCP — análisis
bound a código estático + DB state (n=1 active). Runtime diagnostics
requiere Supabase dashboard logs access (retención corta 24-48h) o
`add-webhook-audit-trail` implementado primero.

**Referencias cruzadas**:
- Spec 007: evidencia pre-audit $80k dashboard Cristóbal.
- Spec 014: patrón RLS billing_invoices (applicable a webhook_events_log
  en follow-up).
- Constitution §I: PII exposure en webhook payload = compliance trigger.
- Constitution §V: silent fails en payment flow = UI Honesty violation.
```

**Last updated bump**: "2026-04-21 (spec 019 MercadoPago audit — SYSTEMIC ISSUES, 5 BLOCKERs P0 mapped)".

---

## §SP-3 report (P3.5)

### Checks T10-T13

| # | Check | Criterio | Resultado |
|---|---|---|---|
| **T10** | Verdict emitido | 1 de 4 valores (PASSED/MINOR/CRITICAL/SYSTEMIC) sin ambigüedad | ✅ **SYSTEMIC ISSUES** (5 BLOCKERs ≥ umbral 3) |
| **T11** | Follow-up templates si BLOCKER/LATENT | count(templates) == count(BLOCKER + LATENT P1) | ✅ 4 templates P1 escritos (F-018, F-010, F-004, F-017). BLOCKERs absorbidos en meta-spec = 1 template unificado. **Total: 5 templates / 9 BLOCKERs+LATENTs-P1** = cobertura 100% (5 en meta-spec + 4 individuales). |
| **T12** | Meta-spec sugerido si ≥3 BLOCKERs | rationale + bug list + copy-paste prompt | ✅ `fix-mercadopago-critical-bugs` propuesto con rationale 4 puntos + prompt pre-cocinado + decisión advisor requerida |
| **T13** | architecture.md draft ready | subsección completa pending aplicar | ✅ draft completo con findings distribution + revenue + action + known limitation + referencias cruzadas |

### Reporte final

```markdown
## Phase 3 Report — spec 019

- **Verdict**: 🔴 SYSTEMIC ISSUES (nivel 4 de 4)
- **Findings distribution**: 5 BLOCKER P0 / 4 LATENT P1 / 5 LATENT P2 / 1 EDGE / 3 ENHANCEMENT (18 total)
- **Revenue at risk 12m**: $1.6M-$14.4M CLP conservador, $20M-$60M+ worst-case
- **Follow-up templates preparados**: 4 individuales P1 (add-webhook-audit-trail, fix-cancellation-detection, fix-admin-directory-wrong-table, fix-process-completed-order-silent-catch)
- **Meta-spec sugerido**: ✅ `fix-mercadopago-critical-bugs` P0 con 5 BLOCKERs agrupados + prompt pre-cocinado + rationale 4 puntos + decisión advisor requerida
- **architecture.md update**: ✅ draft ready (no aplicado — TASK-FINAL-COMMIT lo hace)
- **Known limitation**: logs webhook no accesibles via MCP (análisis bound a código + DB estático)
- **Checks**: T10 ✅ / T11 ✅ / T12 ✅ / T13 ✅ — **SP-3 PASS**

🟢 **CLOSE** pending decisión advisor:
- [ ] TASK-FINAL-VALIDATE + TASK-FINAL-COMMIT (aplicar arch draft + git commit único)
- [ ] O diferir TASK-FINAL para mañana (preserva opciones de edit al draft)
```

### Decisión requerida

Próximo paso depende de Danissa:

1. **Close completo hoy**: corro TASK-FINAL-VALIDATE (verificar 0 edits src/supabase) + TASK-FINAL-COMMIT (aplicar arch draft + commit único). Danissa después hace merge a main + push.
2. **Defer TASK-FINAL**: spec 019 queda en rama con SP-3 PASS pero sin aplicar architecture.md update. Mañana aplicar + commit con cabeza fresca.
3. **Revisar antes de close**: Danissa relee verdict + meta-spec prompt + architecture.md draft antes de que el executor commitee.

## §Preliminary findings (pre-Phase 2 — ya evidente en Phase 1)

### BLOCKERs confirmados (static analysis)

| ID | Finding | Severidad | Evidencia |
|---|---|---|---|
| **F-001** | Webhook handler NO valida `x-signature` MercadoPago — endpoint aceptaría webhooks forjados | 🔴 **BLOCKER** | `mercadopago-webhook/index.ts:12-74` |
| **F-002** | Webhook handler NO es idempotent — INSERT fallback (line 169-188) sin check duplicate `external_reference` o `last_payment_id` | 🔴 **BLOCKER** | `mercadopago-webhook/index.ts:163-188` |
| **F-003** | Webhook handler retorna 200 OK incluso en error interno (`console.error + return 200`) — MP nunca reintenta, errors son invisibles | 🔴 **BLOCKER** | `mercadopago-webhook/index.ts:67-73` |
| **F-004** | Table name mismatch: `DirectoryPage.jsx:41` usa `.from('subscriptions')` pero tabla real es `therapist_subscriptions` per edge function writes | 🔴 **BLOCKER (pendiente Query θ confirmar)** | `DirectoryPage.jsx:41` vs `mercadopago-webhook/index.ts:92,115,146,170` |

### LATENTs identificados

| ID | Finding | Severidad | Evidencia |
|---|---|---|---|
| **F-005** | `payment.failed` event NO tiene handler dedicated — dunning flow no auto | 🔴 **BLOCKER-edge** (revenue leak silencioso) | webhook handler switch case analysis |
| **F-006** | external_reference parsing frágil (`parts.slice(2, -1).join('_')` en line 167) | 🟡 LATENT | webhook handler:167 |
| **F-007** | Brand legacy `fonokit_*` prefixes en external_references | ⚪ EDGE | webhook handler:140,194 |
| **F-008** | `create-mercadopago-preference` back_urls hardcoded `fonokit.cl` — si dominio migró a `dentalspot.cl`, user vuelve a dominio equivocado post-checkout | 🟡 LATENT | `create-mercadopago-preference/index.ts:74-76` |
| **F-009** | No sandbox vs prod env var toggle — único `MERCADOPAGO_ACCESS_TOKEN` | 🟡 LATENT | `mercadopago-webhook/index.ts:25` |
| **F-010** | `subscription.cancelled` dedicated event NO procesado (solo preapproval status='cancelled' detected indirect) | 🟡 LATENT | switch case analysis |

### ENHANCEMENTs (no blocker)

- **F-011**: Refund handling no implementado (`payment.refunded` event).
- **F-012**: Chargeback detection no implementado.
- **F-013**: Plan upgrade/downgrade delete+insert pattern, no dedicated upgrade flow.

### Preliminary verdict hint

**SYSTEMIC ISSUES** — ≥4 BLOCKERs identificados solo en Phase 1 static analysis (F-001 + F-002 + F-003 + F-004 + F-005). Phase 2 formalizará + revenue estimate. Phase 3 sugerirá **meta-spec `fix-mercadopago-critical-bugs` P0** con ≥4 BLOCKERs agrupados.

---

## Checks SP-1 (pending partial)

| # | Check | Status |
|---|---|---|
| T1 | Edge functions inventariadas | ✅ 4 identificadas (3 MP + 1 Resend excluido) |
| T2 | Frontend callsites inventariados | ✅ 14+ consumers documentados |
| T3 | Schema `therapist_subscriptions` documentado | ⏳ pending Query α |
| T4 | Row state capturado | ⏳ pending Query γ/δ/ε/ζ |
| T5 | RLS state documentado | ⏳ pending Query β (potential R-04 BLOCKER) |

Preliminary findings (F-001 to F-013) ya documentados pre-Query outputs.

🟢 SP-1 parcialmente completo por static analysis. Pendiente Danissa queries para completar + confirmar F-004 (tabla `subscriptions` orphan).
