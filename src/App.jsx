
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

import { AdminPermissionProvider } from '@/contexts/AdminPermissionContext';
import { CartProvider } from '@/hooks/useCart';
import { HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppRouter from '@/app/AppRouter';
import FloatingAssistant from '@/features/chatbot/components/FloatingAssistant';
import CookieBanner from '@/components/shared/CookieBanner';
import FeedbackPopup from '@/components/shared/FeedbackPopup';

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
            <AdminPermissionProvider>
              <CartProvider>
                <AppRouter />
                <FloatingAssistant />
                <CookieBanner />
                <FeedbackPopup />
                <Toaster />
              </CartProvider>
            </AdminPermissionProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
