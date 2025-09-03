import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/index.js'

// Create the context
const UserContext = createContext()

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const currentUser = authService.getCurrentUser()
        const authStatus = authService.isAuthenticated()
        
        setUser(currentUser)
        setIsAuthenticated(authStatus)
      } catch (error) {
        console.error('Error checking auth status:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  // Login function
  const login = async (username, password) => {
    try {
      const { user: userData } = await authService.login(username, password)
      setUser(userData)
      setIsAuthenticated(true)
      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false
    // Admin has all roles
    if (user.role === 'admin') return true
    return user.role === role
  }

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false
    const permissions = authService.getUserPermissions()
    return permissions.includes(permission)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasPermission
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}