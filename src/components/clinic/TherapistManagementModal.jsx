import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search, Check, AlertCircle } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import SpecialtyMultiSelect from './SpecialtyMultiSelect';

const TherapistManagementModal = ({ 
  isOpen, 
  onClose, 
  clinicId, 
  therapistToEdit = null, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(true); // Active by default
  const [role, setRole] = useState('therapist');

  // Especialidades del dentista (ids de la tabla `specialties`).
  // initialSpecialtyIds: snapshot al abrir el modal — necesario para
  // calcular el diff (INSERT/DELETE) al guardar.
  const [specialtyIds, setSpecialtyIds] = useState([]);
  const [initialSpecialtyIds, setInitialSpecialtyIds] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  // % de pago acordado para el dentista en esta clínica (commission_percent
  // en clinic_therapists). Es el % que se queda el dentista por cada cita
  // atendida en esta clínica. Default '' = sin acuerdo registrado. Se usa
  // en reportes de Ingresos/Recaudación para dividir entre clínica y dentista.
  const [commissionPercent, setCommissionPercent] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (therapistToEdit) {
        // Edit mode
        setEmail(therapistToEdit.profiles?.email || '');
        setStatus(therapistToEdit.is_active);
        setRole('therapist');
        // CONVENCIÓN: en DB clinic_therapists.commission_percent guarda el
        // % que se queda LA CLÍNICA (alineado con v_income_summary que
        // calcula commission_amount = clinic_amount). El UI muestra al
        // user el % DEL DENTISTA porque así piensa operacionalmente
        // ("¿cuánto le pago al dentista?"). Invertimos al cargar/guardar.
        setCommissionPercent(
          therapistToEdit.commission_percent != null
            ? String(100 - Number(therapistToEdit.commission_percent))
            : ''
        );
        setFoundUser({
          id: therapistToEdit.therapist_id,
          full_name: therapistToEdit.profiles?.full_name,
          email: therapistToEdit.profiles?.email
        });

        // Cargar especialidades actuales del dentista para edit mode
        const loadSpecialties = async () => {
          setLoadingSpecialties(true);
          try {
            const { data, error } = await supabase
              .from('therapist_specialties')
              .select('specialty_id')
              .eq('therapist_id', therapistToEdit.therapist_id);
            if (error) throw error;
            const ids = (data || []).map(r => r.specialty_id);
            setSpecialtyIds(ids);
            setInitialSpecialtyIds(ids);
          } catch (err) {
            logger.error('[TherapistManagementModal] cargar especialidades:', err.message);
          } finally {
            setLoadingSpecialties(false);
          }
        };
        loadSpecialties();
      } else {
        // Create mode
        resetForm();
      }
    }
  }, [isOpen, therapistToEdit]);

  const resetForm = () => {
    setEmail('');
    setStatus(true);
    setRole('therapist');
    setFoundUser(null);
    setSpecialtyIds([]);
    setInitialSpecialtyIds([]);
    setCommissionPercent('');
  };

  const handleSearchUser = async () => {
    if (!email || email.length < 3) return;
    
    setSearchLoading(true);
    setFoundUser(null);

    try {
      // Find user profile by email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', email)
        .eq('role', 'therapist') // Only allow adding therapists
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundUser(data);
        toast({
          title: "Usuario encontrado",
          description: `${data.full_name} (${data.role})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No encontrado",
          description: "No se encontró un dentista con ese correo electrónico.",
        });
      }
    } catch (error) {
      logger.error("Error searching user:", error);
      toast({
        variant: "destructive",
        title: "Error de búsqueda",
        description: error.message
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!foundUser) {
      toast({
        variant: "destructive",
        title: "Usuario requerido",
        description: "Debes buscar y seleccionar un usuario válido primero."
      });
      return;
    }

    setLoading(true);

    try {
      if (therapistToEdit) {
        // Validar commission_percent si fue ingresado. INVERSIÓN: el user
        // ingresa el % DEL DENTISTA, pero DB guarda el % de la clínica
        // (alineado con v_income_summary). Convertimos antes de save.
        let commissionToSave = null;
        if (commissionPercent !== '' && commissionPercent != null) {
          const userPercent = parseFloat(commissionPercent);
          if (isNaN(userPercent) || userPercent < 0 || userPercent > 100) {
            toast({
              variant: 'destructive',
              title: 'Porcentaje inválido',
              description: 'Ingresá un valor entre 0 y 100.',
            });
            setLoading(false);
            return;
          }
          // Invertir: si el user pone 70% (al dentista), DB guarda 30 (clínica)
          commissionToSave = 100 - userPercent;
        }

        // UPDATE existing relationship
        const { error } = await supabase
          .from('clinic_therapists')
          .update({
            is_active: status,
            commission_percent: commissionToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', therapistToEdit.id);

        if (error) throw error;

        // Sync especialidades: diff entre initialSpecialtyIds y specialtyIds
        // Solo en edit mode (en create no hay therapist_id todavía válido).
        const toAdd = specialtyIds.filter(id => !initialSpecialtyIds.includes(id));
        const toRemove = initialSpecialtyIds.filter(id => !specialtyIds.includes(id));

        if (toRemove.length > 0) {
          const { error: delErr } = await supabase
            .from('therapist_specialties')
            .delete()
            .eq('therapist_id', therapistToEdit.therapist_id)
            .in('specialty_id', toRemove);
          if (delErr) throw delErr;
        }

        if (toAdd.length > 0) {
          const rows = toAdd.map(specialty_id => ({
            therapist_id: therapistToEdit.therapist_id,
            specialty_id,
            is_public: true,
          }));
          const { error: insErr } = await supabase
            .from('therapist_specialties')
            .insert(rows);
          if (insErr) throw insErr;
        }

        toast({
          title: "Actualizado",
          description: "El terapeuta ha sido actualizado exitosamente."
        });
      } else {
        // CREATE new relationship
        // Check if already exists first
        const { data: existing } = await supabase
          .from('clinic_therapists')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('therapist_id', foundUser.id)
          .maybeSingle();

        if (existing) {
           // If exists, just update status to active if it was inactive
           const { error: updateError } = await supabase
            .from('clinic_therapists')
            .update({ is_active: true })
            .eq('id', existing.id);
            
           if (updateError) throw updateError;
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('clinic_therapists')
            .insert({
              clinic_id: clinicId,
              therapist_id: foundUser.id,
              is_active: status,
              joined_at: new Date().toISOString()
            });

          if (insertError) throw insertError;
        }

        toast({
          title: "Agregado",
          description: "Terapeuta agregado a la clínica exitosamente."
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error("Error saving therapist:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el terapeuta."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {therapistToEdit ? 'Editar Terapeuta' : 'Agregar Terapeuta'}
          </DialogTitle>
          <DialogDescription>
            {therapistToEdit 
              ? 'Modifica el estado o rol del dentista en tu clínica.'
              : 'Busca un dentista por correo electrónico para añadirlo a tu equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {/* Email Search Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico del Terapeuta</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!therapistToEdit || loading} // Disable email edit in edit mode
                  className={foundUser && !therapistToEdit ? "border-green-500 ring-green-500" : ""}
                />
                {!therapistToEdit && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={handleSearchUser}
                    disabled={searchLoading || !email}
                  >
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              {foundUser && (
                <div className="text-sm text-green-600 flex items-center mt-1">
                  <Check className="h-3 w-3 mr-1" />
                  Usuario encontrado: {foundUser.full_name}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Rol en la Clínica</Label>
              <Select 
                value={role} 
                onValueChange={setRole}
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapist">Terapeuta (Estándar)</SelectItem>
                  <SelectItem value="admin">Administrador (Acceso total)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                * El rol de administrador permite gestionar la configuración de la clínica.
              </p>
            </div>

            {/* Status Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-gray-50">
              <div className="space-y-0.5">
                <Label htmlFor="status" className="text-base">
                  Estado Activo
                </Label>
                <div className="text-xs text-muted-foreground">
                  {status ? 'El terapeuta puede recibir citas.' : 'El terapeuta está inactivo.'}
                </div>
              </div>
              <Switch
                id="status"
                checked={status}
                onCheckedChange={setStatus}
                disabled={loading}
              />
            </div>

            {/* Especialidades (solo en edit mode — necesita therapist_id válido).
                Multi-select con chips. Al guardar se sincronizan via diff
                INSERT/DELETE sobre therapist_specialties. Cero especialidades
                = se considera "Odontología general" en displays públicos. */}
            {therapistToEdit && (
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <SpecialtyMultiSelect
                  value={specialtyIds}
                  onChange={setSpecialtyIds}
                  disabled={loading || loadingSpecialties}
                  placeholder="Sin especialidades (odontología general)"
                />
                <p className="text-[10px] text-muted-foreground">
                  Clasificá al dentista por especialidad. Si no asignás ninguna, aparece como dentista general. Usado para que los pacientes encuentren al especialista correcto.
                </p>
              </div>
            )}

            {/* % comisión / pago acordado — solo en edit (necesita clinic_therapists row).
                Persistido en clinic_therapists.commission_percent (numeric). Usado en
                reportes de Ingresos/Recaudación para dividir entre clínica y dentista. */}
            {therapistToEdit && (
              <div className="space-y-2">
                <Label htmlFor="commission_percent">
                  Porcentaje de pago acordado al dentista
                </Label>
                <div className="relative">
                  <Input
                    id="commission_percent"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Ej: 70"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    disabled={loading}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Porcentaje que se queda el dentista de cada cita atendida en esta clínica. Ej: 70% significa que el dentista recibe 70 de cada 100 cobrados; la clínica retiene 30. Si dejás vacío, no se aplica división automática en los reportes.
                </p>
              </div>
            )}

            {!therapistToEdit && !foundUser && (
              <div className="flex items-start p-3 bg-blue-50 text-blue-800 rounded-md text-xs">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                <span>
                  Para agregar un dentista, primero debe estar registrado en la plataforma DentalSpot como profesional.
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !foundUser}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {therapistToEdit ? 'Guardar Cambios' : 'Agregar Terapeuta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TherapistManagementModal;