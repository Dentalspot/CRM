import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { Plus, Edit2, Trash2, Loader2, Ticket, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  code: '', discount_type: 'percent', discount_value: '', description: '',
  max_uses: '', valid_from: '', expiration_date: '', is_active: true,
};

const CouponsPage = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('coupon_type', 'membership')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      logger.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percent',
      discount_value: coupon.discount_value ?? '',
      description: coupon.description || '',
      max_uses: coupon.max_uses ?? '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      expiration_date: coupon.expiration_date ? coupon.expiration_date.split('T')[0] : '',
      is_active: coupon.is_active ?? true,
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) {
      toast({ variant: 'destructive', title: 'Código y valor son obligatorios' });
      return;
    }
    setSaving(true);
    try {
      const data = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        description: form.description || null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_from: form.valid_from || null,
        expiration_date: form.expiration_date || null,
        is_active: form.is_active,
        coupon_type: 'membership',
      };

      if (editingId) {
        const { error } = await supabase.from('discount_coupons').update(data).eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Cupón actualizado' });
      } else {
        const { error } = await supabase.from('discount_coupons').insert(data);
        if (error) throw error;
        toast({ title: 'Cupón creado' });
      }

      setShowForm(false);
      setEditingId(null);
      loadCoupons();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    await supabase.from('discount_coupons').update({ is_active: !currentActive }).eq('id', id);
    loadCoupons();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    await supabase.from('discount_coupons').delete().eq('id', id);
    toast({ title: 'Cupón eliminado' });
    loadCoupons();
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones de Membresía</h1>
          <p className="text-muted-foreground text-sm">Gestiona cupones de descuento para planes de suscripción</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCoupons} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Nuevo Cupón</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay cupones de membresía</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Crear primer cupón</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usos máx.</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(coupon => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `$${coupon.discount_value?.toLocaleString('es-CL')}`}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{coupon.description || '—'}</TableCell>
                    <TableCell>{coupon.max_uses || 'Ilimitado'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('es-CL') : '—'}
                      {' → '}
                      {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString('es-CL') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggle(coupon.id, coupon.is_active)}
                      >
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(coupon)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(coupon.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cupón' : 'Nuevo Cupón de Membresía'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.code} onChange={(e) => handleChange('code', e.target.value.toUpperCase())} placeholder="BIENVENIDO20" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de descuento</Label>
                <Select value={form.discount_type} onValueChange={(v) => handleChange('discount_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => handleChange('discount_value', e.target.value)} placeholder={form.discount_type === 'percent' ? '20' : '5000'} />
              </div>
              <div className="space-y-2">
                <Label>Usos máximos</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => handleChange('max_uses', e.target.value)} placeholder="Ilimitado" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descuento de bienvenida para nuevos terapeutas" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Válido desde</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => handleChange('valid_from', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Válido hasta</Label>
                <Input type="date" value={form.expiration_date} onChange={(e) => handleChange('expiration_date', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => handleChange('is_active', v)} />
              <Label>Cupón activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : editingId ? 'Guardar cambios' : 'Crear cupón'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
