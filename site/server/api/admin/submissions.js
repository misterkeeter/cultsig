import { createClient } from '@supabase/supabase-js'

// Get Supabase config - FIXED to use SUPABASE_KEY instead of SUPABASE_ANON_KEY
function getSupabaseClient() {
  try {
    const config = useRuntimeConfig()
    
    // Access both public and private runtime config - using your actual variable name
    const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl
    const supabaseKey = config.supabaseKey || config.public.supabaseKey
    
    console.log('Debug: Checking Supabase config...')
    console.log('Debug: URL exists:', !!supabaseUrl)
    console.log('Debug: Key exists:', !!supabaseKey)
    console.log('Debug: URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined')
    
    // Also check process.env directly with your actual variable name
    console.log('Direct process.env.SUPABASE_URL:', !!process.env.SUPABASE_URL)
    console.log('Direct process.env.SUPABASE_KEY:', !!process.env.SUPABASE_KEY)
    
    // Use fallback to process.env if runtime config fails
    const finalUrl = supabaseUrl || process.env.SUPABASE_URL
    const finalKey = supabaseKey || process.env.SUPABASE_KEY
    
    console.log('Final URL exists:', !!finalUrl)
    console.log('Final Key exists:', !!finalKey)
    console.log('Final Key starts with eyJ:', finalKey?.startsWith('eyJ'))
    
    if (!finalUrl || !finalKey) {
      throw new Error(`Missing Supabase configuration. URL: ${!!finalUrl}, Key: ${!!finalKey}`)
    }
    
    return createClient(finalUrl, finalKey)
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}

// Simple auth check function
function isAuthenticated(event) {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token && token.length > 0
}

export default defineEventHandler(async (event) => {
  console.log('=== Submissions API Called ===')
  
  // Handle CORS preflight
  if (event.node.req.method === 'OPTIONS') {
    return ''
  }

  // Check authentication
  if (!isAuthenticated(event)) {
    console.log('Authentication failed - no valid token')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  console.log('Authentication passed')

  try {
    const supabase = getSupabaseClient()
    console.log('Supabase client created successfully')
    
    // Fetch submissions WITH venue information joined - using correct schema
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        venues (
          name,
          address,
          neighborhood
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    console.log(`Successfully fetched ${submissions?.length || 0} submissions`)
    
    // Transform the data to flatten venue information for easier display
    // Map actual database field names to what the admin interface expects
    const transformedSubmissions = submissions?.map(submission => ({
      ...submission,
      // Map database fields to what the admin UI expects
      venue_name: submission.venues?.name || null,
      venue_address: submission.venues?.address || null,
      venue_neighborhood: submission.venues?.neighborhood || null,
      start_time: submission.event_time,  // Map event_time to start_time for display
      submitter_email: submission.submitted_by_email,  // Map submitted_by_email
      website_url: submission.event_url   // Map event_url to website_url for display
    })) || []
    
    // Log first submission to see the data structure
    if (transformedSubmissions.length > 0) {
      console.log('First transformed submission:', JSON.stringify(transformedSubmissions[0], null, 2))
    }

    return {
      success: true,
      submissions: transformedSubmissions
    }
  } catch (error) {
    console.error('Error in submissions API:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch submissions: ' + error.message
    })
  }
})