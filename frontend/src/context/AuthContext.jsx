import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext()

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        try {
          const response = await api.get('/auth/profile')
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const signUp = async (email, password, fullName) => {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        fullName
      })
      
      const { user: userData, session } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', session.access_token)
      localStorage.setItem('refresh_token', session.refresh_token)
      setToken(session.access_token)
      setUser(userData)
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      })
      
      const { user: userData, session } = response.data
      
      // Store tokens
      localStorage.setItem('access_token', session.access_token)
      localStorage.setItem('refresh_token', session.refresh_token)
      setToken(session.access_token)
      setUser(userData)
      
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  const signOut = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    token,
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}