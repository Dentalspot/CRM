import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Receipt,
  FileText,
  Plus,
  Send,
  Eye,
  Trash2,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const formatCLP = (v) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v || 0);

const IVA_RATE = 0.19;

const STATUS_CONFIG = {
  draft:       { label: 'Borrador',   icon: Clock,       className: 'bg-gray-100 text-gray-600 border-gray-200' },
  issued:      { label: 'Emitida',    icon: FileText,    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  sent_to_sii: { label: 'Enviada SII',icon: Send,        className: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:    { label: 'Aceptada',   icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-200' },
  rejected:    { label: 'Rechazada',  icon: XCircle,     className: 'bg-red-50 text-red-600 border-red-200' },
  cancelled:   { label: 'Anulada',    icon: AlertCircle, className: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const DOC_TYPES = {
  boleta:             'Boleta Electrónica',
  factura:            'Factura Electrónica',
  boleta_honorarios:  'Boleta de Honorarios',
  nota_credito:       'Nota de Crédito',
};

const InvoicingPanel = ({ clinicInfo, therapists = [], appointments = [] }) => {
  const { toast } = useToast();
  const now = new Date();

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  // Form
  const [form, setForm] = useState({
    document_type: 'boleta',
    receptor_rut: '',
    receptor_nombre: '',
    receptor_giro: '',
    receptor_direccion: '',
    es_exento: false,
    detalle: [{ descripcion: 'Sesión de odontología', cantidad: 1, precio_unitario: 0 }],
    notes: '',
    appointment_id: '',
    therapist_id: '',
  });

  const periodo = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // ========== LOAD INVOICES ==========
  useEffect(() => {
    if (clinicInfo?.id) loadInvoices();
  }, [clinicInfo?.id, periodo]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinic_invoices')
        .select('*')
        .eq('clinic_id', clinicInfo.id)
        .eq('periodo', periodo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      logger.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== COMPLETED SESSIONS WITHOUT INVOICE ==========
  const unbilledSessions = useMemo(() => {
    const invoicedAppIds = new Set(invoices.map(i => i.appointment_id).filter(Boolean));
    return appointments.filter(a => {
      if (a.status !== 'completed') return false;
      if (invoicedAppIds.has(a.id)) return false;
      try {
        const d = parseISO(a.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      } catch { return false; }
    });
  }, [appointments, invoices, selectedMonth, selectedYear]);

  // ========== TOTALS ==========
  const totals = useMemo(() => {
    return invoices.reduce((acc, inv) => ({
      count: acc.count + 1,
      total: acc.total + (inv.monto_total || 0),
      drafts: acc.drafts + (inv.status === 'draft' ? 1 : 0),
      issued: acc.issued + (['issued', 'sent_to_sii', 'accepted'].includes(inv.status) ? 1 : 0),
    }), { count: 0, total: 0, drafts: 0, issued: 0 });
  }, [invoices]);

  // ========== FORM HELPERS ==========
  const updateDetalle = (index, field, value) => {
    setForm(prev => {
      const newDetalle = [...prev.detalle];
      newDetalle[index] = { ...newDetalle[index], [field]: value };
      return { ...prev, detalle: newDetalle };
    });
  };

  const addDetalleRow = () => {
    setForm(prev => ({
      ...prev,
      detalle: [...prev.detalle, { descripcion: '', cantidad: 1, precio_unitario: 0 }],
    }));
  };

  const removeDetalleRow = (index) => {
    if (form.detalle.length <= 1) return;
    setForm(prev => ({
      ...prev,
      detalle: prev.detalle.filter((_, i) => i !== index),
    }));
  };

  const formTotals = useMemo(() => {
    const neto = form.detalle.reduce((s, item) => s + (Number(item.cantidad) * Number(item.precio_unitario)), 0);
    const iva = form.es_exento ? 0 : Math.round(neto * IVA_RATE);
    const exento = form.es_exento ? neto : 0;
    const total = neto + iva;
    return { neto, iva, exento, total };
  }, [form.detalle, form.es_exento]);

  // ========== PREFILL FROM APPOINTMENT ==========
  const prefillFromAppointment = (appointmentId) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const price = apt.services?.price_clp || apt.services?.[0]?.price_clp || 0;
    const therapist = therapists.find(t => t.therapist_id === apt.therapist_id);

    setForm(prev => ({
      ...prev,
      appointment_id: appointmentId,
      therapist_id: apt.therapist_id,
      detalle: [{
        descripcion: `Sesión de odontología${therapist ? ` - ${therapist.profiles?.full_name}` : ''}`,
        cantidad: 1,
        precio_unitario: Number(price),
      }],
    }));
  };

  // ========== OPEN CREATE MODAL ==========
  const openCreate = (appointmentId = null) => {
    setForm({
      document_type: 'boleta',
      receptor_rut: '',
      receptor_nombre: '',
      receptor_giro: '',
      receptor_direccion: '',
      es_exento: false,
      detalle: [{ descripcion: 'Sesión de odontología', cantidad: 1, precio_unitario: 0 }],
      notes: '',
      appointment_id: appointmentId || '',
      therapist_id: '',
    });

    if (appointmentId) prefillFromAppointment(appointmentId);
    setCreateModal(true);
  };

  // ========== SAVE INVOICE ==========
  const handleSave = async (emitir = false) => {
    if (!form.receptor_rut.trim() || !form.receptor_nombre.trim()) {
      toast({ variant: 'destructive', title: 'Completa los datos del receptor (RUT y nombre).' });
      return;
    }

    if (formTotals.neto <= 0) {
      toast({ variant: 'destructive', title: 'El monto debe ser mayor a 0.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clinic_id: clinicInfo.id,
        therapist_id: form.therapist_id || null,
        appointment_id: form.appointment_id || null,
        document_type: form.document_type,
        status: emitir ? 'issued' : 'draft',
        emisor_rut: clinicInfo.rut || null,
        emisor_razon_social: clinicInfo.name,
        emisor_direccion: clinicInfo.address || null,
        receptor_rut: form.receptor_rut,
        receptor_nombre: form.receptor_nombre,
        receptor_giro: form.receptor_giro || null,
        receptor_direccion: form.receptor_direccion || null,
        monto_neto: formTotals.neto,
        monto_iva: formTotals.iva,
        monto_exento: formTotals.exento,
        monto_total: formTotals.total,
        es_exento: form.es_exento,
        detalle: form.detalle,
        periodo,
        notes: form.notes || null,
      };

      const { error } = await supabase
        .from('clinic_invoices')
        .insert(payload);

      if (error) throw error;

      toast({
        title: emitir ? 'Documento emitido' : 'Borrador guardado',
        description: `${DOC_TYPES[form.document_type]} · ${formatCLP(formTotals.total)}`,
      });

      setCreateModal(false);
      loadInvoices();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ========== CHANGE STATUS ==========
  const updateStatus = async (invoiceId, newStatus) => {
    try {
      const { error } = await supabase
        .from('clinic_invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) throw error;
      toast({ title: 'Estado actualizado' });
      loadInvoices();
      setDetailModal(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // ========== BULK CREATE ==========
  const handleBulkCreate = async () => {
    if (unbilledSessions.length === 0) return;

    setSaving(true);
    try {
      const payloads = unbilledSessions.map(apt => {
        const price = Number(apt.services?.price_clp || apt.services?.[0]?.price_clp || 0);
        const neto = price;
        const iva = Math.round(neto * IVA_RATE);

        return {
          clinic_id: clinicInfo.id,
          therapist_id: apt.therapist_id,
          appointment_id: apt.id,
          document_type: 'boleta',
          status: 'draft',
          emisor_rut: clinicInfo.rut || null,
          emisor_razon_social: clinicInfo.name,
          receptor_rut: '',
          receptor_nombre: 'Por completar',
          monto_neto: neto,
          monto_iva: iva,
          monto_exento: 0,
          monto_total: neto + iva,
          es_exento: false,
          detalle: [{ descripcion: 'Sesión de odontología', cantidad: 1, precio_unitario: price }],
          periodo,
        };
      });

      const { error } = await supabase.from('clinic_invoices').insert(payloads);
      if (error) throw error;

      toast({
        title: `${payloads.length} borradores creados`,
        description: 'Completa los datos del receptor en cada uno para emitir.',
      });
      loadInvoices();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const years = [now.getFullYear() - 1, now.getFullYear()];

  // ========== EMPTY ==========
  if (!clinicInfo) {
    return (
      <Card className="border border-gray-100">
        <CardContent className="py-8 text-center">
          <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Crea tu clínica para gestionar facturación</p>
        </CardContent>
      </Card>
    );
  }

  // ========== RENDER ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-orange-600" />
                </div>
                Facturación electrónica
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Gestiona boletas y facturas · Preparado para integración SII
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(yr => (
                    <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={() => openCreate()}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nueva
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Documentos</p>
              <p className="text-base font-bold text-gray-900">{totals.count}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-orange-600 uppercase">Facturado</p>
              <p className="text-base font-bold text-orange-700">{formatCLP(totals.total)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-amber-600 uppercase">Borradores</p>
              <p className="text-base font-bold text-amber-700">{totals.drafts}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-green-600 uppercase">Emitidas</p>
              <p className="text-base font-bold text-green-700">{totals.issued}</p>
            </div>
          </div>

          {/* Unbilled sessions alert */}
          {unbilledSessions.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800">
                  <span className="font-semibold">{unbilledSessions.length}</span> sesión{unbilledSessions.length > 1 ? 'es' : ''} completada{unbilledSessions.length > 1 ? 's' : ''} sin boleta
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 text-xs"
                onClick={handleBulkCreate}
                disabled={saving}
              >
                <Zap className="h-3 w-3 mr-1" />
                Crear borradores
              </Button>
            </div>
          )}

          {/* Invoice list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-6">
              <Receipt className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Sin documentos en {MONTHS[selectedMonth]} {selectedYear}</p>
              <p className="text-xs text-gray-400 mt-1">Crea tu primera boleta o genera borradores desde sesiones completadas.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {invoices.map(inv => {
                const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusCfg.icon;

                return (
                  <button
                    key={inv.id}
                    onClick={() => setDetailModal(inv)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-orange-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {DOC_TYPES[inv.document_type]} · {inv.receptor_nombre || 'Sin receptor'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {inv.receptor_rut || 'RUT pendiente'}
                        {inv.created_at && ` · ${format(parseISO(inv.created_at), 'dd/MM/yyyy')}`}
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-gray-900 shrink-0">
                      {formatCLP(inv.monto_total)}
                    </span>

                    <Badge variant="outline" className={`text-[10px] shrink-0 ${statusCfg.className}`}>
                      <StatusIcon className="h-3 w-3 mr-0.5" />
                      {statusCfg.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {/* SII integration hint */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-dashed border-gray-200">
            <Zap className="h-4 w-4 text-gray-400 shrink-0" />
            <p className="text-[11px] text-gray-400">
              Integración directa con SII próximamente. Por ahora, gestiona tus pre-documentos aquí y emite en el portal del SII.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ========== MODAL: CREAR DOCUMENTO ========== */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo documento tributario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo */}
            <div>
              <Label className="text-xs">Tipo de documento</Label>
              <Select value={form.document_type} onValueChange={v => setForm(prev => ({ ...prev, document_type: v }))}>
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desde sesión */}
            {unbilledSessions.length > 0 && !form.appointment_id && (
              <div>
                <Label className="text-xs">Crear desde sesión completada</Label>
                <Select value={form.appointment_id} onValueChange={v => prefillFromAppointment(v)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="Seleccionar sesión..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unbilledSessions.map(apt => {
                      const t = therapists.find(t => t.therapist_id === apt.therapist_id);
                      const price = apt.services?.price_clp || apt.services?.[0]?.price_clp || 0;
                      return (
                        <SelectItem key={apt.id} value={apt.id}>
                          {apt.date} · {t?.profiles?.full_name?.split(' ')[0] || 'Terapeuta'} · {formatCLP(price)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Receptor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">RUT receptor *</Label>
                <Input
                  value={form.receptor_rut}
                  onChange={e => setForm(prev => ({ ...prev, receptor_rut: e.target.value }))}
                  placeholder="12.345.678-9"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nombre / Razón social *</Label>
                <Input
                  value={form.receptor_nombre}
                  onChange={e => setForm(prev => ({ ...prev, receptor_nombre: e.target.value }))}
                  placeholder="Juan Pérez"
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Giro</Label>
                <Input
                  value={form.receptor_giro}
                  onChange={e => setForm(prev => ({ ...prev, receptor_giro: e.target.value }))}
                  placeholder="Particular"
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Dirección</Label>
                <Input
                  value={form.receptor_direccion}
                  onChange={e => setForm(prev => ({ ...prev, receptor_direccion: e.target.value }))}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>

            {/* Exento toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exento"
                checked={form.es_exento}
                onChange={e => setForm(prev => ({ ...prev, es_exento: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="exento" className="text-xs cursor-pointer">
                Exento de IVA (servicios médicos / prestaciones de salud)
              </Label>
            </div>

            {/* Detalle items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Detalle</Label>
                <Button variant="ghost" size="sm" className="text-xs h-6 text-orange-600" onClick={addDetalleRow}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar línea
                </Button>
              </div>
              <div className="space-y-2">
                {form.detalle.map((item, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      {i === 0 && <Label className="text-[10px] text-gray-400">Descripción</Label>}
                      <Input
                        value={item.descripcion}
                        onChange={e => updateDetalle(i, 'descripcion', e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Sesión de odontología"
                      />
                    </div>
                    <div className="w-16">
                      {i === 0 && <Label className="text-[10px] text-gray-400">Cant.</Label>}
                      <Input
                        type="number"
                        value={item.cantidad}
                        onChange={e => updateDetalle(i, 'cantidad', e.target.value)}
                        className="h-8 text-xs text-center"
                        min="1"
                      />
                    </div>
                    <div className="w-28">
                      {i === 0 && <Label className="text-[10px] text-gray-400">Precio unit.</Label>}
                      <Input
                        type="number"
                        value={item.precio_unitario}
                        onChange={e => updateDetalle(i, 'precio_unitario', e.target.value)}
                        className="h-8 text-xs text-right"
                      />
                    </div>
                    {form.detalle.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => removeDetalleRow(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals preview */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Neto:</span>
                <span>{formatCLP(formTotals.neto)}</span>
              </div>
              {!form.es_exento && (
                <div className="flex justify-between">
                  <span className="text-gray-500">IVA (19%):</span>
                  <span>{formatCLP(formTotals.iva)}</span>
                </div>
              )}
              {form.es_exento && (
                <div className="flex justify-between text-gray-400">
                  <span>Exento de IVA</span>
                  <span>{formatCLP(formTotals.exento)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t pt-1">
                <span>Total:</span>
                <span className="text-orange-700">{formatCLP(formTotals.total)}</span>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label className="text-xs">Notas internas (no van al documento)</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1 text-sm resize-none"
                rows={2}
                placeholder="Observaciones..."
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Guardar borrador
            </Button>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleSave(true)} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Emitir documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL: DETALLE ========== */}
      <Dialog open={!!detailModal} onOpenChange={(open) => !open && setDetailModal(null)}>
        <DialogContent className="max-w-md">
          {detailModal && (() => {
            const inv = detailModal;
            const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base flex items-center gap-2">
                    {DOC_TYPES[inv.document_type]}
                    <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                      {statusCfg.label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 py-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Receptor</p>
                      <p className="font-medium">{inv.receptor_nombre || '-'}</p>
                      <p className="text-xs text-gray-500">{inv.receptor_rut || 'Sin RUT'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Emisor</p>
                      <p className="font-medium">{inv.emisor_razon_social || '-'}</p>
                      <p className="text-xs text-gray-500">{inv.emisor_rut || 'Sin RUT'}</p>
                    </div>
                  </div>

                  {/* Detalle items */}
                  {inv.detalle && Array.isArray(inv.detalle) && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Detalle</p>
                      {inv.detalle.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1 mb-1">
                          <span>{item.descripcion} x{item.cantidad}</span>
                          <span className="font-medium">{formatCLP(item.cantidad * item.precio_unitario)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span>Neto:</span><span>{formatCLP(inv.monto_neto)}</span></div>
                    {inv.monto_iva > 0 && <div className="flex justify-between"><span>IVA:</span><span>{formatCLP(inv.monto_iva)}</span></div>}
                    {inv.es_exento && <div className="flex justify-between text-gray-400"><span>Exento</span><span>{formatCLP(inv.monto_exento)}</span></div>}
                    <div className="flex justify-between font-bold text-sm border-t pt-1">
                      <span>Total:</span>
                      <span className="text-orange-700">{formatCLP(inv.monto_total)}</span>
                    </div>
                  </div>

                  {inv.folio && (
                    <p className="text-xs text-gray-500">Folio SII: {inv.folio} · Track: {inv.track_id}</p>
                  )}

                  {inv.notes && (
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Notas</p>
                      <p className="text-xs text-gray-600">{inv.notes}</p>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  {inv.status === 'draft' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                        onClick={() => updateStatus(inv.id, 'cancelled')}
                      >
                        Anular
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                        onClick={() => updateStatus(inv.id, 'issued')}
                      >
                        Marcar como emitida
                      </Button>
                    </>
                  )}
                  {inv.status === 'issued' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => updateStatus(inv.id, 'accepted')}
                    >
                      Marcar como aceptada por SII
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default InvoicingPanel;