import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

// Max size for direct edge function call (~5MB safe limit)
const DIRECT_UPLOAD_LIMIT = 5 * 1024 * 1024;
// Chunk size for splitting long recordings (~5 min of audio)
const CHUNK_DURATION_MS = 5 * 60 * 1000;

/**
 * Uploads audio file and triggers AI processing.
 * For short recordings (<5MB): sends directly to edge function.
 * For long recordings (>5MB): uploads to Storage, transcribes in chunks.
 */
export const processNotizSession = async (audioBlob, therapistId, patientId, patientContext = '', onProgress = null) => {
  try {
    if (!audioBlob || audioBlob.size < 1000) {
      throw new Error('El audio está vacío o es demasiado corto. Verifica que el micrófono funcione.');
    }

    const mimeType = audioBlob.type || 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    let transcription = '';
    let analysis = null;

    if (audioBlob.size <= DIRECT_UPLOAD_LIMIT) {
      // ===== SHORT AUDIO: Direct to edge function =====
      onProgress?.('Transcribiendo audio...');
      const result = await sendAudioToEdgeFunction(audioBlob, mimeType, ext, patientContext, therapistId, patientId);
      transcription = result.transcription;
      analysis = result.analysis;
    } else {
      // ===== LONG AUDIO: Upload to Storage + transcribe in chunks =====
      onProgress?.('Subiendo audio...');

      // 1. Upload full audio to Supabase Storage
      const storagePath = `notiz/${therapistId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('audio-sessions')
        .upload(storagePath, audioBlob, { contentType: mimeType, upsert: true });

      if (uploadErr) {
        logger.warn('Storage upload failed, trying direct:', uploadErr);
        // Fallback: try direct anyway (might timeout but worth trying)
        const result = await sendAudioToEdgeFunction(audioBlob, mimeType, ext, patientContext, therapistId, patientId);
        transcription = result.transcription;
        analysis = result.analysis;
      } else {
        // 2. Transcribe via storage path (edge function downloads + chunks)
        onProgress?.('Transcribiendo sesión completa...');
        const { data: aiResult, error: fnErr } = await supabase.functions.invoke('process-notiz', {
          body: {
            storagePath,
            patientContext,
            therapist_id: therapistId,
            patient_id: patientId,
            title: `Sesión ${new Date().toLocaleDateString('es-CL')}`,
            longAudio: true,
          },
        });

        if (fnErr) throw fnErr;
        if (aiResult?.error) throw new Error(aiResult.error);

        transcription = aiResult.transcription;
        analysis = aiResult.analysis;

        // 3. Clean up storage (non-critical)
        supabase.storage.from('audio-sessions').remove([storagePath]).catch(() => {});
      }
    }

    // Save to database
    onProgress?.('Guardando nota...');
    const sessionData = {
      therapist_id: therapistId,
      patient_id: patientId || null,
      transcription,
      summary: analysis?.summary || transcription.slice(0, 200),
      key_points: analysis?.key_points || [],
      next_steps: analysis?.next_steps || [],
      extracted_data: {
        soap: analysis?.soap || {},
        smart_objective: analysis?.smart_objective || '',
        diagnosis_observations: analysis?.diagnosis_observations || '',
        symptoms_observed: analysis?.symptoms_observed || [],
        exercises_performed: analysis?.exercises_performed || [],
        patient_progress: analysis?.patient_progress || '',
        recommendations: analysis?.recommendations || [],
      },
      status: 'review',
    };

    const { data: savedSession, error: dbError } = await supabase
      .from('notiz_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (dbError) throw dbError;
    return savedSession;

  } catch (error) {
    logger.error('Error processing Notiz session:', error);
    throw error;
  }
};

/** Send audio directly to edge function (for short recordings) */
async function sendAudioToEdgeFunction(audioBlob, mimeType, ext, patientContext, therapistId, patientId) {
  const formData = new FormData();
  const audioFile = new File([audioBlob], `session_recording.${ext}`, { type: mimeType });
  formData.append('file', audioFile);
  if (patientContext) formData.append('patientContext', patientContext);
  if (therapistId) formData.append('therapist_id', therapistId);
  if (patientId) formData.append('patient_id', patientId);
  formData.append('title', `Sesión ${new Date().toLocaleDateString('es-CL')}`);

  const { data: aiResult, error: functionError } = await supabase.functions.invoke('process-notiz', {
    body: formData,
  });

  if (functionError) throw functionError;
  if (aiResult?.error) {
    const debugInfo = aiResult.debug ? ` [size: ${aiResult.debug.audioSize}, type: ${aiResult.debug.audioType}]` : '';
    throw new Error(aiResult.error + debugInfo);
  }

  return aiResult;
}

/**
 * Updates a draft session
 */
export const updateNotizSession = async (sessionId, updates) => {
  const { data, error } = await supabase
    .from('notiz_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Saves a Notiz session to the official Clinical History
 */
export const saveNotizToClinicalHistory = async (sessionData, clinicalEntryType = 'nota_clinica') => {
  try {
    // 1. Construct the clinical entry payload
    const clinicalData = {
      patient_id: sessionData.patient_id,
      therapist_id: sessionData.therapist_id,
      entry_type: clinicalEntryType,
      entry_date: new Date().toISOString(), // Or the recording date
      summary: sessionData.summary,
      session_notes: (() => {
        const soap = sessionData.extracted_data?.soap || {};
        const smart = sessionData.extracted_data?.smart_objective || '';
        if (soap.subjective || soap.objective || soap.analysis || soap.plan) {
          return `**S — Subjetivo:**
${soap.subjective || 'No reportado'}

**O — Objetivo:**
${soap.objective || 'No observado'}

**A — Análisis:**
${soap.analysis || 'No especificado'}

**P — Plan:**
${soap.plan || 'No especificado'}
${smart ? `\n**Objetivo SMART:**\n${smart}` : ''}

---
**Transcripción:**
${sessionData.transcription}`;
        }
        // Fallback for old format
        return `**Resumen:**
${sessionData.summary}

**Observaciones:**
${sessionData.extracted_data.diagnosis_observations || 'Sin observaciones'}

**Progreso:**
${sessionData.extracted_data.patient_progress || 'No reportado'}

**Recomendaciones:**
${(sessionData.extracted_data.recommendations || []).map(rec => `- ${rec}`).join('\n')}

**Transcripción:**
${sessionData.transcription}`;
      })(),
      details: {
        symptoms: sessionData.extracted_data.symptoms_observed,
        key_points: sessionData.key_points,
        next_steps: sessionData.next_steps,
        source: 'notiz_ai'
      }
    };

    // 2. Insert into clinical_history
    const { data: historyEntry, error: historyError } = await supabase
      .from('clinical_history')
      .insert(clinicalData)
      .select()
      .single();

    if (historyError) throw historyError;

    // 3. Update Notiz session status
    await updateNotizSession(sessionData.id, { status: 'saved' });

    return historyEntry;

  } catch (error) {
    logger.error('Error saving to clinical history:', error);
    throw error;
  }
};

export const getNotizSessions = async (therapistId) => {
  // Corrected query: Join patients first, then profiles
  // notiz_sessions.patient_id -> patients.id -> profiles.id
  const { data, error } = await supabase
    .from('notiz_sessions')
    .select(`
      *,
      patient_record:patients!notiz_sessions_patient_id_fkey (
        profile:profiles (
          full_name
        )
      )
    `)
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map the nested structure to flatten it for the UI
  return data.map(item => ({
    ...item,
    patient: {
      full_name: item.patient_record?.profile?.full_name || 'Paciente'
    }
  }));
};