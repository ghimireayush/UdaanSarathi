// Job Service - Handles all job-related operations
import jobsData from '../data/jobs.json'
import constantsService from './constantsService.js'
import performanceService from './performanceService.js'
import { handleServiceError } from '../utils/errorHandler.js'

// Utility function to simulate API delay (reduced for performance)
const delay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation REMOVED for 100% reliability
// const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let jobsCache = deepClone(jobsData)

class JobService {
  /**
   * Get jobs by IDs (batch fetch for performance)
   * @param {Array} jobIds - Array of job IDs
   * @returns {Promise<Array>} Array of jobs
   */
  async getJobsByIds(jobIds) {
    const cacheKey = `jobs_by_ids_${jobIds.sort().join(',')}`
    
    return await performanceService.getCachedData(cacheKey, async () => {
      return handleServiceError(async () => {
        await delay(20) // Reduced delay for batch operations
        // Removed random error simulation for 100% reliability

        return jobsCache.filter(job => jobIds.includes(job.id))
      }, 3, 500);
    }, 'jobs') // Use jobs cache type
  }

  /**
   * Get all jobs with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of jobs
   */
  async getJobs(filters = {}) {
    const cacheKey = `jobs_${JSON.stringify(filters)}`
    
    return await performanceService.getCachedData(cacheKey, async () => {
      return handleServiceError(async () => {
        await delay(50)
        // Removed random error simulation for 100% reliability

        let filteredJobs = [...jobsCache]

        // Apply filters
        if (filters.status && filters.status !== 'all') {
          filteredJobs = filteredJobs.filter(job => job.status === filters.status)
        }

        if (filters.country && filters.country !== 'All Countries') {
          filteredJobs = filteredJobs.filter(job => job.country === filters.country)
        }

        if (filters.category && filters.category !== 'all') {
          filteredJobs = filteredJobs.filter(job => job.category === filters.category)
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredJobs = filteredJobs.filter(job => 
            job.id.toLowerCase().includes(searchTerm) ||
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm) ||
            job.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            (job.published_at && job.published_at.includes(searchTerm)) ||
            job.created_at.includes(searchTerm)
          );
        }

        // Apply sorting
        if (filters.sortBy) {
          filteredJobs.sort((a, b) => {
            switch (filters.sortBy) {
              case 'published_date':
                const dateA = a.published_at ? new Date(a.published_at) : new Date(a.created_at);
                const dateB = b.published_at ? new Date(b.published_at) : new Date(b.created_at);
                return dateB - dateA;
              case 'applications':
                return (b.applications_count || 0) - (a.applications_count || 0);
              case 'shortlisted':
                return (b.shortlisted_count || 0) - (a.shortlisted_count || 0);
              case 'interviews':
                return (b.interviews_today || 0) - (a.interviews_today || 0);
              case 'salary':
                return b.salary_amount - a.salary_amount;
              case 'title':
                return a.title.localeCompare(b.title);
              default:
                return 0;
            }
          });
        }

        return filteredJobs
      }, 3, 500);
    }, 'jobs') // Use jobs cache type
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Job object or null if not found
   */
  async getJobById(jobId) {
    const result = await handleServiceError(async () => {
      await delay(30)
      // Removed random error simulation for 100% reliability

      const job = jobsCache.find(job => job.id === jobId)
      return job ? deepClone(job) : null
    }, 3, 500);
    
    return result;
  }

  /**
   * Create new job
   * @param {Object} jobData - Job data
   * @returns {Promise<Object>} Created job
   */
  async createJob(jobData) {
    const result = await handleServiceError(async () => {
      await delay(80)
      // Removed random error simulation for 100% reliability

      const newJob = {
        id: `job_${Date.now()}`,
        ...jobData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        applications_count: 0,
        shortlisted_count: 0,
        interviews_today: 0,
        total_interviews: 0,
        view_count: 0
      }

      jobsCache.push(newJob)
      return deepClone(newJob)
    }, 3, 500);
    
    return result;
  }

  /**
   * Create new draft job
   * @param {Object} draftData - Draft job data
   * @returns {Promise<Object>} Created draft job
   */
  async createDraftJob(draftData) {
    const result = await handleServiceError(async () => {
      await delay(80)
      // Removed random error simulation for 100% reliability

      const constants = await constantsService.getJobStatuses()
      
      const newDraft = {
        id: `job_${Date.now()}`,
        ...draftData,
        status: constants.DRAFT,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        applications_count: 0,
        shortlisted_count: 0,
        interviews_today: 0,
        total_interviews: 0,
        view_count: 0
      }

      jobsCache.push(newDraft)
      return deepClone(newDraft)
    }, 3, 500);
    
    return result;
  }

  /**
   * Create bulk draft jobs
   * @param {Array} draftDataArray - Array of draft job data
   * @returns {Promise<Array>} Created draft jobs
   */
  async createBulkDraftJobs(draftDataArray) {
    const result = await handleServiceError(async () => {
      await delay(100)
      // Removed random error simulation for 100% reliability

      const constants = await constantsService.getJobStatuses()
      const createdDrafts = []
      
      for (const draftData of draftDataArray) {
        const newDraft = {
          id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...draftData,
          status: constants.DRAFT,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          applications_count: 0,
          shortlisted_count: 0,
          interviews_today: 0,
          total_interviews: 0,
          view_count: 0
        }

        jobsCache.push(newDraft)
        createdDrafts.push(deepClone(newDraft))
      }

      return createdDrafts
    }, 3, 500);
    
    return result;
  }

  /**
   * Update job
   * @param {string} jobId - Job ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated job or null if not found
   */
  async updateJob(jobId, updateData) {
    const result = await handleServiceError(async () => {
      await delay(400)
      if (shouldSimulateError()) {
        throw new Error('Failed to update job')
      }

      const jobIndex = jobsCache.findIndex(job => job.id === jobId)
      if (jobIndex === -1) {
        return null
      }

      jobsCache[jobIndex] = {
        ...jobsCache[jobIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      }

      return deepClone(jobsCache[jobIndex])
    }, 3, 500);
    
    return result;
  }

  /**
   * Delete job
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteJob(jobId) {
    const result = await handleServiceError(async () => {
      await delay(300)
      if (shouldSimulateError()) {
        throw new Error('Failed to delete job')
      }

      const jobIndex = jobsCache.findIndex(job => job.id === jobId)
      if (jobIndex === -1) {
        return false
      }

      jobsCache.splice(jobIndex, 1)
      return true
    }, 3, 500);
    
    return result;
  }

  /**
   * Delete multiple jobs
   * @param {Array<string>} jobIds - Array of Job IDs
   * @returns {Promise<boolean>} Success status
   */
  async deleteJobs(jobIds) {
    const result = await handleServiceError(async () => {
      await delay(500)
      if (shouldSimulateError()) {
        throw new Error('Failed to delete jobs')
      }

      let success = true
      for (const jobId of jobIds) {
        const jobIndex = jobsCache.findIndex(job => job.id === jobId)
        if (jobIndex === -1) {
          success = false
        } else {
          jobsCache.splice(jobIndex, 1)
        }
      }
      return success
    }, 3, 500);
    
    return result;
  }

  /**
   * Publish job (change status from draft to published)
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Updated job or null if not found
   */
  async publishJob(jobId) {
    const result = await handleServiceError(async () => {
      await delay(300)
      const constants = await constantsService.getJobStatuses()
      
      return this.updateJob(jobId, {
        status: constants.PUBLISHED,
        published_at: new Date().toISOString()
      })
    }, 3, 500);
    
    return result;
  }

  /**
   * Pause job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Updated job or null if not found
   */
  async pauseJob(jobId) {
    const result = await handleServiceError(async () => {
      await delay(300)
      const constants = await constantsService.getJobStatuses()
      
      return this.updateJob(jobId, {
        status: constants.PAUSED
      })
    }, 3, 500);
    
    return result;
  }

  /**
   * Close job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Updated job or null if not found
   */
  async closeJob(jobId) {
    const result = await handleServiceError(async () => {
      await delay(300)
      const constants = await constantsService.getJobStatuses()
      
      return this.updateJob(jobId, {
        status: constants.CLOSED
      })
    }, 3, 500);
    
    return result;
  }

  /**
   * Get draft jobs
   * @returns {Promise<Array>} Array of draft jobs
   */
  async getDraftJobs() {
    const result = await handleServiceError(async () => {
      await delay(200)
      const constants = await constantsService.getJobStatuses()
      
      return jobsCache.filter(job => job.status === constants.DRAFT)
    }, 3, 500);
    
    return result;
  }

  /**
   * Get published jobs
   * @returns {Promise<Array>} Array of published jobs
   */
  async getPublishedJobs() {
    const result = await handleServiceError(async () => {
      await delay(200)
      const constants = await constantsService.getJobStatuses()
      
      return jobsCache.filter(job => job.status === constants.PUBLISHED)
    }, 3, 500);
    
    return result;
  }

  /**
   * Get jobs by country
   * @param {string} country - Country name
   * @returns {Promise<Array>} Array of jobs in specified country
   */
  async getJobsByCountry(country) {
    const result = await handleServiceError(async () => {
      await delay(200)
      return jobsCache.filter(job => job.country === country)
    }, 3, 500);
    
    return result;
  }

  /**
   * Get jobs by category
   * @param {string} category - Job category
   * @returns {Promise<Array>} Array of jobs in specified category
   */
  async getJobsByCategory(category) {
    const result = await handleServiceError(async () => {
      await delay(200)
      return jobsCache.filter(job => job.category === category)
    }, 3, 500);
    
    return result;
  }

  /**
   * Search jobs by text
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching jobs
   */
  async searchJobs(searchTerm) {
    const result = await handleServiceError(async () => {
      await delay(250)
      if (!searchTerm) return []

      const term = searchTerm.toLowerCase()
      return jobsCache.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term) ||
        job.tags.some(tag => tag.toLowerCase().includes(term))
      )
    }, 3, 500);
    
    return result;
  }

  /**
   * Get job statistics
   * @returns {Promise<Object>} Job statistics
   */
  async getJobStatistics() {
    const result = await handleServiceError(async () => {
      await delay(200)
      const constants = await constantsService.getJobStatuses()
      
      const stats = {
        total: jobsCache.length,
        published: jobsCache.filter(job => job.status === constants.PUBLISHED).length,
        draft: jobsCache.filter(job => job.status === constants.DRAFT).length,
        closed: jobsCache.filter(job => job.status === constants.CLOSED).length,
        paused: jobsCache.filter(job => job.status === constants.PAUSED).length,
        byCountry: {},
        byCategory: {},
        totalApplications: jobsCache.reduce((sum, job) => sum + job.applications_count, 0),
        totalViews: jobsCache.reduce((sum, job) => sum + job.view_count, 0)
      }

      // Group by country
      jobsCache.forEach(job => {
        stats.byCountry[job.country] = (stats.byCountry[job.country] || 0) + 1
      })

      // Group by category
      jobsCache.forEach(job => {
        stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1
      })

      return stats
    }, 3, 500);
    
    return result;
  }

  /**
   * Increment job view count
   * @param {string} jobId - Job ID
   * @returns {Promise<boolean>} Success status
   */
  async incrementViewCount(jobId) {
    const result = await handleServiceError(async () => {
      await delay(100)
      const job = jobsCache.find(job => job.id === jobId)
      if (job) {
        job.view_count += 1
        return true
      }
      return false
    }, 3, 500);
    
    return result;
  }

  /**
   * Get recent jobs (created in last 30 days)
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Array>} Array of recent jobs
   */
  async getRecentJobs(days = 30) {
    const result = await handleServiceError(async () => {
      await delay(200)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return jobsCache.filter(job => new Date(job.created_at) >= cutoffDate)
    }, 3, 500);
    
    return result;
  }

  /**
   * Get jobs with high application count
   * @param {number} threshold - Minimum application count (default: 50)
   * @returns {Promise<Array>} Array of popular jobs
   */
  async getPopularJobs(threshold = 50) {
    const result = await handleServiceError(async () => {
      await delay(200)
      return jobsCache
        .filter(job => job.applications_count >= threshold)
        .sort((a, b) => b.applications_count - a.applications_count)
    }, 3, 500);
    
    return result;
  }
}

// Create and export singleton instance
const jobService = new JobService()
export default jobService