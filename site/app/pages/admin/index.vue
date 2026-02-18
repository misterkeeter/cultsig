<template>
  <div class="admin-container">
    <!-- Header -->
    <header class="admin-header">
      <div class="admin-header-content">
        <div>
          <h1>Cultsig Admin</h1>
          <p>Event Moderation Interface</p>
        </div>
        <div v-if="isAuthenticated" class="admin-header-actions">
          <span class="admin-header-email">{{ adminEmail }}</span>
          <button @click="logout" class="admin-btn admin-btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Login Form -->
    <div v-if="!isAuthenticated" class="admin-login-container">
      <div class="admin-login-form">
        <h2 class="admin-login-title">Admin Login</h2>
        <form @submit.prevent="login" class="admin-login-fields">
          <div class="admin-form-group">
            <label class="admin-label">Email</label>
            <input 
              v-model="loginForm.email"
              type="email" 
              required
              class="admin-input"
              placeholder="admin@cultsig.org"
            />
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Password</label>
            <input 
              v-model="loginForm.password"
              type="password" 
              required
              class="admin-input"
            />
          </div>
          <button 
            type="submit" 
            :disabled="loggingIn"
            class="admin-btn admin-btn-primary"
          >
            {{ loggingIn ? 'Logging in...' : 'Sign in' }}
          </button>
          <div v-if="loginError" class="admin-login-error">
            {{ loginError }}
          </div>
        </form>
      </div>
    </div>

    <!-- Admin Interface -->
    <div v-else class="admin-content">
      <!-- Stats -->
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-number admin-stat-pending">{{ stats.pending }}</div>
          <div class="admin-stat-label">Pending Review</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-number admin-stat-approved">{{ stats.approved }}</div>
          <div class="admin-stat-label">Approved</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-number admin-stat-rejected">{{ stats.rejected }}</div>
          <div class="admin-stat-label">Rejected</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-number admin-stat-total">{{ stats.total }}</div>
          <div class="admin-stat-label">Total Submissions</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="admin-filters">
        <div class="admin-filters-content">
          <h3 class="admin-filters-title">Event Submissions</h3>
          <div class="admin-filters-actions">
            <select v-model="selectedStatus" class="admin-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button @click="loadSubmissions" class="admin-btn admin-btn-gray">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Submissions List -->
      <div class="admin-submissions-list">
        <div 
          v-for="submission in filteredSubmissions" 
          :key="submission.id"
          class="admin-submission-card"
        >
          <div class="admin-submission-header">
            <div class="admin-submission-content">
              <div class="admin-submission-title-row">
                <h4 class="admin-submission-title">{{ submission.title }}</h4>
                <span 
                  class="admin-status-badge"
                  :class="{
                    'admin-status-pending': submission.status === 'pending',
                    'admin-status-approved': submission.status === 'approved',
                    'admin-status-rejected': submission.status === 'rejected'
                  }"
                >
                  {{ submission.status.charAt(0).toUpperCase() + submission.status.slice(1) }}
                </span>
              </div>
              
              <div class="admin-submission-meta">
                <div>
                  <strong>Date:</strong> {{ formatDate(submission.event_date) }} 
                  <span v-if="submission.start_time">at {{ submission.start_time }}</span>
                </div>
                <div><strong>Venue:</strong> {{ submission.venue_name || 'TBD' }}</div>
                <div><strong>Category:</strong> {{ submission.category }}<span v-if="submission.subcategory"> - {{ submission.subcategory }}</span></div>
                <div><strong>Admission:</strong> 
                  <span v-if="submission.admission_fee">${{ submission.admission_fee }}</span>
                  <span v-else>Not specified</span>
                </div>
              </div>
              
              <p class="admin-submission-description">{{ truncateText(submission.description, 200) }}</p>
              
              <div class="admin-submission-footer">
                Submitted {{ formatDateTime(submission.created_at) }}
                <span v-if="submission.submitter_email"> by {{ submission.submitter_email }}</span>
              </div>
            </div>
            
            <div class="admin-submission-actions">
              <button 
                @click="viewDetails(submission)"
                class="admin-btn admin-btn-secondary"
              >
                View Details
              </button>
              <div v-if="submission.status === 'pending'" class="admin-pending-actions">
                <button 
                  @click="approveSubmission(submission)"
                  :disabled="processing"
                  class="admin-btn admin-btn-success"
                >
                  Approve
                </button>
                <button 
                  @click="showRejectDialog(submission)"
                  :disabled="processing"
                  class="admin-btn admin-btn-danger"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
          
          <!-- Rejection reason -->
          <div v-if="submission.status === 'rejected' && submission.rejection_reason" class="admin-rejection-reason">
            <p class="admin-rejection-text">
              <strong>Rejection reason:</strong> {{ submission.rejection_reason }}
            </p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredSubmissions.length === 0" class="admin-empty-state">
          <p>No submissions found.</p>
        </div>
      </div>
    </div>

    <!-- Submission Details Modal -->
    <div v-if="selectedSubmission" class="admin-modal-overlay">
      <div class="admin-modal">
        <div class="admin-modal-content">
          <div class="admin-modal-header">
            <div>
              <h3 class="admin-modal-title">{{ selectedSubmission.title }}</h3>
              <span 
                class="admin-status-badge"
                :class="{
                  'admin-status-pending': selectedSubmission.status === 'pending',
                  'admin-status-approved': selectedSubmission.status === 'approved',
                  'admin-status-rejected': selectedSubmission.status === 'rejected'
                }"
              >
                {{ selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1) }}
              </span>
            </div>
            <button @click="selectedSubmission = null" class="admin-modal-close">
              ×
            </button>
          </div>
          
          <div class="admin-modal-grid">
            <div class="admin-modal-section">
              <div>
                <h4 class="admin-modal-section-title">Event Details</h4>
                <div class="admin-modal-info-box">
                  <div><strong>Date:</strong> {{ formatDate(selectedSubmission.event_date) }}</div>
                  <div v-if="selectedSubmission.start_time"><strong>Time:</strong> {{ selectedSubmission.start_time }}<span v-if="selectedSubmission.end_time"> - {{ selectedSubmission.end_time }}</span></div>
                  <div><strong>Category:</strong> {{ selectedSubmission.category }}<span v-if="selectedSubmission.subcategory"> - {{ selectedSubmission.subcategory }}</span></div>
                  <div><strong>Admission:</strong> 
                    <span v-if="selectedSubmission.admission_fee">${{ selectedSubmission.admission_fee }}</span>
                    <span v-else>Not specified</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="admin-modal-section-title">Venue</h4>
                <div class="admin-modal-info-box">
                  <div><strong>Name:</strong> {{ selectedSubmission.venue_name || 'Not specified' }}</div>
                  <div v-if="selectedSubmission.venue_address"><strong>Address:</strong> {{ selectedSubmission.venue_address }}</div>
                </div>
              </div>

            <div class="admin-modal-section">
              <div>
                <h4 class="admin-modal-section-title">Description</h4>
                <div class="admin-modal-info-box">
                  <p class="admin-modal-description">{{ selectedSubmission.description }}</p>
                </div>
              </div>

              <div v-if="selectedSubmission.website_url">
                <h4 class="admin-modal-section-title">Event Link</h4>
                <div class="admin-modal-info-box">
                  <div>
                    <strong>Event URL:</strong> 
                    <a :href="selectedSubmission.website_url" target="_blank" class="admin-link">
                      {{ selectedSubmission.website_url }}
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="admin-modal-section-title">Submission Info</h4>
                <div class="admin-modal-info-box">
                  <div><strong>Submitted:</strong> {{ formatDateTime(selectedSubmission.created_at) }}</div>
                  <div v-if="selectedSubmission.submitter_email"><strong>Email:</strong> {{ selectedSubmission.submitter_email }}</div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div class="admin-modal-actions">
            <button @click="selectedSubmission = null" class="admin-btn admin-btn-secondary">
              Close
            </button>
            <button 
              @click="editSubmission(selectedSubmission)"
              class="admin-btn admin-btn-gray"
            >
              Edit
            </button>
            <div v-if="selectedSubmission.status === 'pending'" class="admin-modal-actions-pending">
              <button 
                @click="showRejectDialog(selectedSubmission)"
                :disabled="processing"
                class="admin-btn admin-btn-danger"
              >
                Reject
              </button>
              <button 
                @click="approveSubmission(selectedSubmission)"
                :disabled="processing"
                class="admin-btn admin-btn-success"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Dialog -->
    <div v-if="rejectingSubmission" class="admin-modal-overlay">
      <div class="admin-modal admin-modal-small">
        <div class="admin-modal-content">
          <h3 class="admin-reject-title">Reject Submission</h3>
          <p class="admin-reject-text">
            Are you sure you want to reject "<strong>{{ rejectingSubmission.title }}</strong>"?
          </p>
          <div class="admin-reject-form-group">
            <label class="admin-label">Rejection Reason (Optional)</label>
            <textarea 
              v-model="rejectionReason"
              rows="3"
              placeholder="Explain why this submission doesn't fit our editorial criteria..."
              class="admin-textarea"
            ></textarea>
          </div>
          <div class="admin-reject-actions">
            <button @click="cancelReject" class="admin-btn admin-btn-secondary">
              Cancel
            </button>
            <button 
              @click="confirmReject"
              :disabled="processing"
              class="admin-btn admin-btn-danger"
            >
              {{ processing ? 'Rejecting...' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Page setup
useHead({
  title: 'Admin - Cultsig'
})

// Authentication state
const isAuthenticated = ref(false)
const adminEmail = ref('')
const loginForm = ref({ email: '', password: '' })
const loggingIn = ref(false)
const loginError = ref('')

// Data state
const submissions = ref([])
const selectedStatus = ref('all')
const selectedSubmission = ref(null)
const processing = ref(false)
const rejectingSubmission = ref(null)
const rejectionReason = ref('')

// Stats
const stats = computed(() => ({
  total: submissions.value.length,
  pending: submissions.value.filter(s => s.status === 'pending').length,
  approved: submissions.value.filter(s => s.status === 'approved').length,
  rejected: submissions.value.filter(s => s.status === 'rejected').length
}))

// Filtered submissions
const filteredSubmissions = computed(() => {
  if (selectedStatus.value === 'all') {
    return submissions.value
  }
  return submissions.value.filter(s => s.status === selectedStatus.value)
})

// Initialize
onMounted(() => {
  checkAuthStatus()
})

// Authentication functions
function checkAuthStatus() {
  const authToken = localStorage.getItem('cultsig_admin_token')
  const storedEmail = localStorage.getItem('cultsig_admin_email')
  
  if (authToken && storedEmail) {
    isAuthenticated.value = true
    adminEmail.value = storedEmail
    loadSubmissions()
  }
}

async function login() {
  loggingIn.value = true
  loginError.value = ''

  try {
    const { email, password } = loginForm.value
    
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    
    if (response.success) {
      localStorage.setItem('cultsig_admin_token', response.token)
      localStorage.setItem('cultsig_admin_email', response.email)
      
      isAuthenticated.value = true
      adminEmail.value = response.email
      await loadSubmissions()
    } else {
      loginError.value = 'Invalid credentials'
    }
  } catch (error) {
    loginError.value = error.data?.statusMessage || 'Login failed'
    console.error('Login error:', error)
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  localStorage.removeItem('cultsig_admin_token')
  localStorage.removeItem('cultsig_admin_email')
  isAuthenticated.value = false
  adminEmail.value = ''
  submissions.value = []
}

// Data loading functions
async function loadSubmissions() {
  try {
    const authToken = localStorage.getItem('cultsig_admin_token')
    
    const response = await $fetch('/api/admin/submissions', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    submissions.value = response.submissions || []
  } catch (error) {
    console.error('Error loading submissions:', error)
    if (error.status === 401) {
      logout()
    }
  }
}

// Moderation functions
async function approveSubmission(submission) {
  processing.value = true
  
  try {
    const authToken = localStorage.getItem('cultsig_admin_token')
    
    await $fetch('/api/admin/moderate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        submissionId: submission.id,
        action: 'approve'
      }
    })

    await loadSubmissions()
    selectedSubmission.value = null
    
  } catch (error) {
    console.error('Error approving submission:', error)
    alert('Error approving submission: ' + (error.data?.statusMessage || 'Unknown error'))
  } finally {
    processing.value = false
  }
}

function showRejectDialog(submission) {
  rejectingSubmission.value = submission
  rejectionReason.value = ''
}

async function confirmReject() {
  processing.value = true
  
  try {
    const authToken = localStorage.getItem('cultsig_admin_token')
    
    await $fetch('/api/admin/moderate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        submissionId: rejectingSubmission.value.id,
        action: 'reject',
        rejectionReason: rejectionReason.value || null
      }
    })

    await loadSubmissions()
    cancelReject()
    
  } catch (error) {
    console.error('Error rejecting submission:', error)
    alert('Error rejecting submission: ' + (error.data?.statusMessage || 'Unknown error'))
  } finally {
    processing.value = false
  }
}

function cancelReject() {
  rejectingSubmission.value = null
  rejectionReason.value = ''
  selectedSubmission.value = null
}

function viewDetails(submission) {
  selectedSubmission.value = submission
}

function editSubmission(submission) {
  // Navigate to edit page
  navigateTo(`/admin/edit/${submission.id}`)
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(dateString) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>