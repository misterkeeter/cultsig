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
  console.log('=== Venues API Called ===')
  
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

  const supabase = getSupabaseClient()

  // GET request - fetch all venues
  if (event.node.req.method === 'GET') {
    try {
      console.log('Fetching all venues')
      
      const { data: venues, error } = await supabase
        .from('venues')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching venues:', error)
        throw error
      }

      console.log(`Successfully fetched ${venues?.length || 0} venues`)
      return {
        success: true,
        venues: venues || []
      }

    } catch (error) {
      console.error('Error in venues API (GET):', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch venues: ' + error.message
      })
    }
  }

  // POST request - create new venue
  if (event.node.req.method === 'POST') {
    try {
      const body = await readBody(event)
      console.log('Creating new venue:', body)
      
      if (!body.name || !body.address) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Venue name and address are required'
        })
      }

      const { data: newVenue, error } = await supabase
        .from('venues')
        .insert([{
          name: body.name,
          address: body.address,
          neighborhood: body.neighborhood || null,
          website: body.website || null
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating venue:', error)
        throw error
      }

      console.log('Successfully created venue:', newVenue.id)
      return {
        success: true,
        venue: newVenue
      }

    } catch (error) {
      console.error('Error in venues API (POST):', error)
      if (error.statusCode) {
        throw error
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create venue: ' + error.message
      })
    }
  }

  // Method not allowed
  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})