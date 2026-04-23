-- docs/launch-beta/ops-commands.sql
--
-- SQL reutilizables para ops manuales del beta.
-- Copy-paste a Supabase SQL Editor del proyecto tomremkbuxvedliyywbo.
-- NO ejecutar todo a la vez — cada sección es idempotente individualmente.
--
-- ========================================================================
-- §1 — Expirar subs beta al mes 3 (workaround Bloqueante 1, Opción A)
-- ========================================================================
-- Contexto: cupón BETA-3M-2026 fue diseñado para 3 meses gratis. Por el bug
-- documentado en known-issues.md §1, las subs no se expiran automáticamente.
-- Correr esta query AL MES 3 desde el primer signup beta (~julio 2026).
--
-- Preview (no destructivo — corré primero para ver qué va a afectar):

SELECT
  ts.therapist_id,
  p.email,
  ts.plan_name,
  ts.current_period_end,
  ts.created_at,
  (NOW() - ts.current_period_end) AS overdue_by
FROM therapist_subscriptions ts
LEFT JOIN profiles p ON p.id = ts.therapist_id
WHERE ts.applied_coupon_code = 'BETA-3M-2026'
  AND ts.current_period_end < NOW() - INTERVAL '90 days'
  AND ts.status = 'active'
ORDER BY ts.created_at ASC;

-- Si el resultado es razonable (los dentistas listados son los que vos
-- contactaste y NO quieren renovar pagando), ejecutá el UPDATE:

-- UPDATE therapist_subscriptions
-- SET status = 'expired',
--     updated_at = NOW()
-- WHERE applied_coupon_code = 'BETA-3M-2026'
--   AND current_period_end < NOW() - INTERVAL '90 days'
--   AND status = 'active';

-- IMPORTANT: Antes del UPDATE, mandá email/WhatsApp a cada dentista
-- listado en el preview con 7 días de anticipación: "tu período beta
-- termina el [fecha]. Si querés continuar, suscribite al plan real [link]".
-- Los que renueven (aplican sin cupón, pagan) NO los expirés.

-- ========================================================================
-- §2 — Extender período beta de un dentista específico (manual bump)
-- ========================================================================
-- Uso: si querés darle 1 mes extra a un beta user (buena feedback, caso
-- especial, etc). Reemplazá <UUID> por el therapist_id real.

-- UPDATE therapist_subscriptions
-- SET current_period_end = current_period_end + INTERVAL '30 days',
--     updated_at = NOW()
-- WHERE therapist_id = '<UUID>'
--   AND applied_coupon_code = 'BETA-3M-2026'
--   AND status = 'active';

-- ========================================================================
-- §3 — Downgrade de un dentista beta a Free (en vez de expirar)
-- ========================================================================
-- Uso alternativo al §1: dejar al dentista con Plan Free (5 pacientes / 15
-- citas/mes) en vez de expirar totalmente. Mantiene data clínica accesible.

-- UPDATE therapist_subscriptions
-- SET plan_name = 'free',
--     price = 0,
--     applied_coupon_code = NULL,
--     current_renewal_count = 0,
--     updated_at = NOW()
-- WHERE applied_coupon_code = 'BETA-3M-2026'
--   AND current_period_end < NOW() - INTERVAL '90 days'
--   AND status = 'active';

-- ========================================================================
-- §4 — Unblock: re-activar sub expirada (si user pagó y querés restore)
-- ========================================================================

-- UPDATE therapist_subscriptions
-- SET status = 'active',
--     current_period_end = NOW() + INTERVAL '30 days',
--     updated_at = NOW()
-- WHERE therapist_id = '<UUID>'
--   AND status = 'expired';

-- ========================================================================
-- §5 — Bumpear max_uses del cupón si se agota antes de 30 signups
-- ========================================================================

-- UPDATE discount_coupons
-- SET max_uses = 50,
--     updated_at = NOW()
-- WHERE code = 'BETA-3M-2026';

-- ========================================================================
-- §6 — Desactivar cupón (parar nuevos signups beta)
-- ========================================================================

-- UPDATE discount_coupons
-- SET is_active = false,
--     updated_at = NOW()
-- WHERE code = 'BETA-3M-2026';

-- Los dentistas ya activos siguen funcionando. Solo bloquea signups nuevos.
