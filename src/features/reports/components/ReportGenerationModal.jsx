import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const ReportGenerationModal = ({ 
  isOpen, 
  onClose, 
  hookData,
  fixedPatientId = null // New prop to pre-select and lock patient
}) => {
  const {
    patients,
    appointments,
    templates,
    selectedPatient,
    selectedAppointment,
    selectedTemplate,
    handlePatientSelect,
    handleAppointmentSelect,
    handleTemplateSelect,
    setStep,
    isLoading,
    fetchPatients
  } = hookData;

  // Initial fetch
  useEffect(() => {
    if (isOpen && patients.length === 0) {
      fetchPatients();
    }
  }, [isOpen, fetchPatients, patients.length]);

  // Handle fixed patient selection
  useEffect(() => {
    if (isOpen && fixedPatientId && patients.length > 0) {
      // Only select if not already selected or different
      if (selectedPatient?.id !== fixedPatientId) {
        handlePatientSelect(fixedPatientId);
      }
    }
  }, [isOpen, fixedPatientId, patients, selectedPatient, handlePatientSelect]);

  const handleNext = () => {
    if (selectedPatient && selectedTemplate) {
      setStep(2); // Move to Form Step
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generar Nuevo Informe</DialogTitle>
          <DialogDescription>
            Selecciona el paciente, la sesión (opcional) y el tipo de informe para comenzar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          
          {/* Patient Select */}
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select 
              value={selectedPatient?.id} 
              onValueChange={handlePatientSelect}
              disabled={isLoading || !!fixedPatientId} // Disable if fixed
            >
              <SelectTrigger id="patient">
                <SelectValue placeholder={isLoading ? "Cargando..." : "Seleccionar paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.rut ? `(${p.rut})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Appointment Select (Optional but context-aware) */}
          <div className="space-y-2">
            <Label htmlFor="appointment">Sesión / Cita (Opcional)</Label>
            <Select 
              value={selectedAppointment?.id} 
              onValueChange={handleAppointmentSelect}
              disabled={!selectedPatient || isLoading || appointments.length === 0}
            >
              <SelectTrigger id="appointment">
                <SelectValue placeholder={
                  !selectedPatient 
                    ? "Selecciona un paciente primero" 
                    : appointments.length === 0 
                      ? "Sin citas recientes" 
                      : "Seleccionar sesión"
                } />
              </SelectTrigger>
              <SelectContent>
                {appointments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.date} - {a.start_time} ({a.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Select */}
          <div className="space-y-2">
            <Label htmlFor="template">Tipo de Informe *</Label>
            <Select 
              value={selectedTemplate?.id} 
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTemplate.description}
              </p>
            )}
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleNext} 
            disabled={!selectedPatient || !selectedTemplate || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportGenerationModal;