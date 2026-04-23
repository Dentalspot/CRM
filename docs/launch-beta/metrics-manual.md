# Métricas manuales — Launch beta

Queries SQL para copy-paste en Supabase SQL Editor. **Cadencia sugerida**: diario los primeros 7 días, luego semanal.

**Regla de oro**: si una query tarda >5 segundos o devuelve un error raro, dejá de invitar dentistas hasta entender por qué.

---

## 1. Adquisición

### 1.1 — Signups totales en los últimos N días
```sql
SELECT COUNT(*) AS signups
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND raw_user_meta_data->>'role' IS DISTINCT FROM 'patient';
```

**Señal verde**: ≥1 signup/semana los primeros 30 días.
**Señal roja**: 0 signups en 14 días = algo está roto en la invitación o el funnel.

### 1.2 — Signups con cupón BETA-3M-2026
```sql
SELECT
  DATE_TRUNC('day', ts.created_at) AS day,
  COUNT(*) AS subs_creadas
FROM therapist_subscriptions ts
WHERE ts.external_reference LIKE 'coupon_BETA-3M-2026_%'
  AND ts.status = 'active'
  AND ts.created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;
```

**Esperado**: una fila por día con ≥1 signup. Gap de 3+ días = seguimiento a invitados pendientes.

### 1.3 — Saldo del cupón
```sql
SELECT code, current_uses, max_uses,
       (max_uses - current_uses) AS disponibles,
       expiration_date
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
```

**Señal roja**: `disponibles < 5` antes de tener ≥5 dentistas activos = bumpear `max_uses`.

---

## 2. Activación (¿realmente usan la app?)

### 2.1 — Dentistas que crearon ≥1 paciente
```sql
SELECT
  p.email AS dentista_email,
  ts.plan_name,
  ts.created_at AS sub_creada,
  COUNT(pat.id) AS pacientes_creados,
  MAX(pat.created_at) AS ultimo_paciente
FROM therapist_subscriptions ts
JOIN auth.users u ON u.id = ts.therapist_id
JOIN profiles p ON p.id = u.id
LEFT JOIN patients pat
  ON pat.therapist_id = ts.therapist_id
  AND pat.deleted_at IS NULL
WHERE ts.status = 'active'
  AND ts.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.email, ts.plan_name, ts.created_at
ORDER BY ts.created_at DESC;
```

**Verde**: ≥50% de dentistas con sub activa tienen ≥1 paciente creado en 7 días post-signup.
**Rojo**: dentistas con sub activa hace +14 días y 0 pacientes = contactar para entender por qué.

### 2.2 — Dentistas que agendaron ≥1 cita
```sql
SELECT
  p.email AS dentista_email,
  COUNT(a.id) AS citas_creadas,
  MIN(a.date) AS primera_cita,
  MAX(a.date) AS ultima_cita
FROM appointments a
JOIN profiles p ON p.id = a.therapist_id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.email
ORDER BY citas_creadas DESC;
```

**Verde**: ≥30% de dentistas activados crean ≥1 cita en la primera semana.

---

## 3. Enforcement (¿los límites se respetan?)

### 3.1 — Dentistas Free cerca del límite de pacientes
```sql
SELECT
  ts.therapist_id,
  p.email,
  COUNT(pat.id) AS pacientes,
  sp.patient_limit AS limite
FROM therapist_subscriptions ts
JOIN subscription_plans sp ON sp.slug = ts.plan_name
JOIN profiles p ON p.id = ts.therapist_id
LEFT JOIN patients pat
  ON pat.therapist_id = ts.therapist_id
  AND pat.deleted_at IS NULL
WHERE ts.status = 'active'
  AND ts.plan_name = 'free'
  AND sp.patient_limit IS NOT NULL
GROUP BY ts.therapist_id, p.email, sp.patient_limit
HAVING COUNT(pat.id) >= sp.patient_limit - 2
ORDER BY pacientes DESC;
```

**Acción**: si alguien está en 5/5 paciente Free, mandar recordatorio amistoso del cupón BETA.

### 3.2 — ¿Alguien rompió el límite? (bug de enforcement)
```sql
SELECT
  ts.therapist_id,
  ts.plan_name,
  COUNT(pat.id) AS pacientes,
  sp.patient_limit AS limite,
  (COUNT(pat.id) - sp.patient_limit) AS excedente
FROM therapist_subscriptions ts
JOIN subscription_plans sp ON sp.slug = ts.plan_name
LEFT JOIN patients pat
  ON pat.therapist_id = ts.therapist_id
  AND pat.deleted_at IS NULL
WHERE ts.status = 'active'
  AND sp.patient_limit IS NOT NULL
GROUP BY ts.therapist_id, ts.plan_name, sp.patient_limit
HAVING COUNT(pat.id) > sp.patient_limit
ORDER BY excedente DESC;
```

**Esperado**: 0 filas. Si retorna ≥1 fila = bug en guard o race condition (ver spec 022 Phase E riesgos documentados).

### 3.3 — Citas del mes por dentista (vs límite)
```sql
SELECT
  ts.therapist_id,
  ts.plan_name,
  sp.appointment_limit AS limite,
  COUNT(a.id) AS citas_mes_actual
FROM therapist_subscriptions ts
JOIN subscription_plans sp ON sp.slug = ts.plan_name
LEFT JOIN appointments a
  ON a.therapist_id = ts.therapist_id
  AND a.date >= DATE_TRUNC('month', NOW())
  AND a.date < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
WHERE ts.status = 'active'
GROUP BY ts.therapist_id, ts.plan_name, sp.appointment_limit
HAVING sp.appointment_limit IS NOT NULL
ORDER BY citas_mes_actual DESC;
```

---

## 4. Retención y churn

### 4.1 — Subs canceladas (cancel_at_period_end=true)
```sql
SELECT
  ts.therapist_id,
  p.email,
  ts.plan_name,
  ts.current_period_end,
  ts.cancel_at_period_end,
  ts.updated_at AS ultima_modif
FROM therapist_subscriptions ts
JOIN profiles p ON p.id = ts.therapist_id
WHERE ts.cancel_at_period_end = true
  AND ts.status = 'active'
ORDER BY ts.current_period_end ASC;
```

**Acción**: contactar a cada uno antes de que venza el período. Preguntar por qué cancelan — feedback oro.

### 4.2 — Renovaciones del cupón (¿cuántos ciclos cumplió?)
```sql
SELECT
  ts.therapist_id,
  ts.plan_name,
  ts.current_period_start,
  ts.current_period_end,
  ts.external_reference,
  -- Contar cuántas veces se ha renovado este external_reference
  (SELECT COUNT(*) FROM therapist_subscriptions ts2
   WHERE ts2.therapist_id = ts.therapist_id
     AND ts2.external_reference LIKE 'coupon_BETA-3M-2026_%') AS ciclos_cupon
FROM therapist_subscriptions ts
WHERE ts.external_reference LIKE 'coupon_BETA-3M-2026_%'
  AND ts.status = 'active'
ORDER BY ts.created_at DESC;
```

**Esperado al mes 3**: algunos dentistas en `ciclos_cupon=3`, próximos a pagar precio real. **Acción**: mandar mensaje en día 75-80 avisando del cambio.

---

## 5. Errores y salud del sistema

### 5.1 — Subs pendientes que nunca pasaron a active (checkout abandonado)
```sql
SELECT
  ts.therapist_id,
  p.email,
  ts.plan_name,
  ts.created_at,
  (NOW() - ts.created_at) AS tiempo_pending
FROM therapist_subscriptions ts
JOIN profiles p ON p.id = ts.therapist_id
WHERE ts.status = 'pending'
  AND ts.created_at >= NOW() - INTERVAL '7 days'
ORDER BY ts.created_at DESC;
```

**Verde**: subs `pending` de < 1 hora (usuario aún en MP). **Rojo**: subs `pending` de +24h = checkout abandonado o webhook no llegó.

### 5.2 — Errores en edge functions

Supabase CLI:
```bash
supabase functions logs create-mp-checkout --project-ref tomremkbuxvedliyywbo --tail 100
supabase functions logs mercadopago-webhook --project-ref tomremkbuxvedliyywbo --tail 100
```

O desde el dashboard: Project → Edge Functions → [función] → Logs.

**Rojo**: cualquier `500` repetido o `UNAUTHORIZED` inesperado.

---

## 6. Dashboard ejecutivo (una sola query)

Para vista rápida mental:
```sql
SELECT
  'Signups últimos 7 días' AS métrica,
  COUNT(*)::TEXT AS valor
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND raw_user_meta_data->>'role' IS DISTINCT FROM 'patient'

UNION ALL

SELECT
  'Subs activas con cupón BETA',
  COUNT(*)::TEXT
FROM therapist_subscriptions
WHERE external_reference LIKE 'coupon_BETA-3M-2026_%'
  AND status = 'active'

UNION ALL

SELECT
  'Dentistas con ≥1 paciente',
  COUNT(DISTINCT therapist_id)::TEXT
FROM patients
WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Citas del mes actual',
  COUNT(*)::TEXT
FROM appointments
WHERE date >= DATE_TRUNC('month', NOW())
  AND date < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'

UNION ALL

SELECT
  'Cupón BETA disponibles',
  (max_uses - current_uses)::TEXT
FROM discount_coupons
WHERE code = 'BETA-3M-2026';
```

---

## Criterios go/no-go semanal

Cada lunes, revisá los números arriba y preguntá:

| Pregunta | Verde | Amarillo | Rojo |
|---|---|---|---|
| ¿Hay signups nuevos? | ≥1/semana | 0 por 1 semana | 0 por 2+ semanas |
| ¿Los activos crean pacientes? | ≥50% | 25-50% | <25% |
| ¿Hay errores 500 en logs? | 0 | <5 esporádicos | >10 o repetidos |
| ¿Subs pending stuck (>24h)? | 0 | 1-2 aislados | ≥3 o patrón |
| ¿Cupones disponibles? | >50% del pool | 25-50% | <25% + pipeline activo |

**3+ rojos** = **parar invitaciones nuevas hasta entender causa raíz**. Mejor 5 dentistas felices que 20 con bugs.
