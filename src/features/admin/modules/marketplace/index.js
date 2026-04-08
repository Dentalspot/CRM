/**
 * @file index.js
 * @description Central export for Marketplace module.
 */

export * from './api/marketplaceApi';
export * from './hooks/useSales';
export * from './hooks/useCommissions';
// ... export other hooks as needed

export { default as MarketplaceDashboardPage } from './pages/MarketplaceDashboardPage';
export { default as SalesPage } from './pages/SalesPage';
export { default as SaleDetailPage } from './pages/SaleDetailPage';
export { default as CommissionsPage } from './pages/CommissionsPage';
export { default as CommissionDetailPage } from './pages/CommissionDetailPage';
export { default as WithdrawalsPage } from './pages/WithdrawalsPage';
export { default as WithdrawalDetailPage } from './pages/WithdrawalDetailPage';
export { default as ProductsPage } from './pages/ProductsPage';
export { default as ProductDetailPage } from './pages/ProductDetailPage';
export { default as CouponsPage } from './pages/CouponsPage';
export { default as CouponDetailPage } from './pages/CouponDetailPage';
export { default as MarketplaceMetricsPage } from './pages/MarketplaceMetricsPage';
export { default as VendorPerformancePage } from './pages/VendorPerformancePage';