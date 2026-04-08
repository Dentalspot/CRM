import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Download,
  CreditCard,
  PieChart,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatMarketplacePrice } from '@/lib/constants/marketplace';
import { fetchSellerSales, fetchSellerStats } from '../api/sellerApi';
import { useToast } from '@/components/ui/use-toast';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const EarningsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ grossRevenue: 0, totalCommission: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [period, setPeriod] = useState('30days');
  const [productType, setProductType] = useState('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, period, productType]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate = subDays(now, 30).toISOString();
      
      if (period === 'thisMonth') {
        startDate = startOfMonth(now).toISOString();
      } else if (period === 'lastMonth') {
        startDate = startOfMonth(subDays(startOfMonth(now), 1)).toISOString();
      } else if (period === '90days') {
        startDate = subDays(now, 90).toISOString();
      } else if (period === 'year') {
        startDate = subDays(now, 365).toISOString();
      }

      const filters = {
        startDate,
        type: productType
      };

      const [salesData, statsData] = await Promise.all([
        fetchSellerSales(user.id, filters),
        fetchSellerStats(user.id) // Global stats, not filtered by date for the summary cards usually
      ]);

      setSales(salesData);
      
      // Recalculate stats for the specific period from salesData if needed
      // Or use global stats. Let's use filtered stats for the panel to be reactive
      const filteredGross = salesData.reduce((sum, s) => sum + (s.amount_gross || 0), 0);
      const filteredCommission = salesData.reduce((sum, s) => sum + (s.commission || 0), 0);
      const filteredNet = filteredGross - filteredCommission;

      setStats({
        grossRevenue: filteredGross,
        totalCommission: filteredCommission,
        totalRevenue: filteredNet
      });

    } catch (error) {
      logger.error(error);
      toast({ variant: "destructive", title: "Error al cargar ganancias" });
    } finally {
      setLoading(false);
    }
  };

  // Helper for Chart (Visual placeholder for now as we don't have a charting lib installed by default other than custom SVG)
  const renderMiniChart = () => {
    if (sales.length === 0) return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Sin datos para graficar</div>;
    
    // Group by day for the chart
    const daysMap = {};
    sales.forEach(sale => {
      const day = format(new Date(sale.date), 'yyyy-MM-dd');
      daysMap[day] = (daysMap[day] || 0) + sale.amount_net;
    });

    const maxVal = Math.max(...Object.values(daysMap), 10000);
    const sortedDays = Object.keys(daysMap).sort().slice(-14); // Last 14 active days max

    return (
      <div className="h-40 flex items-end justify-between gap-1 pt-4">
        {sortedDays.map(day => {
          const val = daysMap[day];
          const height = Math.max((val / maxVal) * 100, 5); // min 5% height
          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1 group">
              <div 
                className="w-full bg-teal-500/20 group-hover:bg-teal-500/40 rounded-t-sm transition-all relative"
                style={{ height: `${height}%` }}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                  {formatMarketplacePrice(val)}
                </div>
              </div>
              <span className="text-[10px] text-gray-400 rotate-0 md:rotate-0">
                {format(parseISO(day), 'dd/MM')}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Ganancias</h2>
          <p className="text-gray-500">Desglose detallado de tus ventas y comisiones.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="plan">Planes</SelectItem>
              <SelectItem value="activity">Actividades</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="90days">Últimos 90 días</SelectItem>
              <SelectItem value="thisMonth">Este Mes</SelectItem>
              <SelectItem value="lastMonth">Mes Pasado</SelectItem>
              <SelectItem value="year">Último Año</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-l-4 border-l-teal-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Ganancia Neta (Tú recibes)
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-teal-700">
              {formatMarketplacePrice(stats.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              Disponible para retiro
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Ventas Brutas
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {formatMarketplacePrice(stats.grossRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              Total pagado por clientes
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-purple-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Comisión Plataforma (30%)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-gray-600">
              {formatMarketplacePrice(stats.totalCommission)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">
              Deducido automáticamente
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Ingresos</CardTitle>
            <CardDescription>Comportamiento de tus ventas netas en el periodo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderMiniChart()}
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-gray-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Próximo pago estimado</span>
              <span className="font-medium text-gray-900">15 de {format(new Date(), 'MMMM', { locale: es })}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Estado de cuenta</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Al día</Badge>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Método de pago</span>
                <span>Transferencia Bancaria</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900">
              Configurar Datos Bancarios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Detalle de cada venta realizada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">Precio Venta</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-right font-bold text-teal-700">Tu Neto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Cargando...</TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    No hay ventas registradas en este periodo.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium text-xs">
                      {format(new Date(sale.date), "d MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{sale.product_name}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{sale.item_type === 'plan' ? 'Plan' : 'Recurso'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{sale.buyer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatMarketplacePrice(sale.amount_gross)}
                    </TableCell>
                    <TableCell className="text-right text-red-400 text-xs">
                      - {formatMarketplacePrice(sale.commission)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-teal-700">
                      {formatMarketplacePrice(sale.amount_net)}
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

export default EarningsPanel;