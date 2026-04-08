import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

import AdvancedSearch from '../components/AdvancedSearch';
import PurchaseModal from '../components/PurchaseModal';

// Update import to use feature path via index or direct
import { ProductCard, ProductDetailModal } from '@/features/marketplace/components';

import logger from '@/lib/utils/logger';
import { fetchMarketplaceItems, fetchUserOrders, createOrder, purchaseMarketplaceItem } from '../api/marketplaceApi';

const MarketplaceTemplatesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState([]);
  const [purchasedItemIds, setPurchasedItemIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    sort: 'newest'
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [marketplaceData, ordersData] = await Promise.all([
        fetchMarketplaceItems(filters),
        user ? fetchUserOrders(user.id) : Promise.resolve([])
      ]);

      setItems(marketplaceData);

      if (ordersData) {
        const ids = new Set();
        ordersData.forEach(order => {
          order.items?.forEach(orderItem => {
            if (orderItem.marketplace_item_id) {
              ids.add(orderItem.marketplace_item_id);
            }
          });
        });
        setPurchasedItemIds(ids);
      }

    } catch (err) {
      logger.error('Error loading marketplace data:', err);
      setError('No se pudieron cargar los recursos.');
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewProduct = (item) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  };

  const handleBuyClick = (item, quantity = 1) => {
    if (!user) {
      toast({ 
        title: "Inicia sesión", 
        description: "Debes estar registrado para realizar compras.",
      });
      return;
    }
    
    if (purchasedItemIds.has(item.id)) {
      toast({ 
        title: "Ya adquiriste este recurso", 
        description: "Encuéntralo en 'Mis Compras'.",
      });
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
      // Logic split: Free vs Paid
      if (item.price === 0) {
        await createOrder(user.id, item, purchaseQuantity);
        setPurchasedItemIds(prev => new Set(prev).add(item.id));
        toast({ title: "¡Recurso añadido a tu biblioteca!" });
      } else {
        // Paid: Redirect to MP
        const preference = await purchaseMarketplaceItem(user.id, item, user.email);
        if (preference.init_point) {
          window.location.href = preference.init_point;
        } else {
          throw new Error("No payment URL received");
        }
      }
    } catch (error) {
      logger.error('Purchase failed:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: "Hubo un problema al iniciar la compra."
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
      <Helmet>
        <title>Marketplace de Plantillas | DentalSpot</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace de Recursos</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Material clínico verificado por y para dentistas.
        </p>
      </div>

      <div className="mb-8">
        <AdvancedSearch onSearch={handleSearch} />
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-teal-600" />
            <p>Cargando recursos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>Reintentar</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-xl border border-dashed">
            <ShoppingBag className="h-8 w-8 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold">No se encontraron resultados</h3>
            <Button variant="link" onClick={() => handleSearch({ search: '', type: 'all' })}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.id} onClick={() => handleViewProduct(item)} className="cursor-pointer h-full">
                <ProductCard 
                  product={item} 
                  isPurchased={purchasedItemIds.has(item.id)}
                  onBuy={(p, e) => {
                    if (e) e.stopPropagation();
                    handleBuyClick(p);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default MarketplaceTemplatesPage;