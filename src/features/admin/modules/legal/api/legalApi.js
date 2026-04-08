import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const legalApi = {
  // ============ DOCUMENTS ============
  fetchDocuments: async ({ page = 0, limit = 20, type, status, search } = {}) => {
    let query = supabase
      .from('legal_documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  fetchDocumentById: async (id) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*, versions:legal_document_versions(id, version, change_summary, created_at, created_by)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  createDocument: async (doc) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .insert(doc)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateDocument: async (id, updates) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  publishDocument: async (id) => {
    const doc = await legalApi.fetchDocumentById(id);
    // Save current version
    await supabase.from('legal_document_versions').insert({
      document_id: id,
      version: doc.version,
      content: doc.content,
      change_summary: `Publicado v${doc.version}`,
    });
    const { data, error } = await supabase
      .from('legal_documents')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============ POLICIES ============
  fetchPolicies: async ({ page = 0, limit = 20, category, status } = {}) => {
    let query = supabase
      .from('legal_policies')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  fetchPolicyById: async (id) => {
    const { data, error } = await supabase
      .from('legal_policies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  updatePolicy: async (id, updates) => {
    const { data, error } = await supabase
      .from('legal_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  createPolicy: async (policy) => {
    const { data, error } = await supabase
      .from('legal_policies')
      .insert(policy)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ============ SIGNATURES ============
  fetchSignatures: async ({ page = 0, limit = 20, documentId } = {}) => {
    let query = supabase
      .from('legal_signatures')
      .select('*, user:profiles!legal_signatures_user_id_fkey(full_name, email), document:legal_documents(title, type)', { count: 'exact' })
      .order('accepted_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (documentId) query = query.eq('document_id', documentId);
    const { data, count, error } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  // ============ DASHBOARD ============
  fetchDashboardStats: async () => {
    const [docsRes, policiesRes, sigsRes, publishedRes] = await Promise.all([
      supabase.from('legal_documents').select('*', { count: 'exact', head: true }),
      supabase.from('legal_policies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('legal_signatures').select('*', { count: 'exact', head: true }),
      supabase.from('legal_documents').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    return {
      totalDocuments: docsRes.count || 0,
      publishedDocuments: publishedRes.count || 0,
      activePolicies: policiesRes.count || 0,
      totalSignatures: sigsRes.count || 0,
    };
  },

  fetchComplianceMetrics: async () => {
    const [docsRes, publishedRes, policiesRes, activePoliciesRes] = await Promise.all([
      supabase.from('legal_documents').select('*', { count: 'exact', head: true }),
      supabase.from('legal_documents').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('legal_policies').select('*', { count: 'exact', head: true }),
      supabase.from('legal_policies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    const docCompliance = docsRes.count > 0 ? Math.round((publishedRes.count / docsRes.count) * 100) : 0;
    const policyCompliance = policiesRes.count > 0 ? Math.round((activePoliciesRes.count / policiesRes.count) * 100) : 0;

    return { docCompliance, policyCompliance, overall: Math.round((docCompliance + policyCompliance) / 2) };
  },

  // ============ AGREEMENTS (contracts) ============
  fetchAgreements: async ({ page = 0, limit = 20 } = {}) => {
    const { data, count, error } = await supabase
      .from('legal_documents')
      .select('*', { count: 'exact' })
      .eq('type', 'contract')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  fetchAgreementById: async (id) => {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', id)
      .eq('type', 'contract')
      .single();
    if (error) throw error;
    return data;
  },

  // ============ AUDITS ============
  fetchAudits: async ({ page = 0, limit = 20 } = {}) => {
    const { data, count, error } = await supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) {
      logger.warn('Audit logs fetch error:', error);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  },

  // ============ SEARCH ============
  searchLegal: async (query) => {
    if (!query?.trim()) return { documents: [], policies: [] };
    const [docsRes, polRes] = await Promise.all([
      supabase.from('legal_documents').select('id, title, type, status').ilike('title', `%${query}%`).limit(10),
      supabase.from('legal_policies').select('id, title, category, status').ilike('title', `%${query}%`).limit(10),
    ]);
    return { documents: docsRes.data || [], policies: polRes.data || [] };
  },

  // ============ STATS ============
  fetchStats: async () => {
    const [docs, pols, sigs] = await Promise.all([
      supabase.from('legal_documents').select('type, status'),
      supabase.from('legal_policies').select('category, status'),
      supabase.from('legal_signatures').select('*', { count: 'exact', head: true }),
    ]);

    const docsByType = {};
    (docs.data || []).forEach(d => { docsByType[d.type] = (docsByType[d.type] || 0) + 1; });
    const polsByCategory = {};
    (pols.data || []).forEach(p => { polsByCategory[p.category] = (polsByCategory[p.category] || 0) + 1; });

    return {
      docsByType,
      polsByCategory,
      totalSignatures: sigs.count || 0,
      totalDocuments: docs.data?.length || 0,
      totalPolicies: pols.data?.length || 0,
    };
  },

  // ============ RISKS & DISPUTES (no tables yet — return empty) ============
  fetchRisks: async () => ({ data: [], count: 0 }),
  updateRisk: async () => ({ success: false }),
  fetchDisputes: async () => ({ data: [], count: 0 }),
  resolveDispute: async () => ({ success: false }),
  fetchTemplates: async () => ([]),
};
