import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Phone,
  User,
  Calendar,
  CalendarPlus,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { savePrivateNotes } from '@/lib/patientApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { calculateAge } from '@/lib/utils/calculations';
import { getInitials } from '@/lib/utils/strings';

import AppointmentModal from '@/components/calendar/AppointmentModal';
import logger from '@/lib/utils/logger';

const PatientSidebar = ({ patient, privateNotes: initialNotes, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  // Upcoming appointments
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Appointment modal
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  useEffect(() => {
    if (patient?.id) fetchUpcomingAppointments();
  }, [patient?.id]);

  const fetchUpcomingAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, start_time, end_time, status, clinic_id, clinics(name)')
        .eq('patient_id', patient.id)
        .in('status', ['scheduled', 'confirmed'])
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingAppointments(data || []);
    } catch (err) {
      logger.warn('Error fetching upcoming appointments:', err.message);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !patient) return;
    setIsSaving(true);
    try {
      await savePrivateNotes(patient.id, user.id, notes);
      toast({ title: "Notas guardadas", description: "Las notas privadas han sido actualizadas." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar las notas." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppointmentCreated = () => {
    setIsAppointmentModalOpen(false);
    fetchUpcomingAppointments();
    toast({ title: "Cita agendada", description: `Cita creada para ${patient.profile?.full_name}.` });
  };

  if (!patient) return null;

  const profile = patient.profile || {};
  const hasNoUpcoming = !loadingAppointments && upcomingAppointments.length === 0;

  return (
    <>
      <Card className="h-full border-none shadow-none bg-slate-50/50">
        <CardContent className="p-4 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm mb-3">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl bg-teal-100 text-teal-700">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold text-slate-900">{profile.full_name}</h2>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-white">
                {calculateAge(profile.birthdate)} años
              </Badge>
              <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                {patient.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Book Appointment Button */}
          <Button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar Cita
          </Button>

          {/* Upcoming Appointments */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Próximas Citas
            </label>
            {loadingAppointments ? (
              <div className="text-xs text-slate-400 text-center py-2">Cargando...</div>
            ) : hasNoUpcoming ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700">Sin próxima cita agendada</span>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-slate-100 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-teal-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">
                        {format(new Date(apt.date + 'T12:00:00'), "EEEE d 'de' MMM", { locale: es })}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="h-3 w-3" />
                        {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                      </div>
                      {apt.clinics?.name && (
                        <div className="text-slate-400 truncate">{apt.clinics.name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="h-4 w-4" />
              <span>{profile.phone || 'Sin teléfono'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <User className="h-4 w-4" />
              <span>{profile.rut || 'Sin RUT'}</span>
            </div>
          </div>

          {/* Private Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notas Privadas
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe notas privadas sobre el paciente..."
              className="min-h-[150px] bg-white resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Guardando...' : 'Guardar Notas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal - patient pre-selected */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onOpenChange={setIsAppointmentModalOpen}
        slotInfo={{ patientId: patient.id }}
        onAppointmentCreated={handleAppointmentCreated}
        onAppointmentUpdated={handleAppointmentCreated}
      />
    </>
  );
};

export default PatientSidebar;
