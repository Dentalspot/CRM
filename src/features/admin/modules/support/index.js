/**
 * @file index.js
 * @description Export barrel for Support module.
 */

// API
export { supportApi } from './api/supportApi';

// Hooks
export * from './hooks/useSupportTickets';
export * from './hooks/useTicketDetail';
export * from './hooks/useTicketActions';
export * from './hooks/useTicketNotes';
export * from './hooks/useUserSearch';
export * from './hooks/useUserDiagnostic';
export * from './hooks/useUserActions';
export * from './hooks/useSystemLogs';
export * from './hooks/useLogDetail';
export * from './hooks/useIncidents';
export * from './hooks/useIncidentDetail';
export * from './hooks/useIncidentActions';
export * from './hooks/useIncidentNotes';
export * from './hooks/useSystemHealth';
export * from './hooks/useErrorAnalysis';
export * from './hooks/useErrorDetail';
export * from './hooks/useSupportAuditLogs';

// Components
export { default as TicketsTable } from './components/TicketsTable';
export { default as TicketCard } from './components/TicketCard';
export { default as TicketStatusBadge } from './components/TicketStatusBadge';
export { default as UserSearchResults } from './components/UserSearchResults';
export { default as UserInfoCard } from './components/UserInfoCard';
export { default as UserDiagnosticPanel } from './components/UserDiagnosticPanel';
export { default as LogsTable } from './components/LogsTable';
export { default as LogViewer } from './components/LogViewer';
export { default as IncidentsTable } from './components/IncidentsTable';
export { default as IncidentCard } from './components/IncidentCard';
export { default as IncidentStatusBadge } from './components/IncidentStatusBadge';
export { default as SystemHealthCard } from './components/SystemHealthCard';
export { default as SystemHealthChart } from './components/SystemHealthChart';
export { default as ErrorAnalysisChart } from './components/ErrorAnalysisChart';
export { default as ErrorCard } from './components/ErrorCard';
export { default as SupportFilters } from './components/SupportFilters';
export { default as TicketNoteForm } from './components/TicketNoteForm';
export { default as IncidentNoteForm } from './components/IncidentNoteForm';
export { default as SupportAuditLogTable } from './components/SupportAuditLogTable';
export { default as AccessWarningBanner } from './components/AccessWarningBanner';

// Pages
export { default as SupportDashboardPage } from './pages/SupportDashboardPage';
export { default as TicketsPage } from './pages/TicketsPage';
export { default as TicketDetailPage } from './pages/TicketDetailPage';
export { default as UserSearchPage } from './pages/UserSearchPage';
export { default as UserDiagnosticPage } from './pages/UserDiagnosticPage';
export { default as LogsPage } from './pages/LogsPage';
export { default as LogDetailPage } from './pages/LogDetailPage';
export { default as IncidentsPage } from './pages/IncidentsPage';
export { default as IncidentDetailPage } from './pages/IncidentDetailPage';
export { default as SystemHealthPage } from './pages/SystemHealthPage';
export { default as ErrorAnalysisPage } from './pages/ErrorAnalysisPage';
export { default as ErrorDetailPage } from './pages/ErrorDetailPage';
export { default as AuditLogPage } from './pages/AuditLogPage';