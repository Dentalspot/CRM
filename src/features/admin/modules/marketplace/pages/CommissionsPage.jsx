import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, DollarSign, RefreshCw } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/adminUtils';

const CommissionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalSales: 0, totalCommissions: 0, totalPayouts: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .in('reference_type', ['sale', 'purchase'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const sales = (data || []).filter(t => t.reference_type === 'sale');
      const totalSales = sales.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCommissions = sales.reduce((sum, t) => sum + ((t.amount || 0) * 0.1 / 0.9), 0);

      setTransactions(data || []);
      setStats({
        totalSales,
        totalCommissions: Math.round(totalCommissions),
        totalPayouts: sales.length,
      });
    } catch (err) {
      logger.error('Error loading commissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = search
    ? transactions.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()))
    : transactions;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comisiones del Marketplace</h1>
          <p className="text-muted-foreground text-sm">Historial de ventas y comisiones de la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ventas Totales</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Comisiones (10%)</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCommissions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transacciones</p>
            <p className="text-2xl font-bold">{stats.totalPayouts}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transacción..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay transacciones</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-sm">{tx.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                        {tx.type === 'credit' ? 'Ingreso' : 'Egreso'}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.status || 'completed'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString('es-CL')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionsPage;
