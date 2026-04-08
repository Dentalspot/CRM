import { supabase } from '@/lib/supabaseClient';

export const fetchRevenueMetrics = async () => {
  // Mocking data for now as real analytics might require complex queries or edge functions
  // In a real app, this would aggregate data from 'billing_invoices' or 'payments'
  
  return {
    mrr: 1250000,
    arr: 15000000,
    activeSubscribers: 145,
    churnRate: 2.4,
    revenueHistory: [
      { name: 'Ene', revenue: 800000 },
      { name: 'Feb', revenue: 950000 },
      { name: 'Mar', revenue: 1100000 },
      { name: 'Abr', revenue: 1050000 },
      { name: 'May', revenue: 1200000 },
      { name: 'Jun', revenue: 1250000 },
    ],
    planDistribution: {
      professional: 85,
      clinic: 15,
      basic: 45,
      free: 200
    }
  };
};