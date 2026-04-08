import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export const usePatientQuestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientId, setPatientId] = useState(null);

  // FK patient_questions.patient_id → profiles.id (NOT patients.id)
  // Usamos user.id directamente porque ES el profile_id
  useEffect(() => {
    if (user?.id) {
      setPatientId(user.id);
    }
  }, [user?.id]);

  // 2. Cargar preguntas usando el patient_id resuelto
  const loadQuestions = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('patient_questions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setQuestions(data || []);
    } catch (e) {
      setError(e.message);
      toast({
        variant: "destructive",
        title: "Error al cargar preguntas",
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 3. Crear pregunta usando patient_id
  const createQuestion = async (newQuestionData) => {
    if (!patientId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se ha podido identificar el perfil de paciente.",
      });
      return null;
    }

    try {
      const payload = {
        ...newQuestionData,
        patient_id: patientId,
        status: 'pending'
      };

      const { data, error: insertError } = await supabase
        .from('patient_questions')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setQuestions(prev => [data, ...prev]);
      toast({
        title: "✅ Pregunta enviada",
        description: "Tu pregunta ha sido enviada con éxito.",
      });
      return data;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error al enviar pregunta",
        description: e.message,
      });
      return null;
    }
  };

  // 4. Eliminar pregunta
  const deleteQuestion = async (questionId) => {
    try {
      const { error: deleteError } = await supabase
        .from('patient_questions')
        .delete()
        .eq('id', questionId)
        .eq('patient_id', patientId);

      if (deleteError) throw deleteError;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      toast({
        title: "🗑️ Pregunta eliminada",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: e.message,
      });
    }
  };

  // 5. Responder / Actualizar pregunta
  const answerQuestion = async (questionId, answerData) => {
    try {
      const { data, error: updateError } = await supabase
        .from('patient_questions')
        .update({ ...answerData, status: 'answered' })
        .eq('id', questionId)
        .select()
        .single();

      if (updateError) throw updateError;

      setQuestions(prev => prev.map(q => q.id === questionId ? data : q));
      toast({
        title: "✅ Pregunta actualizada",
        description: "La respuesta se ha procesado correctamente.",
      });
      return data;
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error al responder",
        description: e.message,
      });
      return null;
    }
  };

  return {
    questions,
    loading,
    error,
    createQuestion,
    deleteQuestion,
    answerQuestion,
    refreshQuestions: loadQuestions,
  };
};