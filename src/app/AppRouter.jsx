
import React, { Suspense } from 'react';
import lazy from '@/lib/utils/lazyRetry';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import RoleGuard from '@/components/guards/RoleGuard';
import { USER_ROLES } from '@/constants/roles';

// Shared Layout
import Layout from '@/components/layout/Layout';

// Sub-routers
import PublicRouter from './routers/PublicRouter';
import DashboardRouter from './routers/DashboardRouter';
import AdminRouter from './routers/AdminRouter';

// Top-level Pages
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const FonoaudiologosSearchPage = lazy(() => import('@/pages/FonoaudiologosSearchPage'));
const InviteAcceptPage = lazy(() => import('@/pages/InviteAcceptPage'));
const AcceptPassportPage = lazy(() => import('@/pages/AcceptPassportPage'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 1. Redirects */}
        <Route path="/buscar-dentista" element={<Navigate to="/dentistas" replace />} />

        {/* 2. Top-level public routes that need to bypass /:slug in PublicRouter */}
        <Route element={<Layout />}>
          <Route path="/dentistas" element={<FonoaudiologosSearchPage />} />
        </Route>
        {/* Clinic Invitation Accept (public — login happens inside the page) */}
        <Route path="/invite/:token" element={<InviteAcceptPage />} />
        {/* Clinical Passport Accept (public — login/register happens inside the page) */}
        <Route path="/accept-passport/:token" element={<AcceptPassportPage />} />
        
        {/* 3. Protected Routes */}
        <Route 
          path="/payment-success/:orderId" 
          element={
            <RoleGuard allowedRoles={[USER_ROLES.THERAPIST, USER_ROLES.CLINIC]}>
              <PaymentSuccessPage />
            </RoleGuard>
          } 
        />

        {/* 4. Feature Routers */}
        <Route path="/admin/*" element={<AdminRouter />} />
        <Route path="/dashboard/*" element={<DashboardRouter />} />
        
        {/* 5. Catch-all delegates to PublicRouter (which handles /, /blog, /:slug, etc) */}
        <Route path="/*" element={<PublicRouter />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
