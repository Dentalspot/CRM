import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, CheckCircle2, XCircle, Eye, Package, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import logger from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/adminUtils';

const STATUS_MAP = {
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-200' },
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ProductsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_items')
        .select('id, title, price, item_type, is_active, is_approved, seller_id, created_at, category')
        .order('created_at', { ascending: false });

      if (filter === 'pending') query = query.eq('is_approved', false).eq('is_active', true);
      else if (filter === 'approved') query = query.eq('is_approved', true);
      else if (filter === 'rejected') query = query.eq('is_approved', false).eq('is_active', false);

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      logger.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await supabase.from('marketplace_items').update({ is_approved: true, is_active: true }).eq('id', id);
      toast({ title: 'Producto aprobado' });
      loadProducts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;
    setProcessing(id);
    try {
      await supabase.from('marketplace_items').update({ is_approved: false, is_active: false }).eq('id', id);
      toast({ title: 'Producto rechazado' });
      loadProducts();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessing(null);
    }
  };

  const filtered = search
    ? products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : products;

  const pendingCount = products.filter(p => !p.is_approved && p.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos del Marketplace</h1>
          <p className="text-muted-foreground text-sm">Revisa, aprueba o rechaza productos publicados por dentistas</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pendientes</Badge>}
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." className="pl-9" />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="approved">Aprobados</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay productos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(product => {
                  const statusKey = product.is_approved ? 'approved' : (product.is_active ? 'pending' : 'rejected');
                  const statusCfg = STATUS_MAP[statusKey];
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-slate-400" /></div>
                          <span className="font-medium text-sm truncate max-w-[200px]">{product.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{product.item_type || '—'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(product.price || 0)}</TableCell>
                      <TableCell><Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(product.created_at).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/marketplace/products/${product.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </Button>
                          {!product.is_approved && product.is_active && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(product.id)} disabled={processing === product.id}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(product.id)} disabled={processing === product.id}>
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPage;
