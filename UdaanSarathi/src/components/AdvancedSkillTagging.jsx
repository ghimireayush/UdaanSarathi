import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Search, Award, Code, Users, Building, ChevronDown, Star, Check } from 'lucide-react'
import { 
  SKILL_TAXONOMY, 
  SKILL_SUGGESTIONS, 
  createEnhancedSkillTags,
  getCategoryColor,
  getCategoryIcon
} from '../services/advancedTaggingService'

const AdvancedSkillTagging = ({ 
  skills = [], 
  onChange, 
  jobRequirements = [],
  showRecommendations = true,
  allowCustomSkills = true,
  maxSkills = 20,
  className = ''
}) => {
  const [selectedSkills, setSelectedSkills] = useState(skills)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customSkill, setCustomSkill] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Enhanced skill suggestions based on current skills and job requirements
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [complementarySkills, setComplementarySkills] = useState([])

  useEffect(() => {
    generateSkillSuggestions()
  }, [selectedSkills, jobRequirements, selectedCategory])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const generateSkillSuggestions = () => {
    let suggestions = []
    
    // Get suggestions from taxonomy
    if (selectedCategory === 'all') {
      Object.values(SKILL_SUGGESTIONS).forEach(categorySkills => {
        Object.values(categorySkills).forEach(skillList => {
          suggestions.push(...skillList)
        })
      })
    } else if (SKILL_SUGGESTIONS[selectedCategory]) {
      Object.values(SKILL_SUGGESTIONS[selectedCategory]).forEach(skillList => {
        suggestions.push(...skillList)
      })
    }

    // Filter out already selected skills
    const selectedSkillNames = selectedSkills.map(s => 
      typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
    )
    
    suggestions = suggestions.filter(skill => 
      !selectedSkillNames.includes(skill.toLowerCase())
    )

    // Apply search filter
    if (searchTerm) {
      suggestions = suggestions.filter(skill =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Add job requirements that aren't selected
    const jobSkills = jobRequirements.filter(req => {
      const reqName = typeof req === 'string' ? req : req.name
      return !selectedSkillNames.includes(reqName.toLowerCase()) &&
             (!searchTerm || reqName.toLowerCase().includes(searchTerm.toLowerCase()))
    })

    setSkillSuggestions([...new Set([...jobSkills, ...suggestions])].slice(0, 20))
    
    // Generate complementary skills
    if (selectedSkills.length > 0 && showRecommendations) {
      generateComplementarySkills()
    }
  }

  const generateComplementarySkills = () => {
    const complementary = []
    const selectedSkillNames = selectedSkills.map(s => 
      (typeof s === 'string' ? s : s.name).toLowerCase()
    )

    // Programming language complementary skills
    if (selectedSkillNames.includes('javascript')) {
      if (!selectedSkillNames.includes('typescript')) complementary.push('TypeScript')
      if (!selectedSkillNames.includes('react')) complementary.push('React')
      if (!selectedSkillNames.includes('node.js')) complementary.push('Node.js')
    }

    if (selectedSkillNames.includes('python')) {
      if (!selectedSkillNames.includes('django')) complementary.push('Django')
      if (!selectedSkillNames.includes('flask')) complementary.push('Flask')
      if (!selectedSkillNames.includes('pandas')) complementary.push('Pandas')
    }

    if (selectedSkillNames.includes('react')) {
      if (!selectedSkillNames.includes('redux')) complementary.push('Redux')
      if (!selectedSkillNames.includes('next.js')) complementary.push('Next.js')
    }

    // Cloud complementary skills
    if (selectedSkillNames.includes('aws')) {
      if (!selectedSkillNames.includes('docker')) complementary.push('Docker')
      if (!selectedSkillNames.includes('kubernetes')) complementary.push('Kubernetes')
    }

    setComplementarySkills(complementary.slice(0, 5))
  }

  const addSkill = (skillToAdd) => {
    if (selectedSkills.length >= maxSkills) return

    const skillName = typeof skillToAdd === 'string' ? skillToAdd : skillToAdd.name
    const existingSkill = selectedSkills.find(s => 
      (typeof s === 'string' ? s : s.name).toLowerCase() === skillName.toLowerCase()
    )

    if (existingSkill) return

    const newSkill = typeof skillToAdd === 'string' 
      ? { name: skillToAdd, level: 'intermediate', verified: false }
      : skillToAdd

    const updatedSkills = [...selectedSkills, newSkill]
    setSelectedSkills(updatedSkills)
    onChange(updatedSkills)
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const removeSkill = (skillToRemove) => {
    const skillName = typeof skillToRemove === 'string' ? skillToRemove : skillToRemove.name
    const updatedSkills = selectedSkills.filter(s => 
      (typeof s === 'string' ? s : s.name) !== skillName
    )
    setSelectedSkills(updatedSkills)
    onChange(updatedSkills)
  }

  const updateSkillLevel = (skillName, level) => {
    const updatedSkills = selectedSkills.map(skill => {
      const currentName = typeof skill === 'string' ? skill : skill.name
      if (currentName === skillName) {
        return typeof skill === 'string' 
          ? { name: skill, level, verified: false }
          : { ...skill, level }
      }
      return skill
    })
    setSelectedSkills(updatedSkills)
    onChange(updatedSkills)
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && selectedSkills.length < maxSkills) {
      addSkill({
        name: customSkill.trim(),
        level: 'intermediate',
        verified: false,
        custom: true
      })
      setCustomSkill('')
      setShowCustomInput(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      technical: Code,
      soft: Users,
      domain: Building,
      certifications: Award
    }
    return icons[category] || Code
  }

  const isJobRequirement = (skillName) => {
    return jobRequirements.some(req => {
      const reqName = typeof req === 'string' ? req : req.name
      return reqName.toLowerCase() === skillName.toLowerCase()
    })
  }

  const getSkillPriority = (skillName) => {
    const requirement = jobRequirements.find(req => {
      const reqName = typeof req === 'string' ? req : req.name
      return reqName.toLowerCase() === skillName.toLowerCase()
    })
    return requirement && typeof requirement === 'object' ? requirement.priority : 'medium'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search skills or add custom..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (skillSuggestions.length > 0 || searchTerm) && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {skillSuggestions.map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill.name
                const isRequired = isJobRequirement(skillName)
                const priority = getSkillPriority(skillName)
                
                return (
                  <button
                    key={index}
                    onClick={() => addSkill(skill)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
                  >
                    <span className="flex items-center">
                      <span className="text-gray-900">{skillName}</span>
                      {isRequired && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          priority === 'critical' ? 'bg-red-100 text-red-800' :
                          priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          Required
                        </span>
                      )}
                    </span>
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                  </button>
                )
              })}
              
              {/* Custom skill option */}
              {allowCustomSkills && searchTerm && !skillSuggestions.some(s => 
                (typeof s === 'string' ? s : s.name).toLowerCase() === searchTerm.toLowerCase()
              ) && (
                <button
                  onClick={() => addSkill(searchTerm)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-t border-gray-100"
                >
                  <span className="flex items-center">
                    <Plus className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Add "{searchTerm}" as custom skill</span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(SKILL_TAXONOMY).map(([key, category]) => (
              <option key={key} value={key}>{category.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Selected Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">
            Selected Skills ({selectedSkills.length}/{maxSkills})
          </h4>
          {allowCustomSkills && (
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Custom
            </button>
          )}
        </div>

        {/* Custom Skill Input */}
        {showCustomInput && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter custom skill..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={addCustomSkill}
              disabled={!customSkill.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        )}

        {/* Skills Grid */}
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill, index) => {
            const skillName = typeof skill === 'string' ? skill : skill.name
            const skillLevel = typeof skill === 'object' ? skill.level : 'intermediate'
            const isVerified = typeof skill === 'object' ? skill.verified : false
            const isRequired = isJobRequirement(skillName)
            const priority = getSkillPriority(skillName)

            return (
              <div
                key={index}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isRequired 
                    ? priority === 'critical' 
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : priority === 'high'
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <span className="text-sm font-medium">{skillName}</span>
                
                {isVerified && (
                  <Check className="w-3 h-3 text-green-600" />
                )}
                
                {isRequired && (
                  <Star className="w-3 h-3 text-current" />
                )}

                {/* Skill Level Selector */}
                <select
                  value={skillLevel}
                  onChange={(e) => updateSkillLevel(skillName, e.target.value)}
                  className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>

                <button
                  onClick={() => removeSkill(skill)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>

        {selectedSkills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Code className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No skills selected yet</p>
            <p className="text-sm">Search and add skills above</p>
          </div>
        )}
      </div>

      {/* Complementary Skills Recommendations */}
      {showRecommendations && complementarySkills.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-500" />
            Recommended Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {complementarySkills.map((skill, index) => (
              <button
                key={index}
                onClick={() => addSkill(skill)}
                className="px-3 py-1 text-sm bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job Requirements Match */}
      {jobRequirements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Job Requirements Match</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {jobRequirements.map((requirement, index) => {
              const reqName = typeof requirement === 'string' ? requirement : requirement.name
              const priority = typeof requirement === 'object' ? requirement.priority : 'medium'
              const isMatched = selectedSkills.some(skill => 
                (typeof skill === 'string' ? skill : skill.name).toLowerCase() === reqName.toLowerCase()
              )

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    isMatched 
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : priority === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : priority === 'high'
                      ? 'bg-orange-50 border-orange-200 text-orange-800'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <span className="text-sm">{reqName}</span>
                  <div className="flex items-center gap-1">
                    {priority !== 'medium' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white bg-opacity-50">
                        {priority}
                      </span>
                    )}
                    {isMatched ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <button
                        onClick={() => addSkill(requirement)}
                        className="text-xs px-2 py-0.5 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedSkillTagging