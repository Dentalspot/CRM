# Launch beta — Known issues

**Última actualización**: 2026-04-22 PM (audit del renewal flow BETA-3M-2026)

---

## 🔴 BLOQUEANTE 1 — Cupón 100% efectivamente no expira

**Qué pasa**: un dentista que aplica `BETA-3M-2026` recibe Plan Individual gratis y la sub **nunca expira automáticamente**. El diseño era 3 meses; la realidad es "forever hasta que alguien toque la DB manualmente".

**Root cause**:
- Cliente `MembershipPlansPage.jsx:184` detecta `priceAfterCoupon <= 0` y llama `activateFreeCouponPlan` (Path A)
- Path A crea sub con `cancel_at_period_end=true` y `current_period_end=now+30d`
- **Nada lee ese flag**. Sin `pg_cron` (confirmado ausente), sin webhook MP (no hay preference), sin cron externo.
- Mes 2+: sub queda `status='active'`, RPC `check_plan_limit` no chequea `current_period_end`, user sigue con Individual.

**Archivos relevantes**:
- `src/features/membership/api/membershipApi.js:259` — `activateFreeCouponPlan`
- `src/features/membership/pages/MembershipPlansPage.jsx:184` — trigger
- `supabase/migrations/20260422000001_add_plans_tier_model.sql:91-191` — RPC `check_plan_limit`

**Impacto beta**:
- Dentistas beta reciben Individual forever (no 3 meses)
- Pérdida de revenue potencial si el dentista quería continuar pagando
- Funcionalmente "ok para el beta" si aceptás el trade-off: el beta es gratis y no hay costo de cómputo

---

## 🔴 BLOQUEANTE 2 — `current_renewal_count` nunca incrementa

**Qué pasa**: el campo que trackea "cuántas renovaciones consumió el cupón" se queda en `0` o `1` forever.

**Root cause**: el único código que incrementa `current_renewal_count` vive en `mercadopago-webhook/index.ts:211-220` y solo fira cuando MP manda un webhook de pago aprobado. Los cupones 100% bypassean MP → no hay webhook → no hay increment.

**Archivos relevantes**:
- `supabase/functions/mercadopago-webhook/index.ts:211-220` — increment logic
- `src/features/membership/api/membershipApi.js:259` — Path A (no tracking)
- `supabase/functions/create-mp-checkout/index.ts:167-232` — Path B bypass (sí inicializa pero está dead code)

**Impacto beta**: la intención del spec (3 renovaciones gratis + transición a pago real) **no se va a ejecutar automáticamente**.

---

## 🟠 Issue 3 — Dos paths de "cupón gratis" inconsistentes

Hay 2 implementaciones de activación con cupón 100%:

| | Path A (usado hoy) | Path B (dead code) |
|---|---|---|
| `cancel_at_period_end` | `true` | `false` |
| Tracking `current_renewal_count` | ❌ | ✅ (inicializa en 1) |
| Tracking `applied_coupon_code` | ❌ | ✅ |
| `coupon_redemptions` insert | ✅ | ❌ |
| `current_uses` increment | ✅ (via RPC) | ❌ |

**Recomendación**: decidir cuál es canónico y consolidar.

---

## 🟡 Issue 4 — RPC no valida expiración

El RPC `check_plan_limit` usa:
```sql
WHERE ts.status = 'active' ORDER BY ts.created_at DESC LIMIT 1
```

No chequea `current_period_end > NOW()`. Cualquier sub active con período vencido grant el plan. Amplifica Bloqueante 1.

---

## Workarounds para launch beta

### Opción A — Lanzar igual, aceptar el trade-off ✅ **recomendado para MVP lean**
- Los 10 dentistas beta tendrán Individual gratis los 3 meses + potencialmente más si nadie hace nada
- **Costo**: 0 (no hay cómputo de MP involucrado, Supabase gratis hasta límites generosos)
- **Al mes 3, ejecutar manualmente**:
  ```sql
  -- Expirar subs beta después de 90 días
  UPDATE therapist_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE applied_coupon_code = 'BETA-3M-2026'
    AND current_period_end < NOW() - INTERVAL '90 days'
    AND status = 'active';
  ```
- Mandar email/WhatsApp a cada dentista avisando "tu período terminó, suscribite al precio real o seguiremos la conversación"

**Trade-off**: si 1 dentista desaparece y vos te olvidás de correr el UPDATE, tiene Individual forever. Low-impact para N=10.

### Opción B — Fix completo pre-launch (2-4h)
Migración que:
1. Modifica RPC `check_plan_limit` agregando check `current_period_end > NOW()`
2. Crea edge function `expire-beta-subs` que corre daily via cron externo (Vercel Cron / cron-job.org) y marca subs vencidas
3. Consolida Path A y Path B en una sola implementación

**Trade-off**: retrasa el launch 2-4h para cubrir un caso que afecta a N≤10 dentistas trusted.

### Opción C — Fix parcial RPC-only (30-60min)
Solo actualizar el RPC para que valide `current_period_end`. El sub queda `status='active'` en DB pero el RPC retorna false porque el período venció → user ve límites Free en forms.

**Trade-off**: UX rara (dashboard dice "Plan Individual" pero no puede crear pacientes). Confuso para el user. No recomendado.

---

## Recomendación final

Para el beta con 5-10 dentistas trusted: **Opción A**. Bajo costo operacional (1 UPDATE en 3 meses). Permite launchar hoy.

Para escala >10 users o usuarios no-trusted: **Opción B** obligatorio. Sin eso, un user podría "descubrir el bug" y nunca pagar.

---

## Follow-ups técnicos relacionados

- [ ] Fix definitivo (Opción B) — spec separado `fix-coupon-renewal-expiration` 
- [ ] Consolidar Path A + Path B (Issue 3)
- [ ] Agregar expiration check al RPC (Issue 4)
- [ ] Documentar cron job externo para `expire-beta-subs` en `docs/ops/` futuro
