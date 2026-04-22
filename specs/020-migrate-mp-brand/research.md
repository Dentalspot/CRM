# Research — Spec 020 Migrate MP Brand

**Phase**: 0 (Outline & Research)
**Date**: 2026-04-22
**Plan**: [plan.md](./plan.md)

---

## 1. Inventory exhaustivo de strings "fonokit" en edge functions

### Búsqueda empírica

```bash
grep -rin "fonokit" supabase/functions/create-mp-checkout \
                    supabase/functions/create-mercadopago-preference \
                    supabase/functions/mercadopago-webhook
```

### Findings por archivo (post-inspección del código actual)

#### `supabase/functions/create-mp-checkout/index.ts`

| Línea (approx) | Valor actual | Valor post-rebrand | Tipo |
|---|---|---|---|
| ~150 | `` external_reference = `fonokit_sub_${therapist_id}_${Date.now()}` `` | `` `dentalspot_sub_${therapist_id}_${Date.now()}` `` | `external_reference` prefix |
| ~156 | `` `${plan.name} - FONOKIT (Cupón: ${validatedCouponCode})` `` | `` `${plan.name} - DENTALSPOT (Cupón: ${validatedCouponCode})` `` | `title` (cupón aplicado) |
| ~157 | `` `${plan.name} - FONOKIT` `` | `` `${plan.name} - DENTALSPOT` `` | `title` (sin cupón) |
| ~168 | `` `https://fonokit.cl/dashboard/membership/status?status=approved&plan=${plan.slug}` `` | `` `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=${plan.slug}` `` | `back_urls.success` |
| ~169 | `` `https://fonokit.cl/dashboard/membership/status?status=failure&plan=${plan.slug}` `` | `` `https://dentalspot.cl/dashboard/membership/status?status=failure&plan=${plan.slug}` `` | `back_urls.failure` |
| ~170 | `` `https://fonokit.cl/dashboard/membership/status?status=pending&plan=${plan.slug}` `` | `` `https://dentalspot.cl/dashboard/membership/status?status=pending&plan=${plan.slug}` `` | `back_urls.pending` |

**Total**: 6 reemplazos en create-mp-checkout.

#### `supabase/functions/create-mercadopago-preference/index.ts`

| Línea (approx) | Valor actual | Valor post-rebrand | Tipo |
|---|---|---|---|
| ~52 | `` external_reference = `fonokit_order_${purchaseId}` `` | `` `dentalspot_order_${purchaseId}` `` | `external_reference` prefix |
| ~74 | `` `https://fonokit.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}` `` | `` `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchaseId}` `` | `back_urls.success` default |
| ~75 | `` `https://fonokit.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}` `` | `` `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchaseId}` `` | `back_urls.failure` default |
| ~76 | `` `https://fonokit.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}` `` | `` `https://dentalspot.cl/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchaseId}` `` | `back_urls.pending` default |
| ~132 | `statement_descriptor: 'FONOKIT'` | `statement_descriptor: 'DENTALSPOT'` | `statement_descriptor` |

**Total**: 5 reemplazos en create-mercadopago-preference.

#### `supabase/functions/mercadopago-webhook/index.ts`

| Línea (approx) | Valor actual | Valor post-rebrand | Tipo |
|---|---|---|---|
| ~140 | `` payment.external_reference?.startsWith('fonokit_sub_') `` | `` payment.external_reference?.startsWith('dentalspot_sub_') `` | Dispatch branch (subscription) |
| ~194 | `` payment.external_reference?.startsWith('fonokit_order_') `` | `` payment.external_reference?.startsWith('dentalspot_order_') `` | Dispatch branch (marketplace) |
| ~167 | `` const parts = payment.external_reference.split('_'); // fonokit_sub_{uuid}_{timestamp} `` | `` const parts = payment.external_reference.split('_'); // dentalspot_sub_{uuid}_{timestamp} `` | Comment (actualizar nota) |

**Total**: 3 reemplazos en mercadopago-webhook (2 funcionales + 1 comment cosmético).

### Verificación de patterns sutiles

Búsqueda case-insensitive confirmó:
- No hay `Fonokit` (capitalized mixed)
- No hay `FonoKit` (camelcase)
- Todas las instancias son `fonokit` (lowercase) o `FONOKIT` (uppercase)

### Total global de reemplazos

**14 reemplazos** distribuidos en 3 archivos.

---

## 2. Verificación empírica del dominio `dentalspot.cl`

**Pendiente ejecutar en Phase A (pre-flight check)**:

```bash
curl -I https://dentalspot.cl/dashboard/membership/status
curl -I https://dentalspot.cl/dashboard/marketplace/purchase-success
```

**Expected**: HTTP 200 o redirect válido (no 404, no DNS error).

**Si falla**: pausa del plan hasta que Danissa/deploy frontend resuelva. El dominio debe estar activo antes de Phase C deploy backend — sino los redirects post-checkout llevan a dominio muerto.

---

## 3. Estado actual del secret en Supabase

**Pendiente ejecutar en Phase A**:

```bash
supabase secrets list --project-ref tomremkbuxvedliyywbo
```

**Expected output**: lista incluye `MERCADOPAGO_ACCESS_TOKEN` (valor hasheado, solo presencia visible).

**Decisión basada en output**:
- Si presente → **swap** (Phase C `supabase secrets set` reemplaza valor)
- Si ausente → **initial set** (mismo comando, diferente rationale)

Ambos casos OK. El CLI `supabase secrets set` hace upsert implícitamente.

---

## 4. Estado del webhook en panel MP DentalSpot

### ✅ Confirmado empíricamente en sesión 2026-04-22

- **App creada**: "Dentalspot" en panel https://www.mercadopago.cl/developers/panel/app
- **Tipo integración**: Checkout Pro
- **País operación**: Chile

### Credenciales sandbox obtenidas

- **Access Token**: `APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458`
- **Public Key**: `APP_USR-e568f9c6-83cd-4a70-ab6f-0103a42f8b3f`
- **User ID (developer)**: `3353079458`
- **App ID**: `7364812495545195`

### Webhook configuration ✅

- **Modo**: Modo de prueba (sandbox)
- **URL**: `https://tomremkbuxvedliyywbo.supabase.co/functions/v1/mercadopago-webhook`
- **Eventos marcados**:
  - ✅ Pagos
  - ✅ Planes y suscripciones
- **Signing key**: `6f1ee32823bb9e32d928ed9ead2d57bdd9e61f88ba6335dd8aa97b64d077402c`
- **"Guardar configuración"**: ✅ clickeado y confirmado (botón en gris post-save)

### Test User Buyer (para smoke test Phase D-Test 3)

- **User ID**: `TESTUSER3863199017052498103`
- **Password**: `8DivMzJMQS`
- **Código verificación**: `079458`

**Uso en smoke**: login con estos credentials en la página MP checkout durante Test 3 para completar pago sandbox end-to-end.

---

## 5. Decisiones de diseño

### D-01: Backward compatibility con prefix `fonokit_*` en webhook

**Decisión**: NO implementar.

**Rationale**:
- Query 2 del diagnóstico 2026-04-22 confirmó **0 subscriptions con prefix `fonokit_*`** en DB DentalSpot.
- Cuenta MP DentalSpot es nueva (creada hoy) → no hay pagos in-flight que generen eventos con prefix viejo.
- Agregar OR con prefix viejo añade complejidad sin valor empírico.
- Si algún edge case generara un webhook con prefix `fonokit_*` post-deploy, caería en "Unknown payment type" con log explícito — revisable manualmente.

**Alternativa considerada**: Branch con prefix dual (`fonokit_sub_` OR `dentalspot_sub_`). Rechazada por complejidad innecesaria y por A-03 del spec (verificado).

### D-02: Secret swap ANTES del deploy del código rebrandeado

**Decisión**: Secret swap en T=0, deploy en T=30s (dentro de misma ventana ≤60s).

**Rationale**:
- Si swap AFTER deploy → código rebrandeado crea preferences con `external_reference: dentalspot_sub_*` usando token FonoKit → preferences aparecen en cuenta FonoKit → inconsistencia visible en MP dashboard
- Si swap BEFORE deploy → código FonoKit (aún no rebrandeado) crea preferences con `external_reference: fonokit_sub_*` usando token DentalSpot → preferences aparecen en cuenta DentalSpot con prefix viejo → menos inconsistencia (solo cosmética) y window temporal
- Mitigación del window: ejecutar ambos comandos con gap ≤30-60 segundos.

**Alternativa considerada**: Swap simultáneo (ambos comandos en paralelo). Rechazada porque `supabase functions deploy` toma 15-30 segundos de bundling/deploy asíncrono; swap de secret es atómico e instantáneo → secret swap PRIMERO garantiza que cuando deploy completa, ambos están en DentalSpot context.

### D-03: Test en sandbox only, no producción

**Decisión**: Smoke test Phase D usa credentials sandbox exclusivamente.

**Rationale**:
- Producción requiere access token `APP_USR-*` de credenciales de producción (MP requiere aprobación adicional en algunos flujos)
- Launch real de cobros de dentistas está fuera del scope de este spec — es fase posterior
- Sandbox valida comportamiento funcional 100% sin cobros reales ni compliance PCI DSS

**Alternativa considerada**: Ejecutar 1 test en producción post-sandbox. Rechazada hasta que scope de launch real de cobros sea explícito (otro spec).

### D-04: Comment update en `mercadopago-webhook/index.ts:167`

**Decisión**: Actualizar el comment `// fonokit_sub_{uuid}_{timestamp}` → `// dentalspot_sub_{uuid}_{timestamp}` aunque es cosmético.

**Rationale**:
- Comment describe el **formato actual** del external_reference que el código parsea.
- Post-rebrand, el formato real cambia — comment stale es misleading para future devs.
- Cost de update = 1 línea. Beneficio = documentación accurate.

### D-05: Configuración de webhooks en panel MP también para Modo productivo

**Decisión**: NO aplica este spec. Solo sandbox.

**Rationale**:
- Modo productivo requiere credentials de producción + aprobación adicional de MP + cobros reales
- Launch real es fase posterior fuera del scope
- Webhook de Modo productivo se configura cuando se habilite cobros reales (spec futuro)

---

## 6. NEEDS CLARIFICATION resolution

**Resultado**: 0 `[NEEDS CLARIFICATION]` markers en spec o plan. Todos los supuestos resueltos con evidencia empírica (A-02 verificada 2026-04-22) o defaults documentados en spec.md §Assumptions.

---

## 7. Pre-flight checklist (para Phase A)

Antes de iniciar Phase B (code rebrand), verificar:

- [ ] **A1**: `curl -I https://dentalspot.cl/dashboard/membership/status` responde 2xx o 3xx (no 404, no DNS error)
- [ ] **A2**: `supabase secrets list --project-ref tomremkbuxvedliyywbo` incluye `MERCADOPAGO_ACCESS_TOKEN` (presencia confirmada, valor hasheado OK)
- [ ] **A3**: Panel MP DentalSpot → Webhooks → "Modo de prueba" → confirmar visualmente que URL está guardada (botón "Guardar" en gris). **✅ ya confirmado 2026-04-22.**
- [ ] **A4**: Access Token sandbox disponible en password manager (no en chat/repo): `APP_USR-7364812495545195-042200-...`
- [ ] **A5**: `git status --short` en rama `020-migrate-mp-brand` → working tree clean (no untracked files que puedan confundir el scope del rebrand)

---

## Next

Plan proceeds to Phase 1 outputs:
- `data-model.md` — mapping tabular completo + secrets + config snapshot
- `quickstart.md` — guía ejecutable step-by-step
- `contracts/` — vacío intencionalmente

Post-Phase 1 → `/speckit-tasks` para generar task list dependency-ordered.
