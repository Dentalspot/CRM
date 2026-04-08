import { corsHeaders, jsonResponse, errorResponse, createServiceClient } from '../_shared/supabase-client.ts'

/**
 * Automated database backup — exports critical tables as JSON to Supabase Storage.
 *
 * Stores backups in: backups/{YYYY-MM-DD_HH-mm}/table_name.json
 * Keeps last 30 days of backups (auto-cleanup of older ones).
 *
 * Security: requires service_role key (not exposed to frontend).
 * Trigger: via cron job, admin dashboard, or manual invocation.
 */

const CRITICAL_TABLES = [
  'profiles',
  'patients',
  'appointments',
  'therapist_details',
  'therapist_subscriptions',
  'therapist_branding',
  'therapist_education',
  'therapist_experience',
  'therapist_services',
  'therapist_specialties',
  'therapist_availabilities',
  'therapist_conditions',
  'therapist_specialty_badges',
  'clinics',
  'clinical_history_entries',
  'patient_document_templates',
  'treatment_plans',
  'plan_objectives',
  'marketplace_items',
  'marketplace_plans',
  'marketplace_purchases',
  'marketplace_orders',
  'wallets',
  'wallet_transactions',
  'discount_coupons',
  'therapist_materials',
  'referrals',
  'patient_questions',
]

const BUCKET = 'backups'
const MAX_BACKUP_AGE_DAYS = 30

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth: verify caller is super_admin via JWT or has backup secret
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')

    const supabaseAuth = createServiceClient()
    const { data: { user } } = await supabaseAuth.auth.getUser(token)

    if (user) {
      const { data: profile } = await supabaseAuth
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_super_admin) {
        return errorResponse('Solo administradores pueden ejecutar backups', 403)
      }
    } else {
      // No valid user token — allow only if service_role key is used
      // Service client will work regardless since we use createServiceClient()
      // but we need to verify the caller has authority
      const backupSecret = Deno.env.get('BACKUP_SECRET')
      const providedSecret = req.headers.get('x-backup-secret')
      if (!backupSecret || providedSecret !== backupSecret) {
        return errorResponse('No autorizado', 401)
      }
    }

    const supabase = createServiceClient()

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: false })
      console.log(`[Backup] Created bucket: ${BUCKET}`)
    }

    // Generate timestamp folder
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16)
    const folder = `${timestamp}`

    console.log(`[Backup] Starting backup: ${folder}`)

    const results: { table: string; rows: number; status: string }[] = []

    // Export each table
    for (const table of CRITICAL_TABLES) {
      try {
        // Fetch all rows (paginated for large tables)
        let allRows: unknown[] = []
        let offset = 0
        const pageSize = 1000

        while (true) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(offset, offset + pageSize - 1)

          if (error) {
            // Table might not exist, skip gracefully
            console.warn(`[Backup] Skipping ${table}: ${error.message}`)
            results.push({ table, rows: 0, status: 'skipped' })
            break
          }

          if (!data || data.length === 0) {
            if (offset === 0) {
              // Empty table, still save empty array
              allRows = []
            }
            break
          }

          allRows = [...allRows, ...data]
          offset += pageSize

          if (data.length < pageSize) break
        }

        // Upload as JSON
        const jsonContent = JSON.stringify(allRows, null, 2)
        const filePath = `${folder}/${table}.json`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, new Blob([jsonContent], { type: 'application/json' }), {
            contentType: 'application/json',
            upsert: true,
          })

        if (uploadError) {
          console.error(`[Backup] Upload error for ${table}:`, uploadError)
          results.push({ table, rows: allRows.length, status: 'upload_error' })
        } else {
          results.push({ table, rows: allRows.length, status: 'ok' })
        }

      } catch (tableError) {
        console.error(`[Backup] Error exporting ${table}:`, tableError)
        results.push({ table, rows: 0, status: 'error' })
      }
    }

    // Cleanup old backups (older than MAX_BACKUP_AGE_DAYS)
    let deletedCount = 0
    try {
      const cutoffDate = new Date(now.getTime() - MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000)
      const { data: folders } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })

      if (folders) {
        for (const folder of folders) {
          // Parse date from folder name (format: YYYY-MM-DDTHH-mm)
          const folderDate = new Date(folder.name.replace('T', 'T').replace(/-(\d{2})$/, ':$1'))
          if (!isNaN(folderDate.getTime()) && folderDate < cutoffDate) {
            // List and delete all files in old folder
            const { data: files } = await supabase.storage.from(BUCKET).list(folder.name)
            if (files && files.length > 0) {
              const paths = files.map(f => `${folder.name}/${f.name}`)
              await supabase.storage.from(BUCKET).remove(paths)
              deletedCount++
            }
          }
        }
      }
    } catch (cleanupError) {
      console.warn('[Backup] Cleanup error:', cleanupError)
    }

    const totalRows = results.reduce((sum, r) => sum + r.rows, 0)
    const successCount = results.filter(r => r.status === 'ok').length

    console.log(`[Backup] Complete: ${successCount}/${CRITICAL_TABLES.length} tables, ${totalRows} total rows, ${deletedCount} old backups cleaned`)

    return jsonResponse({
      success: true,
      timestamp: folder,
      tables_exported: successCount,
      tables_total: CRITICAL_TABLES.length,
      total_rows: totalRows,
      old_backups_deleted: deletedCount,
      details: results,
    })

  } catch (error) {
    console.error('[Backup] Fatal error:', error)
    return errorResponse(error.message || 'Error al realizar backup', 500)
  }
})
