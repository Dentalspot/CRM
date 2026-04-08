import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import SectionErrorBoundary from '@/components/shared/SectionErrorBoundary';
import {
  Loader2, Users, Calendar, Clock, ChevronRight, Activity,
  Shield, Award, DollarSign, UserCheck, FileWarning
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { useMetaTracking } from '@/hooks/useMetaTracking';

// Components
import UpcomingAppointmentCard from '@/features/dashboard/components/UpcomingAppointmentCard';
import QuickAccessSection from '@/features/dashboard/components/QuickAccessSection';
import PendingActionsWidget from '@/features/dashboard/components/PendingActionsWidget';
import BlogQuestionsWidget from '@/features/therapist/components/BlogQuestionsWidget';
import { getPendingDocumentation, getPendingPayments } from '@/features/post-session/api/postSessionApi';
import { Button } from '@/components/ui/button';
import SupportTicketModal from '@/components/shared/SupportTicketModal';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import OnboardingChecklist from '@/features/therapist/components/OnboardingChecklist';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import logger from '@/lib/utils/logger';

// ============================================
// PROFILE COMPLETION CONFIG (11 pasos)
// ============================================

const PROFILE_STEPS = [
  { id: 'personal_info', label: 'Información personal' },
  { id: 'security', label: 'Seguridad y zona horaria' },
  { id: 'work_experience', label: 'Experiencia laboral' },
  { id: 'academic', label: 'Formación académica' },
  { id: 'dentallevel', label: 'DentalLevel' },
  { id: 'clinics_schedule', label: 'Clínicas y horarios' },
  { id: 'services_fees', label: 'Servicios y aranceles' },
  { id: 'payment_data', label: 'Datos de pago' },
  { id: 'visual', label: 'Personalización visual' },
  { id: 'documents', label: 'Documentos y materiales' },
  { id: 'membership', label: 'Plan de membresía' },
];

// ============================================
// DENTALLEVEL CONFIG
// ============================================

const DENTALLEVEL_BADGES = [
  { min: 0, label: 'Principiante', emoji: '🌱', color: 'text-amber-300' },
  { min: 20, label: 'En Desarrollo', emoji: '📘', color: 'text-blue-300' },
  { min: 40, label: 'Competente', emoji: '⭐', color: 'text-indigo-300' },
  { min: 60, label: 'Avanzado', emoji: '🏅', color: 'text-purple-300' },
  { min: 80, label: 'Experto', emoji: '👑', color: 'text-yellow-300' },
];

const getDentalLevel = (score) => {
  for (let i = DENTALLEVEL_BADGES.length - 1; i >= 0; i--) {
    if (score >= DENTALLEVEL_BADGES[i].min) return DENTALLEVEL_BADGES[i];
  }
  return DENTALLEVEL_BADGES[0];
};

// ============================================
// MAIN COMPONENT
// ============================================

const TherapistDashboardPage = () => {
  const { user, profile } = useAuth();
  const { trackEvent } = useMetaTracking();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    activePatients: 0,
    attendedPatients: 0,
    monthlyIncome: 0,
    fonoLevelScore: 0,
  });

  const [profileCompletion, setProfileCompletion] = useState({});
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingActions, setPendingActions] = useState(null);
  const [pendingNotes, setPendingNotes] = useState([]);
  const [pendingPaymentsList, setPendingPaymentsList] = useState([]);
  const [publicSlug, setPublicSlug] = useState(null);
  const [bookingPatientId, setBookingPatientId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      setShowWelcome(true);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      trackEvent('ViewContent', {
        content_name: 'Therapist Dashboard',
        content_category: 'Dashboard',
        user_role: 'therapist'
      });
    }
  }, [user, trackEvent]);

  // ============================================
  // FETCH ALL DATA
  // ============================================

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const [patientsRes, attendedRes, incomeRes, upcomingRes] = await Promise.all([
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('therapist_id', user.id)
          .eq('status', 'active'),

        supabase
          .from('appointments')
          .select('patient_id')
          .eq('therapist_id', user.id)
          .eq('status', 'completed')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd')),

        supabase
          .from('appointments')
          .select('fee')
          .eq('therapist_id', user.id)
          .eq('status', 'completed')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd')),

        supabase
          .from('appointments')
          .select(`
            id, date, start_time, modality_patient, status,
            patient:patients!appointments_patient_id_fkey(
              id,
              profile:profiles!patients_profile_id_fkey(full_name)
            )
          `)
          .eq('therapist_id', user.id)
          .gte('date', format(today, 'yyyy-MM-dd'))
          .neq('status', 'cancelled')
          .neq('status', 'completed')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5),
      ]);

      const uniqueAttended = new Set((attendedRes.data || []).map(a => a.patient_id)).size;
      const totalIncome = (incomeRes.data || []).reduce((acc, a) => acc + (a.fee || 0), 0);

      const now = new Date();
      const filteredUpcoming = (upcomingRes.data || []).filter(app => {
        const appDate = new Date(`${app.date}T${app.start_time}`);
        return appDate >= now;
      }).slice(0, 4);

      setStats({
        activePatients: patientsRes.count || 0,
        attendedPatients: uniqueAttended,
        monthlyIncome: totalIncome,
        fonoLevelScore: 0,
      });

      setUpcomingAppointments(filteredUpcoming);

      // DentalLevel (try RPC, fallback to 0)
      try {
        const { data: repData } = await supabase.rpc('get_therapist_reputation', { p_therapist_id: user.id });
        if (repData?.global?.final_score) {
          setStats(prev => ({ ...prev, fonoLevelScore: repData.global.final_score }));
        }
      } catch {
        // RPC not available yet
      }

      // Profile Completion
      const [profileRes, brandingRes, specialtiesRes, availRes, clinicsRes, educationRes, publicRes, subscriptionRes, docsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, rut').eq('id', user.id).maybeSingle(),
        supabase.from('therapist_branding').select('avatar_url, logo_url, primary_color').eq('therapist_id', user.id).maybeSingle(),
        supabase.from('therapist_specialties').select('specialty_id').eq('therapist_id', user.id).limit(1),
        supabase.from('therapist_availabilities').select('id').eq('therapist_id', user.id).limit(1),
        supabase.from('clinics').select('id').eq('therapist_id', user.id).limit(1),
        supabase.from('therapist_education').select('id').eq('therapist_id', user.id).limit(1),
        supabase.from('therapist_details').select('is_public, slug').eq('user_id', user.id).maybeSingle(),
        supabase.from('therapist_subscriptions').select('status').eq('therapist_id', user.id).eq('status', 'active').limit(1),
        supabase.from('therapist_documents').select('id').eq('therapist_id', user.id).limit(1),
      ]);

      setProfileCompletion({
        personal_info: !!(profileRes.data?.full_name && profileRes.data?.phone),
        security: !!user.email,
        work_experience: !!(specialtiesRes.data?.length > 0),
        academic: !!(educationRes.data?.length > 0),
        dentallevel: !!(publicRes.data?.is_public === true),
        clinics_schedule: !!(clinicsRes.data?.length > 0 && availRes.data?.length > 0),
        services_fees: !!(specialtiesRes.data?.length > 0),
        payment_data: false,
        visual: !!(brandingRes.data?.avatar_url || brandingRes.data?.logo_url || brandingRes.data?.primary_color),
        documents: !!(docsRes.data?.length > 0),
        membership: !!(subscriptionRes.data?.length > 0),
      });

      setPublicSlug(publicRes.data?.slug || null);

      // Pendientes operativos (últimos 30 días)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
        const todayStr = format(today, 'yyyy-MM-dd');

        const { data: completedApts } = await supabase
          .from('appointments')
          .select(`
            id, date, start_time, patient_id,
            patient:patients!appointments_patient_id_fkey(
              id,
              profile:profiles!patients_profile_id_fkey(full_name)
            )
          `)
          .eq('therapist_id', user.id)
          .eq('status', 'completed')
          .gte('date', thirtyDaysAgoStr)
          .order('date', { ascending: false });

        const pending = { undocumented: [], unpaid: [], noFollowUp: [] };

        if (completedApts?.length > 0) {
          const completedIds = completedApts.map(a => a.id);

          const [{ data: documented }, { data: paid }] = await Promise.all([
            supabase.from('clinical_history').select('appointment_id').in('appointment_id', completedIds),
            supabase.from('patient_payments').select('appointment_id').in('appointment_id', completedIds),
          ]);

          const documentedSet = new Set(documented?.map(d => d.appointment_id) || []);
          const paidSet = new Set(paid?.map(p => p.appointment_id) || []);

          pending.undocumented = completedApts.filter(a => !documentedSet.has(a.id)).slice(0, 10);
          pending.unpaid = completedApts.filter(a => !paidSet.has(a.id)).slice(0, 10);
        }

        // Pacientes activos sin próxima cita
        const { data: activePatientsList } = await supabase
          .from('patients')
          .select('id, profile:profiles!patients_profile_id_fkey(full_name)')
          .eq('therapist_id', user.id)
          .eq('status', 'active');

        if (activePatientsList?.length > 0) {
          const activeIds = activePatientsList.map(p => p.id);
          const { data: futureApts } = await supabase
            .from('appointments')
            .select('patient_id')
            .eq('therapist_id', user.id)
            .in('patient_id', activeIds)
            .gte('date', todayStr)
            .in('status', ['scheduled', 'confirmed']);

          const withFutureApt = new Set(futureApts?.map(a => a.patient_id) || []);
          pending.noFollowUp = activePatientsList.filter(p => !withFutureApt.has(p.id)).slice(0, 10);
        }

        setPendingActions(pending);
      } catch (pendingErr) {
        logger.error('Error fetching pending actions:', pendingErr);
      }

      // Fetch via postSessionApi (alertas compactas)
      try {
        const [notes, payments] = await Promise.all([
          getPendingDocumentation(user.id),
          getPendingPayments(user.id),
        ]);
        setPendingNotes(notes || []);
        setPendingPaymentsList(payments || []);
      } catch (apiErr) {
        logger.error('Error fetching post-session pending:', apiErr);
      }

    } catch (err) {
      logger.error('Error fetching dashboard data:', err);
      setError('No pudimos cargar algunos datos del panel.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const completedSteps = Object.values(profileCompletion).filter(Boolean).length;
  const totalSteps = PROFILE_STEPS.length;
  const profilePercent = Math.round((completedSteps / totalSteps) * 100);
  const fonoLevel = getDentalLevel(stats.fonoLevelScore);

  const incomeFormatted = stats.monthlyIncome > 0
    ? `$${stats.monthlyIncome.toLocaleString('es-CL')}`
    : '$0';

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <Helmet>
        <title>Dashboard | DentalSpot</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-7xl space-y-6">
          <OnboardingChecklist />

          {/* ========== HERO BANNER ========== */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-5 sm:p-8 shadow-2xl"
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-blob" />
              <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-overlay filter blur-xl animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                <div className="ring-4 ring-white/30 rounded-full shadow-lg shrink-0">
                  <ProfileAvatar
                    profile={profile}
                    alt={profile?.full_name}
                    className="rounded-full h-14 w-14 sm:h-20 sm:w-20"
                    fallbackClassName="bg-white text-purple-600 text-xl sm:text-2xl"
                  />
                </div>

                <div className="min-w-0">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 truncate"
                  >
                    ¡Hola, {profile?.full_name?.split(' ')[0] || 'Dentista'}! 👋
                  </motion.h1>

                  <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                      {fonoLevel.emoji} DentalLevel: {fonoLevel.label}
                    </Badge>
                    {stats.fonoLevelScore > 0 && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Score: {stats.fonoLevelScore}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 w-full sm:w-auto">
                <Button asChild size="sm" className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg flex-1 sm:flex-none sm:size-lg">
                  <Link to="/dashboard/calendar">
                    <Calendar className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm">Calendario</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-white/20 text-white border border-white/40 hover:bg-white/30 backdrop-blur-sm shadow-lg flex-1 sm:flex-none sm:size-lg">
                  <Link to="/dashboard/patients">
                    <Users className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm">Pacientes</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Profile Completion Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 relative z-10"
            >
              <div className="flex items-center justify-between text-white text-xs sm:text-sm mb-2">
                <span className="font-semibold">Perfil profesional</span>
                <span>{completedSteps}/{totalSteps} completadas</span>
              </div>
              <div className="relative">
                <Progress value={profilePercent} className="h-3 bg-white/30" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profilePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                />
              </div>
              {profilePercent < 100 && (
                <p className="text-white/70 text-xs mt-2">
                  Completa tu perfil para mejorar tu DentalLevel y que más pacientes te encuentren →{' '}
                  <Link to="/dashboard/profile" className="underline text-white hover:text-yellow-300">
                    Completar perfil
                  </Link>
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* ========== ERROR ========== */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={fetchDashboardData} className="underline hover:text-red-600">Reintentar</button>
            </motion.div>
          )}

          {/* ========== PENDING ALERTS ========== */}
          {(pendingNotes.length > 0 || pendingPaymentsList.length > 0) && (
            <div className="space-y-2 mb-4">
              {pendingNotes.length > 0 && (
                <Alert className="border-amber-300 bg-amber-50 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileWarning className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-sm text-amber-800 font-medium">
                        {pendingNotes.length} sesión{pendingNotes.length !== 1 ? 'es' : ''} sin nota clínica
                      </AlertDescription>
                    </div>
                    <Link
                      to={`/dashboard/patients/${pendingNotes[0]?.patient_id}`}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      Documentar <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Alert>
              )}
              {pendingPaymentsList.length > 0 && (
                <Alert className="border-green-300 bg-green-50 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-sm text-green-800 font-medium">
                        {pendingPaymentsList.length} sesión{pendingPaymentsList.length !== 1 ? 'es' : ''} con pago pendiente
                      </AlertDescription>
                    </div>
                    <Link
                      to={`/dashboard/patients/${pendingPaymentsList[0]?.patient_id}`}
                      className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      Registrar <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* ========== 4 STAT CARDS ========== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Green — DentalLevel */}
            <motion.div whileHover={{ scale: 1.02, y: -5 }}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white overflow-hidden h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <span className="text-xl sm:text-2xl">{fonoLevel.emoji}</span>
                  </div>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <div className="text-lg sm:text-2xl font-black mb-1 truncate">{fonoLevel.label}</div>
                      <div className="text-xs sm:text-sm font-medium opacity-90">DentalLevel</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Blue — Active Patients */}
            <motion.div whileHover={{ scale: 1.02, y: -5 }}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-400 to-cyan-500 text-white overflow-hidden h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 opacity-60" />
                  </div>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <div className="text-3xl sm:text-4xl font-black mb-1">{stats.activePatients}</div>
                      <div className="text-xs sm:text-sm font-medium opacity-90">Pacientes Activos</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pink — Attended */}
            <motion.div whileHover={{ scale: 1.02, y: -5 }}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-400 to-rose-500 text-white overflow-hidden h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 opacity-60" />
                  </div>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <div className="text-3xl sm:text-4xl font-black mb-1">{stats.attendedPatients}</div>
                      <div className="text-xs sm:text-sm font-medium opacity-90">Atendidos este mes</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Orange — Income */}
            <motion.div whileHover={{ scale: 1.02, y: -5 }}>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-400 to-red-500 text-white overflow-hidden h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 opacity-80" />
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 opacity-60" />
                  </div>
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <div className="text-2xl sm:text-3xl font-black mb-1">{incomeFormatted}</div>
                      <div className="text-xs sm:text-sm font-medium opacity-90">Ingresos del mes</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ========== MAIN CONTENT ========== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Appointments */}
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Próximas Citas
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                      <Link to="/dashboard/calendar">
                        Ver todas <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingAppointments.map((app, index) => (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <UpcomingAppointmentCard appointment={app} index={index} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">No tienes citas próximas</p>
                      <Button asChild variant="outline">
                        <Link to="/dashboard/calendar">Agendar nueva cita</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <SectionErrorBoundary name="QuickAccess">
                <QuickAccessSection publicSlug={publicSlug} />
              </SectionErrorBoundary>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <SectionErrorBoundary name="PendingActions">
                <PendingActionsWidget pendingActions={pendingActions} onBookAppointment={(patientId) => setBookingPatientId(patientId)} />
              </SectionErrorBoundary>
              <SectionErrorBoundary name="BlogQuestions">
                <BlogQuestionsWidget />
              </SectionErrorBoundary>

            </div>
          </div>
        </main>

        <AppointmentModal
          isOpen={!!bookingPatientId}
          onOpenChange={(open) => { if (!open) setBookingPatientId(null); }}
          slotInfo={{ patientId: bookingPatientId }}
          onAppointmentCreated={() => setBookingPatientId(null)}
          onAppointmentUpdated={() => setBookingPatientId(null)}
        />

        <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      </div>
    </>
  );
};

export default TherapistDashboardPage;