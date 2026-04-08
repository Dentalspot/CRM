import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch all therapist subscriptions with pagination and filters
 */
export const fetchAllSubscriptions = async ({ page = 0, pageSize = 10, status, plan, search }) => {
  try {
    let query = supabase
      .from('therapist_subscriptions')
      .select(`
        *,
        therapist:profiles!therapist_id(id, full_name, email, role, created_at)
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (plan && plan !== 'all') {
      query = query.eq('plan_name', plan);
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    // Client-side filtering for search (limited implementation for joined tables)
    let filteredData = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(sub => 
        sub.therapist?.full_name?.toLowerCase().includes(searchLower) ||
        sub.therapist?.email?.toLowerCase().includes(searchLower)
      );
    }

    return { 
      data: filteredData, 
      count: search ? filteredData.length : count 
    };
  } catch (error) {
    logger.error('Error fetching subscriptions:', error);
    throw new Error('No se pudieron cargar las suscripciones. Por favor intente nuevamente.');
  }
};

/**
 * Calculate membership statistics for the admin dashboard
 */
export const fetchMembershipStats = async () => {
  try {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .select('price, status, plan_name, billing_cycle');

    if (error) throw error;

    const stats = {
      totalActive: 0,
      totalRevenue: 0, // Approximate MRR
      churned: 0,
      planDistribution: {
        professional: 0,
        clinic: 0,
        basic: 0
      }
    };

    (data || []).forEach(sub => {
      if (sub.status === 'active') {
        stats.totalActive++;
        
        let mrrContribution = Number(sub.price) || 0;
        if (sub.billing_cycle === 'yearly') {
          mrrContribution = mrrContribution / 12;
        }
        stats.totalRevenue += mrrContribution;

        if (sub.plan_name === 'professional') stats.planDistribution.professional++;
        else if (sub.plan_name === 'clinic') stats.planDistribution.clinic++;
        else stats.planDistribution.basic++;
      } else if (sub.status === 'cancelled' || sub.status === 'past_due') {
        stats.churned++;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Error calculating stats:', error);
    // Return zeroed stats instead of throwing to keep dashboard functional
    return {
      totalActive: 0,
      totalRevenue: 0,
      churned: 0,
      planDistribution: { professional: 0, clinic: 0, basic: 0 }
    };
  }
};

/**
 * Admin action to cancel a subscription
 */
export const adminCancelSubscription = async (subscriptionId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error canceling subscription:', error);
    throw new Error('No se pudo cancelar la suscripción. Verifique los permisos o intente nuevamente.');
  }
};

/**
 * Admin action to change a user's plan manually
 */
export const adminChangePlan = async (subscriptionId, newPlanId, newPrice) => {
  try {
    const { data, error } = await supabase
      .from('therapist_subscriptions')
      .update({
        plan_name: newPlanId,
        price: newPrice,
        // Optionally reset period if instant change, but let's keep simple
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error changing plan:', error);
    throw new Error('No se pudo cambiar el plan. Verifique los datos e intente nuevamente.');
  }
};