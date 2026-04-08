/**
 * @file setup-campaigns/index.ts
 * @description One-time setup: creates 3 campaigns + ad sets for Fonokit growth strategy.
 * All created in PAUSED status for review before activation.
 * Uses Campaign Budget Optimization (CBO) — budget set at campaign level.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')!
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID')!

    const results: any = { campaigns: [], adsets: [] }

    // ============================================
    // AUDIENCE IDs
    // ============================================
    const AUD = {
      leads_abril: '120245375516700064',
      seguidores_fb: '120245376289520064',
      lookalike_registro: '120244791397660064',
      lookalike_seguidores: '120245345191350064',
      registro_web: '120244791255460064',
      visit_web: '120244791246600064',
      facebook_engagement: '120244791168880064',
    }

    // Helper: create targeting JSON
    const targeting = (audiences: string[], excludeAudiences: string[] = []) => JSON.stringify({
      geo_locations: { countries: ['CL'] },
      age_min: 23,
      age_max: 50,
      custom_audiences: audiences.map(id => ({ id })),
      ...(excludeAudiences.length > 0 ? { excluded_custom_audiences: excludeAudiences.map(id => ({ id })) } : {}),
      targeting_automation: { advantage_audience: 0 },
    })

    // First, clean up any campaigns created by previous failed attempts
    const existingCampaigns = await metaGet(`/${adAccountId}/campaigns?fields=id,name&filtering=[{"field":"name","operator":"CONTAIN","value":"TOFU"}]`, accessToken)
    for (const c of (existingCampaigns?.data || [])) {
      console.log(`[setup] Deleting leftover campaign: ${c.name} (${c.id})`)
      try { await metaDelete(`/${c.id}`, accessToken) } catch {}
    }
    const existingMofu = await metaGet(`/${adAccountId}/campaigns?fields=id,name&filtering=[{"field":"name","operator":"CONTAIN","value":"MOFU"}]`, accessToken)
    for (const c of (existingMofu?.data || [])) {
      try { await metaDelete(`/${c.id}`, accessToken) } catch {}
    }
    const existingBofu = await metaGet(`/${adAccountId}/campaigns?fields=id,name&filtering=[{"field":"name","operator":"CONTAIN","value":"BOFU"}]`, accessToken)
    for (const c of (existingBofu?.data || [])) {
      try { await metaDelete(`/${c.id}`, accessToken) } catch {}
    }

    // ============================================
    // CAMPAIGN 1: TOFU — Awareness
    // CBO: $7,000 CLP/day (~$7.8 USD) — 40% of budget
    // ============================================
    const tofu = await metaPost(`/${adAccountId}/campaigns`, {
      name: 'TOFU — Awareness — Fonokit para Fonoaudiologos',
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      special_ad_categories: '[]',
      daily_budget: '700000',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    }, accessToken)
    results.campaigns.push({ name: 'TOFU', id: tofu.id })

    const PAGE_ID = '529163383830922'

    // Ad Set 1: Lookalike from registered users
    const tofuAs1 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'TOFU — Lookalike Registro 1%',
      campaign_id: tofu.id,
      status: 'PAUSED',
      optimization_goal: 'REACH',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.lookalike_registro], [AUD.leads_abril, AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'TOFU-Lookalike-Registro', id: tofuAs1.id })

    // Ad Set 2: Lookalike from FB followers
    const tofuAs2 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'TOFU — Lookalike Seguidores FB 1%',
      campaign_id: tofu.id,
      status: 'PAUSED',
      optimization_goal: 'REACH',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.lookalike_seguidores], [AUD.leads_abril, AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'TOFU-Lookalike-Seguidores', id: tofuAs2.id })

    // ============================================
    // CAMPAIGN 2: MOFU — Consideration
    // CBO: $6,000 CLP/day (~$6.7 USD) — 35% of budget
    // ============================================
    const mofu = await metaPost(`/${adAccountId}/campaigns`, {
      name: 'MOFU — Consideracion — Retargeting Engaged',
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: '[]',
      daily_budget: '600000',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    }, accessToken)
    results.campaigns.push({ name: 'MOFU', id: mofu.id })

    // Ad Set 1: FB page engagers + followers
    const mofuAs1 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'MOFU — Engagers FB + Seguidores',
      campaign_id: mofu.id,
      status: 'PAUSED',
      optimization_goal: 'LANDING_PAGE_VIEWS',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.seguidores_fb, AUD.facebook_engagement], [AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'MOFU-Engagers-FB', id: mofuAs1.id })

    // Ad Set 2: Website visitors who didn't register
    const mofuAs2 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'MOFU — Visitantes Web (no registrados)',
      campaign_id: mofu.id,
      status: 'PAUSED',
      optimization_goal: 'LANDING_PAGE_VIEWS',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.visit_web], [AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'MOFU-Visitantes-Web', id: mofuAs2.id })

    // ============================================
    // CAMPAIGN 3: BOFU — Conversion
    // CBO: $4,500 CLP/day (~$5 USD) — 25% of budget
    // ============================================
    const bofu = await metaPost(`/${adAccountId}/campaigns`, {
      name: 'BOFU — Conversion — Registro Fonokit',
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: '[]',
      daily_budget: '450000',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    }, accessToken)
    results.campaigns.push({ name: 'BOFU', id: bofu.id })

    // Ad Set 1: Leads from Supersalud (not yet registered)
    const bofuAs1 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'BOFU — Leads Supersalud (no registrados)',
      campaign_id: bofu.id,
      status: 'PAUSED',
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.leads_abril], [AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'BOFU-Leads-Supersalud', id: bofuAs1.id })

    // Ad Set 2: Retargeting landing visitors who didn't register
    const bofuAs2 = await metaPost(`/${adAccountId}/adsets`, {
      name: 'BOFU — Retargeting Landing (no registrados)',
      campaign_id: bofu.id,
      status: 'PAUSED',
      optimization_goal: 'LEAD_GENERATION',
      billing_event: 'IMPRESSIONS',
      promoted_object: JSON.stringify({ page_id: PAGE_ID }),
      targeting: targeting([AUD.registro_web]),
    }, accessToken)
    results.adsets.push({ name: 'BOFU-Retargeting-Landing', id: bofuAs2.id })

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: (err as Error).message,
      details: (err as any).details || null,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function metaGet(path: string, token: string) {
  const separator = path.includes('?') ? '&' : '?'
  const url = `${META_BASE_URL}${path}${separator}access_token=${token}`
  const res = await fetch(url)
  return await res.json()
}

async function metaDelete(path: string, token: string) {
  const url = `${META_BASE_URL}${path}?access_token=${token}`
  const res = await fetch(url, { method: 'DELETE' })
  return await res.json()
}

async function metaPost(path: string, body: Record<string, string>, token: string) {
  const url = `${META_BASE_URL}${path}`
  const formData = new URLSearchParams({ ...body, access_token: token })
  console.log(`[setup] POST ${path}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  const data = await res.json()
  if (data.error) {
    console.error(`[setup] Error:`, JSON.stringify(data.error))
    const err = new Error(data.error.error_user_msg || data.error.message || 'Meta API error')
    ;(err as any).details = data.error
    throw err
  }
  console.log(`[setup] Success:`, JSON.stringify(data))
  return data
}
