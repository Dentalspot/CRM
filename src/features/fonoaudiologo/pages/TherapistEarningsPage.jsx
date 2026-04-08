import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Loader2,
  Calendar as CalendarIcon,
  FileText,
  CreditCard,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchMyEarnings } from '../api/earningsApi';
import { useToast } from '@/components/ui/use-toast';

const TherapistEarningsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [], summary: {} });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ 
    start: '', 
    end: '' 
  });

  useEffect(() => {
    if (user) {
      loadEarnings();
    }
  }, [user, statusFilter, dateRange.start, dateRange.end]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const result = await fetchMyEarnings(user.id, {
        startDate: dateRange.start ? new Date(dateRange.start).toISOString() : null,
        endDate: dateRange.end ? new Date(dateRange.end).toISOString() : null,
        status: statusFilter
      });
      setData(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar ganancias",
        description: "No se pudieron obtener los datos de tus ventas."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data.transactions.length) return;

    const headers = ['Fecha', 'Nro Orden', 'Plantilla', 'Comprador', 'Monto Venta', 'Comisión Plataforma', 'Ganancia Neta', 'Estado'];
    const rows = data.transactions.map(t => [
      format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      t.orderNumber,
      `"${t.templateName.replace(/"/g, '""')}"`, // Escape quotes
      `"${t.buyerName}"`,
      t.amount,
      t.platformFee,
      t.netEarnings,
      t.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mis_ganancias_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">Pendiente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Procesando</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const { summary, transactions } = data;

  return (
    <div className="container mx-auto py-8 space-y-8 px-4 max-w-7xl">
      <Helmet>
        <title>Mis Ganancias | Panel Fonoaudiólogo</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mis Ganancias</h1>
          <p className="text-slate-500">Monitorea tus ingresos por ventas de plantillas y recursos.</p>
        </div>
        <div className="flex gap-2">
          {/* UPDATED LINK TO PROFILE */}
          <Link to="/dashboard/profile?tab=billing">
            <Button variant="outline" className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50">
              <CreditCard className="h-4 w-4" />
              Configurar Datos de Pago
            </Button>
          </Link>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2" disabled={transactions.length === 0}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-l-4 border-l-teal-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium text-teal-600">
              <DollarSign className="h-4 w-4" />
              Ganancias Totales
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {formatCurrency(summary?.totalEarnings || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Ingresos netos confirmados</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium text-blue-600">
              <TrendingUp className="h-4 w-4" />
              Ventas Realizadas
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {summary?.totalSales || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Total de recursos vendidos</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium text-amber-600">
              <Clock className="h-4 w-4" />
              Pendiente de Pago
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-slate-900">
              {formatCurrency(summary?.pendingCommissions || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">En proceso de liberación</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Detalle de cada venta realizada en el marketplace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-slate-50 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-500">Rango de Fechas</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input 
                      type="date" 
                      className="pl-9 w-[150px] bg-white"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative">
                    <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                    <Input 
                      type="date" 
                      className="pl-9 w-[150px] bg-white"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-500">Estado</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-slate-500">
              Mostrando {transactions.length} registros
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Recurso / Plantilla</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-right">Monto Venta</TableHead>
                  <TableHead className="text-right">Comisión Plataforma</TableHead>
                  <TableHead className="text-right">Tu Ganancia</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" /> Cargando movimientos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-slate-300" />
                        <p>No se encontraron transacciones en este periodo.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                        {format(new Date(tx.date), "dd/MM/yyyy", { locale: es })}
                        <div className="text-xs text-slate-400">{format(new Date(tx.date), "HH:mm")}</div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium text-slate-900 truncate" title={tx.templateName}>
                          {tx.templateName}
                        </div>
                        <div className="text-xs text-slate-500">Ord: {tx.orderNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">{tx.buyerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right text-red-400 text-xs">
                        - {formatCurrency(tx.platformFee)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-teal-600 text-base">
                        {formatCurrency(tx.netEarnings)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(tx.status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TherapistEarningsPage;