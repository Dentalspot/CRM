import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, TrendingUp, Star, ArrowRight, Zap, BookOpen, LayoutTemplate } from 'lucide-react';
import { fetchMarketplaceItems, createOrder } from '../api/marketplaceApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Import from centralized index
import { ProductCard, ProductDetailModal } from './index';
import PurchaseModal from './PurchaseModal';
import logger from '@/lib/utils/logger';

const VendorMarketplaceSection = ({ onNavigateToBrowse }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [featuredItems, setFeaturedItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  useEffect(() => {
    const loadHighlights = async () => {
      setLoading(true);
      try {
        // Fetch featured (highest rated)
        const ratedData = await fetchMarketplaceItems({ sort: 'highest_rated', limit: 4 });
        setFeaturedItems(ratedData.slice(0, 4));

        // Fetch trending (popular)
        const popularData = await fetchMarketplaceItems({ sort: 'popular', limit: 4 });
        setTrendingItems(popularData.slice(0, 4));
      } catch (error) {
        logger.error("Error loading marketplace highlights", error);
      } finally {
        setLoading(false);
      }
    };

    loadHighlights();
  }, []);

  const handleViewProduct = (item) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleBuyClick = (item, quantity = 1) => {
    setSelectedItem(item);
    setPurchaseQuantity(quantity);
    setDetailModalOpen(false);
    setPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (item) => {
    if (!user) return;
    try {
      await createOrder(user.id, item, purchaseQuantity);
      // Success is handled by the modal UI, usually we'd refresh user orders here if needed
    } catch (error) {
      throw error;
    }
  };

  const CategoryShortcut = ({ icon: Icon, label, type }) => (
    <Button 
      variant="outline" 
      className="h-auto py-4 flex flex-col gap-2 items-center justify-center hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all group"
      onClick={() => onNavigateToBrowse && onNavigateToBrowse(type)}
    >
      <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white group-hover:shadow-sm transition-colors">
        <Icon className="h-6 w-6 text-gray-600 group-hover:text-teal-600" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </Button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero / Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-teal-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <CardHeader className="relative z-10">
            <Badge className="w-fit bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-0 mb-2">
              Marketplace para Terapeutas
            </Badge>
            <CardTitle className="text-3xl">Explora Recursos Profesionales</CardTitle>
            <CardDescription className="text-slate-300 text-lg max-w-lg">
              Descubre plantillas clínicas, actividades y material terapéutico creado por colegas para potenciar tus sesiones.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <Button 
              onClick={() => onNavigateToBrowse && onNavigateToBrowse('all')}
              className="bg-teal-500 hover:bg-teal-600 text-white border-0 gap-2 shadow-lg shadow-teal-500/25"
              size="lg"
            >
              <ShoppingBag className="h-5 w-5" />
              Ir al Marketplace Completo
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Explorar por Categoría</CardTitle>
            <CardDescription>Acceso rápido a lo que necesitas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 flex-1">
            <CategoryShortcut icon={LayoutTemplate} label="Planes" type="plan" />
            <CategoryShortcut icon={Zap} label="Actividades" type="activity" />
            <CategoryShortcut icon={BookOpen} label="Recursos" type="resource" />
            <CategoryShortcut icon={TrendingUp} label="Tendencias" type="all" />
          </CardContent>
        </Card>
      </div>

      {/* Featured Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Destacados de la Comunidad</h3>
              <p className="text-sm text-gray-500">Los recursos mejor valorados por otros terapeutas</p>
            </div>
          </div>
          <Button variant="ghost" className="gap-1 text-teal-600" onClick={() => onNavigateToBrowse && onNavigateToBrowse('all')}>
            Ver todos <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[350px] bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : (
            featuredItems.map((item) => (
              <div key={item.id} onClick={() => handleViewProduct(item)} className="cursor-pointer h-full">
                <ProductCard product={item} onBuy={(p, e) => { e.stopPropagation(); handleBuyClick(p); }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tendencias</h3>
              <p className="text-sm text-gray-500">Lo que otros terapeutas están descargando hoy</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-[350px] bg-gray-100 rounded-xl animate-pulse" />
            ))
          ) : (
            trendingItems.map((item) => (
              <div key={item.id} onClick={() => handleViewProduct(item)} className="cursor-pointer h-full">
                <ProductCard product={item} onBuy={(p, e) => { e.stopPropagation(); handleBuyClick(p); }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <ProductDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        product={selectedItem}
        onBuy={handleBuyClick}
      />

      {/* Purchase Modal */}
      <PurchaseModal 
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        item={selectedItem}
        onConfirm={handlePurchaseConfirm}
      />
    </div>
  );
};

export default VendorMarketplaceSection;