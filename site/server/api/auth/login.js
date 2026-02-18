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

  const body = await readBody(event)
  const { email, password } = body

  // Simple admin authentication
  // In production, you'd want to:
  // 1. Use proper password hashing
  // 2. Store admin credentials in database or env vars
  // 3. Use JWT tokens with expiration
  // 4. Add rate limiting
  
  const config = useRuntimeConfig()
  const ADMIN_EMAIL = config.adminEmail || process.env.ADMIN_EMAIL || 'admin@cultsig.org'
  const ADMIN_PASSWORD = config.adminPassword || process.env.ADMIN_PASSWORD || 'cultsig2024'

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Generate a simple session token (in production, use JWT)
    const sessionToken = btoa(`${email}:${Date.now()}`)
    
    return {
      success: true,
      token: sessionToken,
      email: email
    }
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }
})