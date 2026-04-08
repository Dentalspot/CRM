import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, ArrowDownLeft, ArrowUpRight, History, Banknote, Loader2 } from 'lucide-react';
import { fetchWallet, fetchTransactions, fetchWithdrawals, requestWithdrawal } from '@/features/wallet/api/walletApi';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';
import { format } from 'date-fns';

const WalletTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankData, setBankData] = useState({
    bankName: '', accountType: '', accountNumber: '',
    rut: user?.rut || '', holderName: user?.full_name || '', email: user?.email || '',
  });
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [walletData, withdrawalsData] = await Promise.all([
        fetchWallet(user.id),
        fetchWithdrawals(user.id),
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalsData);
      if (walletData) {
        const txs = await fetchTransactions(walletData.id);
        setTransactions(txs);
      }
    } catch (error) {
      logger.error(error);
      toast({ variant: 'destructive', title: 'Error al cargar billetera' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { toast({ variant: 'destructive', title: 'Monto inválido' }); return; }
    if (amount > wallet?.balance) { toast({ variant: 'destructive', title: 'Saldo insuficiente' }); return; }
    if (!bankData.bankName || !bankData.accountNumber || !bankData.rut) { toast({ variant: 'destructive', title: 'Completa los datos bancarios' }); return; }

    setProcessingWithdrawal(true);
    try {
      await requestWithdrawal(user.id, wallet.id, amount, bankData);
      toast({ title: 'Solicitud de retiro enviada', description: 'Te notificaremos cuando sea procesada.' });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Completado</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pendiente</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Procesando</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Rechazado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-teal-600 to-teal-700 text-white border-0 shadow-lg md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-teal-100 font-medium text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Saldo Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">{formatCurrency(wallet?.balance || 0)}</div>
            <Button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="w-full bg-white text-teal-700 hover:bg-teal-50 border-0 font-semibold"
              disabled={!wallet || wallet.balance <= 0}
            >
              <Banknote className="h-4 w-4 mr-2" /> Solicitar Retiro
            </Button>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <Card className="md:col-span-2 bg-white">
          <CardHeader><CardTitle>Información de Pagos</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Tiempo de Retiro</span>
              <span>Aprox. 10 días hábiles bancarios.</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-900">Mínimo de Retiro</span>
              <span>$10.000 CLP</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg sm:col-span-2">
              <span className="font-semibold text-gray-900">Nota Importante</span>
              <span>Asegúrate de que el titular de la cuenta bancaria coincida con el RUT registrado en tu perfil.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions" className="gap-2"><History className="h-4 w-4" /> Movimientos</TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2"><Banknote className="h-4 w-4" /> Retiros</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-gray-500">Sin movimientos</TableCell></TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell>
                          {tx.type === 'credit' ? (
                            <span className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded w-fit">
                              <ArrowDownLeft className="h-3 w-3 mr-1" /> Ingreso
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded w-fit">
                              <ArrowUpRight className="h-3 w-3 mr-1" /> Egreso
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Estimación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">Sin solicitudes de retiro</TableCell></TableRow>
                  ) : (
                    withdrawals.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>{format(new Date(req.requested_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(req.amount)}</TableCell>
                        <TableCell>{req.bank_account_data?.bankName || 'N/A'}</TableCell>
                        <TableCell>{req.estimated_completion_date ? format(new Date(req.estimated_completion_date), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Solicitar Retiro de Fondos</DialogTitle>
            <DialogDescription>Transfiere tu saldo disponible a tu cuenta bancaria.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-teal-50 p-3 rounded-md text-teal-800 text-sm font-medium flex justify-between">
              <span>Saldo Disponible:</span>
              <span>{formatCurrency(wallet?.balance || 0)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto a retirar</Label>
              <Input id="amount" type="number" placeholder="0" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} max={wallet?.balance} />
            </div>
            <div className="space-y-3 pt-2">
              <h4 className="font-medium text-sm text-gray-900 border-b pb-1">Datos Bancarios</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="bank" className="text-xs">Banco</Label>
                  <Input id="bank" value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} placeholder="Ej. Banco Estado" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="type" className="text-xs">Tipo Cuenta</Label>
                  <Input id="type" value={bankData.accountType} onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })} placeholder="Ej. Vista / Corriente" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="number" className="text-xs">Número de Cuenta</Label>
                <Input id="number" value={bankData.accountNumber} onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rut" className="text-xs">RUT Titular</Label>
                  <Input id="rut" value={bankData.rut} onChange={(e) => setBankData({ ...bankData, rut: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="holder" className="text-xs">Nombre Titular</Label>
                  <Input id="holder" value={bankData.holderName} onChange={(e) => setBankData({ ...bankData, holderName: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleRequestWithdrawal}
              disabled={processingWithdrawal || Number(withdrawAmount) > (wallet?.balance || 0)}
              className="bg-teal-600 hover:bg-teal-700">
              {processingWithdrawal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Retiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletTab;
