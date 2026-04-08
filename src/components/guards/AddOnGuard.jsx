import React, { useState } from 'react';
import { useAddOnAccess } from '@/hooks/useAddOnAccess';
import AddOnUpgradeModal from '@/components/modals/AddOnUpgradeModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Tag } from 'lucide-react';
import { formatPriceCLP } from '@/utils/planHelpers';

/**
 * Guard component that protects content based on add-on purchase status.
 * 
 * @param {Object} props
 * @param {string} props.addOnId - The ID of the add-on (e.g., 'notiz')
 * @param {React.ReactNode} props.children - Content to render if user has access
 * @param {React.ReactNode} props.fallback - Optional custom fallback UI
 * @param {boolean} props.showModal - Whether to allow the unlock modal to be shown
 */
const AddOnGuard = ({ 
  addOnId, 
  children, 
  fallback = null, 
  showModal = true 
}) => {
  const { hasAccess, isLoading, config } = useAddOnAccess(addOnId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // User has access (either via plan or direct purchase)
  if (hasAccess) {
    return children;
  }

  // User does NOT have access
  
  // 1. If fallback is provided, use it
  if (fallback) {
    return (
      <>
        {fallback}
        {/* Still render modal logic in case fallback triggers it externally, though typically fallback is static */}
        {showModal && (
          <AddOnUpgradeModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            addOnId={addOnId} 
          />
        )}
      </>
    );
  }

  // 2. Default "Locked" UI
  return (
    <div className="w-full">
      <Card className="w-full border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          
          <CardTitle className="text-xl mb-2">
            Función Bloqueada
          </CardTitle>
          
          <CardDescription className="max-w-md mx-auto mb-6">
            Esta funcionalidad requiere el complemento <strong>{config?.name || addOnId}</strong>.
            {config?.description && <span className="block mt-1">{config.description}</span>}
          </CardDescription>

          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">
              {config ? formatPriceCLP(config.price) : ''}
              <span className="text-sm font-normal text-gray-500 ml-1">/mes</span>
            </p>
            
            {showModal && (
              <>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  Desbloquear Ahora
                </Button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Tengo un cupón de descuento
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <AddOnUpgradeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          addOnId={addOnId} 
        />
      )}
    </div>
  );
};

export default AddOnGuard;