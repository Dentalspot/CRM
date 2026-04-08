import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

export const marketingApi = {
  // ============ CAMPAIGNS (real CRUD) ============

  fetchCampaigns: apiHandler('marketing.fetchCampaigns', async ({ page = 0, limit = 10, status } = {}) => {
    let query = supabase
      .from('marketing_campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  createCampaign: apiHandler.mutation('marketing.createCampaign', async (campaignData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({ ...campaignData, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  updateCampaign: apiHandler.mutation('marketing.updateCampaign', async (id, updates) => {
    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  deleteCampaign: apiHandler.mutation('marketing.deleteCampaign', async (id) => {
    const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
    if (error) throw error;
  }),

  sendCampaign: apiHandler.mutation('marketing.sendCampaign', async (campaignId) => {
    const { data, error } = await supabase.functions.invoke('send-marketing-campaign', {
      body: { campaign_id: campaignId },
    });
    if (error) throw error;
    return data;
  }),

  // ============ TEMPLATES (real from DB) ============

  fetchTemplates: apiHandler('marketing.fetchTemplates', async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('notification_type');
    if (error) throw error;
    return data || [];
  }, []),

  saveTemplate: apiHandler.mutation('marketing.saveTemplate', async (templateData) => {
    if (templateData.id) {
      const { data, error } = await supabase
        .from('email_templates')
        .update({ ...templateData, updated_at: new Date().toISOString() })
        .eq('id', templateData.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from('email_templates')
      .insert(templateData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  // ============ STATS ============

  fetchSubscriberStats: apiHandler('marketing.fetchStats', async () => {
    const [totalRes, therapistsRes, patientsRes, leadsRes, leadsEmailRes, campaignsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }),
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);
    return {
      totalSubscribers: totalRes.count || 0,
      therapists: therapistsRes.count || 0,
      patients: patientsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      leadsWithEmail: leadsEmailRes.count || 0,
      campaigns: campaignsRes.count || 0,
    };
  }, { totalSubscribers: 0, therapists: 0, patients: 0, totalLeads: 0, leadsWithEmail: 0, campaigns: 0 }),

  fetchSubscribers: apiHandler('marketing.fetchSubscribers', async ({ page = 0, limit = 20, segment } = {}) => {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at', { count: 'exact' })
      .not('email', 'is', null)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (segment === 'therapists') query = query.eq('role', 'therapist');
    if (segment === 'patients') query = query.eq('role', 'patient');

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  // ============ SEGMENTS (real counts) ============

  fetchSegments: apiHandler('marketing.fetchSegments', async () => {
    const counts = {};
    const queries = [
      { id: 'all', name: 'Todos los leads', query: supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null) },
      { id: 'supersalud', name: 'Supersalud con email', query: supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('source', 'supersalud').not('email', 'is', null) },
      { id: 'communicare', name: 'Communicare', query: supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('source', 'communicare') },
      { id: 'woocommerce', name: 'WooCommerce', query: supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('source', 'woocommerce') },
      { id: 'doctoralia', name: 'Doctoralia', query: supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('source', 'doctoralia').not('email', 'is', null) },
    ];

    const results = await Promise.all(queries.map(q => q.query));
    return queries.map((q, i) => ({ id: q.id, name: q.name, count: results[i].count || 0 }));
  }, []),

  // ============ RECIPIENT COUNT (for campaign preview) ============

  getRecipientCount: apiHandler('marketing.getRecipientCount', async ({ segment, source_filter, tags_filter } = {}) => {
    let query = supabase
      .from('marketing_leads')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)
      .neq('status', 'unsubscribed');

    if (segment && segment !== 'all') query = query.eq('segment', segment);
    if (source_filter) query = query.eq('source', source_filter);
    if (tags_filter && tags_filter.length > 0) {
      for (const tag of tags_filter) {
        query = query.contains('tags', JSON.stringify([tag]));
      }
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }, 0),

  // ============ EMAIL ANALYTICS ============

  fetchEmailAnalytics: apiHandler('marketing.fetchAnalytics', async () => {
    const [sentRes, campaignRes] = await Promise.all([
      supabase.from('email_notifications').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('marketing_campaigns').select('sent_count, failed_count').eq('status', 'sent'),
    ]);

    const totalSent = (campaignRes.data || []).reduce((sum, c) => sum + (c.sent_count || 0), 0);
    const totalFailed = (campaignRes.data || []).reduce((sum, c) => sum + (c.failed_count || 0), 0);

    return {
      sent: totalSent,
      failed: totalFailed,
      campaigns_sent: campaignRes.data?.length || 0,
      notifications_sent: sentRes.count || 0,
    };
  }, { sent: 0, failed: 0, campaigns_sent: 0, notifications_sent: 0 }),
};
