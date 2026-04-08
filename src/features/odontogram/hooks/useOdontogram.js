import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ADULT_TEETH, CHILD_TEETH, getDefaultToothState } from '@/constants/dentalConstants';
import logger from '@/lib/utils/logger';

/**
 * Hook para manejar el estado del odontograma.
 * Carga, guarda y actualiza datos de dientes para un paciente.
 */
export const useOdontogram = (patientId) => {
  const [teethData, setTeethData] = useState({});
  const [toothType, setToothType] = useState('adult');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [odontogramId, setOdontogramId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Inicializar dientes con estado por defecto
  const initializeTeeth = useCallback((type) => {
    const teeth = type === 'adult' ? ADULT_TEETH : CHILD_TEETH;
    const allTeeth = [...teeth.upperRight, ...teeth.upperLeft, ...teeth.lowerLeft, ...teeth.lowerRight];
    const data = {};
    allTeeth.forEach((tooth) => {
      data[tooth] = getDefaultToothState();
    });
    return data;
  }, []);

  // Cargar odontograma desde Supabase
  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('odontograms')
        .select('*')
        .eq('patient_id', patientId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setOdontogramId(data.id);
        setToothType(data.tooth_type || 'adult');
        setTeethData(data.teeth_data || initializeTeeth(data.tooth_type || 'adult'));
        setLastSaved(data.updated_at);
      } else {
        setTeethData(initializeTeeth('adult'));
      }
    } catch (err) {
      logger.error('[useOdontogram] Error loading:', err);
      setTeethData(initializeTeeth('adult'));
    } finally {
      setLoading(false);
    }
  }, [patientId, initializeTeeth]);

  useEffect(() => {
    load();
  }, [load]);

  // Actualizar una superficie de un diente
  const updateSurface = useCallback((toothNumber, surface, conditionId) => {
    setTeethData((prev) => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        [surface]: conditionId,
      },
    }));
  }, []);

  // Cambiar tipo de denticion
  const changeToothType = useCallback((newType) => {
    setToothType(newType);
    setTeethData(initializeTeeth(newType));
    setOdontogramId(null);
  }, [initializeTeeth]);

  // Guardar en Supabase
  const save = useCallback(async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const payload = {
        patient_id: patientId,
        tooth_type: toothType,
        teeth_data: teethData,
        updated_at: new Date().toISOString(),
      };

      if (odontogramId) {
        const { error } = await supabase
          .from('odontograms')
          .update(payload)
          .eq('id', odontogramId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('odontograms')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setOdontogramId(data.id);
      }
      setLastSaved(new Date().toISOString());
    } catch (err) {
      logger.error('[useOdontogram] Error saving:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [patientId, toothType, teethData, odontogramId]);

  // Resetear todo
  const reset = useCallback(() => {
    setTeethData(initializeTeeth(toothType));
  }, [initializeTeeth, toothType]);

  return {
    teethData,
    toothType,
    loading,
    saving,
    lastSaved,
    updateSurface,
    changeToothType,
    save,
    reset,
    reload: load,
  };
};
