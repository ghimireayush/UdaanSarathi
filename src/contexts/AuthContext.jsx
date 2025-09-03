import React, { createContext, useContext, useState, useEffect } from 'react'
import authService, { ROLES, PERMISSIONS } from '../services/authService.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = () => {
    try {
      const currentUser = authService.getCurrentUser()
      const isAuth = authService.isUserAuthenticated()
      
      if (currentUser && isAuth) {
        setUser(currentUser)
        setIsAuthenticated(true)
        setPermissions(authService.getUserPermissions(currentUser.role))
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setIsLoading(true)
      const result = await authService.login(username, password)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
    setPermissions([])
  }

  const hasPermission = (permission) => {
    return authService.hasPermission(permission)
  }

  const hasAnyPermission = (permissionList) => {
    return authService.hasAnyPermission(permissionList)
  }

  const hasAllPermissions = (permissionList) => {
    return authService.hasAllPermissions(permissionList)
  }

  const hasRole = (role) => {
    return authService.hasRole(role)
  }

  const isAdmin = () => {
    return authService.isAdmin()
  }

  const isRecruiter = () => {
    return authService.isRecruiter()
  }

  const isCoordinator = () => {
    return authService.isCoordinator()
  }

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem('udaan_user', JSON.stringify(updatedUser))
  }

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    permissions,
    
    // Actions
    login,
    logout,
    updateUser,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isRecruiter,
    isCoordinator,
    
    // Constants
    ROLES,
    PERMISSIONS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext