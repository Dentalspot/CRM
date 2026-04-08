import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Share2, 
  ShieldCheck, 
  Download, 
  Edit, 
  AlertCircle,
  FileText,
  Sparkles,
  Package,
  CheckCircle2,
  Tag,
  Clock,
  CalendarDays
} from 'lucide-react';
import PurchaseModal from '@/features/marketplace/components/PurchaseModal';
import AiImageButton from '@/features/marketplace/components/AiImageButton';
import ProductChatWidget from '@/features/marketplace/components/ProductChatWidget';
import logger from '@/lib/utils/logger';

const CATEGORY_ICONS = {
  plan: FileText,
  activity: Sparkles,
  material: Package,
  evaluation: CheckCircle2,
  resource: Tag,
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(amount);
};

const MarketplaceListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchItemDetails();
  }, [id, user]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Item Data
      const { data: itemData, error: itemError } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          seller:seller_id (
            id,
            full_name,
            therapist_details!therapist_details_user_id_fkey (
              professional_title,
              years_experience
            ),
            therapist_branding (
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (itemError) throw itemError;

      // Check visibility
      if (!itemData.is_active || !itemData.is_approved) {
        if (user?.id !== itemData.seller_id) {
          throw new Error("Este recurso no está disponible o no ha sido aprobado.");
        }
      }

      setItem(itemData);

      // Increment view count
      if (user?.id !== itemData.seller_id) {
        supabase.rpc('increment_view_count', { p_item_id: id });
      }

      // 2. Check purchase status if user is logged in
      if (user) {
        checkPurchaseStatus(id);
      } else {
        setCheckingPurchase(false);
      }

      // 3. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from('marketplace_reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            full_name
          )
        `)
        .eq('marketplace_item_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(5);
        
      setReviews(reviewsData || []);

      // 4. Fetch Related Items
      if (itemData.category) {
        const { data: relatedData } = await supabase
          .from('marketplace_items')
          .select('id, title, price, category, item_type, rating')
          .eq('category', itemData.category)
          .eq('is_active', true)
          .eq('is_approved', true)
          .neq('id', id)
          .limit(3);
          
        setRelatedItems(relatedData || []);
      }

    } catch (error) {
      logger.error('Error fetching details:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar",
        description: error.message || "No se pudo cargar el recurso."
      });
      if (error.message.includes("no está disponible")) {
        navigate('/dashboard/marketplace');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async (itemId) => {
    try {
      setCheckingPurchase(true);
      // Check if user is seller
      if (item?.seller_id === user.id) {
        setHasPurchased(true);
        setCheckingPurchase(false);
        return;
      }

      const { data, error } = await supabase.rpc('user_has_purchased', {
        p_user_id: user.id,
        p_marketplace_item_id: itemId
      });

      if (!error) {
        setHasPurchased(data);
      }
    } catch (e) {
      logger.error("Purchase check error:", e);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handlePurchaseSuccess = () => {
    setIsPurchaseModalOpen(false);
    setHasPurchased(true);
    toast({
      title: "¡Compra exitosa!",
      description: "Ahora puedes descargar o usar este recurso.",
    });
  };

  const handleDownload = () => {
    // If it's a file url
    if (item.sample_pdf_url) { 
      toast({
        title: "Iniciando descarga...",
        description: "Tu recurso se está descargando."
      });
      // In a real app, this would be a secure signed URL from Supabase Storage
    } else {
      toast({
        title: "Recurso añadido",
        description: "Este recurso se ha añadido a tu biblioteca."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) return null;

  const isSeller = user?.id === item.seller_id;
  const CategoryIcon = CATEGORY_ICONS[item.category] || Tag;
  const sellerDetails = item.seller?.therapist_details?.[0] || item.seller?.therapist_details || {};
  const sellerAvatar = item.seller?.therapist_branding?.[0]?.avatar_url || item.seller?.therapist_branding?.avatar_url || null;

  return (
    <>
      <Helmet>
        <title>{item.title} | Marketplace DentalSpot</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:pl-2 transition-all"
          onClick={() => navigate('/dashboard/marketplace')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Marketplace
        </Button>

        {/* Draft Warning */}
        {(!item.is_active || !item.is_approved) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center text-yellow-800">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-semibold">Modo Vista Previa</p>
              <p className="text-sm">
                Este recurso aún no está público en el marketplace. Solo tú puedes verlo.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media & Highlights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image / Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border aspect-video flex items-center justify-center relative overflow-hidden group">
              {(() => {
                const heroImage = item.image_url || (Array.isArray(item.gallery_urls) && item.gallery_urls.length > 0 ? item.gallery_urls[0] : null);
                return heroImage ? (
                  <img src={heroImage} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <CategoryIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Sin imagen de vista previa</p>
                    {isSeller && (
                      <div className="mt-3">
                        <AiImageButton item={item} onImageGenerated={() => fetchItemDetails()} />
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-sm">
                  {item.category}
                </Badge>
                {item.item_type && (
                  <Badge variant="outline" className="bg-white/90 backdrop-blur-sm shadow-sm capitalize">
                    {item.item_type}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Descripción</h2>
              <div className="prose max-w-none text-gray-600 leading-relaxed">
                {item.description ? (
                  item.description.split('\n').map((p, i) => (
                    <p key={i} className="mb-2">{p}</p>
                  ))
                ) : (
                  <p className="italic text-gray-400">Sin descripción detallada.</p>
                )}
              </div>
            </div>

            {/* SEO Bullets (AI-generated) */}
            {(item.ai_benefits?.length > 0 || item.ai_target_audience?.length > 0 || item.ai_use_cases?.length > 0) && (
              <div className="space-y-4">
                {item.ai_benefits?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Beneficios
                    </h3>
                    <ul className="space-y-1.5">
                      {item.ai_benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-emerald-500 mt-0.5">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.ai_target_audience?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-blue-500" /> Ideal para
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.ai_target_audience.map((a, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {item.ai_use_cases?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" /> Casos de uso
                    </h3>
                    <ul className="space-y-1.5">
                      {item.ai_use_cases.map((u, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-amber-500 mt-0.5">💡</span> {u}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Clock className="h-5 w-5 text-teal-600 mb-2" />
                  <span className="text-xs text-gray-500">Duración</span>
                  <span className="font-semibold text-gray-900">
                    {item.duration_weeks ? `${item.duration_weeks} semanas` : 'N/A'}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <CalendarDays className="h-5 w-5 text-blue-600 mb-2" />
                  <span className="text-xs text-gray-500">Sesiones</span>
                  <span className="font-semibold text-gray-900">
                    {item.total_sessions || 'N/A'}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Sparkles className="h-5 w-5 text-purple-600 mb-2" />
                  <span className="text-xs text-gray-500">Actividades</span>
                  <span className="font-semibold text-gray-900">
                    {item.total_activities || 'N/A'}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <ShieldCheck className="h-5 w-5 text-green-600 mb-2" />
                  <span className="text-xs text-gray-500">Calidad</span>
                  <span className="font-semibold text-gray-900">Verificado</span>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Reseñas</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 font-bold text-lg">{item.rating || '0.0'}</span>
                  </div>
                  <span className="text-gray-400">({item.total_reviews} opiniones)</span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="border-none shadow-sm bg-gray-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-teal-100 text-teal-800 text-xs">
                                {review.reviewer?.full_name?.substring(0,2).toUpperCase() || 'AN'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{review.reviewer?.full_name || 'Usuario'}</p>
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{review.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No hay reseñas todavía. ¡Sé el primero en probarlo!
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Purchase Card */}
              <Card className="border-2 border-teal-50 shadow-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500" />
                <CardHeader>
                  <CardTitle className="text-2xl font-bold leading-tight">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      {item.category}
                    </span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-gray-900">
                      {item.price === 0 ? 'Gratis' : formatCurrency(item.price)}
                    </span>
                    {item.price > 0 && (
                      <span className="text-sm text-gray-500 font-normal">pago único</span>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {isSeller ? (
                      <Button className="w-full" variant="outline" onClick={() => { /* Edit logic would go here */ }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar Publicación
                      </Button>
                    ) : hasPurchased ? (
                      item.item_type === 'evaluation' ? (
                        <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                          <Link to="/dashboard/profile?tab=docs">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Ver en mis Plantillas
                          </Link>
                        </Button>
                      ) : (
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleDownload}>
                          <Download className="mr-2 h-4 w-4" /> Descargar Recurso
                        </Button>
                      )
                    ) : (
                      <Button 
                        className="w-full bg-teal-600 hover:bg-teal-700 text-lg py-6"
                        onClick={() => setIsPurchaseModalOpen(true)}
                        disabled={checkingPurchase}
                      >
                        {checkingPurchase ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            {item.item_type === 'evaluation' ? 'Agregar a mis Plantillas' : 'Obtener recurso'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button variant="outline" className="w-full">
                      <Share2 className="mr-2 h-4 w-4" /> Compartir
                    </Button>
                  </div>

                  <div className="text-xs text-center text-gray-500 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Compra segura y garantía de satisfacción
                  </div>
                </CardContent>
              </Card>

              {/* Seller Profile */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Vendido por
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={sellerAvatar} />
                      <AvatarFallback className="bg-teal-100 text-teal-800">
                        {item.seller?.full_name?.substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link to={`/fonoaudiologo/${item.seller?.id}`} className="hover:underline">
                        <h4 className="font-bold text-gray-900">{item.seller?.full_name}</h4>
                      </Link>
                      <p className="text-sm text-gray-500 truncate max-w-[180px]">
                        {sellerDetails.professional_title || 'Odontólogo/a'}
                      </p>
                    </div>
                  </div>
                  {sellerDetails.years_experience && (
                    <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded text-center">
                      {sellerDetails.years_experience} años de experiencia
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Related Items */}
              {relatedItems.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h4 className="font-semibold text-gray-900">Productos relacionados</h4>
                  <div className="space-y-3">
                    {relatedItems.map((related) => (
                      <Link key={related.id} to={`/dashboard/marketplace/listings/${related.id}`}>
                        <div className="group flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="h-12 w-12 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400">
                            {React.createElement(CATEGORY_ICONS[related.category] || Tag, { size: 20 })}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                              {related.title}
                            </p>
                            <p className="text-xs font-semibold text-gray-600 mt-1">
                              {formatCurrency(related.price)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          item={item}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* AI Chat Widget — only for non-sellers */}
      {!isSeller && item && (
        <ProductChatWidget productId={item.id} productTitle={item.title} />
      )}
    </>
  );
};

export default MarketplaceListingDetailPage;