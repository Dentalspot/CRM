import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Ticket, RefreshCw, Edit2 } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const CouponsPage = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('coupon_type', 'marketplace')
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

  const resetForm = () => {
    setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', valid_from: '', valid_until: '', is_active: true });
    setEditingId(null);
  };

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || '',
      discount_type: coupon.discount_type || 'percent',
      discount_value: coupon.discount_value?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.expiration_date ? coupon.expiration_date.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setShowCreate(true);
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
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_from: form.valid_from || null,
        expiration_date: form.valid_until || null,
        is_active: form.is_active,
        coupon_type: 'marketplace',
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

      setShowCreate(false);
      resetForm();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones de Descuento</h1>
          <p className="text-muted-foreground text-sm">Crea y gestiona códigos de descuento para la plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCoupons} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Cupón
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay cupones creados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
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
                    <TableCell>{coupon.max_uses || 'Ilimitado'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('es-CL') : '—'}
                      {' → '}
                      {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString('es-CL') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => handleToggle(coupon.id, coupon.is_active)}>
                        {coupon.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cupón' : 'Nuevo Cupón de Descuento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} placeholder="DentalSpot20" className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm(prev => ({ ...prev, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm(prev => ({ ...prev, discount_value: e.target.value }))} placeholder={form.discount_type === 'percent' ? '20' : '5000'} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usos máximos (vacío = ilimitado)</Label>
              <Input type="number" value={form.max_uses} onChange={(e) => setForm(prev => ({ ...prev, max_uses: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Válido desde</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => setForm(prev => ({ ...prev, valid_from: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Válido hasta</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm(prev => ({ ...prev, valid_until: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingId ? 'Guardar Cambios' : 'Crear Cupón'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
