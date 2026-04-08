/**
 * @file index.js
 * @description Entry point for the Billing module. Exports all pages, components, hooks, and API.
 */

// API
export { billingApi } from './api/billingApi';

// Hooks
export { useSubscriptions } from './hooks/useSubscriptions';
export { usePayments } from './hooks/usePayments';
export { usePlans } from './hooks/usePlans';
export { useCoupons } from './hooks/useCoupons';
export { useCommissions } from './hooks/useCommissions';
export { useInvoices } from './hooks/useInvoices';
export { useBillingMetrics } from './hooks/useBillingMetrics';

// Shared Components
export { default as SubscriptionsTable } from './components/SubscriptionsTable';
export { default as SubscriptionStatusCard } from './components/SubscriptionStatusCard';
export { default as PaymentsTable } from './components/PaymentsTable';
export { default as PaymentStatusBadge } from './components/PaymentStatusBadge';
export { default as TransactionDetailsCard } from './components/TransactionDetailsCard';
export { default as FailedPaymentAlert } from './components/FailedPaymentAlert';
export { default as RefundModal } from './components/RefundModal';
export { default as PlansTable } from './components/PlansTable';
export { default as PlanCard } from './components/PlanCard';
export { default as CouponsTable } from './components/CouponsTable';
export { default as CouponForm } from './components/CouponForm';
export { default as CouponRulesPanel } from './components/CouponRulesPanel';
export { default as CommissionsTable } from './components/CommissionsTable';
export { default as CommissionCard } from './components/CommissionCard';
export { default as InvoicesTable } from './components/InvoicesTable';
export { default as BillingChart } from './components/BillingChart';
export { default as BillingFilters } from './components/BillingFilters';
export { default as BillingMetricsCard } from './components/BillingMetricsCard';

// Pages
export { default as BillingDashboardPage } from './pages/BillingDashboardPage';
export { default as SubscriptionsPage } from './pages/SubscriptionsPage';
export { default as SubscriptionDetailPage } from './pages/SubscriptionDetailPage';
export { default as PaymentsPage } from './pages/PaymentsPage';
export { default as PaymentDetailPage } from './pages/PaymentDetailPage';
export { default as FailedPaymentsPage } from './pages/FailedPaymentsPage';
export { default as RefundsPage } from './pages/RefundsPage';
export { default as PlansPage } from './pages/PlansPage';
export { default as PlanDetailPage } from './pages/PlanDetailPage';
export { default as CouponsPage } from './pages/CouponsPage';
export { default as CouponDetailPage } from './pages/CouponDetailPage';
export { default as CommissionsPage } from './pages/CommissionsPage';
export { default as CommissionDetailPage } from './pages/CommissionDetailPage';
export { default as InvoicesPage } from './pages/InvoicesPage';
export { default as BillingReportsPage } from './pages/BillingReportsPage';