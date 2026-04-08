// src/features/patient-agenda/pages/PatientAgendaPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CalendarOff, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import AppointmentCard from '../components/AppointmentCard';
import RescheduleModal from '../components/RescheduleModal';

import {
  getPatientAppointments,
  cancelPatientAppointment
} from '../api/agendaApi';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import logger from '@/lib/utils/logger';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


// ─────────────────────────────────────────────
// MOTIVOS DE CANCELACIÓN (insight clínico + BI)
// ─────────────────────────────────────────────

const CANCEL_REASONS = [
  "Problema de salud",
  "Problema de transporte",
  "Conflicto de horario",
  "Olvido / confusión de hora",
  "Cambio personal / familiar",
  "Otro"
];


const PatientAgendaPage = () => {

  const { user } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // cancelación mejorada
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");



  // ════════════════════════════════════════════
  // FETCH CITAS
  // ════════════════════════════════════════════

  const fetchAppointments = useCallback(async () => {

    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {

      const { data } = await getPatientAppointments(user.id);
      setAppointments(data);

    } catch (err) {

      logger.error("Error cargando citas:", err);
      setError(err.message);

      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las citas. Intenta nuevamente."
      });

    } finally {
      setLoading(false);
    }

  }, [user?.id, toast]);


  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


  // ════════════════════════════════════════════
  // CANCELACIÓN CON MOTIVO
  // ════════════════════════════════════════════

  const handleConfirmCancel = async () => {

    if (!appointmentToCancel || !cancelReason) return;

    try {

      await cancelPatientAppointment(
        appointmentToCancel.id,
        user.id,
        cancelReason
      );

      toast({
        title: "Cita cancelada",
        description: "Tu dentista ha sido notificado 👌"
      });

      setCancelReason("");
      setAppointmentToCancel(null);

      // refresco suave
      fetchAppointments();

    } catch (error) {

      toast({
        variant: "destructive",
        title: "Error al cancelar cita",
        description: error.message || "Intenta nuevamente."
      });

    }
  };


  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
  };


  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);

  const handleRescheduleAppointment = (appointment) => {
    setRescheduleAppointment(appointment);
  };



  // ════════════════════════════════════════════
  // SEPARAR: próximas / pasadas
  // soporte nuevos estados clínicos
  // ════════════════════════════════════════════

  const { upcomingAppointments, pastAppointments } = useMemo(() => {

    const now = new Date();
    const upcoming = [];
    const past = [];

    appointments.forEach(app => {

      const appDate = new Date(`${app.date}T${app.start_time}`);

      const activeStates = [
        "scheduled",
        "confirmed",
        "pending_confirmation",
        "awaiting_payment"
      ];

      if (appDate >= now && activeStates.includes(app.status)) {
        upcoming.push(app);
      } else {
        past.push(app);
      }
    });

    return {

      upcomingAppointments: upcoming.sort(
        (a, b) => new Date(`${a.date}T${a.start_time}`)
          - new Date(`${b.date}T${b.start_time}`)
      ),

      pastAppointments: past.sort(
        (a, b) => new Date(`${b.date}T${b.start_time}`)
          - new Date(`${a.date}T${a.start_time}`)
      )

    };

  }, [appointments]);



  // ════════════════════════════════════════════
  // ESTADOS
  // ════════════════════════════════════════════

  if (loading) {
    return (
      <>
        <Helmet><title>Mi Agenda | DentalSpot</title></Helmet>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }


  if (error) {
    return (
      <>
        <Helmet><title>Mi Agenda | DentalSpot</title></Helmet>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

      </>
    );
  }



  // ════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════

  return (
    <>
      <Helmet>
        <title>Mi Agenda | DentalSpot</title>
      </Helmet>

      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Mi Agenda
            </h1>
            <p className="text-muted-foreground mt-2">
              Revisa, gestiona y cancela tus citas programadas
            </p>
          </div>
          <Button asChild>
            <Link to="/fonoaudiologos">
              <Search className="h-4 w-4 mr-2" />
              Buscar profesional
            </Link>
          </Button>
        </div>


        <Tabs defaultValue="upcoming">

          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="upcoming">
              Próximas Citas
              {!!upcomingAppointments.length && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {upcomingAppointments.length}
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger value="past">
              Citas Pasadas
            </TabsTrigger>
          </TabsList>



          {/* ─────── Próximas citas ─────── */}

          <TabsContent value="upcoming" className="mt-6">

            {upcomingAppointments.length ? (

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {upcomingAppointments.map(app => (
                  <AppointmentCard
                    key={app.id}
                    appointment={app}
                    isUpcoming={true}
                    onReschedule={handleRescheduleAppointment}
                    onCancel={handleCancelAppointment}
                  />
                ))}

              </div>

            ) : (

              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <CalendarOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No tienes próximas citas
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agenda tu siguiente sesión cuando lo necesites ✨
                </p>
              </div>

            )}

          </TabsContent>



          {/* ─────── Citas pasadas ─────── */}

          <TabsContent value="past" className="mt-6">

            {pastAppointments.length ? (

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastAppointments.map(app => (
                  <AppointmentCard
                    key={app.id}
                    appointment={app}
                    isUpcoming={false}
                  />
                ))}
              </div>

            ) : (

              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <CalendarOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Aún no tienes historial de citas
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cuando completes sesiones aparecerán aquí.
                </p>
              </div>

            )}

          </TabsContent>
        </Tabs>
      </div>




      {/* ════════════════════════════════════════════
         MODAL CANCELACIÓN CON MOTIVO
         ════════════════════════════════════════════ */}

      <AlertDialog
        open={!!appointmentToCancel}
        onOpenChange={() => setAppointmentToCancel(null)}
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              ¿Deseas cancelar esta cita?
            </AlertDialogTitle>

            <AlertDialogDescription>
              La cancelación notificará al dentista y liberará el horario.
              Por favor indica el motivo — nos ayuda a mejorar la atención.
            </AlertDialogDescription>
          </AlertDialogHeader>


          <div className="mt-4">
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo de cancelación" />
              </SelectTrigger>

              <SelectContent>
                {CANCEL_REASONS.map(reason => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <AlertDialogFooter>

            <AlertDialogCancel>
              Volver
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={!cancelReason}
              onClick={handleConfirmCancel}
            >
              Confirmar Cancelación
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleAppointment}
        onClose={() => setRescheduleAppointment(null)}
        appointment={rescheduleAppointment}
        onRescheduled={() => {
          setRescheduleAppointment(null);
          fetchAppointments();
        }}
      />

    </>
  );
};

export default PatientAgendaPage;