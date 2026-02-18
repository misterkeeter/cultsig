<template>
  <div class="container">
    <h1>Submit an Event</h1>
    
    <div v-if="submitted" class="success">
      <h2>✓ Event Submitted!</h2>
      <p>Thanks for your submission. We'll review it and add it to our listings if it fits our community-focused criteria.</p>
      <a href="/">Back to home</a>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="submission-form">
      <div class="field">
        <label for="title">Event Title *</label>
        <input 
          id="title"
          v-model="form.title" 
          type="text" 
          required 
          placeholder="Gallery Opening: New Works by Local Artists"
        />
      </div>

      <div class="field">
        <label for="description">Description *</label>
        <textarea 
          id="description"
          v-model="form.description" 
          required 
          rows="4"
          placeholder="Tell us about your event. What should people expect?"
        ></textarea>
      </div>

      <div class="field-group">
        <div class="field">
          <label for="category">Category *</label>
          <select id="category" v-model="form.category" @change="handleCategoryChange" required>
            <option value="">Select category...</option>
            <option value="art">Art</option>
            <option value="music">Music</option>
            <option value="theater">Theater</option>
            <option value="dance">Dance</option>
            <option value="film">Film</option>
            <option value="literature">Literature</option>
            <option value="community">Community</option>
          </select>
        </div>

        <div class="field">
          <label for="subcategory">Type *</label>
          <select id="subcategory" v-model="form.subcategory" required :disabled="!form.category">
            <option value="">Select type...</option>
            <option v-for="sub in availableSubcategories" :key="sub" :value="sub">
              {{ sub }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="venue">Venue *</label>
        <select id="venue" v-model="form.venue_type" @change="handleVenueTypeChange" required>
          <option value="">Choose an option...</option>
          <option value="existing">Select from existing venues</option>
          <option value="new">Add a new venue</option>
        </select>
      </div>

      <!-- Existing venue dropdown -->
      <div v-if="form.venue_type === 'existing'" class="field">
        <label for="existing_venue">Select Venue</label>
        <select id="existing_venue" v-model="form.venue_id" required>
          <option value="">Select a venue...</option>
          <option v-for="venue in venues" :key="venue.id" :value="venue.id">
            {{ venue.name }} ({{ venue.neighborhood || 'DFW' }})
          </option>
        </select>
      </div>

      <!-- New venue fields -->
      <div v-if="form.venue_type === 'new'" class="venue-fields">
        <div class="field">
          <label for="venue_name">Venue Name *</label>
          <input 
            id="venue_name"
            v-model="form.venue_name" 
            type="text" 
            :required="form.venue_type === 'new'"
            placeholder="Gallery Name, Artist Studio, etc."
          />
        </div>

        <div class="field-group">
          <div class="field">
            <label for="venue_address">Street Address *</label>
            <input 
              id="venue_address"
              v-model="form.venue_address" 
              type="text" 
              :required="form.venue_type === 'new'"
              placeholder="123 Main St"
            />
          </div>

          <div class="field">
            <label for="venue_city">City *</label>
            <input 
              id="venue_city"
              v-model="form.venue_city" 
              type="text" 
              :required="form.venue_type === 'new'"
              placeholder="Dallas"
            />
          </div>
        </div>

        <div class="field-group">
          <div class="field">
            <label for="venue_neighborhood">Neighborhood</label>
            <input 
              id="venue_neighborhood"
              v-model="form.venue_neighborhood" 
              type="text" 
              placeholder="Deep Ellum, Bishop Arts, etc."
            />
          </div>

          <div class="field">
            <label for="venue_website">Venue Website</label>
            <input 
              id="venue_website"
              v-model="form.venue_website" 
              type="url" 
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="field">
          <label for="event_date">Date *</label>
          <input 
            id="event_date"
            v-model="form.event_date" 
            type="date" 
            required 
          />
        </div>

        <div class="field">
          <label for="event_time">Start Time</label>
          <input 
            id="event_time"
            v-model="form.event_time" 
            type="time" 
          />
        </div>

        <div class="field">
          <label for="end_time">End Time</label>
          <input 
            id="end_time"
            v-model="form.end_time" 
            type="time" 
          />
        </div>
      </div>

      <div class="field-group">
        <div class="field">
          <label for="admission_fee">Admission Fee ($)</label>
          <input 
            id="admission_fee"
            v-model.number="form.admission_fee" 
            type="number" 
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          <p class="help">Leave blank or 0 if free</p>
        </div>

        <div class="field">
          <label for="event_url">Event URL</label>
          <input 
            id="event_url"
            v-model="form.event_url" 
            type="url" 
            placeholder="https://..."
          />
        </div>
      </div>

      <div class="field">
        <label for="email">Your Email *</label>
        <input 
          id="email"
          v-model="form.submitted_by_email" 
          type="email" 
          required 
          placeholder="you@example.com"
        />
        <p class="help">We'll contact you if we have questions about your submission</p>
      </div>

      <button type="submit" :disabled="submitting" class="submit-btn">
        {{ submitting ? 'Submitting...' : 'Submit Event' }}
      </button>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

// Form data
const form = ref({
  title: '',
  description: '',
  category: '',
  subcategory: '',
  venue_type: '',
  venue_id: '',
  venue_name: '',
  venue_address: '',
  venue_city: '',
  venue_neighborhood: '',
  venue_website: '',
  event_date: '',
  event_time: '',
  end_time: '',
  admission_fee: null,
  event_url: '',
  submitted_by_email: ''
})

// State
const submitted = ref(false)
const submitting = ref(false)
const error = ref(null)

// Load venues for dropdown with better error handling
const { data: venues, error: venuesError } = await useAsyncData('venues', async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, neighborhood')
    .order('name')
  
  if (error) {
    throw error
  }
  
  return data || []
})

// Subcategory options based on category
const subcategoryOptions = {
  art: ['Opening', 'Talk', 'Workshop', 'Studio Visit', 'Performance', 'Open Hours'],
  music: ['Concert', 'Open Mic', 'Album Release', 'Workshop', 'Listening Party'],
  theater: ['Performance', 'Reading', 'Workshop', 'Talk', 'Audition'],
  dance: ['Performance', 'Workshop', 'Class', 'Showcase', 'Talk'],
  film: ['Screening', 'Premiere', 'Talk', 'Workshop', 'Festival'],
  literature: ['Reading', 'Book Launch', 'Workshop', 'Talk', 'Open Mic'],
  community: ['Meeting', 'Workshop', 'Discussion', 'Fundraiser', 'Volunteer']
}

// Computed available subcategories
const availableSubcategories = computed(() => {
  return form.value.category ? subcategoryOptions[form.value.category] || [] : []
})

// Handle category change
function handleCategoryChange() {
  form.value.subcategory = '' // Clear subcategory when category changes
}

// Handle venue type change
function handleVenueTypeChange() {
  // Clear venue-related fields when switching types
  form.value.venue_id = ''
  form.value.venue_name = ''
  form.value.venue_address = ''
  form.value.venue_city = ''
  form.value.venue_neighborhood = ''
  form.value.venue_website = ''
}

// Handle form submission
async function handleSubmit() {
  submitting.value = true
  error.value = null

  try {
    let finalVenueId = form.value.venue_id

    // If they're adding a new venue, create it first
    if (form.value.venue_type === 'new') {
      const { data: newVenue, error: venueError } = await supabase
        .from('venues')
        .insert([{
          name: form.value.venue_name,
          address: `${form.value.venue_address}, ${form.value.venue_city}`,
          neighborhood: form.value.venue_neighborhood || null,
          website: form.value.venue_website || null
        }])
        .select()
        .single()

      if (venueError) {
        throw venueError
      }

      finalVenueId = newVenue.id
    }

    // Insert the submission
    const { error: submitError } = await supabase
      .from('submissions')
      .insert([{
        title: form.value.title,
        description: form.value.description,
        category: form.value.category,
        subcategory: form.value.subcategory,
        venue_id: finalVenueId || null,
        event_date: form.value.event_date,
        event_time: form.value.event_time || null,
        end_time: form.value.end_time || null,
        admission_fee: form.value.admission_fee || null,
        event_url: form.value.event_url || null,
        submitted_by_email: form.value.submitted_by_email,
        is_paid_listing: false // Always false for now
      }])

    if (submitError) {
      throw submitError
    }

    submitted.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

h1 {
  font-size: 32px;
  margin-bottom: 32px;
}

.success {
  text-align: center;
  padding: 48px 24px;
  border: 2px solid #27ae60;
  border-radius: 8px;
  background: #d5f4e6;
}

.success h2 {
  color: #27ae60;
  margin-bottom: 16px;
}

.submission-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field-group {
  display: grid;
  grid-template-columns: 1fr 120px 120px;
  gap: 16px;
}

@media (max-width: 640px) {
  .field-group {
    grid-template-columns: 1fr;
  }
}

label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #2c3e50;
}

input, textarea, select {
  padding: 12px;
  border: 2px solid #bdc3c7;
  border-radius: 4px;
  font-size: 16px;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #c0392b;
}

.help {
  margin-top: 4px;
  font-size: 14px;
  color: #7f8c8d;
}

.venue-fields {
  padding: 16px;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  background: #f8f9fa;
}

.venue-fields .field-group {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 640px) {
  .venue-fields .field-group {
    grid-template-columns: 1fr;
  }
}

.submit-btn {
  background: #c0392b;
  color: white;
  border: none;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:hover {
  background: #a93226;
}

.submit-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  background: #fadbd8;
  padding: 12px;
  border-radius: 4px;
}
</style>