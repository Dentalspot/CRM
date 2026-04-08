import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

const MOTIVATIONAL_PHRASES = [
  "Cada día es una oportunidad para hacer la diferencia en la vida de alguien.",
  "Tu dedicación transforma vidas.",
  "El bienestar de tus pacientes comienza con tu pasión.",
  "Hoy es un gran día para ayudar a alguien.",
  "Tu trabajo es invaluable para quienes confían en ti."
];

export default function useTherapistDashboard() {
  const { profile, user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      activePatients: 0,
      todayAppointments: 0,
      monthlyIncome: 0,
      attendanceRate: 0
    },
    upcomingAppointments: [],
    alerts: [],
    motivationalPhrase: MOTIVATIONAL_PHRASES[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const therapistId = profile.id;
      const today = new Date().toISOString().split('T')[0];

      // 1. Obtener pacientes activos (con citas)
      const { data: patientIdsData, error: patientIdsError } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('therapist_id', therapistId);

      if (patientIdsError) throw patientIdsError;

      const activePatients = new Set(patientIdsData?.map(p => p.patient_id)).size;

      // 2. Obtener citas de hoy
      const { count: todayAppointmentsCount, error: todayError } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('therapist_id', therapistId)
        .eq('date', today)
        .eq('status', 'scheduled');

      if (todayError) throw todayError;

      // 3. Obtener próximas citas
      // CORRECCIÓN: Especificar FK explícita para resolver ambigüedad
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          start_time,
          patient:patients!appointments_patient_id_fkey(
            id,
            profile:profiles!patients_profile_id_fkey(full_name)
          ),
          clinic:clinics(id, modality)
        `)
        .eq('therapist_id', therapistId)
        .gte('date', today)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (upcomingError) {
        logger.error("Error fetching upcoming appointments:", upcomingError);
        // No lanzamos error fatal para que el resto del dashboard cargue
      }

      // Mapear los datos para aplanar la estructura
      const formattedUpcoming = upcomingData?.map(apt => ({
        ...apt,
        patient: {
          id: apt.patient?.id,
          full_name: apt.patient?.profile?.full_name || 'Paciente'
        }
      })) || [];

      // 4. Calcular ingresos del mes
      // FK: appointments_service_id_fkey -> therapist_services.id
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      let monthlyIncome = 0;

      try {
        const { data: incomeData, error: incomeError } = await supabase
          .from('appointments')
          .select(`
            service_id,
            service:therapist_services!appointments_service_id_fkey(price_clp)
          `)
          .eq('therapist_id', therapistId)
          .gte('date', startOfMonthStr)
          .in('status', ['completed', 'scheduled']);

        if (!incomeError && incomeData) {
          monthlyIncome = incomeData.reduce((sum, apt) => sum + (apt.service?.price_clp || 0), 0);
        }
      } catch (incomeErr) {
        logger.error('Error calculating income:', incomeErr);
        monthlyIncome = 0;
      }

      // 5. Calcular tasa de asistencia
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('appointments')
        .select('status')
        .eq('therapist_id', therapistId)
        .gte('date', startOfMonthStr)
        .lte('date', today);

      let attendanceRate = 95; // default
      if (!attendanceError && attendanceData?.length > 0) {
        const completed = attendanceData.filter(a => a.status === 'completed').length;
        const total = attendanceData.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status)).length;
        attendanceRate = total > 0 ? Math.round((completed / total) * 100) : 95;
      }

      // 6. Pendientes operativos (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      let pendingActions = { undocumented: [], unpaid: [], noFollowUp: [] };

      try {
        // 6a. Sesiones completadas sin nota clínica
        const { data: completedApts } = await supabase
          .from('appointments')
          .select(`
            id, date, start_time, patient_id,
            patient:patients!appointments_patient_id_fkey(
              id,
              profile:profiles!patients_profile_id_fkey(full_name)
            )
          `)
          .eq('therapist_id', therapistId)
          .eq('status', 'completed')
          .gte('date', thirtyDaysAgoStr)
          .order('date', { ascending: false });

        if (completedApts?.length > 0) {
          const completedIds = completedApts.map(a => a.id);

          // Documentadas
          const { data: documented } = await supabase
            .from('clinical_history')
            .select('appointment_id')
            .in('appointment_id', completedIds);
          const documentedSet = new Set(documented?.map(d => d.appointment_id) || []);

          // Pagadas
          const { data: paid } = await supabase
            .from('patient_payments')
            .select('appointment_id')
            .in('appointment_id', completedIds);
          const paidSet = new Set(paid?.map(p => p.appointment_id) || []);

          pendingActions.undocumented = completedApts
            .filter(a => !documentedSet.has(a.id))
            .slice(0, 10);

          pendingActions.unpaid = completedApts
            .filter(a => !paidSet.has(a.id))
            .slice(0, 10);
        }

        // 6b. Pacientes activos sin próxima cita
        const { data: activePatientsList } = await supabase
          .from('patients')
          .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
          .eq('therapist_id', therapistId)
          .eq('status', 'active');

        if (activePatientsList?.length > 0) {
          const activeIds = activePatientsList.map(p => p.id);
          const { data: futureApts } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('therapist_id', therapistId)
            .in('patient_id', activeIds)
            .gte('date', today)
            .in('status', ['scheduled', 'confirmed']);

          const withFutureApt = new Set(futureApts?.map(a => a.patient_id) || []);
          pendingActions.noFollowUp = activePatientsList
            .filter(p => !withFutureApt.has(p.id))
            .slice(0, 10);
        }
      } catch (pendingErr) {
        logger.error('Error fetching pending actions:', pendingErr);
      }

      const randomPhrase = MOTIVATIONAL_PHRASES[
        Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
      ];

      setDashboardData({
        metrics: {
          activePatients: activePatients || 0,
          todayAppointments: todayAppointmentsCount || 0,
          monthlyIncome,
          attendanceRate
        },
        upcomingAppointments: formattedUpcoming,
        pendingActions,
        motivationalPhrase: randomPhrase
      });

    } catch (err) {
      logger.error('❌ useTherapistDashboard: Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user?.id, profile?.id, fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  };
}