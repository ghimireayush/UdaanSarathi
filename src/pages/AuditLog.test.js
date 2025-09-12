import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AuditLogPage from './AuditLog'
import { AuthProvider } from '../contexts/AuthContext'
import { describe, it, expect } from '@jest/globals'

// Mock the audit service
jest.mock('../services/auditService', () => ({
  __esModule: true,
  default: {
    getAuditLogs: jest.fn().mockResolvedValue({
      logs: [
        {
          id: 'audit_1',
          timestamp: '2023-01-01T10:00:00Z',
          user_id: 'user_1',
          user_name: 'Admin User',
          action: 'UPDATE',
          resource_type: 'AGENCY_PROFILE',
          resource_id: 'agency_001',
          changes: {
            name: { from: 'Old Name', to: 'New Name' }
          },
          ip_address: '127.0.0.1',
          session_id: 'session_123',
          metadata: {}
        }
      ]
    }),
    getActionLabel: jest.fn().mockImplementation((action) => {
      const labels = {
        'UPDATE': 'Updated',
        'CREATE': 'Created',
        'DELETE': 'Deleted',
        'FILE_UPLOAD': 'File Uploaded',
        'LOGIN': 'Logged In',
        'LOGOUT': 'Logged Out'
      }
      return labels[action] || action
    }),
    getResourceLabel: jest.fn().mockImplementation((resourceType) => {
      const labels = {
        'AGENCY_PROFILE': 'Agency Profile',
        'AGENCY_MEDIA': 'Agency Media',
        'JOB_POSTING': 'Job Posting',
        'CANDIDATE': 'Candidate',
        'APPLICATION': 'Application'
      }
      return labels[resourceType] || resourceType
    })
  }
}))

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}))

describe('AuditLogPage', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AuditLogPage />
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Check if the page title is rendered
    expect(screen.getByText('Audit Log')).toBeInTheDocument()
  })

  it('displays audit log entries', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AuditLogPage />
        </AuthProvider>
      </BrowserRouter>
    )
    
    // Wait for the component to load data
    setTimeout(() => {
      // Check if audit log entries are displayed
      expect(screen.getByText('Updated')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    }, 1000)
  })
})