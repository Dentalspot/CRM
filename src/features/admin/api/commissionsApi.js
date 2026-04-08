import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch commissions and payments data combining marketplace orders and subscription invoices
 */
export const fetchCommissionsData = async ({ startDate, endDate, therapistId, status }) => {
  try {
    // 1. Fetch Marketplace Orders
    let marketplaceQuery = supabase
      .from('marketplace_orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        buyer:profiles!buyer_id(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (startDate) marketplaceQuery = marketplaceQuery.gte('created_at', startDate);
    if (endDate) marketplaceQuery = marketplaceQuery.lte('created_at', endDate);
    if (status && status !== 'all') marketplaceQuery = marketplaceQuery.eq('status', status === 'paid' ? 'completed' : status);
    // Note: Filtering by therapist (seller) on orders is harder directly if we want "Odontólogo" to mean the one paying (Buyer/Subscriber) or the one selling?
    // Prompt says "Odontólogo" column. For subscriptions, it's the therapist paying. For templates, it's usually the therapist buying.
    // Let's assume we list transactions where therapists pay money.
    
    // 2. Fetch Subscription Invoices
    let subscriptionQuery = supabase
      .from('billing_invoices')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        therapist:profiles!therapist_id(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (startDate) subscriptionQuery = subscriptionQuery.gte('created_at', startDate);
    if (endDate) subscriptionQuery = subscriptionQuery.lte('created_at', endDate);
    if (status && status !== 'all') subscriptionQuery = subscriptionQuery.eq('status', status);

    const [marketplaceRes, subscriptionRes] = await Promise.all([
      marketplaceQuery,
      subscriptionQuery
    ]);

    if (marketplaceRes.error) throw marketplaceRes.error;
    if (subscriptionRes.error) throw subscriptionRes.error;

    // Normalize Data
    const marketplaceTransactions = marketplaceRes.data.map(item => ({
      id: item.id,
      date: item.created_at,
      name: item.buyer?.full_name || 'Desconocido',
      email: item.buyer?.email,
      type: 'Template',
      amount: Number(item.total_amount),
      status: item.status === 'completed' ? 'paid' : item.status, // Normalize status
      raw_status: item.status
    }));

    const subscriptionTransactions = subscriptionRes.data.map(item => ({
      id: item.id,
      date: item.created_at,
      name: item.therapist?.full_name || 'Desconocido',
      email: item.therapist?.email,
      type: 'Subscription',
      amount: Number(item.total_amount),
      status: item.status,
      raw_status: item.status
    }));

    // Combine and Filter by Text Search if needed (client-side for joined fields)
    let allTransactions = [...marketplaceTransactions, ...subscriptionTransactions];

    if (therapistId) { // interpreted as search term here for simplicity
      const lowerTerm = therapistId.toLowerCase();
      allTransactions = allTransactions.filter(t => 
        t.name.toLowerCase().includes(lowerTerm) || 
        t.email?.toLowerCase().includes(lowerTerm)
      );
    }

    // Sort combined
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Summary Stats
    const summary = {
      totalRevenue: 0,
      totalCommissions: 0,
      pendingCount: 0,
      pendingAmount: 0
    };

    allTransactions.forEach(t => {
      const commission = t.amount * 0.10; // 10% rule as requested
      t.commission = commission; // Add to object for table display

      if (t.status === 'paid' || t.status === 'completed') {
        summary.totalRevenue += t.amount;
        summary.totalCommissions += commission;
      } else if (t.status === 'pending' || t.status === 'open') {
        summary.pendingCount++;
        summary.pendingAmount += t.amount;
      }
    });

    return { transactions: allTransactions, summary };

  } catch (error) {
    logger.error('Error fetching commissions data:', error);
    throw error;
  }
};