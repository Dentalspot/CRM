import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Save,
  X,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TimePicker from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { createClinicalEntry, updateClinicalEntry } from '@/lib/clinicalPlanningApi';
import { logActivityToDatabase } from '@/features/progress/api/progressAnalysisApi';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

// Constantes para las opciones del formulario
const ENTRY_TYPE_OPTIONS = [
  { value: 'evaluacion_inicial', label: 'Evaluación Inicial' },
  { value: 'evaluacion_seguimiento', label: 'Evaluación de Seguimiento' },
  { value: 'evaluacion_alta', label: 'Evaluación de Alta' },
  { value: 'anamnesis', label: 'Anamnesis' },
  { value: 'sesion_terapia', label: 'Sesión de Terapia' },
  { value: 'sesion_control', label: 'Sesión de Control' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'informe_clinico', label: 'Informe Clínico' },
  { value: 'informe_evolucion', label: 'Informe de Evolución' },
  { value: 'nota_clinica', label: 'Nota Clínica' },
  { value: 'plan_tratamiento', label: 'Plan de Tratamiento' },
];

const SESSION_STATE_OPTIONS = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_show', label: 'No asistió' },
];

const CARE_CONTEXT_OPTIONS = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'online', label: 'Teleconsulta' },
  { value: 'escolar', label: 'Contexto Escolar' },
  { value: 'hospitalario', label: 'Hospitalario' },
];

const ClinicalEntryModal = ({ 
  isOpen, 
  onClose, 
  entry = null, 
  patientId, 
  onSave 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(new Date());
  const [logToAi, setLogToAi] = useState(true);
  const [score, setScore] = useState(50); // For AI logging

  // Configuración del formulario
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      entry_type: 'nota_clinica',
      summary: '',
      session_notes: '',
      duration_minutes: 45,
      session_state: 'completed',
      care_context: 'consulta',
      caregiver_present: false,
      risk_flag: false,
    }
  });

  const watchEntryType = watch('entry_type');
  
  // Show score field only for relevant types
  const shouldShowScore = ['sesion_terapia', 'sesion_control', 'evaluacion_inicial', 'evaluacion_seguimiento'].includes(watchEntryType);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (entry) {
      setValue('entry_type', entry.entry_type);
      setValue('summary', entry.summary || '');
      setValue('session_notes', entry.session_notes || entry.details?.notes || '');
      setValue('duration_minutes', entry.duration_minutes || 45);
      setValue('session_state', entry.session_state || entry.status || 'completed');
      setValue('care_context', entry.care_context || entry.details?.location_type || 'consulta');
      setValue('caregiver_present', entry.caregiver_present || false);
      setValue('risk_flag', entry.risk_flag || false);
      
      if (entry.entry_date) {
        setDate(new Date(entry.entry_date));
      }
      setLogToAi(false); // Don't re-log by default on edit
    } else {
      // Resetear para nueva entrada
      reset({
        entry_type: 'nota_clinica',
        summary: '',
        session_notes: '',
        duration_minutes: 45,
        session_state: 'completed',
        care_context: 'consulta',
        caregiver_present: false,
        risk_flag: false,
      });
      setDate(new Date());
      setLogToAi(true);
      setScore(70);
    }
  }, [entry, setValue, reset, isOpen]);

  // Manejador de envío
  const onSubmit = async (data) => {
    if (!patientId || !user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Falta información de sesión o paciente."
      });
      return;
    }

    setIsLoading(true);

    try {
      // Preparar objeto de datos
      const entryData = {
        patient_id: patientId,
        therapist_id: user.id,
        entry_type: data.entry_type,
        entry_date: date.toISOString(),
        summary: data.summary,
        session_notes: data.session_notes,
        duration_minutes: parseInt(data.duration_minutes),
        session_state: data.session_state,
        care_context: data.care_context,
        caregiver_present: data.caregiver_present,
        risk_flag: data.risk_flag,
        // Mantener compatibilidad con estructura antigua si es necesario
        details: {
          notes: data.session_notes,
          location_type: data.care_context,
          duration: parseInt(data.duration_minutes)
        }
      };

      if (entry?.id) {
        // Actualizar existente
        await updateClinicalEntry(entry.id, entryData);
        toast({
          title: "Entrada actualizada",
          description: "El registro clínico ha sido actualizado correctamente."
        });
      } else {
        // Crear nuevo
        const newEntry = await createClinicalEntry(entryData);
        toast({
          title: "Entrada creada",
          description: "El registro clínico ha sido guardado correctamente."
        });

        // AUTO-LOGGING TO AI SYSTEM
        // Only log to AI if it's a new entry and logToAi is checked
        if (logToAi && shouldShowScore) {
          try {
            await logActivityToDatabase({
              patient_id: patientId,
              therapist_id: user.id,
              activity_type: data.entry_type.includes('evaluacion') ? 'evaluation' : 'session',
              activity_id: newEntry.id, // Link to clinical entry
              completion_date: date.toISOString(),
              duration_minutes: parseInt(data.duration_minutes),
              score: parseInt(score),
              notes: data.summary + '\n' + data.session_notes
            });
            toast({
              title: "Registrado en Análisis IA",
              description: "Se han guardado los datos para el seguimiento de progreso."
            });
          } catch (logError) {
            logger.error('Error auto-logging to AI:', logError);
            // Non-blocking error
          }
        }
      }

      // Notificar al padre para recargar lista
      if (onSave) onSave();
      onClose();
    } catch (error) {
      logger.error('Error saving clinical entry:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "Hubo un problema al guardar la entrada clínica."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {entry ? 'Editar Entrada Clínica' : 'Nueva Entrada Clínica'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          
          {/* Fila 1: Tipo y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_type">Tipo de Entrada</Label>
              <Select 
                onValueChange={(val) => setValue('entry_type', val)}
                defaultValue={watch('entry_type')}
              >
                <SelectTrigger id="entry_type">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>Fecha y Hora</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? (
                      format(date, "PPP HH:mm", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                  <div className="p-3 border-t">
                    <TimePicker
                      value={format(date, 'HH:mm')}
                      onChange={(v) => {
                        const [hours, minutes] = v.split(':');
                        const newDate = new Date(date);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setDate(newDate);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Fila 2: Resumen */}
          <div className="space-y-2">
            <Label htmlFor="summary">Resumen / Título <span className="text-red-500">*</span></Label>
            <Input 
              id="summary" 
              placeholder="Ej: Sesión de evaluación fonética"
              {...register('summary', { required: 'Este campo es obligatorio' })}
            />
            {errors.summary && (
              <span className="text-xs text-red-500">{errors.summary.message}</span>
            )}
          </div>

          {/* Fila 3: Detalles de contexto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="duration" 
                  type="number" 
                  className="pl-9"
                  {...register('duration_minutes', { min: 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select 
                onValueChange={(val) => setValue('session_state', val)}
                defaultValue={watch('session_state')}
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Contexto</Label>
              <Select 
                onValueChange={(val) => setValue('care_context', val)}
                defaultValue={watch('care_context')}
              >
                <SelectTrigger id="context">
                  <SelectValue placeholder="Contexto" />
                </SelectTrigger>
                <SelectContent>
                  {CARE_CONTEXT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 4: Flags */}
          <div className="flex flex-col sm:flex-row gap-4 py-2">
            <div className="flex items-center space-x-2 border p-3 rounded-md flex-1">
              <Checkbox 
                id="caregiver" 
                checked={watch('caregiver_present')}
                onCheckedChange={(checked) => setValue('caregiver_present', checked)}
              />
              <Label htmlFor="caregiver" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-blue-500" />
                Cuidador Presente
              </Label>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-md flex-1 border-red-100 bg-red-50/30">
              <Checkbox 
                id="risk" 
                checked={watch('risk_flag')}
                onCheckedChange={(checked) => setValue('risk_flag', checked)}
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <Label htmlFor="risk" className="flex items-center gap-2 cursor-pointer text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Marca de Riesgo / Alerta
              </Label>
            </div>
          </div>

          {/* SCORE SECTION - NEW FOR AI LOGGING */}
          {!entry && shouldShowScore && (
            <div className="border border-teal-200 bg-teal-50 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="logToAi" className="flex items-center gap-2 font-semibold text-teal-800 cursor-pointer">
                  <Checkbox 
                    id="logToAi" 
                    checked={logToAi}
                    onCheckedChange={setLogToAi}
                    className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  Registrar para Análisis de Progreso IA
                </Label>
                {logToAi && (
                  <span className="text-sm font-bold text-teal-700 bg-white px-2 py-1 rounded border border-teal-200">
                    Puntaje: {score}%
                  </span>
                )}
              </div>
              
              {logToAi && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-teal-600 mb-2">
                    <span>Bajo desempeño</span>
                    <span>Logro de objetivos</span>
                  </div>
                  <Slider 
                    value={[score]} 
                    max={100} 
                    step={5} 
                    onValueChange={(val) => setScore(val[0])}
                    className="py-2"
                  />
                  <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Este puntaje se usará para generar gráficos de evolución.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fila 5: Notas detalladas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas de la Sesión / Observaciones</Label>
            <Textarea 
              id="notes" 
              placeholder="Describe detalladamente lo ocurrido en la sesión, observaciones clínicas, avances, etc."
              className="min-h-[150px] resize-y"
              {...register('session_notes')}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isLoading ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Entrada
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicalEntryModal;