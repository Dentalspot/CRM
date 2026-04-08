import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/adminUtils';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const SalesDashboardPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    creatorEarnings: 0
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          seller:profiles!seller_id(full_name, email),
          buyer:profiles!buyer_id(full_name, email),
          product:marketplace_items(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSales(data || []);
      
      // Calculate Stats
      const totalRev = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const fees = data.reduce((acc, curr) => acc + Number(curr.commission_amount), 0);
      const earnings = data.reduce((acc, curr) => acc + Number(curr.creator_earnings), 0);

      setStats({
        totalRevenue: totalRev,
        platformFees: fees,
        creatorEarnings: earnings
      });

    } catch (error) {
      logger.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Helmet>
        <title>Dashboard de Ventas | Admin</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Ventas</h1>
        <p className="text-gray-500">Resumen global de transacciones del marketplace.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Volumen Total de Ventas</CardTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">Total bruto transaccionado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ingresos Plataforma (30%)</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(stats.platformFees)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">Comisiones retenidas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pagos a Creadores (70%)</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{formatCurrency(stats.creatorEarnings)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400">Monto distribuible a terapeutas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead className="text-right">Neto Creador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">{sale.product?.title || 'Producto eliminado'}</TableCell>
                  <TableCell>{sale.seller?.full_name}</TableCell>
                  <TableCell className="text-gray-500">{sale.buyer?.email}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(sale.amount)}</TableCell>
                  <TableCell className="text-right text-green-600">+{formatCurrency(sale.commission_amount)}</TableCell>
                  <TableCell className="text-right text-purple-600 font-bold">{formatCurrency(sale.creator_earnings)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesDashboardPage;