import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch aggregated payout data for dashboard
 * Aggregates sales vs payouts to determine pending balance per therapist
 */
export const fetchPayoutsDashboardData = async () => {
  try {
    // 1. Fetch all completed sales (order items)
    // We need seller_id (from marketplace_items), total_price, commission_amount
    const { data: sales, error: salesError } = await supabase
      .from('order_items')
      .select(`
        id,
        total_price,
        commission_amount,
        created_at,
        marketplace_item:marketplace_items!inner (
          seller_id
        ),
        order:marketplace_orders!inner (
          status,
          created_at
        )
      `)
      .eq('order.status', 'completed');

    if (salesError) throw salesError;

    // 2. Fetch all recorded payouts
    const { data: payouts, error: payoutsError } = await supabase
      .from('marketplace_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (payoutsError) throw payoutsError;

    // 3. Fetch seller profiles
    // Get unique seller IDs from sales
    const sellerIds = [...new Set(sales.map(s => s.marketplace_item.seller_id))];
    
    let sellers = [];
    if (sellerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', sellerIds);
        
      if (profilesError) throw profilesError;
      sellers = profiles;
    }

    // 4. Aggregate Data
    const therapistBalances = {};

    // Initialize map
    sellers.forEach(seller => {
      therapistBalances[seller.id] = {
        therapist: seller,
        totalSalesGross: 0,
        totalPlatformFees: 0,
        totalNetEarnings: 0,
        totalPaidOut: 0,
        pendingBalance: 0,
        lastPayoutDate: null,
        transactionCount: 0
      };
    });

    // Process Sales
    sales.forEach(sale => {
      const sellerId = sale.marketplace_item.seller_id;
      if (therapistBalances[sellerId]) {
        const gross = Number(sale.total_price) || 0;
        const fee = Number(sale.commission_amount) || 0;
        const net = gross - fee;

        therapistBalances[sellerId].totalSalesGross += gross;
        therapistBalances[sellerId].totalPlatformFees += fee;
        therapistBalances[sellerId].totalNetEarnings += net;
        therapistBalances[sellerId].transactionCount += 1;
      }
    });

    // Process Payouts
    payouts.forEach(payout => {
      const sellerId = payout.author_id;
      // Handle case where a payout exists but seller might not have sales in fetched window (edge case)
      if (!therapistBalances[sellerId]) {
         // Create placeholder if we have payouts but no sales visible (unlikely but safe)
         therapistBalances[sellerId] = {
            therapist: { id: sellerId, full_name: 'Desconocido', email: 'N/A' },
            totalSalesGross: 0,
            totalPlatformFees: 0,
            totalNetEarnings: 0,
            totalPaidOut: 0,
            pendingBalance: 0,
            lastPayoutDate: null,
            transactionCount: 0
         };
      }

      if (payout.status === 'paid' || payout.status === 'completed') {
        therapistBalances[sellerId].totalPaidOut += Number(payout.net_amount) || 0;
        
        // Track last payout date
        const payoutDate = new Date(payout.paid_at || payout.created_at);
        if (!therapistBalances[sellerId].lastPayoutDate || payoutDate > new Date(therapistBalances[sellerId].lastPayoutDate)) {
          therapistBalances[sellerId].lastPayoutDate = payoutDate.toISOString();
        }
      }
    });

    // Calculate Final Pending Balances
    Object.values(therapistBalances).forEach(record => {
      record.pendingBalance = record.totalNetEarnings - record.totalPaidOut;
      // Precision fix
      record.pendingBalance = Math.max(0, Math.round(record.pendingBalance * 100) / 100);
    });

    return {
      balances: Object.values(therapistBalances),
      payoutHistory: payouts
    };

  } catch (error) {
    logger.error('Error fetching payout data:', error);
    throw error;
  }
};

/**
 * Register a new payout
 */
export const createPayout = async ({ sellerId, amount, method, reference, notes }) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_payouts')
      .insert({
        author_id: sellerId,
        gross_amount: 0, // Not strictly tracking gross for payout record, simplified
        platform_fee: 0,
        net_amount: amount,
        status: 'paid',
        payment_method: method,
        payment_reference: reference,
        paid_at: new Date().toISOString(),
        period_start: new Date().toISOString(), // Mock, should ideally cover specific dates
        period_end: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating payout:', error);
    throw error;
  }
};