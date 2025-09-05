// auditTestHelper.js - Helper functions for testing audit logging in browser console
// Access via window.auditTest in browser console

import {
  logJobAudit,
  logApplicationAudit,
  logInterviewAudit,
  logWorkflowAudit,
  logAgencySettingsAudit,
  logDraftAudit,
  logAuthAudit
} from './auditHelper.js'
import { auditService } from '../services/index.js'
import authService from '../services/authService.js'

// Test audit logging functions
const auditTest = {
  // Job audit tests
  async testJobCreate(jobId = 'test-job-001') {
    await logJobAudit('CREATE', jobId, 'Created new job posting for Cook position', {
      title: 'Cook',
      country: 'UAE',
      salary: '1200 AED'
    })
    console.log('✅ Job create audit logged')
  },

  async testJobUpdate(jobId = 'test-job-001') {
    await logJobAudit('UPDATE', jobId, 'Updated job requirements and salary', {
      changes: ['requirements', 'salary'],
      previousSalary: '1000 AED',
      newSalary: '1200 AED'
    })
    console.log('✅ Job update audit logged')
  },

  async testJobDelete(jobId = 'test-job-001') {
    await logJobAudit('DELETE', jobId, 'Removed job posting due to closure', {
      reason: 'Position filled',
      deletedBy: 'admin'
    })
    console.log('✅ Job delete audit logged')
  },

  // Application audit tests
  async testApplicationCreate(applicationId = 'app-001') {
    await logApplicationAudit('CREATE', applicationId, 'Candidate applied for Cook position', {
      candidateName: 'John Doe',
      jobId: 'job-001'
    })
    console.log('✅ Application create audit logged')
  },

  async testApplicationUpdate(applicationId = 'app-001') {
    await logApplicationAudit('UPDATE', applicationId, 'Updated application status to Shortlisted', {
      previousStatus: 'Applied',
      newStatus: 'Shortlisted',
      updatedBy: 'recruiter'
    })
    console.log('✅ Application update audit logged')
  },

  // Interview audit tests
  async testInterviewSchedule(interviewId = 'int-001') {
    await logInterviewAudit('CREATE', interviewId, 'Scheduled interview with candidate', {
      candidateName: 'John Doe',
      scheduledAt: new Date().toISOString(),
      duration: 60
    })
    console.log('✅ Interview schedule audit logged')
  },

  async testInterviewComplete(interviewId = 'int-001') {
    await logInterviewAudit('UPDATE', interviewId, 'Interview completed with outcome', {
      outcome: 'Passed',
      score: 85,
      notes: 'Good technical skills, needs training on company processes'
    })
    console.log('✅ Interview complete audit logged')
  },

  // Workflow audit tests
  async testWorkflowUpdate(workflowId = 'wf-001') {
    await logWorkflowAudit('UPDATE', workflowId, 'Moved candidate to Document Verification stage', {
      previousStage: 'Interview Passed',
      newStage: 'Document Verification',
      documentsRequired: ['passport', 'visa']
    })
    console.log('✅ Workflow update audit logged')
  },

  // Agency settings audit tests
  async testAgencySettingsUpdate() {
    await logAgencySettingsAudit('UPDATE', 'Updated agency contact information', {
      fieldsUpdated: ['phone', 'email', 'address']
    })
    console.log('✅ Agency settings update audit logged')
  },

  // Draft audit tests
  async testDraftCreate(draftId = 'draft-001') {
    await logDraftAudit('CREATE', draftId, 'Created new job draft from newspaper', {
      source: 'newspaper',
      country: 'UAE'
    })
    console.log('✅ Draft create audit logged')
  },

  async testDraftPublish(draftId = 'draft-001') {
    await logDraftAudit('UPDATE', draftId, 'Published draft as live job posting', {
      jobId: 'job-001',
      publishedBy: 'recruiter'
    })
    console.log('✅ Draft publish audit logged')
  },

  // Auth audit tests
  async testUserLogin(username = 'testuser') {
    await logAuthAudit('LOGIN', username, 'User successfully logged in', {
      ipAddress: '127.0.0.1',
      userAgent: navigator.userAgent
    })
    console.log('✅ User login audit logged')
  },

  async testUserLogout(username = 'testuser') {
    await logAuthAudit('LOGOUT', username, 'User logged out', {
      sessionDuration: '2h 30m'
    })
    console.log('✅ User logout audit logged')
  },

  // Bulk operations
  async testBulkOperations() {
    console.log('🧪 Testing bulk audit operations...')

    // Create multiple audit entries
    await this.testJobCreate('bulk-job-001')
    await this.testJobCreate('bulk-job-002')
    await this.testApplicationCreate('bulk-app-001')
    await this.testInterviewSchedule('bulk-int-001')

    console.log('✅ Bulk operations audit logged')
  },

  // Test data retrieval
  async getRecentLogs(limit = 10) {
    try {
      const logs = await auditService.getAuditLogs()
      const recentLogs = logs.slice(0, limit)
      console.table(recentLogs)
      return recentLogs
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  },

  async searchLogs(searchTerm) {
    try {
      const logs = await auditService.getAuditLogs()
      const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
      console.table(filteredLogs)
      return filteredLogs
    } catch (error) {
      console.error('Failed to search audit logs:', error)
    }
  },

  // Test user context switching (simulated)
  async testUserContextSwitching() {
    console.log('🔄 Testing user context switching...')

    // Get current user
    const currentUser = authService.getCurrentUser()
    console.log('Current user:', currentUser)

    // Simulate switching users (in a real app, this would involve actual login)
    console.log('Simulating user context switch...')

    // Log an action with different user context
    await logJobAudit('CREATE', 'context-test-001', 'Created by simulated user context')
    console.log('✅ Context switch test completed')
  },

  // Performance test
  async performanceTest(count = 100) {
    console.log(`🚀 Testing audit logging performance with ${count} entries...`)
    const startTime = performance.now()

    for (let i = 0; i < count; i++) {
      await logJobAudit('CREATE', `perf-test-${i}`, `Performance test entry ${i}`, {
        batch: 'performance-test',
        index: i
      })
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    console.log(`✅ Performance test completed in ${duration.toFixed(2)}ms for ${count} entries`)
    console.log(`Average: ${(duration / count).toFixed(2)}ms per entry`)
  },

  // Export all test functions
  getAllTestFunctions() {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(name => name.startsWith('test') && typeof this[name] === 'function')
  }
}

// Make auditTest available globally for browser console access
if (typeof window !== 'undefined') {
  window.auditTest = auditTest
  console.log('🎯 Audit test helper loaded. Access via window.auditTest')
  console.log('Available functions:', auditTest.getAllTestFunctions())
  console.log('Example usage: await window.auditTest.testJobCreate()')
}

export default auditTest