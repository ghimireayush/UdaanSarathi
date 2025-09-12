import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loading from './Loading'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, hasRole, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      })
    } else if (!isLoading && requiredRole && !hasRole(requiredRole)) {
      // Redirect to dashboard if user doesn't have required role
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, hasRole, requiredRole, isLoading, navigate, location])

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return null
  }

  return children
}

export default ProtectedRoute