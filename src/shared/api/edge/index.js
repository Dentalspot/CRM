/**
 * @file index.js
 * @description Central export point for all Edge API client wrappers.
 * Import from here to access all Edge Function capabilities.
 * 
 * Usage:
 * import { adminPermissions, billingApi } from '@/shared/api/edge';
 */

export * from './adminPermissions.edge';
export * from './billing.edge';
export * from './marketplace.edge';
export * from './clinicalHistory.edge';
export * from './support.edge';