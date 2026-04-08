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

  useEffect(() => {
    if (isOpen) {
      if (therapistToEdit) {
        // Edit mode
        setEmail(therapistToEdit.profiles?.email || '');
        setStatus(therapistToEdit.is_active);
        setRole('therapist'); 
        setFoundUser({
          id: therapistToEdit.therapist_id,
          full_name: therapistToEdit.profiles?.full_name,
          email: therapistToEdit.profiles?.email
        });
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
        // UPDATE existing relationship
        const { error } = await supabase
          .from('clinic_therapists')
          .update({
            is_active: status,
            updated_at: new Date().toISOString()
          })
          .eq('id', therapistToEdit.id);

        if (error) throw error;

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