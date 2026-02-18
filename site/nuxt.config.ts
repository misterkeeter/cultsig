// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/',
      exclude: ['/', '/test']
    }
  },
  pages: true,
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
