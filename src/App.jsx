
import React, { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

import { AdminPermissionProvider } from '@/contexts/AdminPermissionContext';
import { CartProvider } from '@/hooks/useCart';
import { HelmetProvider } from 'react-helmet-async';

import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppRouter from '@/app/AppRouter';
// CookieBanner se mantiene eager: aparece en el primer render de cualquier
// página y debe estar disponible para legal compliance (Ley 21.719).
import CookieBanner from '@/components/shared/CookieBanner';

// Diferimos componentes secundarios que no son necesarios en el primer paint.
// FloatingAssistant carga el chatbot AI (~30KB) y FeedbackPopup el form de
// feedback — ninguno bloquea la experiencia inicial del usuario.
const FloatingAssistant = lazy(() => import('@/features/chatbot/components/FloatingAssistant'));
const FeedbackPopup = lazy(() => import('@/components/shared/FeedbackPopup'));

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
            <AdminPermissionProvider>
              <CartProvider>
                <AppRouter />
                <Suspense fallback={null}>
                  <FloatingAssistant />
                  <FeedbackPopup />
                </Suspense>
                <CookieBanner />
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
