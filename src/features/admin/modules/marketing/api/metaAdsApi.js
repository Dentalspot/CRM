/**
 * @file metaAdsApi.js
 * @description Frontend API layer for Meta Ads Management.
 * All calls go through the meta-ads-manager edge function (server-side proxy).
 */
import { supabase } from '@/lib/supabaseClient';

const AD_ACCOUNT_ID = import.meta.env.VITE_META_AD_ACCOUNT_ID || '';

/**
 * Generic caller for the meta-ads-manager edge function.
 */
async function callMetaAds(action, params = {}) {
  const { data, error } = await supabase.functions.invoke('meta-ads-manager', {
    body: { action, params },
  });

  if (error) {
    // Try to extract detailed error from response
    const detail = typeof error === 'object' ? (error.context?.body || error.message) : error;
    console.error(`[MetaAds] ${action} error:`, error);
    throw new Error(typeof detail === 'string' ? detail : (error.message || 'Edge function error'));
  }
  if (!data?.success) {
    const msg = data?.error || data?.details?.message || 'Error desconocido de Meta';
    console.error(`[MetaAds] ${action} failed:`, data);
    throw new Error(msg);
  }
  return data.data;
}

export const metaAdsApi = {
  // ============ ACCOUNT ============
  getAccount: () => callMetaAds('get_account'),

  // ============ CAMPAIGNS ============
  listCampaigns: (params = {}) => callMetaAds('list_campaigns', params),
  getCampaign: (campaignId) => callMetaAds('get_campaign', { campaign_id: campaignId }),
  createCampaign: (params) => callMetaAds('create_campaign', params),
  updateCampaign: (campaignId, updates) => callMetaAds('update_campaign', { campaign_id: campaignId, ...updates }),
  deleteCampaign: (campaignId) => callMetaAds('delete_campaign', { campaign_id: campaignId }),

  // ============ AD SETS ============
  listAdSets: (params = {}) => callMetaAds('list_adsets', params),
  createAdSet: (params) => callMetaAds('create_adset', params),
  updateAdSet: (adsetId, updates) => callMetaAds('update_adset', { adset_id: adsetId, ...updates }),

  // ============ ADS ============
  listAds: (params = {}) => callMetaAds('list_ads', params),
  updateAd: (adId, updates) => callMetaAds('update_ad', { ad_id: adId, ...updates }),

  // ============ INSIGHTS ============
  accountInsights: (datePreset = 'last_30d') => callMetaAds('account_insights', { date_preset: datePreset }),
  campaignInsights: (campaignId, datePreset = 'last_30d') => callMetaAds('campaign_insights', { campaign_id: campaignId, date_preset: datePreset }),
  campaignsBreakdown: (datePreset = 'last_30d') => callMetaAds('campaigns_insights_breakdown', { date_preset: datePreset }),

  // ============ AUDIENCES ============
  listAudiences: () => callMetaAds('list_audiences'),
  createAudience: (name, description) => callMetaAds('create_audience', { name, description }),
  addUsersToAudience: (audienceId, emails, phones = []) => callMetaAds('add_users_to_audience', { audience_id: audienceId, emails, phones }),
  removeAudience: (audienceId) => callMetaAds('remove_audience', { audience_id: audienceId }),
  createWebsiteAudience: (params) => callMetaAds('create_website_audience', params),

  // ============ CREATIVES ============
  listCreatives: () => callMetaAds('list_creatives'),

  // ============ LEADS (server-side, bypasses RLS) ============
  fetchLeads: (params = {}) => callMetaAds('fetch_leads', params),
  exportLeadsCsv: (params = {}) => callMetaAds('export_leads_csv', params),

  // ============ HELPERS ============
  getAdAccountId: () => AD_ACCOUNT_ID,
};
