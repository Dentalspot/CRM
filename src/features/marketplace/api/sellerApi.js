import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch marketplace listings for a specific seller
 * @param {string} sellerId 
 */
export const fetchSellerListings = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching seller listings:', error);
    throw error;
  }
};

/**
 * Fetch detailed sales history for a seller
 * @param {string} sellerId 
 * @param {Object} filters - optional { startDate, endDate, type }
 */
export const fetchSellerSales = async (sellerId, filters = {}) => {
  try {
    // 1. Get seller's item IDs
    let itemsQuery = supabase
      .from('marketplace_items')
      .select('id, title, item_type')
      .eq('seller_id', sellerId);
      
    if (filters.type && filters.type !== 'all') {
      itemsQuery = itemsQuery.eq('item_type', filters.type);
    }

    const { data: sellerItems, error: itemsError } = await itemsQuery;
    if (itemsError) throw itemsError;
    
    if (!sellerItems || sellerItems.length === 0) return [];

    const itemIds = sellerItems.map(i => i.id);
    const itemMap = sellerItems.reduce((acc, item) => ({...acc, [item.id]: item}), {});

    // 2. Fetch order items for these products
    // Removed avatar_url from buyer selection as it doesn't exist on profiles table
    let query = supabase
      .from('order_items')
      .select(`
        id,
        created_at,
        unit_price,
        total_price,
        commission_amount,
        quantity,
        marketplace_item_id,
        order:marketplace_orders (
          id,
          created_at,
          buyer:profiles!buyer_id (full_name, email)
        )
      `)
      .in('marketplace_item_id', itemIds)
      .order('created_at', { ascending: false });

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data: sales, error: salesError } = await query;
    if (salesError) throw salesError;

    // Transform to flat structure
    return sales.map(sale => ({
      id: sale.id,
      date: sale.created_at,
      product_name: itemMap[sale.marketplace_item_id]?.title || 'Producto desconocido',
      item_type: itemMap[sale.marketplace_item_id]?.item_type,
      buyer_name: sale.order?.buyer?.full_name || 'Usuario eliminado',
      buyer_email: sale.order?.buyer?.email,
      amount_gross: sale.total_price,
      commission: sale.commission_amount,
      amount_net: sale.total_price - sale.commission_amount,
      quantity: sale.quantity
    }));

  } catch (error) {
    logger.error('Error fetching seller sales:', error);
    throw error;
  }
};

/**
 * Fetch simplified sales statistics for the seller
 * @param {string} sellerId 
 */
export const fetchSellerStats = async (sellerId) => {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('marketplace_items')
      .select('id')
      .eq('seller_id', sellerId);

    if (itemsError) throw itemsError;

    const itemIds = items.map(i => i.id);
    
    if (itemIds.length === 0) {
      return { totalRevenue: 0, totalSales: 0, totalCommission: 0, activeListings: 0 };
    }

    const { data: sales, error: salesError } = await supabase
      .from('order_items')
      .select('total_price, commission_amount, quantity')
      .in('marketplace_item_id', itemIds);

    if (salesError) throw salesError;

    const totalSales = sales.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const totalGross = sales.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
    const totalCommission = sales.reduce((acc, curr) => acc + (curr.commission_amount || 0), 0);
    const netEarnings = totalGross - totalCommission;

    const { count } = await supabase
      .from('marketplace_items')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('is_active', true);

    return {
      totalRevenue: netEarnings,
      grossRevenue: totalGross,
      totalSales,
      totalCommission,
      activeListings: count || 0
    };
  } catch (error) {
    logger.error('Error fetching seller stats:', error);
    return { totalRevenue: 0, totalSales: 0, totalCommission: 0, activeListings: 0 };
  }
};

/**
 * Fetch seller's own resources (Plans, Exercises) that can be converted
 * @param {string} sellerId 
 * @param {'plan'|'activity'} type 
 */
export const fetchConvertibleResources = async (sellerId, type) => {
  try {
    if (type === 'plan') {
      const { data, error } = await supabase
        .from('treatment_plans')
        .select('id, name, description, duration_weeks')
        .eq('therapist_id', sellerId)
        .eq('is_template', true)
        .eq('is_archived', false);
      
      if (error) throw error;
      return data || [];
    } else {
      const { data, error } = await supabase
        .from('therapist_exercises')
        .select('id, name, description, category')
        .eq('therapist_id', sellerId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    }
  } catch (error) {
    logger.error(`Error fetching convertible ${type}s:`, error);
    throw error;
  }
};

/**
 * Create or Update a marketplace listing
 */
export const upsertListing = async (listingData, listingId = null) => {
  try {
    if (listingId) {
      const { data, error } = await supabase
        .from('marketplace_items')
        .update({ ...listingData, updated_at: new Date() })
        .eq('id', listingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('marketplace_items')
        .insert([{ ...listingData, created_at: new Date() }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    logger.error('Error saving listing:', error);
    throw error;
  }
};

/**
 * Delete (soft delete) a listing
 */
export const deleteListing = async (listingId) => {
  try {
    const { error } = await supabase
      .from('marketplace_items')
      .update({ is_active: false, updated_at: new Date() })
      .eq('id', listingId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Error deleting listing:', error);
    throw error;
  }
};