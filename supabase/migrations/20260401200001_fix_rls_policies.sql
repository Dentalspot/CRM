-- =============================================================================
-- FIX: Policies que fallaron por columnas incorrectas
-- =============================================================================

-- ai_chat_messages: ai_chat_sessions tiene therapist_id y patient_id, no user_id
-- Fix: acceso via session ownership
DROP POLICY IF EXISTS "Users read own ai_chat_messages" ON ai_chat_messages;
CREATE POLICY "Users read own ai_chat_messages" ON ai_chat_messages FOR SELECT
  USING (session_id IN (
    SELECT id FROM ai_chat_sessions
    WHERE therapist_id = auth.uid() OR patient_id = auth.uid()
  ));

-- ai_conversation_analysis: same fix
DROP POLICY IF EXISTS "Users read own ai_conversation_analysis" ON ai_conversation_analysis;
CREATE POLICY "Users read own ai_conversation_analysis" ON ai_conversation_analysis FOR SELECT
  USING (session_id IN (
    SELECT id FROM ai_chat_sessions
    WHERE therapist_id = auth.uid() OR patient_id = auth.uid()
  ));

-- patient_development_areas: es tabla de referencia (no tiene patient_id)
-- Borrar policies fallidas y crear lectura publica
DROP POLICY IF EXISTS "Therapists manage patient_development_areas" ON patient_development_areas;
DROP POLICY IF EXISTS "Patients read own patient_development_areas" ON patient_development_areas;
CREATE POLICY "Public read patient_development_areas" ON patient_development_areas FOR SELECT USING (true);
CREATE POLICY "Admin manage patient_development_areas" ON patient_development_areas FOR ALL USING (is_admin());
