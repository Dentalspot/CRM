import React, { useMemo, useCallback, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { isToday, differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import SupportTicketModal from '@/components/shared/SupportTicketModal';

import {
  ClinicContextHeader,
  ClinicOnboardingChecklist,
  DayKPIs,
  CriticalAlerts,
  TeamOccupancyGrid,
  PatientsAtRisk,
  QuickActions,
  CommissionsPanel,
} from './components';

// Reutilizamos el hook existente — toda la data ya se carga ahí
import useClinicDashboard from '@/pages/clinic/useClinicDashboard';

// Reutilizamos widgets existentes que siguen siendo útiles
import {
  SimpleBarChart,
  CreateClinicBanner,
} from '@/pages/clinic/ClinicDashboardWidgets';

// Modales existentes
import TherapistManagementModal from '@/components/clinic/TherapistManagementModal';
import InviteTherapistModal from '@/components/clinic/InviteTherapistModal';
import CreateClinicModal from '@/components/clinic/CreateClinicModal';
import ReminderSettingsPanel from '@/features/reminders/components/ReminderSettingsPanel';
import WelcomeModal from '@/components/onboarding/WelcomeModal';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MAX_WEEKLY_SLOTS = 20;

const ClinicDashboardPageV2 = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    loading, metrics, therapists, performanceData,
    clinicInfo, appointments, weekStart, weekEnd,
    // Modals
    isTherapistModalOpen, setIsTherapistModalOpen,
    isInviteModalOpen, setIsInviteModalOpen,
    isCreateClinicModalOpen, setIsCreateClinicModalOpen,
    selectedTherapist,
    isRemoveDialogOpen, setIsRemoveDialogOpen,
    therapistToRemove,
    // Handlers
    fetchClinicData,
    handleOpenInvite, handleOpenAddTherapist,
    handleEditTherapist, handleRemoveTherapist, confirmRemoveTherapist,
    handleClinicCreated,
  } = useClinicDashboard();

  const [showWelcome, setShowWelcome] = React.useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  React.useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      setShowWelcome(true);
    }
  }, [profile]);

  // =====================================================
  // DERIVED DATA: KPIs del día
  // =====================================================
  const dayKPIData = useMemo(() => {
    const todayApps = appointments.filter(a => {
      try { return isToday(parseISO(a.date)); } catch { return false; }
    });

    const confirmed = todayApps.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
    const cancelled = todayApps.filter(a => a.status === 'cancelled').length;
    const activeTherapists = therapists.filter(t => t.is_active).length;

    // Cupos vacíos: slots totales de terapeutas activos - citas de hoy
    const totalSlotsToday = activeTherapists * 8; // estimado 8 slots/día
    const emptySlots = Math.max(0, totalSlotsToday - todayApps.length);

    // Pacientes únicos hoy
    const patientsToday = new Set(todayApps.map(a => a.patient_id)).size;

    return {
      patientsToday,
      confirmedToday: confirmed,
      cancellationsToday: cancelled,
      activeTherapists,
      emptySlots,
      criticalPending: 0, // se calcula con alertas
      // Subtexts
      confirmedTodaySub: todayApps.length > 0 ? `${Math.round((confirmed / todayApps.length) * 100)}% asistencia` : null,
      activeTherapistsSub: `de ${therapists.length} totales`,
      emptySlotsSub: emptySlots > 3 ? '¿Reasignar?' : null,
    };
  }, [appointments, therapists]);

  // =====================================================
  // DERIVED DATA: Alertas críticas
  // =====================================================
  const alerts = useMemo(() => {
    const result = [];

    // 1. Pacientes sin cita hace +14 días
    const patientLastAppointment = {};
    appointments.forEach(a => {
      if (a.status === 'completed' || a.status === 'scheduled') {
        const current = patientLastAppointment[a.patient_id];
        if (!current || a.date > current) {
          patientLastAppointment[a.patient_id] = a.date;
        }
      }
    });

    const patientsNoFollowUp = Object.entries(patientLastAppointment).filter(([_, lastDate]) => {
      try {
        return differenceInDays(new Date(), parseISO(lastDate)) > 14;
      } catch { return false; }
    });

    if (patientsNoFollowUp.length > 0) {
      result.push({
        id: 'no_followup',
        type: 'patients_no_followup',
        title: `${patientsNoFollowUp.length} paciente${patientsNoFollowUp.length > 1 ? 's' : ''} sin cita hace +14 días`,
        detail: 'Riesgo de abandono — ¿Agendamos seguimiento?',
        actionLabel: 'Contactar',
      });
    }

    // 2. Terapeutas con alta cancelación
    therapists.forEach(t => {
      const tApps = appointments.filter(a => a.therapist_id === t.therapist_id);
      const tCancelled = tApps.filter(a => a.status === 'cancelled').length;
      const cancelRate = tApps.length > 0 ? (tCancelled / tApps.length) * 100 : 0;

      if (cancelRate > 25 && tApps.length >= 5) {
        const name = t.profiles?.full_name?.split(' ').slice(0, 2).join(' ') || 'Terapeuta';
        result.push({
          id: `cancel_${t.therapist_id}`,
          type: 'high_cancellation',
          title: `${name}: cancelación ${Math.round(cancelRate)}%`,
          detail: `${tCancelled} de ${tApps.length} citas canceladas`,
          actionLabel: 'Ver perfil',
        });
      }
    });

    // 3. Cupos vacíos hoy
    const todayApps = appointments.filter(a => {
      try { return isToday(parseISO(a.date)); } catch { return false; }
    });
    const activeCount = therapists.filter(t => t.is_active).length;
    const totalSlots = activeCount * 8;
    const emptyToday = totalSlots - todayApps.length;

    if (emptyToday > totalSlots * 0.5 && activeCount > 0) {
      result.push({
        id: 'empty_slots',
        type: 'empty_slots_today',
        title: `${emptyToday} cupos sin llenar hoy`,
        detail: 'Oportunidad de redistribución o nuevas citas',
        actionLabel: 'Reasignar',
      });
    }

    return result;
  }, [appointments, therapists]);

  // Update critical pending in KPIs
  const finalKPIData = useMemo(() => ({
    ...dayKPIData,
    criticalPending: alerts.length,
    criticalPendingSub: alerts.length > 0 ? 'Ver detalle' : null,
  }), [dayKPIData, alerts]);

  // =====================================================
  // DERIVED DATA: Ocupación de terapeutas
  // =====================================================
  const therapistOccupancy = useMemo(() => {
    return therapists.map(t => {
      const weekApps = appointments.filter(a =>
        a.therapist_id === t.therapist_id &&
        a.status !== 'cancelled' &&
        (() => { try { const d = new Date(a.date); return d >= weekStart && d <= weekEnd; } catch { return false; } })()
      );

      const completedWeek = weekApps.filter(a => a.status === 'completed').length;
      const scheduledWeek = weekApps.filter(a => a.status === 'scheduled').length;
      const totalWeek = completedWeek + scheduledWeek;
      const occupancy = Math.min(Math.round((totalWeek / MAX_WEEKLY_SLOTS) * 100), 100);

      // Próxima cita hoy
      const todayCitas = appointments.filter(a => {
        try {
          return a.therapist_id === t.therapist_id &&
            isToday(parseISO(a.date)) &&
            a.status === 'scheduled';
        } catch { return false; }
      }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

      const nextTime = todayCitas[0]?.start_time?.slice(0, 5) || null;

      return {
        ...t,
        occupancyPercent: occupancy,
        weekSessions: totalWeek,
        freeSlots: Math.max(0, MAX_WEEKLY_SLOTS - totalWeek),
        nextAppointmentTime: nextTime,
        isAbsent: !t.is_active,
      };
    }).sort((a, b) => b.occupancyPercent - a.occupancyPercent);
  }, [therapists, appointments, weekStart, weekEnd]);

  // =====================================================
  // DERIVED DATA: Pacientes en riesgo
  // =====================================================
  const patientsAtRisk = useMemo(() => {
    const result = [];
    const patientMap = {};

    // Construir mapa de pacientes con última cita y conteo de cancelaciones
    appointments.forEach(a => {
      if (!patientMap[a.patient_id]) {
        patientMap[a.patient_id] = {
          id: a.patient_id,
          name: null, // se resuelve abajo si es posible
          lastDate: null,
          cancellations: 0,
          totalAppointments: 0,
          therapistName: null,
        };
      }
      const p = patientMap[a.patient_id];
      p.totalAppointments++;

      if (a.status === 'cancelled') p.cancellations++;

      if (a.status === 'completed' || a.status === 'scheduled') {
        if (!p.lastDate || a.date > p.lastDate) {
          p.lastDate = a.date;
        }
      }

      // Intentar obtener nombre del terapeuta
      if (!p.therapistName) {
        const therapist = therapists.find(t => t.therapist_id === a.therapist_id);
        p.therapistName = therapist?.profiles?.full_name?.split(' ')[0] || null;
      }
    });

    Object.values(patientMap).forEach(p => {
      // Sin cita hace +14 días
      if (p.lastDate) {
        try {
          const days = differenceInDays(new Date(), parseISO(p.lastDate));
          if (days > 14) {
            result.push({
              ...p,
              name: p.name || `Paciente`,
              riskType: 'no_followup',
              lastAppointmentDate: p.lastDate,
            });
          }
        } catch {}
      }

      // 2+ cancelaciones
      if (p.cancellations >= 2) {
        result.push({
          ...p,
          name: p.name || `Paciente`,
          riskType: 'cancellations',
          detail: `${p.cancellations} cancelaciones`,
        });
      }

      // Nuevo sin segunda cita
      if (p.totalAppointments === 1) {
        result.push({
          ...p,
          name: p.name || `Paciente`,
          riskType: 'no_second',
          detail: 'Solo 1 cita registrada',
        });
      }
    });

    return result;
  }, [appointments, therapists]);

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleAlertAction = useCallback((alert) => {
    if (alert.type === 'patients_no_followup') {
      navigate('/dashboard/patients');
    } else if (alert.type === 'high_cancellation') {
      toast({ title: 'Revisión de terapeuta', description: 'Navega al perfil para ver detalle.' });
    } else {
      toast({ title: 'Acción registrada', description: alert.title });
    }
  }, [toast]);

  const handleQuickAction = useCallback((actionKey) => {
    switch (actionKey) {
      case 'schedule':
        navigate('/dashboard/calendar');
        break;
      case 'addPatient':
        navigate('/dashboard/patients');
        break;
      case 'inviteTherapist':
        handleOpenInvite();
        break;
      case 'report':
        navigate('/dashboard/clinic/reports');
        break;
      default:
        break;
    }
  }, [navigate, handleOpenInvite]);

  const handleViewAgenda = useCallback((therapist) => {
    navigate('/dashboard/calendar');
  }, [navigate]);

  const handleAssignPatient = useCallback((therapist) => {
    navigate('/dashboard/calendar');
  }, [navigate]);

  const handleContactPatient = useCallback((patient) => {
    if (patient?.id) navigate(`/dashboard/patients/${patient.id}`);
  }, [toast]);

  const handleSchedulePatient = useCallback((patient) => {
    navigate('/dashboard/calendar');
  }, [navigate]);

  // =====================================================
  // TODAY APPOINTMENTS COUNT
  // =====================================================
  const todayAppointmentCount = useMemo(() => {
    return appointments.filter(a => {
      try { return isToday(parseISO(a.date)) && a.status !== 'cancelled'; } catch { return false; }
    }).length;
  }, [appointments]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      <Helmet>
        <title>{clinicInfo?.name || 'Panel Clínica'} | DentalSpot</title>
        <meta name="description" content="Torre de control de tu centro clínico" />
      </Helmet>

      {/* Banner si no hay clínica */}
      {!clinicInfo && (
        <CreateClinicBanner onOpenCreate={() => setIsCreateClinicModalOpen(true)} />
      )}

      {/* ========== BLOQUE 1: Context Header ========== */}
      <ClinicContextHeader
        clinicName={clinicInfo?.name || 'Mi Centro'}
        userName={profile?.full_name || ''}
        alertCount={alerts.filter(a => a.type !== 'patients_no_followup').length}
        criticalCount={alerts.filter(a => a.type === 'patients_no_followup').length}
        todayAppointments={todayAppointmentCount}
      />
      {/* ========== ONBOARDING CHECKLIST ========== */}
      <ClinicOnboardingChecklist
        clinicInfo={clinicInfo}
        onCreateClinic={() => setIsCreateClinicModalOpen(true)}
        onInviteTherapist={handleOpenInvite}
      />
      {/* ========== BLOQUE 2: KPIs del Día ========== */}
      <DayKPIs data={finalKPIData} />

      {/* ========== BLOQUE 3: Alertas Críticas ========== */}
      <CriticalAlerts alerts={alerts} onAction={handleAlertAction} />

      {/* ========== LAYOUT: Two columns ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== COLUMNA PRINCIPAL (66%) ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bloque 4: Ocupación del equipo */}
          <TeamOccupancyGrid
            therapists={therapistOccupancy}
            onViewAgenda={handleViewAgenda}
            onAssignPatient={handleAssignPatient}
            maxWeeklySlots={MAX_WEEKLY_SLOTS}
          />
          {/* Bloque: Comisiones por terapeuta */}
          <CommissionsPanel
            therapists={therapists}
            appointments={appointments}
            onCommissionUpdated={fetchClinicData}
          />

          {/* Bloque 8: Rendimiento mensual (reutilizado) */}
          {performanceData.length > 0 && (
            <Card className="border border-gray-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tendencia mensual
                </CardTitle>
                <CardDescription className="text-xs">
                  Sesiones completadas en los últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <SimpleBarChart data={performanceData} color="bg-teal-500" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* ===== SIDEBAR (33%) ===== */}
        <div className="lg:col-span-1 space-y-5">

          {/* Bloque 5: Pacientes en riesgo */}
          <PatientsAtRisk
            patients={patientsAtRisk}
            onContact={handleContactPatient}
            onSchedule={handleSchedulePatient}
          />

          {/* Bloque 7: Acciones rápidas */}
          <QuickActions
            onAction={handleQuickAction}
            disabled={!clinicInfo}
          />

          {/* Bloque 8: Recordatorios */}
          <ReminderSettingsPanel />
        </div>
      </div>

      {/* ========== MODALES (reutilizados) ========== */}
      {clinicInfo && (
        <TherapistManagementModal
          isOpen={isTherapistModalOpen}
          onClose={() => setIsTherapistModalOpen(false)}
          clinicId={clinicInfo.id}
          therapistToEdit={selectedTherapist}
          onSuccess={fetchClinicData}
        />
      )}

      {clinicInfo && (
        <InviteTherapistModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          clinicId={clinicInfo.id}
          onSuccess={fetchClinicData}
        />
      )}

      <CreateClinicModal
        isOpen={isCreateClinicModalOpen}
        onClose={() => setIsCreateClinicModalOpen(false)}
        onSuccess={handleClinicCreated}
      />

      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar Terapeuta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de querer desactivar a {therapistToRemove?.profiles?.full_name} de la clínica?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveTherapist} className="bg-red-600 hover:bg-red-700">
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

    </div>
  );
};

export default ClinicDashboardPageV2;