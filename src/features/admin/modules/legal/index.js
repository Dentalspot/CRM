/**
 * @file index.js
 * @description Export barrel for the Legal module.
 */

// API
export * from './api/legalApi';

// Hooks
export * from './hooks/useLegalDocuments';
export * from './hooks/useLegalStats';
// ... export other hooks

// Pages
export { default as LegalDashboardPage } from './pages/LegalDashboardPage';
export { default as DocumentsPage } from './pages/DocumentsPage';
export { default as DocumentDetailPage } from './pages/DocumentDetailPage';
export { default as DocumentEditorPage } from './pages/DocumentEditorPage';
export { default as PoliciesPage } from './pages/PoliciesPage';
export { default as PolicyDetailPage } from './pages/PolicyDetailPage';
export { default as PolicyEditorPage } from './pages/PolicyEditorPage';
export { default as SignaturesPage } from './pages/SignaturesPage';
export { default as AuditsPage } from './pages/AuditsPage';
export { default as CompliancePage } from './pages/CompliancePage';
export { default as RisksPage } from './pages/RisksPage';
export { default as RiskDetailPage } from './pages/RiskDetailPage';
export { default as DisputesPage } from './pages/DisputesPage';
export { default as DisputeDetailPage } from './pages/DisputeDetailPage';
export { default as AgreementsPage } from './pages/AgreementsPage';
export { default as AgreementDetailPage } from './pages/AgreementDetailPage';
export { default as LegalSettingsPage } from './pages/LegalSettingsPage';