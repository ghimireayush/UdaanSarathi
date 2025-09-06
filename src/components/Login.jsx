import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Eye, EyeOff, LogIn, AlertCircle, User, Lock } from 'lucide-react'

const Login = ({ onSuccess }) => {
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [selectedDemo, setSelectedDemo] = useState('')

  // Demo accounts for easy testing
  const demoAccounts = [
    {
      id: 'admin',
      username: 'admin@udaan.com',
      password: 'admin123',
      role: 'Administrator',
      description: 'Full system access - All actions and settings'
    },
    {
      id: 'recruiter',
      username: 'recruiter@udaan.com',
      password: 'recruit123',
      role: 'Recruiter',
      description: 'Jobs, Applications, Interviews, Workflow management'
    },
    {
      id: 'coordinator',
      username: 'coordinator@udaan.com',
      password: 'coord123',
      role: 'Coordinator',
      description: 'Scheduling, Notifications, Documents - Limited editing'
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  // Prevent paste events on login form inputs
  const handlePaste = (e) => {
    e.preventDefault()
    setError('Pasting is disabled for security reasons. Please type your credentials.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password')
      return
    }

    try {
      await login(formData.username, formData.password)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  const handleDemoLogin = (account) => {
    setFormData({
      username: account.username,
      password: account.password
    })
    setSelectedDemo(account.id)
  }

  const handleQuickLogin = async (account) => {
    try {
      setError('')
      await login(account.username, account.password)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">U</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Udaan Sarathi account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your username or email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Demo Accounts
          </h3>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Try different roles to see permission-based features
          </p>

          <div className="space-y-3">
            {demoAccounts.map((account) => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${selectedDemo === account.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-white">
                        {account.role.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{account.role}</h4>
                      <p className="text-xs text-gray-500">{account.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDemoLogin(account)}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      Fill Form
                    </button>
                    <button
                      onClick={() => handleQuickLogin(account)}
                      className="text-xs px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      Quick Login
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">{account.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 Udaan Sarathi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login