import React, { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/clinic/ClinicBoxesModal.jsx
 *
 * Modal de ABM (Alta/Baja/Modificación) de boxes para UNA clínica/sucursal.
 *
 * Props:
 *  - isOpen, onClose: control del Dialog
 *  - clinic: { id, name, organization_id } — sucursal seleccionada
 *  - maxBoxes: número del plan activo (null = unlimited)
 *  - onChanged: callback cuando se modifica algo (para refresh del padre)
 *
 * RLS:
 *  - SELECT: cualquier member activo de la org
 *  - INSERT/UPDATE/DELETE: solo clinic_admin (policies cb_admin_*)
 */

const BOX_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'ortodoncia', label: 'Ortodoncia' },
  { value: 'cirugia', label: 'Cirugía' },
  { value: 'radiologia', label: 'Radiología' },
  { value: 'otro', label: 'Otro' },
];

const ClinicBoxesModal = ({ isOpen, onClose, clinic, maxBoxes = null, onChanged }) => {
  const { toast } = useToast();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state (inline add/edit row)
  const [editingId, setEditingId] = useState(null); // null = nuevo / id = editando existente
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('general');
  const [formActive, setFormActive] = useState(true);

  const loadBoxes = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_boxes')
        .select('id, name, box_type, is_active, created_at')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setBoxes(data || []);
    } catch (err) {
      logger.error('[ClinicBoxesModal] load:', err.message);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los boxes.' });
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, toast]);

  useEffect(() => {
    if (isOpen) {
      loadBoxes();
      resetForm();
    }
  }, [isOpen, loadBoxes]);

  const resetForm = () => {
    setEditingId(null);
    setFormName('');
    setFormType('general');
    setFormActive(true);
  };

  const startEdit = (box) => {
    setEditingId(box.id);
    setFormName(box.name);
    setFormType(box.box_type);
    setFormActive(box.is_active);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ variant: 'destructive', title: 'Falta el nombre' });
      return;
    }

    // Enforce max_boxes en creación
    if (!editingId && maxBoxes !== null && boxes.length >= maxBoxes) {
      toast({
        variant: 'destructive',
        title: 'Límite del plan alcanzado',
        description: `Tu plan permite máximo ${maxBoxes} box${maxBoxes !== 1 ? 'es' : ''}. Mejora tu plan para agregar más.`,
      });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('clinic_boxes')
          .update({
            name: formName.trim(),
            box_type: formType,
            is_active: formActive,
          })
          .eq('id', editingId)
          .select('id');
        if (error) throw error;
        if (!data || data.length === 0) {
          toast({ variant: 'destructive', title: 'No se actualizó', description: 'Verificá tus permisos.' });
          return;
        }
        toast({ title: 'Box actualizado' });
      } else {
        const { data, error } = await supabase
          .from('clinic_boxes')
          .insert({
            clinic_id: clinic.id,
            // organization_id se rellena solo via trigger fill_clinic_box_organization_id
            name: formName.trim(),
            box_type: formType,
            is_active: formActive,
          })
          .select('id');
        if (error) {
          if (error.message?.includes('clinic_boxes_clinic_id_name_key')) {
            throw new Error(`Ya existe un box llamado "${formName.trim()}" en esta sucursal.`);
          }
          throw error;
        }
        if (!data || data.length === 0) {
          toast({ variant: 'destructive', title: 'No se creó', description: 'Verificá tus permisos.' });
          return;
        }
        toast({ title: 'Box creado' });
      }
      resetForm();
      await loadBoxes();
      onChanged?.();
    } catch (err) {
      logger.error('[ClinicBoxesModal] save:', err.message);
      toast({ variant: 'destructive', title: 'Error al guardar', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (box) => {
    if (!confirm(`¿Eliminar el box "${box.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase.from('clinic_boxes').delete().eq('id', box.id);
      if (error) throw error;
      toast({ title: 'Box eliminado' });
      await loadBoxes();
      onChanged?.();
    } catch (err) {
      logger.error('[ClinicBoxesModal] delete:', err.message);
      toast({ variant: 'destructive', title: 'Error al eliminar', description: err.message });
    }
  };

  const remainingSlots = maxBoxes === null ? null : Math.max(0, maxBoxes - boxes.length);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Boxes de {clinic?.name || 'la sucursal'}</DialogTitle>
          <DialogDescription>
            Salas/sillones físicos disponibles. Cada cita futura podrá referenciar un box específico.
            {maxBoxes !== null && (
              <span className="block mt-1 text-xs">
                Plan actual: {boxes.length} / {maxBoxes} boxes usados.
                {remainingSlots === 0 && ' Alcanzaste el límite del plan.'}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Listado de boxes existentes */}
        <div className="space-y-2 py-2 max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : boxes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aún no hay boxes en esta sucursal. Creá el primero abajo.
            </div>
          ) : (
            boxes.map((box) => (
              <div
                key={box.id}
                className={`flex items-center justify-between rounded-md border p-3 ${
                  editingId === box.id ? 'bg-primary/5 border-primary/30' : 'bg-white'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{box.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {BOX_TYPES.find((t) => t.value === box.box_type)?.label || box.box_type}
                    </Badge>
                    {!box.is_active && (
                      <Badge className="bg-gray-200 text-gray-700 text-[10px]">Inactivo</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(box)}
                    className="h-8 w-8 p-0"
                    title="Editar"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(box)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form inline: crear nuevo o editar el seleccionado */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            {editingId ? (
              <>
                <Edit2 className="h-4 w-4 text-primary" />
                Editando box
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="ml-auto h-7 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" /> Cancelar edición
                </Button>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-primary" />
                Nuevo box
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="box-name">Nombre</Label>
              <Input
                id="box-name"
                placeholder="Ej: Box 1, Sala Verde..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="box-type">Tipo</Label>
              <Select value={formType} onValueChange={setFormType} disabled={saving}>
                <SelectTrigger id="box-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOX_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 bg-gray-50">
            <div className="space-y-0.5">
              <Label htmlFor="box-active" className="text-sm">
                Activo
              </Label>
              <div className="text-xs text-muted-foreground">
                Si está inactivo no se puede asignar a citas nuevas.
              </div>
            </div>
            <Switch
              id="box-active"
              checked={formActive}
              onCheckedChange={setFormActive}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !formName.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {editingId ? 'Guardar cambios' : 'Crear box'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicBoxesModal;
