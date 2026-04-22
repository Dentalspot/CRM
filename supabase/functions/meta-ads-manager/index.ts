/**
 * @file meta-ads-manager/index.ts
 * @description Edge function proxy for Meta Marketing API.
 * Handles campaigns, ad sets, ads, and insights.
 * All requests are authenticated and proxied server-side to keep the access token secure.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v21.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- Auth: verify the user is admin ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Get Meta credentials ---
    const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID')

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'META_CAPI_ACCESS_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!adAccountId) {
      return new Response(JSON.stringify({ error: 'META_AD_ACCOUNT_ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Parse request body ---
    const body = await req.json()
    const { action, params = {} } = body

    if (!action) {
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Route to action handlers ---
    let result: unknown

    switch (action) {
      // ============================================
      // ACCOUNT INFO
      // ============================================
      case 'get_account': {
        const fields = 'name,account_status,currency,timezone_name,amount_spent,balance,spend_cap,business_name'
        result = await metaGet(`/${adAccountId}?fields=${fields}`, accessToken)
        break
      }

      // ============================================
      // CAMPAIGNS — CRUD
      // ============================================
      case 'list_campaigns': {
        const limit = params.limit || 25
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time'
        const statusFilter = params.status ? `&filtering=[{"field":"status","operator":"IN","value":["${params.status}"]}]` : ''
        result = await metaGet(`/${adAccountId}/campaigns?fields=${fields}&limit=${limit}${statusFilter}`, accessToken)
        break
      }

      case 'get_campaign': {
        if (!params.campaign_id) throw new Error('campaign_id required')
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,bid_strategy,buying_type,special_ad_categories,created_time'
        result = await metaGet(`/${params.campaign_id}?fields=${fields}`, accessToken)
        break
      }

      case 'create_campaign': {
        const campaignData: Record<string, string> = {
          name: params.name,
          objective: params.objective || 'OUTCOME_AWARENESS',
          status: params.status || 'PAUSED',
          special_ad_categories: JSON.stringify(params.special_ad_categories || []),
        }
        if (params.daily_budget) campaignData.daily_budget = String(params.daily_budget)
        if (params.lifetime_budget) campaignData.lifetime_budget = String(params.lifetime_budget)
        if (params.bid_strategy) campaignData.bid_strategy = params.bid_strategy
        result = await metaPost(`/${adAccountId}/campaigns`, campaignData, accessToken)
        break
      }

      case 'update_campaign': {
        if (!params.campaign_id) throw new Error('campaign_id required')
        const updates: Record<string, string> = {}
        if (params.name) updates.name = params.name
        if (params.status) updates.status = params.status
        if (params.daily_budget) updates.daily_budget = String(params.daily_budget)
        if (params.lifetime_budget) updates.lifetime_budget = String(params.lifetime_budget)
        result = await metaPost(`/${params.campaign_id}`, updates, accessToken)
        break
      }

      case 'delete_campaign': {
        if (!params.campaign_id) throw new Error('campaign_id required')
        result = await metaDelete(`/${params.campaign_id}`, accessToken)
        break
      }

      // ============================================
      // AD SETS — CRUD
      // ============================================
      case 'list_adsets': {
        const limit = params.limit || 25
        const fields = 'id,name,status,campaign_id,daily_budget,lifetime_budget,budget_remaining,targeting,optimization_goal,billing_event,bid_amount,start_time,end_time,created_time'
        const campaignFilter = params.campaign_id ? `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${params.campaign_id}"}]` : ''
        result = await metaGet(`/${adAccountId}/adsets?fields=${fields}&limit=${limit}${campaignFilter}`, accessToken)
        break
      }

      case 'create_adset': {
        if (!params.campaign_id) throw new Error('campaign_id required')
        const adsetData: Record<string, string> = {
          name: params.name,
          campaign_id: params.campaign_id,
          status: params.status || 'PAUSED',
          optimization_goal: params.optimization_goal || 'REACH',
          billing_event: params.billing_event || 'IMPRESSIONS',
          targeting: JSON.stringify(params.targeting || { geo_locations: { countries: ['CL'] } }),
        }
        if (params.daily_budget) adsetData.daily_budget = String(params.daily_budget)
        if (params.lifetime_budget) adsetData.lifetime_budget = String(params.lifetime_budget)
        if (params.bid_amount) adsetData.bid_amount = String(params.bid_amount)
        if (params.start_time) adsetData.start_time = params.start_time
        if (params.end_time) adsetData.end_time = params.end_time
        result = await metaPost(`/${adAccountId}/adsets`, adsetData, accessToken)
        break
      }

      case 'update_adset': {
        if (!params.adset_id) throw new Error('adset_id required')
        const updates: Record<string, string> = {}
        if (params.name) updates.name = params.name
        if (params.status) updates.status = params.status
        if (params.daily_budget) updates.daily_budget = String(params.daily_budget)
        if (params.targeting) updates.targeting = JSON.stringify(params.targeting)
        result = await metaPost(`/${params.adset_id}`, updates, accessToken)
        break
      }

      // ============================================
      // ADS — CRUD
      // ============================================
      case 'list_ads': {
        const limit = params.limit || 25
        const fields = 'id,name,status,adset_id,creative,created_time,updated_time'
        const adsetFilter = params.adset_id ? `&filtering=[{"field":"adset.id","operator":"EQUAL","value":"${params.adset_id}"}]` : ''
        result = await metaGet(`/${adAccountId}/ads?fields=${fields}&limit=${limit}${adsetFilter}`, accessToken)
        break
      }

      case 'update_ad': {
        if (!params.ad_id) throw new Error('ad_id required')
        const updates: Record<string, string> = {}
        if (params.name) updates.name = params.name
        if (params.status) updates.status = params.status
        result = await metaPost(`/${params.ad_id}`, updates, accessToken)
        break
      }

      // ============================================
      // INSIGHTS — Read-only analytics
      // ============================================
      case 'account_insights': {
        const datePreset = params.date_preset || 'last_30d'
        const fields = 'impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions,cost_per_action_type'
        result = await metaGet(`/${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}`, accessToken)
        break
      }

      case 'campaign_insights': {
        if (!params.campaign_id) throw new Error('campaign_id required')
        const datePreset = params.date_preset || 'last_30d'
        const fields = 'campaign_name,impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions,cost_per_action_type'
        result = await metaGet(`/${params.campaign_id}/insights?fields=${fields}&date_preset=${datePreset}`, accessToken)
        break
      }

      case 'campaigns_insights_breakdown': {
        const datePreset = params.date_preset || 'last_30d'
        const fields = 'campaign_id,campaign_name,impressions,clicks,spend,cpc,ctr,reach,actions'
        const level = 'campaign'
        result = await metaGet(`/${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}&limit=50`, accessToken)
        break
      }

      // ============================================
      // AUDIENCES
      // ============================================
      case 'list_audiences': {
        const fields = 'id,name,description,data_source,delivery_status,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status'
        result = await metaGet(`/${adAccountId}/customaudiences?fields=${fields}&limit=50`, accessToken)
        break
      }

      case 'create_audience': {
        if (!params.name) throw new Error('name required')
        const audienceData: Record<string, string> = {
          name: params.name,
          subtype: 'CUSTOM',
          description: params.description || `Leads DentalSpot - ${new Date().toISOString().slice(0, 10)}`,
          customer_file_source: 'USER_PROVIDED_ONLY',
        }
        result = await metaPost(`/${adAccountId}/customaudiences`, audienceData, accessToken)
        break
      }

      case 'add_users_to_audience': {
        if (!params.audience_id) throw new Error('audience_id required')
        if (!params.emails || params.emails.length === 0) throw new Error('emails array required')

        // Hash emails with SHA-256 (Meta requirement)
        const hashedEmails: string[] = []
        for (const email of params.emails) {
          if (!email) continue
          const normalized = email.trim().toLowerCase()
          const buffer = new TextEncoder().encode(normalized)
          const hash = await crypto.subtle.digest('SHA-256', buffer)
          const hashed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
          hashedEmails.push(hashed)
        }

        // Also hash phones if provided
        const hashedPhones: string[] = []
        if (params.phones && params.phones.length > 0) {
          for (const phone of params.phones) {
            if (!phone) continue
            const normalized = phone.trim().replace(/\D/g, '')
            const buffer = new TextEncoder().encode(normalized)
            const hash = await crypto.subtle.digest('SHA-256', buffer)
            const hashed = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
            hashedPhones.push(hashed)
          }
        }

        // Build payload
        const schema: string[] = ['EMAIL']
        const data: string[][] = hashedEmails.map(e => [e])

        if (hashedPhones.length > 0) {
          schema.push('PHONE')
          hashedEmails.forEach((_, i) => {
            data[i].push(hashedPhones[i] || '')
          })
        }

        const payload = {
          payload: JSON.stringify({
            schema,
            data,
          }),
        }

        result = await metaPost(`/${params.audience_id}/users`, payload, accessToken)
        break
      }

      case 'remove_audience': {
        if (!params.audience_id) throw new Error('audience_id required')
        result = await metaDelete(`/${params.audience_id}`, accessToken)
        break
      }

      // ============================================
      // FETCH LEADS (uses service role to bypass RLS)
      // ============================================
      case 'fetch_leads': {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const adminClient = createClient(supabaseUrl, serviceRoleKey)

        let allEmails: string[] = []
        let allPhones: string[] = []

        const sourceFilter = params.source || 'all'
        const statusFilter = params.status || 'all'
        const countOnly = params.count_only === true

        const isTherapists = sourceFilter === 'registered_therapists' || sourceFilter === 'all'
        const isLeads = sourceFilter !== 'registered_therapists'

        // 1. Registered therapists
        if (isTherapists) {
          if (countOnly) {
            const { count } = await adminClient
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'therapist')
              .not('email', 'is', null)
            allEmails.push(...Array(count || 0).fill(''))
          } else {
            const { data: therapists } = await adminClient
              .from('profiles')
              .select('email, phone')
              .eq('role', 'therapist')
              .not('email', 'is', null)
              .limit(15000)
            if (therapists) {
              allEmails.push(...therapists.map((t: any) => t.email).filter(Boolean))
              allPhones.push(...therapists.map((t: any) => t.phone).filter(Boolean))
            }
          }
        }

        // 2. Marketing leads
        if (isLeads) {
          let query = adminClient.from('marketing_leads')
          if (countOnly) {
            let countQuery = adminClient
              .from('marketing_leads')
              .select('*', { count: 'exact', head: true })
              .not('email', 'is', null)
            if (sourceFilter !== 'all' && sourceFilter !== 'registered_therapists') {
              countQuery = countQuery.eq('source', sourceFilter)
            }
            if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter)
            const { count } = await countQuery
            // For count, just add to length
            result = { total_count: (allEmails.length || 0) + (count || 0) }
            break
          } else {
            let dataQuery = adminClient
              .from('marketing_leads')
              .select('email, phone')
              .not('email', 'is', null)
              .limit(15000)
            if (sourceFilter !== 'all' && sourceFilter !== 'registered_therapists') {
              dataQuery = dataQuery.eq('source', sourceFilter)
            }
            if (statusFilter !== 'all') dataQuery = dataQuery.eq('status', statusFilter)
            const { data: leads } = await dataQuery
            if (leads) {
              allEmails.push(...leads.map((l: any) => l.email).filter(Boolean))
              allPhones.push(...leads.map((l: any) => l.phone).filter(Boolean))
            }
          }
        }

        if (countOnly) {
          result = { total_count: allEmails.length }
          break
        }

        // Deduplicate
        const uniqueEmails = [...new Set(allEmails.map((e: string) => e.toLowerCase().trim()))]
        const uniquePhones = [...new Set(allPhones.map((p: string) => p.trim()).filter(Boolean))]

        result = {
          emails: uniqueEmails,
          phones: uniquePhones,
          total_emails: uniqueEmails.length,
          total_phones: uniquePhones.length,
        }
        break
      }

      case 'export_leads_csv': {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const adminClient = createClient(supabaseUrl, serviceRoleKey)

        const sourceFilter = params.source || 'all'
        const statusFilter = params.status || 'all'

        let allContacts: Array<{
          email: string; phone: string; full_name: string;
          city: string; region: string; country: string;
          total_spent: number;
        }> = []

        const isTherapists = sourceFilter === 'registered_therapists' || sourceFilter === 'all'
        const isLeads = sourceFilter !== 'registered_therapists'

        // 1. Registered therapists
        if (isTherapists) {
          const { data: therapists } = await adminClient
            .from('profiles')
            .select('email, phone, full_name, city, region, country')
            .eq('role', 'therapist')
            .not('email', 'is', null)
            .limit(15000)
          if (therapists) {
            allContacts.push(...therapists.map((t: any) => ({
              email: t.email || '',
              phone: t.phone || '',
              full_name: t.full_name || '',
              city: t.city || '',
              region: t.region || '',
              country: t.country || 'CL',
              total_spent: 0,
            })))
          }
        }

        // 2. Marketing leads
        if (isLeads) {
          let dataQuery = adminClient
            .from('marketing_leads')
            .select('email, phone, full_name, city, region, country, total_spent')
            .not('email', 'is', null)
            .limit(15000)
          if (sourceFilter !== 'all' && sourceFilter !== 'registered_therapists') {
            dataQuery = dataQuery.eq('source', sourceFilter)
          }
          if (statusFilter !== 'all') dataQuery = dataQuery.eq('status', statusFilter)
          const { data: leads } = await dataQuery
          if (leads) {
            allContacts.push(...leads.map((l: any) => ({
              email: l.email || '',
              phone: l.phone || '',
              full_name: l.full_name || '',
              city: l.city || '',
              region: l.region || '',
              country: l.country || 'CL',
              total_spent: l.total_spent || 0,
            })))
          }
        }

        // Deduplicate by email
        const seen = new Set<string>()
        const unique = allContacts.filter(c => {
          const key = c.email.toLowerCase().trim()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        // Build CSV rows in Meta format
        const header = 'email,phone,fn,ln,ct,st,country,value'
        const rows = unique.map(c => {
          const email = c.email.toLowerCase().trim()
          // Normalize phone: keep digits and +
          let phone = (c.phone || '').replace(/[^\d+]/g, '')
          if (phone && !phone.startsWith('+')) phone = '+56' + phone
          // Split name
          const nameParts = (c.full_name || '').trim().split(/\s+/)
          const fn = nameParts[0] || ''
          const ln = nameParts.slice(1).join(' ') || ''
          const city = (c.city || '').trim()
          const region = (c.region || '').trim()
          const country = (c.country || 'CL').trim().toUpperCase().slice(0, 2)
          const value = c.total_spent || 0

          // Escape CSV fields
          const esc = (v: string) => v.includes(',') ? `"${v}"` : v
          return [esc(email), esc(phone), esc(fn), esc(ln), esc(city), esc(region), esc(country), value].join(',')
        })

        result = {
          csv: header + '\n' + rows.join('\n'),
          total: unique.length,
        }
        break
      }

      case 'create_website_audience': {
        if (!params.name) throw new Error('name required')
        const pixelId = Deno.env.get('META_PIXEL_ID') || '1464610018368997'

        // Build retention rule
        const rule = {
          inclusions: {
            operator: 'or',
            rules: (params.inclusion_rules || [
              {
                event_sources: [{ id: pixelId, type: 'pixel' }],
                retention_seconds: (params.retention_days || 30) * 86400,
                filter: {
                  operator: 'and',
                  filters: [
                    {
                      field: 'url',
                      operator: 'i_contains',
                      value: params.url_contains || '/registro-profesional',
                    },
                  ],
                },
              },
            ]),
          },
          exclusions: {
            operator: 'or',
            rules: (params.exclusion_rules || [
              {
                event_sources: [{ id: pixelId, type: 'pixel' }],
                retention_seconds: (params.retention_days || 30) * 86400,
                filter: {
                  operator: 'and',
                  filters: [
                    {
                      field: 'event',
                      operator: 'eq',
                      value: 'CompleteRegistration',
                    },
                  ],
                },
              },
            ]),
          },
        }

        const audienceData: Record<string, string> = {
          name: params.name,
          subtype: 'WEBSITE',
          description: params.description || `Retargeting DentalSpot — ${new Date().toISOString().slice(0, 10)}`,
          rule: JSON.stringify(rule),
          prefill: '1',
        }
        result = await metaPost(`/${adAccountId}/customaudiences`, audienceData, accessToken)
        break
      }

      // ============================================
      // AD CREATIVES
      // ============================================
      case 'list_creatives': {
        const fields = 'id,name,title,body,image_url,thumbnail_url,status,object_story_spec'
        result = await metaGet(`/${adAccountId}/adcreatives?fields=${fields}&limit=25`, accessToken)
        break
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[meta-ads-manager] Error:', err)
    // Return 200 with success:false so Supabase functions.invoke doesn't swallow the error details
    return new Response(
      JSON.stringify({ success: false, error: err.message, details: (err as any).details || null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================
// META API HELPERS
// ============================================

async function metaGet(path: string, token: string) {
  const separator = path.includes('?') ? '&' : '?'
  const url = `${META_BASE_URL}${path}${separator}access_token=${token}`
  console.log(`[meta-ads] GET ${path.split('?')[0]}`)
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) {
    console.error(`[meta-ads] API error:`, JSON.stringify(data.error))
    const code = data.error.code
    let message = data.error.message || 'Meta API error'
    // Provide user-friendly messages for common errors
    if (code === 190) message = 'Token de acceso expirado o inválido. Genera un nuevo token en Meta Business Suite.'
    if (code === 100) message = `Error de permisos Meta: ${data.error.error_user_msg || data.error.message}`
    if (code === 10) message = 'Permisos insuficientes. Verifica que el token tenga acceso a ads_management.'
    const err = new Error(message)
    ;(err as any).details = data.error
    throw err
  }
  return data
}

async function metaPost(path: string, body: Record<string, string>, token: string) {
  const url = `${META_BASE_URL}${path}`
  const formData = new URLSearchParams({ ...body, access_token: token })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  })
  const data = await res.json()
  if (data.error) {
    const err = new Error(data.error.message || 'Meta API error')
    ;(err as any).details = data.error
    throw err
  }
  return data
}

async function metaDelete(path: string, token: string) {
  const url = `${META_BASE_URL}${path}?access_token=${token}`
  const res = await fetch(url, { method: 'DELETE' })
  const data = await res.json()
  if (data.error) {
    const err = new Error(data.error.message || 'Meta API error')
    ;(err as any).details = data.error
    throw err
  }
  return data
}
