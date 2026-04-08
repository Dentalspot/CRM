import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Activity, Calendar, Clock, Save, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { logActivityToDatabase } from '@/features/progress/api/progressAnalysisApi';
import logger from '@/lib/utils/logger';
import { format } from 'date-fns';

const ActivityLogModal = ({ isOpen, onClose, patientId, therapistId, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    activity_type: 'exercise',
    completion_date: format(new Date(), 'yyyy-MM-dd HH:mm'),
    duration_minutes: 15,
    score: 50,
    notes: ''
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        activity_type: 'exercise',
        completion_date: format(new Date(), 'yyyy-MM-dd HH:mm'),
        duration_minutes: 15,
        score: 50,
        notes: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const logData = {
        patient_id: patientId,
        therapist_id: therapistId,
        activity_type: formData.activity_type,
        completion_date: new Date(formData.completion_date).toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        score: parseInt(formData.score),
        notes: formData.notes
      };

      await logActivityToDatabase(logData);
      
      toast({ 
        title: "Actividad registrada", 
        description: "Los datos se han guardado para el análisis de progreso." 
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      logger.error('Error logging activity:', error);
      toast({ 
        variant: "destructive", 
        title: "Error al registrar", 
        description: "No se pudo guardar la actividad." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-700">
            <Activity className="h-5 w-5" />
            Registrar Actividad (IA)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Actividad</Label>
              <Select 
                value={formData.activity_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, activity_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exercise">Ejercicio</SelectItem>
                  <SelectItem value="session">Sesión Terapéutica</SelectItem>
                  <SelectItem value="evaluation">Evaluación</SelectItem>
                  <SelectItem value="homework">Tarea Hogar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha y Hora</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="datetime-local" 
                  className="pl-10"
                  value={formData.completion_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración (minutos)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  type="number" 
                  min="1"
                  className="pl-10"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Puntaje / Logro</Label>
                <span className="text-xs font-bold text-teal-600">{formData.score}%</span>
              </div>
              <Slider 
                value={[formData.score]} 
                max={100} 
                step={5} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, score: val[0] }))}
                className="py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas u Observaciones</Label>
            <Textarea 
              placeholder="Desempeño del paciente, dificultades, etc."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700">
              {loading ? "Guardando..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityLogModal;