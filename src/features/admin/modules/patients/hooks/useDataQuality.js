import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useDataQuality = () => {
  const [issues, setIssues] = useState([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const analyze = useCallback(async () => {
    setLoading(true);
    try {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, therapist_id, status, created_at, profile:profiles!patients_profile_id_fkey(full_name, email, rut, gender, birthdate, phone)');

      const found = [];
      let totalChecks = 0;
      let passedChecks = 0;

      (patients || []).forEach(p => {
        const name = p.profile?.full_name || 'ID: ' + p.id.slice(0, 8);
        const checks = [
          { field: 'Nombre', ok: !!p.profile?.full_name },
          { field: 'Email', ok: !!p.profile?.email },
          { field: 'RUT', ok: !!p.profile?.rut },
          { field: 'Género', ok: !!p.profile?.gender },
          { field: 'Fecha nacimiento', ok: !!p.profile?.birthdate },
          { field: 'Teléfono', ok: !!p.profile?.phone },
          { field: 'Terapeuta asignado', ok: !!p.therapist_id },
        ];

        checks.forEach(c => {
          totalChecks++;
          if (c.ok) passedChecks++;
          else {
            found.push({
              patientId: p.id,
              patientName: name,
              field: c.field,
              severity: c.field === 'Nombre' || c.field === 'Email' ? 'high' : 'medium',
            });
          }
        });
      });

      const qualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
      setIssues(found);
      setScore(qualityScore);
    } catch (err) {
      logger.error('Error analyzing data quality:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { analyze(); }, [analyze]);

  return { issues, score, loading, reanalyze: analyze };
};
