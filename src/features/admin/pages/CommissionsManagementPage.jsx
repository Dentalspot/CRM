import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';
import { format } from 'date-fns';

const CommissionsManagementPage = () => {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          therapist:profiles!therapist_id(full_name, email, rut),
          sale:sales(product_id, created_at, product:marketplace_items(title))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      logger.error('Error loading commissions:', error);
      toast({ variant: 'destructive', title: 'Error al cargar comisiones' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (commissionId) => {
    if (!window.confirm('¿Confirmas que has realizado el pago a este terapeuta?')) return;
    
    setProcessingId(commissionId);
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ 
          status: 'paid', 
          payment_date: new Date().toISOString() 
        })
        .eq('id', commissionId);

      if (error) throw error;

      toast({ title: 'Comisión marcada como pagada' });
      setCommissions(prev => prev.filter(c => c.id !== commissionId));
    } catch (error) {
      logger.error(error);
      toast({ variant: 'destructive', title: 'Error al actualizar estado' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Gestión de Pagos Pendientes | Admin</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagos Pendientes</h1>
        <p className="text-gray-500">Administra las comisiones pendientes de pago a los dentistas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cola de Pagos</CardTitle>
          <CardDescription>Lista de comisiones generadas que aún no han sido desembolsadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Venta</TableHead>
                <TableHead>Terapeuta</TableHead>
                <TableHead>Producto Vendido</TableHead>
                <TableHead className="text-right">Monto a Pagar (70%)</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p>¡Todo al día! No hay pagos pendientes.</p>
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      {format(new Date(comm.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{comm.therapist?.full_name}</div>
                      <div className="text-xs text-gray-500">{comm.therapist?.email}</div>
                      <div className="text-xs text-gray-400">RUT: {comm.therapist?.rut || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {comm.sale?.product?.title || 'Producto desconocido'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatCurrency(comm.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleMarkAsPaid(comm.id)}
                        disabled={processingId === comm.id}
                      >
                        {processingId === comm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar Pagado'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsManagementPage;