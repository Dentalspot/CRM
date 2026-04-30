
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, Ban, Loader2, CheckCircle2, FileText, XCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import BlockTimeForm from './BlockTimeForm';
import PatientModal from '@/features/patients/components/PatientModal';
import logger from '@/lib/utils/logger';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';

const AppointmentModal = ({ isOpen, onOpenChange, slotInfo, selectedClinic: propSelectedClinic, onAppointmentCreated, onAppointmentUpdated, onSessionCompleted }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentOrganizationId } = useCurrentOrganization();

  const [activeTab, setActiveTab] = useState('cita');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // States required for the unified inline form
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [services, setServices] = useState([]);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const isEditing = slotInfo?.isEditing;

  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    clinic_id: '',
    block_type: '',
    patient_id: '',
    service_id: '',
    notes: '',
    status: 'scheduled',
  });

  // Fetch clínicas del terapeuta — combina owned + linked (multi-clínica)
  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchClinics = async () => {
        setLoadingClinics(true);
        const [ownedRes, linkedRes] = await Promise.all([
          supabase
            .from('clinics')
            .select('*')
            .eq('therapist_id', user.id),
          supabase
            .from('clinic_therapists')
            .select('clinic:clinics(*)')
            .eq('therapist_id', user.id)
            .eq('is_active', true),
        ]);
        const owned = ownedRes.data || [];
        const linked = (linkedRes.data || []).map(r => r.clinic).filter(Boolean);
        const all = [...owned, ...linked];
        const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
        setClinics(unique);
        setLoadingClinics(false);
      };
      fetchClinics();

      // Fetch services
      supabase.from('therapist_services').select('*').eq('therapist_id', user.id).eq('is_active', true)
        .then(({data}) => setServices(data || []));
    }
  }, [isOpen, user]);

  // Fetch appointment details if editing
  useEffect(() => {
    if (isOpen && isEditing) {
      setActiveTab('cita');
      const fetchAppointmentDetails = async () => {
        setIsSubmitting(true);
        try {
          const { data, error } = await supabase
            .from('appointments')
            .select(`
              *, 
              patient:patients (
                id,
                profile:profiles (full_name, email, phone)
              ), 
              clinics(*)
            `)
            .eq('id', slotInfo.id)
            .single();

          if (error) throw error;
          setAppointmentData(data);
        } catch (error) {
          logger.error('Error fetching appointment details:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la cita.' });
          onOpenChange(false);
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchAppointmentDetails();
    } else {
      setActiveTab('cita');
      setAppointmentData(null);
    }
  }, [isOpen, isEditing, slotInfo, toast, onOpenChange]);

  // Initialize formData
  useEffect(() => {
    if (isOpen) {
      if (isEditing && appointmentData) {
        setFormData({
          date: appointmentData.date || '',
          start_time: appointmentData.start_time || '',
          end_time: appointmentData.end_time || '',
          clinic_id: appointmentData.clinic_id || propSelectedClinic || '',
          block_type: appointmentData.block_type || '',
          patient_id: appointmentData.patient_id || '',
          service_id: appointmentData.service_id || '',
          notes: appointmentData.notes || '',
          status: appointmentData.status || 'scheduled',
        });
      } else if (!isEditing && slotInfo) {
        setFormData({
          date: slotInfo.date || '',
          start_time: slotInfo.startTime || '',
          end_time: slotInfo.endTime || '',
          clinic_id: slotInfo.clinicId || propSelectedClinic || '',
          block_type: '',
          patient_id: slotInfo.patientId || '',
          service_id: '',
          notes: ''
        });
      }
    }
  }, [isOpen, isEditing, appointmentData, slotInfo, propSelectedClinic]);

  // Filtrar pacientes según clínica seleccionada (Task 3)
  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchPatients = async () => {
        setLoadingPatients(true);
        // Filtrar pacientes por organización activa (no por therapist_id)
        let query = supabase.from('patients').select('id, attention_type, clinic_id, organization_id, profile:profiles(full_name)').eq('status', 'active');
        if (currentOrganizationId) {
          query = query.eq('organization_id', currentOrganizationId);
        }
        
        const selectedClinicObj = clinics.find(c => c.id === formData.clinic_id);
        if (selectedClinicObj?.type === 'colegio') {
          query = query.eq('attention_type', 'pie_escolar').eq('clinic_id', formData.clinic_id);
        }
        
        const { data } = await query;
        setPatients(data || []);
        setLoadingPatients(false);
      };
      fetchPatients();
    }
  }, [isOpen, user, formData.clinic_id, clinics]);

  // Handler para limpiar block_type si no es colegio (Task 2)
  const handleClinicChange = (val) => {
    const selected = clinics.find(c => c.id === val);
    setFormData(prev => ({
      ...prev,
      clinic_id: val,
      block_type: selected?.type === 'colegio' ? prev.block_type : '',
      patient_id: '' // Limpiar paciente seleccionado al cambiar clínica
    }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 60;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };


  const handleCompleteSession = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', slotInfo.id);

      if (error) throw error;

      toast({ title: '✅ Sesión completada' });
      onAppointmentUpdated?.();
      onOpenChange(false);
      onSessionCompleted?.(appointmentData || slotInfo);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!slotInfo?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'canceled' })
        .eq('id', slotInfo.id);
      if (error) throw error;
      toast({ title: 'Cita cancelada' });
      onAppointmentUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!slotInfo?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', slotInfo.id);
      if (error) throw error;
      toast({ title: 'Cita eliminada', description: 'La hora ha sido liberada.' });
      onAppointmentUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    onOpenChange(false);
    setAppointmentData(null);
  };

  const handleSuccess = async (newAppointment) => {
    // Reminder is auto-scheduled by DB trigger (trg_auto_schedule_reminders)
    if (isEditing) {
      onAppointmentUpdated?.();
    } else {
      onAppointmentCreated?.();
    }
    handleModalClose();
  };

  // Guardar cita con clinic_id y block_type (Task 4)
  const handleSubmitCita = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      if (!currentOrganizationId) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo determinar la organización. Selecciona una clínica.' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        therapist_id: user.id,
        patient_id: formData.patient_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        clinic_id: formData.clinic_id || null,
        organization_id: currentOrganizationId,
        block_type: formData.block_type || null,
        service_id: formData.service_id || null,
        notes: formData.notes,
        duration_minutes: calculateDuration(formData.start_time, formData.end_time)
      };

      let savedApt;
      if (isEditing) {
        payload.status = formData.status;
        payload.duration_minutes = calculateDuration(formData.start_time, formData.end_time);

        const { data, error } = await supabase.from('appointments').update(payload).eq('id', slotInfo.id).select().single();
        if (error) throw error;
        savedApt = data;

        // Si se marcó como completada y tiene paciente, disparar flujo post-sesión
        const wasCompleted = formData.status === 'completed' && appointmentData?.status !== 'completed';
        if (wasCompleted && savedApt.patient_id && onSessionCompleted) {
          onSessionCompleted(savedApt);
        }
      } else {
        payload.status = 'scheduled';
        const { data, error } = await supabase.from('appointments').insert(payload).select().single();
        if (error) throw error;
        savedApt = data;
      }

      await handleSuccess(savedApt);
    } catch (error) {
      logger.error(error);
      const msg = error.message || '';
      let friendlyMessage = 'No se pudo guardar la cita. Intenta nuevamente.';

      if (msg.includes('Ya existe una cita en ese horario') || msg.includes('ya tiene una cita programada')) {
        friendlyMessage = 'Ya existe una cita agendada en ese horario. Por favor selecciona otro horario disponible.';
      } else if (msg.includes('horario está bloqueado')) {
        friendlyMessage = 'Este horario está bloqueado. Selecciona otro horario disponible.';
      } else if (msg.includes('fuera del horario de disponibilidad')) {
        // Detectar el día de la semana para dar mensaje específico
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const selectedDate = formData.date ? new Date(formData.date + 'T12:00:00') : null;
        const dayName = selectedDate ? dayNames[selectedDate.getDay()] : '';
        friendlyMessage = dayName
          ? `No tienes agenda configurada los días ${dayName}. Configura tu disponibilidad en "Mi Agenda" o selecciona otro día.`
          : 'No tienes agenda configurada para este día. Configura tu disponibilidad en "Mi Agenda" o selecciona otro día.';
      } else if (msg.includes('scheduled_reminders') && msg.includes('foreign key')) {
        friendlyMessage = 'Error al programar el recordatorio. El paciente no tiene un perfil asociado.';
      }

      toast({ variant: 'destructive', title: 'No se pudo agendar', description: friendlyMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isEditing) return 'Editar Cita';
    if (activeTab === 'cita') return 'Agendar Nueva Cita';
    if (activeTab === 'bloqueo') return 'Bloquear Horario';
    return 'Gestionar Horario';
  };

  const dateFormatted = slotInfo?.date ? format(parseISO(slotInfo.date), 'EEEE dd/MM/yyyy', { locale: es }) : '';
  const timeFormatted = `${slotInfo?.startTime || ''}${slotInfo?.endTime ? ` - ${slotInfo.endTime}` : ''}`;

  const renderCitaForm = () => (
    <form id="appointment-form" onSubmit={handleSubmitCita} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>Inicio</Label>
            <Input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lugar de atención</Label>
        <Select value={formData.clinic_id} onValueChange={handleClinicChange} required>
          <SelectTrigger>
            <SelectValue placeholder={loadingClinics ? "Cargando..." : "Selecciona clínica"} />
          </SelectTrigger>
          <SelectContent>
            {clinics.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {clinics.find(c => c.id === formData.clinic_id)?.type === 'colegio' && (
        <div className="space-y-2">
          <Label>Tipo de bloque</Label>
          <Select value={formData.block_type} onValueChange={v => setFormData({...formData, block_type: v})} required>
            <SelectTrigger><SelectValue placeholder="Selecciona tipo de bloque" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aula_recursos">Aula de Recursos</SelectItem>
              <SelectItem value="trabajo_colaborativo">Trabajo Colaborativo</SelectItem>
              <SelectItem value="coordinacion">Coordinación</SelectItem>
              <SelectItem value="preparacion_material">Preparación de Material</SelectItem>
              <SelectItem value="informe">Informe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Paciente</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={formData.patient_id} onValueChange={v => setFormData({...formData, patient_id: v})} required>
              <SelectTrigger>
                <SelectValue placeholder={loadingPatients ? "Cargando..." : "Selecciona paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.profile?.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Nuevo paciente"
            onClick={() => setIsNewPatientModalOpen(true)}
          >
            <User className="h-4 w-4" />
            <span className="sr-only">Nuevo paciente</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Servicio (Opcional)</Label>
        <Select value={formData.service_id || 'none'} onValueChange={v => setFormData({...formData, service_id: v === 'none' ? '' : v})}>
          <SelectTrigger><SelectValue placeholder="Selecciona servicio" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin servicio</SelectItem>
            {services.map(s => <SelectItem key={s.id} value={s.id}>{s.service_name || s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label>Estado de la cita</Label>
          <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programada</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="no-show">No Asistió</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notas adicionales..." className="resize-none h-20" />
      </div>
      
      <button type="submit" id="appointment-form-submit" className="hidden" />
    </form>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {dateFormatted} • {timeFormatted}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {isEditing ? (
              <div className="px-6 py-4">
                {appointmentData ? renderCitaForm() : (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cita" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Cita
                    </TabsTrigger>
                    <TabsTrigger value="bloqueo" className="flex items-center gap-2">
                      <Ban className="h-4 w-4" /> Bloquear
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="px-6 py-4">
                  <TabsContent value="cita" className="mt-0">
                    {renderCitaForm()}
                  </TabsContent>
                  <TabsContent value="bloqueo" className="mt-0">
                    <BlockTimeForm
                      slotInfo={slotInfo}
                      clinics={clinics}
                      onSuccess={handleSuccess}
                      setIsSubmitting={setIsSubmitting}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="p-6 pt-0 flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {isEditing && formData.patient_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleModalClose();
                  navigate(`/dashboard/patients/${formData.patient_id}`);
                }}
              >
                <FileText className="h-4 w-4 mr-2" /> Ver Ficha
              </Button>
            )}
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={isSubmitting}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
          <Button
            disabled={isSubmitting}
            className={isEditing ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => {
              if (isEditing || activeTab === 'cita') {
                document.getElementById('appointment-form-submit')?.click();
              } else {
                document.getElementById('block-time-submit')?.click();
              }
            }}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Confirmar')}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmación de eliminación */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cita</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará la cita y se liberará el horario de forma permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDeleteAppointment}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Modal para crear paciente nuevo */}
    <PatientModal
      isOpen={isNewPatientModalOpen}
      onOpenChange={setIsNewPatientModalOpen}
      onSave={(newPatient) => {
        // Agregar el nuevo paciente a la lista y seleccionarlo
        if (newPatient?.id) {
          setPatients(prev => [...prev, {
            id: newPatient.id,
            profile: { full_name: newPatient.full_name || newPatient.profile?.full_name },
          }]);
          setFormData(prev => ({ ...prev, patient_id: newPatient.id }));
        }
        setIsNewPatientModalOpen(false);
      }}
    />
    </>
  );
};

export default AppointmentModal;
