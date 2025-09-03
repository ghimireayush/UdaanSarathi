// Authentication and Authorization Service
import { delay } from '../utils/helpers.js'

// Role definitions with permissions
export const ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  COORDINATOR: 'coordinator'
}

export const PERMISSIONS = {
  // Job Management
  CREATE_JOB: 'create_job',
  EDIT_JOB: 'edit_job',
  DELETE_JOB: 'delete_job',
  PUBLISH_JOB: 'publish_job',
  VIEW_JOBS: 'view_jobs',
  
  // Application Management
  VIEW_APPLICATIONS: 'view_applications',
  EDIT_APPLICATION: 'edit_application',
  SHORTLIST_CANDIDATE: 'shortlist_candidate',
  REJECT_APPLICATION: 'reject_application',
  
  // Interview Management
  SCHEDULE_INTERVIEW: 'schedule_interview',
  CONDUCT_INTERVIEW: 'conduct_interview',
  EDIT_INTERVIEW: 'edit_interview',
  VIEW_INTERVIEWS: 'view_interviews',
  
  // Workflow Management
  VIEW_WORKFLOW: 'view_workflow',
  UPDATE_WORKFLOW_STAGE: 'update_workflow_stage',
  MANAGE_DOCUMENTS: 'manage_documents',
  
  // System Administration
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_AGENCIES: 'manage_agencies',
  
  // Notifications and Scheduling
  SEND_NOTIFICATIONS: 'send_notifications',
  MANAGE_CALENDAR: 'manage_calendar',
  SCHEDULE_EVENTS: 'schedule_events',
  
  // Document Management
  UPLOAD_DOCUMENTS: 'upload_documents',
  EDIT_DOCUMENTS: 'edit_documents',
  DELETE_DOCUMENTS: 'delete_documents',
  
  // Limited Edit Permissions
  LIMITED_EDIT: 'limited_edit'
}

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.RECRUITER]: [
    // Jobs
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.EDIT_JOB,
    PERMISSIONS.DELETE_JOB,
    PERMISSIONS.PUBLISH_JOB,
    PERMISSIONS.VIEW_JOBS,
    
    // Applications
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.SHORTLIST_CANDIDATE,
    PERMISSIONS.REJECT_APPLICATION,
    
    // Interviews
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.CONDUCT_INTERVIEW,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.VIEW_INTERVIEWS,
    
    // Workflow
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS
  ],
  
  [ROLES.COORDINATOR]: [
    // Scheduling
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.SCHEDULE_EVENTS,
    
    // Notifications
    PERMISSIONS.SEND_NOTIFICATIONS,
    
    // Documents
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS,
    PERMISSIONS.VIEW_WORKFLOW,
    
    // Limited editing capabilities
    PERMISSIONS.LIMITED_EDIT,
    
    // View permissions
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.VIEW_INTERVIEWS
  ]
}

// Mock user data
const MOCK_USERS = [
  {
    id: 'user_1',
    username: 'admin@udaan.com',
    email: 'admin@udaan.com',
    name: 'System Administrator',
    role: ROLES.ADMIN,
    avatar: '/avatars/admin.jpg',
    isActive: true,
    lastLogin: '2025-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user_2',
    username: 'recruiter@udaan.com',
    email: 'recruiter@udaan.com',
    name: 'Senior Recruiter',
    role: ROLES.RECRUITER,
    avatar: '/avatars/recruiter.jpg',
    isActive: true,
    lastLogin: '2025-01-15T09:15:00Z',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'user_3',
    username: 'coordinator@udaan.com',
    email: 'coordinator@udaan.com',
    name: 'Interview Coordinator',
    role: ROLES.COORDINATOR,
    avatar: '/avatars/coordinator.jpg',
    isActive: true,
    lastLogin: '2025-01-15T08:45:00Z',
    createdAt: '2024-03-01T00:00:00Z'
  }
]

class AuthService {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.initializeAuth()
  }

  /**
   * Initialize authentication state from localStorage
   */
  initializeAuth() {
    try {
      const storedUser = localStorage.getItem('udaan_user')
      const storedToken = localStorage.getItem('udaan_token')
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser)
        this.isAuthenticated = true
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      this.logout()
    }
  }

  /**
   * Login user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result
   */
  async login(username, password) {
    await delay(1000) // Simulate API call
    
    // Find user by username or email
    const user = MOCK_USERS.find(u => 
      u.username === username || u.email === username
    )
    
    if (!user) {
      throw new Error('User not found')
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }
    
    // In a real app, you would verify the password hash
    // For demo purposes, accept any password (password parameter is intentionally unused)
    console.log('Login attempt for:', username, 'with password length:', password?.length || 0)
    
    // Generate mock token
    const token = `token_${user.id}_${Date.now()}`
    
    // Update last login
    user.lastLogin = new Date().toISOString()
    
    // Store in localStorage
    localStorage.setItem('udaan_user', JSON.stringify(user))
    localStorage.setItem('udaan_token', token)
    
    this.currentUser = user
    this.isAuthenticated = true
    
    return {
      user,
      token,
      permissions: this.getUserPermissions(user.role)
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('udaan_user')
    localStorage.removeItem('udaan_token')
    this.currentUser = null
    this.isAuthenticated = false
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null
  }

  /**
   * Get user permissions based on role
   * @param {string} role - User role
   * @returns {Array} Array of permissions
   */
  getUserPermissions(role) {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if current user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false
    
    const userPermissions = this.getUserPermissions(this.currentUser.role)
    return userPermissions.includes(permission)
  }

  /**
   * Check if current user has any of the specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if current user has all specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Get user role
   * @returns {string|null} User role
   */
  getUserRole() {
    return this.currentUser?.role || null
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    return this.currentUser?.role === role
  }

  /**
   * Check if user is admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.hasRole(ROLES.ADMIN)
  }

  /**
   * Check if user is recruiter
   * @returns {boolean} True if user is recruiter
   */
  isRecruiter() {
    return this.hasRole(ROLES.RECRUITER)
  }

  /**
   * Check if user is coordinator
   * @returns {boolean} True if user is coordinator
   */
  isCoordinator() {
    return this.hasRole(ROLES.COORDINATOR)
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} Array of users
   */
  async getUsers() {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(300)
    return MOCK_USERS
  }

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(500)
    
    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
    
    MOCK_USERS.push(newUser)
    return newUser
  }

  /**
   * Update user (admin only)
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(400)
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    
    MOCK_USERS[userIndex] = {
      ...MOCK_USERS[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    return MOCK_USERS[userIndex]
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(300)
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    
    MOCK_USERS.splice(userIndex, 1)
    return true
  }

  /**
   * Get role display name
   * @param {string} role - Role key
   * @returns {string} Display name
   */
  getRoleDisplayName(role) {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.RECRUITER]: 'Recruiter',
      [ROLES.COORDINATOR]: 'Coordinator'
    }
    return roleNames[role] || role
  }

  /**
   * Get permission display name
   * @param {string} permission - Permission key
   * @returns {string} Display name
   */
  getPermissionDisplayName(permission) {
    const permissionNames = {
      [PERMISSIONS.CREATE_JOB]: 'Create Jobs',
      [PERMISSIONS.EDIT_JOB]: 'Edit Jobs',
      [PERMISSIONS.DELETE_JOB]: 'Delete Jobs',
      [PERMISSIONS.PUBLISH_JOB]: 'Publish Jobs',
      [PERMISSIONS.VIEW_JOBS]: 'View Jobs',
      [PERMISSIONS.VIEW_APPLICATIONS]: 'View Applications',
      [PERMISSIONS.EDIT_APPLICATION]: 'Edit Applications',
      [PERMISSIONS.SHORTLIST_CANDIDATE]: 'Shortlist Candidates',
      [PERMISSIONS.REJECT_APPLICATION]: 'Reject Applications',
      [PERMISSIONS.SCHEDULE_INTERVIEW]: 'Schedule Interviews',
      [PERMISSIONS.CONDUCT_INTERVIEW]: 'Conduct Interviews',
      [PERMISSIONS.EDIT_INTERVIEW]: 'Edit Interviews',
      [PERMISSIONS.VIEW_INTERVIEWS]: 'View Interviews',
      [PERMISSIONS.VIEW_WORKFLOW]: 'View Workflow',
      [PERMISSIONS.UPDATE_WORKFLOW_STAGE]: 'Update Workflow',
      [PERMISSIONS.MANAGE_DOCUMENTS]: 'Manage Documents',
      [PERMISSIONS.MANAGE_USERS]: 'Manage Users',
      [PERMISSIONS.MANAGE_SETTINGS]: 'Manage Settings',
      [PERMISSIONS.VIEW_AUDIT_LOGS]: 'View Audit Logs',
      [PERMISSIONS.MANAGE_AGENCIES]: 'Manage Agencies',
      [PERMISSIONS.SEND_NOTIFICATIONS]: 'Send Notifications',
      [PERMISSIONS.MANAGE_CALENDAR]: 'Manage Calendar',
      [PERMISSIONS.SCHEDULE_EVENTS]: 'Schedule Events',
      [PERMISSIONS.UPLOAD_DOCUMENTS]: 'Upload Documents',
      [PERMISSIONS.EDIT_DOCUMENTS]: 'Edit Documents',
      [PERMISSIONS.DELETE_DOCUMENTS]: 'Delete Documents',
      [PERMISSIONS.LIMITED_EDIT]: 'Limited Editing'
    }
    return permissionNames[permission] || permission
  }
}

// Create and export singleton instance
const authService = new AuthService()
export default authService