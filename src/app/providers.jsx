/**
 * @file src/app/providers.jsx
 * 
 * Agrupa todos los Context Providers globales en orden de dependencias:
 * 1. AuthProvider → estado de autenticación (base de todo)
 * 2. SubscriptionProvider → depende de auth para saber el plan del usuario
 * 3. AdminPermissionProvider → depende de auth para cargar permisos admin
 * 4. CartProvider → estado del carrito (independiente pero necesita auth)
 * 
 * SuperAdminProvider fue reemplazado por AdminPermissionProvider
 * que usa la tabla admin_permissions para permisos granulares.
 */

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { AdminPermissionProvider } from '@/contexts/AdminPermissionContext';
import { CartProvider } from '@/hooks/useCart';

export const Providers = ({ children }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AdminPermissionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AdminPermissionProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};