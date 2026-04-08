import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, AlertCircle, FileText, CreditCard, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const statusConfig = {
  pagada: { class: 'bg-green-100 text-green-700', icon: CheckCircle },
  pendiente: { class: 'bg-amber-100 text-amber-700', icon: Clock },
  vencida: { class: 'bg-red-100 text-red-700', icon: AlertCircle },
  borrador: { class: 'bg-gray-100 text-gray-700', icon: FileText },
};

const BillingHistory = ({ userId }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('billing_invoices')
          .select('*')
          .eq('therapist_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setInvoices(data || []);
      } catch (error) {
        logger.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [userId]);

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.borrador;
    const Icon = config.icon;
    return (
      <Badge className={cn("capitalize", config.class)}>
        <Icon className="h-3 w-3 mr-1" /> {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Aún no tienes facturas</p>
        <p className="text-sm">Tus facturas aparecerán aquí una vez que realices un pago</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Factura</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono text-sm">
                {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {invoice.period_start && invoice.period_end ? (
                  <>{format(new Date(invoice.period_start), 'dd/MM/yy')} - {format(new Date(invoice.period_end), 'dd/MM/yy')}</>
                ) : '-'}
              </TableCell>
              <TableCell className="font-semibold">${invoice.total_amount?.toLocaleString('es-CL')}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {format(new Date(invoice.created_at), "d MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BillingHistory;
