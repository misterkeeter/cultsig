<template>
  <div class="container">
    <h1>Database Test</h1>
    
    <div v-if="error">
      <p style="color: red;">Error: {{ error.message }}</p>
    </div>
    
    <div v-else-if="venues && venues.length > 0">
      <h2>Venues from database:</h2>
      <ul>
        <li v-for="venue in venues" :key="venue.id">
          {{ venue.name }} - {{ venue.neighborhood || 'No neighborhood' }}
        </li>
      </ul>
    </div>
    
    <p v-else-if="venues">
      ✓ Connection works! No venues in database yet.
    </p>
    
    <p v-else>Loading...</p>
    
    <footer>
      <a href="/">Back to home</a>
    </footer>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

const { data: venues, error } = await useAsyncData('venues', async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
  
  if (error) throw error
  return data
})
</script>

<style scoped>
.container {
  padding: 48px 24px;
  max-width: 640px;
}

h1 {
  font-size: 32px;
  margin-bottom: 24px;
}

h2 {
  font-size: 18px;
  margin: 24px 0 12px;
}

ul {
  list-style: none;
  margin: 12px 0;
}

li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

footer {
  margin-top: 48px;
}

a {
  color: #c0392b;
  text-decoration: none;
  border-bottom: 1px solid #c0392b;
}

a:hover {
  background: #c0392b;
  color: #fff;
}
</style>