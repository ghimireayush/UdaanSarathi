import { jobService, agencyService } from './index.js'

// Mock user data for demonstration
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@udaan.com',
    role: 'admin',
    lastLogin: new Date().toISOString()
  },
  {
    id: 2,
    username: 'recruiter',
    password: 'recruit123',
    name: 'Recruiter User',
    email: 'recruiter@udaan.com',
    role: 'recruiter',
    lastLogin: new Date().toISOString()
  },
  {
    id: 3,
    username: 'coordinator',
    password: 'coord123',
    name: 'Coordinator User',
    email: 'coordinator@udaan.com',
    role: 'coordinator',
    lastLogin: new Date().toISOString()
  }
]

// Mock session storage
const SESSION_KEY = 'udaan_session'
const USER_KEY = 'udaan_user'

class AuthService {
  // Login user
  async login(username, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Find user in mock data
    const user = MOCK_USERS.find(
      u => u.username === username && u.password === password
    )
    
    if (!user) {
      throw new Error('Invalid username or password')
    }
    
    // Create session
    const session = {
      token: `token_${user.id}_${Date.now()}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }
    
    // Store session and user data
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    
    // Update last login
    user.lastLogin = new Date().toISOString()
    
    return { user, session }
  }
  
  // Logout user
  logout() {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
  }
  
  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }
  
  // Get current session
  getCurrentSession() {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    return sessionStr ? JSON.parse(sessionStr) : null
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getCurrentSession()
    if (!session) return false
    
    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)
    return now < expiresAt
  }
  
  // Check user role
  hasRole(requiredRole) {
    const user = this.getCurrentUser()
    if (!user) return false
    
    // Admin has access to everything
    if (user.role === 'admin') return true
    
    return user.role === requiredRole
  }
  
  // Get user permissions based on role
  getUserPermissions() {
    const user = this.getCurrentUser()
    if (!user) return []
    
    const permissions = {
      admin: [
        'view_dashboard',
        'manage_jobs',
        'manage_applications',
        'manage_interviews',
        'manage_workflow',
        'manage_drafts',
        'manage_settings',
        'view_analytics'
      ],
      recruiter: [
        'view_dashboard',
        'manage_jobs',
        'manage_applications',
        'manage_interviews',
        'view_analytics'
      ],
      coordinator: [
        'view_dashboard',
        'manage_workflow',
        'view_analytics'
      ]
    }
    
    return permissions[user.role] || []
  }
}

// Export singleton instance
export default new AuthService()