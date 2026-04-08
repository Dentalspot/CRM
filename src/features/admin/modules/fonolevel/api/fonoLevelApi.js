import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

const logAdminAction = async (action, details = {}) => {
  logger.log(`[DentalLevel] ${action}`, details);
};

export const fonoLevelApi = {
  // ============ LEVELS & REPUTATION (existing RPCs) ============

  fetchTherapistLevels: apiHandler('fonoLevel.fetchLevels', async ({ page = 0, limit = 10, filters = {} }) => {
    await logAdminAction('fetch_levels', { page, limit, filters });
    const { data, error } = await supabase.rpc('get_therapist_reputation_overview', {
      p_limit: limit,
      p_offset: page * limit,
      p_min_score: filters.minScore || 0,
      p_badge_level: filters.badgeLevel || null,
    });
    if (error) throw error;
    return { data: data || [], count: data?.length || 0 };
  }, { data: [], count: 0 }),

  fetchTherapistLevelDetail: apiHandler('fonoLevel.fetchDetail', async (therapistId) => {
    const { data, error } = await supabase.rpc('get_therapist_reputation', { p_therapist_id: therapistId });
    if (error) throw error;
    return data;
  }, null),

  // ============ MANUAL OVERRIDES ============

  updateTherapistLevel: apiHandler.mutation('fonoLevel.updateLevel', async (therapistId, newLevel, reason) => {
    const { data, error } = await supabase
      .from('therapist_specialty_badges')
      .update({ badge: newLevel })
      .eq('therapist_id', therapistId)
      .select();
    if (error) throw error;
    await logAdminAction('update_level_manual', { therapistId, newLevel, reason });
    return { success: true };
  }),

  assignBadge: apiHandler.mutation('fonoLevel.assignBadge', async (therapistId, badgeId, reason) => {
    await logAdminAction('assign_badge', { therapistId, badgeId, reason });
    const { error } = await supabase
      .from('therapist_specialty_badges')
      .upsert({
        therapist_id: therapistId,
        specialty: badgeId,
        badge: 'Manual',
        final_score: 50,
        education_score: 0,
        experience_score: 0,
      }, { onConflict: 'therapist_id,specialty' });
    if (error) throw error;
    return { success: true };
  }),

  // ============ AI SCORING (NEW - calls edge function) ============

  recalculateReputation: apiHandler.mutation('fonoLevel.recalculate', async (therapistId = null) => {
    await logAdminAction('recalculate_reputation', { therapistId: therapistId || 'all' });
    const { data, error } = await supabase.functions.invoke('dentallevel-ai-score', {
      body: therapistId ? { therapist_id: therapistId } : { batch: true },
    });
    if (error) throw error;
    return data;
  }),

  // ============ TRAINING DATA (NEW) ============

  exportDataset: apiHandler.mutation('fonoLevel.exportDataset', async (datasetType, limit = 500) => {
    const { data, error } = await supabase.functions.invoke('prepare-training-data', {
      body: { dataset_type: datasetType, limit },
    });
    if (error) throw error;
    return data;
  }),

  // ============ EMBEDDINGS (NEW) ============

  generateEmbeddings: apiHandler.mutation('fonoLevel.generateEmbeddings', async (sourceTable = 'marketplace_items', batchSize = 10) => {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { source_table: sourceTable, batch_size: batchSize },
    });
    if (error) throw error;
    return data;
  }),

  // ============ CONFIG (real from ai_settings) ============

  fetchLevelSystemConfig: apiHandler('fonoLevel.fetchConfig', async () => {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('*')
      .like('key', 'dentallevel_%');
    if (error) throw error;
    const config = {};
    (data || []).forEach(s => { config[s.key] = s.value; });
    return {
      ...config,
      levels: [
        { min: 90, name: 'Experto DentalSpot', emoji: '🟣', color: 'purple' },
        { min: 75, name: 'Alta experiencia clinica', emoji: '🔵', color: 'blue' },
        { min: 50, name: 'Profesional con experiencia', emoji: '🟠', color: 'orange' },
        { min: 25, name: 'Experiencia basica', emoji: '🟡', color: 'yellow' },
        { min: 1, name: 'En formacion', emoji: '🔹', color: 'gray' },
        { min: 0, name: 'Sin nivel', emoji: '⬜', color: 'none' },
      ],
      weights: { education: 0.4, experience: 0.6 },
      ai_adjustment_range: { min: -15, max: 15 },
    };
  }, { levels: [], weights: {}, ai_adjustment_range: {} }),

  // ============ TASK QUEUE (for batch operations) ============

  fetchAiTasks: apiHandler('fonoLevel.fetchTasks', async (taskType = null) => {
    let query = supabase
      .from('ai_task_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (taskType) query = query.eq('task_type', taskType);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, []),

  queueBatchScoring: apiHandler.mutation('fonoLevel.queueBatch', async (therapistIds) => {
    const inserts = therapistIds.map(id => ({
      task_type: 'dentallevel_score',
      input_data: { therapist_id: id },
      status: 'pending',
    }));
    const { error } = await supabase.from('ai_task_queue').insert(inserts);
    if (error) throw error;
    // Trigger processing
    const { data } = await supabase.functions.invoke('dentallevel-ai-score', { body: { batch: true } });
    return data;
  }),
};
