import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const MarketplaceAccessAlert = ({ restrictions, className }) => {
  if (!restrictions || !restrictions.isRestricted) return null;

  const { reason, message, action } = restrictions;

  const getIcon = () => {
    if (reason === 'payment') return <CreditCard className="h-4 w-4" />;
    if (reason === 'plan') return <Lock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getActionLabel = () => {
    if (reason === 'payment') return 'Revisar Pago';
    if (reason === 'plan') return 'Mejorar Plan';
    if (reason === 'role') return 'Registrarse como Terapeuta';
    return 'Ver Detalles';
  };

  return (
    <Alert variant="destructive" className={`bg-red-50 border-red-200 text-red-900 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <AlertTitle className="text-red-900 font-semibold mb-1">
            Acceso Restringido al Marketplace
          </AlertTitle>
          <AlertDescription className="text-red-800">
            {message}
          </AlertDescription>
        </div>
        {action && (
          <Button asChild size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900 whitespace-nowrap">
            <Link to={action}>
              {getActionLabel()}
            </Link>
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default MarketplaceAccessAlert;