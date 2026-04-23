
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, UserPlus, Link } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { createPatientAccount } from '@/services/patientAccountService';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import useActivePlanLimits from '@/hooks/useActivePlanLimits';
import UpgradeModal from '@/components/modals/UpgradeModal';

const PatientModal = ({ patient, isOpen, onOpenChange, onSave }) => {
  const { toast } = useToast();
  const { handleUpsertPatient } = usePatients();
  const { user } = useAuth();
  const { currentOrganizationId, isMultiOrg } = useCurrentOrganization();
  const { canCreate, currentPlan } = useActivePlanLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    rut: '',
    clinic_id: null,
    attention_type: 'consulta_privada'
  });

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [creationResult, setCreationResult] = useState(null);
  const isEditing = !!patient;

  useEffect(() => {
    if (isOpen && user?.id) {
      const fetchClinics = async () => {
        setLoadingClinics(true);
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, type')
          .eq('therapist_id', user.id)
          .eq('is_public', true)
          .order('name', { ascending: true });

        if (!error && data) {
          setClinics(data);
        }
        setLoadingClinics(false);
      };
      fetchClinics();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          full_name: patient.full_name || '',
          email: patient.email || '',
          phone: patient.phone || '',
          rut: patient.rut || '',
          clinic_id: patient.clinic_id || null,
          attention_type: patient.attention_type || 'consulta_privada'
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          rut: '',
          clinic_id: null,
          attention_type: 'consulta_privada'
        });
      }
      setErrors({});
      setCreationResult(null);
    }
  }, [patient, isOpen, isEditing]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!isEditing) {
      if (!formData.full_name?.trim()) {
        newErrors.full_name = 'El nombre es obligatorio';
      }
      if (!formData.rut?.trim()) {
        newErrors.rut = 'El RUT es obligatorio para generar la contraseña temporal';
      }
    } else {
      if (!formData.full_name?.trim()) {
        newErrors.full_name = 'El nombre es obligatorio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleClinicChange = (value) => {
    const selectedClinic = clinics.find(c => c.id === value);
    if (selectedClinic) {
      const attType = (FEATURE_FLAGS.PIE_ESCOLAR && selectedClinic.type === 'colegio') ? 'pie_escolar' : 'consulta_privada';
      setFormData(prev => ({
        ...prev,
        clinic_id: value,
        attention_type: attType
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor corrige los errores en el formulario."
      });
      return;
    }

    setLoading(true);

    if (isEditing) {
      // Modo editar: usar flujo existente
      const patientDataToSave = {
        ...formData,
        id: patient?.id,
        clinic_id: formData.clinic_id,
        attention_type: formData.attention_type
      };
      const success = await handleUpsertPatient(patientDataToSave);
      setLoading(false);
      if (success) {
        onOpenChange(false);
        if (onSave) onSave();
      }
    } else {
      // Modo crear: usar createPatientAccount
      try {
        if (isMultiOrg && !currentOrganizationId) {
          toast({ variant: 'destructive', title: 'Organización requerida', description: 'Selecciona una organización antes de crear pacientes.' });
          setLoading(false);
          return;
        }

        // Spec 022 Phase E — Enforcement UX: bloquear si plan alcanzó límite
        const allowed = await canCreate('patient');
        if (!allowed) {
          setLoading(false);
          setShowUpgradeModal(true);
          return;
        }

        const result = await createPatientAccount({
          therapistId: user.id,
          organizationId: currentOrganizationId,
          email: formData.email,
          fullName: formData.full_name,
          rut: formData.rut,
          phone: formData.phone
        });

        if (!result.success) throw new Error(result.message);
        setCreationResult(result);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error al crear paciente',
          description: err.message || 'No se pudo crear la cuenta del paciente.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseAfterCreation = () => {
    onOpenChange(false);
    if (onSave) onSave();
  };

  // --- Panel de confirmación post-creación ---
  if (creationResult) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Paciente creado exitosamente
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-gray-900">{formData.full_name}</p>
              <p className="text-sm text-gray-600">{formData.email}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium text-blue-800">Contraseña temporal</p>
              <p className="text-sm text-blue-700">
                Primeros 6 dígitos del RUT del paciente
              </p>
            </div>

            {creationResult.isNew ? (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <UserPlus className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Se envió un email de confirmación al paciente para activar su cuenta.</span>
              </div>
            ) : creationResult.alreadyLinked ? (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Link className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>El paciente ya tenía cuenta registrada y fue vinculado a tu lista.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Link className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>El paciente fue vinculado correctamente a tu lista.</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleCloseAfterCreation}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Datos del Paciente' : 'Agregar Nuevo Paciente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza los datos del paciente. El email no se puede modificar.'
              : 'Ingresa los datos del paciente. Se creará automáticamente una cuenta con una contraseña temporal basada en su RUT.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Nombre — visible en ambos modos */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez González"
              className={errors.full_name ? 'border-destructive' : ''}
            />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email del Paciente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className={errors.email ? 'border-destructive' : ''}
              disabled={isEditing}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* RUT */}
            <div className="space-y-2">
              <Label htmlFor="rut">
                RUT/ID {!isEditing && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className={errors.rut ? 'border-destructive' : ''}
              />
              {errors.rut && <p className="text-sm text-destructive">{errors.rut}</p>}
              {!isEditing && !errors.rut && (
                <p className="text-xs text-muted-foreground">
                  Los primeros 6 dígitos del RUT serán la contraseña temporal del paciente
                </p>
              )}
            </div>
          </div>

          {/* Lugar de atención */}
          <div className="space-y-2 pt-2">
            <Label>Lugar de Atención (Opcional)</Label>
            {loadingClinics ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando lugares...
              </div>
            ) : clinics.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No tienes lugares registrados. Agrégalos en tu perfil.</p>
            ) : (
              <Select value={formData.clinic_id || ''} onValueChange={handleClinicChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un lugar de atención" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map(clinic => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando cuenta...'}
                </>
              ) : (isEditing ? 'Guardar Cambios' : 'Crear Paciente')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Spec 022 Phase E — Modal de upgrade cuando alcanza límite de plan */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      featureName="más pacientes"
      requiredPlan="individual"
      currentPlan={currentPlan}
    />
    </>
  );
};

export default PatientModal;
