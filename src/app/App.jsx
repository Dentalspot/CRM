/**
 * @file src/app/App.jsx
 * Entry point for the application structure.
 * Wraps providers around the Router.
 */
import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import AppRouter from './AppRouter';
import FloatingAssistant from '@/features/chatbot/components/FloatingAssistant';
import MetaPixelProvider from '@/components/shared/MetaPixelProvider';

function App() {
  return (
    <HelmetProvider>
      <Providers>
        <MetaPixelProvider>
          <AppRouter />
        </MetaPixelProvider>
        <FloatingAssistant />
        <Toaster />
      </Providers>
    </HelmetProvider>
  );
}

export default App;