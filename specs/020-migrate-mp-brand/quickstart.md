# Quickstart — Spec 020 Migrate MP Brand

**Phase**: 1 (Design & Contracts — Ejecución guide)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

Guía step-by-step ejecutable para el `/speckit-implement`. Comandos copy-paste. Tiempo total estimado: **65-75 min**.

---

## Pre-requisitos ✅

### Ya completados en sesión 2026-04-22
- ✅ App "Dentalspot" creada en panel MercadoPago
- ✅ Access Token sandbox obtenido: `APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458`
- ✅ Signing key obtenida: `6f1ee32823bb9e32d928ed9ead2d57bdd9e61f88ba6335dd8aa97b64d077402c`
- ✅ Webhook configurado en panel MP (URL + eventos + "Guardar" clickeado)
- ✅ Test User Buyer disponible: `TESTUSER3863199017052498103` / `8DivMzJMQS`
- ✅ Rama `020-migrate-mp-brand` creada + checked out
- ✅ F-014 fix deployado (commit `3593b12`) — preservar intacto

### Antes de arrancar Phase A
- [ ] Tener terminal abierta en `/Users/danissaklagges/Documents/DENTALSPOT/`
- [ ] Supabase CLI v2.90.0+ disponible (ya instalada, verificado 2026-04-22)
- [ ] Credencial guardada en password manager

---

## Phase A — Pre-flight checks (~10 min)

### A1. Verificar dominio DentalSpot vivo

```bash
curl -I https://dentalspot.cl/dashboard/membership/status 2>&1 | head -5
curl -I https://dentalspot.cl/dashboard/marketplace/purchase-success 2>&1 | head -5
```

**Expected**: HTTP 200 o 3xx (no 404, no DNS error).

**Si falla**: 🔴 STOP — `dentalspot.cl` no responde. Opciones:
1. Deploy del frontend pendiente → resolver primero
2. Dominio no configurado → registrar DNS / configurar Vercel
3. Continuar con advertencia si es ambiente de desarrollo temporal

### A2. Verificar secret actual en Supabase

```bash
supabase secrets list --project-ref tomremkbuxvedliyywbo | grep MERCADOPAGO
```

**Expected**: línea con `MERCADOPAGO_ACCESS_TOKEN` + hash (no valor en claro).

**Interpretación**:
- Si presente → swap en Phase C
- Si ausente → initial set en Phase C (mismo comando, ninguna diferencia operacional)

### A3. Confirmar panel MP webhook "Guardar" ✅

**Ya verificado 2026-04-22**. Skip este check en esta ejecución.

### A4. Verificar working tree limpio

```bash
git status --short
git branch --show-current
```

**Expected**:
- Branch: `020-migrate-mp-brand`
- Status: `nothing to commit, working tree clean` (o al menos sin archivos modificados en `supabase/functions/`)

**Si hay cambios uncommitted** en `supabase/functions/`: STOP — investigar qué son antes de proceder.

### 🟢 SP-A checkpoint

Antes de pasar a Phase B, confirmar mentalmente:
- [ ] A1 PASS (dominio vivo)
- [ ] A2 PASS (secret presente o listo para set)
- [ ] A4 PASS (working tree limpio)

---

## Phase B — Code rebrand (~20 min)

### B1. Edit `create-mp-checkout/index.ts` (6 reemplazos)

Referencia: ver `data-model.md §1` para tabla exhaustiva. Los cambios son:

```diff
// Línea ~150:
-    const external_reference = `fonokit_sub_${therapist_id}_${Date.now()}`
+    const external_reference = `dentalspot_sub_${therapist_id}_${Date.now()}`

// Líneas ~156-157 (dentro de items[0].title):
-          ? `${plan.name} - FONOKIT (Cupón: ${validatedCouponCode})`
-          : `${plan.name} - FONOKIT`,
+          ? `${plan.name} - DENTALSPOT (Cupón: ${validatedCouponCode})`
+          : `${plan.name} - DENTALSPOT`,

// Líneas ~168-170 (dentro de back_urls):
-        success: `https://fonokit.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
-        failure: `https://fonokit.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
-        pending: `https://fonokit.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`
+        success: `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=${plan.slug}`,
+        failure: `https://dentalspot.cl/dashboard/membership/status?status=failure&plan=${plan.slug}`,
+        pending: `https://dentalspot.cl/dashboard/membership/status?status=pending&plan=${plan.slug}`
```

**NO tocar**: lógica de F-014 (validación de `chargePrice`, cupones, etc.) — quedan intactas.

### B2. Edit `create-mercadopago-preference/index.ts` (5 reemplazos)

```diff
// Línea ~52:
-    const external_reference = `fonokit_order_${purchaseId}`
+    const external_reference = `dentalspot_order_${purchaseId}`

// Líneas ~74-76 (dentro de back_urls, son defaults):
-        success: back_urls?.success || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}`,
-        failure: back_urls?.failure || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}`,
-        pending: back_urls?.pending || `https://fonokit.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}`,
+        success: back_urls?.success || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}`,
+        failure: back_urls?.failure || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}`,
+        pending: back_urls?.pending || `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}`,

// Línea ~132:
-      statement_descriptor: 'FONOKIT',
+      statement_descriptor: 'DENTALSPOT',
```

**NO tocar**: lógica de validación de `unit_price` contra DB (F-014 preservado).

### B3. Edit `mercadopago-webhook/index.ts` (3 reemplazos)

```diff
// Línea ~140:
-    if (payment.external_reference?.startsWith('fonokit_sub_')) {
+    if (payment.external_reference?.startsWith('dentalspot_sub_')) {

// Línea ~167 (comment):
-        const therapistId = parts.slice(2, -1).join('_'); // fonokit_sub_{uuid}_{timestamp}
+        const therapistId = parts.slice(2, -1).join('_'); // dentalspot_sub_{uuid}_{timestamp}

// Línea ~194:
-    else if (payment.external_reference?.startsWith('fonokit_order_')) {
+    else if (payment.external_reference?.startsWith('dentalspot_order_')) {
```

### B4. Verificación post-edit

```bash
# B4.1: 0 matches de "fonokit" (case-insensitive) en los 3 archivos
grep -rin "fonokit" \
  supabase/functions/create-mp-checkout/index.ts \
  supabase/functions/create-mercadopago-preference/index.ts \
  supabase/functions/mercadopago-webhook/index.ts

# Expected: (no output) — cero matches

# B4.2: ≥6 matches de "dentalspot_" o "DENTALSPOT" en los 3 archivos
grep -rin "dentalspot_\|DENTALSPOT" \
  supabase/functions/create-mp-checkout/index.ts \
  supabase/functions/create-mercadopago-preference/index.ts \
  supabase/functions/mercadopago-webhook/index.ts | wc -l

# Expected: ≥ 6 (actualmente ~14 por las ocurrencias esperadas)

# B4.3: diff vs main para verificar scope tight
git diff main...HEAD --stat

# Expected: solo los 3 archivos bajo supabase/functions/ modificados. Cero edits en src/ o migrations/.
```

### B5. F-014 preservation diff review

```bash
# Verificar que líneas críticas de F-014 NO cambiaron:
grep -n "chargePrice = plan.price\|dbPrice\|discount_coupons" \
  supabase/functions/create-mp-checkout/index.ts \
  supabase/functions/create-mercadopago-preference/index.ts

# Expected: matches iguales a pre-rebrand (líneas ~71, ~75, ~129-148, ~70-110)
```

### 🟢 SP-B checkpoint

- [ ] B4.1: `grep fonokit` → 0 matches
- [ ] B4.2: `grep dentalspot_|DENTALSPOT` → ≥6 matches
- [ ] B4.3: diff solo en 3 archivos edge function
- [ ] B5: F-014 lógica intacta

---

## Phase C — Deploy sincronizado (~5 min)

**⚠️ Secuencia crítica**. Ejecutar en orden con gap ≤60s.

### C1. Swap del secret (T=0)

```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458 \
  --project-ref tomremkbuxvedliyywbo
```

**Expected output**:
```
Finished supabase secrets set.
```

### C2. Deploy de las 3 edge functions (T=30s)

```bash
supabase functions deploy create-mp-checkout create-mercadopago-preference mercadopago-webhook \
  --project-ref tomremkbuxvedliyywbo
```

**Expected output** (similar a deploy previo 2026-04-22):
```
Uploading asset (create-mp-checkout): ...
Deploying Function: create-mp-checkout
Uploading asset (create-mercadopago-preference): ...
Deploying Function: create-mercadopago-preference
Uploading asset (mercadopago-webhook): ...
Deploying Function: mercadopago-webhook
Deployed Functions on project tomremkbuxvedliyywbo: create-mp-checkout, create-mercadopago-preference, mercadopago-webhook
```

Warning "Docker is not running" es inocuo.

### C3. Verificación post-deploy

```bash
# Ver las edge functions deployadas con timestamps recientes
supabase functions list --project-ref tomremkbuxvedliyywbo | grep -E "create-mp|mercadopago-webhook|create-mercadopago"
```

**Expected**: 3 functions listadas con `updated_at` reciente (< 5 min).

### 🟢 SP-C checkpoint

- [ ] C1: secret set exitoso
- [ ] C2: 3 functions deployed sin error
- [ ] C3: functions aparecen en `list` con timestamp reciente

---

## Phase D — Smoke test sandbox (~15-20 min)

### D1. Test 1 — Preference con plan válido, sin cupón

Setup variables:
```bash
# Reemplazar <SUPABASE_ANON_KEY> con anon key de Supabase dashboard (Settings → API)
# Reemplazar <TU_THERAPIST_ID> con un UUID de un therapist real en tu DB
export ANON_KEY="<SUPABASE_ANON_KEY>"
export THERAPIST_ID="<TU_THERAPIST_ID>"
```

Request:
```bash
curl -X POST \
  "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/create-mp-checkout" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_name": "profesional",
    "therapist_id": "'$THERAPIST_ID'",
    "payer_email": "test@dentalspot.cl"
  }'
```

**Expected response** (JSON):
```json
{
  "success": true,
  "init_point": "https://www.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.cl/checkout/v1/redirect?pref_id=...",
  "preference_id": "7364812495545195-...",
  "external_reference": "dentalspot_sub_<TU_THERAPIST_ID>_<timestamp>"
}
```

**Validaciones**:
- ✅ `success: true`
- ✅ `external_reference` empieza con `dentalspot_sub_` (no `fonokit_sub_`)
- ✅ `preference_id` empieza con `7364812495545195` (app ID DentalSpot)

### D2. Test 2 — Abrir init_point y verificar UI

1. Copiar `sandbox_init_point` de la respuesta del Test 1
2. Pegar en navegador (Chrome recomendado)
3. **Verificar visualmente**:
   - ✅ Página muestra título con "... - DENTALSPOT" (no "FONOKIT")
   - ✅ En URL bar o en inspect, no hay referencia a FonoKit
   - ✅ Monto mostrado coincide con `plan.price` de DB

### D3. Test 3 — Completar pago sandbox con test user

1. En la página MP checkout (de Test 2), click "Pagar" o "Continuar"
2. MP pide login → usar credentials:
   - User: `TESTUSER3863199017052498103`
   - Password: `8DivMzJMQS`
3. Seleccionar método de pago → usar tarjeta de prueba MP:
   - Número: `5031 7557 3453 0604`
   - CVV: `123`
   - Vencimiento: `11/25` (o cualquier futura)
   - Titular: `APRO` (aprueba automáticamente)
4. Confirmar pago
5. **Verificar**:
   - ✅ Redirect a `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=profesional`
   - ✅ URL bar muestra `dentalspot.cl` (no `fonokit.cl`)

### D4. Test 4 — Webhook llegó y se procesó

```bash
# Ver logs recientes de mercadopago-webhook
supabase functions logs mercadopago-webhook --project-ref tomremkbuxvedliyywbo --limit 20
```

**Expected**: entrada reciente con:
- `"========== WEBHOOK RECEIVED =========="`
- `Type: payment` o `Type: subscription_*`
- `external_reference: dentalspot_sub_...` (en log de `handlePayment`)
- NO aparece `"Unknown payment type"` (si aparece, dispatch rebrand falló)

### D5. Test 5 — F-014 regression (CRÍTICO)

Request con `final_price` manipulado:
```bash
curl -X POST \
  "https://tomremkbuxvedliyywbo.supabase.co/functions/v1/create-mp-checkout" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_name": "profesional",
    "therapist_id": "'$THERAPIST_ID'",
    "payer_email": "test-exploit@dentalspot.cl",
    "final_price": 1
  }'
```

**Expected response**:
```json
{
  "success": true,
  "init_point": "...",
  "external_reference": "dentalspot_sub_..."
}
```

**Validación crítica**:
1. Abrir el `init_point` en navegador (incognito para no mezclar con Test 3)
2. **Verificar que el monto mostrado NO es $1** sino el precio real del plan profesional (algo tipo $20.000-$40.000 CLP)
3. Si muestra $1 → 🔴 **F-014 REGRESIÓN** — urgent rollback, investigar qué cambio rompió la lógica

### 🟢 SP-D checkpoint

- [ ] D1: response con `external_reference: dentalspot_sub_*`
- [ ] D2: página MP muestra "DENTALSPOT" en title
- [ ] D3: redirect post-pago va a `dentalspot.cl` + status approved
- [ ] D4: webhook logs muestran dispatch correcto (no Unknown payment type)
- [ ] D5: F-014 intacto (precio real, no $1)

---

## Phase E — Close (~5 min)

### E1. Update architecture.md

Agregar subsección al final de `.specify/memory/architecture.md` con título:

```markdown
### MP brand migration (spec 020 — 2026-04-22)

**Verdict**: ✅ RESUELTO. Rebrand semántico de 3 edge functions MP de FonoKit → DentalSpot.
Cuenta MP DentalSpot creada y conectada. F-014 preservado (smoke Test 5 PASS).

**Cambios**: 14 reemplazos de strings en 3 archivos (external_reference prefix, back_urls,
title, statement_descriptor, dispatch branches). 0 migraciones, 0 src/** edits.

**Operacional**: secret MERCADOPAGO_ACCESS_TOKEN actualizado a token DentalSpot sandbox.
Webhook configurado en panel MP DentalSpot (URL + eventos + signing key).

**Signing key** guardada para meta-spec fix-mercadopago-critical-bugs F-001 (webhook
signature validation).

**Pendiente**: meta-spec fix-mercadopago-critical-bugs (F-001/F-002/F-003/F-005).
Setup production MP (token APP_USR-* producción) cuando launch real de cobros.
```

Actualizar la línea `**Last updated**:` al final del archivo con el nuevo context.

### E2. Update session log

Agregar sección a `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`:

```markdown
## Parte N (final) — Spec 020 rebrand ejecutado

[Descripción breve + 5 smoke tests resultados + commits]
```

### E3. Commit único

```bash
git add supabase/functions/create-mp-checkout/index.ts \
        supabase/functions/create-mercadopago-preference/index.ts \
        supabase/functions/mercadopago-webhook/index.ts \
        .specify/memory/architecture.md \
        docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md \
        specs/020-migrate-mp-brand/

git commit -m "feat(mp): rebrand integration FonoKit → DentalSpot (spec 020)

[detalle en commit per Constitution §IV Micro-Bloques]"
```

### E4. Merge + push

```bash
git checkout main
git merge --no-ff 020-migrate-mp-brand -m "merge: spec 020 migrate-mp-brand (DentalSpot)"
git push origin main
```

### 🟢 SP-E checkpoint

- [ ] E1: architecture.md updated
- [ ] E2: session log updated
- [ ] E3: commit único en rama feature
- [ ] E4: merge a main + push exitoso

---

## ❗ Rollback (si algo sale mal)

### Rollback Phase B (edits locales antes de deploy)

```bash
git checkout supabase/functions/
```

### Rollback Phase C (post-deploy con problema)

```bash
# Revertir secret si el swap dejó cuenta equivocada
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=<token-FonoKit-si-se-guardó> \
  --project-ref tomremkbuxvedliyywbo

# Re-deployar versión previa (checkout commit previo y deploy)
git checkout main -- supabase/functions/
supabase functions deploy create-mp-checkout create-mercadopago-preference mercadopago-webhook \
  --project-ref tomremkbuxvedliyywbo
```

### Rollback Phase D-Test 5 (F-014 regresión — URGENT)

Prioridad 🔴 máxima. Seguir rollback Phase C inmediatamente + investigar qué edit rompió la lógica.

---

## Time tracking

| Phase | Planned | Actual (llenar al ejecutar) |
|---|---|---|
| A | 10 min | __ min |
| B | 20 min | __ min |
| C | 5 min | __ min |
| D | 15-20 min | __ min |
| E | 5 min | __ min |
| **Total** | **55-60 min (sin buffer)** | __ min |

---

## Next después de E4

Ejecutar `/speckit-tasks` o proceder directamente a `/speckit-implement` si el plan + quickstart son suficientes para ejecución sin task list formal.

**Recomendación**: como es spec simple con phases ya bien estructuradas, `/speckit-tasks` es opcional. Este quickstart funciona como task list ejecutable. Advisor decide si crear tasks.md formal para auditoría futura o proceder directo.
