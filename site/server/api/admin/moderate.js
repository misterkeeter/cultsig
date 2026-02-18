import { createClient } from '@supabase/supabase-js'

// Get Supabase config from runtime config
function getSupabaseClient() {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
  const supabaseAnonKey = config.public.supabaseAnonKey || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please check your environment variables.')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Simple auth check function
function isAuthenticated(event) {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token && token.length > 0
}

function getAdminEmailFromToken(token) {
  // In production, decode JWT token to get email
  // For now, return hardcoded admin email
  return process.env.ADMIN_EMAIL || 'admin@cultsig.org'
}

export default defineEventHandler(async (event) => {
  // Handle CORS preflight
  if (event.node.req.method === 'OPTIONS') {
    return ''
  }

  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // Check authentication
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!isAuthenticated(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { submissionId, action, rejectionReason } = body

  if (!submissionId || !action) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  const adminEmail = getAdminEmailFromToken(token)

  try {
    const supabase = getSupabaseClient()
    
    if (action === 'approve') {
      // First, get the submission data WITH venue information
      const { data: submission, error: fetchError } = await supabase
        .from('submissions')
        .select(`
          *,
          venues (
            name,
            address,
            neighborhood
          )
        `)
        .eq('id', submissionId)
        .single()

      if (fetchError || !submission) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Submission not found'
        })
      }

      console.log('Submission with venue data:', JSON.stringify(submission, null, 2))

      // Create event from submission - using actual database field names
      const eventData = {
        title: submission.title,
        description: submission.description,
        event_date: submission.event_date,
        event_time: submission.event_time,           // Using event_time (not start_time)
        end_time: submission.end_time,
        venue_id: submission.venue_id,
        category: submission.category,
        subcategory: submission.subcategory,
        admission_fee: submission.admission_fee,
        is_paid_listing: submission.is_paid_listing || false,
        event_url: submission.event_url,             // Using event_url
        submitted_by_email: submission.submitted_by_email, // Using submitted_by_email
        created_at: new Date().toISOString()
      }

      console.log('Event data to insert:', JSON.stringify(eventData, null, 2))

      // Insert into events table
      const { error: insertError } = await supabase
        .from('events')
        .insert([eventData])

      if (insertError) {
        console.error('Error inserting event:', insertError)
        throw insertError
      }

      // Update submission status
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by_email: adminEmail
        })
        .eq('id', submissionId)

      if (updateError) {
        throw updateError
      }

      return { success: true, message: 'Submission approved and event created' }

    } else if (action === 'reject') {
      // Update submission status to rejected
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by_email: adminEmail
        })
        .eq('id', submissionId)

      if (updateError) {
        throw updateError
      }

      return { success: true, message: 'Submission rejected' }

    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action'
      })
    }

  } catch (error) {
    console.error('Moderation error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process moderation action'
    })
  }
})