import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    // Debug: test Meta API audiences listing
    const url = new URL(req.url)
    if (url.searchParams.get('test_audiences') === '1') {
      const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')
      const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID')
      const metaUrl = `https://graph.facebook.com/v21.0/${adAccountId}/customaudiences?fields=id,name,description,subtype,delivery_status&limit=50&access_token=${accessToken}`
      console.log(`[debug] Fetching audiences from: ${adAccountId}`)
      const res = await fetch(metaUrl)
      const data = await res.json()

      // Check pages linked to ad account
      const promotePages = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}/promote_pages?access_token=${accessToken}`)
      const promotePagesData = await promotePages.json()

      const meAccounts = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,fan_count&access_token=${accessToken}`)
      const meAccountsData = await meAccounts.json()

      // Also try to search for pages
      const pageSearch = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}?fields=business&access_token=${accessToken}`)
      const pageSearchData = await pageSearch.json()

      // Try getting pages from business
      const businessId = pageSearchData?.business?.id
      let businessPages = null
      if (businessId) {
        const bpResp = await fetch(`https://graph.facebook.com/v21.0/${businessId}/owned_pages?fields=id,name,fan_count&access_token=${accessToken}`)
        businessPages = await bpResp.json()
      }

      return new Response(JSON.stringify({
        ad_account: adAccountId,
        business_id: businessId,
        promote_pages: promotePagesData,
        me_accounts: meAccountsData,
        business_pages: businessPages,
        meta_response: data,
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get therapists
    const { data: therapists } = await supabase
      .from('profiles')
      .select('email, phone, full_name')
      .eq('role', 'therapist')
      .not('email', 'is', null)
      .limit(15000)

    // 2. Get all marketing leads (paginated — Supabase default limit is 1000)
    let allLeads: any[] = []
    let page = 0
    const pageSize = 1000
    while (true) {
      const from = page * pageSize
      const to = from + pageSize - 1
      const { data: batch, error: batchErr } = await supabase
        .from('marketing_leads')
        .select('email, phone, full_name, city, region, country, total_spent')
        .not('email', 'is', null)
        .order('created_at', { ascending: true })
        .range(from, to)

      if (batchErr) {
        console.error(`[export-leads-csv] Batch ${page} error:`, batchErr)
        break
      }
      if (!batch || batch.length === 0) break
      allLeads.push(...batch)
      console.log(`[export-leads-csv] Page ${page}: ${batch.length} records (total so far: ${allLeads.length})`)
      if (batch.length < pageSize) break
      page++
    }
    const leads = allLeads
    console.log(`[export-leads-csv] Total leads fetched: ${leads.length} in ${page + 1} pages`)

    // Combine all contacts
    const allContacts: Array<any> = []

    if (therapists) {
      allContacts.push(...therapists.map((t: any) => ({
        email: t.email || '',
        phone: t.phone || '',
        full_name: t.full_name || '',
        city: '',
        region: '',
        country: 'CL',
        total_spent: 0,
      })))
    }

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

    // Deduplicate by email
    const seen = new Set<string>()
    const unique = allContacts.filter(c => {
      const key = c.email.toLowerCase().trim()
      if (!key) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Also get total count
    const { count: totalLeadsCount } = await supabase
      .from('marketing_leads')
      .select('*', { count: 'exact', head: true })

    const { count: leadsWithEmailCount } = await supabase
      .from('marketing_leads')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)

    console.log(`[export-leads-csv] Therapists: ${therapists?.length || 0}, Leads with email: ${leads?.length || 0}, Total leads in table: ${totalLeadsCount}, Leads with email (count): ${leadsWithEmailCount}`)

    // Build CSV
    const header = 'email,phone,fn,ln,ct,st,country,value'
    const rows = unique.map(c => {
      const email = c.email.toLowerCase().trim()
      let phone = (c.phone || '').replace(/[^\d+]/g, '')
      if (phone && !phone.startsWith('+')) phone = '+56' + phone
      const nameParts = (c.full_name || '').trim().split(/\s+/)
      const fn = nameParts[0] || ''
      const ln = nameParts.slice(1).join(' ') || ''
      const city = (c.city || '').trim()
      const region = (c.region || '').trim()
      const country = (c.country || 'CL').trim().toUpperCase().slice(0, 2)
      const value = c.total_spent || 0
      const esc = (v: string) => v.includes(',') ? `"${v}"` : v
      return [esc(email), esc(phone), esc(fn), esc(ln), esc(city), esc(region), esc(country), value].join(',')
    })

    const csv = header + '\n' + rows.join('\n')

    // Check if debug mode
    const url = new URL(req.url)
    if (url.searchParams.get('debug') === '1') {
      return new Response(JSON.stringify({
        therapists_count: therapists?.length || 0,
        leads_raw_count: leads?.length || 0,
        total_leads_in_table: totalLeadsCount,
        leads_with_email_count: leadsWithEmailCount,
        all_contacts_before_dedup: allContacts.length,
        unique_after_dedup: unique.length,
        csv_rows: rows.length,
        pages_fetched: page + 1,
        sample_leads: leads?.slice(0, 3),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fonokit_leads_meta_${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
