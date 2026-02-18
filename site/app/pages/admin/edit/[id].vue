<template>
  <div class="admin-container">
    <!-- Header -->
    <header class="admin-header">
      <div class="admin-header-content">
        <div>
          <h1>Edit Submission</h1>
          <p>{{ submission?.title || 'Loading...' }}</p>
        </div>
        <div class="admin-header-actions">
          <button @click="goBack" class="admin-btn admin-btn-secondary">
            ← Back to Admin
          </button>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="admin-content">
      <div class="admin-empty-state">
        <p>Loading submission...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="admin-content">
      <div class="admin-empty-state">
        <p style="color: #dc2626;">{{ error }}</p>
        <button @click="goBack" class="admin-btn admin-btn-secondary" style="margin-top: 1rem;">
          Back to Admin
        </button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="submission" class="admin-content">
      <div style="max-width: 800px;">
        <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          <form @submit.prevent="saveChanges" class="space-y-6" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Basic Info -->
            <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-label">Event Title *</label>
                <input 
                  v-model="form.title"
                  type="text" 
                  required
                  class="admin-input"
                  placeholder="Enter event title"
                />
              </div>

              <div class="admin-form-group">
                <label class="admin-label">Description *</label>
                <textarea 
                  v-model="form.description"
                  rows="4"
                  required
                  class="admin-textarea"
                  placeholder="Describe the event"
                ></textarea>
              </div>
            </div>

            <!-- Date and Time -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-label">Event Date *</label>
                <input 
                  v-model="form.event_date"
                  type="date" 
                  required
                  class="admin-input"
                />
              </div>

              <div class="admin-form-group">
                <label class="admin-label">Start Time</label>
                <input 
                  v-model="form.event_time"
                  type="time" 
                  class="admin-input"
                />
              </div>

              <div class="admin-form-group">
                <label class="admin-label">End Time</label>
                <input 
                  v-model="form.end_time"
                  type="time" 
                  class="admin-input"
                />
              </div>
            </div>

            <!-- Category -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-label">Category *</label>
                <select v-model="form.category" @change="handleCategoryChange" class="admin-select" required>
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

              <div class="admin-form-group">
                <label class="admin-label">Type *</label>
                <select v-model="form.subcategory" class="admin-select" required :disabled="!form.category">
                  <option value="">Select type...</option>
                  <option v-for="sub in availableSubcategories" :key="sub" :value="sub">
                    {{ sub }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Venue -->
            <div>
              <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #111827;">Venue Information</h3>
              <div class="admin-form-group">
                <label class="admin-label">Venue *</label>
                <select v-model="form.venue_type" @change="onVenueTypeChange" class="admin-select" required>
                  <option value="">Choose an option...</option>
                  <option value="existing">Select from existing venues</option>
                  <option value="new">Add a new venue</option>
                </select>
              </div>

              <!-- Existing venue dropdown -->
              <div v-if="form.venue_type === 'existing'" class="admin-form-group" style="margin-top: 1rem;">
                <label class="admin-label">Select Venue *</label>
                <select v-model="form.venue_id" class="admin-select" required>
                  <option value="">Select a venue...</option>
                  <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                    {{ venue.name }} ({{ venue.neighborhood || 'DFW' }})
                  </option>
                </select>
              </div>

              <!-- New Venue Form -->
              <div v-if="form.venue_type === 'new'" style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 4px;">
                <h4 style="font-weight: 500; margin-bottom: 0.5rem;">New Venue Details</h4>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  <div class="admin-form-group">
                    <label class="admin-label">Venue Name *</label>
                    <input 
                      v-model="newVenue.name"
                      type="text" 
                      required
                      class="admin-input"
                      placeholder="Gallery Name, Artist Studio, etc."
                    />
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 120px; gap: 1rem;">
                    <div class="admin-form-group">
                      <label class="admin-label">Street Address *</label>
                      <input 
                        v-model="newVenue.address"
                        type="text" 
                        required
                        class="admin-input"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">City *</label>
                      <input 
                        v-model="newVenue.city"
                        type="text" 
                        required
                        class="admin-input"
                        placeholder="Dallas"
                      />
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="admin-form-group">
                      <label class="admin-label">Neighborhood</label>
                      <input 
                        v-model="newVenue.neighborhood"
                        type="text" 
                        class="admin-input"
                        placeholder="Deep Ellum, Bishop Arts, etc."
                      />
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-label">Venue Website</label>
                      <input 
                        v-model="newVenue.website"
                        type="url" 
                        class="admin-input"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Admission -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="admin-form-group">
                <label class="admin-label">Admission Fee ($)</label>
                <input 
                  v-model.number="form.admission_fee"
                  type="number" 
                  min="0"
                  step="0.01"
                  class="admin-input"
                  placeholder="0.00"
                />
                <p style="margin-top: 0.25rem; font-size: 0.875rem; color: #6b7280;">Leave blank or 0 if free</p>
              </div>

              <div class="admin-form-group">
                <label class="admin-label">Event URL</label>
                <input 
                  v-model="form.event_url"
                  type="url" 
                  class="admin-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <!-- Submitter Info -->
            <div>
              <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #111827;">Submitter Information</h3>
              <div class="admin-form-group">
                <label class="admin-label">Email *</label>
                <input 
                  v-model="form.submitted_by_email"
                  type="email" 
                  required
                  class="admin-input"
                  placeholder="submitter@email.com"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
              <button type="button" @click="goBack" class="admin-btn admin-btn-secondary">
                Cancel
              </button>
              <div style="display: flex; gap: 0.75rem;">
                <button 
                  type="submit" 
                  :disabled="saving"
                  class="admin-btn admin-btn-primary"
                >
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Page setup
useHead({
  title: 'Edit Submission - Cultsig Admin'
})

// Router and route
const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const submission = ref(null)
const venues = ref([])

// Form data
const form = ref({
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  end_time: '',
  category: '',
  subcategory: '',
  venue_type: '',
  venue_id: '',
  admission_fee: null,
  event_url: '',
  submitted_by_email: ''
})

// New venue form - matching submit.vue structure
const newVenue = ref({
  name: '',
  address: '',
  city: '',
  neighborhood: '',
  website: ''
})

// Subcategory options - exact same as submit.vue
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

// Handle category change - clear subcategory like submit.vue
function handleCategoryChange() {
  form.value.subcategory = '' // Clear subcategory when category changes
}

// Handle venue type change - matching submit.vue logic
function onVenueTypeChange() {
  // Clear venue-related fields when switching types
  form.value.venue_id = ''
  newVenue.value = {
    name: '',
    address: '',
    city: '',
    neighborhood: '',
    website: ''
  }
}

// Initialize
onMounted(async () => {
  await Promise.all([
    loadSubmission(),
    loadVenues()
  ])
})

// Functions
async function loadSubmission() {
  try {
    loading.value = true
    const submissionId = route.params.id
    
    if (!submissionId) {
      error.value = 'No submission ID provided'
      return
    }

    const authToken = localStorage.getItem('cultsig_admin_token')
    if (!authToken) {
      router.push('/admin')
      return
    }

    const response = await $fetch(`/api/admin/submission/${submissionId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    if (response.success && response.submission) {
      submission.value = response.submission
      
      // Populate form with existing data
      form.value = {
        title: response.submission.title || '',
        description: response.submission.description || '',
        event_date: response.submission.event_date || '',
        event_time: response.submission.event_time || '',
        end_time: response.submission.end_time || '',
        category: response.submission.category || '',
        subcategory: response.submission.subcategory || '',
        venue_type: response.submission.venue_id ? 'existing' : '', // Set venue_type based on existing venue_id
        venue_id: response.submission.venue_id || '',
        admission_fee: response.submission.admission_fee || null,
        event_url: response.submission.event_url || '',
        submitted_by_email: response.submission.submitted_by_email || ''
      }
    } else {
      error.value = 'Submission not found'
    }
  } catch (err) {
    console.error('Error loading submission:', err)
    error.value = 'Failed to load submission'
  } finally {
    loading.value = false
  }
}

async function loadVenues() {
  try {
    const authToken = localStorage.getItem('cultsig_admin_token')
    const response = await $fetch('/api/admin/venues', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    if (response.success) {
      venues.value = response.venues || []
    }
  } catch (err) {
    console.error('Error loading venues:', err)
  }
}

async function saveChanges() {
  try {
    saving.value = true
    const authToken = localStorage.getItem('cultsig_admin_token')
    
    let venueId = form.value.venue_id

    // Create new venue if needed - matching submit.vue logic
    if (form.value.venue_type === 'new' && newVenue.value.name && newVenue.value.address) {
      const venueData = {
        name: newVenue.value.name,
        address: `${newVenue.value.address}, ${newVenue.value.city}`, // Combine like submit.vue
        neighborhood: newVenue.value.neighborhood || null,
        website: newVenue.value.website || null
      }

      const venueResponse = await $fetch('/api/admin/venues', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: venueData
      })

      if (venueResponse.success) {
        venueId = venueResponse.venue.id
      }
    }

    // Update submission - only include fields that exist in your schema
    const updateData = {
      title: form.value.title,
      description: form.value.description,
      event_date: form.value.event_date,
      event_time: form.value.event_time || null,
      end_time: form.value.end_time || null,
      venue_id: venueId || null,
      category: form.value.category,
      subcategory: form.value.subcategory,
      admission_fee: form.value.admission_fee || null,
      event_url: form.value.event_url || null,
      submitted_by_email: form.value.submitted_by_email
    }

    const response = await $fetch(`/api/admin/submission/${route.params.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: updateData
    })

    if (response.success) {
      // Go back to admin
      goBack()
    } else {
      alert('Failed to save changes')
    }
  } catch (err) {
    console.error('Error saving changes:', err)
    alert('Error saving changes: ' + (err.data?.statusMessage || 'Unknown error'))
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/admin')
}

// Format date for input
function formatDateForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Watch for submission changes to update form
watch(submission, (newSubmission) => {
  if (newSubmission && newSubmission.event_date) {
    form.value.event_date = formatDateForInput(newSubmission.event_date)
  }
}, { immediate: true })
</script>