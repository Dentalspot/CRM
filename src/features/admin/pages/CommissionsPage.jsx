import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Search, 
  Filter, 
  Loader2, 
  DollarSign, 
  PieChart, 
  Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { fetchCommissionsData } from '../api/commissionsApi';

const CommissionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    pendingCount: 0,
    pendingAmount: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  useEffect(() => {
    loadData();
  }, [statusFilter, dateRange]); 

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCommissionsData({
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString(),
        status: statusFilter,
        therapistId: searchTerm
      });
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const s = status ? status.toLowerCase() : '';
    if (s === 'paid' || s === 'completed') return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">Pagado</Badge>;
    if (s === 'pending' || s === 'open') return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">Pendiente</Badge>;
    if (s === 'cancelled' || s === 'failed') return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Fallido</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTypeBadge = (type) => {
    if (type === 'Subscription') return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">Suscripción</Badge>;
    return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">Plantilla</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Comisiones y Pagos | Admin DentalSpot</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Comisiones y Pagos</h1>
          <p className="text-slate-500">Monitoreo de ingresos por suscripciones y ventas de plantillas.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <DollarSign className="h-4 w-4 text-green-600" />
              Ingresos Totales (Bruto)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Total recaudado en el periodo</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <PieChart className="h-4 w-4 text-blue-600" />
              Comisiones (10%)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalCommissions)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Ganancia calculada para la plataforma</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pagos Pendientes
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {formatCurrency(summary.pendingAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">{summary.pendingCount} transacciones por procesar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Detalle de todos los movimientos financieros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar Odontólogo..." 
                  className="pl-9" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button variant="secondary" onClick={handleSearch}>Buscar</Button>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              {/* Date Filters */}
              <div className="flex gap-2 items-center">
                <Input 
                  type="date" 
                  className="w-auto" 
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                />
                <span className="text-gray-400">-</span>
                <Input 
                  type="date" 
                  className="w-auto"
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Estado de Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Comisión (10%)</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex justify-center items-center gap-2 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" /> Cargando datos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No se encontraron transacciones para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-slate-700">
                        {format(new Date(tx.date), "dd/MM/yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{tx.name}</span>
                          <span className="text-xs text-slate-500">{tx.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(tx.commission)}
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
          
          <div className="text-xs text-slate-400 text-right">
            Mostrando {transactions.length} registros
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsPage;