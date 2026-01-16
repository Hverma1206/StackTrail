import { supabase } from './supabase.js'

const API_BASE = import.meta.env.VITE_API_URL 

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No session')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

export const api = {
  // Auth APIs (but auth is handled by supabase directly)

  // Scenarios
  getScenarios: async (params = {}) => {
    const headers = await getAuthHeaders()
    const url = new URL(`${API_BASE}/scenarios`)
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error('Failed to fetch scenarios')
    return res.json()
  },

  getScenarioById: async (id) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/scenarios/${id}`, { headers })
    if (!res.ok) throw new Error('Failed to fetch scenario')
    return res.json()
  },

  startScenario: async (id) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/scenarios/${id}/start`, { headers })
    if (!res.ok) throw new Error('Failed to start scenario')
    return res.json()
  },

  getStep: async (scenarioId, stepId) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/step/${stepId}`, { headers })
    if (!res.ok) throw new Error('Failed to get step')
    return res.json()
  },

  submitAnswer: async (scenarioId, stepId, optionId) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/step/${stepId}/answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ optionId })
    })
    if (!res.ok) throw new Error('Failed to submit answer')
    return res.json()
  },

  generateAnalysis: async (scenarioId) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/analyze`, {
      method: 'POST',
      headers
    })
    if (!res.ok) throw new Error('Failed to generate analysis')
    return res.json()
  },

  // Progress
  getProgress: async (scenarioId) => {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_BASE}/progress/${scenarioId}`, { headers })
    if (!res.ok) throw new Error('Failed to fetch progress')
    return res.json()
  }
}