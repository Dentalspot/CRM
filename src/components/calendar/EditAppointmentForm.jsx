import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { format, parseISO } from 'date-fns';
import BoxSelector from '@/components/calendar/BoxSelector';

const AppointmentStatusBadge = ({ status }) => {
  const statusStyles = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    canceled: 'bg-red-100 text-red-800 border-red-200',
    'no-show': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const statusText = {
    scheduled: 'Programada',
    completed: 'Completada',
    canceled: 'Cancelada',
    'no-show': 'No Asistió',
  };

  return (
    <Badge className={cn('font-medium border', statusStyles[status])}>
      {statusText[status] || 'Desconocido'}
    </Badge>
  );
};

const EditAppointmentForm = ({ appointment, onSuccess, onSessionCompleted, setIsSubmitting, onCloseModal }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    status: appointment.status,
    notes: appointment.notes || '',
    box_id: appointment.box_id || null,
  });

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Cargar servicios
  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;

      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('therapist_services')
          .select('id, service_name, duration_minutes')
          .eq('therapist_id', user.id)
          .eq('is_active', true);

        if (error) throw error;
        
        const formatted = data.map(s => ({
            id: s.id,
            name: s.service_name,
            duration_minutes: s.duration_minutes
        }));
        setServices(formatted || []);
      } catch (error) {
        logger.error('Error cargando servicios:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [user]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoToPatientFile = () => {
    const patientId = appointment.patient_id || appointment.patient?.id;
    if (patientId) {
      if (onCloseModal) onCloseModal();
      navigate(`/dashboard/patients/${patientId}`);
    }
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);

    try {
      const updateData = {
        status: formData.status,
        notes: formData.notes,
        box_id: formData.box_id,
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);

      if (error) {
        // Mapear códigos del trigger trg_check_appointment_box a mensajes amigables
        let msg = error.message;
        if (msg.includes('box_double_booking')) {
          msg = 'Ya hay una cita programada en ese box que se superpone con este horario. Elige otro box o cambia el horario.';
        } else if (msg.includes('box_inactive')) {
          msg = 'El box seleccionado está marcado como inactivo.';
        } else if (msg.includes('box_wrong_clinic') || msg.includes('box_not_found')) {
          msg = 'El box seleccionado no pertenece a esta clínica.';
        }
        throw new Error(msg);
      }

      toast({
        title: '¡Éxito!',
        description: 'La cita ha sido actualizada correctamente.'
      });

      // Si se marcó como completada y tiene paciente, disparar flujo post-sesión
      const wasCompleted = formData.status === 'completed' && appointment.status !== 'completed';
      if (wasCompleted && appointment.patient_id && onSessionCompleted) {
        onSessionCompleted(appointment);
      }

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: `No se pudo actualizar la cita: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateFormatted = appointment.date ? format(parseISO(appointment.date), 'dd/MM/yyyy') : 'N/A';
  const hasPatient = appointment.patient_id || appointment.patient?.id;

  return (
    <div className="space-y-4">
      {/* Información del Paciente */}
      <div className="bg-gradient-to-r from-primary to-purple-50 rounded-lg p-4 border border-primary">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#ff74c3]" />
              <span className="font-semibold text-gray-900">
                {appointment.patient?.full_name || appointment.patients?.full_name || 'Sin paciente'}
              </span>
            </div>

            {(appointment.patient?.email || appointment.patients?.email) && (
              <p className="text-sm text-gray-600 pl-7">
                📧 {appointment.patient?.email || appointment.patients?.email}
              </p>
            )}

            {(appointment.patient?.phone || appointment.patients?.phone) && (
              <p className="text-sm text-gray-600 pl-7">
                📱 {appointment.patient?.phone || appointment.patients?.phone}
              </p>
            )}
          </div>

          {/* Botón Ver Ficha */}
          {hasPatient && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToPatientFile}
              className="flex items-center gap-2 bg-white hover:bg-primary border-primary text-[#ff74c3] hover:text-[#ff74c3]"
            >
              <FileText className="h-4 w-4" />
              Ver Ficha
            </Button>
          )}
        </div>
      </div>

      {/* Detalles de la Cita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 uppercase">Fecha</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">{dateFormatted}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-500 uppercase">Horario</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">
              {appointment.start_time} - {appointment.end_time}
            </span>
          </div>
        </div>
      </div>

      {/* Clínica */}
      {appointment.clinic_id && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 uppercase">Ubicación</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">
              {appointment.clinics?.name || 'Clínica no especificada'}
            </span>
          </div>
        </div>
      )}

      {/* Box / Sala — selector reasignable. Trigger DB valida overlap. */}
      {appointment.clinic_id && (
        <BoxSelector
          clinicId={appointment.clinic_id}
          value={formData.box_id}
          onChange={(boxId) => handleChange('box_id', boxId)}
        />
      )}

      {/* Estado de la Cita */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="status">Estado de la Cita</Label>
          <AppointmentStatusBadge status={formData.status} />
        </div>
        <Select
          onValueChange={(value) => handleChange('status', value)}
          value={formData.status}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Cambiar estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Programada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="canceled">Cancelada</SelectItem>
            <SelectItem value="no-show">No Asistió</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas de la Cita</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Agrega notas sobre la cita, observaciones, etc..."
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">
          Las notas son privadas y solo tú puedes verlas.
        </p>
      </div>

      {/* Información del Servicio */}
      {appointment.service_id && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <Label className="text-xs text-gray-500 uppercase mb-2 block">
            Servicio Asignado
          </Label>
          {loadingServices ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Cargando...</span>
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-900">
              {services.find(s => s.id === appointment.service_id)?.name || 'Servicio no encontrado'}
            </div>
          )}
        </div>
      )}

      <button
        id="edit-appointment-submit"
        onClick={handleSaveChanges}
        className="hidden"
      >
        Submit
      </button>
    </div>
  );
};

export default EditAppointmentForm;