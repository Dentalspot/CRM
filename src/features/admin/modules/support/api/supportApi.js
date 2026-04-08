import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

const logSupportAction = async (action, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id, action, resource_type: 'support', details
      });
    }
  } catch (err) {
    logger.error('Failed to log support action', err);
  }
};

export const supportApi = {

  searchUsers: apiHandler('searchUsers', async (query) => {
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('role', ['therapist', 'patient'])
      .limit(20);
    if (query?.trim()) q = q.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }, []),

  fetchUserDiagnostic: apiHandler('fetchUserDiagnostic', async (userId) => {
    await logSupportAction('fetch_user_diagnostic', { userId });
    const [userRes, logsRes, subRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('audit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('therapist_subscriptions').select('plan_name, status, current_period_end').eq('therapist_id', userId).maybeSingle()
    ]);
    return {
      user: userRes.data || null,
      logs: logsRes.data || [],
      subscription: subRes.data || null,
      device: {}
    };
  }, null),

  fetchSupportAuditLogs: apiHandler('fetchSupportAuditLogs', async (params = {}) => {
    let q = supabase
      .from('audit_logs')
      .select('*, user:profiles!audit_logs_user_id_fkey(full_name, email)', { count: 'exact' });
    if (params.userId) q = q.eq('user_id', params.userId);
    if (params.action) q = q.eq('action', params.action);
    if (params.dateFrom) q = q.gte('created_at', params.dateFrom);
    const page = params.page || 0;
    const limit = params.limit || 20;
    q = q.order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  fetchDashboardMetrics: apiHandler('fetchDashboardMetrics', async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [auditRes, ticketsRes, incidentsRes] = await Promise.all([
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
      supabase.from('support_incidents').select('*', { count: 'exact', head: true }).neq('status', 'resolved')
    ]);
    return {
      audit_events_24h: auditRes.count || 0,
      open_tickets: ticketsRes.count || 0,
      active_incidents: incidentsRes.count || 0
    };
  }, null),

  fetchTickets: apiHandler('fetchTickets', async (params = {}) => {
    const page = params.page || 0;
    const limit = params.limit || 20;
    let q = supabase
      .from('support_tickets')
      .select('*, user:user_id(full_name, email), assigned:assigned_to(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (params.status) q = q.eq('status', params.status);
    if (params.priority) q = q.eq('priority', params.priority);
    const { data, count, error } = await q;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  fetchTicketById: apiHandler('fetchTicketById', async (ticketId) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, user:user_id(full_name, email, role), assigned:assigned_to(full_name), notes:support_ticket_notes(*, author:author_id(full_name))')
      .eq('id', ticketId)
      .single();
    if (error) throw error;
    return data;
  }, null),

  createTicket: apiHandler.mutation('createTicket', async (ticketData) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  updateTicket: apiHandler.mutation('updateTicket', async (ticketId, updates) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  addNote: apiHandler.mutation('addNote', async (noteData) => {
    const { data, error } = await supabase
      .from('support_ticket_notes')
      .insert(noteData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  fetchIncidents: apiHandler('fetchIncidents', async (params = {}) => {
    const page = params.page || 0;
    const limit = params.limit || 20;
    const { data, count, error } = await supabase
      .from('support_incidents')
      .select('*, creator:created_by(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  fetchIncidentById: apiHandler('fetchIncidentById', async (incidentId) => {
    const { data, error } = await supabase
      .from('support_incidents')
      .select('*, creator:created_by(full_name), notes:support_incident_notes(*, author:author_id(full_name))')
      .eq('id', incidentId)
      .single();
    if (error) throw error;
    return data;
  }, null),

  manageIncident: apiHandler.mutation('manageIncident', async (incidentData) => {
    if (incidentData.id) {
      const { data, error } = await supabase
        .from('support_incidents')
        .update({ ...incidentData, updated_at: new Date().toISOString() })
        .eq('id', incidentData.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from('support_incidents')
      .insert(incidentData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  fetchSystemLogs: apiHandler('fetchSystemLogs', async (params = {}) => {
    const page = params.page || 0;
    const limit = params.limit || 50;
    let q = supabase
      .from('system_logs')
      .select('*, user:user_id(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (params.level) q = q.eq('level', params.level);
    const { data, count, error } = await q;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  fetchLogById: apiHandler('fetchLogById', async (logId) => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*, user:user_id(full_name, email)')
      .eq('id', logId)
      .single();
    if (error) throw error;
    return data;
  }, null),

  fetchSystemHealth: apiHandler('fetchSystemHealth', async () => {
    const [usersRes, subsRes, ticketsRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('therapist_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open')
    ]);
    return {
      total_users: usersRes.count || 0,
      active_subscriptions: subsRes.count || 0,
      open_tickets: ticketsRes.count || 0,
      status: 'operational'
    };
  }, null),

  fetchErrorStats: apiHandler('fetchErrorStats', async (period = '7d') => {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('system_logs')
      .select('level, created_at')
      .in('level', ['error', 'critical'])
      .gte('created_at', since);
    if (error) throw error;
    return { errors: data || [], total: data?.length || 0 };
  }, { errors: [], total: 0 }),

  fetchErrorDetail: apiHandler('fetchErrorDetail', async (errorId) => {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('id', errorId)
      .single();
    if (error) throw error;
    return data;
  }, null),

  performUserAction: apiHandler.mutation('performUserAction', async (userId, actionType) => {
    await logSupportAction('perform_user_action', { userId, actionType });
    if (actionType === 'suspend') {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    }
    if (actionType === 'activate') {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
    }
    return { success: true };
  })
};
