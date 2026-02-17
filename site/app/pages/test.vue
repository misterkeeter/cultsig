<template>
  <div class="container">
    <h1>Database Test</h1>
    
    <div>
      <h2>Config Check:</h2>
      <p>Supabase URL: {{ config.public.supabaseUrl || 'MISSING' }}</p>
      <p>Supabase Key: {{ config.public.supabaseKey ? 'Present' : 'MISSING' }}</p>
      <p>Supabase client exists: {{ $supabase ? 'Yes' : 'No' }}</p>
      <p>Supabase client type: {{ typeof $supabase }}</p>
    </div>
    
    <div v-if="errorMsg">
      <p style="color: red;">Error: {{ errorMsg }}</p>
    </div>
    
    <div v-else-if="venues">
      <h2>Success! Venues:</h2>
      <pre>{{ venues }}</pre>
    </div>
    
    <footer>
      <a href="/">Back to home</a>
    </footer>
  </div>
</template>

<script setup>
const config = useRuntimeConfig()
const { $supabase } = useNuxtApp()

let errorMsg = ref(null)
let venues = ref(null)

onMounted(async () => {
  try {
    console.log('Supabase client:', $supabase)
    console.log('Attempting query...')
    
    const { data, error } = await $supabase
      .from('venues')
      .select('*')
    
    console.log('Query result:', { data, error })
    
    if (error) {
      errorMsg.value = error.message
    } else {
      venues.value = data
    }
  } catch (e) {
    console.error('Caught error:', e)
    errorMsg.value = e.message
  }
})
</script>

<style scoped>
.container {
  padding: 48px 24px;
  max-width: 640px;
}

h1, h2 {
  margin-bottom: 16px;
}

pre {
  background: #f5f5f5;
  padding: 12px;
  overflow-x: auto;
}

footer {
  margin-top: 48px;
}

a {
  color: #c0392b;
  text-decoration: none;
  border-bottom: 1px solid #c0392b;
}
</style>