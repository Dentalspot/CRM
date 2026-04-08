-- Fix marketplace admin RLS policies
-- Adds missing admin write policies and admin access to marketplace_orders

-- ── sales_summary: Admin needs UPDATE for invalidation ──
DO $$ BEGIN
  CREATE POLICY "Admins update sales_summary" ON public.sales_summary
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── therapist_commissions: Admin needs UPDATE for approval ──
DO $$ BEGIN
  CREATE POLICY "Admins update therapist_commissions" ON public.therapist_commissions
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── marketplace_orders: Admin needs SELECT to view all orders ──
DO $$ BEGIN
  CREATE POLICY "Admins read marketplace_orders" ON public.marketplace_orders
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── marketplace_purchases: Ensure admin has full access ──
DO $$ BEGIN
  CREATE POLICY "Admins update marketplace_purchases" ON public.marketplace_purchases
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── order_items: Admin needs SELECT ──
DO $$ BEGIN
  CREATE POLICY "Admins read order_items" ON public.order_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── wallets: Admin needs UPDATE (for manual adjustments) ──
DO $$ BEGIN
  CREATE POLICY "Admins update wallets" ON public.wallets
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── withdrawal_requests: Admin access ──
DO $$ BEGIN
  CREATE POLICY "Admins read withdrawal_requests" ON public.withdrawal_requests
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins update withdrawal_requests" ON public.withdrawal_requests
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
