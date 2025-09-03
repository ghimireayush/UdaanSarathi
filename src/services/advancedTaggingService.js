// Advanced Skill-based Tagging and Prioritization Service
import { calculateSkillMatch, calculatePriorityScore } from './candidateRankingService'

/**
 * Extended skill taxonomy with categories and weights
 */
export const SKILL_TAXONOMY = {
  technical: {
    label: 'Technical Skills',
    weight: 1.0,
    subcategories: {
      programming: { label: 'Programming Languages', weight: 1.0 },
      frameworks: { label: 'Frameworks & Libraries', weight: 0.9 },
      databases: { label: 'Database Technologies', weight: 0.8 },
      tools: { label: 'Development Tools', weight: 0.7 },
      cloud: { label: 'Cloud Platforms', weight: 0.9 },
      devops: { label: 'DevOps & CI/CD', weight: 0.8 }
    }
  },
  soft: {
    label: 'Soft Skills',
    weight: 0.8,
    subcategories: {
      communication: { label: 'Communication', weight: 1.0 },
      leadership: { label: 'Leadership', weight: 0.9 },
      teamwork: { label: 'Teamwork', weight: 0.9 },
      problem_solving: { label: 'Problem Solving', weight: 0.8 },
      adaptability: { label: 'Adaptability', weight: 0.7 }
    }
  },
  domain: {
    label: 'Domain Knowledge',
    weight: 0.9,
    subcategories: {
      industry: { label: 'Industry Experience', weight: 1.0 },
      business: { label: 'Business Knowledge', weight: 0.8 },
      compliance: { label: 'Compliance & Regulations', weight: 0.7 },
      processes: { label: 'Process Knowledge', weight: 0.6 }
    }
  },
  certifications: {
    label: 'Certifications',
    weight: 0.7,
    subcategories: {
      professional: { label: 'Professional Certifications', weight: 1.0 },
      technical: { label: 'Technical Certifications', weight: 0.9 },
      language: { label: 'Language Certifications', weight: 0.6 }
    }
  }
}

/**
 * Predefined skill suggestions by category
 */
export const SKILL_SUGGESTIONS = {
  technical: {
    programming: [
      'JavaScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'TypeScript', 'Swift', 'Kotlin', 'C++', 'C', 'Scala', 'R'
    ],
    frameworks: [
      'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring Boot', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'Next.js'
    ],
    databases: [
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle',
      'SQL Server', 'SQLite', 'Cassandra', 'DynamoDB'
    ],
    cloud: [
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
      'CloudFormation', 'Serverless', 'Lambda', 'EC2', 'S3'
    ]
  },
  soft: {
    communication: [
      'Public Speaking', 'Written Communication', 'Presentation Skills',
      'Active Listening', 'Cross-cultural Communication', 'Negotiation'
    ],
    leadership: [
      'Team Management', 'Project Leadership', 'Mentoring', 'Strategic Planning',
      'Decision Making', 'Conflict Resolution'
    ]
  },
  domain: {
    industry: [
      'Healthcare', 'Finance', 'E-commerce', 'Education', 'Manufacturing',
      'Retail', 'Government', 'Non-profit', 'Hospitality', 'Construction'
    ]
  }
}

/**
 * Enhanced skill matching with taxonomy support
 * @param {Array} candidateSkills - Candidate's skills with categories
 * @param {Array} jobRequirements - Job requirements with priorities
 * @param {Object} options - Matching options
 * @returns {Object} Enhanced skill match analysis
 */
export const enhancedSkillMatch = (candidateSkills = [], jobRequirements = [], options = {}) => {
  const {
    useTaxonomy = true,
    includePartialMatches = true,
    categoryWeights = {},
    minimumScore = 0
  } = options

  // Normalize skills with categories
  const normalizedCandidateSkills = candidateSkills.map(skill => ({
    name: typeof skill === 'string' ? skill : skill.name,
    category: typeof skill === 'object' ? skill.category : 'technical',
    subcategory: typeof skill === 'object' ? skill.subcategory : 'programming',
    level: typeof skill === 'object' ? skill.level : 'intermediate',
    verified: typeof skill === 'object' ? skill.verified : false
  }))

  const normalizedJobRequirements = jobRequirements.map(req => ({
    name: typeof req === 'string' ? req : req.name,
    category: typeof req === 'object' ? req.category : 'technical',
    subcategory: typeof req === 'object' ? req.subcategory : 'programming',
    priority: typeof req === 'object' ? req.priority : 'medium',
    required: typeof req === 'object' ? req.required : false,
    weight: typeof req === 'object' ? req.weight : 1.0
  }))

  const matches = {
    exact: [],
    partial: [],
    missing: [],
    categoryBreakdown: {}
  }

  let totalScore = 0
  let maxPossibleScore = 0

  // Process each job requirement
  normalizedJobRequirements.forEach(requirement => {
    const categoryWeight = useTaxonomy ? 
      (categoryWeights[requirement.category] || SKILL_TAXONOMY[requirement.category]?.weight || 1.0) : 1.0
    
    const subcategoryWeight = useTaxonomy ?
      (SKILL_TAXONOMY[requirement.category]?.subcategories[requirement.subcategory]?.weight || 1.0) : 1.0

    const priorityMultiplier = {
      'critical': 1.5,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8,
      'nice-to-have': 0.6
    }[requirement.priority] || 1.0

    const baseWeight = requirement.weight * categoryWeight * subcategoryWeight * priorityMultiplier
    maxPossibleScore += baseWeight

    // Find matching candidate skills
    const exactMatch = normalizedCandidateSkills.find(skill => 
      skill.name.toLowerCase() === requirement.name.toLowerCase()
    )

    if (exactMatch) {
      const levelMultiplier = {
        'expert': 1.0,
        'advanced': 0.9,
        'intermediate': 0.8,
        'beginner': 0.6,
        'basic': 0.5
      }[exactMatch.level] || 0.8

      const verificationBonus = exactMatch.verified ? 1.1 : 1.0
      const matchScore = baseWeight * levelMultiplier * verificationBonus

      matches.exact.push({
        requirement: requirement.name,
        candidate: exactMatch.name,
        category: requirement.category,
        subcategory: requirement.subcategory,
        priority: requirement.priority,
        level: exactMatch.level,
        verified: exactMatch.verified,
        score: matchScore,
        weight: baseWeight
      })

      totalScore += matchScore
    } else if (includePartialMatches) {
      // Check for partial matches
      const partialMatch = normalizedCandidateSkills.find(skill => {
        const skillName = skill.name.toLowerCase()
        const reqName = requirement.name.toLowerCase()
        return skillName.includes(reqName) || reqName.includes(skillName) ||
               (skill.category === requirement.category && skill.subcategory === requirement.subcategory)
      })

      if (partialMatch) {
        const partialScore = baseWeight * 0.6 // 60% of full score for partial matches
        
        matches.partial.push({
          requirement: requirement.name,
          candidate: partialMatch.name,
          category: requirement.category,
          subcategory: requirement.subcategory,
          priority: requirement.priority,
          level: partialMatch.level,
          verified: partialMatch.verified,
          score: partialScore,
          weight: baseWeight,
          matchType: 'partial'
        })

        totalScore += partialScore
      } else {
        matches.missing.push({
          requirement: requirement.name,
          category: requirement.category,
          subcategory: requirement.subcategory,
          priority: requirement.priority,
          weight: baseWeight,
          impact: requirement.required ? 'critical' : 'moderate'
        })
      }
    } else {
      matches.missing.push({
        requirement: requirement.name,
        category: requirement.category,
        subcategory: requirement.subcategory,
        priority: requirement.priority,
        weight: baseWeight,
        impact: requirement.required ? 'critical' : 'moderate'
      })
    }
  })

  // Calculate category breakdown
  Object.keys(SKILL_TAXONOMY).forEach(category => {
    const categoryMatches = [...matches.exact, ...matches.partial].filter(m => m.category === category)
    const categoryMissing = matches.missing.filter(m => m.category === category)
    const categoryTotal = categoryMatches.length + categoryMissing.length

    if (categoryTotal > 0) {
      matches.categoryBreakdown[category] = {
        matched: categoryMatches.length,
        total: categoryTotal,
        percentage: Math.round((categoryMatches.length / categoryTotal) * 100),
        score: categoryMatches.reduce((sum, match) => sum + match.score, 0),
        maxScore: categoryMatches.reduce((sum, match) => sum + match.weight, 0) +
                  categoryMissing.reduce((sum, missing) => sum + missing.weight, 0)
      }
    }
  })

  const finalScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: Math.round(finalScore * 100) / 100,
    matches,
    categoryBreakdown: matches.categoryBreakdown,
    recommendations: generateSkillRecommendations(matches, normalizedCandidateSkills),
    passesMinimum: finalScore >= minimumScore
  }
}

/**
 * Generate skill improvement recommendations
 * @param {Object} matches - Skill match results
 * @param {Array} candidateSkills - Candidate's current skills
 * @returns {Array} Skill recommendations
 */
export const generateSkillRecommendations = (matches, candidateSkills) => {
  const recommendations = []

  // Critical missing skills
  const criticalMissing = matches.missing.filter(m => m.priority === 'critical' || m.impact === 'critical')
  if (criticalMissing.length > 0) {
    recommendations.push({
      type: 'critical',
      title: 'Critical Skills Gap',
      description: `Missing ${criticalMissing.length} critical skills that are essential for this role`,
      skills: criticalMissing.map(m => m.requirement),
      priority: 1
    })
  }

  // High priority missing skills
  const highPriorityMissing = matches.missing.filter(m => m.priority === 'high')
  if (highPriorityMissing.length > 0) {
    recommendations.push({
      type: 'improvement',
      title: 'High Priority Skills',
      description: `Consider developing these high-priority skills to strengthen candidacy`,
      skills: highPriorityMissing.map(m => m.requirement),
      priority: 2
    })
  }

  // Skills that could be upgraded from partial to exact matches
  const partialMatches = matches.partial.filter(m => m.matchType === 'partial')
  if (partialMatches.length > 0) {
    recommendations.push({
      type: 'enhancement',
      title: 'Skill Enhancement Opportunities',
      description: `These skills show potential but could be strengthened`,
      skills: partialMatches.map(m => ({
        current: m.candidate,
        target: m.requirement,
        category: m.category
      })),
      priority: 3
    })
  }

  // Suggest complementary skills based on existing skills
  const complementarySkills = suggestComplementarySkills(candidateSkills)
  if (complementarySkills.length > 0) {
    recommendations.push({
      type: 'complementary',
      title: 'Complementary Skills',
      description: `Skills that complement your existing expertise`,
      skills: complementarySkills,
      priority: 4
    })
  }

  return recommendations.sort((a, b) => a.priority - b.priority)
}

/**
 * Suggest complementary skills based on existing skills
 * @param {Array} candidateSkills - Candidate's current skills
 * @returns {Array} Suggested complementary skills
 */
export const suggestComplementarySkills = (candidateSkills) => {
  const suggestions = []
  const skillNames = candidateSkills.map(s => s.name.toLowerCase())

  // Programming language complementary skills
  if (skillNames.includes('javascript')) {
    if (!skillNames.includes('typescript')) suggestions.push('TypeScript')
    if (!skillNames.includes('node.js')) suggestions.push('Node.js')
    if (!skillNames.includes('react')) suggestions.push('React')
  }

  if (skillNames.includes('python')) {
    if (!skillNames.includes('django')) suggestions.push('Django')
    if (!skillNames.includes('flask')) suggestions.push('Flask')
    if (!skillNames.includes('pandas')) suggestions.push('Pandas')
  }

  // Cloud platform complementary skills
  if (skillNames.includes('aws')) {
    if (!skillNames.includes('docker')) suggestions.push('Docker')
    if (!skillNames.includes('kubernetes')) suggestions.push('Kubernetes')
    if (!skillNames.includes('terraform')) suggestions.push('Terraform')
  }

  return suggestions.slice(0, 5) // Limit to top 5 suggestions
}

/**
 * Create skill tags with enhanced metadata
 * @param {Array} skills - Raw skill list
 * @param {Object} options - Tagging options
 * @returns {Array} Enhanced skill tags
 */
export const createEnhancedSkillTags = (skills = [], options = {}) => {
  const {
    autoCategories = true,
    includeLevel = true,
    includePriority = true
  } = options

  return skills.map(skill => {
    const skillName = typeof skill === 'string' ? skill : skill.name
    const enhancedTag = {
      id: `skill_${skillName.toLowerCase().replace(/\s+/g, '_')}`,
      name: skillName,
      type: 'skill',
      category: skill.category || (autoCategories ? categorizeSkill(skillName) : 'technical'),
      subcategory: skill.subcategory || 'general',
      metadata: {
        level: includeLevel ? (skill.level || 'intermediate') : undefined,
        priority: includePriority ? (skill.priority || 'medium') : undefined,
        verified: skill.verified || false,
        source: skill.source || 'manual',
        addedAt: skill.addedAt || new Date().toISOString(),
        weight: skill.weight || 1.0
      }
    }

    // Add display properties
    enhancedTag.display = {
      color: getCategoryColor(enhancedTag.category),
      icon: getCategoryIcon(enhancedTag.category),
      tooltip: `${enhancedTag.category} skill - ${enhancedTag.metadata.level} level`
    }

    return enhancedTag
  })
}

/**
 * Auto-categorize a skill based on its name
 * @param {string} skillName - Name of the skill
 * @returns {string} Predicted category
 */
export const categorizeSkill = (skillName) => {
  const skill = skillName.toLowerCase()
  
  // Technical skills patterns
  const technicalPatterns = [
    /javascript|python|java|php|ruby|go|rust|typescript|swift|kotlin/,
    /react|angular|vue|node|express|django|flask|spring|laravel/,
    /mysql|postgresql|mongodb|redis|elasticsearch|oracle/,
    /aws|azure|google cloud|docker|kubernetes|terraform/,
    /git|jenkins|ci\/cd|devops|linux|unix/
  ]

  // Soft skills patterns
  const softSkillPatterns = [
    /communication|leadership|teamwork|management|presentation/,
    /problem solving|critical thinking|creativity|adaptability/,
    /negotiation|conflict resolution|mentoring|coaching/
  ]

  // Domain knowledge patterns
  const domainPatterns = [
    /healthcare|finance|banking|insurance|retail|e-commerce/,
    /education|government|non-profit|manufacturing|construction/,
    /marketing|sales|accounting|legal|hr|human resources/
  ]

  if (technicalPatterns.some(pattern => pattern.test(skill))) {
    return 'technical'
  } else if (softSkillPatterns.some(pattern => pattern.test(skill))) {
    return 'soft'
  } else if (domainPatterns.some(pattern => pattern.test(skill))) {
    return 'domain'
  } else if (skill.includes('certification') || skill.includes('certified')) {
    return 'certifications'
  }

  return 'technical' // Default category
}

/**
 * Get color for skill category
 * @param {string} category - Skill category
 * @returns {string} CSS color class
 */
export const getCategoryColor = (category) => {
  const colors = {
    technical: 'bg-blue-100 text-blue-800 border-blue-200',
    soft: 'bg-green-100 text-green-800 border-green-200',
    domain: 'bg-purple-100 text-purple-800 border-purple-200',
    certifications: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  return colors[category] || colors.technical
}

/**
 * Get icon for skill category
 * @param {string} category - Skill category
 * @returns {string} Icon name
 */
export const getCategoryIcon = (category) => {
  const icons = {
    technical: 'Code',
    soft: 'Users',
    domain: 'Building',
    certifications: 'Award'
  }
  return icons[category] || icons.technical
}

export default {
  SKILL_TAXONOMY,
  SKILL_SUGGESTIONS,
  enhancedSkillMatch,
  generateSkillRecommendations,
  suggestComplementarySkills,
  createEnhancedSkillTags,
  categorizeSkill,
  getCategoryColor,
  getCategoryIcon
}