import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Phone,
  User,
  Calendar,
  CalendarPlus,
  Clock,
  AlertCircle,
  Plus,
  StickyNote,
  Trash2,
  Loader2,
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
import { formatRut } from '@/lib/utils/formatters';

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

  // Quick notes
  const [quickNotes, setQuickNotes] = useState([]);
  const [loadingQuickNotes, setLoadingQuickNotes] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', description: '', note_date: '' });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  useEffect(() => {
    if (patient?.id) {
      fetchUpcomingAppointments();
      fetchQuickNotes();
    }
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

  const fetchQuickNotes = async () => {
    setLoadingQuickNotes(true);
    try {
      const { data, error } = await supabase
        .from('patient_quick_notes')
        .select('*')
        .eq('patient_id', patient.id)
        .order('note_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuickNotes(data || []);
    } catch (err) {
      logger.warn('Error fetching quick notes:', err.message);
    } finally {
      setLoadingQuickNotes(false);
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

  const handleOpenNoteModal = () => {
    const today = new Date();
    setNewNote({
      title: '',
      description: '',
      note_date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    });
    setIsNoteModalOpen(true);
  };

  const handleSaveQuickNote = async () => {
    if (!newNote.title.trim()) {
      toast({ variant: 'destructive', title: 'Título requerido' });
      return;
    }
    setSavingNote(true);
    try {
      const { error } = await supabase.from('patient_quick_notes').insert({
        patient_id: patient.id,
        therapist_id: user.id,
        title: newNote.title.trim(),
        description: newNote.description.trim() || null,
        note_date: newNote.note_date,
      });
      if (error) throw error;
      toast({ title: 'Nota guardada' });
      setIsNoteModalOpen(false);
      fetchQuickNotes();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteQuickNote = async (noteId) => {
    try {
      await supabase.from('patient_quick_notes').delete().eq('id', noteId);
      setQuickNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
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

            {/* Age + Patient Type */}
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-white">
                {calculateAge(profile.birthdate)} años
              </Badge>
              <Badge className={cn(
                "text-xs",
                patient.patient_type === 'fonasa' ? "bg-blue-100 text-blue-700 border-blue-200" :
                patient.patient_type === 'convenio' ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-green-100 text-green-700 border-green-200"
              )} variant="outline">
                {patient.patient_type === 'fonasa' ? 'Fonasa' :
                 patient.patient_type === 'convenio' ? 'Convenio' : 'Privado'}
              </Badge>
            </div>

            {/* Contact details under name */}
            <div className="w-full mt-4 space-y-2 text-sm text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{profile.rut ? formatRut(profile.rut) : 'Sin RUT'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{profile.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{profile.email}</span>
              </div>
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

          {/* Quick Notes List + Add Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Notas Rápidas
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={handleOpenNoteModal}
              >
                <Plus className="h-3 w-3" /> Agregar nueva
              </Button>
            </div>

            {loadingQuickNotes ? (
              <div className="text-xs text-slate-400 text-center py-2">Cargando...</div>
            ) : quickNotes.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-3">
                Sin notas rápidas
              </div>
            ) : (
              <div className="space-y-2">
                {quickNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-100 text-xs group"
                  >
                    <StickyNote className="h-3.5 w-3.5 text-purple-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-purple-800">{note.title}</div>
                      {note.description && (
                        <div className="text-purple-600/80 line-clamp-2 mt-0.5">{note.description}</div>
                      )}
                      <div className="text-purple-400 mt-1">
                        {format(new Date(note.note_date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuickNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-purple-300 hover:text-red-500 transition-all shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onOpenChange={setIsAppointmentModalOpen}
        slotInfo={{ patientId: patient.id }}
        onAppointmentCreated={handleAppointmentCreated}
        onAppointmentUpdated={handleAppointmentCreated}
      />

      {/* New Quick Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <StickyNote className="h-5 w-5" />
              Nueva Nota Rápida
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newNote.note_date}
                onChange={(e) => setNewNote(prev => ({ ...prev, note_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Control post-operatorio, Llamada de seguimiento..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Detalle de la nota..."
                value={newNote.description}
                onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} disabled={savingNote}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveQuickNote}
              disabled={savingNote || !newNote.title.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientSidebar;
