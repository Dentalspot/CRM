
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
import useTherapistClinics from '@/hooks/useTherapistClinics';
import useActivePlanLimits from '@/hooks/useActivePlanLimits';
import { useDentistList } from '../hooks/useDentistList';
import UpgradeModal from '@/components/modals/UpgradeModal';

const PatientModal = ({ patient, isOpen, onOpenChange, onSave, defaultClinicId = null }) => {
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
    therapist_id: '',
    attention_type: 'consulta_privada'
  });

  // Clínicas via hook compartido. Solo se carga cuando el modal está open.
  const { clinics, loading: loadingClinics } = useTherapistClinics({
    select: 'id, name, type, organization_id',
    organizationId: currentOrganizationId,
    enabled: isOpen,
  });

  // Dentistas asignables como tratante (Gestión de Personal).
  // Fuente de verdad: clinic_therapists activos en la org actual + fallback
  // dentista solo si no aparece (data drift). Mismo hook usaremos en
  // AssistantPatientDialog para consistencia.
  const { dentists: assignableDentists, loading: loadingDentists } = useDentistList({
    organizationId: currentOrganizationId,
    currentUserId: user?.id,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [creationResult, setCreationResult] = useState(null);
  const isEditing = !!patient;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          full_name: patient.full_name || '',
          email: patient.email || '',
          phone: patient.phone || '',
          rut: patient.rut || '',
          clinic_id: patient.clinic_id || null,
          therapist_id: patient.therapist_id || '',
          attention_type: patient.attention_type || 'consulta_privada'
        });
      } else {
        // Si viene desde AppointmentModal con una clínica preseleccionada,
        // arranca con esa para no obligar al user a re-elegirla.
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          rut: '',
          clinic_id: defaultClinicId || null,
          therapist_id: user?.id || '', // arrancamos con el dentista logueado; se ajusta cuando carga la lista
          attention_type: 'consulta_privada'
        });
      }
      setErrors({});
      setCreationResult(null);
    }
  }, [patient, isOpen, isEditing, defaultClinicId, user?.id]);

  // Cuando carga la lista de dentistas asignables, asegurar que therapist_id sea
  // uno válido (preferimos al dentista logueado si está, sino el primero).
  // Esto cubre el caso "dentista solo" donde el dropdown muestra solo a él.
  useEffect(() => {
    if (isEditing || !isOpen || loadingDentists) return;
    if (!assignableDentists || assignableDentists.length === 0) return;

    const currentValid = assignableDentists.some((d) => d.id === formData.therapist_id);
    if (currentValid) return;

    const me = assignableDentists.find((d) => d.isMe);
    const fallback = me ? me.id : assignableDentists[0].id;
    setFormData((prev) => ({ ...prev, therapist_id: fallback }));
  }, [assignableDentists, loadingDentists, isOpen, isEditing, formData.therapist_id]);

  const validateForm = () => {
    const newErrors = {};

    // Nombre y teléfono son obligatorios
    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'El nombre es obligatorio';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    }

    // Email solo se valida formato si fue ingresado (es opcional)
    if (formData.email?.trim() && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Dentista tratante obligatorio en creación (en edit no tocamos asignación acá)
    if (!isEditing && !formData.therapist_id) {
      newErrors.therapist_id = 'Selecciona un dentista tratante';
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

        const hasEmail = !!formData.email?.trim();
        const hasRut = !!formData.rut?.trim();

        // Asignación obligatoria de dentista tratante: pasa el seleccionado en el
        // dropdown (default = user.id si el dentista logueado es el tratante).
        const assignedTherapistId = formData.therapist_id || user.id;

        let result;
        if (hasEmail && hasRut) {
          // Flow completo: crea auth account con password aleatoria que se envía por email
          result = await createPatientAccount({
            therapistId: assignedTherapistId,
            organizationId: currentOrganizationId,
            email: formData.email,
            fullName: formData.full_name,
            rut: formData.rut,
            phone: formData.phone,
            // B6 fix: propagar lugar de atención y tipo. Antes se recogían en el
            // form pero el service los silenciaba en el destructure.
            clinicId: formData.clinic_id || null,
            attentionType: formData.attention_type || null,
          });
        } else {
          // Flow "sin cuenta": solo crea row en patients sin auth user.
          // El paciente puede invitarse después manualmente para que se registre.
          const { createPatientWithoutAccount } = await import('@/services/patientAccountService');
          result = await createPatientWithoutAccount({
            therapistId: assignedTherapistId,
            organizationId: currentOrganizationId,
            fullName: formData.full_name,
            phone: formData.phone,
            email: formData.email || null,
            rut: formData.rut || null,
            // B6 fix: idem rama "sin cuenta".
            clinicId: formData.clinic_id || null,
            attentionType: formData.attention_type || null,
          });
        }

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
    // Pasamos el resultado de creación al padre para que pueda actualizar
    // su lista de pacientes (ej: AppointmentModal seleccionando el nuevo).
    if (onSave) {
      onSave({
        id: creationResult?.patientId,
        full_name: creationResult?.fullName || formData.full_name,
        profile: { full_name: creationResult?.fullName || formData.full_name },
      });
    }
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

            {/* Solo mostrar bloque de contraseña si efectivamente creamos cuenta */}
            {creationResult.isNew && creationResult.welcomeEmailSent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium text-blue-800">Contraseña temporal enviada</p>
                <p className="text-sm text-blue-700">
                  Le enviamos al paciente un email con una contraseña temporal segura. Al primer
                  ingreso le pediremos que la cambie.
                </p>
              </div>
            )}

            {/* Fallback: si el welcome email falló, mostrar la pass al dentista para entrega manual */}
            {creationResult.isNew && creationResult.welcomeEmailSent === false && creationResult.tempPasswordForManualDelivery && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  No pudimos enviar el email automáticamente
                </p>
                <p className="text-sm text-amber-800">
                  Por favor entrégale al paciente esta contraseña temporal:
                </p>
                <code className="block bg-white border border-amber-300 rounded px-3 py-2 font-mono text-base text-amber-900 select-all">
                  {creationResult.tempPasswordForManualDelivery}
                </code>
                <p className="text-xs text-amber-700">
                  Le pediremos que la cambie al primer ingreso.
                </p>
              </div>
            )}

            {creationResult.isNew && creationResult.welcomeEmailSent ? (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <UserPlus className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>El paciente ya puede ingresar con su email y la contraseña que recibió por correo.</span>
              </div>
            ) : creationResult.alreadyLinked ? (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Link className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>El paciente ya tenía cuenta registrada y fue vinculado a tu lista.</span>
              </div>
            ) : !creationResult.isNew ? (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Link className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>El paciente fue vinculado correctamente a tu lista.</span>
              </div>
            ) : null}
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
              : 'Ingresa los datos del paciente. Si incluyes email y RUT, le crearemos una cuenta con una contraseña segura y se la enviaremos por email.'}
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
            <Label htmlFor="email">Email del Paciente</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com (opcional)"
              className={errors.email ? 'border-destructive' : ''}
              disabled={isEditing}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            <p className="text-xs text-muted-foreground">
              Si lo ingresas se creará una cuenta. Si no, podrás invitarlo después.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {/* RUT */}
            <div className="space-y-2">
              <Label htmlFor="rut">RUT/ID</Label>
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
                  Generaremos una contraseña segura y se la enviaremos al paciente por email.
                </p>
              )}
            </div>
          </div>

          {/* Dentista tratante — obligatorio. Lista viene de Gestión de Personal. */}
          {!isEditing && (
            <div className="space-y-2 pt-2">
              <Label>
                Dentista tratante <span className="text-destructive">*</span>
              </Label>
              {loadingDentists ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando dentistas...
                </div>
              ) : assignableDentists.length === 0 ? (
                <p className="text-sm text-destructive italic">
                  No hay dentistas activos en tu clínica. Agrega uno desde Gestión de Personal.
                </p>
              ) : (
                <Select
                  value={formData.therapist_id || ''}
                  onValueChange={(v) => {
                    setFormData((prev) => ({ ...prev, therapist_id: v }));
                    if (errors.therapist_id) setErrors((prev) => ({ ...prev, therapist_id: null }));
                  }}
                  disabled={assignableDentists.length === 1}
                >
                  <SelectTrigger className={errors.therapist_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecciona el dentista tratante" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableDentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}{d.isMe ? ' (vos)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.therapist_id && (
                <p className="text-sm text-destructive">{errors.therapist_id}</p>
              )}
              {assignableDentists.length === 1 && !errors.therapist_id && (
                <p className="text-xs text-muted-foreground">
                  Asignado automáticamente. Para asignar a otro dentista, agregalo primero a Gestión de Personal.
                </p>
              )}
            </div>
          )}

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
      requiredPlan="pro"
      currentPlan={currentPlan}
    />
    </>
  );
};

export default PatientModal;
