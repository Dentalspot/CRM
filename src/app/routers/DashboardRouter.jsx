import React, { Suspense } from 'react';
import lazy from '@/lib/utils/lazyRetry';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { USER_ROLES } from '@/constants/roles';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

// Guards
import AuthGuard from '@/components/guards/AuthGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import PlanGuard from '@/components/guards/PlanGuard';
import AddOnGuard from '@/components/guards/AddOnGuard';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Common Dashboard Pages
import RoleLandingRedirect from '@/components/auth/RoleLandingRedirect';
const ChatbotPage = lazy(() => import('@/features/chatbot/pages/ChatbotPage.jsx'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage.jsx'));
const ReportDetailPage = lazy(() => import('@/features/reports/pages/ReportDetailPage.jsx'));
const TherapistProfilePage = lazy(() => import('@/features/recommendations/pages/TherapistProfilePage.jsx'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage.jsx'));


// Therapist Pages
const TherapistDashboardPage = lazy(() => import('@/pages/TherapistDashboardPage.jsx'));
const TherapistProfileDashboardPage = lazy(() => import('@/pages/TherapistProfileDashboardPage.jsx'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage.jsx'));
const PatientsPage = lazy(() => import('@/pages/PatientsPage.jsx'));
const ImportPatientsPage = lazy(() => import('@/features/patient-import/ImportPatientsPage.jsx'));
const ImportProductsPage = lazy(() => import('@/features/product-import/ImportProductsPage.jsx'));
const PatientFilePage = lazy(() => import('@/pages/therapist/PatientFilePage.jsx'));
const TherapistMarketplacePage = lazy(() => import('@/features/marketplace/pages/TherapistMarketplacePage.jsx'));
const TherapistProductsPage = lazy(() => import('@/pages/TherapistProductsPage.jsx'));
// MOVED
const TherapistCreateProductPage = lazy(() => import('@/features/marketplace/pages/TherapistCreateProductPage.jsx'));
const TherapistEditProductPage = lazy(() => import('@/features/marketplace/pages/TherapistEditProductPage.jsx'));
const MembershipPlansPage = lazy(() => import('@/features/membership/pages/MembershipPlansPage.jsx'));
const PaymentStatusPage = lazy(() => import('@/features/membership/components/PaymentStatusPage.jsx'));
const WalletPage = lazy(() => import('@/features/wallet/pages/WalletPage.jsx'));
const TherapistQuestionsPage = lazy(() => import('@/features/therapist/pages/PatientQuestionsPage.jsx'));
const MyBlogArticlesPage = lazy(() => import('@/features/therapist/pages/MyBlogArticlesPage.jsx'));
const PublishedAnswersPage = lazy(() => import('@/features/therapist/pages/PublishedAnswersPage.jsx'));
const BlogArticleEditorPage = lazy(() => import('@/features/therapist/pages/BlogArticleEditorPage.jsx'));
const ConfirmAppointmentPage = lazy(() => import('@/pages/ConfirmAppointmentPage.jsx'));
const TemplateGeneratorPage = lazy(() => import('@/features/therapist/pages/TemplateGeneratorPage.jsx'));
const NotizPage = lazy(() => import('@/features/therapist/pages/NotizPage.jsx'));
const EvidenceSearchPage = lazy(() => import('@/pages/EvidenceSearchPage.jsx'));
const EducatorDashboardPage = lazy(() => import('@/features/educator/pages/EducatorDashboardPage.jsx'));
const CourseEditorPage = lazy(() => import('@/features/educator/pages/CourseEditorPage.jsx'));
const CourseStudentsPage = lazy(() => import('@/features/educator/pages/CourseStudentsPage.jsx'));
const PatientProgressPage = lazy(() => import('@/features/therapist/pages/PatientProgressPage.jsx'));
const TherapistEarningsPage = lazy(() => import('@/features/fonoaudiologo/pages/TherapistEarningsPage.jsx'));
const MarketplaceTemplatesPage = lazy(() => import('@/features/marketplace/pages/MarketplaceTemplatesPage.jsx'));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage.jsx'));
const PieDashboardPage = lazy(() => import('@/features/pie/pages/PieDashboardPage.jsx'));
const TecalEvaluationPage = lazy(() => import('@/features/pie/pages/TecalEvaluationPage.jsx'));
const StsgEvaluationPage = lazy(() => import('@/features/pie/pages/StsgEvaluationPage.jsx'));
const TeprosifEvaluationPage = lazy(() => import('@/features/pie/pages/TeprosifEvaluationPage.jsx'));
const Ados2ListPage = lazy(() => import('@/features/ados2/pages/Ados2ListPage.jsx'));
const Ados2EvaluationPage = lazy(() => import('@/features/ados2/pages/Ados2EvaluationPage.jsx'));
const OdontogramListPage = lazy(() => import('@/features/odontogram/pages/OdontogramListPage.jsx'));
const OdontogramEvaluationPage = lazy(() => import('@/features/odontogram/pages/OdontogramEvaluationPage.jsx'));
const InvitationsPanel = lazy(() => import('@/features/invitations/components/InvitationsPanel.jsx'));

// TEA Module
const TeaDashboardPage = lazy(() => import('@/features/tea/pages/TeaDashboardPage.jsx'));
const AdirListPage = lazy(() => import('@/features/adir/pages/AdirListPage.jsx'));
const AdirEvaluationPage = lazy(() => import('@/features/adir/pages/AdirEvaluationPage.jsx'));
const SensorialListPage = lazy(() => import('@/features/sensorial-profile/pages/SensorialListPage.jsx'));
const SensorialEvaluationPage = lazy(() => import('@/features/sensorial-profile/pages/SensorialEvaluationPage.jsx'));

// Patient Pages
const PatientDashboardPage = lazy(() => import('@/features/patient-dashboard/PatientDashboardPageV2.jsx'));
const MyProgressPage = lazy(() => import('@/features/patient/pages/MyProgressPage.jsx'));
const PatientClinicalFilePage = lazy(() => import('@/features/patient-file/pages/PatientClinicalFilePage.jsx'));
const PatientAccessHistoryPage = lazy(() => import('@/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx'));
const PatientQuestionsPage = lazy(() => import('@/features/patient-questions/pages/PatientQuestionsPage.jsx'));
const PatientAgendaPage = lazy(() => import('@/features/patient-agenda/pages/PatientAgendaPage.jsx'));
const MarketplaceListingDetailPage = lazy(() => import('@/features/marketplace/pages/MarketplaceListingDetailPage.jsx'));
const PurchaseSuccessPage = lazy(() => import('@/features/marketplace/pages/PurchaseSuccessPage.jsx'));
const MyPlanningsPage = lazy(() => import('@/features/marketplace/pages/MyPlanningsPage.jsx'));
const PlanDetailPage = lazy(() => import('@/features/marketplace/pages/PlanDetailPage.jsx'));

// Assistant Pages
const AssistantDashboard = lazy(() => import('@/features/assistant/pages/AssistantDashboard.jsx'));
// Spec 024: AssistantAgendaPage (vista lista) reemplazado por AssistantCalendarPage (rich calendar).
// El archivo legacy permanece en filesystem por rollback fácil hasta Polish task T035.
const AssistantCalendarPage = lazy(() => import('@/features/assistant/pages/AssistantCalendarPage.jsx'));
const AssistantPatientsPage = lazy(() => import('@/features/assistant/pages/AssistantPatientsPage.jsx'));

// Clinic Pages
const ClinicDashboardPage = lazy(() => import('@/features/clinic-dashboard/ClinicDashboardPageV2.jsx'));
const ClinicTherapistsManagementPage = lazy(() => import('@/pages/clinic/ClinicTherapistsManagementPage.jsx'));
const ClinicReportsPage = lazy(() => import('@/pages/clinic/ClinicReportsPage.jsx'));
// Spec 025: ClinicAgendasPage (vista lista) reemplazado por ClinicAdminCalendarPage (rich calendar).
// El archivo legacy permanece en filesystem hasta Polish task T011.
const ClinicAdminCalendarPage = lazy(() => import('@/features/clinic-dashboard/ClinicAdminCalendarPage.jsx'));
const ClinicPatientsPage = lazy(() => import('@/pages/clinic/ClinicPatientsPage.jsx'));

const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-full min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const DashboardRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<DashboardLayout />}>
          {/* Shared Base Route */}
          <Route index element={<AuthGuard><RoleLandingRedirect /></AuthGuard>} />
          
          <Route path="profile" element={<AuthGuard><TherapistProfileDashboardPage /></AuthGuard>} />
          <Route path="settings" element={<Navigate to="profile" replace />} />
          <Route path="chatbot" element={<AuthGuard><ChatbotPage /></AuthGuard>} />
          
          {/* Shared: Reports & Recommendations */}
          <Route path="reports" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT, USER_ROLES.THERAPIST]}><ReportsPage /></RoleGuard>} />
          <Route path="reports/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><ReportDetailPage /></RoleGuard>} />
          <Route path="therapist-profile/:id" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><TherapistProfilePage /></RoleGuard>} />

          {/* ======================= THERAPIST ROUTES ======================= */}
          <Route path="therapist">
            <Route index element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistDashboardPage /></RoleGuard>} />
            <Route path="questions" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistQuestionsPage /></RoleGuard>} />
            <Route path="blog" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><MyBlogArticlesPage /></RoleGuard>} />
            <Route path="blog/published" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PublishedAnswersPage /></RoleGuard>} />
            <Route path="blog/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><BlogArticleEditorPage /></RoleGuard>} />
            <Route path="blog/:id/edit" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><BlogArticleEditorPage /></RoleGuard>} />
            <Route path="patient-progress" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PlanGuard feature="aiProgressAnalysis" showFallback><PatientProgressPage /></PlanGuard></RoleGuard>} />
            {/* PIE Escolar — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.PIE_ESCOLAR && (
              <>
                <Route path="pie" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PieDashboardPage /></RoleGuard>} />
                <Route path="pie/tecal/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TecalEvaluationPage /></RoleGuard>} />
                <Route path="pie/tecal/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TecalEvaluationPage /></RoleGuard>} />
                <Route path="pie/stsg/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><StsgEvaluationPage /></RoleGuard>} />
                <Route path="pie/stsg/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><StsgEvaluationPage /></RoleGuard>} />
                <Route path="pie/teprosif/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TeprosifEvaluationPage /></RoleGuard>} />
                <Route path="pie/teprosif/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TeprosifEvaluationPage /></RoleGuard>} />
              </>
            )}
            {/* ADOS-2 — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.ADOS2 && (
              <>
                <Route path="ados2" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><Ados2ListPage /></RoleGuard>} />
                <Route path="ados2/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><Ados2EvaluationPage /></RoleGuard>} />
                <Route path="ados2/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><Ados2EvaluationPage /></RoleGuard>} />
                <Route path="ados2/:id/edit" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><Ados2EvaluationPage /></RoleGuard>} />
              </>
            )}

            {/* Odontograma Module */}
            <Route path="odontograma" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><OdontogramListPage /></RoleGuard>} />
            <Route path="odontograma/nueva" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><OdontogramEvaluationPage /></RoleGuard>} />
            <Route path="odontograma/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><OdontogramEvaluationPage /></RoleGuard>} />

            {/* TEA Module — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.TEA && (
              <Route path="tea" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TeaDashboardPage /></RoleGuard>} />
            )}
            {/* ADIR — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.ADIR && (
              <>
                <Route path="adir" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirListPage /></RoleGuard>} />
                <Route path="adir/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirEvaluationPage /></RoleGuard>} />
                <Route path="adir/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirEvaluationPage /></RoleGuard>} />
              </>
            )}
            {/* Perfil Sensorial — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.SENSORIAL_PROFILE && (
              <>
                <Route path="sensorial" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><SensorialListPage /></RoleGuard>} />
                <Route path="sensorial/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><SensorialEvaluationPage /></RoleGuard>} />
                <Route path="sensorial/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><SensorialEvaluationPage /></RoleGuard>} />
              </>
            )}

            <Route path="invitations" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><InvitationsPanel /></RoleGuard>} />
            
            {/* Marketplace Seller */}
            <Route path="marketplace" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistMarketplacePage /></RoleGuard>} />
            <Route path="marketplace/products" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistProductsPage /></RoleGuard>} />
            <Route path="marketplace/import" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><ImportProductsPage /></RoleGuard>} />
            <Route path="marketplace/create" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistCreateProductPage /></RoleGuard>} />
            <Route path="marketplace/edit/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistEditProductPage /></RoleGuard>} />
            
            {/* AI Tools */}
            <Route path="create-template" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="planGenerator"><TemplateGeneratorPage /></AddOnGuard></RoleGuard>} />
            <Route path="notiz" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="notiz"><NotizPage /></AddOnGuard></RoleGuard>} />
            <Route path="evidence-search" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><EvidenceSearchPage /></RoleGuard>} />

            {/* Educator Add-on — desactivado en Dentalspot (módulo heredado FonoKit) */}
            {FEATURE_FLAGS.EDUCATOR && (
              <>
                <Route path="educator" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="educator"><EducatorDashboardPage /></AddOnGuard></RoleGuard>} />
                <Route path="educator/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="educator"><CourseEditorPage /></AddOnGuard></RoleGuard>} />
                <Route path="educator/:id/edit" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="educator"><CourseEditorPage /></AddOnGuard></RoleGuard>} />
                <Route path="educator/:id/students" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AddOnGuard addOnId="educator"><CourseStudentsPage /></AddOnGuard></RoleGuard>} />
              </>
            )}
          </Route>

          <Route path="patients" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PatientsPage /></RoleGuard>} />
          <Route path="patients/import" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST, USER_ROLES.CLINIC]}><ImportPatientsPage /></RoleGuard>} />
          <Route path="patients/:id/*" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PatientFilePage /></RoleGuard>} />
          <Route path="calendar" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><CalendarPage /></RoleGuard>} />
          <Route path="confirm-appointment/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><ConfirmAppointmentPage /></RoleGuard>} />
          
          <Route path="wallet" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><WalletPage /></RoleGuard>} />
          <Route path="membership" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST, USER_ROLES.CLINIC]}><MembershipPlansPage /></RoleGuard>} />
          <Route path="membership/status" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST, USER_ROLES.CLINIC]}><PaymentStatusPage /></RoleGuard>} />
          <Route path="dentista/earnings" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><TherapistEarningsPage /></RoleGuard>} />

          {/* ======================= PATIENT ROUTES ======================= */}
          <Route path="patient">
            <Route index element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><PatientDashboardPage /></RoleGuard>} />
            <Route path="my-progress" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><MyProgressPage /></RoleGuard>} />
            <Route path="clinical-file" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><PatientClinicalFilePage /></RoleGuard>} />
            <Route path="access-history" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><PatientAccessHistoryPage /></RoleGuard>} />
            <Route path="my-passport" element={<Navigate to="/dashboard/patient/clinical-file" replace />} />
          </Route>
          <Route path="my-activities" element={<Navigate to="/dashboard/patient/my-progress" replace />} />
          <Route path="questions" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><PatientQuestionsPage /></RoleGuard>} />
          <Route path="my-agenda" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT]}><PatientAgendaPage /></RoleGuard>} />

          {/* ======================= ASSISTANT ROUTES ======================= */}
          <Route path="assistant">
            <Route index element={<AuthGuard><AssistantDashboard /></AuthGuard>} />
            <Route path="agenda" element={<AuthGuard><AssistantCalendarPage /></AuthGuard>} />
            <Route path="patients" element={<AuthGuard><AssistantPatientsPage /></AuthGuard>} />
          </Route>

          {/* ======================= CLINIC ROUTES ======================= */}
          <Route path="clinic">
            <Route index element={<RoleGuard allowedRoles={[USER_ROLES.CLINIC]}><ClinicDashboardPage /></RoleGuard>} />
            <Route path="therapists" element={<RoleGuard allowedRoles={[USER_ROLES.CLINIC]}><ClinicTherapistsManagementPage /></RoleGuard>} />
            <Route path="reports" element={<RoleGuard allowedRoles={[USER_ROLES.CLINIC]}><ClinicReportsPage /></RoleGuard>} />
            <Route path="agendas" element={<RoleGuard allowedRoles={[USER_ROLES.CLINIC]}><ClinicAdminCalendarPage /></RoleGuard>} />
            <Route path="patients" element={<RoleGuard allowedRoles={[USER_ROLES.CLINIC]}><ClinicPatientsPage /></RoleGuard>} />
          </Route>

          {/* Shared Marketplace */}
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="marketplace/templates" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><PlanGuard feature="marketplaceSell" showFallback><MarketplaceTemplatesPage /></PlanGuard></RoleGuard>} />
          <Route path="marketplace/listings/:id" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT, USER_ROLES.THERAPIST]}><PlanGuard feature="marketplaceBuy" showFallback><MarketplaceListingDetailPage /></PlanGuard></RoleGuard>} />
          <Route path="marketplace/purchase-success" element={<PurchaseSuccessPage />} />
          <Route path="marketplace/mis-planificaciones" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><MyPlanningsPage /></RoleGuard>} />
          <Route path="marketplace/plan/:slugOrId" element={<RoleGuard allowedRoles={[USER_ROLES.PATIENT, USER_ROLES.THERAPIST]}><PlanGuard feature="marketplaceBuy" showFallback><PlanDetailPage /></PlanGuard></RoleGuard>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
        {/* Payment Success - Outside Layout for cleanliness? No, inside layout is fine usually, but prompt separated it in PublicRouter. We keep it protected here. */}
        <Route path="payment-success/:orderId" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST, USER_ROLES.CLINIC]}><PaymentSuccessPage /></RoleGuard>} />
      </Routes>
    </Suspense>
  );
};

export default DashboardRouter;