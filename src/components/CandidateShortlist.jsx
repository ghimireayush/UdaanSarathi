import { useState, useEffect, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  TrendingUp,
  Award,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { formatInNepalTz, getRelativeTime, isToday } from '../utils/nepaliDate'
import CandidateSummaryS2 from './CandidateSummaryS2'

const CandidateShortlist = ({ 
  jobId, 
  candidates = [], 
  job = null,
  onUpdateCandidateStatus,
  onScheduleInterview,
  workflowStages = []
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('priority_score') // priority_score, applied_at, name
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [expandedCards, setExpandedCards] = useState(new Set())

  // Filter and sort candidates based on skill matching and priority
  const processedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      // Text search
      const matchesSearch = !searchTerm || 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Stage filter
      const matchesStage = filterStage === 'all' || candidate.stage === filterStage

      return matchesSearch && matchesStage
    })

    // Calculate skill match score if job tags exist
    if (job?.tags && job.tags.length > 0) {
      filtered = filtered.map(candidate => {
        const candidateSkills = candidate.skills || []
        const jobTags = job.tags || []
        
        // Calculate skill match percentage
        const matchingSkills = candidateSkills.filter(skill => 
          jobTags.some(tag => 
            skill.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        )
        
        const skillMatchScore = jobTags.length > 0 
          ? (matchingSkills.length / jobTags.length) * 100 
          : 0

        return {
          ...candidate,
          skillMatchScore,
          matchingSkills
        }
      })
    }

    // Sort candidates
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'priority_score':
          aValue = a.priority_score || 0
          bValue = b.priority_score || 0
          break
        case 'skill_match':
          aValue = a.skillMatchScore || 0
          bValue = b.skillMatchScore || 0
          break
        case 'applied_at':
          aValue = new Date(a.applied_at || 0).getTime()
          bValue = new Date(b.applied_at || 0).getTime()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        default:
          aValue = a.priority_score || 0
          bValue = b.priority_score || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [candidates, searchTerm, sortBy, sortOrder, filterStage, job])

  const toggleCardExpansion = (candidateId) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId)
    } else {
      newExpanded.add(candidateId)
    }
    setExpandedCards(newExpanded)
  }

  const getStageInfo = (stage) => {
    const stageConfig = workflowStages.find(s => s.id === stage) || { label: stage, color: 'gray' }
    return stageConfig
  }

  const getPriorityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getSkillMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate)
    setShowSummary(true)
  }

  const handleStatusUpdate = async (candidateId, newStage) => {
    if (onUpdateCandidateStatus) {
      await onUpdateCandidateStatus(candidateId, newStage)
    }
  }

  const handleAttachDocument = async (candidateId, document) => {
    // This would typically call an API to attach the document
    console.log('Attaching document:', document, 'to candidate:', candidateId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Shortlist</h2>
          {job && (
            <p className="text-gray-600 mt-1">
              {job.title} • {job.company} • {processedCandidates.length} candidates
            </p>
          )}
        </div>
        
        {job?.tags && job.tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Job Skills:</span>
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag, index) => (
                <span key={index} className="chip chip-primary text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search candidates by name, skills, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Stage Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="all">All Stages</option>
                {workflowStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="priority_score">Priority Score</option>
                {job?.tags && job.tags.length > 0 && (
                  <option value="skill_match">Skill Match</option>
                )}
                <option value="applied_at">Application Date</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {processedCandidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500">
              {searchTerm || filterStage !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No candidates have applied for this position yet'
              }
            </p>
          </div>
        ) : (
          processedCandidates.map((candidate) => {
            const isExpanded = expandedCards.has(candidate.id)
            const stageInfo = getStageInfo(candidate.stage)
            const appliedToday = isToday(candidate.applied_at)

            return (
              <div key={candidate.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                {/* Main Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left Side - Candidate Info */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-medium text-gray-600">
                            {candidate.name?.charAt(0)}
                          </span>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {candidate.name}
                            </h3>
                            {appliedToday && (
                              <span className="chip chip-green text-xs">New Today</span>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{candidate.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{candidate.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{candidate.address}</span>
                            </div>
                          </div>

                          {/* Skills Preview */}
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {candidate.skills.slice(0, 4).map((skill, index) => {
                                const isMatching = candidate.matchingSkills?.includes(skill)
                                return (
                                  <span 
                                    key={index} 
                                    className={`chip text-xs ${
                                      isMatching ? 'chip-green' : 'chip-gray'
                                    }`}
                                  >
                                    {skill}
                                    {isMatching && <Star className="w-3 h-3 ml-1" />}
                                  </span>
                                )
                              })}
                              {candidate.skills.length > 4 && (
                                <span className="chip chip-gray text-xs">
                                  +{candidate.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Application Date */}
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Applied {getRelativeTime(candidate.applied_at)}</span>
                            <span className="mx-2">•</span>
                            <span>{formatInNepalTz(candidate.applied_at, 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Scores and Actions */}
                    <div className="flex flex-col items-end space-y-3 ml-6">
                      {/* Priority Score */}
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(candidate.priority_score)}`}>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{candidate.priority_score || 0}%</span>
                        </div>
                      </div>

                      {/* Skill Match Score */}
                      {candidate.skillMatchScore !== undefined && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSkillMatchColor(candidate.skillMatchScore)}`}>
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4" />
                            <span>{Math.round(candidate.skillMatchScore)}% match</span>
                          </div>
                        </div>
                      )}

                      {/* Current Stage */}
                      <span className={`chip chip-${stageInfo.color || 'gray'} text-xs`}>
                        {stageInfo.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCandidateClick(candidate)}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        <button
                          onClick={() => toggleCardExpansion(candidate.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Professional Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Professional Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Experience:</span>
                              <span className="font-medium">{candidate.experience}</span>
                            </div>
                            {candidate.education && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Education:</span>
                                <span className="font-medium">{candidate.education}</span>
                              </div>
                            )}
                            {candidate.salary_expectation && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expected Salary:</span>
                                <span className="font-medium">{candidate.salary_expectation}</span>
                              </div>
                            )}
                            {candidate.availability && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Availability:</span>
                                <span className="font-medium">{candidate.availability}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* All Skills */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">All Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.map((skill, index) => {
                                const isMatching = candidate.matchingSkills?.includes(skill)
                                return (
                                  <span 
                                    key={index} 
                                    className={`chip text-xs ${
                                      isMatching ? 'chip-green' : 'chip-gray'
                                    }`}
                                  >
                                    {skill}
                                    {isMatching && <Star className="w-3 h-3 ml-1" />}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                            <button
                              onClick={() => onScheduleInterview && onScheduleInterview(candidate.id)}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Schedule Interview
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Update Status:</span>
                            <select
                              value={candidate.stage}
                              onChange={(e) => handleStatusUpdate(candidate.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              {workflowStages.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Candidate Summary Modal */}
      <CandidateSummaryS2
        candidate={selectedCandidate}
        isOpen={showSummary}
        onClose={() => {
          setShowSummary(false)
          setSelectedCandidate(null)
        }}
        onUpdateStatus={handleStatusUpdate}
        onAttachDocument={handleAttachDocument}
        workflowStages={workflowStages}
      />
    </div>
  )
}

export default CandidateShortlist