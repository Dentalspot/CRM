import React, { useState } from 'react';
import { usePlans } from '../hooks/usePlans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/adminUtils';

const EMPTY_FORM = {
  name: '', slug: '', description: '', price: '', currency: 'CLP',
  billing_cycle: 'monthly', max_patients: '', max_clinics: '', max_users: '',
  max_storage_mb: '', is_active: true, sort_order: 0, featuresText: '',
};

const PlansPage = () => {
  const { plans, loading, savePlan, deletePlan, refetch } = usePlans();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleEdit = (plan) => {
    // Convert features array to text (one per line)
    const featuresText = (plan.features || [])
      .map(f => typeof f === 'string' ? f : f.text || '')
      .filter(Boolean)
      .join('\n');

    setForm({
      id: plan.id,
      name: plan.name || '',
      slug: plan.slug || '',
      description: plan.description || '',
      price: plan.price ?? '',
      currency: plan.currency || 'CLP',
      billing_cycle: plan.billing_cycle || 'monthly',
      max_patients: plan.max_patients ?? '',
      max_clinics: plan.max_clinics ?? '',
      max_users: plan.max_users ?? '',
      max_storage_mb: plan.max_storage_mb ?? '',
      is_active: plan.is_active ?? true,
      sort_order: plan.sort_order ?? 0,
      featuresText,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ variant: 'destructive', title: 'El nombre es obligatorio' });
      return;
    }
    setSaving(true);
    try {
      // Convert features text to JSON array
      const features = form.featuresText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(text => ({ text, included: true }));

      const { featuresText, ...rest } = form;
      const data = {
        ...rest,
        price: Number(form.price) || 0,
        max_patients: form.max_patients ? Number(form.max_patients) : null,
        max_clinics: form.max_clinics ? Number(form.max_clinics) : null,
        max_users: form.max_users ? Number(form.max_users) : null,
        max_storage_mb: form.max_storage_mb ? Number(form.max_storage_mb) : null,
        sort_order: Number(form.sort_order) || 0,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        features,
      };
      await savePlan(data);
      toast({ title: form.id ? 'Plan actualizado' : 'Plan creado' });
      setShowForm(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar el plan "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await deletePlan(id);
      toast({ title: 'Plan eliminado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Planes de Suscripción</h1>
          <p className="text-muted-foreground text-sm">Gestiona los planes de membresía de la plataforma</p>
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Crear Plan</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : plans.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay planes configurados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Pacientes</TableHead>
                  <TableHead>Clínicas</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{plan.name}</span>
                        {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(plan.price || 0)}</TableCell>
                    <TableCell className="text-sm">{plan.billing_cycle || 'monthly'}</TableCell>
                    <TableCell className="text-sm">{plan.max_patients ?? '∞'}</TableCell>
                    <TableCell className="text-sm">{plan.max_clinics ?? '∞'}</TableCell>
                    <TableCell className="text-sm">{plan.max_users ?? '∞'}</TableCell>
                    <TableCell className="text-sm">{plan.max_storage_mb ? `${plan.max_storage_mb}MB` : '∞'}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(plan.id, plan.name)} disabled={deleting === plan.id}>
                          {deleting === plan.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ej: Profesional" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} placeholder="profesional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Para profesionales avanzados" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio (CLP)</Label>
                <Input type="number" value={form.price} onChange={(e) => handleChange('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Ciclo</Label>
                <Input value={form.billing_cycle} onChange={(e) => handleChange('billing_cycle', e.target.value)} placeholder="monthly" />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => handleChange('sort_order', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máx. Pacientes</Label>
                <Input type="number" value={form.max_patients} onChange={(e) => handleChange('max_patients', e.target.value)} placeholder="∞" />
              </div>
              <div className="space-y-2">
                <Label>Máx. Clínicas</Label>
                <Input type="number" value={form.max_clinics} onChange={(e) => handleChange('max_clinics', e.target.value)} placeholder="∞" />
              </div>
              <div className="space-y-2">
                <Label>Máx. Usuarios</Label>
                <Input type="number" value={form.max_users} onChange={(e) => handleChange('max_users', e.target.value)} placeholder="∞" />
              </div>
              <div className="space-y-2">
                <Label>Storage (MB)</Label>
                <Input type="number" value={form.max_storage_mb} onChange={(e) => handleChange('max_storage_mb', e.target.value)} placeholder="∞" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Características (una por línea)</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.featuresText}
                onChange={(e) => handleChange('featuresText', e.target.value)}
                placeholder={"Hasta 30 pacientes activos\nAgendamiento inteligente\nRecordatorios por email\nPanel de métricas"}
              />
              <p className="text-xs text-muted-foreground">Cada línea se mostrará como un item en la página de planes.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
              <Label>Plan activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : form.id ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansPage;
