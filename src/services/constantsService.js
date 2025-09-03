// Constants Service - System constants and enums
import constantsData from '../data/constants.json'
import performanceService from './performanceService.js'

// Utility function to simulate API delay (reduced for performance)
const delay = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms))

class ConstantsService {
  /**
   * Get all job statuses
   * @returns {Promise<Object>} Job status constants
   */
  async getJobStatuses() {
    return await performanceService.getCachedData('job_statuses', async () => {
      await delay()
      return constantsData.jobStatuses
    }, 'constants')
  }

  /**
   * Get all application stages
   * @returns {Promise<Object>} Application stage constants
   */
  async getApplicationStages() {
    return await performanceService.getCachedData('application_stages', async () => {
      await delay()
      return constantsData.applicationStages
    }, 'constants')
  }

  /**
   * Get all interview statuses
   * @returns {Promise<Object>} Interview status constants
   */
  async getInterviewStatuses() {
    return await performanceService.getCachedData('interview_statuses', async () => {
      await delay()
      return constantsData.interviewStatuses
    }, 'constants')
  }

  /**
   * Get list of countries
   * @returns {Promise<Array>} Array of country names
   */
  async getCountries() {
    return await performanceService.getCachedData('countries', async () => {
      await delay()
      return constantsData.countries
    }, 'constants')
  }

  /**
   * Get list of job categories
   * @returns {Promise<Array>} Array of job categories
   */
  async getJobCategories() {
    return await performanceService.getCachedData('job_categories', async () => {
      await delay()
      return constantsData.jobCategories
    }, 'constants')
  }

  /**
   * Get interview types
   * @returns {Promise<Array>} Array of interview types
   */
  async getInterviewTypes() {
    return await performanceService.getCachedData('interview_types', async () => {
      await delay()
      return constantsData.interviewTypes
    }, 'constants')
  }

  /**
   * Get education levels
   * @returns {Promise<Array>} Array of education levels
   */
  async getEducationLevels() {
    return await performanceService.getCachedData('education_levels', async () => {
      await delay()
      return constantsData.educationLevels
    }, 'constants')
  }

  /**
   * Get gender options
   * @returns {Promise<Array>} Array of gender options
   */
  async getGenders() {
    return await performanceService.getCachedData('genders', async () => {
      await delay()
      return constantsData.genders
    }, 'constants')
  }

  /**
   * Get priority levels
   * @returns {Promise<Object>} Priority level constants
   */
  async getPriorities() {
    return await performanceService.getCachedData('priorities', async () => {
      await delay()
      return constantsData.priorities
    }, 'constants')
  }

  /**
   * Get supported currencies
   * @returns {Promise<Array>} Array of currency codes
   */
  async getCurrencies() {
    return await performanceService.getCachedData('currencies', async () => {
      await delay()
      return constantsData.currencies
    }, 'constants')
  }

  /**
   * Get all constants at once
   * @returns {Promise<Object>} All constants data
   */
  async getAllConstants() {
    return await performanceService.getCachedData('all_constants', async () => {
      await delay()
      return constantsData
    }, 'constants')
  }

  /**
   * Get label for job status
   * @param {string} status - Status key
   * @returns {string} Formatted status label
   */
  getJobStatusLabel(status) {
    const labels = {
      [constantsData.jobStatuses.DRAFT]: 'Draft',
      [constantsData.jobStatuses.PUBLISHED]: 'Published',
      [constantsData.jobStatuses.CLOSED]: 'Closed',
      [constantsData.jobStatuses.PAUSED]: 'Paused'
    }
    return labels[status] || status
  }

  /**
   * Get label for application stage
   * @param {string} stage - Stage key
   * @returns {string} Formatted stage label
   */
  getApplicationStageLabel(stage) {
    const labels = {
      [constantsData.applicationStages.APPLIED]: 'Applied',
      [constantsData.applicationStages.SHORTLISTED]: 'Shortlisted',
      [constantsData.applicationStages.SCHEDULED]: 'Scheduled',
      [constantsData.applicationStages.INTERVIEWED]: 'Interviewed',
      [constantsData.applicationStages.INTERVIEW_PASSED]: 'Interview Passed',
      [constantsData.applicationStages.SELECTED]: 'Selected',
      [constantsData.applicationStages.REJECTED]: 'Rejected',
      [constantsData.applicationStages.MEDICAL_SCHEDULED]: 'Medical Scheduled',
      [constantsData.applicationStages.MEDICAL_PASSED]: 'Medical Passed',
      [constantsData.applicationStages.VISA_APPLICATION]: 'Visa Application',
      [constantsData.applicationStages.VISA_APPROVED]: 'Visa Approved',
      [constantsData.applicationStages.READY_TO_FLY]: 'Ready to Fly'
    }
    return labels[stage] || stage
  }

  /**
   * Get label for interview status
   * @param {string} status - Status key
   * @returns {string} Formatted status label
   */
  getInterviewStatusLabel(status) {
    const labels = {
      [constantsData.interviewStatuses.SCHEDULED]: 'Scheduled',
      [constantsData.interviewStatuses.COMPLETED]: 'Completed',
      [constantsData.interviewStatuses.CANCELLED]: 'Cancelled',
      [constantsData.interviewStatuses.NO_SHOW]: 'No Show'
    }
    return labels[status] || status
  }

  /**
   * Get color for application stage
   * @param {string} stage - Stage key
   * @returns {string} CSS color class
   */
  getApplicationStageColor(stage) {
    const colors = {
      [constantsData.applicationStages.APPLIED]: 'blue',
      [constantsData.applicationStages.SHORTLISTED]: 'yellow',
      [constantsData.applicationStages.SCHEDULED]: 'purple',
      [constantsData.applicationStages.INTERVIEWED]: 'orange',
      [constantsData.applicationStages.INTERVIEW_PASSED]: 'indigo',
      [constantsData.applicationStages.SELECTED]: 'green',
      [constantsData.applicationStages.REJECTED]: 'red',
      [constantsData.applicationStages.MEDICAL_SCHEDULED]: 'cyan',
      [constantsData.applicationStages.MEDICAL_PASSED]: 'teal',
      [constantsData.applicationStages.VISA_APPLICATION]: 'pink',
      [constantsData.applicationStages.VISA_APPROVED]: 'emerald',
      [constantsData.applicationStages.READY_TO_FLY]: 'green'
    }
    return colors[stage] || 'gray'
  }

  /**
   * Get color for interview status
   * @param {string} status - Status key
   * @returns {string} CSS color class
   */
  getInterviewStatusColor(status) {
    const colors = {
      [constantsData.interviewStatuses.SCHEDULED]: 'blue',
      [constantsData.interviewStatuses.COMPLETED]: 'green',
      [constantsData.interviewStatuses.CANCELLED]: 'red',
      [constantsData.interviewStatuses.NO_SHOW]: 'orange'
    }
    return colors[status] || 'gray'
  }
}

// Create and export singleton instance
const constantsService = new ConstantsService()
export default constantsService

// Named exports for convenience
export const {
  getJobStatuses,
  getApplicationStages,
  getInterviewStatuses,
  getCountries,
  getJobCategories,
  getInterviewTypes,
  getEducationLevels,
  getGenders,
  getPriorities,
  getCurrencies,
  getAllConstants,
  getJobStatusLabel,
  getApplicationStageLabel,
  getInterviewStatusLabel,
  getApplicationStageColor,
  getInterviewStatusColor
} = constantsService