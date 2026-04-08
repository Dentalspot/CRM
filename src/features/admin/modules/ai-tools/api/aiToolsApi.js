import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

export const aiToolsApi = {
  // ============ STATS (real) ============

  fetchUsageStats: apiHandler('aiTools.fetchUsageStats', async () => {
    const [notizRes, templatesRes, chatRes, quotaRes] = await Promise.all([
      supabase.from('notiz_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('generated_templates').select('*', { count: 'exact', head: true }),
      supabase.from('ai_chat_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('ai_usage_quotas').select('calls_used, tokens_used'),
    ]);

    const totalCalls = (quotaRes.data || []).reduce((sum, q) => sum + (q.calls_used || 0), 0);
    const totalTokens = (quotaRes.data || []).reduce((sum, q) => sum + (q.tokens_used || 0), 0);

    return {
      notizSessions: notizRes.count || 0,
      templatesGenerated: templatesRes.count || 0,
      chatSessions: chatRes.count || 0,
      totalUsage: totalCalls,
      totalTokens,
    };
  }, { notizSessions: 0, templatesGenerated: 0, chatSessions: 0, totalUsage: 0, totalTokens: 0 }),

  fetchRecentActivity: apiHandler('aiTools.fetchRecentActivity', async (limit = 10) => {
    const { data } = await supabase
      .from('notiz_sessions')
      .select('id, created_at, therapist_id, status')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }, []),

  // ============ MODELS (real from ai_settings) ============

  fetchModels: apiHandler('aiTools.fetchModels', async () => {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('category', 'models')
      .like('key', 'model.%');
    if (error) throw error;

    // Group by function area and build model objects
    const modelMap = {};
    (data || []).forEach(s => {
      const parts = s.key.replace('model.', '').split('.');
      const area = parts[0]; // notiz, chatbot, templates
      const role = parts.slice(1).join('.'); // analysis, primary, planner, etc.
      if (!modelMap[area]) modelMap[area] = { id: area, models: {} };
      modelMap[area].models[role] = s.value;
    });

    const areaNames = {
      notiz: 'Notiz - Notas Clínicas',
      chatbot: 'Chatbot Asistente',
      templates: 'Generador de Plantillas',
    };

    const models = Object.entries(modelMap).map(([area, info]) => ({
      id: area,
      name: areaNames[area] || area,
      status: 'active',
      provider: 'Multi-modelo',
      models: info.models,
    }));

    return { data: models, count: models.length };
  }, { data: [], count: 0 }),

  // ============ EDGE FUNCTIONS (real from ai_prompt_templates) ============

  fetchEdgeFunctions: apiHandler('aiTools.fetchEdgeFunctions', async () => {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('slug, name, category, model, is_active')
      .eq('is_active', true)
      .order('category');
    if (error) throw error;

    // Group by category → edge function
    const functionMap = {};
    (data || []).forEach(p => {
      const fnName = p.slug.split('.')[0]; // process-notiz, chat-with-ai, etc.
      if (!functionMap[fnName]) {
        functionMap[fnName] = { name: fnName, description: '', models: new Set(), prompts: 0, status: 'deployed' };
      }
      functionMap[fnName].models.add(p.model);
      functionMap[fnName].prompts++;
    });

    const descriptions = {
      'process-notiz': 'Audio → texto → análisis clínico SOAP',
      'chat-with-ai': 'Chatbot pacientes/terapeutas',
      'generate-template': 'Generador de planes terapéuticos',
    };

    return Object.values(functionMap).map(fn => ({
      ...fn,
      description: descriptions[fn.name] || fn.name,
      models: [...fn.models],
    }));
  }, []),

  // ============ INFERENCE (real - calls edge functions) ============

  runInference: apiHandler.mutation('aiTools.runInference', async (functionName, inputData) => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: inputData,
    });
    if (error) throw error;
    return data;
  }),

  // ============ PROMPT TEMPLATES (real CRUD) ============

  fetchPromptTemplates: apiHandler('aiTools.fetchPromptTemplates', async () => {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .order('category', { ascending: true });
    if (error) throw error;
    return data || [];
  }, []),

  savePromptTemplate: apiHandler.mutation('aiTools.savePromptTemplate', async (templateData) => {
    if (templateData.id) {
      const { data, error } = await supabase
        .from('ai_prompt_templates')
        .update({ ...templateData, updated_at: new Date().toISOString() })
        .eq('id', templateData.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .insert(templateData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  deletePromptTemplate: apiHandler.mutation('aiTools.deletePromptTemplate', async (id) => {
    const { error } = await supabase.from('ai_prompt_templates').delete().eq('id', id);
    if (error) throw error;
  }),

  // ============ TASK QUEUE (real) ============

  fetchTrainingJobs: apiHandler('aiTools.fetchTrainingJobs', async (params = {}) => {
    const { page = 0, limit = 20 } = params;
    const { data, count, error } = await supabase
      .from('ai_task_queue')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }, { data: [], count: 0 }),

  // ============ DATASETS (real counts + export) ============

  fetchDatasetStats: apiHandler('aiTools.fetchDatasetStats', async () => {
    const [notiz, history, plans, ados, adir, sensorial, activities, feedback] = await Promise.all([
      supabase.from('notiz_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('clinical_history').select('*', { count: 'exact', head: true }),
      supabase.from('treatment_plans').select('*', { count: 'exact', head: true }),
      supabase.from('ados2_evaluations').select('*', { count: 'exact', head: true }),
      supabase.from('adir_evaluations').select('*', { count: 'exact', head: true }),
      supabase.from('sensorial_evaluations').select('*', { count: 'exact', head: true }),
      supabase.from('session_activities').select('*', { count: 'exact', head: true }),
      supabase.from('ai_feedback').select('*', { count: 'exact', head: true }),
    ]);

    return [
      { name: 'Sesiones Notiz', table: 'notiz_sessions', count: notiz.count || 0, type: 'transcription' },
      { name: 'Historia Clínica', table: 'clinical_history', count: history.count || 0, type: 'clinical_notes' },
      { name: 'Planes de Tratamiento', table: 'treatment_plans', count: plans.count || 0, type: 'plans' },
      { name: 'Evaluaciones ADOS-2', table: 'ados2_evaluations', count: ados.count || 0, type: 'evaluation' },
      { name: 'Evaluaciones ADI-R', table: 'adir_evaluations', count: adir.count || 0, type: 'evaluation' },
      { name: 'Perfil Sensorial', table: 'sensorial_evaluations', count: sensorial.count || 0, type: 'evaluation' },
      { name: 'Actividades de Sesión', table: 'session_activities', count: activities.count || 0, type: 'outcomes' },
      { name: 'Feedback AI', table: 'ai_feedback', count: feedback.count || 0, type: 'feedback' },
    ];
  }, []),

  // ============ SETTINGS (real CRUD) ============

  fetchSettings: apiHandler('aiTools.fetchSettings', async () => {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*');
    if (error) throw error;
    const settings = {};
    (data || []).forEach(s => { settings[s.key] = s.value; });
    return settings;
  }, {}),

  updateSettings: apiHandler.mutation('aiTools.updateSettings', async (key, value) => {
    const { data, error } = await supabase
      .from('ai_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  // ============ EVALUATIONS (real from ai_feedback) ============

  fetchEvaluations: apiHandler('aiTools.fetchEvaluations', async () => {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const accepted = (data || []).filter(f => f.status === 'accepted').length;
    const rejected = (data || []).filter(f => f.status === 'rejected').length;
    const total = data?.length || 0;

    return {
      items: data || [],
      stats: {
        total,
        accepted,
        rejected,
        acceptance_rate: total > 0 ? (accepted / total * 100).toFixed(1) : 0,
      },
    };
  }, { items: [], stats: { total: 0, accepted: 0, rejected: 0, acceptance_rate: 0 } }),
};
