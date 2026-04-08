import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { fetchAllWithdrawals, updateWithdrawalStatus } from '../api/withdrawalsApi';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';
import { format } from 'date-fns';

const WithdrawalsManagementPage = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Action Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'complete' | 'reject' | 'process'
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllWithdrawals(filter);
      setWithdrawals(data);
    } catch (error) {
      logger.error(error);
      toast({ variant: 'destructive', title: 'Error al cargar retiros' });
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes('');
    setIsModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;
    
    setProcessing(true);
    try {
      let newStatus = '';
      if (actionType === 'complete') newStatus = 'completed';
      if (actionType === 'reject') newStatus = 'rejected';
      if (actionType === 'process') newStatus = 'processing';

      await updateWithdrawalStatus(selectedRequest.id, newStatus, adminNotes);
      
      toast({ title: 'Estado actualizado correctamente' });
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200"><CheckCircle className="w-3 h-3 mr-1"/> Completado</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"><Clock className="w-3 h-3 mr-1"/> Pendiente</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200"><Loader2 className="w-3 h-3 mr-1"/> Procesando</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200"><XCircle className="w-3 h-3 mr-1"/> Rechazado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Helmet><title>Gestión de Retiros | Admin</title></Helmet>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Retiro</h1>
          <p className="text-gray-500">Administra y procesa los pagos a terapeutas.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="completed">Completados</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
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
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No hay solicitudes.</TableCell></TableRow>
              ) : (
                withdrawals.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.requested_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{req.user?.full_name}</div>
                      <div className="text-xs text-gray-500">{req.user?.email}</div>
                      <div className="text-xs text-gray-400">RUT: {req.user?.rut}</div>
                    </TableCell>
                    <TableCell className="font-bold text-lg">{formatCurrency(req.amount)}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <p><span className="font-semibold">Banco:</span> {req.bank_account_data?.bankName}</p>
                        <p><span className="font-semibold">Cuenta:</span> {req.bank_account_data?.accountNumber} ({req.bank_account_data?.accountType})</p>
                        <p><span className="font-semibold">Titular:</span> {req.bank_account_data?.holderName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {req.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openActionModal(req, 'process')}>
                            Procesar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openActionModal(req, 'reject')}>
                            Rechazar
                          </Button>
                        </>
                      )}
                      {req.status === 'processing' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openActionModal(req, 'complete')}>
                          Completar
                        </Button>
                      )}
                      {req.status === 'rejected' && <span className="text-xs text-gray-400 italic">Reembolsado</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'process' && 'Marcar como Procesando'}
              {actionType === 'complete' && 'Marcar como Completado'}
              {actionType === 'reject' && 'Rechazar Solicitud'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'reject' 
                ? 'El dinero será devuelto automáticamente a la billetera del usuario.' 
                : 'Esta acción notificará al usuario sobre el cambio de estado.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 bg-slate-50 p-3 rounded text-sm">
              <p><strong>Solicitante:</strong> {selectedRequest?.user?.full_name}</p>
              <p><strong>Monto:</strong> {selectedRequest && formatCurrency(selectedRequest.amount)}</p>
            </div>
            
            <label className="text-sm font-medium mb-2 block">
              {actionType === 'reject' ? 'Motivo del rechazo (Obligatorio)' : 'Notas internas / Comprobante (Opcional)'}
            </label>
            <Textarea 
              value={adminNotes} 
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder={actionType === 'reject' ? 'Ej. Datos bancarios incorrectos' : 'Ej. Transferencia #123456'}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleConfirmAction} 
              disabled={processing || (actionType === 'reject' && !adminNotes.trim())}
              className={actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalsManagementPage;