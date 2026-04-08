import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const generateTemplate = async (params) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-template', {
      body: params
    });

    if (error) throw error;
    return data.content;
  } catch (error) {
    logger.error('Error generating template:', error);
    throw error;
  }
};

export const saveGeneratedTemplate = async (templateData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('generated_templates')
      .insert({
        ...templateData,
        therapist_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error saving template:', error);
    throw error;
  }
};

/** Update an existing generated_template (for rename/replace) */
export const updateGeneratedTemplate = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('generated_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error updating template:', error);
    throw error;
  }
};

/** Delete a generated_template by ID */
export const deleteGeneratedTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('generated_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logger.error('Error deleting template:', error);
    throw error;
  }
};

export const getGeneratedTemplates = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('generated_templates')
      .select('*')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching templates:', error);
    throw error;
  }
};

/**
 * Save AI-generated content as a therapy template in treatment_plans
 * (appears in "Mis Plantillas" in patient file → Planificar tab)
 */
export const saveAsTherapyTemplate = async (generatedContent, formData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Parse duration string to weeks (e.g. "8-12 semanas" → 10, "4 semanas" → 4)
    const parseDuration = (str) => {
      if (!str) return 8;
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1]) : 8;
    };

    // Build specific_objectives JSONB from plan_sesiones or actividades
    let specificObjectives = [];
    if (generatedContent.plan_sesiones?.length) {
      specificObjectives = generatedContent.plan_sesiones.map((s, i) => ({
        id: crypto.randomUUID(),
        name: s.objetivo_sesion || `Sesión ${s.sesion || i + 1}`,
        activities: (s.actividades || []).map(a => ({
          id: crypto.randomUUID(),
          name: a.nombre,
          description: a.descripcion_paso_a_paso?.join('\n') || a.descripcion || '',
          duration_minutes: a.duracion_minutos || 15,
          materials: a.materiales || [],
        })),
      }));
    } else if (generatedContent.actividades?.length) {
      specificObjectives = [{
        id: crypto.randomUUID(),
        name: generatedContent.objetivo_general || 'Objetivo principal',
        activities: generatedContent.actividades.map(a => ({
          id: crypto.randomUUID(),
          name: a.nombre,
          description: a.descripcion || '',
          duration_minutes: 15,
          materials: a.materiales || [],
        })),
      }];
    }

    const template = {
      therapist_id: user.id,
      name: generatedContent.titulo || `${formData.templateType}: ${formData.diagnosis}`,
      description: generatedContent.objetivo_general || '',
      is_template: true,
      general_objective: generatedContent.objetivo_general || '',
      specific_objectives: specificObjectives,
      duration_weeks: parseDuration(generatedContent.duracion_total_plan || generatedContent.duracion_plan),
      recommended_sessions: generatedContent.plan_sesiones?.length || 8,
      session_duration_minutes: 45,
      target_diagnosis: formData.diagnosis || '',
      target_population: formData.patientAge ? `${formData.patientAge} años` : null,
      is_active: true,
      is_archived: false,
    };

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error saving as therapy template:', error);
    throw error;
  }
};

export const publishTemplateToMarketplace = async (template, price = 0) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // First save as treatment_plans template if not already
    let planTemplateId = null;
    try {
      const tpResult = await saveAsTherapyTemplate(
        template.generated_content || {},
        {
          templateType: template.template_type,
          diagnosis: template.patient_info?.diagnosis || '',
          patientAge: template.patient_info?.age || '',
        }
      );
      planTemplateId = tpResult?.id;
    } catch (e) {
      logger.warn('Could not create treatment_plan (non-critical):', e);
    }

    // item_type must be one of: product, plan, evaluation, material, course
    const typeMap = {
      'Plan de Tratamiento': 'plan',
      'Ejercicio Terapéutico': 'material',
      'Protocolo de Evaluación': 'evaluation',
    };

    const marketplaceItem = {
      seller_id: user.id,
      item_type: typeMap[template.template_type] || 'material',
      title: template.title || 'Plantilla Generada con IA',
      description: `Plantilla generada con IA basada en evidencia PubMed para ${template.patient_info?.diagnosis || 'uso general'}.`,
      price: price || 0,
      currency: 'CLP',
      is_active: false,
      is_approved: false,
      preview_content: { content: template.generated_content },
      category: template.template_type,
      ...(planTemplateId ? { plan_template_id: planTemplateId } : {}),
    };

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert(marketplaceItem)
      .select()
      .single();

    if (error) throw error;

    // Update status in generated_templates
    if (template.id) {
      await supabase
        .from('generated_templates')
        .update({ status: 'published' })
        .eq('id', template.id);
    }

    return data;
  } catch (error) {
    logger.error('Error publishing template:', error);
    throw error;
  }
};
