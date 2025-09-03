// Constants Service - System constants and enums
import constantsData from '../data/constants.json'

// Utility function to simulate API delay
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))

class ConstantsService {
  /**
   * Get all job statuses
   * @returns {Promise<Object>} Job status constants
   */
  async getJobStatuses() {
    await delay()
    return constantsData.jobStatuses
  }

  /**
   * Get all application stages
   * @returns {Promise<Object>} Application stage constants
   */
  async getApplicationStages() {
    await delay()
    return constantsData.applicationStages
  }

  /**
   * Get all interview statuses
   * @returns {Promise<Object>} Interview status constants
   */
  async getInterviewStatuses() {
    await delay()
    return constantsData.interviewStatuses
  }

  /**
   * Get list of countries
   * @returns {Promise<Array>} Array of country names
   */
  async getCountries() {
    await delay()
    return constantsData.countries
  }

  /**
   * Get list of job categories
   * @returns {Promise<Array>} Array of job categories
   */
  async getJobCategories() {
    await delay()
    return constantsData.jobCategories
  }

  /**
   * Get interview types
   * @returns {Promise<Array>} Array of interview types
   */
  async getInterviewTypes() {
    await delay()
    return constantsData.interviewTypes
  }

  /**
   * Get education levels
   * @returns {Promise<Array>} Array of education levels
   */
  async getEducationLevels() {
    await delay()
    return constantsData.educationLevels
  }

  /**
   * Get gender options
   * @returns {Promise<Array>} Array of gender options
   */
  async getGenders() {
    await delay()
    return constantsData.genders
  }

  /**
   * Get priority levels
   * @returns {Promise<Object>} Priority level constants
   */
  async getPriorities() {
    await delay()
    return constantsData.priorities
  }

  /**
   * Get supported currencies
   * @returns {Promise<Array>} Array of currency codes
   */
  async getCurrencies() {
    await delay()
    return constantsData.currencies
  }

  /**
   * Get all constants at once
   * @returns {Promise<Object>} All constants data
   */
  async getAllConstants() {
    await delay()
    return constantsData
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