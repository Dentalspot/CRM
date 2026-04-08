import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { createPreference } from '@/api/mercadoPagoApi';

// ============================================================
// DENTALSPOT Marketplace API v2
// ============================================================
// Fuente de verdad: marketplace_plans (catálogo)
// Compras: marketplace_purchases (biblioteca del comprador)
// Reviews: marketplace_reviews (37 columnas de reviews reales)
//
// MIGRACIÓN: Este archivo REEMPLAZA marketplaceApi.js
// El frontend anterior leía de marketplace_items (tabla legacy).
// marketplace_items se sigue creando por compatibilidad al publicar
// (ver TreatmentPlanBuilderModal.jsx), pero la lectura ahora es
// desde marketplace_plans que tiene 40+ columnas de data rica.
// ============================================================

// ── CATÁLOGO (marketplace_plans) ──

/**
 * Fetch planes/recursos publicados del marketplace.
 * Lee de marketplace_plans con toda su riqueza de datos.
 */
export const fetchMarketplacePlans = async (filters = {}) => {
  try {
    let query = supabase
      .from('marketplace_plans')
      .select(`
        id,
        name,
        slug,
        description,
        long_description,
        author_id,
        author_name,
        author_credentials,
        target_diagnosis,
        target_age_min,
        target_age_max,
        duration_weeks,
        total_sessions,
        total_activities,
        objectives_preview,
        cover_image_url,
        preview_video_url,
        sample_pdf_url,
        price_clp,
        price_usd,
        is_free,
        discount_percentage,
        discount_valid_until,
        is_featured,
        view_count,
        purchase_count,
        average_rating,
        review_count,
        tags,
        language,
        status,
        published_at,
        created_at
      `)
      .eq('status', 'published');

    // Search
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`
      );
    }

    // Diagnosis filter (overlap with ARRAY column)
    if (filters.diagnosis) {
      query = query.contains('target_diagnosis', [filters.diagnosis]);
    }

    // Age range filter
    if (filters.ageMin !== undefined) {
      query = query.lte('target_age_min', filters.ageMin);
    }
    if (filters.ageMax !== undefined) {
      query = query.gte('target_age_max', filters.ageMax);
    }

    // Price range
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      query = query.gte('price_clp', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price_clp', filters.maxPrice);
    }

    // Free only
    if (filters.freeOnly) {
      query = query.eq('is_free', true);
    }

    // Featured only
    if (filters.featuredOnly) {
      query = query.eq('is_featured', true);
    }

    // Sort
    const sortOption = filters.sort || 'newest';
    switch (sortOption) {
      case 'popular':
        query = query.order('purchase_count', { ascending: false });
        break;
      case 'highest_rated':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'lowest_price':
        query = query.order('price_clp', { ascending: true });
        break;
      case 'highest_price':
        query = query.order('price_clp', { ascending: false });
        break;
      case 'most_reviewed':
        query = query.order('review_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('published_at', { ascending: false, nullsFirst: false });
        break;
    }

    // Pagination
    const page = filters.page || 0;
    const pageSize = filters.pageSize || 12;
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    // Also fetch purchasable treatment_plans
    let treatmentPlans = [];
    try {
      let tpQuery = supabase
        .from('treatment_plans')
        .select('id, name, description, duration_weeks, number_of_sessions, target_diagnosis, target_population, plan_type, therapist_id, created_at, is_purchasable, marketplace_item_id')
        .eq('is_purchasable', true)
        .eq('is_active', true)
        .eq('is_template', true);

      if (filters.search) {
        tpQuery = tpQuery.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: tpData } = await tpQuery.order('created_at', { ascending: false }).limit(20);

      // Format as marketplace-plan-like objects (only those not already in marketplace_plans)
      const existingIds = new Set((data || []).map(p => p.id));
      treatmentPlans = (tpData || [])
        .filter(tp => !existingIds.has(tp.marketplace_item_id))
        .map(tp => ({
          id: `tp-${tp.id}`,
          tp_id: tp.id,
          name: tp.name,
          description: tp.description,
          author_name: 'DentalSpot',
          duration_weeks: tp.duration_weeks,
          total_sessions: tp.number_of_sessions,
          target_diagnosis: tp.target_diagnosis ? [tp.target_diagnosis] : [],
          target_population: tp.target_population,
          price_clp: 0,
          is_free: true,
          cover_image_url: null,
          average_rating: null,
          review_count: 0,
          purchase_count: 0,
          tags: [tp.plan_type, tp.target_diagnosis].filter(Boolean),
          status: 'published',
          published_at: tp.created_at,
          is_treatment_plan: true,
        }));
    } catch (tpErr) {
      logger.warn('Error fetching purchasable treatment_plans:', tpErr);
    }

    return {
      data: [...(data || []), ...treatmentPlans],
      hasMore: (data || []).length >= pageSize,
    };
  } catch (error) {
    logger.error('Error fetching marketplace plans:', error);
    throw new Error('Error al cargar los recursos del marketplace.');
  }
};

/**
 * Fetch un plan por ID o slug.
 */
export const fetchMarketplacePlanBySlug = async (slugOrId) => {
  try {
    // Intenta por slug primero, luego por id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(slugOrId);

    let query = supabase
      .from('marketplace_plans')
      .select('*');

    if (isUUID) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.single();
    if (error) throw error;

    return data;
  } catch (error) {
    logger.error('Error fetching plan detail:', error);
    throw new Error('No se pudo cargar el detalle del recurso.');
  }
};

/**
 * Fetch planes relacionados por diagnóstico o tags.
 */
export const fetchRelatedPlans = async (currentPlanId, targetDiagnosis = [], tags = []) => {
  try {
    let query = supabase
      .from('marketplace_plans')
      .select('id, name, slug, price_clp, is_free, cover_image_url, average_rating, review_count, author_name, duration_weeks')
      .eq('status', 'published')
      .neq('id', currentPlanId)
      .limit(4);

    // Prefer same diagnosis
    if (targetDiagnosis && targetDiagnosis.length > 0) {
      query = query.overlaps('target_diagnosis', targetDiagnosis);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching related plans:', error);
    return [];
  }
};

/**
 * Incrementar view_count de un plan.
 */
export const incrementPlanViewCount = async (planId) => {
  try {
    await supabase.rpc('increment_marketplace_plan_views', { p_plan_id: planId });
  } catch (e) {
    // Silently fail — no-critical
    // Fallback: direct update
    await supabase
      .from('marketplace_plans')
      .update({ view_count: supabase.raw('view_count + 1') })
      .eq('id', planId)
      .catch(() => {});
  }
};


// ── COMPRAS (marketplace_purchases) ──

/**
 * Verificar si el usuario ya compró un plan.
 */
export const checkPurchaseStatus = async (userId, planId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_purchases')
      .select('id, payment_status, cloned_plan_id')
      .eq('buyer_id', userId)
      .eq('marketplace_plan_id', planId)
      .eq('payment_status', 'completed')
      .maybeSingle();

    if (error) throw error;
    return { hasPurchased: !!data, purchase: data };
  } catch (error) {
    logger.error('Error checking purchase:', error);
    return { hasPurchased: false, purchase: null };
  }
};

/**
 * Fetch "Mis Planificaciones" — planes propios + comprados en marketplace.
 */
export const fetchMyPurchases = async (userId) => {
  try {
    // 1. Marketplace purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('marketplace_purchases')
      .select(`
        id, marketplace_plan_id, price_paid, currency, payment_status,
        license_type, cloned_plan_id, created_at, completed_at,
        plan:marketplace_plans!marketplace_plan_id (
          id, name, slug, description, author_id, author_name, cover_image_url,
          duration_weeks, total_sessions, total_activities, target_diagnosis,
          target_age_min, target_age_max, average_rating, review_count,
          price_clp, is_free, tags
        )
      `)
      .eq('buyer_id', userId)
      .eq('payment_status', 'completed')
      .order('completed_at', { ascending: false });

    if (purchaseError) logger.warn('Error fetching purchases:', purchaseError);

    // 2. Own treatment plans (templates)
    const { data: ownPlans, error: ownError } = await supabase
      .from('treatment_plans')
      .select('*')
      .eq('therapist_id', userId)
      .eq('is_template', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (ownError) logger.warn('Error fetching own plans:', ownError);

    // Format own plans as purchase-like objects
    const ownFormatted = (ownPlans || []).map(tp => ({
      id: `own-${tp.id}`,
      own_plan_id: tp.id,
      is_own: true,
      is_purchasable: tp.is_purchasable || false,
      marketplace_item_id: tp.marketplace_item_id || null,
      created_at: tp.created_at,
      completed_at: tp.created_at,
      cloned_plan_id: tp.id,
      plan: {
        id: tp.id,
        name: tp.name,
        description: tp.description,
        duration_weeks: tp.duration_weeks,
        total_sessions: tp.number_of_sessions,
        target_diagnosis: tp.target_diagnosis ? [tp.target_diagnosis] : [],
        target_age_min: null,
        target_age_max: null,
        is_free: true,
        tags: [tp.plan_type, tp.diagnosis_scope].filter(Boolean),
      },
    }));

    return [...ownFormatted, ...(purchases || [])];
  } catch (error) {
    logger.error('Error fetching planifications:', error);
    throw new Error('Error al cargar tus planificaciones.');
  }
};

/**
 * Crear registro de compra en marketplace_purchases.
 * Para compras gratuitas se completa inmediatamente.
 * Para pagadas, se crea pending y se completa via webhook.
 */
export const createMarketplacePurchase = async (userId, plan, paymentMethod = 'free') => {
  try {
    const { data, error } = await supabase
      .from('marketplace_purchases')
      .insert({
        buyer_id: userId,
        marketplace_plan_id: plan.id,
        price_paid: plan.is_free ? 0 : plan.price_clp,
        currency: 'CLP',
        payment_status: plan.is_free ? 'completed' : 'pending',
        payment_method: paymentMethod,
        license_type: 'personal',
        completed_at: plan.is_free ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Si es gratis, intentar clonar el plan al usuario
    if (plan.is_free && data) {
      await supabase
        .rpc('process_completed_order', { order_id: data.id })
        .catch((e) => logger.warn('Clone RPC not found or failed:', e));
    }

    return data;
  } catch (error) {
    logger.error('Error creating purchase:', error);
    throw new Error('Error al procesar la compra.');
  }
};

/**
 * Iniciar compra con MercadoPago.
 * Crea marketplace_purchases (pending) + MercadoPago preference.
 */
export const purchaseWithMercadoPago = async (userId, plan, userEmail) => {
  try {
    if (!userEmail) {
      throw new Error('Se requiere un email válido para procesar el pago.');
    }

    const baseUrl = window.location.origin;

    // 1. Crear purchase pending
    const purchase = await createMarketplacePurchase(userId, plan, 'mercadopago');

    // 2. También crear en marketplace_orders para compatibilidad
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        buyer_id: userId,
        total_amount: plan.price_clp,
        currency: 'CLP',
        status: 'pending',
        payment_method: 'mercadopago',
        notes: `Compra de ${plan.name}`,
      })
      .select()
      .single();

    if (orderError) logger.warn('Compat order creation failed:', orderError);

    // 3. Crear MercadoPago preference
    const preferenceData = await createPreference({
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: plan.description ? plan.description.substring(0, 255) : `Compra de ${plan.name}`,
          picture_url: plan.cover_image_url,
          quantity: 1,
          unit_price: Number(plan.price_clp),
          currency_id: 'CLP',
        },
      ],
      payer: { email: userEmail },
      metadata: {
        user_id: userId,
        marketplace_plan_id: plan.id,
        purchase_id: purchase.id,
        order_id: order?.id,
        type: 'marketplace_plan',
      },
      backUrls: {
        success: `${baseUrl}/dashboard/marketplace/purchase-success?status=approved&purchase_id=${purchase.id}`,
        failure: `${baseUrl}/dashboard/marketplace/purchase-success?status=failure&purchase_id=${purchase.id}`,
        pending: `${baseUrl}/dashboard/marketplace/purchase-success?status=pending&purchase_id=${purchase.id}`,
      },
    });

    return preferenceData;
  } catch (error) {
    logger.error('Error initiating MercadoPago purchase:', error);
    throw new Error('No se pudo iniciar el proceso de pago.');
  }
};


// ── REVIEWS (marketplace_reviews) ──

/**
 * Fetch reviews de un plan con datos ricos.
 */
export const fetchPlanReviews = async (planId, limit = 5) => {
  try {
    // marketplace_reviews usa marketplace_item_id,
    // necesitamos mapear plan → item si aún hay esa FK.
    // Por ahora consultamos directo si existe FK a plan.
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select(`
        id,
        rating,
        title,
        content,
        pros,
        cons,
        is_verified_purchase,
        helpful_count,
        not_helpful_count,
        rating_quality,
        rating_value,
        rating_ease_of_use,
        rating_effectiveness,
        patient_age_range,
        diagnosis_used_for,
        sessions_completed,
        would_recommend,
        author_response,
        author_responded_at,
        created_at,
        reviewer:reviewer_id (
          full_name
        )
      `)
      .eq('marketplace_item_id', planId)
      .eq('is_visible', true)
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('helpful_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return [];
  }
};


// ── FAVORITOS ──

/**
 * Toggle favorito. Necesita tabla marketplace_favorites.
 * Si no existe, crear con:
 * CREATE TABLE marketplace_favorites (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id UUID NOT NULL REFERENCES profiles(id),
 *   marketplace_plan_id UUID NOT NULL REFERENCES marketplace_plans(id),
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(user_id, marketplace_plan_id)
 * );
 */
export const toggleFavorite = async (userId, planId) => {
  try {
    // Check if exists
    const { data: existing } = await supabase
      .from('marketplace_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('marketplace_plan_id', planId)
      .maybeSingle();

    if (existing) {
      await supabase.from('marketplace_favorites').delete().eq('id', existing.id);
      return false; // unfavorited
    } else {
      await supabase.from('marketplace_favorites').insert({
        user_id: userId,
        marketplace_plan_id: planId,
      });
      return true; // favorited
    }
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    // Table might not exist yet — fail silently
    return null;
  }
};

/**
 * Fetch IDs de favoritos del usuario.
 */
export const fetchUserFavoriteIds = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_favorites')
      .select('marketplace_plan_id')
      .eq('user_id', userId);

    if (error) throw error;
    return new Set((data || []).map((f) => f.marketplace_plan_id));
  } catch (error) {
    // Table might not exist
    return new Set();
  }
};


// ── PATIENTS (para asignación) ──

/**
 * Fetch pacientes activos del terapeuta.
 */
export const fetchTherapistPatients = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        attention_type,
        status,
        profile:profiles!patients_profile_id_fkey (
          full_name
        )
      `)
      .eq('therapist_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((p) => ({
      id: p.id,
      full_name: p.profile?.full_name || 'Paciente sin nombre',
      attention_type: p.attention_type,
    }));
  } catch (error) {
    logger.error('Error fetching patients:', error);
    throw new Error('Error al cargar pacientes.');
  }
};
