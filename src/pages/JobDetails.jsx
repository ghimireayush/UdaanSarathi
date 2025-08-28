import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Eye, 
  Star,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Filter,
  UserCheck,
  Download,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { jobService, applicationService, candidateService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import InterviewScheduling from '../components/InterviewScheduling.jsx'
import ScheduledInterviews from '../components/ScheduledInterviews.jsx'
import DateDisplay, { CompactDateDisplay } from '../components/DateDisplay.jsx'

const JobDetails = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('applied')
  const [topNFilter, setTopNFilter] = useState(10)
  const [showShortlistPool, setShowShortlistPool] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  
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
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadAllData()
  }, [id, activeTab, topNFilter])
  
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
      const applied = detailedApplications.filter(item => item.application.stage === stages.APPLIED)
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
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {showSelectCheckbox && (
            <input
              type="checkbox"
              checked={selectedCandidates.has(candidate.id)}
              onChange={() => handleCandidateSelect(candidate.id)}
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
              onClick={() => onShortlist(candidate.id)}
              className="btn-primary text-xs px-3 py-1"
              disabled={isShortlisting}
            >
              <UserCheck className="w-3 h-3 mr-1" />
              {isShortlisting ? 'Shortlisting...' : 'Shortlist'}
            </button>
          )}
          
          <div className="flex items-center space-x-1">
            <button className="text-xs text-primary-600 hover:text-primary-800">
              <Eye className="w-3 h-3 mr-1 inline" />
              View Profile
            </button>
            <button className="text-xs text-gray-600 hover:text-gray-800">
              <Download className="w-3 h-3 mr-1 inline" />
              CV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'applied':
        const displayedCandidates = showShortlistPool ? shortlistedCandidates : appliedCandidates
        
        return (
          <div className="space-y-6">
            {/* Top N Filter */}
            {!showShortlistPool && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Show top:</label>
                  <select
                    value={topNFilter}
                    onChange={(e) => setTopNFilter(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={0}>View All</option>
                  </select>
                  <span className="text-sm text-gray-500">candidates (ranked by skill match)</span>
                </div>
                
                {selectedCandidates.size > 0 && (
                  <button
                    onClick={handleBulkReject}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isBulkRejecting}
                  >
                    <X className="w-4 h-4 mr-1 inline" />
                    {isBulkRejecting ? 'Rejecting...' : `Reject Selected (${selectedCandidates.size})`}
                  </button>
                )}
              </div>
            )}
            
            {/* Candidates List */}
            <div className="space-y-4">
              {displayedCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onShortlist={handleShortlist}
                  showShortlistButton={!showShortlistPool}
                  showSelectCheckbox={!showShortlistPool}
                />
              ))}
            </div>
            
            {/* Shortlist Pool Toggle */}
            {shortlistedCandidates.length > 0 && (
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowShortlistPool(!showShortlistPool)}
                  className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <UserCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-900">Shortlist Pool</p>
                      <p className="text-sm text-green-700">{shortlistedCandidates.length} candidates shortlisted</p>
                    </div>
                  </div>
                  {showShortlistPool ? (
                    <ChevronUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-green-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        )
        
      case 'shortlisted':
        return (
          <div className="space-y-4">
            {shortlistedCandidates.length > 0 ? (
              <InterviewScheduling 
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-blue-600">Applications</p>
                    <p className="text-lg font-semibold text-blue-900">{job.applications_count}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-green-600">Shortlisted</p>
                    <p className="text-lg font-semibold text-green-900">{job.shortlisted_count}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm text-purple-600">Views</p>
                    <p className="text-lg font-semibold text-purple-900">{analytics?.view_count || job.view_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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