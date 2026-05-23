/**
 * @file src/components/calendar/assistant/AssistantAppointmentModal.jsx
 *
 * Modal para crear/editar citas desde la vista del asistente.
 * Soporta dos modos:
 * - CREATE: prefilledSlot tiene {date, startTime, endTime, therapistId} desde drag
 * - EDIT: appointmentId tiene id de cita existente, pre-carga datos
 *
 * Side effects:
 * - Audit log (clinical_audit_log) en create/edit/cancel vía logClinicalAccess
 * - Optimistic update via callbacks onCreated / onUpdated
 *
 * Ver spec 024 US2 + US4 + FR-008 a FR-021.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, User, Phone, Mail, AlertTriangle, Save } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import useDebounce from '@/hooks/useDebounce';
import { supabase } from '@/lib/supabaseClient';
import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';
import logger from '@/lib/utils/logger';
import BoxSelector from '@/components/calendar/BoxSelector';
import TimePicker from '@/components/ui/time-picker';

import {
  createOrgAppointment,
  updateOrgAppointment,
  searchOrgPatients,
  getOrgServicesForTherapist,
} from '@/lib/api/org.api';

// Schema appointments.status IN ('scheduled','confirmed','completed','cancelled','no-show')
// (migration 20260424000003 reagregó 'confirmed' después de haberse removido en 20260414000004).
// Colores en grid los maneja WeeklyAgendaView:
//   scheduled=blanco/gris · confirmed=azul · completed=verde · cancelled=rojo · no-show=café/amber
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no-show', label: 'Ausente' },
];

const AssistantAppointmentModal = ({
  isOpen,
  onClose,
  prefilledSlot = null,     // { date, startTime, endTime, therapistId }
  appointmentId = null,     // presente si estamos en edit mode
  organizationId,
  clinicId,
  onCreated,
  onUpdated,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const isEditMode = Boolean(appointmentId);

  // Form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null); // { id, profile_id, full_name, email, phone }
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Search + services state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Box (sala/sillón) opcional. Null = sin box específico. Trigger DB
  // valida overlap + box pertenece a la clinic + box activo.
  const [boxId, setBoxId] = useState(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAppointment, setLoadingAppointment] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null); // para detectar cancel en edit

  // Initialize desde prefilledSlot o appointmentId
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && appointmentId) {
      // EDIT: fetch appointment
      setLoadingAppointment(true);
      supabase
        .from('appointments')
        .select(`
          id, therapist_id, patient_id, service_id, box_id, date, start_time, end_time, status, notes,
          patient:patients!appointments_patient_id_fkey(
            id, profile_id, profile:profiles!patients_profile_id_fkey(full_name, email, phone)
          )
        `)
        .eq('id', appointmentId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) {
            toast({
              variant: 'destructive',
              title: 'Error al cargar la cita',
              description: error?.message || 'No se encontró la cita.',
            });
            onClose();
            return;
          }
          setDate(data.date);
          setStartTime(data.start_time?.slice(0, 5) || '');
          setEndTime(data.end_time?.slice(0, 5) || '');
          setTherapistId(data.therapist_id);
          setStatus(data.status || 'scheduled');
          setOriginalStatus(data.status || 'scheduled');
          setNotes(data.notes || '');
          setSelectedServiceId(data.service_id || '');
          setBoxId(data.box_id || null);
          if (data.patient) {
            setSelectedPatient({
              id: data.patient.id,
              profile_id: data.patient.profile_id,
              full_name: data.patient.profile?.full_name || 'Sin nombre',
              email: data.patient.profile?.email,
              phone: data.patient.profile?.phone,
            });
          }
        })
        .finally(() => setLoadingAppointment(false));
    } else if (prefilledSlot) {
      // CREATE: prellenar desde drag
      setDate(prefilledSlot.date);
      setStartTime(prefilledSlot.startTime);
      setEndTime(prefilledSlot.endTime);
      setTherapistId(prefilledSlot.therapistId);
      setStatus('scheduled');
      setOriginalStatus(null);
      setNotes('');
      setSelectedPatient(null);
      setSelectedServiceId('');
      setBoxId(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen, isEditMode, appointmentId, prefilledSlot, toast, onClose]);

  // Fetch servicios del dentista cuando cambia therapistId
  useEffect(() => {
    if (!isOpen || !therapistId) return;
    setLoadingServices(true);
    getOrgServicesForTherapist(therapistId)
      .then((svcs) => setServices(svcs))
      .catch((err) => {
        logger.warn('Error fetching services:', err);
        setServices([]);
      })
      .finally(() => setLoadingServices(false));
  }, [isOpen, therapistId]);

  // Audit log al abrir modal en edit mode (apertura de ficha administrativa del paciente)
  useEffect(() => {
    if (!isOpen || !isEditMode || !selectedPatient?.id || !user?.id || !organizationId) return;
    // Invocamos imperativamente (no useClinicalAccessLogger hook) para tener control del timing
    logClinicalAccess({
      organization_id: organizationId,
      user_id: user.id,
      patient_id: selectedPatient.id,
      action: 'view',
      resource_type: 'appointment',
      resource_id: appointmentId || null,
      grant_id: null,
      reason: null,
      ip_address: null,
    }).catch((err) => logger.warn('audit log view failed:', err));
  }, [isOpen, isEditMode, selectedPatient?.id, appointmentId, user?.id, organizationId]);

  // Search de pacientes (debounced)
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    let mounted = true;
    setIsSearching(true);
    searchOrgPatients(organizationId, debouncedSearch)
      .then((results) => {
        if (!mounted) return;
        setSearchResults(results);
        setShowDropdown(true);
      })
      .catch((err) => {
        logger.warn('searchOrgPatients failed:', err);
      })
      .finally(() => {
        if (mounted) setIsSearching(false);
      });
    return () => { mounted = false; };
  }, [debouncedSearch, organizationId]);

  const handleSelectPatient = useCallback((p) => {
    setSelectedPatient(p);
    setSearchTerm('');
    setShowDropdown(false);
  }, []);

  // Validaciones
  // Nota: el warning de "sin servicios" NO bloquea submit — service_id es nullable
  // en DB y es un caso de uso real crear cita con "Sin servicio asignado" (ej:
  // cita de control, urgencia, evaluación inicial sin categorizar).
  const hasNoServices = services.length === 0 && !loadingServices && therapistId;
  const canSubmit = useMemo(() => {
    if (!selectedPatient || !date || !startTime || !endTime || !therapistId) return false;
    if (endTime <= startTime) return false;
    return !isSubmitting;
  }, [selectedPatient, date, startTime, endTime, therapistId, isSubmitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // EDIT: update appointment
        const changes = {
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          status,
          notes: notes || null,
          service_id: selectedServiceId || null,
          box_id: boxId || null,
          patient_id: selectedPatient.id,
        };
        const updated = await updateOrgAppointment(appointmentId, changes);

        // Audit log: edit o cancel según cambio
        const action = status !== originalStatus && status === 'cancelled'
          ? 'cancel'
          : 'update';
        await logClinicalAccess({
          organization_id: organizationId,
          user_id: user.id,
          patient_id: selectedPatient.id,
          action,
          resource_type: 'appointment',
          resource_id: appointmentId,
          grant_id: null,
          reason: null,
          ip_address: null,
        });

        toast({ title: '✅ Cita actualizada' });
        onUpdated?.(updated);
        onClose();
      } else {
        // CREATE
        const payload = {
          organization_id: organizationId,
          clinic_id: clinicId,
          therapist_id: therapistId,
          patient_id: selectedPatient.id,
          service_id: selectedServiceId || null,
          box_id: boxId || null,
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          status: 'scheduled',
          notes: notes || null,
        };
        const created = await createOrgAppointment(payload);

        // Audit log: create appointment
        await logClinicalAccess({
          organization_id: organizationId,
          user_id: user.id,
          patient_id: selectedPatient.id,
          action: 'create',
          resource_type: 'appointment',
          resource_id: created.id,
          grant_id: null,
          reason: null,
          ip_address: null,
        });

        toast({ title: '✅ Cita creada', description: `${selectedPatient.full_name} — ${date} ${startTime}` });
        onCreated?.(created);
        onClose();
      }
    } catch (err) {
      logger.error('Error submitting appointment:', err);
      // Mapeo de códigos del trigger trg_check_appointment_box
      let desc = err.message || 'Verifica los datos e intenta de nuevo.';
      if (desc.includes('box_double_booking')) {
        desc = 'Ya hay una cita en ese box que se superpone con este horario.';
      } else if (desc.includes('box_inactive')) {
        desc = 'El box seleccionado está marcado como inactivo.';
      } else if (desc.includes('box_wrong_clinic') || desc.includes('box_not_found')) {
        desc = 'El box seleccionado no pertenece a esta clínica.';
      }
      toast({
        variant: 'destructive',
        title: isEditMode ? 'Error al actualizar cita' : 'Error al crear cita',
        description: desc,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAppointment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los datos de la cita existente.'
              : 'Completa los datos para agendar una nueva cita.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha + horas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Desde</Label>
              <TimePicker value={startTime} onChange={setStartTime} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <TimePicker value={endTime} onChange={setEndTime} />
            </div>
          </div>

          {/* Paciente */}
          <div className="space-y-1.5 relative">
            <Label className="text-xs">Paciente *</Label>
            {selectedPatient ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-md border bg-slate-50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{selectedPatient.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[selectedPatient.email, selectedPatient.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">Buscando...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">Sin resultados</div>
                    ) : (
                      searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left p-2.5 hover:bg-slate-50 border-b last:border-b-0"
                        >
                          <div className="text-sm font-medium">{p.full_name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {p.email && <><Mail className="h-3 w-3" />{p.email}</>}
                            {p.phone && <><Phone className="h-3 w-3" />{p.phone}</>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Servicio */}
          <div className="space-y-1.5">
            <Label className="text-xs">Servicio</Label>
            {hasNoServices ? (
              <div className="flex items-start gap-2 p-2.5 rounded-md border border-amber-200 bg-amber-50 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  Este dentista no tiene servicios configurados. Contactalo para que los defina antes de agendar.
                </div>
              </div>
            ) : (
              <Select value={selectedServiceId || 'none'} onValueChange={(v) => setSelectedServiceId(v === 'none' ? '' : v)} disabled={loadingServices}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingServices ? 'Cargando...' : 'Sin servicio asignado'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin servicio asignado</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.price_clp ? `· $${s.price_clp.toLocaleString('es-CL')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Box / Sala (opcional) — trigger DB valida overlap */}
          <BoxSelector
            clinicId={clinicId}
            value={boxId}
            onChange={setBoxId}
          />

          {/* Estado (solo en edit) */}
          {isEditMode && (
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notas administrativas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Primera visita, trae radiografías..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{isEditMode ? 'Guardar cambios' : 'Crear cita'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssistantAppointmentModal;
