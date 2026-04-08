import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText, Activity, Check } from 'lucide-react';
import { fetchConvertibleResources } from '../api/sellerApi';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

const ResourceSelector = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('plan');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadResources();
      setSelectedResource(null);
    }
  }, [isOpen, activeTab, user]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await fetchConvertibleResources(user.id, activeTab);
      // Ensure data is an array before setting state to prevent rendering errors
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error(error);
      setResources([]); // Fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedResource) {
      onSelect(selectedResource, activeTab);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Recurso para Vender</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="plan">Planes de Tratamiento</TabsTrigger>
            <TabsTrigger value="activity">Actividades / Ejercicios</TabsTrigger>
          </TabsList>

          <div className="min-h-[300px] border rounded-md relative bg-gray-50/50">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : resources.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <p>No se encontraron {activeTab === 'plan' ? 'planes' : 'actividades'} disponibles.</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resources.map((resource) => (
                    <Card 
                      key={resource.id} 
                      className={`cursor-pointer transition-all hover:border-teal-400 ${selectedResource?.id === resource.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : ''}`}
                      onClick={() => setSelectedResource(resource)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`p-2 rounded-full ${activeTab === 'plan' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                          {activeTab === 'plan' ? <FileText className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{resource.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {resource.description || 'Sin descripción'}
                          </p>
                          {activeTab === 'plan' && (
                            <span className="inline-block mt-2 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                              {resource.duration_weeks} semanas
                            </span>
                          )}
                        </div>
                        {selectedResource?.id === resource.id && (
                          <Check className="h-5 w-5 text-teal-600 shrink-0" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedResource}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceSelector;