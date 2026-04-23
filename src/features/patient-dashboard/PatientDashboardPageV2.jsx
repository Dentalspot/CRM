import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import RescheduleModal from '@/features/patient-agenda/components/RescheduleModal';

import {
  NextSessionHero,
  MicroProgress,
  RecentDocuments,
  MyQuestionsBlock,
  SupportBlock,
  TreatmentStatusBadge,
} from './components';
import MyCareTeam from './components/MyCareTeam';
import PendingReferrals from './components/PendingReferrals';
import { acceptReferral, rejectReferral } from '@/features/referrals/api/referralsApi';

import FloatingAssistant from '@/features/chatbot/components/FloatingAssistant';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import logger from '@/lib/utils/logger';

const PatientDashboardPageV2 = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'Paciente';

  // =====================================================
  // STATES
  // =====================================================
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      setShowWelcome(true);
    }
  }, [profile]);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [careTeam, setCareTeam] = useState([]);
  const [lastSessionDate, setLastSessionDate] = useState(null);

  // Referrals
  const [pendingReferrals, setPendingReferrals] = useState([]);

  // Questions
  const [questionsPending, setQuestionsPending] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  
  // Progress
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sessionsTotal, setSessionsTotal] = useState(0);

  // =====================================================
  // DATA LOADING
  // =====================================================
  useEffect(() => {
    if (user?.id) loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Patient record
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, therapist_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (patientError) logger.warn('Patient record warning:', patientError);
      if (!patientData) {
        setLoading(false);
        return;
      }

      setPatientId(patientData.id);

      // Run all queries in parallel
      await Promise.all([
        loadCareTeam(patientData.id),
        loadAppointments(patientData.id),
        loadDocuments(patientData.id),
        loadProgressData(patientData.id),
        loadLastSession(patientData.id),
        loadQuestionCounts(),
        loadPendingReferrals(patientData.id),
      ]);
    } catch (error) {
      logger.error('Error loading dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información',
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Care Team ----------
  const loadCareTeam = async (pId) => {
    const { data, error } = await supabase
      .from('patient_care_team')
      .select(`
        id, role, specialty, is_active,
        dentist:profiles!patient_care_team_dentist_id_fkey(
          id, full_name, email, phone,
          therapist_branding(avatar_url)
        )
      `)
      .eq('patient_id', pId)
      .eq('is_active', true)
      .order('role');

    if (error) {
      logger.warn('Care team fetch warning:', error);
      return;
    }

    setCareTeam(data || []);
  };

  // ---------- Appointments ----------
  const loadAppointments = async (pId) => {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        therapist:profiles!appointments_therapist_id_fkey(full_name)
      `)
      .eq('patient_id', pId)
      .gte('date', today)
      .in('status', ['scheduled'])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5);

    setAppointments(data || []);
  };

  // ---------- Documents ----------
  const loadDocuments = async (pId) => {
    // Fetch from both clinical_reports AND clinical_history (informe entries)
    const [reportsRes, informesRes] = await Promise.all([
      supabase
        .from('clinical_reports')
        .select('id, file_url:final_pdf_url, created_at, report_type')
        .eq('patient_id', pId)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('clinical_history')
        .select('id, summary, session_notes, entry_date, created_at, details, entry_type')
        .eq('patient_id', pId)
        .eq('visibility', 'all')
        .in('entry_type', ['informe', 'informe_clinico'])
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const reports = (reportsRes.data || []).map(r => ({
      ...r,
      title: r.report_type || 'Documento',
    }));

    const informes = (informesRes.data || []).map(r => ({
      id: `ch-${r.id}`,
      title: r.summary || 'Informe clínico',
      created_at: r.entry_date || r.created_at,
      entry_type: r.entry_type,
      details: r.details,
      _isFromClinicalHistory: true,
    }));

    // Merge and sort by date, take top 3
    const all = [...reports, ...informes]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 3);

    setDocuments(all);
  };

  // ---------- Progress (autocalculado) ----------
  const loadProgressData = async (pId) => {
    // Sesiones totales y completadas
    const { data: allApts } = await supabase
      .from('appointments')
      .select('id, status, date')
      .eq('patient_id', pId)
      .in('status', ['scheduled', 'completed']);

    if (allApts) {
      const completed = allApts.filter((a) => a.status === 'completed').length;
      setSessionsCompleted(completed);
      setSessionsTotal(allApts.length);
    }
  };
// ---------- Question counts ----------
  const loadQuestionCounts = async () => {
    try {
      // FK patient_questions.patient_id → profiles.id
      const { data, error } = await supabase
        .from('patient_questions')
        .select('id, status')
        .eq('patient_id', user.id);

      if (!error && data) {
        setQuestionsPending(data.filter((q) => q.status === 'pending').length);
        setQuestionsAnswered(data.filter((q) => q.status === 'answered' || q.status === 'published').length);
      }
    } catch (err) {
      logger.warn('patient_questions query failed:', err.message);
    }
  };

  // ---------- Pending referrals ----------
  const loadPendingReferrals = async (pId) => {
    try {
      const { data } = await supabase
        .from('clinical_history')
        .select('id, entry_date, summary, session_notes, details, therapist_id')
        .eq('patient_id', pId)
        .eq('entry_type', 'derivacion')
        .filter('details->>referral_status', 'eq', 'pending')
        .order('entry_date', { ascending: false });
      setPendingReferrals(data || []);
    } catch (err) {
      logger.warn('Pending referrals query failed:', err.message);
    }
  };

  const handleAcceptReferral = async (referralId) => {
    try {
      await acceptReferral(referralId, user.id);
      toast({ title: 'Derivación aceptada', description: 'Tu historial clínico fue compartido con el nuevo profesional.' });
      loadDashboardData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleRejectReferral = async (referralId) => {
    try {
      await rejectReferral(referralId, user.id);
      toast({ title: 'Derivación rechazada' });
      setPendingReferrals((prev) => prev.filter((r) => r.id !== referralId));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // ---------- Last session date ----------
  const loadLastSession = async (pId) => {
    const { data } = await supabase
      .from('appointments')
      .select('date')
      .eq('patient_id', pId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.date) setLastSessionDate(data.date);
  };

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleConfirmAppointment = useCallback(async () => {
    const nextApt = appointments[0];
    if (!nextApt) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ confirmation_status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', nextApt.id);
      if (error) throw error;
      setAppointments(prev =>
        prev.map(a => a.id === nextApt.id ? { ...a, confirmation_status: 'confirmed' } : a)
      );
      toast({ title: 'Asistencia confirmada', description: 'Tu terapeuta ha sido notificado.' });
    } catch (err) {
      logger.error('Error confirming appointment:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo confirmar la cita.' });
    }
  }, [appointments, toast]);

  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

  const handleReschedule = useCallback(() => {
    const nextApt = appointments[0];
    if (nextApt) setRescheduleAppointment(nextApt);
  }, [appointments]);

  const handleOpenChat = useCallback(() => {
    navigate('/dashboard/chatbot');
  }, [navigate]);

  const handleContactTherapist = useCallback(() => {
    // Contactar al primary del equipo tratante
    const primary = careTeam.find(m => m.role === 'primary');
    const dentist = primary?.dentist;
    if (dentist?.phone) {
      window.open(`https://wa.me/56${dentist.phone.replace(/\D/g, '')}`, '_blank');
    } else if (dentist?.email) {
      window.open(`mailto:${dentist.email}`, '_blank');
    }
  }, [careTeam]);

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No patient record yet — show welcome state
  if (!patientId) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <Helmet>
          <title>Mi Panel | DentalSpot</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🦷</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Bienvenido a <span className="text-primary">DentalSpot</span>, {firstName}
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
            Tu panel se activara cuando un dentista te agregue como paciente o cuando agendes tu primera cita.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/dentistas')}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
            >
              <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">🔍</span>
              <h3 className="font-semibold text-gray-800 text-sm">Busca un dentista</h3>
              <p className="text-xs text-gray-500 mt-1">Encuentra profesionales cerca de ti</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/patient/clinical-file')}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
            >
              <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">📋</span>
              <h3 className="font-semibold text-gray-800 text-sm">Tu ficha clinica</h3>
              <p className="text-xs text-gray-500 mt-1">Completa tu informacion de salud</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/questions')}
              className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
            >
              <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">💬</span>
              <h3 className="font-semibold text-gray-800 text-sm">Realiza preguntas</h3>
              <p className="text-xs text-gray-500 mt-1">Dentistas especialistas responden tus dudas</p>
            </button>
          </div>
        </motion.div>
        <FloatingAssistant />
        {showWelcome && (
          <WelcomeModal
            isOpen={showWelcome}
            onClose={() => setShowWelcome(false)}
            userName={firstName}
          />
        )}
      </div>
    );
  }

  // =====================================================
  // DERIVED DATA
  // =====================================================
  const nextAppointment = appointments[0] || null;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <Helmet>
        <title>Mi Panel | DentalSpot</title>
        <meta name="description" content="Panel de control del paciente" />
      </Helmet>

      {/* ========== HEADER ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Hola, <span className="text-primary">{firstName}</span>.
          </h1>
          <p className="text-gray-500 mt-1">
            Todo en orden, esto es lo que viene.
          </p>
        </div>
        <TreatmentStatusBadge appointments={appointments} therapist={careTeam.find(m => m.role === 'primary')?.dentist || null} />
      </motion.div>

      {/* ========== LAYOUT: Main + Sidebar ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== COLUMNA PRINCIPAL (70%) ===== */}
        <div className="lg:col-span-2 space-y-5">

          {/* Derivaciones pendientes */}
          <PendingReferrals
            referrals={pendingReferrals}
            onAccept={handleAcceptReferral}
            onReject={handleRejectReferral}
          />

          {/* Bloque 1: Hero — Próxima sesión */}
          <NextSessionHero
            appointment={nextAppointment}
            therapist={careTeam.find(m => m.role === 'primary')?.dentist || null}
            onConfirm={handleConfirmAppointment}
            onReschedule={handleReschedule}
          />

          {/* Bloque 2: Cómo vas */}
          <MicroProgress
            sessionsCompleted={sessionsCompleted}
            sessionsTotal={sessionsTotal}
          />
        </div>

        {/* ===== SIDEBAR (30%) ===== */}
        <div className="lg:col-span-1 space-y-5">

          {/* Bloque 4: Mi equipo tratante */}
          <MyCareTeam careTeam={careTeam} loading={loading} />

          {/* Bloque 5: Documentos recientes */}
          <RecentDocuments documents={documents} />

          {/* Bloque 6: Mis preguntas */}
          <MyQuestionsBlock
            pendingCount={questionsPending}
            answeredCount={questionsAnswered}
          />

          {/* Bloque 7: Soporte */}
          <SupportBlock onOpenChat={handleOpenChat} />
        </div>
      </div>

      {/* Floating Assistant — se mantiene */}
      <FloatingAssistant />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleAppointment}
        onClose={() => setRescheduleAppointment(null)}
        appointment={rescheduleAppointment}
        onRescheduled={() => {
          setRescheduleAppointment(null);
          loadDashboardData();
        }}
      />

      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
    </div>
  );
};

export default PatientDashboardPageV2;