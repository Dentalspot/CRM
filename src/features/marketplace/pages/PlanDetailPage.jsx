import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2, ArrowLeft, Star, Share2, ShieldCheck, Heart, CheckCircle2,
  Clock, CalendarDays, Sparkles, Users, Zap, BookOpen, Package, Tag,
  Play, FileDown, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import PurchaseModal from '@/features/marketplace/components/PurchaseModal';
import EmptyState from '@/features/marketplace/components/EmptyState';
import {
  fetchMarketplacePlanBySlug, checkPurchaseStatus, fetchRelatedPlans,
  incrementPlanViewCount, toggleFavorite,
} from '@/features/marketplace/api/marketplacePlansApi';

/**
 * PlanDetailPage — Ficha de producto unificada.
 * Lee de marketplace_plans (40+ columnas).
 *
 * ELIMINA: ProductDetailModal como flujo de compra.
 * ELIMINA: Rating hardcodeado, desglose de comisión, selector de cantidad.
 *
 * Reviews: marketplace_reviews FK es marketplace_item_id, no marketplace_plan_id.
 * Bridge: marketplace_items.plan_template_id = marketplace_plans.original_plan_id
 * Se resuelve encontrando el marketplace_item_id correspondiente.
 *
 * Campos ricos de marketplace_plans que ahora se aprovechan:
 * - cover_image_url, preview_video_url, sample_pdf_url (media)
 * - target_diagnosis (ARRAY), target_age_min/max (filtros clínicos)
 * - objectives_preview (jsonb)
 * - discount_percentage, discount_valid_until
 * - is_featured, tags, slug, meta_title, meta_description
 * - average_rating, review_count, purchase_count, view_count (métricas reales)
 */

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

const PlanDetailPage = () => {
  const { slugOrId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [plan, setPlan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedPlans, setRelatedPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadPlanDetail();
  }, [slugOrId, user]);

  const loadPlanDetail = async () => {
    try {
      setLoading(true);

      // 1. Fetch plan
      const planData = await fetchMarketplacePlanBySlug(slugOrId);
      if (!planData) throw new Error('Recurso no encontrado.');
      if (planData.status !== 'published' && user?.id !== planData.author_id) {
        throw new Error('Este recurso no está disponible.');
      }
      setPlan(planData);

      // 2. Increment views (not for author)
      if (user?.id !== planData.author_id) {
        incrementPlanViewCount(planData.id);
      }

      // 3. Check purchase
      if (user?.id) {
        setCheckingPurchase(true);
        if (user.id === planData.author_id) {
          setHasPurchased(true);
        } else {
          const result = await checkPurchaseStatus(user.id, planData.id);
          setHasPurchased(result.hasPurchased);
          setPurchaseData(result.purchase);
        }
        setCheckingPurchase(false);
      } else {
        setCheckingPurchase(false);
      }

      // 4. Fetch reviews via marketplace_items bridge
      if (planData.original_plan_id) {
        const { data: itemMatch } = await supabase
          .from('marketplace_items')
          .select('id')
          .eq('plan_template_id', planData.original_plan_id)
          .maybeSingle();

        if (itemMatch?.id) {
          const { data: reviewsData } = await supabase
            .from('marketplace_reviews')
            .select(`
              id, rating, title, content, pros, cons,
              is_verified_purchase, helpful_count, not_helpful_count,
              rating_quality, rating_value, rating_ease_of_use, rating_effectiveness,
              patient_age_range, diagnosis_used_for, would_recommend,
              author_response, author_responded_at, created_at,
              reviewer:profiles!reviewer_id (full_name)
            `)
            .eq('marketplace_item_id', itemMatch.id)
            .eq('is_visible', true)
            .eq('status', 'approved')
            .order('helpful_count', { ascending: false })
            .limit(10);

          setReviews(reviewsData || []);
        }
      }

      // 5. Related plans
      const related = await fetchRelatedPlans(
        planData.id,
        planData.target_diagnosis,
        planData.tags
      );
      setRelatedPlans(related);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      if (error.message?.includes('no encontrado') || error.message?.includes('no está disponible')) {
        navigate('/dashboard/marketplace');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setIsPurchaseModalOpen(false);
    setHasPurchased(true);
  };

  const handleFavorite = async () => {
    if (!user?.id || !plan?.id) return;
    const result = await toggleFavorite(user.id, plan.id);
    if (result !== null) setIsFavorited(result);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!plan) return null;

  const isAuthor = user?.id === plan.author_id;
  const hasRealRating = plan.average_rating > 0 && plan.review_count > 0;
  const hasDiscount = plan.discount_percentage > 0 && plan.discount_valid_until && new Date(plan.discount_valid_until) > new Date();
  const effectivePrice = hasDiscount ? Math.round(plan.price_clp * (1 - plan.discount_percentage / 100)) : plan.price_clp;

  // Build stats from real data only
  const stats = [
    plan.duration_weeks > 0 && { icon: Clock, label: 'Duración', value: `${plan.duration_weeks} semanas`, color: 'text-teal-600' },
    plan.total_sessions > 0 && { icon: CalendarDays, label: 'Sesiones', value: plan.total_sessions, color: 'text-blue-600' },
    plan.total_activities > 0 && { icon: Sparkles, label: 'Actividades', value: plan.total_activities, color: 'text-purple-600' },
    plan.purchase_count > 0 && { icon: Users, label: 'Dentistas', value: `${plan.purchase_count} lo usan`, color: 'text-emerald-600' },
  ].filter(Boolean);

  return (
    <>
      <Helmet>
        <title>{plan.meta_title || `${plan.name} | Marketplace DentalSpot`}</title>
        <meta name="description" content={plan.meta_description || plan.description?.substring(0, 160)} />
      </Helmet>

      <div className="container mx-auto px-4 md:px-6 py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button onClick={() => navigate('/dashboard/marketplace')} className="hover:text-teal-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate max-w-[300px]">{plan.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border aspect-[16/9] overflow-hidden">
              {plan.cover_image_url ? (
                <img src={plan.cover_image_url} alt={plan.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-slate-100">{plan.name?.charAt(0)}</span>
                </div>
              )}
              {plan.preview_video_url && (
                <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Play className="h-7 w-7 text-teal-700 ml-1" />
                  </div>
                </button>
              )}
              {plan.is_featured && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 shadow-sm">Destacado</Badge>
              )}
            </div>

            {/* Title mobile */}
            <div className="lg:hidden space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{plan.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {plan.target_diagnosis?.slice(0, 3).map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                ))}
                {hasRealRating ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold">{plan.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({plan.review_count})</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs text-slate-400">Nuevo en DentalSpot</Badge>
                )}
              </div>
            </div>

            {/* Clinical Context */}
            {(plan.target_diagnosis?.length > 0 || plan.target_age_min || plan.target_age_max) && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Contexto clínico</p>
                <div className="flex flex-wrap gap-2">
                  {plan.target_diagnosis?.map((d) => (
                    <Badge key={d} className="bg-blue-100 text-blue-700 border-0 text-xs">{d}</Badge>
                  ))}
                  {(plan.target_age_min || plan.target_age_max) && (
                    <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">
                      {plan.target_age_min && plan.target_age_max
                        ? `${plan.target_age_min}–${plan.target_age_max} años`
                        : plan.target_age_min ? `Desde ${plan.target_age_min} años` : `Hasta ${plan.target_age_max} años`}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Descripción</h2>
              <div className="text-slate-600 leading-relaxed text-[15px]">
                {(plan.long_description || plan.description || '').split('\n').map((p, i) => (
                  p.trim() && <p key={i} className="mb-2.5">{p}</p>
                ))}
              </div>
            </div>

            {/* Objectives Preview */}
            {plan.objectives_preview && plan.objectives_preview.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Objetivos</h2>
                <div className="space-y-2">
                  {plan.objectives_preview.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span>{obj.title || obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            {stats.length > 0 && (
              <div className={`grid grid-cols-2 ${stats.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-3`}>
                {stats.map((s, i) => (
                  <Card key={i} className="border-slate-100">
                    <CardContent className="p-3.5 flex flex-col items-center text-center">
                      <s.icon className={`h-5 w-5 ${s.color} mb-1.5`} />
                      <span className="text-[11px] text-slate-400 font-medium">{s.label}</span>
                      <span className="text-sm font-semibold text-slate-800">{s.value}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* What's included */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Qué incluye</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: Zap, text: 'Acceso inmediato tras la compra' },
                  { icon: BookOpen, text: 'Planificación completa editable' },
                  { icon: ShieldCheck, text: 'Contenido revisado por DentalSpot' },
                  plan.sample_pdf_url && { icon: FileDown, text: 'Vista previa descargable' },
                  plan.preview_video_url && { icon: Play, text: 'Video de presentación' },
                ].filter(Boolean).map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600 py-1.5">
                    <f.icon className="h-4 w-4 text-teal-500 flex-shrink-0" />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Sample PDF */}
            {plan.sample_pdf_url && (
              <Button variant="outline" className="gap-2 text-teal-700 border-teal-200 hover:bg-teal-50"
                onClick={() => window.open(plan.sample_pdf_url, '_blank')}>
                <FileDown className="h-4 w-4" /> Ver muestra gratuita
              </Button>
            )}

            {/* ── Reviews Section ── */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Reseñas</h2>
                {hasRealRating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg">{plan.average_rating.toFixed(1)}</span>
                    <span className="text-sm text-slate-400">({plan.review_count} opiniones)</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-slate-100 bg-slate-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-teal-50 text-teal-700 text-xs font-medium">
                                {review.reviewer?.full_name?.substring(0, 2).toUpperCase() || 'AN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">{review.reviewer?.full_name || 'Dentista'}</p>
                                {review.is_verified_purchase && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[9px] py-0">Compra verificada</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('es-CL')}</span>
                        </div>

                        {review.title && <p className="text-sm font-medium text-slate-800 mb-1">{review.title}</p>}
                        <p className="text-sm text-slate-600 leading-relaxed">{review.content}</p>

                        {/* Pros/Cons */}
                        {(review.pros?.length > 0 || review.cons?.length > 0) && (
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            {review.pros?.length > 0 && (
                              <div>
                                <p className="font-medium text-emerald-700 mb-1">Ventajas</p>
                                {review.pros.map((p, i) => (
                                  <p key={i} className="text-slate-500 flex items-start gap-1">
                                    <span className="text-emerald-500">+</span> {p}
                                  </p>
                                ))}
                              </div>
                            )}
                            {review.cons?.length > 0 && (
                              <div>
                                <p className="font-medium text-red-600 mb-1">Mejorable</p>
                                {review.cons.map((c, i) => (
                                  <p key={i} className="text-slate-500 flex items-start gap-1">
                                    <span className="text-red-400">−</span> {c}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Clinical context of review */}
                        {(review.diagnosis_used_for?.length > 0 || review.patient_age_range) && (
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {review.diagnosis_used_for?.map((d) => (
                              <Badge key={d} variant="outline" className="text-[9px] py-0 text-slate-400">{d}</Badge>
                            ))}
                            {review.patient_age_range && (
                              <Badge variant="outline" className="text-[9px] py-0 text-slate-400">{review.patient_age_range}</Badge>
                            )}
                          </div>
                        )}

                        {/* Author response */}
                        {review.author_response && (
                          <div className="mt-3 bg-teal-50/50 border border-teal-100 rounded-lg p-3">
                            <p className="text-xs font-medium text-teal-700 mb-1">Respuesta del autor</p>
                            <p className="text-xs text-slate-600">{review.author_response}</p>
                          </div>
                        )}

                        {/* Helpful */}
                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                          <button className="flex items-center gap-1 hover:text-slate-600">
                            <ThumbsUp className="h-3 w-3" /> {review.helpful_count || 0}
                          </button>
                          <button className="flex items-center gap-1 hover:text-slate-600">
                            <ThumbsDown className="h-3 w-3" /> {review.not_helpful_count || 0}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Star} title="Sin reseñas aún"
                  description="Las opiniones de otros dentistas aparecerán aquí." compact />
              )}
            </div>
          </div>

          {/* ── Right Column: Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-5">

              {/* Purchase Card */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-teal-500 to-emerald-400" />
                <CardContent className="p-5 space-y-5">
                  {/* Title desktop */}
                  <div className="hidden lg:block">
                    <h1 className="text-xl font-bold text-slate-900 leading-tight mb-2">{plan.name}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      {plan.target_diagnosis?.slice(0, 2).map((d) => (
                        <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                      ))}
                      {hasRealRating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{plan.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({plan.review_count})</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-400">Nuevo</Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Price */}
                  <div className="flex items-baseline justify-between">
                    {plan.is_free ? (
                      <span className="text-3xl font-bold text-emerald-600">Gratis</span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">{formatCurrency(effectivePrice)}</span>
                        {hasDiscount && (
                          <span className="text-base text-slate-400 line-through">{formatCurrency(plan.price_clp)}</span>
                        )}
                      </div>
                    )}
                    {!plan.is_free && <span className="text-sm text-slate-400">pago único</span>}
                  </div>

                  {hasDiscount && (
                    <Badge className="bg-amber-50 text-amber-700 border-0 text-xs w-full justify-center py-1">
                      -{plan.discount_percentage}% de descuento · Válido hasta {new Date(plan.discount_valid_until).toLocaleDateString('es-CL')}
                    </Badge>
                  )}

                  {/* CTA */}
                  <div className="space-y-2.5">
                    {isAuthor ? (
                      <Button className="w-full" variant="outline"
                        onClick={() => navigate(`/dashboard/therapist/marketplace/edit/${plan.id}`)}>
                        Editar publicación
                      </Button>
                    ) : hasPurchased ? (
                      <>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                          <div className="flex items-center justify-center gap-2 text-emerald-700 mb-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm font-semibold">Ya tienes este recurso</span>
                          </div>
                          <p className="text-xs text-emerald-600">Disponible en Mis Planificaciones</p>
                        </div>
                        <Button className="w-full bg-teal-600 hover:bg-teal-700"
                          onClick={() => navigate('/dashboard/marketplace/mis-planificaciones')}>
                          <Package className="mr-2 h-4 w-4" /> Ir a Mis Planificaciones
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-base py-5 shadow-sm"
                        onClick={() => setIsPurchaseModalOpen(true)} disabled={checkingPurchase}>
                        {checkingPurchase ? <Loader2 className="h-5 w-5 animate-spin" /> :
                          plan.is_free ? 'Obtener gratis' : 'Adquirir planificación'}
                      </Button>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={handleFavorite}>
                        <Heart className={`h-3.5 w-3.5 mr-1.5 ${isFavorited ? 'fill-primary text-primary' : ''}`} />
                        {isFavorited ? 'Guardado' : 'Guardar'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs"
                        onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Enlace copiado' }); }}>
                        <Share2 className="h-3.5 w-3.5 mr-1.5" /> Compartir
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-2 border-t">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Compra segura</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Acceso inmediato</span>
                  </div>
                </CardContent>
              </Card>

              {/* Author */}
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Creado por</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-white shadow-sm">
                      <AvatarFallback className="bg-teal-50 text-teal-700 text-sm">
                        {plan.author_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{plan.author_name}</h4>
                      {plan.author_credentials && (
                        <p className="text-xs text-slate-500 line-clamp-1">{plan.author_credentials}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {plan.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {plan.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] text-slate-400 border-slate-200 cursor-pointer hover:border-teal-300 hover:text-teal-600"
                      onClick={() => navigate(`/dashboard/marketplace?search=${tag}`)}>
                      <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Related */}
              {relatedPlans.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Recursos relacionados</p>
                  {relatedPlans.map((rp) => (
                    <Link key={rp.id} to={`/dashboard/marketplace/plan/${rp.slug || rp.id}`}
                      className="group flex gap-3 items-start p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="h-10 w-10 bg-slate-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {rp.cover_image_url ? (
                          <img src={rp.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-slate-300">{rp.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2 group-hover:text-teal-600 transition-colors">{rp.name}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {rp.is_free ? 'Gratis' : formatCurrency(rp.price_clp)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal — pasa plan como item adaptado */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          item={{
            id: plan.id,
            title: plan.name,
            description: plan.description,
            price: plan.is_free ? 0 : effectivePrice,
            currency: 'CLP',
            image_url: plan.cover_image_url,
            seller_name: plan.author_name,
            seller_id: plan.author_id,
            item_type: 'plan',
          }}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
};

export default PlanDetailPage;
