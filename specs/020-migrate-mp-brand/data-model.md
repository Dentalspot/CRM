# Data Model — Spec 020 Migrate MP Brand

**Phase**: 1 (Design & Contracts)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)
**Research**: [research.md](./research.md)

---

## Overview

Spec 020 **no introduce entities nuevas** ni modifica schemas existentes. Este documento es tabular: mapping exhaustivo de strings a reemplazar + snapshot de secrets/configuración externa.

Si fuera un spec "normal", este archivo describiría tablas, columnas, relaciones, state transitions. Para un rebrand, el "data model" equivalente es **identificar qué valores cambian y dónde**.

---

## 1. Mapping de strings a reemplazar (14 total)

### Tabla consolidada (fuente única de verdad para Phase B)

| # | Archivo | Línea aprox | Tipo | Valor actual (fragmento) | Valor post-rebrand | Nota |
|---|---|---|---|---|---|---|
| 01 | `create-mp-checkout/index.ts` | 150 | `external_reference` prefix | `` `fonokit_sub_${therapist_id}_${Date.now()}` `` | `` `dentalspot_sub_${therapist_id}_${Date.now()}` `` | Impacta todos los nuevos subscriptions |
| 02 | `create-mp-checkout/index.ts` | 156 | `title` (con cupón) | `` `${plan.name} - FONOKIT (Cupón: ${validatedCouponCode})` `` | `` `${plan.name} - DENTALSPOT (Cupón: ${validatedCouponCode})` `` | Texto visible al dentista en checkout MP |
| 03 | `create-mp-checkout/index.ts` | 157 | `title` (sin cupón) | `` `${plan.name} - FONOKIT` `` | `` `${plan.name} - DENTALSPOT` `` | Idem |
| 04 | `create-mp-checkout/index.ts` | 168 | `back_urls.success` | `https://fonokit.cl/dashboard/membership/status?status=approved&plan=...` | `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=...` | Redirect post-pago exitoso |
| 05 | `create-mp-checkout/index.ts` | 169 | `back_urls.failure` | `https://fonokit.cl/dashboard/membership/status?status=failure&plan=...` | `https://dentalspot.cl/dashboard/membership/status?status=failure&plan=...` | Redirect post-pago fallido |
| 06 | `create-mp-checkout/index.ts` | 170 | `back_urls.pending` | `https://fonokit.cl/dashboard/membership/status?status=pending&plan=...` | `https://dentalspot.cl/dashboard/membership/status?status=pending&plan=...` | Redirect pending |
| 07 | `create-mercadopago-preference/index.ts` | 52 | `external_reference` prefix | `` `fonokit_order_${purchaseId}` `` | `` `dentalspot_order_${purchaseId}` `` | Marketplace (OFF pero defense-in-depth) |
| 08 | `create-mercadopago-preference/index.ts` | 74 | `back_urls.success` default | `https://fonokit.cl/dashboard/marketplace/purchase-success?status=approved&...` | `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=approved&...` | Default si frontend no pasa override |
| 09 | `create-mercadopago-preference/index.ts` | 75 | `back_urls.failure` default | `https://fonokit.cl/...?status=failure&...` | `https://dentalspot.cl/...?status=failure&...` | Idem |
| 10 | `create-mercadopago-preference/index.ts` | 76 | `back_urls.pending` default | `https://fonokit.cl/...?status=pending&...` | `https://dentalspot.cl/...?status=pending&...` | Idem |
| 11 | `create-mercadopago-preference/index.ts` | 132 | `statement_descriptor` | `statement_descriptor: 'FONOKIT'` | `statement_descriptor: 'DENTALSPOT'` | **Lo que aparece en banco del cliente** |
| 12 | `mercadopago-webhook/index.ts` | 140 | Dispatch branch (subs) | `payment.external_reference?.startsWith('fonokit_sub_')` | `payment.external_reference?.startsWith('dentalspot_sub_')` | Routing funcional del webhook |
| 13 | `mercadopago-webhook/index.ts` | 194 | Dispatch branch (orders) | `payment.external_reference?.startsWith('fonokit_order_')` | `payment.external_reference?.startsWith('dentalspot_order_')` | Idem marketplace |
| 14 | `mercadopago-webhook/index.ts` | 167 | Comment cosmético | `// fonokit_sub_{uuid}_{timestamp}` | `// dentalspot_sub_{uuid}_{timestamp}` | Doc inline para future devs |

### Resumen por severidad funcional

| Severidad | Count | IDs | Impacto si se omite |
|---|---|---|---|
| 🔴 **Funcional crítico** | 4 | 01, 07, 12, 13 | Webhook no dispatchea correctamente, subscriptions no se activan |
| 🟡 **UX visible al usuario** | 5 | 02, 03, 11, 04-06 | Dentista ve "FONOKIT" en checkout / statement bancario / redirects equivocados |
| 🟠 **UX marketplace (OFF)** | 3 | 08, 09, 10 | Afecta solo si marketplace se activa (hoy FEATURE_FLAG OFF) |
| ⚪ **Cosmético** | 2 | 14, (otros comments si aparecen) | Doc stale, no afecta runtime |

---

## 2. Secrets en Supabase

### Estado pre-rebrand

```
MERCADOPAGO_ACCESS_TOKEN = <valor FonoKit> (o ausente si nunca se configuró)
```

### Estado post-rebrand (target)

```
MERCADOPAGO_ACCESS_TOKEN = APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458
```

### Otros secrets relacionados (futuros, NO tocar en este spec)

- `MP_WEBHOOK_SECRET`: **pendiente** para meta-spec `fix-mercadopago-critical-bugs` F-001. Valor guardado para referencia: `6f1ee32823bb9e32d928ed9ead2d57bdd9e61f88ba6335dd8aa97b64d077402c`. **NO configurar en Supabase en este spec** (code no lo consume todavía, ver FR-013 preservación).

### Comando de aplicación (Phase C)

```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458 \
  --project-ref tomremkbuxvedliyywbo
```

---

## 3. Configuración panel MercadoPago DentalSpot

### Snapshot de estado post sesión 2026-04-22

| Propiedad | Valor | Notas |
|---|---|---|
| App name | Dentalspot | Creada por Danissa, lowercase 's' intencional |
| Integration type | Checkout Pro | Confirmado |
| Country | Chile | |
| App ID | 7364812495545195 | Read-only, MP-generated |
| User ID (dev) | 3353079458 | Danissa's MP dev user |
| Public Key sandbox | `APP_USR-e568f9c6-83cd-4a70-ab6f-0103a42f8b3f` | No usado en edge functions (backend only) |
| Access Token sandbox | `APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458` | **Usar en `MERCADOPAGO_ACCESS_TOKEN`** |
| Access Token producción | (pendiente, fuera de scope spec 020) | Para launch real futuro |

### Webhook configuration (Modo de prueba)

| Propiedad | Valor | Status |
|---|---|---|
| URL | `https://tomremkbuxvedliyywbo.supabase.co/functions/v1/mercadopago-webhook` | ✅ Guardado |
| Evento: Pagos | ✅ marcado | |
| Evento: Planes y suscripciones | ✅ marcado | |
| Otros eventos | ⛔ no marcados | Out of scope |
| Signing key | `6f1ee32823bb9e32d928ed9ead2d57bdd9e61f88ba6335dd8aa97b64d077402c` | ✅ Generado. Guardar para meta-spec F-001. |
| "Guardar configuración" click | ✅ clickeado y confirmado (botón gris post-save) | |

### Test User Buyer (sandbox)

| Propiedad | Valor | Uso |
|---|---|---|
| User ID | `TESTUSER3863199017052498103` | Simula "el dentista" comprando |
| Password | `8DivMzJMQS` | Login en página MP checkout durante smoke test |
| Código verificación | `079458` | OTP simulado si MP lo pide |

**Uso operacional**: en Phase D-Test 3, login con estas credentials en la página MP checkout que se abre desde `init_point`, completar pago ficticio con tarjeta de prueba (disponible en sección "Tarjetas de prueba" del panel MP).

---

## 4. Entidades DB relacionadas (read-only, no modificadas)

### `subscription_plans`

Leída por `create-mp-checkout` para obtener `plan.price` server-side (F-014 preservación). **No modificada** por este spec.

Columnas relevantes:
- `slug` (text, PK secundaria) — usado para lookup por `plan_name` request
- `price` (numeric) — source of truth del precio, NUNCA se confía en cliente (F-014)
- `name` (text) — mostrado en title del preference (con sufijo DENTALSPOT post-rebrand)
- `is_active` (boolean) — filtro de planes vigentes

### `discount_coupons`

Leída por `create-mp-checkout` para validar cupones server-side (F-014 preservación). **No modificada**.

Columnas relevantes:
- `code` (text) — input del cliente validado contra DB
- `discount_type` (text: `percentage` | `fixed`)
- `discount_value` (numeric)
- `is_active` (boolean)
- `valid_from` / `expiration_date` (timestamptz)
- `max_uses` / `current_uses` (integer)
- `applicable_plans` (text[])
- `min_purchase_amount` / `max_discount_amount` (numeric)

### `marketplace_plans`

Leída por `create-mercadopago-preference` para validar precio de marketplace items (F-014 preservación). **No modificada**.

Columnas relevantes:
- `id` (uuid, PK) — lookup por `item.id` del request
- `price_clp` (numeric) — source of truth del precio marketplace plan

### `marketplace_items`

Fallback de lookup si `marketplace_plans` no tiene el ID (F-014 preservación). **No modificada**.

Columnas relevantes:
- `id` (uuid, PK)
- `price` (numeric)

### `therapist_subscriptions`

Escrita por `create-mp-checkout` (INSERT/UPDATE) y `mercadopago-webhook` (UPDATE/INSERT fallback). **Schema no modificado**, pero los valores de `external_reference` persistidos post-rebrand tienen prefix `dentalspot_sub_` en lugar de `fonokit_sub_`.

Columnas relevantes afectadas por VALORES post-rebrand:
- `external_reference` (text, nullable) — nuevo prefix
- `preference_id` (text) — sin cambio
- `plan_name`, `price`, etc. — sin cambio

### `marketplace_purchases`

Escrita por `mercadopago-webhook` (UPDATE cuando MP confirma pago marketplace). **Schema no modificado**. Hoy tabla vacía (0 rows, marketplace OFF).

---

## 5. State transitions (no hay)

Este rebrand no introduce state machines. Los flujos de subscription/purchase mantienen sus transiciones existentes:

```
pending → active (via webhook handlePayment approved)
active → cancelled (via webhook handlePreapproval cancelled)
active → suspended (via webhook handlePreapproval paused)
pending → (orphaned) (si webhook nunca llega)
```

El rebrand solo afecta **el string del external_reference** que el webhook usa para dispatching, no la máquina de estados post-dispatch.

---

## 6. Validation rules (no hay nuevas)

No se introducen reglas de validación nuevas. Las validaciones existentes (F-014 preservadas):

- `chargePrice` derivado de `plan.price` server-side (no del cliente)
- `coupon_code` validado contra `discount_coupons` (7 checks)
- `unit_price` marketplace validado contra `marketplace_plans.price_clp` (con fallback a `marketplace_items.price`)
- Required fields: `plan_name`, `therapist_id`, `payer_email` (checkout); `items`, `payer.email` (preference)

---

## 7. Diferencias post-rebrand — verificación empírica esperada

### Diff visual esperado en `git diff`

Solo cambios de strings, sin cambios estructurales:

```diff
// create-mp-checkout/index.ts línea 150
-    const external_reference = `fonokit_sub_${therapist_id}_${Date.now()}`
+    const external_reference = `dentalspot_sub_${therapist_id}_${Date.now()}`

// create-mp-checkout/index.ts línea 156-157
-          ? `${plan.name} - FONOKIT (Cupón: ${validatedCouponCode})`
-          : `${plan.name} - FONOKIT`,
+          ? `${plan.name} - DENTALSPOT (Cupón: ${validatedCouponCode})`
+          : `${plan.name} - DENTALSPOT`,

// create-mp-checkout/index.ts líneas 168-170
-        success: `https://fonokit.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
-        failure: `https://fonokit.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
-        pending: `https://fonokit.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`
+        success: `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
+        failure: `https://dentalspot.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
+        pending: `https://dentalspot.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`

// create-mercadopago-preference/index.ts línea 52
-    const external_reference = `fonokit_order_${purchaseId}`
+    const external_reference = `dentalspot_order_${purchaseId}`

// create-mercadopago-preference/index.ts línea 74-76 (defaults)
-        success: back_urls?.success || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}`,
-        failure: back_urls?.failure || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}`,
-        pending: back_urls?.pending || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}`,
+        success: back_urls?.success || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}`,
+        failure: back_urls?.failure || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}`,
+        pending: back_urls?.pending || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}`,

// create-mercadopago-preference/index.ts línea 132
-      statement_descriptor: 'FONOKIT',
+      statement_descriptor: 'DENTALSPOT',

// mercadopago-webhook/index.ts línea 140
-    if (payment.external_reference?.startsWith('fonokit_sub_')) {
+    if (payment.external_reference?.startsWith('dentalspot_sub_')) {

// mercadopago-webhook/index.ts línea 167 (comment)
-        const therapistId = parts.slice(2, -1).join('_'); // fonokit_sub_{uuid}_{timestamp}
+        const therapistId = parts.slice(2, -1).join('_'); // dentalspot_sub_{uuid}_{timestamp}

// mercadopago-webhook/index.ts línea 194
-    else if (payment.external_reference?.startsWith('fonokit_order_')) {
+    else if (payment.external_reference?.startsWith('dentalspot_order_')) {
```

**Total expected diff**: ~14 líneas cambiadas, distribuidas en 3 archivos, cero líneas agregadas netas (todo es replacement).

---

## Next

- [`quickstart.md`](./quickstart.md) — guía ejecutable step-by-step con comandos copy-paste
- `/speckit-tasks` — task list ordered con dependencies
- `/speckit-implement` (luego de tasks.md) — ejecutar las 5 phases
