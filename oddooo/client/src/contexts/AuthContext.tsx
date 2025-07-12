import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

// Set axios base URL to backend server
axios.defaults.baseURL = 'http://localhost:5000'

interface User {
  id: string
  email: string
  username: string
  role: string
  avatar?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  console.log('AuthProvider initialized with token:', token)

  useEffect(() => {
    if (token) {
      console.log('Setting axios Authorization header with token:', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      console.log('Removing axios Authorization header')
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log('Checking auth with token:', token)
          console.log('Axios headers before auth check:', axios.defaults.headers.common)
          
          // Ensure headers are set
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await axios.get('/api/auth/me')
          console.log('Auth check successful:', response.data)
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [token])

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with email:', email)
      console.log('Axios base URL:', axios.defaults.baseURL)
      console.log('Making request to:', `${axios.defaults.baseURL}/api/auth/login`)
      
      const response = await axios.post('/api/auth/login', { email, password })
      console.log('Login response:', response)
      console.log('Login response data:', response.data)
      
      const { user, token } = response.data
      
      console.log('Login successful, received token:', token)
      console.log('User data:', user)
      
      setUser(user)
      setToken(token)
      localStorage.setItem('token', token)
      
      toast.success('Login successful!')
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Login error response:', error.response)
      console.error('Login error config:', error.config)
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (email: string, username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        email, 
        username, 
        password 
      })
      const { user, token } = response.data
      
      setUser(user)
      setToken(token)
      localStorage.setItem('token', token)
      
      toast.success('Registration successful!')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 