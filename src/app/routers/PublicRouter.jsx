
import React, { Suspense } from 'react';
import lazy from '@/lib/utils/lazyRetry';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const DentistLandingPage = lazy(() => import('@/pages/DentistLandingPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const StatusPage = lazy(() => import('@/pages/StatusPage'));
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const TherapistPublicProfilePage = lazy(() => import('@/pages/TherapistPublicProfilePage'));
const BlogPage = lazy(() => import('@/pages/blog/public/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/blog/public/BlogPostPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const FonoaudiologosSearchPage = lazy(() => import('@/pages/FonoaudiologosSearchPage'));
const LeadCapturePage = lazy(() => import('@/pages/LeadCapturePage'));
const ConfirmEmailPage = lazy(() => import('@/features/auth/pages/ConfirmEmailPage'));
const PendingApprovalPage = lazy(() => import('@/pages/PendingApprovalPage'));
const PublicConsultaPage = lazy(() => import('@/features/symptom-flow/pages/PublicConsultaPage'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-[60vh] w-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const PublicRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes (No Layout) */}
        <Route path="/auth">
          <Route path="confirm-email" element={<ConfirmEmailPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          {/* Pending approval — destino del RoleGuard para pros no aprobados.
              IMPORTANTE: debe ir ANTES de :action (catch-all). */}
          <Route path="pending-approval" element={<PendingApprovalPage />} />
          <Route path=":action" element={<AuthPage />} />
        </Route>

        {/* Landing Pages (No Layout — full-screen) */}
        <Route path="/registro-profesional" element={<LeadCapturePage />} />
        <Route path="/consulta" element={<PublicConsultaPage />} />

        {/* Pages with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          {/* Spec 027: landing dedicada B2B para dentistas — DEBE ir antes del
              catch-all `/:slug` para no quedar interceptada como slug. */}
          <Route path="/para-dentistas" element={<DentistLandingPage />} />
          <Route path="/planes" element={<PricingPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/dentistas" element={<FonoaudiologosSearchPage />} />

          {/* DYNAMIC SLUG: Must be the absolute last route inside the Layout block */}
          <Route path="/:slug" element={<TherapistPublicProfilePage />} />
        </Route>

        {/* Status público (sin Layout — standalone) */}
        <Route path="/status" element={<StatusPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default PublicRouter;
