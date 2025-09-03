import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import Loading from './Loading'

const PrivateRoute = ({ children, requiredRole = null, requiredPermission = null, requiredPermissions = [] }) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, hasAnyPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      })
    } else if (!isLoading && isAuthenticated) {
      // Check role-based access
      if (requiredRole && !hasRole(requiredRole)) {
        navigate('/dashboard', { replace: true })
        return
      }
      
      // Check permission-based access
      if (requiredPermission && !hasPermission(requiredPermission)) {
        navigate('/dashboard', { replace: true })
        return
      }
      
      // Check multiple permissions (user needs at least one)
      if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
        navigate('/dashboard', { replace: true })
        return
      }
    }
  }, [isAuthenticated, hasRole, hasPermission, hasAnyPermission, requiredRole, requiredPermission, requiredPermissions, isLoading, navigate, location])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check access permissions
  const hasAccess = () => {
    if (requiredRole && !hasRole(requiredRole)) return false
    if (requiredPermission && !hasPermission(requiredPermission)) return false
    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) return false
    return true
  }

  if (!hasAccess()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return children
}

export default PrivateRoute