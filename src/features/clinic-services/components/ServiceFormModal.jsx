import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { SPECIALTIES, createService, updateService } from '../api/clinicServicesApi';

const EMPTY = {
  name: '',
  description: '',
  specialty: '',
  price: '',
  duration_minutes: '',
  is_active: true,
};

export default function ServiceFormModal({ open, onClose, clinicId, initialService, defaultSpecialty, onSaved }) {
  const isEdit = Boolean(initialService?.id);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialService) {
        setForm({
          name: initialService.name || '',
          description: initialService.description || '',
          specialty: initialService.specialty || '',
          price: initialService.price?.toString() || '',
          duration_minutes: initialService.duration_minutes?.toString() || '',
          is_active: initialService.is_active !== false,
        });
      } else {
        // Modo "nuevo": pre-rellena la especialidad si el usuario tiene un filtro activo.
        // Ahorra clicks cuando navega por una especialidad y agrega varias seguidas.
        setForm({ ...EMPTY, specialty: defaultSpecialty || '' });
      }
    }
  }, [open, initialService, defaultSpecialty]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Falta el nombre', description: 'El servicio necesita un nombre.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicId,
        name: form.name,
        description: form.description,
        specialty: form.specialty || null,
        price: form.price === '' ? 0 : Number(form.price),
        duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes),
        is_active: form.is_active,
      };

      if (isEdit) {
        await updateService(initialService.id, payload);
        toast({ title: 'Servicio actualizado' });
      } else {
        await createService(payload);
        toast({ title: 'Servicio creado' });
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast({
        title: isEdit ? 'No se pudo actualizar' : 'No se pudo crear',
        description: err.message || 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: Obturación composite posterior"
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Especialidad</Label>
            <Select value={form.specialty} onValueChange={(v) => handleChange('specialty', v)}>
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Sin especialidad" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Precio (CLP)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="100"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                step="5"
                value={form.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detalle del procedimiento, materiales, etc."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="is_active" className="cursor-pointer">Activo en catálogo</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si lo desactivas, no aparece en presupuestos nuevos.
              </p>
            </div>
            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(v) => handleChange('is_active', v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
