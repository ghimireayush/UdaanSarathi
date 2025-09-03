// Application Service - Handles all application-related operations
import applicationsData from '../data/applications.json'
import candidateService from './candidateService.js'
import jobService from './jobService.js'
import constantsService from './constantsService.js'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let applicationsCache = deepClone(applicationsData)

class ApplicationService {
  /**
   * Get all applications with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications
   */
  async getApplications(filters = {}) {
    await delay()
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch applications')
    }

    let filteredApplications = [...applicationsCache]

    // Apply filters
    if (filters.stage && filters.stage !== 'all') {
      filteredApplications = filteredApplications.filter(app => app.stage === filters.stage)
    }

    if (filters.job_id) {
      filteredApplications = filteredApplications.filter(app => app.job_id === filters.job_id)
    }

    if (filters.candidate_id) {
      filteredApplications = filteredApplications.filter(app => app.candidate_id === filters.candidate_id)
    }

    if (filters.status && filters.status !== 'all') {
      filteredApplications = filteredApplications.filter(app => app.status === filters.status)
    }

    if (filters.priority_min) {
      filteredApplications = filteredApplications.filter(app => app.priority_score >= filters.priority_min)
    }

    if (filters.search) {
      // We'll need to get candidate and job data for search
      const candidates = await candidateService.getCandidates()
      const jobs = await jobService.getJobs()
      
      const searchTerm = filters.search.toLowerCase()
      filteredApplications = filteredApplications.filter(app => {
        const candidate = candidates.find(c => c.id === app.candidate_id)
        const job = jobs.find(j => j.id === app.job_id)
        
        return (candidate && (
          candidate.name.toLowerCase().includes(searchTerm) ||
          candidate.phone.includes(searchTerm) ||
          candidate.email.toLowerCase().includes(searchTerm)
        )) || (job && (
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm)
        ))
      })
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredApplications.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.applied_at) - new Date(a.applied_at)
          case 'oldest':
            return new Date(a.applied_at) - new Date(b.applied_at)
          case 'priority_score':
            return b.priority_score - a.priority_score
          case 'stage':
            return a.stage.localeCompare(b.stage)
          default:
            return 0
        }
      })
    }

    return filteredApplications
  }

  /**
   * Get applications with detailed candidate and job information
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications with candidate and job details
   */
  async getApplicationsWithDetails(filters = {}) {
    await delay(400)
    const applications = await this.getApplications(filters)
    const candidates = await candidateService.getCandidates()
    const jobs = await jobService.getJobs()

    return applications.map(app => ({
      ...app,
      candidate: candidates.find(c => c.id === app.candidate_id),
      job: jobs.find(j => j.id === app.job_id)
    }))
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Application object or null if not found
   */
  async getApplicationById(applicationId) {
    await delay(200)
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch application')
    }

    const application = applicationsCache.find(app => app.id === applicationId)
    return application ? deepClone(application) : null
  }

  /**
   * Create new application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  async createApplication(applicationData) {
    await delay(500)
    if (shouldSimulateError()) {
      throw new Error('Failed to create application')
    }

    const constants = await constantsService.getApplicationStages()
    const newApplication = {
      id: `app_${Date.now()}`,
      ...applicationData,
      stage: constants.APPLIED,
      applied_at: new Date().toISOString(),
      shortlisted_at: null,
      interviewed_at: null,
      decision_at: null,
      status: 'active',
      notes: '',
      recruiter_notes: ''
    }

    applicationsCache.push(newApplication)
    return deepClone(newApplication)
  }

  /**
   * Update application
   * @param {string} applicationId - Application ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async updateApplication(applicationId, updateData) {
    await delay(400)
    if (shouldSimulateError()) {
      throw new Error('Failed to update application')
    }

    const applicationIndex = applicationsCache.findIndex(app => app.id === applicationId)
    if (applicationIndex === -1) {
      return null
    }

    applicationsCache[applicationIndex] = {
      ...applicationsCache[applicationIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(applicationsCache[applicationIndex])
  }

  /**
   * Delete application
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteApplication(applicationId) {
    await delay(300)
    if (shouldSimulateError()) {
      throw new Error('Failed to delete application')
    }

    const applicationIndex = applicationsCache.findIndex(app => app.id === applicationId)
    if (applicationIndex === -1) {
      return false
    }

    applicationsCache.splice(applicationIndex, 1)
    return true
  }

  /**
   * Update application stage
   * @param {string} applicationId - Application ID
   * @param {string} newStage - New application stage
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async updateApplicationStage(applicationId, newStage) {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    const updateData = { stage: newStage }
    
    // Add appropriate timestamp based on stage
    switch (newStage) {
      case constants.SHORTLISTED:
        updateData.shortlisted_at = new Date().toISOString()
        break
      case constants.INTERVIEWED:
        updateData.interviewed_at = new Date().toISOString()
        break
      case constants.SELECTED:
      case constants.REJECTED:
        updateData.decision_at = new Date().toISOString()
        break
    }

    return this.updateApplication(applicationId, updateData)
  }

  /**
   * Shortlist application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async shortlistApplication(applicationId, notes = '') {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    
    return this.updateApplication(applicationId, {
      stage: constants.SHORTLISTED,
      shortlisted_at: new Date().toISOString(),
      recruiter_notes: notes
    })
  }

  /**
   * Reject application
   * @param {string} applicationId - Application ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async rejectApplication(applicationId, reason = '') {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    
    return this.updateApplication(applicationId, {
      stage: constants.REJECTED,
      decision_at: new Date().toISOString(),
      notes: reason,
      status: 'rejected'
    })
  }

  /**
   * Select application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async selectApplication(applicationId, notes = '') {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    
    return this.updateApplication(applicationId, {
      stage: constants.SELECTED,
      decision_at: new Date().toISOString(),
      recruiter_notes: notes
    })
  }

  /**
   * Get applications by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of applications for the job
   */
  async getApplicationsByJobId(jobId) {
    await delay(200)
    return applicationsCache.filter(app => app.job_id === jobId)
  }

  /**
   * Get applications by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of applications by the candidate
   */
  async getApplicationsByCandidateId(candidateId) {
    await delay(200)
    return applicationsCache.filter(app => app.candidate_id === candidateId)
  }

  /**
   * Get applications by stage
   * @param {string} stage - Application stage
   * @returns {Promise<Array>} Array of applications in specified stage
   */
  async getApplicationsByStage(stage) {
    await delay(200)
    return applicationsCache.filter(app => app.stage === stage)
  }

  /**
   * Get application statistics
   * @returns {Promise<Object>} Application statistics
   */
  async getApplicationStatistics() {
    await delay(200)
    const stats = {
      total: applicationsCache.length,
      byStage: {},
      byStatus: {},
      averagePriorityScore: 0,
      conversionRates: {},
      processingTimes: {}
    }

    // Group by stage
    applicationsCache.forEach(app => {
      stats.byStage[app.stage] = (stats.byStage[app.stage] || 0) + 1
    })

    // Group by status
    applicationsCache.forEach(app => {
      stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1
    })

    // Calculate average priority score
    const totalScore = applicationsCache.reduce((sum, app) => sum + app.priority_score, 0)
    stats.averagePriorityScore = applicationsCache.length > 0 ? totalScore / applicationsCache.length : 0

    // Calculate conversion rates
    const constants = await constantsService.getApplicationStages()
    const appliedCount = stats.byStage[constants.APPLIED] || 0
    const shortlistedCount = stats.byStage[constants.SHORTLISTED] || 0
    const interviewedCount = stats.byStage[constants.INTERVIEWED] || 0
    const selectedCount = stats.byStage[constants.SELECTED] || 0

    if (appliedCount > 0) {
      stats.conversionRates.applicationToShortlist = (shortlistedCount / appliedCount) * 100
      stats.conversionRates.applicationToInterview = (interviewedCount / appliedCount) * 100
      stats.conversionRates.applicationToSelection = (selectedCount / appliedCount) * 100
    }

    return stats
  }

  /**
   * Get recent applications
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Promise<Array>} Array of recent applications
   */
  async getRecentApplications(days = 7) {
    await delay(200)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return applicationsCache.filter(app => new Date(app.applied_at) >= cutoffDate)
  }

  /**
   * Get top priority applications
   * @param {number} limit - Number of applications to return (default: 10)
   * @returns {Promise<Array>} Array of high-priority applications
   */
  async getTopPriorityApplications(limit = 10) {
    await delay(200)
    return applicationsCache
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, limit)
  }

  /**
   * Bulk update application stages
   * @param {Array} applicationIds - Array of application IDs
   * @param {string} newStage - New stage for all applications
   * @returns {Promise<Array>} Array of updated applications
   */
  async bulkUpdateStage(applicationIds, newStage) {
    await delay(500)
    const updatedApplications = []
    
    for (const appId of applicationIds) {
      const updated = await this.updateApplicationStage(appId, newStage)
      if (updated) {
        updatedApplications.push(updated)
      }
    }
    
    return updatedApplications
  }

  /**
   * Get applications requiring action
   * @returns {Promise<Array>} Array of applications that need attention
   */
  async getApplicationsRequiringAction() {
    await delay(200)
    const constants = await constantsService.getApplicationStages()
    
    // Applications that have been in applied stage for more than 3 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 3)
    
    return applicationsCache.filter(app => 
      app.stage === constants.APPLIED && 
      new Date(app.applied_at) <= cutoffDate
    )
  }

  /**
   * Get duplicate applications (same candidate applying for same job)
   * @returns {Promise<Array>} Array of duplicate applications
   */
  async getDuplicateApplications() {
    await delay(200)
    const seen = new Set()
    const duplicates = []
    
    applicationsCache.forEach(app => {
      const key = `${app.candidate_id}_${app.job_id}`
      if (seen.has(key)) {
        duplicates.push(app)
      } else {
        seen.add(key)
      }
    })
    
    return duplicates
  }

  /**
   * Get candidates by workflow stage with job details
   * @param {string} stage - Workflow stage
   * @returns {Promise<Array>} Array of candidates with application and job details
   */
  async getCandidatesByStage(stage) {
    await delay(300)
    const applications = applicationsCache.filter(app => app.stage === stage)
    const jobs = await jobService.getJobs()
    
    return applications.map(app => {
      const job = jobs.find(j => j.id === app.job_id)
      return {
        ...app,
        job_title: job?.title,
        job_company: job?.company,
        interviewed_at: app.interviewed_at,
        interview_remarks: app.interview_remarks || app.recruiter_notes || app.notes,
        interview_type: app.interview_type,
        documents: Array.isArray(app.documents) ? app.documents : []
      }
    })
  }

  /**
   * Get all candidates in workflow (post-interview stages)
   * @returns {Promise<Array>} Array of all workflow candidates
   */
  async getAllCandidatesInWorkflow() {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    const workflowStages = [
      'applied',
      'shortlisted',
      'interview-scheduled',
      'interview-passed',
      'medical-scheduled',
      'medical-passed',
      'visa-application',
      'visa-approved',
      'police-clearance',
      'embassy-attestation',
      'travel-documents',
      'flight-booking',
      'pre-departure',
      'departed',
      'ready-to-fly'
    ]
    
    const applications = applicationsCache.filter(app => 
      workflowStages.includes(app.stage)
    )
    
    const jobs = await jobService.getJobs()
    
    return applications.map(app => {
      const job = jobs.find(j => j.id === app.job_id)
      return {
        ...app,
        job_title: job?.title,
        job_company: job?.company,
        interviewed_at: app.interviewed_at,
        interview_remarks: app.interview_remarks || app.recruiter_notes || app.notes,
        interview_type: app.interview_type,
        documents: Array.isArray(app.documents) ? app.documents : []
      }
    })
  }

  /**
   * Attach document to candidate application
   * @param {string} candidateId - Candidate ID
   * @param {Object} document - Document details
   * @returns {Promise<boolean>} Success status
   */
  async attachDocument(candidateId, document) {
    await delay(300)
    if (shouldSimulateError()) {
      throw new Error('Failed to attach document')
    }

    const application = applicationsCache.find(app => app.candidate_id === candidateId)
    if (!application) {
      return false
    }

    if (!application.documents) {
      application.documents = []
    }

    const newDocument = {
      id: `doc_${Date.now()}`,
      ...document,
      uploaded_at: new Date().toISOString()
    }

    application.documents.push(newDocument)
    return true
  }
}

// Create and export singleton instance
const applicationService = new ApplicationService()
export default applicationService