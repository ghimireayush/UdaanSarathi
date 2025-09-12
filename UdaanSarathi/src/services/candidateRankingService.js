// Candidate Ranking Service - Skill-based prioritization algorithms
import { getCurrentNepalTime, formatInNepalTz } from '../utils/nepaliDate'

/**
 * Calculate skill match score between candidate and job requirements
 * @param {Array} candidateSkills - Array of candidate skills
 * @param {Array} jobTags - Array of job requirement tags/skills
 * @param {Object} options - Scoring options
 * @returns {Object} Skill match analysis
 */
export const calculateSkillMatch = (candidateSkills = [], jobTags = [], options = {}) => {
  const {
    exactMatchWeight = 1.0,
    partialMatchWeight = 0.6,
    caseInsensitive = true
  } = options

  if (!jobTags.length || !candidateSkills.length) {
    return {
      score: 0,
      percentage: 0,
      exactMatches: [],
      partialMatches: [],
      missingSkills: jobTags,
      totalRequired: jobTags.length
    }
  }

  const normalizeSkill = (skill) => caseInsensitive ? skill.toLowerCase().trim() : skill.trim()
  
  const normalizedJobTags = jobTags.map(normalizeSkill)
  const normalizedCandidateSkills = candidateSkills.map(normalizeSkill)

  const exactMatches = []
  const partialMatches = []
  const missingSkills = []

  normalizedJobTags.forEach((jobTag, index) => {
    const originalJobTag = jobTags[index]
    
    // Check for exact match
    const exactMatch = normalizedCandidateSkills.find(skill => skill === jobTag)
    if (exactMatch) {
      exactMatches.push({
        required: originalJobTag,
        candidate: candidateSkills[normalizedCandidateSkills.indexOf(exactMatch)],
        type: 'exact'
      })
      return
    }

    // Check for partial match (contains or is contained)
    const partialMatch = normalizedCandidateSkills.find(skill => 
      skill.includes(jobTag) || jobTag.includes(skill)
    )
    if (partialMatch) {
      partialMatches.push({
        required: originalJobTag,
        candidate: candidateSkills[normalizedCandidateSkills.indexOf(partialMatch)],
        type: 'partial'
      })
      return
    }

    // No match found
    missingSkills.push(originalJobTag)
  })

  // Calculate weighted score
  const exactScore = exactMatches.length * exactMatchWeight
  const partialScore = partialMatches.length * partialMatchWeight
  const totalScore = exactScore + partialScore
  const maxPossibleScore = jobTags.length * exactMatchWeight
  
  const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  return {
    score: totalScore,
    percentage: Math.round(percentage * 100) / 100,
    exactMatches,
    partialMatches,
    missingSkills,
    totalRequired: jobTags.length,
    matchedCount: exactMatches.length + partialMatches.length
  }
}

/**
 * Calculate experience relevance score
 * @param {string} candidateExperience - Candidate's experience description
 * @param {Array} jobTags - Job requirement tags
 * @param {string} jobCategory - Job category
 * @returns {number} Experience relevance score (0-100)
 */
export const calculateExperienceRelevance = (candidateExperience = '', jobTags = [], jobCategory = '') => {
  if (!candidateExperience) return 0

  const experience = candidateExperience.toLowerCase()
  let relevanceScore = 0

  // Extract years of experience
  const yearsMatch = experience.match(/(\d+)\s*(?:years?|yrs?)/i)
  const years = yearsMatch ? parseInt(yearsMatch[1]) : 0

  // Base score from years of experience (max 40 points)
  if (years >= 5) relevanceScore += 40
  else if (years >= 3) relevanceScore += 30
  else if (years >= 1) relevanceScore += 20
  else relevanceScore += 10

  // Bonus for job category match (max 30 points)
  if (jobCategory && experience.includes(jobCategory.toLowerCase())) {
    relevanceScore += 30
  }

  // Bonus for job tag matches in experience (max 30 points)
  const tagMatches = jobTags.filter(tag => 
    experience.includes(tag.toLowerCase())
  ).length
  
  if (tagMatches > 0) {
    relevanceScore += Math.min(30, tagMatches * 10)
  }

  return Math.min(100, relevanceScore)
}

/**
 * Calculate priority score based on multiple factors
 * @param {Object} candidate - Candidate object
 * @param {Object} job - Job object
 * @param {Object} weights - Scoring weights
 * @returns {Object} Priority analysis
 */
export const calculatePriorityScore = (candidate, job, weights = {}) => {
  const {
    skillMatchWeight = 0.4,
    experienceWeight = 0.3,
    educationWeight = 0.1,
    availabilityWeight = 0.1,
    applicationTimingWeight = 0.1
  } = weights

  const analysis = {
    skillMatch: { score: 0, details: null },
    experience: { score: 0, details: null },
    education: { score: 0, details: null },
    availability: { score: 0, details: null },
    applicationTiming: { score: 0, details: null },
    totalScore: 0,
    breakdown: {}
  }

  // 1. Skill Match Score
  if (job?.tags && job.tags.length > 0) {
    const skillMatchResult = calculateSkillMatch(candidate.skills, job.tags)
    analysis.skillMatch.score = skillMatchResult.percentage
    analysis.skillMatch.details = skillMatchResult
  }

  // 2. Experience Relevance Score
  analysis.experience.score = calculateExperienceRelevance(
    candidate.experience, 
    job?.tags || [], 
    job?.category
  )

  // 3. Education Score
  const educationLevels = {
    'phd': 100,
    'doctorate': 100,
    'master': 90,
    'masters': 90,
    'bachelor': 80,
    'bachelors': 80,
    'degree': 80,
    '+2': 60,
    'intermediate': 60,
    'slc': 40,
    'school': 40,
    'high school': 40
  }

  const education = (candidate.education || '').toLowerCase()
  analysis.education.score = Object.entries(educationLevels).find(([level]) => 
    education.includes(level)
  )?.[1] || 30

  // 4. Availability Score
  const availabilityScores = {
    'immediate': 100,
    'within 1 week': 90,
    'within 2 weeks': 80,
    'within 1 month': 70,
    'within 2 months': 60,
    'within 3 months': 50
  }

  const availability = (candidate.availability || '').toLowerCase()
  analysis.availability.score = Object.entries(availabilityScores).find(([period]) => 
    availability.includes(period)
  )?.[1] || 40

  // 5. Application Timing Score (recency bonus)
  if (candidate.applied_at) {
    const now = getCurrentNepalTime()
    const appliedDate = new Date(candidate.applied_at)
    const daysDiff = Math.floor((now - appliedDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 1) analysis.applicationTiming.score = 100
    else if (daysDiff <= 3) analysis.applicationTiming.score = 90
    else if (daysDiff <= 7) analysis.applicationTiming.score = 80
    else if (daysDiff <= 14) analysis.applicationTiming.score = 70
    else if (daysDiff <= 30) analysis.applicationTiming.score = 60
    else analysis.applicationTiming.score = 50
  }

  // Calculate weighted total score
  analysis.totalScore = Math.round(
    (analysis.skillMatch.score * skillMatchWeight) +
    (analysis.experience.score * experienceWeight) +
    (analysis.education.score * educationWeight) +
    (analysis.availability.score * availabilityWeight) +
    (analysis.applicationTiming.score * applicationTimingWeight)
  )

  // Create breakdown for display
  analysis.breakdown = {
    'Skill Match': {
      score: analysis.skillMatch.score,
      weight: skillMatchWeight,
      contribution: Math.round(analysis.skillMatch.score * skillMatchWeight)
    },
    'Experience': {
      score: analysis.experience.score,
      weight: experienceWeight,
      contribution: Math.round(analysis.experience.score * experienceWeight)
    },
    'Education': {
      score: analysis.education.score,
      weight: educationWeight,
      contribution: Math.round(analysis.education.score * educationWeight)
    },
    'Availability': {
      score: analysis.availability.score,
      weight: availabilityWeight,
      contribution: Math.round(analysis.availability.score * availabilityWeight)
    },
    'Application Timing': {
      score: analysis.applicationTiming.score,
      weight: applicationTimingWeight,
      contribution: Math.round(analysis.applicationTiming.score * applicationTimingWeight)
    }
  }

  return analysis
}

/**
 * Rank candidates for a specific job
 * @param {Array} candidates - Array of candidate objects
 * @param {Object} job - Job object
 * @param {Object} options - Ranking options
 * @returns {Array} Ranked candidates with scores
 */
export const rankCandidates = (candidates = [], job = null, options = {}) => {
  const {
    weights = {},
    includeAnalysis = true,
    sortBy = 'priority_score'
  } = options

  if (!candidates.length) return []

  // Calculate scores for each candidate
  const rankedCandidates = candidates.map(candidate => {
    const analysis = calculatePriorityScore(candidate, job, weights)
    
    return {
      ...candidate,
      priority_score: analysis.totalScore,
      ranking_analysis: includeAnalysis ? analysis : null,
      skill_match_score: analysis.skillMatch.score,
      skill_match_details: analysis.skillMatch.details
    }
  })

  // Sort by specified criteria
  rankedCandidates.sort((a, b) => {
    switch (sortBy) {
      case 'skill_match':
        return (b.skill_match_score || 0) - (a.skill_match_score || 0)
      case 'experience':
        return (b.ranking_analysis?.experience.score || 0) - (a.ranking_analysis?.experience.score || 0)
      case 'application_date':
        return new Date(b.applied_at || 0) - new Date(a.applied_at || 0)
      case 'priority_score':
      default:
        return (b.priority_score || 0) - (a.priority_score || 0)
    }
  })

  // Add ranking position
  rankedCandidates.forEach((candidate, index) => {
    candidate.rank = index + 1
  })

  return rankedCandidates
}

/**
 * Get ranking insights for a job
 * @param {Array} candidates - Array of candidates
 * @param {Object} job - Job object
 * @returns {Object} Ranking insights
 */
export const getRankingInsights = (candidates = [], job = null) => {
  if (!candidates.length) {
    return {
      totalCandidates: 0,
      averageScore: 0,
      topCandidates: [],
      skillGaps: [],
      recommendations: []
    }
  }

  const rankedCandidates = rankCandidates(candidates, job, { includeAnalysis: true })
  
  const scores = rankedCandidates.map(c => c.priority_score || 0)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  // Top candidates (score >= 80)
  const topCandidates = rankedCandidates.filter(c => (c.priority_score || 0) >= 80)

  // Skill gap analysis
  const skillGaps = []
  if (job?.tags && job.tags.length > 0) {
    job.tags.forEach(requiredSkill => {
      const candidatesWithSkill = rankedCandidates.filter(candidate => 
        candidate.skills?.some(skill => 
          skill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
          requiredSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
      
      const coverage = (candidatesWithSkill.length / rankedCandidates.length) * 100
      
      if (coverage < 50) {
        skillGaps.push({
          skill: requiredSkill,
          coverage: Math.round(coverage),
          candidatesWithSkill: candidatesWithSkill.length,
          totalCandidates: rankedCandidates.length
        })
      }
    })
  }

  // Generate recommendations
  const recommendations = []
  
  if (topCandidates.length === 0) {
    recommendations.push({
      type: 'warning',
      message: 'No candidates scored above 80%. Consider reviewing job requirements or expanding search criteria.'
    })
  }
  
  if (skillGaps.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${skillGaps.length} required skills have low candidate coverage. Consider skills training or alternative requirements.`
    })
  }
  
  if (averageScore < 60) {
    recommendations.push({
      type: 'warning',
      message: 'Average candidate score is below 60%. Consider adjusting job requirements or improving job posting visibility.'
    })
  }

  return {
    totalCandidates: rankedCandidates.length,
    averageScore: Math.round(averageScore),
    topCandidates: topCandidates.slice(0, 5), // Top 5
    skillGaps: skillGaps.sort((a, b) => a.coverage - b.coverage),
    recommendations,
    scoreDistribution: {
      excellent: rankedCandidates.filter(c => (c.priority_score || 0) >= 90).length,
      good: rankedCandidates.filter(c => (c.priority_score || 0) >= 80 && (c.priority_score || 0) < 90).length,
      average: rankedCandidates.filter(c => (c.priority_score || 0) >= 60 && (c.priority_score || 0) < 80).length,
      below: rankedCandidates.filter(c => (c.priority_score || 0) < 60).length
    }
  }
}

/**
 * Update candidate priority scores in bulk
 * @param {Array} candidates - Array of candidates
 * @param {Object} job - Job object
 * @returns {Array} Updated candidates with new scores
 */
export const updateCandidateScores = (candidates = [], job = null) => {
  return rankCandidates(candidates, job, { includeAnalysis: false })
}

export default {
  calculateSkillMatch,
  calculateExperienceRelevance,
  calculatePriorityScore,
  rankCandidates,
  getRankingInsights,
  updateCandidateScores
}