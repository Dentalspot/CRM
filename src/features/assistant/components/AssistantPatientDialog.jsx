import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createPatientAsAssistant, updatePatientAdmin } from '../api/assistantPatientApi';

const AssistantPatientDialog = ({ isOpen, onOpenChange, patient, organizationId, onSaved }) => {
  const { toast } = useToast();
  const isEditing = !!patient;
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    rut: '',
    phone: '',
    email: '',
    address: '',
    patient_type: 'privado',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name || '',
        rut: patient.rut || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        patient_type: patient.patient_type || 'privado',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
      });
    } else {
      setForm({
        full_name: '', rut: '', phone: '', email: '', address: '',
        patient_type: 'privado', emergency_contact_name: '', emergency_contact_phone: '',
      });
    }
  }, [patient, isOpen]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Nombre obligatorio' });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await updatePatientAdmin(patient.id, form);
        toast({ title: 'Paciente actualizado' });
      } else {
        if (!organizationId) {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo determinar la organización.' });
          setSubmitting(false);
          return;
        }
        await createPatientAsAssistant({
          organizationId,
          fullName: form.full_name,
          rut: form.rut,
          phone: form.phone,
          email: form.email,
          patientType: form.patient_type,
        });
        toast({ title: 'Paciente creado correctamente' });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Nombre completo *</Label>
              <Input value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} placeholder="Nombre y apellidos" />
            </div>

            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={form.rut} onChange={e => handleChange('rut', e.target.value)} placeholder="12.345.678-9" />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+569 1234 5678" />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="correo@ejemplo.com" />
            </div>

            <div className="space-y-2">
              <Label>Previsión</Label>
              <Select value={form.patient_type} onValueChange={v => handleChange('patient_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="privado">Privado</SelectItem>
                  <SelectItem value="fonasa">Fonasa</SelectItem>
                  <SelectItem value="convenio">Convenio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="Dirección del paciente" />
            </div>

            <div className="space-y-2">
              <Label>Contacto emergencia</Label>
              <Input value={form.emergency_contact_name} onChange={e => handleChange('emergency_contact_name', e.target.value)} placeholder="Nombre" />
            </div>

            <div className="space-y-2">
              <Label>Tel. emergencia</Label>
              <Input value={form.emergency_contact_phone} onChange={e => handleChange('emergency_contact_phone', e.target.value)} placeholder="+569..." />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isEditing ? 'Guardar cambios' : 'Crear paciente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssistantPatientDialog;
