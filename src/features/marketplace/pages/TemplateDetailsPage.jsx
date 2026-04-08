import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  ShoppingCart,
  Star,
  User,
  Check,
  Shield,
  FileText,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { fetchMarketplaceItemById, purchaseMarketplaceItem } from '../api/marketplaceApi';
import logger from '@/lib/utils/logger';
import { formatMarketplacePrice } from '@/lib/constants/marketplace';

const TemplateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceItemById(id);
      setItem(data);
    } catch (err) {
      logger.error('Error loading item:', err);
      setError('No se pudo cargar la información de la plantilla.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes estar registrado para comprar esta plantilla.",
        variant: "default"
      });
      // Optionally redirect to login here
      return;
    }

    setPurchasing(true);
    try {
      const response = await purchaseMarketplaceItem(user.id, item, user.email);
      
      if (response && response.init_point) {
        window.location.href = response.init_point;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      logger.error('Purchase error:', err);
      toast({
        variant: "destructive",
        title: "Error al iniciar compra",
        description: "No se pudo conectar con Mercado Pago. Intenta más tarde."
      });
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-500">Cargando detalles de la plantilla...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
        <p className="text-slate-600 mb-6">{error || 'Plantilla no encontrada'}</p>
        <Button onClick={() => navigate('/dashboard/marketplace/templates')}>
          Volver al Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Helmet>
        <title>{item.title} | Marketplace DentalSpot</title>
        <meta name="description" content={`Compra la plantilla ${item.title} creada por ${item.seller_name}.`} />
      </Helmet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Left) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
                {item.item_type === 'plan' ? 'Plan de Tratamiento' : 'Recurso Clínico'}
              </Badge>
              {item.rating > 0 && (
                <div className="flex items-center text-yellow-500 text-sm font-medium">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  {item.rating} <span className="text-slate-400 ml-1">({item.total_reviews})</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{item.title}</h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Preview Image/Media */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center relative">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">Vista previa no disponible</p>
              </div>
            )}
          </div>

          {/* Details Tabs/Content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Detalles del Recurso</h3>
              <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Duración Estimada</p>
                      <p className="text-sm text-slate-500">{item.duration_weeks ? `${item.duration_weeks} semanas` : 'Flexible'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Formato</p>
                      <p className="text-sm text-slate-500">PDF / Digital Editable</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Entrega</p>
                      <p className="text-sm text-slate-500">Descarga Inmediata</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Garantía</p>
                      <p className="text-sm text-slate-500">Verificado por DentalSpot</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Sobre el Autor</h3>
              <div className="flex items-start gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                  <AvatarImage src={item.seller_avatar} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xl">
                    {item.seller_name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{item.seller_name}</h4>
                  <p className="text-teal-600 font-medium text-sm mb-2">{item.seller_title || 'Odontólogo'}</p>
                  <p className="text-slate-600 text-sm">
                    {item.seller_bio || `Profesional con ${item.seller_experience || 'varios'} años de experiencia en la creación de recursos clínicos.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Right) - Purchase Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="border-teal-100 shadow-lg shadow-teal-500/5 overflow-hidden">
              <div className="bg-teal-600 h-2 w-full" />
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Precio Total</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      {formatMarketplacePrice(item.price)}
                    </span>
                    <span className="text-slate-500 text-sm">CLP</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                    Acceso de por vida
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                    Actualizaciones gratuitas
                  </li>
                  <li className="flex items-center text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                    Soporte del autor
                  </li>
                </ul>

                <Separator />

                <Button 
                  className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 shadow-md"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Comprar Plantilla
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1">
                  <Shield className="h-3 w-3" /> Pago seguro vía Mercado Pago
                </p>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">¿Tienes dudas?</p>
              <p>Puedes contactar al autor después de la compra para resolver preguntas específicas sobre la implementación.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetailsPage;