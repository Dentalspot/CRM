import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
  canSellInMarketplace, 
  checkSubscriptionPlan, 
  checkPaymentStatus, 
  getMarketplaceRestrictions 
} from '@/features/marketplace/utils/marketplaceUtils';

export const useMarketplaceAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const [accessState, setAccessState] = useState({
    canSell: false,
    plan: 'free',
    paymentStatus: 'inactive',
    restrictions: {},
    isLoading: true
  });

  useEffect(() => {
    if (authLoading || subLoading) {
      setAccessState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    const canSell = canSellInMarketplace(user, subscription);
    const plan = checkSubscriptionPlan(subscription);
    const paymentStatus = checkPaymentStatus(subscription);
    const restrictions = getMarketplaceRestrictions(user, subscription);

    setAccessState({
      canSell,
      plan,
      paymentStatus,
      restrictions,
      isLoading: false
    });
  }, [user, subscription, authLoading, subLoading]);

  return accessState;
};

export default useMarketplaceAccess;