import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Phone, Mail, User, Info } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@/hooks/useDebounce';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import useActivePlanLimits from '@/hooks/useActivePlanLimits';
import UpgradeModal from '@/components/modals/UpgradeModal';
import logger from "@/lib/utils/logger";
import {
  searchPatientsForAgenda,
  createAndAssociatePatient,
} from '@/lib/patientApi';

const NewAppointmentForm = ({ slotInfo, clinics, onSuccess, setIsSubmitting }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentOrganizationId } = useCurrentOrganization();
  const { canCreate, currentPlan } = useActivePlanLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', email: '', phone: '' });
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState([]);

  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);

  const debouncedSearch = useDebounce(patientSearchTerm, 300);

  // Password ya no se deriva del teléfono — se genera aleatoria server-side
  // y se envía al paciente vía email (send-patient-welcome edge function).

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('therapist_services')
          .select('id, service_name, duration_minutes')
          .eq('therapist_id', user.id)
          .eq('is_active', true);

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        logger.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, [user]);

  // Search patients
  useEffect(() => {
    const handleSearch = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchedPatients([]);
        return;
      }
      setIsLoadingPatients(true);
      try {
        const data = await searchPatientsForAgenda(user.id, debouncedSearch);
        setSearchedPatients(data);
      } catch (error) {
        logger.error('Error searching patients:', error);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    if (!selectedPatient) {
      handleSearch();
    }
  }, [debouncedSearch, user?.id, selectedPatient]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.full_name);
    setSearchedPatients([]);
  };

  const handleCreateNewPatient = async () => {
    if (!newPatient.full_name?.trim()) return toast({ variant: 'destructive', title: 'Error', description: 'Nombre obligatorio.' });
    if (!newPatient.email?.trim()) return toast({ variant: 'destructive', title: 'Error', description: 'Email obligatorio.' });
    
    setCreatingPatient(true);
    setIsSubmitting(true);

    try {
      const result = await createAndAssociatePatient(user.id, {
        full_name: newPatient.full_name,
        email: newPatient.email,
        phone: newPatient.phone
      });

      if (result.success) {
        toast({
          title: result.isNew ? '✅ Paciente creado' : '✅ Paciente vinculado',
          description: result.isNew ? `Cuenta creada para ${result.full_name}` : result.message
        });

        handlePatientSelect({
          id: result.id,
          profile_id: result.profile_id,
          full_name: result.full_name,
          email: result.email,
        });
        setShowNewPatientForm(false);
        setNewPatient({ full_name: '', email: '', phone: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setCreatingPatient(false);
      setIsSubmitting(false);
    }
  };

  const handleSaveAppointment = async () => {
    if (!selectedPatient?.id) {
      toast({ variant: 'destructive', title: 'Falta Paciente', description: 'Selecciona o crea un paciente.' });
      return;
    }

    if (!slotInfo.date || !slotInfo.startTime) {
      toast({ variant: 'destructive', title: 'Error de fecha', description: 'Falta información de fecha/hora.' });
      return;
    }

    setIsSubmitting(true);

    // Spec 022 Phase E — Enforcement UX: bloquear si plan alcanzó límite mensual de citas
    // NOTA edge case: RPC check_plan_limit cuenta citas del MES ACTUAL. Si el usuario
    // programa recurrentes que span varios meses, el guard pasa cuando el mes actual
    // tiene cupo pero podría exceder el límite en el mes calendario donde caen.
    // Riesgo aceptado en MVP — el exceso es small y el RPC es fail-safe OPEN.
    const allowed = await canCreate('appointment');
    if (!allowed) {
      setIsSubmitting(false);
      setShowUpgradeModal(true);
      return;
    }

    try {
      // Robust Date Parsing
      let baseDate;
      if (slotInfo.date instanceof Date) {
        baseDate = slotInfo.date;
      } else {
        // If it's a string, parse it
        baseDate = parse(slotInfo.date, 'yyyy-MM-dd', new Date());
      }

      if (!isValid(baseDate)) throw new Error("Fecha inválida.");

      // Calculate end time
      const selectedService = services.find(s => s.id === serviceId);
      const duration = selectedService ? selectedService.duration_minutes : 30;
      
      const startDateTime = parse(slotInfo.startTime, 'HH:mm', baseDate);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      const endTime = format(endDateTime, 'HH:mm');

      const validServiceId = serviceId && serviceId !== 'none' ? serviceId : null;
      const clinicId = slotInfo.clinicId || (clinics.length > 0 ? clinics[0].id : null);

      if (!currentOrganizationId) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo determinar la organización. Selecciona una en el menú superior.' });
        return;
      }

      const appointmentsToInsert = [];
      const numAppointments = isRecurring ? recurrenceWeeks : 1;

      for (let i = 0; i < numAppointments; i++) {
        const appointmentDate = new Date(baseDate);
        appointmentDate.setDate(appointmentDate.getDate() + (i * 7));

        appointmentsToInsert.push({
          patient_id: selectedPatient.id,
          therapist_id: user.id,
          clinic_id: clinicId,
          organization_id: currentOrganizationId,
          service_id: validServiceId,
          date: format(appointmentDate, 'yyyy-MM-dd'),
          start_time: slotInfo.startTime,
          end_time: endTime,
          notes: notes,
          status: 'scheduled',
          duration_minutes: duration,
        });
      }

      const { data: createdData, error } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert)
        .select();

      if (error) throw error;

      toast({
        title: '🗓️ Cita Agendada',
        description: isRecurring ? `${numAppointments} citas creadas exitosamente.` : 'Cita creada exitosamente.'
      });

      if (onSuccess) onSuccess(createdData?.[0]);

    } catch (error) {
      logger.error("Save error:", error);
      let msg = error.message;
      if (msg.includes('duplicate') || msg.includes('overlap') || msg.includes('double_booking')) {
        msg = "El horario seleccionado ya está ocupado.";
      }
      toast({ variant: 'destructive', title: 'Error al agendar', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* Patient Selection */}
      <div className="space-y-2">
        <Label>Paciente *</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={patientSearchTerm}
            onChange={(e) => {
              setPatientSearchTerm(e.target.value);
              setSelectedPatient(null);
            }}
            className="pl-9"
          />
          {isLoadingPatients && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Search Results */}
        {!selectedPatient && debouncedSearch && (
          <div className="border rounded-md mt-1 max-h-48 overflow-y-auto bg-white shadow-sm z-10">
            {searchedPatients.length > 0 ? (
              searchedPatients.map(patient => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
                >
                  <p className="font-medium text-sm">{patient.full_name}</p>
                  <p className="text-xs text-muted-foreground">{patient.email}</p>
                </button>
              ))
            ) : !isLoadingPatients && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No encontrado.</p>
                <Button variant="outline" size="sm" onClick={() => setShowNewPatientForm(true)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Crear nuevo
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Patient Form */}
      <AnimatePresence>
        {showNewPatientForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 mb-4">
              <h4 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Nuevo Paciente
              </h4>
              <Input
                placeholder="Nombre Completo *"
                value={newPatient.full_name}
                onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
              />
              <Input
                placeholder="Email *"
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
              />
              <div className="space-y-1">
                <Input
                  placeholder="Teléfono *"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowNewPatientForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreateNewPatient} disabled={creatingPatient}>
                  {creatingPatient ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service */}
      <div className="space-y-2">
        <Label>Servicio</Label>
        <Select onValueChange={setServiceId} value={serviceId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin especificar</SelectItem>
            {services.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Recurrence */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
        <Label htmlFor="recurring" className="font-normal cursor-pointer">Repetir semanalmente</Label>
      </div>

      {isRecurring && (
        <div className="flex items-center gap-2 ml-6">
          <Label>Por</Label>
          <Input
            type="number"
            value={recurrenceWeeks}
            onChange={(e) => setRecurrenceWeeks(Number(e.target.value))}
            className="w-16 h-8"
            min="1" max="12"
          />
          <Label>semanas</Label>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalles adicionales..."
          rows={2}
        />
      </div>

      {/* Hidden Submit Trigger */}
      <button id="new-appointment-submit" type="button" onClick={handleSaveAppointment} className="hidden" />
    </div>

    {/* Spec 022 Phase E — Modal de upgrade cuando alcanza límite de citas/mes */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      featureName="más citas por mes"
      requiredPlan="pro"
      currentPlan={currentPlan}
    />
    </>
  );
};

export default NewAppointmentForm;