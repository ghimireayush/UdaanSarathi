import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import Loading from './Loading'

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, hasRole, loading } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      })
    } else if (!loading && requiredRole && !hasRole(requiredRole)) {
      // Redirect to dashboard if user doesn't have required role
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, hasRole, requiredRole, loading, navigate, location])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && !hasRole(requiredRole)) {
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