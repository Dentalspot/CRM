import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { sanitizeHTML } from '@/lib/utils/sanitize';
import { formatCurrency } from '@/lib/adminUtils';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setProduct(data);
      setFeedback(data.admin_feedback || '');
    } catch (err) {
      logger.error('Error loading product:', err);
      toast({ variant: 'destructive', title: 'Error al cargar producto' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await supabase.from('marketplace_items')
        .update({ is_approved: true, is_active: true, admin_feedback: feedback || null })
        .eq('id', id);
      toast({ title: 'Producto aprobado' });
      loadProduct();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({ variant: 'destructive', title: 'Ingresa un motivo de rechazo' });
      return;
    }
    setProcessing(true);
    try {
      await supabase.from('marketplace_items')
        .update({ is_approved: false, is_active: false, admin_feedback: feedback })
        .eq('id', id);
      toast({ title: 'Producto rechazado' });
      loadProduct();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/marketplace/products')}>Volver</Button>
      </div>
    );
  }

  const statusKey = product.is_approved === true ? 'approved' : product.is_approved === false ? 'rejected' : 'pending';
  const statusLabels = { approved: 'Aprobado', rejected: 'Rechazado', pending: 'Pendiente de revisión' };
  const statusColors = { approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', pending: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" className="pl-0" onClick={() => navigate('/admin/marketplace/products')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a productos
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tipo: {product.item_type || '—'} · Categoría: {product.category || '—'}
          </p>
        </div>
        <Badge className={statusColors[statusKey]}>{statusLabels[statusKey]}</Badge>
      </div>

      {/* Product Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Package className="h-12 w-12 text-slate-300" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Precio</Label>
                <p className="text-2xl font-bold">{formatCurrency(product.price || 0)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Seller ID</Label>
                <p className="text-sm font-mono">{product.seller_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Creado</Label>
                <p className="text-sm">{new Date(product.created_at).toLocaleDateString('es-CL')}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </div>
            </div>
          </div>

          {product.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Descripción</Label>
              <div className="text-sm mt-1 p-3 bg-slate-50 rounded-lg border" dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.description) }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revisión del Administrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Feedback / Motivo (obligatorio para rechazo)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Escribe observaciones o motivo de rechazo..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Rechazar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Aprobar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetailPage;
