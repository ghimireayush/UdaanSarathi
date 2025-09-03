import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import logo from '../assets/logo.svg'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await login(username, password)
      if (result.success) {
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <img 
              src={logo} 
              alt="Udaan Sarathi Logo" 
              className="w-40 h-40 object-contain mb-2 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">Udaan Sarathi</h1>
            <p className="text-gray-600">Recruitment Management Portal</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-lg p-3 text-sm text-red-700 shadow-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-navy transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-brand-navy to-brand-blue-bright hover:from-brand-navy/90 hover:to-brand-blue-bright/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Udaan Sarathi. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login