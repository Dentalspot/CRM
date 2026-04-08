import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Receipt,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia Bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
  { value: 'fonasa', label: 'Fonasa' },
  { value: 'isapre', label: 'Isapre' },
  { value: 'otro', label: 'Otro' },
];

const PaymentStatusTab = ({ patient, appointments = [] }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Delete confirmation state
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'transferencia',
    payment_reference: '',
    concept: 'Sesión de terapia',
    notes: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'completed'
  });

  // =====================================================
  // LOAD PAYMENTS
  // =====================================================

  useEffect(() => {
    if (patient?.id) {
      loadPayments();
    } else {
      setLoading(false);
    }
  }, [patient?.id]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_payments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      logger.error('Error loading payments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los pagos'
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // APPOINTMENTS WITH PAYMENT STATUS
  // =====================================================

  const appointmentsWithPaymentStatus = useMemo(() => {
    // Filtrar solo citas completadas o agendadas
    const relevantAppointments = appointments.filter(apt =>
      ['completed', 'scheduled', 'confirmed'].includes(apt.status)
    );

    return relevantAppointments.map(apt => {
      // Buscar si hay un pago asociado a esta cita
      const linkedPayment = payments.find(p => p.appointment_id === apt.id);

      return {
        ...apt,
        payment: linkedPayment || null,
        paymentStatus: linkedPayment?.status === 'completed' ? 'paid' :
          linkedPayment?.status === 'pending' ? 'pending' :
            'unpaid'
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [appointments, payments]);

  // =====================================================
  // STATS CALCULATION
  // =====================================================

  const stats = useMemo(() => {
    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');

    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Contar sesiones
    const completedSessions = appointments.filter(apt => apt.status === 'completed').length;
    const paidSessions = appointmentsWithPaymentStatus.filter(apt => apt.paymentStatus === 'paid').length;
    const unpaidSessions = appointmentsWithPaymentStatus.filter(apt =>
      apt.status === 'completed' && apt.paymentStatus === 'unpaid'
    ).length;

    return {
      totalRevenue,
      pendingAmount,
      paidSessions,
      totalSessions: completedSessions,
      unpaidSessions,
      totalPayments: payments.length
    };
  }, [payments, appointments, appointmentsWithPaymentStatus]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_method: 'transferencia',
      payment_reference: '',
      concept: 'Sesión de terapia',
      notes: '',
      payment_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    });
    setEditingPayment(null);
    setSelectedAppointment(null);
  };

  const handleOpenModal = (payment = null, appointment = null) => {
    if (payment) {
      // Editing existing payment
      setEditingPayment(payment);
      setSelectedAppointment(null);
      setFormData({
        amount: payment.amount?.toString() || '',
        payment_method: payment.payment_method || 'transferencia',
        payment_reference: payment.payment_reference || '',
        concept: payment.concept || 'Sesión de terapia',
        notes: payment.notes || '',
        payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
        status: payment.status || 'completed'
      });
    } else if (appointment) {
      // Creating payment for specific appointment
      setEditingPayment(null);
      setSelectedAppointment(appointment);

      // Try to get price from service
      const servicePrice = appointment.service?.price_clp || appointment.therapist_services?.price_clp || '';

      setFormData({
        amount: servicePrice?.toString() || '',
        payment_method: 'transferencia',
        payment_reference: '',
        concept: `Sesión ${appointment.date ? format(new Date(appointment.date), "dd/MM/yyyy") : ''}`,
        notes: '',
        payment_date: appointment.date || new Date().toISOString().split('T')[0],
        status: 'completed'
      });
    } else {
      // Creating new payment without appointment
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || parseInt(formData.amount) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El monto debe ser mayor a 0'
      });
      return;
    }

    setSaving(true);
    try {
      const paymentData = {
        patient_id: patient.id,
        therapist_id: user.id,
        amount: parseInt(formData.amount),
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        concept: formData.concept || 'Sesión de terapia',
        notes: formData.notes || null,
        payment_date: formData.payment_date,
        status: formData.status,
        appointment_id: selectedAppointment?.id || editingPayment?.appointment_id || null,
        updated_at: new Date().toISOString()
      };

      if (editingPayment) {
        const { error } = await supabase
          .from('patient_payments')
          .update(paymentData)
          .eq('id', editingPayment.id);

        if (error) throw error;
        toast({ title: '✅ Pago actualizado' });
      } else {
        const { error } = await supabase
          .from('patient_payments')
          .insert(paymentData);

        if (error) throw error;
        toast({ title: '✅ Pago registrado' });
      }

      handleCloseModal();
      loadPayments();
    } catch (error) {
      logger.error('Error saving payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (paymentId) => {
    setPaymentToDelete(paymentId);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('patient_payments')
        .delete()
        .eq('id', paymentToDelete);

      if (error) throw error;

      toast({ title: '✅ Pago eliminado' });
      loadPayments();
    } catch (error) {
      logger.error('Error deleting payment:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: error.message
      });
    } finally {
      setIsDeleting(false);
      setPaymentToDelete(null);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Pagado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Sin pago</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAppointmentStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Completada</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Agendada</Badge>;
      case 'confirmed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Confirmada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method || 'No especificado';
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Recaudado</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pendiente</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(stats.pendingAmount)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Pagos Registrados</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalPayments}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Sesiones Completadas</p>
                <p className="text-2xl font-bold text-purple-700">{stats.totalSessions}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments with Payment Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center text-teal-700">
            <CalendarCheck className="mr-2 h-5 w-5" /> Sesiones y Estado de Pago
          </CardTitle>
          <Button onClick={() => handleOpenModal()} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Registrar Pago
          </Button>
        </CardHeader>
        <CardContent>
          {appointmentsWithPaymentStatus.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
              <div className="bg-teal-100 p-3 rounded-full inline-flex mb-3">
                <CalendarCheck className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sin sesiones registradas</h3>
              <p className="text-gray-500 mt-1">Las sesiones agendadas aparecerán aquí con su estado de pago.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hora</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado Cita</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Estado Pago</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Monto</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentsWithPaymentStatus.map((apt) => (
                    <tr key={apt.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {format(new Date(apt.date), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {apt.start_time?.slice(0, 5) || '--:--'}
                      </td>
                      <td className="py-3 px-4">
                        {getAppointmentStatusBadge(apt.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getPaymentStatusBadge(apt.paymentStatus)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right">
                        {apt.payment ? formatCurrency(apt.payment.amount) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          {apt.paymentStatus === 'unpaid' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleOpenModal(null, apt)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Pagar
                            </Button>
                          ) : apt.payment ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenModal(apt.payment)}
                              >
                                <Edit2 className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(apt.payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Sessions Alert */}
      {stats.unpaidSessions > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Sesiones Pendientes de Pago</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Hay {stats.unpaidSessions} sesión(es) completada(s) sin pago registrado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History (Pagos sin cita asociada) */}
      {payments.filter(p => !p.appointment_id).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center text-green-700">
              <CreditCard className="mr-2 h-5 w-5" /> Otros Pagos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Concepto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Método</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Monto</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => !p.appointment_id).map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: es })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {payment.concept || 'Pago'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-right">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenModal(payment)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteClick(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Editar Pago' : selectedAppointment ? 'Registrar Pago de Sesión' : 'Registrar Nuevo Pago'}
            </DialogTitle>
            <DialogDescription>
              {selectedAppointment ? (
                <span className="flex items-center gap-2 mt-2 text-teal-600">
                  <CalendarCheck className="h-4 w-4" />
                  Sesión del {format(new Date(selectedAppointment.date), "dd 'de' MMMM, yyyy", { locale: es })}
                </span>
              ) : editingPayment ? (
                'Modifica los datos del pago registrado.'
              ) : (
                'Ingresa los datos del pago recibido.'
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto (CLP) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="35000"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Fecha de Pago *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleChange('payment_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pago</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(val) => handleChange('payment_method', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleChange('status', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Pagado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept">Concepto</Label>
              <Input
                id="concept"
                placeholder="Sesión de terapia"
                value={formData.concept}
                onChange={(e) => handleChange('concept', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_reference">Referencia / Comprobante</Label>
              <Input
                id="payment_reference"
                placeholder="Nº transferencia, voucher, etc."
                value={formData.payment_reference}
                onChange={(e) => handleChange('payment_reference', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</>
                ) : (
                  <><Receipt className="h-4 w-4 mr-2" /> {editingPayment ? 'Actualizar' : 'Registrar'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setPaymentToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Eliminando...</>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentStatusTab;