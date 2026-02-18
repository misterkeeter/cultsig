import { createClient } from '@supabase/supabase-js'

// Get Supabase config - using same pattern as working submissions.js
function getSupabaseClient() {
  try {
    const config = useRuntimeConfig()
    
    // Access both public and private runtime config - same as working API
    const supabaseUrl = config.supabaseUrl || config.public.supabaseUrl
    const supabaseKey = config.supabaseKey || config.public.supabaseKey
    
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
  console.log('=== Get Single Submission API Called ===')
  
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

  // GET request - fetch single submission
  if (event.node.req.method === 'GET') {
    try {
      const submissionId = getRouterParam(event, 'id')
      
      if (!submissionId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Submission ID is required'
        })
      }

      const supabase = getSupabaseClient()
      console.log('Fetching submission:', submissionId)
      
      // Fetch single submission with venue information
      const { data: submission, error } = await supabase
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

      if (error) {
        console.error('Supabase query error:', error)
        throw createError({
          statusCode: 404,
          statusMessage: 'Submission not found'
        })
      }

      // Transform the data to flatten venue information
      const transformedSubmission = {
        ...submission,
        venue_name: submission.venues?.name || null,
        venue_address: submission.venues?.address || null,
        venue_neighborhood: submission.venues?.neighborhood || null
      }

      console.log('Successfully fetched submission:', submissionId)
      return {
        success: true,
        submission: transformedSubmission
      }

    } catch (error) {
      console.error('Error fetching submission:', error)
      if (error.statusCode) {
        throw error
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch submission: ' + error.message
      })
    }
  }

  // PUT request - update submission
  if (event.node.req.method === 'PUT') {
    try {
      const submissionId = getRouterParam(event, 'id')
      const body = await readBody(event)
      
      if (!submissionId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Submission ID is required'
        })
      }

      const supabase = getSupabaseClient()
      console.log('Updating submission:', submissionId, body)
      
      // Update submission
      const { data: updatedSubmission, error } = await supabase
        .from('submissions')
        .update({
          title: body.title,
          description: body.description,
          event_date: body.event_date,
          event_time: body.event_time,
          end_time: body.end_time,
          venue_id: body.venue_id || null,
          category: body.category,
          subcategory: body.subcategory,
          admission_fee: body.admission_fee,
          is_paid_listing: body.is_paid_listing || false,
          event_url: body.event_url,
          submitted_by_email: body.submitted_by_email
        })
        .eq('id', submissionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating submission:', error)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update submission'
        })
      }

      console.log('Successfully updated submission:', submissionId)
      return {
        success: true,
        submission: updatedSubmission
      }

    } catch (error) {
      console.error('Error updating submission:', error)
      if (error.statusCode) {
        throw error
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update submission: ' + error.message
      })
    }
  }

  // Method not allowed
  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})