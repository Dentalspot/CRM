
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
// FloatingAssistant carga el chatbot AI (~30KB).
//
// FeedbackPopup desactivado (2026-05-13, parte del fix B10):
// el popup tenía z-index 9998 y se superponía al LegalReacceptModal (z-50),
// bloqueando la aceptación legal real — el dentista cerraba el feedback
// pensando que estaba aceptando T&C. El componente FeedbackPopup queda en
// el repo (src/components/shared/FeedbackPopup.jsx) para reactivar a futuro
// con un check de "no mostrar si user tiene legal pendiente".
const FloatingAssistant = lazy(() => import('@/features/chatbot/components/FloatingAssistant'));

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
