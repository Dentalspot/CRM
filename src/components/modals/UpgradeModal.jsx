/**
 * @file src/components/modals/UpgradeModal.jsx
 * 
 * Modal para promover upgrade de plan
 * Se muestra cuando el usuario intenta acceder a una feature bloqueada
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowRight,
  Check,
  Zap,
} from 'lucide-react';
import { getPlanPricing, formatPriceCLP } from '@/utils/planHelpers';
import { PLAN_FEATURES, FEATURE_INFO } from '@/constants/planFeatures';

/**
 * Modal de upgrade
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidad
 * @param {function} props.onClose - Handler de cierre
 * @param {string} props.featureName - Nombre de la feature que intentó usar
 * @param {string} props.requiredPlan - Plan mínimo requerido
 * @param {string} props.currentPlan - Plan actual del usuario
 */
const UpgradeModal = ({
  isOpen,
  onClose,
  featureName = 'esta funcionalidad',
  requiredPlan = 'individual',
  currentPlan = 'free',
}) => {
  const navigate = useNavigate();

  const requiredPlanInfo = getPlanPricing(requiredPlan);
  const currentPlanInfo = getPlanPricing(currentPlan);

  // Obtener features destacadas del plan requerido
  const highlightFeatures = getHighlightFeatures(requiredPlan);

  const handleUpgrade = () => {
    onClose();
    // Usuarios logueados van al dashboard donde pueden suscribirse.
    // La landing pública `/planes` (PricingPage) es para prospects sin sesión.
    navigate('/dashboard/membership');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="text-center">
          {/* Icono */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Título */}
          <DialogTitle className="text-xl">
            Desbloquea {featureName}
          </DialogTitle>

          {/* Descripción */}
          <DialogDescription className="pt-2">
            Esta funcionalidad está disponible en el plan{' '}
            <Badge variant="outline" className="border-primary text-primary font-medium">
              {requiredPlanInfo.name}
            </Badge>
            {' '}o superior.
          </DialogDescription>
        </DialogHeader>

        {/* Comparación de planes */}
        <div className="my-6 space-y-4">
          {/* Plan actual */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-600">Tu plan actual</span>
            </div>
            <span className="text-sm font-medium capitalize">{currentPlanInfo.name}</span>
          </div>

          {/* Flecha */}
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Plan recomendado */}
          <div className="border-2 border-primary rounded-xl p-4 bg-primary/5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Plan {requiredPlanInfo.name}
                </h4>
                <p className="text-xs text-gray-500">{requiredPlanInfo.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">
                  {formatPriceCLP(requiredPlanInfo.priceCLP)}
                </span>
                <span className="text-xs text-gray-500 block">/mes</span>
              </div>
            </div>

            {/* Features destacadas */}
            <ul className="space-y-2">
              {highlightFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
          >
            Actualizar a {requiredPlanInfo.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-500"
          >
            Quizás después
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Obtiene features destacadas de un plan para mostrar en el modal
 */
function getHighlightFeatures(planName) {
  const features = PLAN_FEATURES[planName] || {};
  const highlighted = [];

  // Priorizar features importantes
  const priorityFeatures = [
    'aiReports',
    'aiPlanGenerator',
    'whatsappReminders',
    'metricsPanel',
    'marketplaceSell',
    'customTemplates',
    'multiClinic',
  ];

  for (const key of priorityFeatures) {
    if (features[key] === true && FEATURE_INFO[key]) {
      highlighted.push(FEATURE_INFO[key].name);
      if (highlighted.length >= 4) break;
    }
  }

  return highlighted;
}

export default UpgradeModal;