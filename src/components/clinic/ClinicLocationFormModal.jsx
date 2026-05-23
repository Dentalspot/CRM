import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/clinic/ClinicLocationFormModal.jsx
 *
 * Modal para crear o editar una sucursal (row de `clinics`) desde
 * "Gestión de Clínicas". Form mínimo: nombre, dirección, tipo, estado.
 *
 * Props:
 *  - isOpen, onClose
 *  - clinic: si pasado, modo edit; si null, modo create
 *  - organizationId: org a la que pertenece (requerido para create)
 *  - onSaved(savedClinic): callback al guardar exitosamente
 *
 * NO incluye:
 *  - city_id / region_id / lat-lng / fotos / horarios → eso se edita
 *    en "Mi Perfil → Agenda → Mis Lugares de Atención" (flow más rico)
 *  - RUT empresa / razón social → idem
 *
 * Razón del scope acotado: este modal es para gestión rápida de
 * sucursales múltiples. Datos avanzados quedan en el profile.
 */

const CLINIC_TYPES = [
  { value: 'clinica', label: 'Clínica' },
  { value: 'consulta_privada', label: 'Consulta privada' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'colegio', label: 'Colegio (PIE)' },
  { value: 'otro', label: 'Otro' },
];

const ClinicLocationFormModal = ({ isOpen, onClose, clinic = null, organizationId, onSaved }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('clinica');
  const [isActive, setIsActive] = useState(true);

  const isEdit = Boolean(clinic);

  useEffect(() => {
    if (isOpen) {
      if (clinic) {
        setName(clinic.name || '');
        setAddress(clinic.address || '');
        setType(clinic.type || 'clinica');
        setIsActive(clinic.is_active !== false);
      } else {
        setName('');
        setAddress('');
        setType('clinica');
        setIsActive(true);
      }
    }
  }, [isOpen, clinic]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Falta el nombre' });
      return;
    }
    if (!isEdit && !organizationId) {
      toast({ variant: 'destructive', title: 'Falta organización' });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const { data, error } = await supabase
          .from('clinics')
          .update({
            name: name.trim(),
            address: address.trim() || null,
            type,
            is_active: isActive,
          })
          .eq('id', clinic.id)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          toast({
            variant: 'destructive',
            title: 'No se actualizó',
            description: 'Verificá tus permisos sobre esta sucursal.',
          });
          return;
        }
        toast({ title: 'Sucursal actualizada' });
      } else {
        const { data, error } = await supabase
          .from('clinics')
          .insert({
            name: name.trim(),
            address: address.trim() || null,
            type,
            is_active: isActive,
            therapist_id: user.id, // owner
            organization_id: organizationId,
            is_public: false, // por defecto, no aparece en directorio (user lo activa en profile)
          })
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          toast({ variant: 'destructive', title: 'No se creó la sucursal' });
          return;
        }
        toast({ title: 'Sucursal creada' });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      logger.error('[ClinicLocationFormModal] save:', err.message);
      let desc = err.message;
      if (err.message?.includes('clinics_type_check')) {
        desc = 'Tipo de sucursal inválido.';
      }
      toast({ variant: 'destructive', title: 'Error al guardar', description: desc });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar sucursal' : 'Nueva sucursal'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los datos básicos de esta sucursal.'
              : 'Agregá una nueva sucursal a tu organización. Podés configurar boxes y horarios después.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="clinic-name">Nombre *</Label>
            <Input
              id="clinic-name"
              placeholder="Ej: Sucursal Las Condes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="clinic-address">Dirección</Label>
            <Input
              id="clinic-address"
              placeholder="Av. Apoquindo 4500, Las Condes"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
            <p className="text-[10px] text-muted-foreground">
              Para configuración avanzada (ciudad, región, mapa, fotos) usá "Mi Perfil → Agenda → Mis Lugares de Atención".
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="clinic-type">Tipo</Label>
            <Select value={type} onValueChange={setType} disabled={saving}>
              <SelectTrigger id="clinic-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLINIC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-gray-50">
              <div className="space-y-0.5">
                <Label htmlFor="clinic-active" className="text-sm">
                  Activa
                </Label>
                <div className="text-xs text-muted-foreground">
                  Si está inactiva no se pueden agendar citas nuevas acá.
                </div>
              </div>
              <Switch
                id="clinic-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={saving}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {isEdit ? 'Guardar cambios' : 'Crear sucursal'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicLocationFormModal;
