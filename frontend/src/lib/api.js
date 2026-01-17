import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL 

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token: newRefreshToken } = response.data.session
          
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient

export const api = {
  // Auth APIs
  signup: (data) => apiClient.post('/auth/signup', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  requestPasswordReset: (data) => apiClient.post('/auth/request-password-reset', data),

  // Scenarios
  getScenarios: (params = {}) => apiClient.get('/scenarios', { params }),
  getScenarioById: (id) => apiClient.get(`/scenarios/${id}`),
  startScenario: (id) => apiClient.get(`/scenarios/${id}/start`),
  getStep: (scenarioId, stepId) => apiClient.get(`/scenarios/${scenarioId}/step/${stepId}`),
  submitAnswer: (scenarioId, stepId, optionId) => 
    apiClient.post(`/scenarios/${scenarioId}/step/${stepId}/answer`, { optionId }),
  generateAnalysis: (scenarioId) => apiClient.post(`/scenarios/${scenarioId}/analyze`),

  // Progress
  getProgress: (scenarioId) => apiClient.get(`/progress/${scenarioId}`)
}