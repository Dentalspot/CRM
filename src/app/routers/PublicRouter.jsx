
import React, { Suspense } from 'react';
import lazy from '@/lib/utils/lazyRetry';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const TherapistPublicProfilePage = lazy(() => import('@/pages/TherapistPublicProfilePage'));
const BlogPage = lazy(() => import('@/pages/blog/public/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/blog/public/BlogPostPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const FonoaudiologosSearchPage = lazy(() => import('@/pages/FonoaudiologosSearchPage'));
const LeadCapturePage = lazy(() => import('@/pages/LeadCapturePage'));
const ConfirmEmailPage = lazy(() => import('@/features/auth/pages/ConfirmEmailPage'));
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
          <Route path=":action" element={<AuthPage />} />
        </Route>

        {/* Landing Pages (No Layout — full-screen) */}
        <Route path="/registro-profesional" element={<LeadCapturePage />} />
        <Route path="/consulta" element={<PublicConsultaPage />} />

        {/* Pages with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/planes" element={<PricingPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/dentistas" element={<FonoaudiologosSearchPage />} />

          {/* DYNAMIC SLUG: Must be the absolute last route inside the Layout block */}
          <Route path="/:slug" element={<TherapistPublicProfilePage />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default PublicRouter;
