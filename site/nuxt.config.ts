// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on the server-side)
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    supabaseUrl: process.env.SUPABASE_URL,        // Also available server-side
    supabaseAnonKey: process.env.SUPABASE_KEY, // Also available server-side
    
    // Public keys (exposed to the client-side)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
    }
  },

  // CSS configuration
  css: [
    '@/assets/css/admin-styles.css'
  ],
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/',
      exclude: ['*']
    }
  },
  nitro: {
    preset: 'netlify'
  },
  pages: true,
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
