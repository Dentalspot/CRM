import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, DollarSign, Store, ShoppingBag } from 'lucide-react';
import ListingForm from './ListingForm';
import EarningsPanel from './EarningsPanel';
import VendorMarketplaceSection from './VendorMarketplaceSection';
import { fetchSellerListings } from '../api/sellerApi';
import { Badge } from '@/components/ui/badge';
import MarketplaceTab from './MarketplaceTab'; // Re-using existing tab for full browse
import logger from '@/lib/utils/logger';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showListingForm, setShowListingForm] = useState(false);
  const [listings, setListings] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('vendor'); // 'vendor' | 'browse'

  // Load listings
  useEffect(() => {
    if (user && activeTab === 'listings') {
      loadListings();
    }
  }, [user, activeTab]);

  const loadListings = async () => {
    try {
      const data = await fetchSellerListings(user.id);
      setListings(data);
    } catch (error) {
      logger.error(error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowListingForm(true);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setShowListingForm(true);
  };

  const handleFormClose = () => {
    setShowListingForm(false);
    setEditingItem(null);
    loadListings(); // Refresh list
  };

  // If browsing mode is active, show MarketplaceTab but with a back button
  if (viewMode === 'browse') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            onClick={() => setViewMode('vendor')}
            className="gap-2"
          >
            ← Volver al Panel de Vendedor
          </Button>
          <h2 className="text-xl font-bold">Explorando Marketplace</h2>
        </div>
        <MarketplaceTab />
      </div>
    );
  }

  if (showListingForm) {
    return <ListingForm item={editingItem} onClose={handleFormClose} />;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Panel de Vendedor</h2>
          <p className="text-gray-500">Gestiona tu negocio digital y explora recursos en DentalSpot.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowListingForm(true)}>
            <Plus className="h-4 w-4" />
            Publicar Recurso
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[500px] mb-6">
          <TabsTrigger value="overview">Explorar</TabsTrigger>
          <TabsTrigger value="listings">Mis Publicaciones</TabsTrigger>
          <TabsTrigger value="earnings">Ingresos y Ventas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <VendorMarketplaceSection 
            onNavigateToBrowse={(category) => {
              // Usually we would pass filters, but here we just switch to browse mode
              setViewMode('browse');
            }} 
          />
        </TabsContent>

        <TabsContent value="listings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Inventario</CardTitle>
              <CardDescription>Productos disponibles para la venta.</CardDescription>
            </CardHeader>
            <CardContent>
              {listings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No tienes publicaciones activas</h3>
                  <p className="text-gray-500 mb-4">Comienza a monetizar tus recursos hoy mismo.</p>
                  <Button onClick={handleCreateNew}>Crear mi primera publicación</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-medium text-xs">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Producto</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Precio</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Ventas</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listings.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.title}
                            <div className="text-xs text-gray-400 font-normal truncate max-w-[200px]">
                              {item.description}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="capitalize">
                              {item.item_type === 'plan' ? 'Plan' : 'Material'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            ${item.price}
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              className={
                                item.is_active && item.is_approved 
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 border-0" 
                                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0"
                              }
                            >
                              {item.is_active && item.is_approved ? 'Activo' : 'Borrador/Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {item.total_sales || 0}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-0">
          <EarningsPanel sellerId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerDashboard;