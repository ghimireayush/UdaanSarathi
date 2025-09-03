import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Eye, 
  Star,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  UserCheck,
  Download,
  Phone,
  FileText,
  Mail,
  GraduationCap,
  Heart,
  Briefcase,
  Home,
  CheckCircle,
  ExclamationTriangle
} from 'lucide-react'
import { jobService, applicationService, candidateService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import EnhancedInterviewScheduling from '../components/EnhancedInterviewScheduling.jsx'
import ScheduledInterviews from '../components/ScheduledInterviews.jsx'


const JobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'applied')
  const [topNFilter, setTopNFilter] = useState(parseInt(searchParams.get('limit')) || 10)
  const [showShortlistPool, setShowShortlistPool] = useState(searchParams.get('view') === 'shortlist')
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [selectedTags, setSelectedTags] = useState(searchParams.get('tags')?.split(',').filter(Boolean) || [])
  const [availableTags, setAvailableTags] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // State for service layer data
  const [job, setJob] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [appliedCandidates, setAppliedCandidates] = useState([])
  const [shortlistedCandidates, setShortlistedCandidates] = useState([])
  const [scheduledCandidates, setScheduledCandidates] = useState([])
  const [applicationStages, setApplicationStages] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isShortlisting, setIsShortlisting] = useState(false)
  const [isBulkRejecting, setIsBulkRejecting] = useState(false)
  const [isCompletingShortlisting, setIsCompletingShortlisting] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadAllData()
  }, [id, activeTab, topNFilter, selectedTags])

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        handleCloseSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])
  
  const loadAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load constants first
      const stages = await constantsService.getApplicationStages()
      setApplicationStages(stages)
      
      // Load job details
      const jobData = await jobService.getJobById(id)
      if (!jobData) {
        setError(new Error('Job not found'))
        return
      }
      setJob(jobData)
      
      // Set available tags from job tags
      if (jobData.tags && jobData.tags.length > 0) {
        setAvailableTags(jobData.tags);
      }
      
      // Load analytics data
      const analyticsData = {
        view_count: jobData.view_count || 0,
        total_applicants: jobData.applications_count || 0,
        shortlisted_count: jobData.shortlisted_count || 0,
        passed_count: jobData.passed_count || 0
      }
      setAnalytics(analyticsData)
      
      // Load all applications for this job
      const allJobApplications = await applicationService.getApplicationsByJobId(id)
      
      // Get detailed applications with candidate data
      const detailedApplications = await Promise.all(
        allJobApplications.map(async (app) => {
          const candidate = await candidateService.getCandidateById(app.candidate_id)
          return {
            ...candidate,
            application: app
          }
        })
      )
      
      // Filter by stage
      let applied = detailedApplications.filter(item => item.application.stage === stages.APPLIED)
      
      // Apply skill-based filtering if tags are selected
      if (selectedTags.length > 0) {
        applied = applied.filter(candidate => {
          // Check if candidate has ALL selected tags (AND semantics)
          return selectedTags.every(tag => 
            candidate.skills.includes(tag) || 
            (job && job.tags && job.tags.includes(tag))
          );
        });
      }
      
      // Sort by priority score (highest first)
      // Note: Backend handles all ranking algorithms based on skill matching criteria
      // Priority scores are calculated server-side using sophisticated matching algorithms
      applied.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
      
      const shortlisted = detailedApplications.filter(item => item.application.stage === stages.SHORTLISTED)
      const scheduled = detailedApplications.filter(item => item.application.stage === stages.SCHEDULED)
      
      setAppliedCandidates(applied.slice(0, activeTab === 'applied' ? topNFilter : applied.length))
      setShortlistedCandidates(shortlisted)
      setScheduledCandidates(scheduled)
      
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCandidateSelect = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }
  
  const updateUrlParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
  }

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      updateUrlParams({ tags: newTags.join(',') })
    }
  }
  
  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(newTags)
    updateUrlParams({ tags: newTags.length > 0 ? newTags.join(',') : null })
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    updateUrlParams({ tab: tabId })
  }

  const handleTopNFilterChange = (value) => {
    setTopNFilter(value)
    updateUrlParams({ limit: value === 10 ? null : value })
  }

  const handleShowShortlistPoolChange = (show) => {
    setShowShortlistPool(show)
    updateUrlParams({ view: show ? 'shortlist' : null })
  }
  
  const handleShortlist = async (candidateId) => {
    try {
      setIsShortlisting(true)
      const candidate = appliedCandidates.find(c => c.id === candidateId)
      if (candidate && candidate.application) {
        await applicationService.updateApplicationStage(
          candidate.application.id, 
          applicationStages.SHORTLISTED
        )
        loadAllData() // Reload data
      }
    } catch (error) {
      console.error('Failed to shortlist candidate:', error)
      setError(error)
    } finally {
      setIsShortlisting(false)
    }
  }
  
  const handleBulkReject = async () => {
    if (selectedCandidates.size === 0) return
    
    try {
      setIsBulkRejecting(true)
      const applicationIds = Array.from(selectedCandidates).map(candidateId => {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        return candidate?.application?.id
      }).filter(Boolean)
      
      await Promise.all(
        applicationIds.map(appId => 
          applicationService.updateApplicationStage(
            appId, 
            applicationStages.REJECTED
          )
        )
      )
      
      setSelectedCandidates(new Set())
      loadAllData() // Reload data
    } catch (error) {
      console.error('Failed to bulk reject candidates:', error)
      setError(error)
    } finally {
      setIsBulkRejecting(false)
    }
  }

  const handleBulkShortlist = async () => {
    if (selectedCandidates.size === 0) return
    
    try {
      setIsShortlisting(true)
      const applicationIds = Array.from(selectedCandidates).map(candidateId => {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        return candidate?.application?.id
      }).filter(Boolean)
      
      await Promise.all(
        applicationIds.map(appId => 
          applicationService.updateApplicationStage(
            appId, 
            applicationStages.SHORTLISTED
          )
        )
      )
      
      setSelectedCandidates(new Set())
      loadAllData() // Reload data
    } catch (error) {
      console.error('Failed to bulk shortlist candidates:', error)
      setError(error)
    } finally {
      setIsShortlisting(false)
    }
  }

  const handleBulkSchedule = () => {
    if (selectedCandidates.size === 0) return
    
    // Navigate to shortlisted tab with selected candidates for scheduling
    const candidateIds = Array.from(selectedCandidates)
    handleTabChange('shortlisted')
    // You could pass the selected candidate IDs to pre-select them in the scheduling interface
    setSelectedCandidates(new Set())
  }

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
  }

  const handleToggleShortlist = async (candidate) => {
    try {
      const isCurrentlyShortlisted = candidate.application.stage === applicationStages.SHORTLISTED
      const newStage = isCurrentlyShortlisted ? applicationStages.APPLIED : applicationStages.SHORTLISTED
      
      await applicationService.updateApplicationStage(candidate.application.id, newStage)
      loadAllData() // Reload data
      
      // Update the selected candidate if it's the same one
      if (selectedCandidate && selectedCandidate.id === candidate.id) {
        const updatedCandidate = { ...candidate }
        updatedCandidate.application.stage = newStage
        setSelectedCandidate(updatedCandidate)
      }
    } catch (error) {
      console.error('Failed to toggle shortlist:', error)
      setError(error)
    }
  }

  const handleCompleteShortlisting = () => {
    setShowCompletionDialog(true)
  }

  const handleConfirmCompleteShortlisting = async () => {
    try {
      setIsCompletingShortlisting(true)
      setShowCompletionDialog(false)
      
      // Get all non-shortlisted applications for this job
      const allJobApplications = await applicationService.getApplicationsByJobId(id)
      const nonShortlistedApplications = allJobApplications.filter(
        app => app.stage === applicationStages.APPLIED
      )
      
      // Bulk reject all non-shortlisted applications
      await Promise.all(
        nonShortlistedApplications.map(app => 
          applicationService.updateApplicationStage(app.id, applicationStages.REJECTED)
        )
      )
      
      // Reload data to reflect changes
      loadAllData()
      
      // Show success message or notification here if you have a toast system
      console.log(`Successfully rejected ${nonShortlistedApplications.length} non-shortlisted candidates`)
      
    } catch (error) {
      console.error('Failed to complete shortlisting:', error)
      setError(error)
    } finally {
      setIsCompletingShortlisting(false)
    }
  }
  
  const tabs = [
    { id: 'applied', label: 'Applied', count: appliedCandidates.length },
    { id: 'shortlisted', label: 'Shortlisted', count: shortlistedCandidates.length },
    { id: 'scheduled', label: 'Scheduled', count: scheduledCandidates.length }
  ]
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between py-4 border-b">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error?.message === 'Job not found' ? 'Job not found' : 'Failed to load job'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message === 'Job not found' 
              ? "The job you're looking for doesn't exist or has been removed."
              : error?.message || 'An error occurred while loading the job details.'
            }
          </p>
          <div className="space-x-3">
            <button 
              onClick={loadAllData}
              className="btn-secondary"
            >
              Retry
            </button>
            <Link to="/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  const CandidateCard = ({ candidate, onShortlist, showShortlistButton = false, showSelectCheckbox = false }) => (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => handleCandidateClick(candidate)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {showSelectCheckbox && (
            <input
              type="checkbox"
              checked={selectedCandidates.has(candidate.id)}
              onChange={(e) => {
                e.stopPropagation()
                handleCandidateSelect(candidate.id)
              }}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          )}
          
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-600">
              {candidate.name.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
              {candidate.priority_score && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">{candidate.priority_score}</span>
                </div>
              )}
            </div>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{candidate.address}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-1" />
                <span>{candidate.phone}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-1" />
                <span>{candidate.experience} experience</span>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {candidate.skills.slice(0, 4).map((skill, index) => (
                <span key={index} className="chip chip-blue text-xs">
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{candidate.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className="text-xs text-gray-500">
            Applied {format(new Date(candidate.applied_at), 'MMM dd')}
          </span>
          
          {showShortlistButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShortlist(candidate.id)
              }}
              className="btn-primary text-xs px-3 py-1"
              disabled={isShortlisting}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              {isShortlisting ? 'Shortlisting...' : 'Shortlist'}
            </button>
          )}
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              <Eye className="w-3 h-3 mr-1 inline" />
              View Profile
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              <Download className="w-3 h-3 mr-1 inline" />
              CV
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const CompletionConfirmationDialog = ({ isOpen, onClose, onConfirm, nonShortlistedCount, shortlistedCount }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
          
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Mark Shortlisting Complete
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    This action will finalize the shortlisting process for this job. Here's what will happen:
                  </p>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Implications:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>{nonShortlistedCount} remaining applicants</strong> will be automatically rejected</li>
                      <li>• <strong>{shortlistedCount} shortlisted candidates</strong> will proceed to the next stage</li>
                      <li>• This action cannot be undone</li>
                      <li>• Rejected candidates will be notified automatically</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✅ After completion:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• You can proceed to schedule interviews with shortlisted candidates</li>
                      <li>• The job will move to the interview scheduling phase</li>
                      <li>• All application data will be preserved for reporting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onConfirm}
                disabled={isCompletingShortlisting}
              >
                {isCompletingShortlisting ? 'Processing...' : 'Yes, Complete Shortlisting'}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={isCompletingShortlisting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CandidateSidebar = ({ candidate, isOpen, onClose, onToggleShortlist }) => {
    if (!isOpen || !candidate) return null

    const isShortlisted = candidate.application.stage === applicationStages.SHORTLISTED

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Applicant Summary</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Section */}
              <div className="mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600">
                      {candidate.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{candidate.name}</h3>
                    {candidate.priority_score && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-medium text-gray-700">Priority Score: {candidate.priority_score}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Applied {format(new Date(candidate.applied_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Phone</div>
                      <div className="text-sm text-gray-600">{candidate.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email</div>
                      <div className="text-sm text-gray-600">{candidate.email}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Address
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{candidate.address}</p>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span key={index} className="chip chip-blue">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Education
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{candidate.education || 'Not specified'}</p>
                </div>
              </div>

              {/* Experience */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Experience
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{candidate.experience}</p>
                </div>
              </div>

              {/* Preferences */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Preferences
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Preferred Salary</div>
                      <div className="text-sm text-gray-600">{candidate.preferred_salary || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Availability</div>
                      <div className="text-sm text-gray-600">{candidate.availability || 'Immediate'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CV Section */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">CV</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.name}_CV.pdf
                        </div>
                        <div className="text-xs text-gray-500">PDF • 2.3 MB</div>
                      </div>
                    </div>
                    <button className="btn-secondary text-sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-6">
              <button
                onClick={() => onToggleShortlist(candidate)}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-md font-medium transition-colors ${
                  isShortlisted
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <UserCheck className="w-5 h-5 mr-2" />
                {isShortlisted ? 'Remove from Shortlist Pool' : 'Add to Shortlist Pool'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'applied':
        const displayedCandidates = showShortlistPool ? shortlistedCandidates : appliedCandidates
        
        return (
          <div className="space-y-6">
            {/* Why I'm here section */}
            {!showShortlistPool && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800">Why I'm here</h3>
                <p className="text-sm text-blue-700 mt-1">Verify applicants for this job and shortlist candidates.</p>
                <div className="mt-2 text-xs text-blue-600">
                  💡 Candidates are automatically ranked by skill/education match. Use filters to refine results.
                </div>
              </div>
            )}
            
            {/* Skill-Based Filtering */}
            {!showShortlistPool && (
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Skill-Based Filtering (priority ranking)</h3>
                  <div className="flex items-center space-x-4 mt-2 md:mt-0">
                    <label className="text-sm font-medium text-gray-700">Show top:</label>
                    <select
                      value={topNFilter}
                      onChange={(e) => handleTopNFilterChange(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                      <option value={0}>View All ({appliedCandidates.length})</option>
                    </select>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  Candidates ranked to the top by skill/education match. Select prioritized tags (AND semantics) to refine results:
                </p>
                
                {/* Results summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      Showing {appliedCandidates.length} of {appliedCandidates.length} candidates
                      {selectedTags.length > 0 && (
                        <span className="text-blue-600 ml-1">
                          (filtered by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''})
                        </span>
                      )}
                      {(searchParams.toString() && searchParams.toString() !== 'tab=applied') && (
                        <span className="text-green-600 ml-2 text-xs">
                          • Filters preserved in URL
                        </span>
                      )}
                    </span>
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedTags([])
                          updateUrlParams({ tags: null })
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Shortlisting Progress */}
                {shortlistedCandidates.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <h4 className="text-sm font-semibold text-green-800">Shortlisting Progress</h4>
                          <p className="text-sm text-green-700">
                            {shortlistedCandidates.length} candidate{shortlistedCandidates.length !== 1 ? 's' : ''} shortlisted, 
                            {' '}{appliedCandidates.length} remaining to review
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-800">
                          {Math.round((shortlistedCandidates.length / (shortlistedCandidates.length + appliedCandidates.length)) * 100)}%
                        </div>
                        <div className="text-xs text-green-600">Complete</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      AND: {tag}
                      <button 
                        type="button" 
                        className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* Available Tags */}
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => addTag(tag)}
                      className={`text-xs px-2 py-1 rounded ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Tag sources: original job tags + prioritized tags selected here (removable).
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            {!showShortlistPool && (
              <div className="flex justify-between items-center mb-4">
                <div>
                  {shortlistedCandidates.length > 0 && (
                    <button
                      onClick={handleCompleteShortlisting}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      disabled={isCompletingShortlisting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isCompletingShortlisting ? 'Processing...' : 'Mark Shortlisting Complete'}
                    </button>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedCandidates.size > 0 && (
                    <>
                      <button
                        onClick={handleBulkShortlist}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={isShortlisting}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {isShortlisting ? 'Shortlisting...' : `Shortlist (${selectedCandidates.size})`}
                      </button>
                      <button
                        onClick={handleBulkSchedule}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-md transition-colors flex items-center"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule ({selectedCandidates.size})
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        disabled={isBulkRejecting}
                      >
                        <X className="w-4 h-4 mr-1" />
                        {isBulkRejecting ? 'Rejecting...' : `Reject (${selectedCandidates.size})`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Candidates List Header */}
            {showShortlistPool && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-900 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Shortlisted Candidates ({shortlistedCandidates.length})
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  These candidates have been shortlisted for this position. Click any candidate to view their full profile.
                </p>
              </div>
            )}

            {/* Candidates List */}
            <div className="space-y-4">
              {displayedCandidates.length > 0 ? (
                displayedCandidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onShortlist={handleShortlist}
                    showShortlistButton={!showShortlistPool}
                    showSelectCheckbox={!showShortlistPool}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {showShortlistPool ? 'No shortlisted candidates' : 'No candidates found'}
                  </h3>
                  <p className="text-gray-600">
                    {showShortlistPool 
                      ? 'Start by shortlisting candidates from the applied candidates list.'
                      : 'Try adjusting your filters or check back later for new applications.'
                    }
                  </p>
                </div>
              )}
            </div>
            
            {/* Shortlist Pool Toggle */}
            {shortlistedCandidates.length > 0 && (
              <div className="border-t pt-6">
                <button
                  onClick={() => handleShowShortlistPoolChange(!showShortlistPool)}
                  className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-900 text-lg">Shortlist Pool</p>
                      <p className="text-sm text-green-700">
                        {shortlistedCandidates.length} candidate{shortlistedCandidates.length !== 1 ? 's' : ''} shortlisted
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {showShortlistPool ? 'Click to show applied candidates' : 'Click to view shortlisted candidates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                      {shortlistedCandidates.length}
                    </span>
                    {showShortlistPool ? (
                      <ChevronUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        )
        
      case 'shortlisted':
        return (
          <div className="space-y-4">
            {shortlistedCandidates.length > 0 ? (
              <EnhancedInterviewScheduling 
                candidates={shortlistedCandidates}
                jobId={id}
                onScheduled={() => {
                  // Refresh data after scheduling
                  loadAllData()
                }}
              />
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shortlisted candidates</h3>
                <p className="text-gray-600">Start by shortlisting candidates from the Applied tab.</p>
              </div>
            )}
          </div>
        )
        
      case 'scheduled':
        return (
          <div className="space-y-4">
            {scheduledCandidates.length > 0 ? (
              <ScheduledInterviews 
                candidates={scheduledCandidates}
                jobId={id}
              />
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled interviews</h3>
                <p className="text-gray-600">Schedule interviews from the Shortlisted tab to see them here.</p>
              </div>
            )}
          </div>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Completion Confirmation Dialog */}
      <CompletionConfirmationDialog
        isOpen={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        onConfirm={handleConfirmCompleteShortlisting}
        nonShortlistedCount={appliedCandidates.length}
        shortlistedCount={shortlistedCandidates.length}
      />

      {/* Candidate Sidebar */}
      <CandidateSidebar
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onToggleShortlist={handleToggleShortlist}
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link to="/jobs" className="hover:text-primary-600 transition-colors">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-gray-900">{job.title}</span>
      </div>
      
      {/* Job Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-lg text-gray-600">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{job.city}, {job.country}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Posted {format(new Date(job.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <Link to="/jobs" className="btn-secondary flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Link>
            </div>
            
            {/* Analytics Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">View Count</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics?.view_count || job.view_count || 0}</p>
                      <p className="text-xs text-purple-700">Individual job views</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Applicant Count</p>
                      <div className="text-lg font-semibold text-blue-900">
                        <div>Total: {analytics?.total_applicants || job.applications_count || 0}</div>
                        <div>Shortlisted: {analytics?.shortlisted_count || job.shortlisted_count || 0}</div>
                        <div>Passed: {analytics?.passed_count || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Candidates by Phase */}
      <div className="card mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Candidates by phase</h2>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default JobDetails