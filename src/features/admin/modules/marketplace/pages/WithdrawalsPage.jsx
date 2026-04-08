
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fetchAllWithdrawals, updateWithdrawalStatus } from '@/features/admin/api/withdrawalsApi';
import { formatCurrency } from '@/lib/utils/formatters';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, Clock, Banknote, Eye } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionDialog, setActionDialog] = useState({ isOpen: false, type: null, withdrawal: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = typeof fetchAllWithdrawals === 'function' ? await fetchAllWithdrawals() : [];
      setWithdrawals(data || []);
    } catch (error) {
      logger.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los retiros. Intenta nuevamente.',
        variant: 'destructive',
      });
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async () => {
    const { type, withdrawal } = actionDialog;
    if (!withdrawal) return;

    try {
      setActionLoading(true);
      const newStatus = type === 'approve' ? 'completed' : 'rejected';
      const notes = type === 'reject' ? rejectReason : 'Aprobado por el administrador';

      if (typeof updateWithdrawalStatus === 'function') {
        await updateWithdrawalStatus(withdrawal.id, newStatus, notes);
      }

      toast({
        title: 'Éxito',
        description: `El retiro ha sido ${type === 'approve' ? 'aprobado' : 'rechazado'}.`,
      });

      setActionDialog({ isOpen: false, type: null, withdrawal: null });
      setRejectReason('');
      loadData();
    } catch (error) {
      logger.error('Error updating withdrawal:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la acción. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => 
    filterStatus === 'all' ? true : w.status === filterStatus
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">Pendiente</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100">Procesando</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">Completado</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">Rechazado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Summaries
  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;
  const pendingTotal = withdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount || 0), 0);
  
  const processingCount = withdrawals.filter((w) => w.status === 'processing').length;
  const processingTotal = withdrawals.filter((w) => w.status === 'processing').reduce((sum, w) => sum + Number(w.amount || 0), 0);
  
  const completedCount = withdrawals.filter((w) => w.status === 'completed').length;
  const completedTotal = withdrawals.filter((w) => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount || 0), 0);

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Gestión de Retiros" 
        description="Administra las solicitudes de retiro de fondos de los dentistas."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(pendingTotal)} en total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Procesando</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(processingTotal)} en total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(completedTotal)} en total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <CardTitle className="text-lg">Listado de Retiros</CardTitle>
          <div className="w-full md:w-64">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Cargando retiros...</p>
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
              <Banknote className="h-12 w-12 mb-4 text-muted" />
              <p className="text-lg font-medium">No se encontraron retiros</p>
              <p className="text-sm">No hay resultados para el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Datos Bancarios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => {
                    const bankData = withdrawal.bank_account_data || {};
                    const isActionable = withdrawal.status === 'pending' || withdrawal.status === 'processing';
                    
                    return (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="whitespace-nowrap">
                          {withdrawal.requested_at ? format(new Date(withdrawal.requested_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{withdrawal.user?.full_name || 'Usuario'}</div>
                          <div className="text-xs text-muted-foreground">{withdrawal.user?.email || ''}</div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {bankData.bank_name ? (
                            <div className="text-sm truncate" title={`${bankData.bank_name} - ${bankData.account_type} - ${bankData.account_number}`}>
                              {bankData.bank_name} <br />
                              <span className="text-xs text-muted-foreground">
                                N° {bankData.account_number?.slice(-4).padStart(bankData.account_number?.length, '*')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Datos no disponibles</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(withdrawal.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isActionable ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => setActionDialog({ isOpen: true, type: 'approve', withdrawal })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => setActionDialog({ isOpen: true, type: 'reject', withdrawal })}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Rechazar
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              <Eye className="h-4 w-4 mr-1" /> Procesado
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => !actionLoading && setActionDialog({ ...actionDialog, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Aprobar Retiro' : 'Rechazar Retiro'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {actionDialog.type === 'approve' ? (
              <p className="text-sm">
                ¿Estás seguro de que deseas marcar este retiro por <strong>{formatCurrency(actionDialog.withdrawal?.amount)}</strong> como completado? Esto indica que la transferencia bancaria ya fue realizada exitosamente.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">Indica el motivo del rechazo. Esta nota será visible para el terapeuta.</p>
                <Textarea 
                  placeholder="Ej: Los datos bancarios son inválidos..." 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialog({ isOpen: false, type: null, withdrawal: null })}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant={actionDialog.type === 'approve' ? 'default' : 'destructive'} 
              onClick={handleAction}
              disabled={actionLoading || (actionDialog.type === 'reject' && !rejectReason.trim())}
              className={actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog.type === 'approve' ? 'Aprobar Retiro' : 'Rechazar Retiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalsPage;
