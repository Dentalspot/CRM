import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Store, Loader2, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

// Local components - using centralized index
import { ProductCard, ProductDetailModal } from './index';
import PurchaseModal from './PurchaseModal';
import AdvancedSearch from './AdvancedSearch';
import { fetchMarketplaceItems, fetchUserOrders, createOrder } from '../api/marketplaceApi';

const MarketplaceTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('browse');
  const [items, setItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search State handled by AdvancedSearch, but we store current filters here to re-fetch
  const [currentFilters, setCurrentFilters] = useState({
    search: '',
    type: 'all',
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    sort: 'newest'
  });

  // Modal State
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  // Initial Load & Filter Change
  useEffect(() => {
    loadMarketplace();
  }, [currentFilters]); // Re-fetch when filters change

  // Reload when tab changes to ensure fresh data
  useEffect(() => {
    if (activeTab === 'purchases') {
      loadPurchases();
    }
  }, [activeTab]);

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      // Pass filters to API for server-side processing
      const data = await fetchMarketplaceItems(currentFilters);
      setItems(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar el marketplace",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const orders = await fetchUserOrders(user.id);
      // Flatten orders to items for display
      const items = orders.flatMap(order => 
        order.items.map(orderItem => ({
          ...orderItem.item,
          purchase_date: order.created_at,
          order_id: order.id,
          image_url: orderItem.item?.product?.media_url
        }))
      );
      setPurchasedItems(items);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar tus compras",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSearch = useCallback((newFilters) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleViewProduct = (item) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleBuyClick = (item, quantity = 1) => {
    if (!user) {
      toast({ title: "Inicia sesión para comprar" });
      return;
    }
    setSelectedItem(item);
    setPurchaseQuantity(quantity);
    setDetailModalOpen(false);
    setPurchaseModalOpen(true);
  };

  const handlePurchaseConfirm = async (item) => {
    if (!user) return;
    try {
      await createOrder(user.id, item, purchaseQuantity);
      // Success handled by modal UI
    } catch (error) {
      throw error; // Let modal handle error display
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketplace</h2>
          <p className="text-gray-500">Recursos, plantillas y cursos para terapeutas y pacientes.</p>
        </div>
        
        <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
          <TabsTrigger value="browse" className="gap-2">
            <Store className="h-4 w-4" />
            Explorar
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Mis Compras
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="browse" className="mt-0 space-y-6">
        {/* Advanced Search Bar */}
        <AdvancedSearch onSearch={handleSearch} />

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} onClick={() => handleViewProduct(item)} className="cursor-pointer">
                <ProductCard 
                  product={item} 
                  onBuy={(p, e) => {
                    if (e) e.stopPropagation();
                    handleBuyClick(p);
                  }} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
            <p className="text-gray-500 mt-1">Intenta ajustar tus filtros de búsqueda.</p>
            <Button 
              variant="link" 
              onClick={() => handleSearch({ search: '', type: 'all', minPrice: 0, maxPrice: 100000, minRating: 0, sort: 'newest' })}
              className="mt-2 text-teal-600"
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="purchases" className="mt-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          </div>
        ) : purchasedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchasedItems.map((item, idx) => (
              <ProductCard 
                key={`${item.id}-${idx}`} 
                product={item} 
                isPurchased={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Aún no has comprado nada</h3>
            <p className="text-gray-500 mt-1">Explora el marketplace para encontrar recursos útiles.</p>
            <Button 
              onClick={() => setActiveTab('browse')}
              className="mt-4 bg-teal-600 hover:bg-teal-700"
            >
              Ir a Explorar
            </Button>
          </div>
        )}
      </TabsContent>

      {/* Modals */}
      <ProductDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        product={selectedItem}
        onBuy={handleBuyClick}
      />

      <PurchaseModal 
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        item={selectedItem}
        onConfirm={handlePurchaseConfirm}
      />
    </Tabs>
  );
};

export default MarketplaceTab;