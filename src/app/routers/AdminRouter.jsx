
import React, { Suspense } from 'react';
import lazy from '@/lib/utils/lazyRetry';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Guards
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

// Layout - AdminShell con sidebar dinámico por permisos
import AdminShell from '@/features/admin/shell/AdminShell';

// ============================================
// DASHBOARD
// ============================================
const SuperAdminDashboard = lazy(() => import('@/pages/SuperAdminDashboard.jsx'));

// ============================================
// BLOG MODULE (blog@dentalspot.cl)
// Módulos DB: blog, qa, moderation
// ============================================
const BlogDashboardPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogDashboardPage.jsx'));
const BlogListPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogListPage.jsx'));
const BlogEditorPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogEditorPage.jsx'));
const BlogDetailPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogDetailPage.jsx'));
const BlogCategoriesPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogCategoriesPage.jsx'));
const BlogModeratorPage = lazy(() => import('@/features/admin/modules/blog/pages/BlogModeratorPage.jsx'));

// Legacy blog/qa pages (funcionan, se migrarán progresivamente)
const AdminQAManagementPage = lazy(() => import('@/pages/admin/QAManagementPage.jsx'));
const AdminQACategoriesPage = lazy(() => import('@/pages/admin/QACategoriesPage.jsx'));
const AdminAnswerModerationPage = lazy(() => import('@/pages/admin/AnswerModerationPage.jsx'));


// ============================================
// CLINICAL HISTORY MODULE (ficha@dentalspot.cl)
// Módulos DB: clinical_files, patients
// ============================================
const ClinicalHistoryListPage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryListPage.jsx'));
const ClinicalHistoryDetailPage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryDetailPage.jsx'));
const ClinicalHistoryChangesPage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryChangesPage.jsx'));
const ClinicalHistoryAccessLogPage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryAccessLogPage.jsx'));
const ClinicalHistoryCompliancePage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryCompliancePage.jsx'));
const ClinicalHistoryExportPage = lazy(() => import('@/features/admin/modules/clinical-history/pages/ClinicalHistoryExportPage.jsx'));

// ============================================
// PATIENTS MODULE (pacientes@dentalspot.cl)
// Módulos DB: patients, patients_management, demographics
// ============================================
const PatientsListPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientsListPage.jsx'));
const PatientDetailPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientDetailPage.jsx'));
const PatientDemographicsEditPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientDemographicsEditPage.jsx'));
const PatientDemographicsStatsPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientDemographicsStatsPage.jsx'));
const PatientDataQualityPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientDataQualityPage.jsx'));
const PatientBulkActionsPage = lazy(() => import('@/features/admin/modules/patients/pages/PatientBulkActionsPage.jsx'));

// Legacy patients pages
const PatientAdminPage = lazy(() => import('@/pages/admin/PatientAdminPage.jsx'));
const PatientsManagementPage = lazy(() => import('@/pages/admin/PatientsManagementPage.jsx'));
const ClinicalFileManagementPage = lazy(() => import('@/pages/admin/ClinicalFileManagementPage.jsx'));
const ClinicalFileDetailPage = lazy(() => import('@/pages/admin/ClinicalFileDetailPage.jsx'));
const PatientDemographicsPage = lazy(() => import('@/pages/admin/PatientDemographicsPage.jsx'));


// ============================================
// DENTALLEVEL MODULE (dentallevel@dentalspot.cl)
// Módulos DB: dentallevel, specialties
// ============================================
const FonoLevelListPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoLevelListPage.jsx'));
const FonoLevelDetailPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoLevelDetailPage.jsx'));
const FonoLevelManagementPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoLevelManagementPage.jsx'));
const FonoSpecialtyPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoSpecialtyPage.jsx'));
const FonoBadgesPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoBadgesPage.jsx'));
const FonoReputationReviewPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoReputationReviewPage.jsx'));
const FonoPerformanceMetricsPage = lazy(() => import('@/features/admin/modules/fonolevel/pages/FonoPerformanceMetricsPage.jsx'));

// Legacy specialties page
const SpecialtyAdminPage = lazy(() => import('@/features/admin/pages/SpecialtyAdminPage.jsx'));

// ============================================
// BILLING MODULE (pagos@dentalspot.cl)
// Módulos DB: payments, subscriptions, coupons, memberships
// ============================================
const BillingDashboardPage = lazy(() => import('@/features/admin/modules/billing/pages/BillingDashboardPage.jsx'));
const SubscriptionsPage = lazy(() => import('@/features/admin/modules/billing/pages/SubscriptionsPage.jsx'));
const SubscriptionDetailPage = lazy(() => import('@/features/admin/modules/billing/pages/SubscriptionDetailPage.jsx'));
const PaymentsPage = lazy(() => import('@/features/admin/modules/billing/pages/PaymentsPage.jsx'));
const PaymentDetailPage = lazy(() => import('@/features/admin/modules/billing/pages/PaymentDetailPage.jsx'));
const FailedPaymentsPage = lazy(() => import('@/features/admin/modules/billing/pages/FailedPaymentsPage.jsx'));
const RefundsPage = lazy(() => import('@/features/admin/modules/billing/pages/RefundsPage.jsx'));
const PlansPage = lazy(() => import('@/features/admin/modules/billing/pages/PlansPage.jsx'));
const PlanDetailPage = lazy(() => import('@/features/admin/modules/billing/pages/PlanDetailPage.jsx'));
const CouponsPage = lazy(() => import('@/features/admin/modules/billing/pages/CouponsPage.jsx'));
const CouponDetailPage = lazy(() => import('@/features/admin/modules/billing/pages/CouponDetailPage.jsx'));
const CommissionsPage = lazy(() => import('@/features/admin/modules/billing/pages/CommissionsPage.jsx'));
const CommissionDetailPage = lazy(() => import('@/features/admin/modules/billing/pages/CommissionDetailPage.jsx'));
const InvoicesPage = lazy(() => import('@/features/admin/modules/billing/pages/InvoicesPage.jsx'));
const BillingReportsPage = lazy(() => import('@/features/admin/modules/billing/pages/BillingReportsPage.jsx'));

// Legacy billing pages
const AdminMembershipPlansPage = lazy(() => import('@/pages/admin/MembershipPlansPage.jsx'));
const AdminSubscriptionsPage = lazy(() => import('@/pages/admin/SubscriptionsPage.jsx'));
const AdminPaymentHistoryPage = lazy(() => import('@/pages/admin/PaymentHistoryPage.jsx'));
const AdminCouponsPage = lazy(() => import('@/features/admin/pages/CouponsPage.jsx'));


// ============================================
// AI TOOLS MODULE (ia@dentalspot.cl)
// Módulos DB: ai_tools, faq
// ============================================
const AiDashboardPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiDashboardPage.jsx'));
const AiModelListPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiModelListPage.jsx'));
const AiModelDetailPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiModelDetailPage.jsx'));
const AiTrainingJobsPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiTrainingJobsPage.jsx'));
const AiTrainingJobDetailPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiTrainingJobDetailPage.jsx'));
const AiDatasetListPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiDatasetListPage.jsx'));
const AiDatasetDetailPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiDatasetDetailPage.jsx'));
const AiPlaygroundPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiPlaygroundPage.jsx'));
const AiEvaluationsPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiEvaluationsPage.jsx'));
const AiEvaluationDetailPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiEvaluationDetailPage.jsx'));
const AiUsageLogsPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiUsageLogsPage.jsx'));
const AiSettingsPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiSettingsPage.jsx'));
const AiPromptTemplatesPage = lazy(() => import('@/features/admin/modules/ai-tools/pages/AiPromptTemplatesPage.jsx'));

// Legacy FAQ page
const FaqManagementPage = lazy(() => import('@/features/admin/pages/FaqManagementPage.jsx'));


// ============================================
// MARKETPLACE MODULE (marketplace@dentalspot.cl)
// Módulos DB: marketplace, sales, commissions, withdrawals
// ============================================
const MarketplaceDashboardPage = lazy(() => import('@/features/admin/modules/marketplace/pages/MarketplaceDashboardPage.jsx'));
const SalesPage = lazy(() => import('@/features/admin/modules/marketplace/pages/SalesPage.jsx'));
const SaleDetailPage = lazy(() => import('@/features/admin/modules/marketplace/pages/SaleDetailPage.jsx'));
const MCommissionsPage = lazy(() => import('@/features/admin/modules/marketplace/pages/CommissionsPage.jsx'));
const MCommissionDetailPage = lazy(() => import('@/features/admin/modules/marketplace/pages/CommissionDetailPage.jsx'));
const WithdrawalsPage = lazy(() => import('@/features/admin/modules/marketplace/pages/WithdrawalsPage.jsx'));
const WithdrawalDetailPage = lazy(() => import('@/features/admin/modules/marketplace/pages/WithdrawalDetailPage.jsx'));
const ProductsPage = lazy(() => import('@/features/admin/modules/marketplace/pages/ProductsPage.jsx'));
const ProductDetailPage = lazy(() => import('@/features/admin/modules/marketplace/pages/ProductDetailPage.jsx'));
const MCouponsPage = lazy(() => import('@/features/admin/modules/marketplace/pages/CouponsPage.jsx'));
const MCouponDetailPage = lazy(() => import('@/features/admin/modules/marketplace/pages/CouponDetailPage.jsx'));
const MarketplaceMetricsPage = lazy(() => import('@/features/admin/modules/marketplace/pages/MarketplaceMetricsPage.jsx'));
const VendorPerformancePage = lazy(() => import('@/features/admin/modules/marketplace/pages/VendorPerformancePage.jsx'));

// Legacy marketplace pages
const SalesDashboardPage = lazy(() => import('@/features/admin/pages/SalesDashboardPage.jsx'));
const CommissionsManagementPage = lazy(() => import('@/features/admin/pages/CommissionsManagementPage.jsx'));
const WithdrawalsManagementPage = lazy(() => import('@/features/admin/pages/WithdrawalsManagementPage.jsx'));


// ============================================
// SUPPORT MODULE (debug@dentalspot.cl)
// Módulos DB: support, therapists, clinics
// ============================================
const SupportDashboardPage = lazy(() => import('@/features/admin/modules/support/pages/SupportDashboardPage.jsx'));
const TicketsPage = lazy(() => import('@/features/admin/modules/support/pages/TicketsPage.jsx'));
const TicketDetailPage = lazy(() => import('@/features/admin/modules/support/pages/TicketDetailPage.jsx'));
const UserSearchPage = lazy(() => import('@/features/admin/modules/support/pages/UserSearchPage.jsx'));
const UserDiagnosticPage = lazy(() => import('@/features/admin/modules/support/pages/UserDiagnosticPage.jsx'));
const LogsPage = lazy(() => import('@/features/admin/modules/support/pages/LogsPage.jsx'));
const LogDetailPage = lazy(() => import('@/features/admin/modules/support/pages/LogDetailPage.jsx'));
const IncidentsPage = lazy(() => import('@/features/admin/modules/support/pages/IncidentsPage.jsx'));
const IncidentDetailPage = lazy(() => import('@/features/admin/modules/support/pages/IncidentDetailPage.jsx'));
const SystemHealthPage = lazy(() => import('@/features/admin/modules/support/pages/SystemHealthPage.jsx'));
const ErrorAnalysisPage = lazy(() => import('@/features/admin/modules/support/pages/ErrorAnalysisPage.jsx'));
const ErrorDetailPage = lazy(() => import('@/features/admin/modules/support/pages/ErrorDetailPage.jsx'));
const AuditLogPage = lazy(() => import('@/features/admin/modules/support/pages/AuditLogPage.jsx'));

// Legacy support pages
const AdminTherapistsPage = lazy(() => import('@/pages/admin/TherapistsManagementPage.jsx'));
const AdminClinicsPage = lazy(() => import('@/pages/admin/ClinicsManagementPage.jsx'));
const AdminReportsPage = lazy(() => import('@/pages/admin/ReportsPage.jsx'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage.jsx'));


// ============================================
// LEGAL MODULE (legal@dentalspot.cl)
// Módulos DB: legal
// ============================================
const LegalDashboardPage = lazy(() => import('@/features/admin/modules/legal/pages/LegalDashboardPage.jsx'));
const DocumentsPage = lazy(() => import('@/features/admin/modules/legal/pages/DocumentsPage.jsx'));
const DocumentDetailPage = lazy(() => import('@/features/admin/modules/legal/pages/DocumentDetailPage.jsx'));
const DocumentEditorPage = lazy(() => import('@/features/admin/modules/legal/pages/DocumentEditorPage.jsx'));
const PoliciesPage = lazy(() => import('@/features/admin/modules/legal/pages/PoliciesPage.jsx'));
const PolicyDetailPage = lazy(() => import('@/features/admin/modules/legal/pages/PolicyDetailPage.jsx'));
const PolicyEditorPage = lazy(() => import('@/features/admin/modules/legal/pages/PolicyEditorPage.jsx'));
const SignaturesPage = lazy(() => import('@/features/admin/modules/legal/pages/SignaturesPage.jsx'));
const AuditsPage = lazy(() => import('@/features/admin/modules/legal/pages/AuditsPage.jsx'));
const CompliancePage = lazy(() => import('@/features/admin/modules/legal/pages/CompliancePage.jsx'));
const RisksPage = lazy(() => import('@/features/admin/modules/legal/pages/RisksPage.jsx'));
const ArcoRequestsPage = lazy(() => import('@/features/admin/modules/legal/pages/ArcoRequestsPage.jsx'));
const CookieConsentsPage = lazy(() => import('@/features/admin/modules/legal/pages/CookieConsentsPage.jsx'));
const FeedbackPage = lazy(() => import('@/features/admin/modules/feedback/FeedbackPage.jsx'));
const DirectoryPage = lazy(() => import('@/features/admin/modules/billing/pages/DirectoryPage.jsx'));
const MarketingDashboardPage = lazy(() => import('@/features/admin/modules/marketing/pages/MarketingDashboardPage.jsx'));
const LeadsImportPage = lazy(() => import('@/features/admin/modules/marketing/pages/LeadsImportPage.jsx'));
const LeadsKanbanPage = lazy(() => import('@/features/admin/modules/marketing/pages/LeadsKanbanPage.jsx'));
const AudiencePage = lazy(() => import('@/features/admin/modules/marketing/pages/AudiencePage.jsx'));
const CampaignsPage = lazy(() => import('@/features/admin/modules/marketing/pages/CampaignsPage.jsx'));
const TemplatesPage = lazy(() => import('@/features/admin/modules/marketing/pages/TemplatesPage.jsx'));
const MarketingAnalyticsPage = lazy(() => import('@/features/admin/modules/marketing/pages/AnalyticsPage.jsx'));
const AutomationPage = lazy(() => import('@/features/admin/modules/marketing/pages/AutomationPage.jsx'));
const MarketingSettingsPage = lazy(() => import('@/features/admin/modules/marketing/pages/SettingsPage.jsx'));
const MissionControlPage = lazy(() => import('@/features/admin/modules/marketing/pages/MissionControlPage.jsx'));
const MetaAdsPage = lazy(() => import('@/features/admin/modules/marketing/pages/MetaAdsPage.jsx'));
const RiskDetailPage = lazy(() => import('@/features/admin/modules/legal/pages/RiskDetailPage.jsx'));
const DisputesPage = lazy(() => import('@/features/admin/modules/legal/pages/DisputesPage.jsx'));
const DisputeDetailPage = lazy(() => import('@/features/admin/modules/legal/pages/DisputeDetailPage.jsx'));
const AgreementsPage = lazy(() => import('@/features/admin/modules/legal/pages/AgreementsPage.jsx'));
const AgreementDetailPage = lazy(() => import('@/features/admin/modules/legal/pages/AgreementDetailPage.jsx'));
const LegalSettingsPage = lazy(() => import('@/features/admin/modules/legal/pages/LegalSettingsPage.jsx'));


// ============================================
// COMMON
// ============================================
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage.jsx'));
const TherapistProfileDashboardPage = lazy(() => import('@/pages/TherapistProfileDashboardPage.jsx'));

const PageLoader = () => (
  <div className="flex justify-center items-center h-full min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const AdminRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* AdminShell = sidebar dinámico + header + outlet */}
        <Route element={<AdminShell />}>

          {/* ============================================
              DASHBOARD (acceso para todos los admins)
          ============================================ */}
          <Route index element={<SuperAdminDashboard />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />

          {/* ============================================
              BLOG MODULE → blog@dentalspot.cl
              DB modules: blog, qa, moderation
          ============================================ */}
          <Route path="blog">
            <Route index element={<PermissionGuard module="blog" action="read"><BlogDashboardPage /></PermissionGuard>} />
            <Route path="list" element={<PermissionGuard module="blog" action="read"><BlogListPage /></PermissionGuard>} />
            <Route path="new" element={<PermissionGuard module="blog" action="write"><BlogEditorPage /></PermissionGuard>} />
            <Route path=":id" element={<PermissionGuard module="blog" action="write"><BlogEditorPage /></PermissionGuard>} />
            <Route path=":id/view" element={<PermissionGuard module="blog" action="read"><BlogDetailPage /></PermissionGuard>} />
            <Route path="categories" element={<PermissionGuard module="blog" action="write"><BlogCategoriesPage /></PermissionGuard>} />
            <Route path="moderation" element={<PermissionGuard module="moderation" action="read"><BlogModeratorPage /></PermissionGuard>} />
          </Route>

          <Route path="qa">
            <Route index element={<PermissionGuard module="qa" action="read"><AdminQAManagementPage /></PermissionGuard>} />
            <Route path="categories" element={<PermissionGuard module="qa" action="write"><AdminQACategoriesPage /></PermissionGuard>} />
            <Route path="moderation" element={<PermissionGuard module="moderation" action="read"><AdminAnswerModerationPage /></PermissionGuard>} />
          </Route>

          {/* ============================================
              CLINICAL HISTORY MODULE → ficha@dentalspot.cl
              DB modules: clinical_files, patients
          ============================================ */}
          <Route path="clinical-history">
            <Route index element={<PermissionGuard module="clinical_files" action="read"><ClinicalHistoryListPage /></PermissionGuard>} />
            <Route path="compliance" element={<PermissionGuard module="clinical_files" action="write"><ClinicalHistoryCompliancePage /></PermissionGuard>} />
            <Route path="exports" element={<PermissionGuard module="clinical_files" action="write"><ClinicalHistoryExportPage /></PermissionGuard>} />
            <Route path=":id" element={<PermissionGuard module="clinical_files" action="read"><ClinicalHistoryDetailPage /></PermissionGuard>} />
            <Route path=":id/changes" element={<PermissionGuard module="clinical_files" action="read"><ClinicalHistoryChangesPage /></PermissionGuard>} />
            <Route path=":id/access-log" element={<PermissionGuard module="clinical_files" action="read"><ClinicalHistoryAccessLogPage /></PermissionGuard>} />
          </Route>
          {/* ============================================
              PATIENTS MODULE → pacientes@dentalspot.cl
              DB modules: patients, patients_management, demographics
          ============================================ */}
          <Route path="patients">
            <Route index element={<PermissionGuard module="patients" action="read"><PatientsListPage /></PermissionGuard>} />
            <Route path="management" element={<PermissionGuard module="patients_management" action="read"><PatientsManagementPage /></PermissionGuard>} />
            <Route path="clinical-files" element={<PermissionGuard module="clinical_files" action="read"><ClinicalFileManagementPage /></PermissionGuard>} />
            <Route path="stats" element={<PermissionGuard module="demographics" action="read"><PatientDemographicsStatsPage /></PermissionGuard>} />
            <Route path="quality" element={<PermissionGuard module="patients_management" action="write"><PatientDataQualityPage /></PermissionGuard>} />
            <Route path="bulk-actions" element={<PermissionGuard module="patients_management" action="write"><PatientBulkActionsPage /></PermissionGuard>} />
            <Route path=":id" element={<PermissionGuard module="patients" action="read"><PatientDetailPage /></PermissionGuard>} />
            <Route path=":id/edit" element={<PermissionGuard module="patients" action="write"><PatientDemographicsEditPage /></PermissionGuard>} />
            <Route path=":id/clinical-file" element={<PermissionGuard module="clinical_files" action="read"><ClinicalFileDetailPage /></PermissionGuard>} />
            <Route path=":id/demographics" element={<PermissionGuard module="demographics" action="read"><PatientDemographicsPage /></PermissionGuard>} />
          </Route>

          {/* ============================================
              DENTALLEVEL MODULE → dentallevel@dentalspot.cl
              DB modules: dentallevel, specialties
          ============================================ */}
          <Route path="fonolevel">
            <Route index element={<PermissionGuard module="fonolevel" action="read"><FonoLevelListPage /></PermissionGuard>} />
            <Route path="management" element={<PermissionGuard module="fonolevel" action="write"><FonoLevelManagementPage /></PermissionGuard>} />
            <Route path="specialties" element={<PermissionGuard module="specialties" action="write"><FonoSpecialtyPage /></PermissionGuard>} />
            <Route path="badges" element={<PermissionGuard module="fonolevel" action="write"><FonoBadgesPage /></PermissionGuard>} />
            <Route path="review" element={<PermissionGuard module="fonolevel" action="write"><FonoReputationReviewPage /></PermissionGuard>} />
            <Route path="metrics" element={<PermissionGuard module="fonolevel" action="read"><FonoPerformanceMetricsPage /></PermissionGuard>} />
            <Route path=":id" element={<PermissionGuard module="fonolevel" action="read"><FonoLevelDetailPage /></PermissionGuard>} />
          </Route>

          {/* Legacy specialties route */}
          <Route path="especialidades" element={<PermissionGuard module="specialties" action="write"><SpecialtyAdminPage /></PermissionGuard>} />

          {/* ============================================
              BILLING MODULE → pagos@dentalspot.cl
              DB modules: payments, subscriptions, coupons, memberships
          ============================================ */}
          <Route path="billing">
            <Route index element={<PermissionGuard module="payments" action="read"><BillingDashboardPage /></PermissionGuard>} />
            <Route path="subscriptions" element={<PermissionGuard module="payments" action="read"><SubscriptionsPage /></PermissionGuard>} />
            <Route path="subscriptions/:id" element={<PermissionGuard module="payments" action="read"><SubscriptionDetailPage /></PermissionGuard>} />
            <Route path="payments" element={<PermissionGuard module="payments" action="read"><PaymentsPage /></PermissionGuard>} />
            <Route path="payments/failed" element={<PermissionGuard module="payments" action="read"><FailedPaymentsPage /></PermissionGuard>} />
            <Route path="payments/refunds" element={<PermissionGuard module="payments" action="read"><RefundsPage /></PermissionGuard>} />
            <Route path="payments/:id" element={<PermissionGuard module="payments" action="read"><PaymentDetailPage /></PermissionGuard>} />
            <Route path="plans" element={<PermissionGuard module="payments" action="read"><PlansPage /></PermissionGuard>} />
            <Route path="plans/:id" element={<PermissionGuard module="payments" action="read"><PlanDetailPage /></PermissionGuard>} />
            <Route path="coupons" element={<PermissionGuard module="payments" action="read"><CouponsPage /></PermissionGuard>} />
            <Route path="coupons/:id" element={<PermissionGuard module="payments" action="read"><CouponDetailPage /></PermissionGuard>} />
            <Route path="commissions" element={<PermissionGuard module="payments" action="read"><CommissionsPage /></PermissionGuard>} />
            <Route path="commissions/:id" element={<PermissionGuard module="payments" action="read"><CommissionDetailPage /></PermissionGuard>} />
            <Route path="invoices" element={<PermissionGuard module="payments" action="read"><InvoicesPage /></PermissionGuard>} />
            <Route path="reports" element={<PermissionGuard module="payments" action="read"><BillingReportsPage /></PermissionGuard>} />
            <Route path="directory" element={<PermissionGuard module="directory" action="read"><DirectoryPage /></PermissionGuard>} />
          </Route>

          {/* Legacy billing routes (mantener hasta migración completa) */}
          <Route path="pagos" element={<PermissionGuard module="payments" action="read"><AdminPaymentHistoryPage /></PermissionGuard>} />
          <Route path="plans" element={<PermissionGuard module="memberships" action="write"><AdminMembershipPlansPage /></PermissionGuard>} />
          <Route path="subscriptions" element={<PermissionGuard module="subscriptions" action="read"><AdminSubscriptionsPage /></PermissionGuard>} />
          <Route path="coupons" element={<PermissionGuard module="coupons" action="write"><AdminCouponsPage /></PermissionGuard>} />

          {/* ============================================
              AI TOOLS MODULE → ia@dentalspot.cl
              DB modules: ai_tools, faq
          ============================================ */}
          <Route path="ai-tools">
            <Route index element={<PermissionGuard module="ai_tools" action="read"><AiDashboardPage /></PermissionGuard>} />
            <Route path="models" element={<PermissionGuard module="ai_tools" action="read"><AiModelListPage /></PermissionGuard>} />
            <Route path="models/:id" element={<PermissionGuard module="ai_tools" action="read"><AiModelDetailPage /></PermissionGuard>} />
            <Route path="training" element={<PermissionGuard module="ai_tools" action="read"><AiTrainingJobsPage /></PermissionGuard>} />
            <Route path="training/:id" element={<PermissionGuard module="ai_tools" action="read"><AiTrainingJobDetailPage /></PermissionGuard>} />
            <Route path="datasets" element={<PermissionGuard module="ai_tools" action="read"><AiDatasetListPage /></PermissionGuard>} />
            <Route path="datasets/:id" element={<PermissionGuard module="ai_tools" action="read"><AiDatasetDetailPage /></PermissionGuard>} />
            <Route path="playground" element={<PermissionGuard module="ai_tools" action="write"><AiPlaygroundPage /></PermissionGuard>} />
            <Route path="evaluations" element={<PermissionGuard module="ai_tools" action="read"><AiEvaluationsPage /></PermissionGuard>} />
            <Route path="evaluations/:id" element={<PermissionGuard module="ai_tools" action="read"><AiEvaluationDetailPage /></PermissionGuard>} />
            <Route path="logs" element={<PermissionGuard module="ai_tools" action="read"><AiUsageLogsPage /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard module="ai_tools" action="write"><AiSettingsPage /></PermissionGuard>} />
            <Route path="prompts" element={<PermissionGuard module="ai_tools" action="write"><AiPromptTemplatesPage /></PermissionGuard>} />
          </Route>

          {/* Legacy FAQ route */}
          <Route path="faq-management" element={<PermissionGuard module="faq" action="write"><FaqManagementPage /></PermissionGuard>} />

          {/* ============================================
              MARKETPLACE MODULE → marketplace@dentalspot.cl
              DB modules: marketplace, sales, commissions, withdrawals
          ============================================ */}
          <Route path="marketplace">
            <Route index element={<PermissionGuard module="marketplace" action="read"><MarketplaceDashboardPage /></PermissionGuard>} />
            <Route path="sales" element={<MCommissionsPage />} />
            <Route path="commissions" element={<MCommissionsPage />} />
            <Route path="withdrawals" element={<PermissionGuard module="withdrawals" action="write"><WithdrawalsPage /></PermissionGuard>} />
            <Route path="withdrawals/:id" element={<PermissionGuard module="withdrawals" action="write"><WithdrawalDetailPage /></PermissionGuard>} />
            <Route path="products" element={<PermissionGuard module="marketplace" action="read"><ProductsPage /></PermissionGuard>} />
            <Route path="products/:id" element={<PermissionGuard module="marketplace" action="write"><ProductDetailPage /></PermissionGuard>} />
            <Route path="coupons" element={<PermissionGuard module="marketplace" action="write"><MCouponsPage /></PermissionGuard>} />
            <Route path="coupons/:id" element={<PermissionGuard module="marketplace" action="write"><MCouponDetailPage /></PermissionGuard>} />
            <Route path="metrics" element={<PermissionGuard module="sales" action="read"><MarketplaceMetricsPage /></PermissionGuard>} />
            <Route path="performance" element={<PermissionGuard module="sales" action="read"><VendorPerformancePage /></PermissionGuard>} />
          </Route>

          {/* Legacy marketplace routes */}
          <Route path="sales" element={<PermissionGuard module="sales" action="read"><SalesDashboardPage /></PermissionGuard>} />
          <Route path="facturacion" element={<PermissionGuard module="commissions" action="read"><CommissionsManagementPage /></PermissionGuard>} />
          <Route path="withdrawals" element={<PermissionGuard module="withdrawals" action="read"><WithdrawalsManagementPage /></PermissionGuard>} />

          {/* ============================================
              SUPPORT MODULE → debug@dentalspot.cl
              DB modules: support, therapists, clinics
          ============================================ */}
          <Route path="support">
            <Route index element={<PermissionGuard module="support" action="read"><SupportDashboardPage /></PermissionGuard>} />
            <Route path="tickets" element={<PermissionGuard module="support" action="read"><TicketsPage /></PermissionGuard>} />
            <Route path="tickets/:id" element={<PermissionGuard module="support" action="read"><TicketDetailPage /></PermissionGuard>} />
            <Route path="users" element={<PermissionGuard module="support" action="read"><UserSearchPage /></PermissionGuard>} />
            <Route path="users/:id/diagnostic" element={<PermissionGuard module="support" action="read"><UserDiagnosticPage /></PermissionGuard>} />
            <Route path="logs" element={<PermissionGuard module="support" action="read"><LogsPage /></PermissionGuard>} />
            <Route path="logs/:id" element={<PermissionGuard module="support" action="read"><LogDetailPage /></PermissionGuard>} />
            <Route path="incidents" element={<PermissionGuard module="support" action="read"><IncidentsPage /></PermissionGuard>} />
            <Route path="incidents/:id" element={<PermissionGuard module="support" action="read"><IncidentDetailPage /></PermissionGuard>} />
            <Route path="health" element={<PermissionGuard module="support" action="read"><SystemHealthPage /></PermissionGuard>} />
            <Route path="errors" element={<PermissionGuard module="support" action="read"><ErrorAnalysisPage /></PermissionGuard>} />
            <Route path="errors/:id" element={<PermissionGuard module="support" action="read"><ErrorDetailPage /></PermissionGuard>} />
            <Route path="audit" element={<PermissionGuard module="support" action="read"><AuditLogPage /></PermissionGuard>} />
          </Route>

          {/* Legacy support routes */}
          <Route path="therapists" element={<PermissionGuard module="therapists" action="read"><AdminTherapistsPage /></PermissionGuard>} />
          <Route path="clinics" element={<PermissionGuard module="clinics" action="read"><AdminClinicsPage /></PermissionGuard>} />
          <Route path="feedback" element={<PermissionGuard module="feedback" action="read"><FeedbackPage /></PermissionGuard>} />
          <Route path="reports" element={<PermissionGuard module="support" action="read"><AdminReportsPage /></PermissionGuard>} />
          <Route path="settings" element={<PermissionGuard module="support" action="read"><AdminSettingsPage /></PermissionGuard>} />

          {/* ============================================
              LEGAL MODULE → legal@dentalspot.cl
              DB modules: legal
          ============================================ */}
          <Route path="legal">
            <Route index element={<PermissionGuard module="legal" action="read"><LegalDashboardPage /></PermissionGuard>} />
            <Route path="documents" element={<PermissionGuard module="legal" action="read"><DocumentsPage /></PermissionGuard>} />
            <Route path="documents/new" element={<PermissionGuard module="legal" action="write"><DocumentEditorPage /></PermissionGuard>} />
            <Route path="documents/:id" element={<PermissionGuard module="legal" action="read"><DocumentDetailPage /></PermissionGuard>} />
            <Route path="documents/:id/edit" element={<PermissionGuard module="legal" action="write"><DocumentEditorPage /></PermissionGuard>} />
            <Route path="policies" element={<PermissionGuard module="legal" action="read"><PoliciesPage /></PermissionGuard>} />
            <Route path="policies/new" element={<PermissionGuard module="legal" action="write"><PolicyEditorPage /></PermissionGuard>} />
            <Route path="policies/:id" element={<PermissionGuard module="legal" action="read"><PolicyDetailPage /></PermissionGuard>} />
            <Route path="policies/:id/edit" element={<PermissionGuard module="legal" action="write"><PolicyEditorPage /></PermissionGuard>} />
            <Route path="signatures" element={<PermissionGuard module="legal" action="read"><SignaturesPage /></PermissionGuard>} />
            <Route path="audits" element={<PermissionGuard module="legal" action="read"><AuditsPage /></PermissionGuard>} />
            <Route path="compliance" element={<PermissionGuard module="legal" action="read"><CompliancePage /></PermissionGuard>} />
            <Route path="risks" element={<PermissionGuard module="legal" action="read"><RisksPage /></PermissionGuard>} />
            <Route path="risks/:id" element={<PermissionGuard module="legal" action="read"><RiskDetailPage /></PermissionGuard>} />
            <Route path="disputes" element={<PermissionGuard module="legal" action="read"><DisputesPage /></PermissionGuard>} />
            <Route path="disputes/:id" element={<PermissionGuard module="legal" action="read"><DisputeDetailPage /></PermissionGuard>} />
            <Route path="agreements" element={<PermissionGuard module="legal" action="read"><AgreementsPage /></PermissionGuard>} />
            <Route path="agreements/:id" element={<PermissionGuard module="legal" action="read"><AgreementDetailPage /></PermissionGuard>} />
            <Route path="settings" element={<PermissionGuard module="legal" action="write"><LegalSettingsPage /></PermissionGuard>} />
            <Route path="arco" element={<ArcoRequestsPage />} />
            <Route path="cookie-consents" element={<CookieConsentsPage />} />
          </Route>

          {/* ============================================
              MARKETING
          ============================================ */}
          <Route path="marketing" element={<PermissionGuard module="marketing" action="read"><MarketingDashboardPage /></PermissionGuard>} />
          <Route path="marketing/import" element={<PermissionGuard module="marketing" action="write"><LeadsImportPage /></PermissionGuard>} />
          <Route path="marketing/kanban" element={<PermissionGuard module="marketing" action="read"><LeadsKanbanPage /></PermissionGuard>} />
          <Route path="marketing/audience" element={<PermissionGuard module="marketing" action="read"><AudiencePage /></PermissionGuard>} />
          <Route path="marketing/campaigns" element={<PermissionGuard module="marketing" action="read"><CampaignsPage /></PermissionGuard>} />
          <Route path="marketing/templates" element={<PermissionGuard module="marketing" action="read"><TemplatesPage /></PermissionGuard>} />
          <Route path="marketing/analytics" element={<PermissionGuard module="marketing" action="read"><MarketingAnalyticsPage /></PermissionGuard>} />
          <Route path="marketing/automation" element={<PermissionGuard module="marketing" action="read"><AutomationPage /></PermissionGuard>} />
          <Route path="marketing/mission-control" element={<PermissionGuard module="marketing" action="read"><MissionControlPage /></PermissionGuard>} />
          <Route path="marketing/meta-ads" element={<PermissionGuard module="marketing" action="read"><MetaAdsPage /></PermissionGuard>} />
          <Route path="marketing/settings" element={<PermissionGuard module="marketing" action="read"><MarketingSettingsPage /></PermissionGuard>} />

          {/* ============================================
              PROFILE
          ============================================ */}
          <Route path="profile" element={<TherapistProfileDashboardPage />} />

          {/* ============================================
              CATCH-ALL
          ============================================ */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRouter;
