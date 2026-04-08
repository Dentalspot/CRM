import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { createMarketplacePurchase, purchaseWithMercadoPago } from './marketplacePlansApi';

export const fetchMarketplaceItems = async (filters = {}) => {
  // 1. Fetch marketplace_items
  let query = supabase
    .from('marketplace_items')
    .select('*')
    .eq('is_active', true)
    .eq('is_approved', true);

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.type && filters.type !== 'all') {
    // Map category to item_type(s)
    if (filters.type === 'activity') {
      // Descargables: materials uploaded by therapists (have therapist_material_id)
      query = query.in('item_type', ['activity', 'material'])
        .not('therapist_material_id', 'is', null);
    } else if (filters.type === 'resource') {
      // Productos: physical products + materials without therapist_material_id
      query = query.or('item_type.in.(resource,product),and(item_type.eq.material,therapist_material_id.is.null)');
    } else {
      query = query.eq('item_type', filters.type);
    }
  }

  switch (filters.sort) {
    case 'popular': query = query.order('total_sales', { ascending: false }); break;
    case 'highest_rated': query = query.order('rating', { ascending: false, nullsFirst: false }); break;
    case 'lowest_price': query = query.order('price', { ascending: true }); break;
    case 'highest_price': query = query.order('price', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  // 2. Also fetch purchasable treatment_plans
  let treatmentPlans = [];
  try {
    let tpQuery = supabase
      .from('treatment_plans')
      .select('id, name, description, duration_weeks, number_of_sessions, target_diagnosis, target_population, plan_type, therapist_id, created_at')
      .eq('is_purchasable', true)
      .eq('is_active', true)
      .eq('is_template', true);

    if (filters.search) {
      tpQuery = tpQuery.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data: tpData } = await tpQuery.order('created_at', { ascending: false }).limit(20);

    treatmentPlans = (tpData || []).map(tp => ({
      id: `tp-${tp.id}`,
      tp_id: tp.id,
      title: tp.name,
      description: tp.description,
      price: 0,
      item_type: tp.plan_type || 'plan',
      category: tp.target_diagnosis || 'General',
      image_url: null,
      is_active: true,
      is_approved: true,
      is_free: true,
      duration_weeks: tp.duration_weeks,
      total_sessions: tp.number_of_sessions,
      target_population: tp.target_population,
      created_at: tp.created_at,
      is_treatment_plan: true,
    }));
  } catch (e) {
    logger.warn('Error fetching purchasable treatment_plans:', e);
  }

  return [...(data || []), ...treatmentPlans];
};

export const fetchMarketplaceItemById = async (itemId) => {
  const { data, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('id', itemId)
    .single();
  if (error) throw error;
  return data;
};

export const fetchUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('marketplace_purchases')
    .select('*')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback to wallet_transactions if marketplace_purchases fails
    logger.warn('marketplace_purchases query failed, using fallback:', error.message);
    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', userId)
      .eq('reference_type', 'purchase')
      .order('created_at', { ascending: false });
    return txData || [];
  }
  return data || [];
};

/**
 * Create a free order — registers in marketplace_purchases and clones plan.
 * Used by MarketplaceTab, VendorMarketplaceSection, MarketplaceTemplatesPage for free items.
 */
export const createOrder = async (userId, item, _quantity = 1) => {
  const purchase = await createMarketplacePurchase(userId, {
    id: item.tp_id || item.id,
    name: item.title || item.name,
    price_clp: 0,
    is_free: true,
  }, 'free');

  return purchase;
};

/**
 * Purchase a paid marketplace item via MercadoPago.
 * Used by TemplateDetailsPage, MarketplaceTemplatesPage for paid items.
 * Returns { init_point } for redirect to MercadoPago checkout.
 */
export const purchaseMarketplaceItem = async (userId, item, userEmail) => {
  const preferenceData = await purchaseWithMercadoPago(userId, {
    id: item.tp_id || item.id,
    name: item.title || item.name,
    description: item.description,
    price_clp: item.price,
    is_free: false,
    cover_image_url: item.image_url,
  }, userEmail);

  return preferenceData;
};
