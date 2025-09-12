import authService from './authService.js'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('AuthService', () => {
  beforeEach(() => {
    // Reset auth state and storage before each test
    localStorage.clear()
    authService.logout()
  })

  describe('login', () => {
    test('should login with valid credentials', async () => {
      const result = await authService.login('admin@udaan.com', 'admin123')
      expect(result.user).toBeDefined()
      expect(result.user.username).toBe('admin@udaan.com')
      expect(result.user.role).toBe('admin')
      expect(result.token).toBeDefined()
    })

    test('should reject invalid credentials', async () => {
      await expect(authService.login('invalid', 'invalid'))
        .rejects
        .toThrow('User not found')
    })
  })

  describe('logout', () => {
    test('should clear user data from localStorage', async () => {
      // Login first
      await authService.login('admin@udaan.com', 'admin123')
      
      // Verify data is stored
      expect(localStorage.getItem('udaan_token')).toBeDefined()
      expect(localStorage.getItem('udaan_user')).toBeDefined()
      
      // Logout
      authService.logout()
      
      // Verify data is cleared
      expect(localStorage.getItem('udaan_token')).toBeNull()
      expect(localStorage.getItem('udaan_user')).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    test('should return null when no user is logged in', () => {
      const user = authService.getCurrentUser()
      expect(user).toBeNull()
    })

    test('should return user data when logged in', async () => {
      // Login first
      await authService.login('admin@udaan.com', 'admin123')
      
      const user = authService.getCurrentUser()
      expect(user).toBeDefined()
      expect(user.username).toBe('admin@udaan.com')
    })
  })

  describe('isAuthenticated', () => {
    test('should return false when not logged in', () => {
      expect(authService.isUserAuthenticated()).toBe(false)
    })

    test('should return true when logged in with valid session', async () => {
      // Login first
      await authService.login('admin@udaan.com', 'admin123')
      
      expect(authService.isUserAuthenticated()).toBe(true)
    })
  })

  describe('hasRole', () => {
    test('should return false when not logged in', () => {
      expect(authService.hasRole('admin')).toBe(false)
    })

    test('should return true for matching role', async () => {
      // Login first
      await authService.login('admin@udaan.com', 'admin123')
      
      expect(authService.hasRole('admin')).toBe(true)
    })

    test('should return false for non-matching role', async () => {
      // Login as recruiter
      await authService.login('recruiter@udaan.com', 'recruit123')
      
      expect(authService.hasRole('admin')).toBe(false)
    })
    
    // Role checks are strict equality; admin does not impersonate other roles
  })
})