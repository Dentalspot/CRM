import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMarketplaceAccess } from '@/features/marketplace/hooks/useMarketplaceAccess';
import MarketplaceAccessAlert from '@/components/MarketplaceAccessAlert';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, MoreHorizontal, Eye, Loader2, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchSellerListings } from '@/features/marketplace/api/sellerApi';
import { supabase } from '@/lib/supabaseClient';

const STATUS_MAP = {
  approved: { label: 'Aprobado',  variant: 'default' },
  pending:  { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  draft:    { label: 'Borrador',  variant: 'outline' },
};

const TherapistProductsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canSell, restrictions, isLoading: accessLoading } = useMarketplaceAccess();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user?.id) loadProducts();
  }, [user?.id]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchSellerListings(user.id);
      setProducts(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al cargar productos', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    setDeletingId(productId);
    try {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', productId)
        .eq('seller_id', user.id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: '🗑️ Producto eliminado' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(p =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
      <DashboardHeader title="Mis Productos" description="Administra tu catálogo de recursos" />

      <main className="p-6 space-y-6">
        {!accessLoading && !canSell && (
          <MarketplaceAccessAlert restrictions={restrictions} className="mb-6" />
        )}

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild disabled={!canSell}>
            <Link to={canSell ? '/dashboard/therapist/marketplace/create' : '#'}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Link>
          </Button>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'No se encontraron productos.' : 'Aún no tienes productos publicados.'}
                      </p>
                      {!searchTerm && canSell && (
                        <Button asChild variant="outline" className="mt-3">
                          <Link to="/dashboard/therapist/marketplace/create">
                            <Plus className="h-4 w-4 mr-2" /> Publicar primer producto
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => {
                    const statusCfg = STATUS_MAP[product.status] || STATUS_MAP.pending;
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {product.thumbnail_url ? (
                              <img
                                src={product.thumbnail_url}
                                alt={product.title}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <span className="line-clamp-1">{product.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {product.item_type || '—'}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(product.price || 0).toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {product.sales_count ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                {deletingId === product.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <MoreHorizontal className="h-4 w-4" />
                                }
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              {canSell && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/dashboard/therapist/marketplace/edit/${product.id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link to={`/marketplace/product/${product.id}`} target="_blank">
                                  <Eye className="mr-2 h-4 w-4" /> Ver publicación
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(product.id)}
                                disabled={deletingId === product.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default TherapistProductsPage;