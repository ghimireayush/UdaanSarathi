// Interview Service - Handles all interview-related operations
import interviewsData from '../data/interviews.json'
import candidateService from './candidateService.js'
import jobService from './jobService.js'
import applicationService from './applicationService.js'
import constantsService from './constantsService.js'
import { handleServiceError } from '../utils/errorHandler.js'
import auditService from './auditService.js'
import authService from './authService.js'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let interviewsCache = deepClone(interviewsData)

class InterviewService {
  /**
   * Get all interviews (alias for getInterviews)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of interviews
   */
  async getAllInterviews(filters = {}) {
    return this.getInterviews(filters)
  }

  /**
   * Get all interviews with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of interviews
   */
  async getInterviews(filters = {}) {
    return handleServiceError(async () => {
      await delay()
      if (shouldSimulateError()) {
        throw new Error('Failed to fetch interviews')
      }

      let filteredInterviews = [...interviewsCache]

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        filteredInterviews = filteredInterviews.filter(interview => interview.status === filters.status)
      }

      if (filters.type && filters.type !== 'all') {
        filteredInterviews = filteredInterviews.filter(interview => interview.type === filters.type)
      }

      if (filters.job_id) {
        filteredInterviews = filteredInterviews.filter(interview => interview.job_id === filters.job_id)
      }

      if (filters.candidate_id) {
        filteredInterviews = filteredInterviews.filter(interview => interview.candidate_id === filters.candidate_id)
      }

      if (filters.interviewer) {
        filteredInterviews = filteredInterviews.filter(interview => 
          interview.interviewer.toLowerCase().includes(filters.interviewer.toLowerCase())
        )
      }

      if (filters.date) {
        const filterDate = new Date(filters.date)
        filteredInterviews = filteredInterviews.filter(interview => {
          const interviewDate = new Date(interview.scheduled_at)
          return interviewDate.toDateString() === filterDate.toDateString()
        })
      }

      if (filters.dateRange) {
        const { start, end } = filters.dateRange
        filteredInterviews = filteredInterviews.filter(interview => {
          const interviewDate = new Date(interview.scheduled_at)
          return interviewDate >= new Date(start) && interviewDate <= new Date(end)
        })
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredInterviews.sort((a, b) => {
          switch (filters.sortBy) {
            case 'newest':
              return new Date(b.scheduled_at) - new Date(a.scheduled_at)
            case 'oldest':
              return new Date(a.scheduled_at) - new Date(b.scheduled_at)
            case 'interviewer':
              return a.interviewer.localeCompare(b.interviewer)
            case 'duration':
              return b.duration - a.duration
            case 'status':
              return a.status.localeCompare(b.status)
            default:
              return 0
          }
        })
      }

      return filteredInterviews
    }, 3, 500);
  }

  /**
   * Get interviews with detailed candidate and job information
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of interviews with candidate and job details
   */
  async getInterviewsWithDetails(filters = {}) {
    await delay(400)
    const interviews = await this.getInterviews(filters)
    const candidates = await candidateService.getCandidates()
    const jobs = await jobService.getJobs()

    return interviews.map(interview => ({
      ...interview,
      candidate: candidates.find(c => c.id === interview.candidate_id),
      job: jobs.find(j => j.id === interview.job_id)
    }))
  }

  /**
   * Get interview by ID
   * @param {string} interviewId - Interview ID
   * @returns {Promise<Object|null>} Interview object or null if not found
   */
  async getInterviewById(interviewId) {
    return handleServiceError(async () => {
      await delay(200)
      if (shouldSimulateError()) {
        throw new Error('Failed to fetch interview')
      }

      const interview = interviewsCache.find(interview => interview.id === interviewId)
      return interview ? deepClone(interview) : null
    }, 3, 500);
  }

  /**
   * Schedule new interview
   * @param {Object} interviewData - Interview data
   * @returns {Promise<Object>} Created interview
   */
  async scheduleInterview(interviewData) {
    return handleServiceError(async () => {
      await delay(500)
      if (shouldSimulateError()) {
        throw new Error('Failed to schedule interview')
      }

      const constants = await constantsService.getInterviewStatuses()
      const newInterview = {
        id: `interview_${Date.now()}`,
        ...interviewData,
        status: constants.SCHEDULED,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        feedback: null,
        score: null,
        recommendation: null
      }

      interviewsCache.push(newInterview)

      // Audit: interview scheduled
      try {
        const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
        await auditService.logEvent({
          user_id: actor.id,
          user_name: actor.name,
          action: 'CREATE',
          resource_type: 'INTERVIEW',
          resource_id: newInterview.id,
          new_values: newInterview
        })
      } catch (e) {
        console.warn('Audit logging (SCHEDULE INTERVIEW) failed:', e)
      }

      // Update candidate stage to scheduled
      if (interviewData.candidate_id) {
        const appConstants = await constantsService.getApplicationStages()
        await candidateService.updateCandidateStage(
          interviewData.candidate_id, 
          appConstants.SCHEDULED
        )
      }

      return deepClone(newInterview)
    }, 3, 500);
  }

  /**
   * Update interview
   * @param {string} interviewId - Interview ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async updateInterview(interviewId, updateData) {
    await delay(400)
    if (shouldSimulateError()) {
      throw new Error('Failed to update interview')
    }

    const interviewIndex = interviewsCache.findIndex(interview => interview.id === interviewId)
    if (interviewIndex === -1) {
      return null
    }

    const before = deepClone(interviewsCache[interviewIndex])
    interviewsCache[interviewIndex] = {
      ...interviewsCache[interviewIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const updated = deepClone(interviewsCache[interviewIndex])
    // Audit: interview updated
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'INTERVIEW',
        resource_id: interviewId,
        changes: updateData,
        old_values: before,
        new_values: updated
      })
    } catch (e) {
      console.warn('Audit logging (UPDATE INTERVIEW) failed:', e)
    }
    return updated
  }

  /**
   * Cancel interview
   * @param {string} interviewId - Interview ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async cancelInterview(interviewId, reason = '') {
    await delay(300)
    const constants = await constantsService.getInterviewStatuses()
    
    const updateData = {
      status: constants.CANCELLED,
      notes: reason
    }
    const res = await this.updateInterview(interviewId, updateData)
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'INTERVIEW',
        resource_id: interviewId,
        changes: updateData,
        metadata: { action: 'CANCEL' }
      })
    } catch (e) {
      console.warn('Audit logging (CANCEL INTERVIEW) failed:', e)
    }
    return res
  }

  /**
   * Complete interview with feedback
   * @param {string} interviewId - Interview ID
   * @param {Object} completionData - Completion data (feedback, score, recommendation)
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async completeInterview(interviewId, completionData) {
    await delay(400)
    const constants = await constantsService.getInterviewStatuses()
    
    const updateData = {
      status: constants.COMPLETED,
      ...completionData
    }
    const updatedInterview = await this.updateInterview(interviewId, updateData)

    // Update candidate stage to interviewed
    if (updatedInterview && updatedInterview.candidate_id) {
      const appConstants = await constantsService.getApplicationStages()
      await candidateService.updateCandidateStage(
        updatedInterview.candidate_id, 
        appConstants.INTERVIEWED
      )
    }

    // Audit: completed interview
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'INTERVIEW',
        resource_id: interviewId,
        changes: updateData,
        metadata: { action: 'COMPLETE' }
      })
    } catch (e) {
      console.warn('Audit logging (COMPLETE INTERVIEW) failed:', e)
    }
    return updatedInterview
  }

  /**
   * Mark interview as no-show
   * @param {string} interviewId - Interview ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async markAsNoShow(interviewId, notes = '') {
    await delay(300)
    const constants = await constantsService.getInterviewStatuses()
    
    const updateData = {
      status: constants.NO_SHOW,
      notes: notes
    }
    const res = await this.updateInterview(interviewId, updateData)
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'INTERVIEW',
        resource_id: interviewId,
        changes: updateData,
        metadata: { action: 'NO_SHOW' }
      })
    } catch (e) {
      console.warn('Audit logging (NO_SHOW INTERVIEW) failed:', e)
    }
    return res
  }

  /**
   * Reschedule interview
   * @param {string} interviewId - Interview ID
   * @param {string} newDateTime - New scheduled date and time
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async rescheduleInterview(interviewId, newDateTime) {
    await delay(300)
    const updateData = { scheduled_at: newDateTime }
    const res = await this.updateInterview(interviewId, updateData)
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'INTERVIEW',
        resource_id: interviewId,
        changes: updateData,
        metadata: { action: 'RESCHEDULE' }
      })
    } catch (e) {
      console.warn('Audit logging (RESCHEDULE INTERVIEW) failed:', e)
    }
    return res
  }

  /**
   * Bulk schedule interviews
   * @param {Array} interviewDataArray - Array of interview data objects
   * @returns {Promise<Array>} Array of scheduled interviews
   */
  async bulkScheduleInterviews(interviewDataArray) {
    await delay(800)
    const scheduledInterviews = []
    
    for (const interviewData of interviewDataArray) {
      try {
        const scheduled = await this.scheduleInterview(interviewData)
        scheduledInterviews.push(scheduled)
      } catch (error) {
        console.error('Failed to schedule interview:', error)
      }
    }

    // Audit: bulk schedule interviews
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'BULK_CREATE',
        resource_type: 'INTERVIEW',
        resource_ids: scheduledInterviews.map(interview => interview.id),
        new_values: scheduledInterviews
      })
    } catch (e) {
      console.warn('Audit logging (BULK SCHEDULE INTERVIEWS) failed:', e)
    }

    return scheduledInterviews
  }

  /**
   * Get interviews requiring follow-up
   * @returns {Promise<Array>} Array of interviews that need follow-up
   */
  async getInterviewsRequiringFollowup() {
    await delay(200)
    const constants = await constantsService.getInterviewStatuses()
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    
    return interviewsCache.filter(interview => 
      interview.status === constants.COMPLETED &&
      new Date(interview.updated_at) <= twoDaysAgo &&
      (!interview.feedback || !interview.recommendation)
    )
  }

  /**
   * Get calendar events for interviews
   * @param {string} startDate - Start date for calendar
   * @param {string} endDate - End date for calendar
   * @returns {Promise<Array>} Array of calendar events
   */
  async getCalendarEvents(startDate, endDate) {
    await delay(200)
    const interviews = await this.getInterviewsByDateRange(startDate, endDate)
    const candidates = await candidateService.getCandidates()
    const jobs = await jobService.getJobs()

    return interviews.map(interview => {
      const candidate = candidates.find(c => c.id === interview.candidate_id)
      const job = jobs.find(j => j.id === interview.job_id)
      
      return {
        id: interview.id,
        title: `${candidate?.name || 'Unknown'} - ${job?.title || 'Unknown'}`,
        start: interview.scheduled_at,
        end: new Date(new Date(interview.scheduled_at).getTime() + interview.duration * 60000).toISOString(),
        extendedProps: {
          interview,
          candidate,
          job,
          type: interview.type,
          status: interview.status,
          interviewer: interview.interviewer,
          location: interview.location
        }
      }
    })
  }
}

// Create and export singleton instance
const interviewService = new InterviewService()
export default interviewService