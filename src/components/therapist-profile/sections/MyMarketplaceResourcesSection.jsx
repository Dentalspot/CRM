import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Download, ExternalLink, Package, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const TYPE_LABELS = {
  material: 'Material',
  template: 'Plantilla',
  plan: 'Plan',
  course: 'Curso',
  service: 'Servicio',
  physical: 'Físico',
  print_on_demand: 'Impresión',
};

const MyMarketplaceResourcesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadResources();
  }, [user?.id]);

  const loadResources = async () => {
    setLoading(true);
    try {
      // Fetch completed marketplace purchases (excluding plans which go to Planificar)
      const { data: purchases, error: purchaseError } = await supabase
        .from('marketplace_purchases')
        .select(`
          id, price_paid, currency, payment_status, created_at, completed_at,
          plan:marketplace_plans!marketplace_plan_id (
            id, name, description, cover_image_url, item_type, author_name,
            duration_weeks, total_sessions
          )
        `)
        .eq('buyer_id', user.id)
        .eq('payment_status', 'completed')
        .order('completed_at', { ascending: false });

      if (purchaseError) logger.warn('Error fetching marketplace purchases:', purchaseError);

      // Also fetch from marketplace_items purchases (wallet transactions)
      const { data: walletPurchases, error: walletError } = await supabase
        .from('wallet_transactions')
        .select('id, amount, description, reference_id, created_at')
        .eq('wallet_id', user.id)
        .eq('reference_type', 'purchase')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (walletError) logger.warn('Error fetching wallet purchases:', walletError);

      // Combine both sources
      const allResources = [];

      // Marketplace plan purchases
      (purchases || []).forEach(p => {
        if (p.plan) {
          allResources.push({
            id: p.id,
            name: p.plan.name,
            description: p.plan.description,
            image_url: p.plan.cover_image_url,
            item_type: p.plan.item_type || 'plan',
            author: p.plan.author_name,
            price: p.price_paid,
            date: p.completed_at || p.created_at,
            source: 'marketplace',
          });
        }
      });

      // Wallet item purchases (marketplace_items)
      (walletPurchases || []).forEach(t => {
        if (t.reference_id && !allResources.find(r => r.id === t.reference_id)) {
          allResources.push({
            id: t.id,
            name: t.description?.replace('Compra: ', '') || 'Recurso',
            description: null,
            image_url: null,
            item_type: 'material',
            author: null,
            price: t.amount,
            date: t.created_at,
            source: 'wallet',
          });
        }
      });

      setResources(allResources);
    } catch (err) {
      logger.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-teal-600" />
              Mis Recursos Adquiridos
            </CardTitle>
            <CardDescription>Recursos comprados en el Marketplace de DentalSpot</CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="mb-6 px-6 flex justify-end">
        <Button asChild>
          <Link to="/dashboard/marketplace">
            <ExternalLink className="mr-2 h-4 w-4" /> Explorar más
          </Link>
        </Button>
      </div>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No has adquirido recursos aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map(resource => (
              <div key={resource.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border hover:bg-slate-100 transition-colors">
                {resource.image_url ? (
                  <img src={resource.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-teal-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{resource.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      {TYPE_LABELS[resource.item_type] || resource.item_type}
                    </Badge>
                    {resource.author && (
                      <span className="text-[11px] text-muted-foreground">por {resource.author}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(resource.date), 'dd MMM yyyy', { locale: es })}
                  </p>
                  <p className="text-xs font-medium text-teal-600">
                    {resource.price === 0 ? 'Gratis' : `$${resource.price?.toLocaleString('es-CL')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyMarketplaceResourcesSection;
