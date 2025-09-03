import { render, act } from '@testing-library/react'
import { UserProvider, useUser } from './UserContext'
import AuthService from '../services/authService'

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

// Mock AuthService
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  isAuthenticated: jest.fn(),
  getUserPermissions: jest.fn()
}))

// Test component to use the context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useUser()
  return (
    <div>
      <div data-testid="user-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user-name">{user ? user.name : 'no-user'}</div>
      <button data-testid="login-button" onClick={() => login('test', 'test')}>Login</button>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  )
}

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test('should provide default values', () => {
    AuthService.getCurrentUser.mockReturnValue(null)
    AuthService.isAuthenticated.mockReturnValue(false)
    
    const { getByTestId } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    expect(getByTestId('user-status').textContent).toBe('not-authenticated')
    expect(getByTestId('user-name').textContent).toBe('no-user')
  })

  test('should update state on login', async () => {
    const mockUser = { id: 1, name: 'Test User', role: 'admin' }
    AuthService.login.mockResolvedValue({ success: true, user: mockUser })
    
    const { getByTestId } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    await act(async () => {
      getByTestId('login-button').click()
    })
    
    expect(getByTestId('user-status').textContent).toBe('authenticated')
    expect(getByTestId('user-name').textContent).toBe('Test User')
  })

  test('should update state on logout', async () => {
    // First login
    const mockUser = { id: 1, name: 'Test User', role: 'admin' }
    AuthService.getCurrentUser.mockReturnValue(mockUser)
    AuthService.isAuthenticated.mockReturnValue(true)
    
    const { getByTestId } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )
    
    // Verify logged in
    expect(getByTestId('user-status').textContent).toBe('authenticated')
    expect(getByTestId('user-name').textContent).toBe('Test User')
    
    // Logout
    await act(async () => {
      getByTestId('logout-button').click()
    })
    
    // Verify logged out
    expect(getByTestId('user-status').textContent).toBe('not-authenticated')
    expect(getByTestId('user-name').textContent).toBe('no-user')
  })
})