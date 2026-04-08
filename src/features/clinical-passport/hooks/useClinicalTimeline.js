import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { buildTimeline, groupByMonth, getTimelineStats } from '../utils/timelineBuilder';

const useClinicalTimeline = ({ patientId, profileId, isPatientView = false, therapistId = null }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, session, diagnosis, plan, etc.

  const loadTimeline = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch from all clinical tables
      const [
        appointmentsRes,
        clinicalHistoryRes,
        diagnosesRes,
        plansRes,
        progressRes,
        notizRes,
        ados2Res,
        adirRes,
        sensorialRes,
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, date, status, notes, therapist_id, service_id')
          .eq('patient_id', patientId)
          .lte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: false }),

        supabase
          .from('clinical_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabase
          .from('patient_diagnoses')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabase
          .from('patient_assigned_plans')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabase
          .from('progress_reports')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabase
          .from('notiz_sessions')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabase
          .from('ados2_evaluations')
          .select('id, fecha_evaluacion, module, rango_preocupacion, status, therapist_id')
          .eq('patient_id', patientId)
          .in('status', ['completada', 'revisada'])
          .order('fecha_evaluacion', { ascending: false }),

        supabase
          .from('adir_evaluations')
          .select('id, fecha_evaluacion, clasificacion, status, therapist_id')
          .eq('patient_id', patientId)
          .in('status', ['completada', 'revisada'])
          .order('fecha_evaluacion', { ascending: false }),

        supabase
          .from('sensorial_evaluations')
          .select('id, fecha_evaluacion, overall_classification, status, therapist_id')
          .eq('patient_id', patientId)
          .in('status', ['completada', 'revisada'])
          .order('fecha_evaluacion', { ascending: false }),
      ]);

      // Build therapist name map
      const allTherapistIds = new Set();
      [appointmentsRes.data, clinicalHistoryRes.data, diagnosesRes.data, plansRes.data, progressRes.data, notizRes.data, ados2Res.data, adirRes.data, sensorialRes.data]
        .forEach(arr => (arr || []).forEach(r => { if (r.therapist_id) allTherapistIds.add(r.therapist_id); }));

      const therapistMap = {};
      if (allTherapistIds.size > 0) {
        const { data: therapists } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', [...allTherapistIds]);
        (therapists || []).forEach(t => { therapistMap[t.id] = t.full_name; });
      }

      const timeline = buildTimeline({
        appointments: appointmentsRes.data || [],
        clinicalHistory: clinicalHistoryRes.data || [],
        diagnoses: diagnosesRes.data || [],
        plans: plansRes.data || [],
        progressReports: progressRes.data || [],
        notizSessions: notizRes.data || [],
        ados2Evaluations: ados2Res.data || [],
        adirEvaluations: adirRes.data || [],
        sensorialEvaluations: sensorialRes.data || [],
        therapistMap,
        isPatientView,
      });

      // If therapistId is provided, only show events from that therapist
      const filteredTimeline = therapistId
        ? timeline.filter(e => e.therapistId === therapistId)
        : timeline;

      setEvents(filteredTimeline);
      setGrouped(groupByMonth(filteredTimeline));
      setStats(getTimelineStats(filteredTimeline));
    } catch (err) {
      logger.error('Timeline error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, isPatientView, therapistId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Filtered events
  const filteredGrouped = filter === 'all'
    ? grouped
    : grouped.map(g => ({
        ...g,
        events: g.events.filter(e => e.type === filter),
      })).filter(g => g.events.length > 0);

  return {
    loading,
    events,
    grouped: filteredGrouped,
    stats,
    error,
    filter,
    setFilter,
    refresh: loadTimeline,
  };
};

export default useClinicalTimeline;