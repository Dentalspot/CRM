import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Package, Search, ArrowLeft, ShoppingBag, UserPlus, Clock,
  CheckCircle2, Heart, Eye, Star, Tag,
} from 'lucide-react';
import EmptyState from '@/features/marketplace/components/EmptyState';
import AssignPlanningModal from '@/features/marketplace/components/AssignPlanningModal';
import { fetchMyPurchases } from '@/features/marketplace/api/marketplacePlansApi';

/**
 * MyPlanningsPage v2 — Lee de marketplace_purchases JOIN marketplace_plans.
 *
 * Cada item muestra:
 * - plan.name, plan.author_name, plan.duration_weeks (de marketplace_plans)
 * - purchase.completed_at (fecha de compra)
 * - purchase.cloned_plan_id (indica si ya se clonó al workspace)
 * - target_diagnosis (chips de diagnóstico)
 * - target_age_min/max (rango etario)
 */

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const MyPlanningsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const loadPurchases = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await fetchMyPurchases(user.id);
      setPurchases(data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  const handleAssignClick = (purchase) => {
    setSelectedPurchase(purchase);
    setAssignModalOpen(true);
  };

  const handleAssignSuccess = (patientNames) => {
    setAssignModalOpen(false);
    toast({
      title: 'Planificación asignada',
      description: `Asignada a ${patientNames.join(', ')}.`,
    });
  };

  // Filter by search
  const filtered = purchases.filter((p) => {
    if (!searchInput) return true;
    const q = searchInput.toLowerCase();
    const plan = p.plan;
    return (
      plan?.name?.toLowerCase().includes(q) ||
      plan?.description?.toLowerCase().includes(q) ||
      plan?.author_name?.toLowerCase().includes(q) ||
      plan?.target_diagnosis?.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-4xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <button onClick={() => navigate('/dashboard/marketplace')} className="hover:text-teal-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Mis Planificaciones</span>
        </nav>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-teal-600" />
              Mis Planificaciones
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Recursos adquiridos, listos para asignar a tus pacientes.
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-teal-700 border-teal-200 hover:bg-teal-50 gap-1.5"
            onClick={() => navigate('/dashboard/marketplace')}>
            <ShoppingBag className="h-4 w-4" /> Explorar más
          </Button>
        </div>
      </div>

      {/* Search */}
      {purchases.length > 3 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar en mis planificaciones..."
            className="pl-10 h-10 bg-white text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-xl">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && purchases.length === 0 && (
        <EmptyState
          icon={Package}
          title="Tu biblioteca está vacía"
          description="Las planificaciones que adquieras aparecerán aquí, listas para asignar a tus pacientes."
          actionLabel="Explorar recursos"
          onAction={() => navigate('/dashboard/marketplace')}
        />
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((purchase) => {
            const plan = purchase.plan;
            if (!plan) return null;

            return (
              <Card key={purchase.id} className="border-slate-200/80 hover:border-slate-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Cover or placeholder */}
                    <div className="h-20 w-20 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden">
                      {plan.cover_image_url ? (
                        <img src={plan.cover_image_url} alt={plan.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-slate-200">{plan.name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-[15px] line-clamp-1">{plan.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {plan.author_name} · Adquirido el {formatDate(purchase.completed_at)}
                          </p>
                        </div>
                      </div>

                      {/* Meta chips */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {plan.target_diagnosis?.slice(0, 2).map((d) => (
                          <Badge key={d} variant="outline" className="text-[10px] py-0 text-slate-500 border-slate-200">
                            {d}
                          </Badge>
                        ))}
                        {plan.duration_weeks > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" /> {plan.duration_weeks} sem.
                          </span>
                        )}
                        {plan.average_rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {plan.average_rating.toFixed(1)}
                          </span>
                        )}
                        {purchase.cloned_plan_id && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] gap-1 py-0">
                            <CheckCircle2 className="h-3 w-3" /> Clonado
                          </Badge>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs h-8 gap-1.5"
                          onClick={() => handleAssignClick(purchase)}>
                          <UserPlus className="h-3.5 w-3.5" /> Asignar a paciente
                        </Button>
                        {!purchase.is_own && (
                          <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-500 gap-1"
                            onClick={() => navigate(`/dashboard/marketplace/plan/${plan.slug || plan.id}`)}>
                            <Eye className="h-3.5 w-3.5" /> Ver detalle
                          </Button>
                        )}
                        {purchase.is_own && !purchase.is_purchasable && (
                          <Button variant="outline" size="sm" className="text-xs h-8 text-purple-600 border-purple-200 hover:bg-purple-50 gap-1.5"
                            onClick={() => navigate('/dashboard/therapist/marketplace/create')}>
                            <ShoppingBag className="h-3.5 w-3.5" /> Publicar en Marketplace
                          </Button>
                        )}
                        {purchase.is_own && purchase.is_purchasable && (
                          <Badge className="bg-purple-50 text-purple-700 border-0 text-[10px] gap-1 py-0.5">
                            <ShoppingBag className="h-3 w-3" /> En Marketplace
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && purchases.length > 0 && (
        <p className="text-xs text-slate-400 text-center pt-2">
          {purchases.length} recurso{purchases.length !== 1 ? 's' : ''} en tu biblioteca
        </p>
      )}

      {/* Assign Modal */}
      {assignModalOpen && selectedPurchase && (
        <AssignPlanningModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          purchase={selectedPurchase}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};

export default MyPlanningsPage;
