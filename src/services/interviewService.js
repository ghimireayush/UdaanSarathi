// Interview Service - Handles all interview-related operations
import interviewsData from '../data/interviews.json'
import candidateService from './candidateService.js'
import jobService from './jobService.js'
import applicationService from './applicationService.js'
import constantsService from './constantsService.js'
import { handleServiceError } from '../utils/errorHandler.js'

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

    interviewsCache[interviewIndex] = {
      ...interviewsCache[interviewIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(interviewsCache[interviewIndex])
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
    
    return this.updateInterview(interviewId, {
      status: constants.CANCELLED,
      notes: reason
    })
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
    
    const updatedInterview = await this.updateInterview(interviewId, {
      status: constants.COMPLETED,
      ...completionData
    })

    // Update candidate stage to interviewed
    if (updatedInterview && updatedInterview.candidate_id) {
      const appConstants = await constantsService.getApplicationStages()
      await candidateService.updateCandidateStage(
        updatedInterview.candidate_id, 
        appConstants.INTERVIEWED
      )
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
    
    return this.updateInterview(interviewId, {
      status: constants.NO_SHOW,
      notes: notes
    })
  }

  /**
   * Reschedule interview
   * @param {string} interviewId - Interview ID
   * @param {string} newDateTime - New scheduled date and time
   * @returns {Promise<Object|null>} Updated interview or null if not found
   */
  async rescheduleInterview(interviewId, newDateTime) {
    await delay(300)
    return this.updateInterview(interviewId, {
      scheduled_at: newDateTime
    })
  }

  /**
   * Get interviews by date range
   * @param {string} startDate - Start date (ISO string)
   * @param {string} endDate - End date (ISO string)
   * @returns {Promise<Array>} Array of interviews in date range
   */
  async getInterviewsByDateRange(startDate, endDate) {
    await delay(200)
    return interviewsCache.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      return interviewDate >= new Date(startDate) && interviewDate <= new Date(endDate)
    })
  }

  /**
   * Get today's interviews
   * @returns {Promise<Array>} Array of interviews scheduled for today
   */
  async getTodaysInterviews() {
    await delay(200)
    const today = new Date()
    const todayStr = today.toDateString()
    
    return interviewsCache.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      return interviewDate.toDateString() === todayStr
    })
  }

  /**
   * Get upcoming interviews
   * @param {number} days - Number of days ahead to look (default: 7)
   * @returns {Promise<Array>} Array of upcoming interviews
   */
  async getUpcomingInterviews(days = 7) {
    await delay(200)
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + days)
    
    return interviewsCache.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      return interviewDate >= now && interviewDate <= futureDate
    })
  }

  /**
   * Get interviews by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of interviews for the candidate
   */
  async getInterviewsByCandidateId(candidateId) {
    await delay(200)
    return interviewsCache.filter(interview => interview.candidate_id === candidateId)
  }

  /**
   * Get interviews by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of interviews for the job
   */
  async getInterviewsByJobId(jobId) {
    await delay(200)
    return interviewsCache.filter(interview => interview.job_id === jobId)
  }

  /**
   * Get interviews by interviewer
   * @param {string} interviewer - Interviewer name
   * @returns {Promise<Array>} Array of interviews conducted by the interviewer
   */
  async getInterviewsByInterviewer(interviewer) {
    await delay(200)
    return interviewsCache.filter(interview => 
      interview.interviewer.toLowerCase().includes(interviewer.toLowerCase())
    )
  }

  /**
   * Check for double booking conflicts
   * @param {string} candidateId - Candidate ID
   * @param {string} proposedDateTime - Proposed interview date/time
   * @param {number} duration - Interview duration in minutes
   * @param {string} excludeInterviewId - Interview ID to exclude from conflict check
   * @returns {Promise<Array>} Array of conflicting interviews
   */
  async checkDoubleBooking(candidateId, proposedDateTime, duration = 60, excludeInterviewId = null) {
    return handleServiceError(async () => {
      await delay(100)
      
      const proposedStart = new Date(proposedDateTime)
      const proposedEnd = new Date(proposedStart.getTime() + (duration * 60 * 1000))
      
      const conflicts = interviewsCache.filter(interview => {
        // Skip if it's the same interview being updated
        if (excludeInterviewId && interview.id === excludeInterviewId) return false
        
        // Only check for the same candidate
        if (interview.candidate_id !== candidateId) return false
        
        // Skip cancelled interviews
        if (interview.status === 'cancelled') return false
        
        const existingStart = new Date(interview.scheduled_at)
        const existingEnd = new Date(existingStart.getTime() + ((interview.duration || 60) * 60 * 1000))
        
        // Check for time overlap
        return (proposedStart < existingEnd && proposedEnd > existingStart)
      })
      
      return conflicts
    })
  }

  /**
   * Schedule interview with double-booking prevention
   * @param {Object} interviewData - Interview data
   * @returns {Promise<Object>} Created interview
   */
  async scheduleInterviewSafe(interviewData) {
    return handleServiceError(async () => {
      // Check for double booking first
      const conflicts = await this.checkDoubleBooking(
        interviewData.candidate_id,
        interviewData.scheduled_at,
        interviewData.duration || 60
      )
      
      if (conflicts.length > 0) {
        throw new Error(`Double booking detected. Candidate already has an interview scheduled at ${conflicts[0].scheduled_at}`)
      }
      
      // Proceed with scheduling if no conflicts
      return this.scheduleInterview(interviewData)
    })
  }

  /**
   * Get interview statistics
   * @returns {Promise<Object>} Interview statistics
   */
  async getInterviewStatistics() {
    await delay(200)
    const constants = await constantsService.getInterviewStatuses()
    
    const stats = {
      total: interviewsCache.length,
      byStatus: {},
      byType: {},
      completionRate: 0,
      averageDuration: 0,
      averageScore: 0,
      successRate: 0,
      monthlyTrend: []
    }

    // Group by status
    interviewsCache.forEach(interview => {
      stats.byStatus[interview.status] = (stats.byStatus[interview.status] || 0) + 1
    })

    // Group by type
    interviewsCache.forEach(interview => {
      stats.byType[interview.type] = (stats.byType[interview.type] || 0) + 1
    })

    // Calculate completion rate
    const completedCount = stats.byStatus[constants.COMPLETED] || 0
    stats.completionRate = stats.total > 0 ? (completedCount / stats.total) * 100 : 0

    // Calculate average duration
    const totalDuration = interviewsCache.reduce((sum, interview) => sum + interview.duration, 0)
    stats.averageDuration = stats.total > 0 ? totalDuration / stats.total : 0

    // Calculate average score (for completed interviews with scores)
    const completedWithScores = interviewsCache.filter(interview => 
      interview.status === constants.COMPLETED && interview.score !== null
    )
    if (completedWithScores.length > 0) {
      const totalScore = completedWithScores.reduce((sum, interview) => sum + interview.score, 0)
      stats.averageScore = totalScore / completedWithScores.length
    }

    // Calculate success rate (interviews marked as passed)
    const passedInterviews = interviewsCache.filter(interview => 
      interview.result === 'passed' || 
      (interview.recommendation && interview.recommendation.toLowerCase().includes('recommend'))
    )
    stats.successRate = completedCount > 0 ? (passedInterviews.length / completedCount) * 100 : 0

    return stats
  }

  /**
   * Get available time slots for scheduling
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} interviewer - Interviewer name (optional)
   * @returns {Promise<Array>} Array of available time slots
   */
  async getAvailableTimeSlots(date, interviewer = null) {
    await delay(200)
    
    // Get existing interviews for the date
    const dayInterviews = interviewsCache.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      const targetDate = new Date(date)
      return interviewDate.toDateString() === targetDate.toDateString() &&
             (!interviewer || interview.interviewer === interviewer)
    })

    // Generate time slots (9 AM to 6 PM, 30-minute intervals)
    const timeSlots = []
    const startHour = 9
    const endHour = 18
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Check if slot is available
        const isBooked = dayInterviews.some(interview => {
          const interviewTime = new Date(interview.scheduled_at)
          const slotTime = `${interviewTime.getHours().toString().padStart(2, '0')}:${interviewTime.getMinutes().toString().padStart(2, '0')}`
          return slotTime === timeSlot
        })

        if (!isBooked) {
          timeSlots.push({
            time: timeSlot,
            available: true
          })
        }
      }
    }

    return timeSlots
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