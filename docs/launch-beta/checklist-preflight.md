# Preflight checklist — Launch beta DentalSpot

**Regla**: no mandar invitaciones hasta que 100% de los items estén en verde. Cada item incluye cómo verificarlo.

**Formato**: pegá las queries SQL en Supabase SQL Editor → si el resultado matchea lo esperado, marcá el check.

---

## 1. DB / Cupón `BETA-3M-2026`

### 1.1 — Cupón existe y está activo
- [ ] Query retorna 1 fila con `is_active=true`
```sql
SELECT code, is_active, discount_type, discount_value, max_renewals,
       max_uses, current_uses, applicable_plans, expiration_date
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
```
**Esperado**: `discount_type='percentage'`, `discount_value=100`, `max_renewals=3`, `max_uses=30`, `applicable_plans={individual,clinic_pro}`, `expiration_date` ≈ 2026-10-19.

### 1.2 — No ha sido agotado
- [ ] `current_uses < max_uses`
```sql
SELECT code, current_uses, max_uses, (max_uses - current_uses) AS remaining
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
```
**Esperado**: `remaining > 0`. Si `= 0`, bumpear `max_uses` antes de continuar.

### 1.3 — No está vencido
- [ ] `expiration_date > NOW()`
```sql
SELECT code, expiration_date, (expiration_date - NOW()) AS time_left
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
```
**Esperado**: `time_left` positivo (≥30 días idealmente).

---

## 2. Planes de suscripción

### 2.1 — Los 4 planes están activos
- [ ] 4 filas con `is_active=true`
```sql
SELECT slug, name, price, patient_limit, appointment_limit,
       max_dentists, max_boxes, is_active
FROM subscription_plans
WHERE slug IN ('free', 'individual', 'clinic_pro', 'clinic_premium')
ORDER BY price;
```
**Esperado**:

| slug | name | price | patient_limit | appt_limit | max_dentists | max_boxes |
|---|---|---|---|---|---|---|
| free | Free | 0 | 5 | 15 | 1 | 0 |
| individual | Individual | 14990 | NULL | NULL | 1 | 1 |
| clinic_pro | Clínica Pro | 24990 | NULL | NULL | 5 | 3 |
| clinic_premium | Clínica Premium | 39990 | NULL | NULL | NULL | NULL |

### 2.2 — Plan `profesional` desactivado (placeholder viejo)
- [ ] Retorna 0 filas o `is_active=false`
```sql
SELECT slug, is_active FROM subscription_plans WHERE slug = 'profesional';
```

### 2.3 — RPC `check_plan_limit` existe
- [ ] Función presente en schema `public`
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'check_plan_limit'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname='public');
```
**Esperado**: 1 fila, `pronargs=2`.

---

## 3. Enforcement (smoke manual en dev/staging)

**Setup**: crear un dentista test o usar uno existente con plan forzado a Free:
```sql
-- Reemplazá <UUID> por el therapist_id real
UPDATE therapist_subscriptions
SET plan_name='free', status='active'
WHERE therapist_id = '<UUID>';
```

### 3.1 — Paciente 6° bloqueado
- [ ] Login como dentista test Free
- [ ] Crear 5 pacientes → OK sin modal
- [ ] Intentar crear 6° → `UpgradeModal` aparece con "Desbloquea más pacientes"
- [ ] Click "Actualizar a Individual" → redirect a `/dashboard/membership`

### 3.2 — Cita 16° del mes bloqueada
- [ ] Login como dentista test Free
- [ ] Crear 15 citas del mes en curso → OK
- [ ] Intentar 16° → `UpgradeModal` "Desbloquea más citas por mes"

### 3.3 — Dentista 2° bloqueado (Free o Individual)
- [ ] Login como dentista test con plan Free o Individual (max_dentists=1)
- [ ] Abrir `InviteTherapistModal` de una clínica propia
- [ ] Invitar a otro dentista (con cuenta existente) → `UpgradeModal` "Desbloquea más dentistas" (required=professional)

### 3.4 — Cupón 100% bypass MP funciona
- [ ] Dentista Free elige plan Individual
- [ ] Aplica cupón `BETA-3M-2026`
- [ ] Sistema crea sub directo (NO redirect a MercadoPago)
- [ ] DB: sub `active`, `plan_name='individual'`, `payment_status='approved'`, `price=0`

> ⚠️ **Nota audit 2026-04-22 PM**: este flow usa `activateFreeCouponPlan` (client Path A) que crea sub con `cancel_at_period_end=true`. El flag **no se respeta automáticamente** (no hay cron). Ver `known-issues.md` para detalle + workarounds. Para el beta recomendamos **Opción A** de known-issues: correr UPDATE manual al mes 3.

Query de verificación:
```sql
SELECT therapist_id, plan_name, status, price, discount_percent,
       current_period_start, current_period_end, external_reference
FROM therapist_subscriptions
WHERE external_reference LIKE 'coupon_BETA-3M-2026_%'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 4. MercadoPago (solo si querés testear path pago real)

> **Nota**: para el beta con cupón 100%, MP no se toca. Estos checks son opcionales pero recomendados para cubrir el caso de dentistas que quieran pagar sin cupón.

### 4.1 — Variables de entorno en producción
- [ ] `MP_ACCESS_TOKEN` seteado en Supabase project settings
- [ ] `MP_WEBHOOK_SECRET` seteado
- [ ] `MP_PUBLIC_KEY` (si aplica frontend)

Verificar en Supabase dashboard → Project Settings → Edge Functions → Secrets.

### 4.2 — Edge functions deployed
- [ ] `create-mp-checkout` deployed
- [ ] `mercadopago-webhook` deployed

Desde CLI:
```bash
supabase functions list --project-ref tomremkbuxvedliyywbo
```

### 4.3 — Smoke sandbox pago approved
- [ ] Usar tarjeta de test: `5031 7557 3453 0604`, CVV `123`, vencimiento cualquiera futuro, titular `APRO`
- [ ] Completar checkout → pago aprobado → redirect callback
- [ ] DB: sub `active`, `plan_name` correcto, `payment_status='approved'`

### 4.4 — Webhook se recibe
- [ ] En Supabase logs (edge function `mercadopago-webhook`), aparece 1 request POST con status 200 por pago
- [ ] Si hay 4xx/5xx, detener antes de invitar dentistas

---

## 5. Schema + código en sync

### 5.1 — `schema.sql` regenerado
- [ ] Fecha modificación ≥ 2026-04-22
```bash
ls -l supabase/schema.sql
```

### 5.2 — Migraciones aplicadas
- [ ] `20260422000001_add_plans_tier_model.sql` está en DB
```sql
SELECT version, name FROM supabase_migrations.schema_migrations
WHERE name LIKE '%plans_tier_model%';
```

### 5.3 — No hay commits locales sin pushear
- [ ] `git status` dice "Your branch is up to date"
```bash
git log origin/main..HEAD --oneline
```

---

## 6. Comunicación beta

### 6.1 — Canal de soporte decidido
- [ ] Elegí UN canal: WhatsApp Business / email dedicado / form Typeform. **No mezcles** — los dentistas necesitan UN solo lugar donde quejarse.

### 6.2 — Lista de candidatos
- [ ] Tenés escritos los nombres + emails + teléfonos de 5-10 dentistas a invitar (spreadsheet, Notion, etc).
- [ ] Priorizá: dentistas que conocés personalmente primero (mejor señal cualitativa que quantity).

### 6.3 — Template de invitación listo
- [ ] Copiaste el contenido de `onboarding-dentista.md` y lo personalizaste con:
  - Nombre del dentista
  - Canal de soporte elegido (6.1)
  - Link real de signup (no placeholder)
  - Screenshots reales de los 3 pasos (capturados desde dev/staging)

### 6.4 — Regla de respuesta
- [ ] Definiste tiempo máximo de respuesta soporte (recomendado: <24h).
- [ ] Bloqueaste tiempo en calendario para esto las primeras 2 semanas.

---

## 7. Post-invitación (no preflight, pero recordar)

Una vez mandadas las invitaciones:

- Revisar `metrics-manual.md` diario los primeros 7 días
- Log privado con fecha + dentista + estado ("signed up" / "created patient" / "dropped")
- Si >1 dentista reporta el MISMO bug, parar invitaciones hasta resolverlo
- Feedback activo: mandar mensaje a día 3 y día 14 para cada invitado

---

## Estado actual del preflight

_Al crear el checklist (2026-04-22 PM), sin correr verificaciones desde acá, el estado es:_

| Sección | Estado |
|---|---|
| 1. DB / Cupón | ❓ Verificar |
| 2. Planes | ❓ Verificar (migration post-check pasó en apply — probablemente OK) |
| 3. Enforcement | ❓ Ejecutar smoke (E3 del spec 022) |
| 4. MercadoPago | ❓ Verificar (F-014 desplegado per session log AM) |
| 5. Schema + código | 🟡 4 commits pending push (`git log origin/main..HEAD`) |
| 6. Comunicación | ❌ No iniciado — canal/lista/template pendientes |

**Bloqueo actual**: sección 6. Sin canal + lista + template personalizado, no se puede invitar a nadie.
