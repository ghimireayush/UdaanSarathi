// Candidate Service - Handles all candidate-related operations
import candidatesData from '../data/candidates.json'
import constantsService from './constantsService.js'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let candidatesCache = deepClone(candidatesData)

class CandidateService {
  /**
   * Get all candidates with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of candidates
   */
  async getCandidates(filters = {}) {
    await delay()
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch candidates')
    }

    let filteredCandidates = [...candidatesCache]

    // Apply filters
    if (filters.stage && filters.stage !== 'all') {
      filteredCandidates = filteredCandidates.filter(candidate => candidate.stage === filters.stage)
    }

    if (filters.gender && filters.gender !== 'all') {
      filteredCandidates = filteredCandidates.filter(candidate => candidate.gender === filters.gender)
    }

    if (filters.education && filters.education !== 'all') {
      filteredCandidates = filteredCandidates.filter(candidate => candidate.education === filters.education)
    }

    if (filters.experience && filters.experience !== 'all') {
      filteredCandidates = filteredCandidates.filter(candidate => {
        const exp = parseInt(candidate.experience)
        switch (filters.experience) {
          case '0-1': return exp <= 1
          case '1-3': return exp > 1 && exp <= 3
          case '3-5': return exp > 3 && exp <= 5
          case '5+': return exp > 5
          default: return true
        }
      })
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredCandidates = filteredCandidates.filter(candidate => 
        candidate.name.toLowerCase().includes(searchTerm) ||
        candidate.phone.includes(searchTerm) ||
        candidate.email.toLowerCase().includes(searchTerm) ||
        candidate.passport_number.toLowerCase().includes(searchTerm) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm))
      )
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredCandidates.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'age':
            return a.age - b.age
          case 'priority_score':
            return b.priority_score - a.priority_score
          case 'applied_at':
            return new Date(b.applied_at) - new Date(a.applied_at)
          case 'experience':
            return parseInt(b.experience) - parseInt(a.experience)
          default:
            return 0
        }
      })
    }

    return filteredCandidates
  }

  /**
   * Get candidate by ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object|null>} Candidate object or null if not found
   */
  async getCandidateById(candidateId) {
    await delay(200)
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch candidate')
    }

    const candidate = candidatesCache.find(candidate => candidate.id === candidateId)
    return candidate ? deepClone(candidate) : null
  }

  /**
   * Create new candidate
   * @param {Object} candidateData - Candidate data
   * @returns {Promise<Object>} Created candidate
   */
  async createCandidate(candidateData) {
    await delay(500)
    if (shouldSimulateError()) {
      throw new Error('Failed to create candidate')
    }

    const constants = await constantsService.getApplicationStages()
    const newCandidate = {
      id: `candidate_${Date.now()}`,
      ...candidateData,
      stage: constants.APPLIED,
      priority_score: 0,
      applied_at: new Date().toISOString(),
      shortlisted_at: null,
      applied_jobs: candidateData.applied_jobs || []
    }

    candidatesCache.push(newCandidate)
    return deepClone(newCandidate)
  }

  /**
   * Update candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated candidate or null if not found
   */
  async updateCandidate(candidateId, updateData) {
    await delay(400)
    if (shouldSimulateError()) {
      throw new Error('Failed to update candidate')
    }

    const candidateIndex = candidatesCache.findIndex(candidate => candidate.id === candidateId)
    if (candidateIndex === -1) {
      return null
    }

    candidatesCache[candidateIndex] = {
      ...candidatesCache[candidateIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    return deepClone(candidatesCache[candidateIndex])
  }

  /**
   * Delete candidate
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCandidate(candidateId) {
    await delay(300)
    if (shouldSimulateError()) {
      throw new Error('Failed to delete candidate')
    }

    const candidateIndex = candidatesCache.findIndex(candidate => candidate.id === candidateId)
    if (candidateIndex === -1) {
      return false
    }

    candidatesCache.splice(candidateIndex, 1)
    return true
  }

  /**
   * Search candidates by text
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching candidates
   */
  async searchCandidates(searchTerm) {
    await delay(250)
    if (!searchTerm) return []

    const term = searchTerm.toLowerCase()
    return candidatesCache.filter(candidate => 
      candidate.name.toLowerCase().includes(term) ||
      candidate.phone.includes(term) ||
      candidate.email.toLowerCase().includes(term) ||
      candidate.passport_number.toLowerCase().includes(term) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(term))
    )
  }

  /**
   * Get candidates by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of candidates who applied for the job
   */
  async getCandidatesByJobId(jobId) {
    await delay(200)
    return candidatesCache.filter(candidate => 
      candidate.applied_jobs && candidate.applied_jobs.includes(jobId)
    )
  }

  /**
   * Get candidates by stage
   * @param {string} stage - Application stage
   * @returns {Promise<Array>} Array of candidates in specified stage
   */
  async getCandidatesByStage(stage) {
    await delay(200)
    return candidatesCache.filter(candidate => candidate.stage === stage)
  }

  /**
   * Update candidate stage
   * @param {string} candidateId - Candidate ID
   * @param {string} newStage - New application stage
   * @returns {Promise<Object|null>} Updated candidate or null if not found
   */
  async updateCandidateStage(candidateId, newStage) {
    await delay(300)
    const updateData = { stage: newStage }
    
    const constants = await constantsService.getApplicationStages()
    
    // Add timestamp for shortlisted stage
    if (newStage === constants.SHORTLISTED) {
      updateData.shortlisted_at = new Date().toISOString()
    }

    return this.updateCandidate(candidateId, updateData)
  }

  /**
   * Update candidate priority score
   * @param {string} candidateId - Candidate ID
   * @param {number} score - Priority score (0-100)
   * @returns {Promise<Object|null>} Updated candidate or null if not found
   */
  async updatePriorityScore(candidateId, score) {
    await delay(200)
    return this.updateCandidate(candidateId, { priority_score: score })
  }

  /**
   * Get candidate statistics
   * @returns {Promise<Object>} Candidate statistics
   */
  async getCandidateStatistics() {
    await delay(200)
    const stats = {
      total: candidatesCache.length,
      byStage: {},
      byGender: {},
      byEducation: {},
      byExperience: {},
      averageScore: 0,
      totalAppliedJobs: 0
    }

    // Group by stage
    candidatesCache.forEach(candidate => {
      stats.byStage[candidate.stage] = (stats.byStage[candidate.stage] || 0) + 1
    })

    // Group by gender
    candidatesCache.forEach(candidate => {
      stats.byGender[candidate.gender] = (stats.byGender[candidate.gender] || 0) + 1
    })

    // Group by education
    candidatesCache.forEach(candidate => {
      stats.byEducation[candidate.education] = (stats.byEducation[candidate.education] || 0) + 1
    })

    // Group by experience
    candidatesCache.forEach(candidate => {
      const exp = parseInt(candidate.experience)
      let range = '0-1 years'
      if (exp > 1 && exp <= 3) range = '1-3 years'
      else if (exp > 3 && exp <= 5) range = '3-5 years'
      else if (exp > 5) range = '5+ years'
      
      stats.byExperience[range] = (stats.byExperience[range] || 0) + 1
    })

    // Calculate average priority score
    const totalScore = candidatesCache.reduce((sum, candidate) => sum + candidate.priority_score, 0)
    stats.averageScore = candidatesCache.length > 0 ? totalScore / candidatesCache.length : 0

    // Calculate total applied jobs
    stats.totalAppliedJobs = candidatesCache.reduce((sum, candidate) => 
      sum + (candidate.applied_jobs ? candidate.applied_jobs.length : 0), 0
    )

    return stats
  }

  /**
   * Get top candidates by priority score
   * @param {number} limit - Number of candidates to return (default: 10)
   * @returns {Promise<Array>} Array of top candidates
   */
  async getTopCandidates(limit = 10) {
    await delay(200)
    return candidatesCache
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, limit)
  }

  /**
   * Get candidates by skill
   * @param {string} skill - Skill name
   * @returns {Promise<Array>} Array of candidates with specified skill
   */
  async getCandidatesBySkill(skill) {
    await delay(200)
    const skillLower = skill.toLowerCase()
    return candidatesCache.filter(candidate => 
      candidate.skills && candidate.skills.some(s => s.toLowerCase().includes(skillLower))
    )
  }

  /**
   * Get candidates by age range
   * @param {number} minAge - Minimum age
   * @param {number} maxAge - Maximum age
   * @returns {Promise<Array>} Array of candidates in age range
   */
  async getCandidatesByAgeRange(minAge, maxAge) {
    await delay(200)
    return candidatesCache.filter(candidate => 
      candidate.age >= minAge && candidate.age <= maxAge
    )
  }

  /**
   * Add job application to candidate
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Updated candidate or null if not found
   */
  async addJobApplication(candidateId, jobId) {
    await delay(200)
    const candidate = candidatesCache.find(c => c.id === candidateId)
    if (!candidate) return null

    if (!candidate.applied_jobs) candidate.applied_jobs = []
    if (!candidate.applied_jobs.includes(jobId)) {
      candidate.applied_jobs.push(jobId)
    }

    return this.updateCandidate(candidateId, { 
      applied_jobs: candidate.applied_jobs,
      applied_at: new Date().toISOString()
    })
  }

  /**
   * Get candidates with missing documents
   * @returns {Promise<Array>} Array of candidates with incomplete documentation
   */
  async getCandidatesWithMissingDocuments() {
    await delay(200)
    return candidatesCache.filter(candidate => 
      !candidate.cv_url || !candidate.photo_url || !candidate.passport_number
    )
  }

  /**
   * Get candidates available for deployment
   * @returns {Promise<Array>} Array of candidates ready for deployment
   */
  async getAvailableCandidates() {
    await delay(200)
    const constants = await constantsService.getApplicationStages()
    
    return candidatesCache.filter(candidate => 
      candidate.stage === constants.SELECTED && 
      candidate.availability && 
      (candidate.availability.toLowerCase() === 'immediate' || 
       candidate.availability.toLowerCase().includes('within'))
    )
  }
}

// Create and export singleton instance
const candidateService = new CandidateService()
export default candidateService