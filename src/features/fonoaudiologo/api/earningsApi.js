import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch earnings data for a specific therapist (seller)
 * @param {string} therapistId 
 * @param {object} filters { startDate, endDate, status }
 */
export const fetchMyEarnings = async (therapistId, { startDate, endDate, status } = {}) => {
  try {
    // Query order_items joined with marketplace_items (to filter by seller) and marketplace_orders (to filter by date/status)
    let query = supabase
      .from('order_items')
      .select(`
        id,
        unit_price,
        total_price,
        commission_amount,
        created_at,
        marketplace_item:marketplace_items!inner (
          id,
          title,
          seller_id
        ),
        order:marketplace_orders!inner (
          id,
          created_at,
          status,
          order_number,
          buyer:profiles!buyer_id (
            full_name,
            email
          )
        )
      `)
      .eq('marketplace_item.seller_id', therapistId)
      .order('created_at', { ascending: false });

    // Apply Filters
    if (startDate) {
      query = query.gte('order.created_at', startDate);
    }
    if (endDate) {
      query = query.lte('order.created_at', endDate);
    }
    if (status && status !== 'all') {
      const dbStatus = status === 'paid' ? 'completed' : status;
      query = query.eq('order.status', dbStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process Data
    const transactions = data.map(item => {
      const amount = Number(item.total_price);
      // commission_amount in DB is typically the platform fee.
      // So Seller Earnings = Total Price - Platform Fee.
      const platformFee = Number(item.commission_amount) || 0;
      const netEarnings = amount - platformFee;

      return {
        id: item.id,
        orderNumber: item.order?.order_number || 'N/A',
        date: item.order?.created_at,
        templateName: item.marketplace_item?.title,
        buyerName: item.order?.buyer?.full_name || 'Usuario Desconocido',
        buyerEmail: item.order?.buyer?.email,
        amount: amount,
        platformFee: platformFee,
        netEarnings: netEarnings,
        status: item.order?.status
      };
    });

    // Calculate Summary Stats
    const summary = {
      totalEarnings: 0,
      totalSales: 0,
      pendingCommissions: 0
    };

    transactions.forEach(t => {
      if (t.status === 'completed') {
        summary.totalEarnings += t.netEarnings;
        summary.totalSales++;
      } else if (t.status === 'pending' || t.status === 'processing') {
        summary.pendingCommissions += t.netEarnings;
      }
    });

    return { transactions, summary };

  } catch (error) {
    logger.error('Error fetching earnings:', error);
    throw error;
  }
};