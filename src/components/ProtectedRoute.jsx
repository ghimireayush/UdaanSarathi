import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import Loading from './Loading'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, hasRole, loading } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { from: location }, 
        replace: true 
      })
    } else if (!loading && requiredRole && !hasRole(requiredRole)) {
      // Redirect to dashboard if user doesn't have required role
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, hasRole, requiredRole, loading, navigate])

  if (loading) {
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