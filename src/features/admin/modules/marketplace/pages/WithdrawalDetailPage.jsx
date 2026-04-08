import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Wallet, CheckCircle, XCircle, Clock, BanknoteIcon } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { formatCurrency } from '@/lib/adminUtils';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  pending: { label: 'Pendiente', variant: 'outline', icon: Clock },
  paid: { label: 'Pagado', variant: 'default', icon: CheckCircle },
  completed: { label: 'Completado', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

const WithdrawalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayout = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_payouts')
        .select(`
          *,
          seller:profiles!author_id(id, full_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPayout(data);
    } catch (error) {
      console.error('Error fetching payout:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el detalle del retiro.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayout();
  }, [id]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('marketplace_payouts')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Retiro aprobado', description: 'El retiro ha sido marcado como pagado.' });
      fetchPayout();
    } catch (error) {
      console.error('Error approving payout:', error);
      toast({ title: 'Error', description: 'No se pudo aprobar el retiro.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('marketplace_payouts')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Retiro rechazado', description: 'El retiro ha sido cancelado.' });
      fetchPayout();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast({ title: 'Error', description: 'No se pudo rechazar el retiro.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/marketplace/withdrawals')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <p className="text-muted-foreground">No se encontro el retiro solicitado.</p>
      </div>
    );
  }

  const status = statusConfig[payout.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const metadata = payout.metadata || {};
  const bankDetails = metadata.bank_details || metadata;
  const hasBankInfo = bankDetails.bank_name || bankDetails.account_number || bankDetails.account_type;
  const isPending = payout.status === 'pending';

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/marketplace/withdrawals')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalle de Retiro</h1>
              <p className="text-sm text-muted-foreground">ID: {payout.id}</p>
            </div>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1 text-sm px-3 py-1">
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                Informacion del Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{payout.seller?.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{payout.seller?.email || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BanknoteIcon className="h-5 w-5" />
                Detalle del Monto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Monto Solicitado</p>
                <p className="text-2xl font-bold">{formatCurrency(payout.net_amount)}</p>
              </div>
              {payout.gross_amount > 0 && (
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Monto Bruto</p>
                    <p className="font-medium">{formatCurrency(payout.gross_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comision Plataforma</p>
                    <p className="font-medium">{formatCurrency(payout.platform_fee)}</p>
                  </div>
                </div>
              )}
              {payout.payment_method && (
                <div>
                  <p className="text-sm text-muted-foreground">Metodo de Pago</p>
                  <p className="font-medium">{payout.payment_method}</p>
                </div>
              )}
              {payout.payment_reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Referencia de Pago</p>
                  <p className="font-medium">{payout.payment_reference}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Details (from metadata) */}
          {hasBankInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos Bancarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bankDetails.bank_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p className="font-medium">{bankDetails.bank_name}</p>
                  </div>
                )}
                {bankDetails.account_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Cuenta</p>
                    <p className="font-medium">{bankDetails.account_type}</p>
                  </div>
                )}
                {bankDetails.account_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Numero de Cuenta</p>
                    <p className="font-medium">{bankDetails.account_number}</p>
                  </div>
                )}
                {bankDetails.rut && (
                  <div>
                    <p className="text-sm text-muted-foreground">RUT</p>
                    <p className="font-medium">{bankDetails.rut}</p>
                  </div>
                )}
                {bankDetails.holder_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Titular</p>
                    <p className="font-medium">{bankDetails.holder_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Solicitud</p>
                <p className="font-medium">{formatDate(payout.created_at)}</p>
              </div>
              {payout.period_start && payout.period_end && (
                <div>
                  <p className="text-sm text-muted-foreground">Periodo</p>
                  <p className="font-medium">
                    {formatDate(payout.period_start)} — {formatDate(payout.period_end)}
                  </p>
                </div>
              )}
              {payout.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                  <p className="font-medium">{formatDate(payout.paid_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {isPending && (
          <Card>
            <CardContent className="flex items-center justify-end gap-3 pt-6">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Rechazar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Aprobar Retiro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
};

export default WithdrawalDetailPage;
