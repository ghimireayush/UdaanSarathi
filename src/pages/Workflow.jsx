import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Users, 
  Search, 
  FileText, 
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Briefcase,
  Paperclip
} from 'lucide-react'
import { applicationService, candidateService, constantsService } from '../services/index.js'
import { format } from 'date-fns'

import CandidateSummaryS2 from '../components/CandidateSummaryS2.jsx'
import InteractivePagination, { PaginationInfo, ItemsPerPageSelector } from '../components/InteractiveUI/InteractivePagination.jsx'

const Workflow = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'by-job')
  const [selectedStage, setSelectedStage] = useState(searchParams.get('stage') || 'interview-passed')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [allCandidates, setAllCandidates] = useState([]) // Store all candidates for pagination
  
  // Data state
  const [candidates, setCandidates] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Workflow stages configuration - Full 15-step pipeline
  const workflowStages = [
    { id: 'applied', label: 'Applied', icon: FileText, description: 'Initial application submitted' },
    { id: 'shortlisted', label: 'Shortlisted', icon: CheckCircle, description: 'Selected for interview' },
    { id: 'interview-scheduled', label: 'Interview Scheduled', icon: Calendar, description: 'Interview appointment set' },
    { id: 'interview-passed', label: 'Interview Passed', icon: Users, description: 'Successfully completed interview' },
    { id: 'medical-scheduled', label: 'Medical Scheduled', icon: Calendar, description: 'Medical examination appointment' },
    { id: 'medical-passed', label: 'Medical Passed', icon: CheckCircle, description: 'Medical clearance obtained' },
    { id: 'visa-application', label: 'Visa Application', icon: FileText, description: 'Visa application submitted' },
    { id: 'visa-approved', label: 'Visa Approved', icon: CheckCircle, description: 'Visa approval received' },
    { id: 'police-clearance', label: 'Police Clearance', icon: FileText, description: 'Police clearance certificate' },
    { id: 'embassy-attestation', label: 'Embassy Attestation', icon: FileText, description: 'Document attestation process' },
    { id: 'travel-documents', label: 'Travel Documents', icon: FileText, description: 'Travel documents prepared' },
    { id: 'flight-booking', label: 'Flight Booking', icon: Calendar, description: 'Flight tickets booked' },
    { id: 'pre-departure', label: 'Pre-Departure', icon: Clock, description: 'Pre-departure preparations' },
    { id: 'departed', label: 'Departed', icon: MapPin, description: 'Candidate has departed' },
    { id: 'ready-to-fly', label: 'Ready to Fly', icon: CheckCircle, description: 'Fully processed and ready' }
  ]

  useEffect(() => {
    loadWorkflowData()
  }, [selectedStage, activeTab])

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load application stages (for future use)
      await constantsService.getApplicationStages()

      // Always load ALL candidates for analytics calculation
      const allCandidatesData = await applicationService.getAllCandidatesInWorkflow()

      // Enrich with candidate details
      const allEnrichedCandidates = await Promise.all(
        allCandidatesData.map(async (item) => {
          const candidate = await candidateService.getCandidateById(item.candidate_id)
          return {
            ...candidate,
            application: item,
            job_title: item.job_title,
            interviewed_at: item.interviewed_at,
            interview_remarks: item.interview_remarks,
            documents: item.documents || []
          }
        })
      )

      // Filter candidates for display based on selected stage
      const filteredCandidates = allEnrichedCandidates.filter(c => c.application.stage === selectedStage)
      setAllCandidates(filteredCandidates) // Store all filtered candidates
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage
      const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage)
      setCandidates(paginatedCandidates)

      // Calculate analytics using ALL candidates (not just filtered ones)
      const analyticsData = calculateAnalytics(allEnrichedCandidates)
      setAnalytics(analyticsData)

    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnalytics = (candidatesData) => {
    const stageCounts = workflowStages.reduce((acc, stage) => {
      acc[stage.id] = candidatesData.filter(c => c.application.stage === stage.id).length
      return acc
    }, {})

    const totalCandidates = candidatesData.length
    const readyToFly = stageCounts['ready-to-fly'] || 0
    const departed = stageCounts['departed'] || 0
    const totalProcessed = readyToFly + departed

    return {
      stageCounts,
      totalCandidates,
      readyToFly,
      departed,
      totalProcessed,
      summary: `${totalProcessed} ready to fly of ${totalCandidates}`,
      conversionRate: totalCandidates > 0 ? ((totalProcessed / totalCandidates) * 100).toFixed(1) : 0
    }
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    updateUrlParams({ tab })
  }

  const handleStageChange = (stage) => {
    setSelectedStage(stage)
    updateUrlParams({ stage })
  }

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate)
    setIsSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
  }

  const handleUpdateStatus = async (candidateId, newStage) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId)
      if (candidate) {
        await applicationService.updateApplicationStage(candidate.application.id, newStage)
        loadWorkflowData() // Reload data
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleAttachDocument = async (candidateId, document) => {
    try {
      await applicationService.attachDocument(candidateId, document)
      loadWorkflowData() // Reload data
    } catch (error) {
      console.error('Failed to attach document:', error)
    }
  }

  // Filter candidates based on search query (for By Applicant tab)
  const filteredCandidates = candidates.filter(candidate => {
    if (activeTab === 'by-job') return true
    
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      candidate.phone?.toLowerCase().includes(query) ||
      candidate.passport_number?.toLowerCase().includes(query) ||
      candidate.name?.toLowerCase().includes(query) ||
      candidate.email?.toLowerCase().includes(query) ||
      candidate.job_title?.toLowerCase().includes(query)
    )
  })

  // Group candidates by job for "By Job Post" view
  const candidatesByJob = activeTab === 'by-job' ? 
    filteredCandidates.reduce((acc, candidate) => {
      const jobTitle = candidate.job_title || 'Unknown Job'
      if (!acc[jobTitle]) {
        acc[jobTitle] = []
      }
      acc[jobTitle].push(candidate)
      return acc
    }, {}) : {}

  // Pagination logic
  const totalCandidates = filteredCandidates.length
  const totalPages = Math.ceil(totalCandidates / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex)

  // Reset to first page when stage changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStage, activeTab, searchQuery])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-16 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load workflow data</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button onClick={loadWorkflowData} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Pipeline</h1>
        <p className="text-gray-600">Manage candidates through the post-interview process</p>
      </div>

      {/* Analytics */}
      <div className="mb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Candidates</p>
                <p className="text-3xl font-bold">{analytics.totalCandidates || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ready to Fly</p>
                <p className="text-3xl font-bold">{analytics.readyToFly || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Departed</p>
                <p className="text-3xl font-bold">{analytics.departed || 0}</p>
              </div>
              <MapPin className="w-10 h-10 text-purple-200" />
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold">{analytics.conversionRate || 0}%</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-200" />
            </div>
          </div>
        </div>
        
        {/* Circular Stage Overview */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {workflowStages.slice(0, 8).map((stage) => {
            const count = analytics.stageCounts?.[stage.id] || 0
            const isActive = stage.id === selectedStage
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col items-center cursor-pointer transition-all hover:scale-105"
                onClick={() => handleStageChange(stage.id)}
              >
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center bg-white border-2 border-gray-300
                  text-gray-900 font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:border-gray-400
                  ${isActive ? 'ring-4 ring-primary-300 scale-110 border-primary-500 bg-primary-50 text-primary-700' : ''}
                `}>
                  {count}
                </div>
                <p className={`text-xs text-center mt-2 font-medium leading-tight ${
                  isActive ? 'text-primary-600' : 'text-gray-700'
                }`}>
                  {stage.label}
                </p>
                {count > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {count} candidate{count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        

      </div>



      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('by-job')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'by-job'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              By Job Post
            </button>
            <button
              onClick={() => handleTabChange('by-applicant')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'by-applicant'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              By Applicant
            </button>
          </nav>
        </div>
      </div>

      {/* Search (for By Applicant tab) */}
      {activeTab === 'by-applicant' && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by phone, passport, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Pagination Controls - Top */}
      {filteredCandidates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCandidates}
              itemsPerPage={itemsPerPage}
            />
            <div className="flex items-center gap-4">
              <ItemsPerPageSelector
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                options={[5, 10, 25, 50]}
              />
              <InteractivePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                size="sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="space-y-6">
        {filteredCandidates.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">
              {activeTab === 'by-applicant' && searchQuery
                ? 'No candidates match your search criteria.'
                : `No candidates in ${workflowStages.find(s => s.id === selectedStage)?.label} stage.`
              }
            </p>
          </div>
        ) : activeTab === 'by-job' ? (
          // Group by Job Post view - paginated
          (() => {
            const paginatedJobEntries = Object.entries(candidatesByJob).slice(startIndex, endIndex)
            return paginatedJobEntries.map(([jobTitle, jobCandidates]) => (
              <div key={jobTitle} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
                      {jobTitle}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {jobCandidates.length} candidate{jobCandidates.length !== 1 ? 's' : ''} in {workflowStages.find(s => s.id === selectedStage)?.label} stage
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="chip chip-blue">
                      {jobCandidates.length}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {jobCandidates.map((candidate) => (
                    <CandidateWorkflowCard
                      key={candidate.id}
                      candidate={candidate}
                      onCandidateClick={handleCandidateClick}
                      onUpdateStatus={handleUpdateStatus}
                      onAttachDocument={handleAttachDocument}
                      workflowStages={workflowStages}
                      showJobTitle={false}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            ))
          })()
        ) : (
          // By Applicant view - paginated
          <div className="space-y-4">
            {paginatedCandidates.map((candidate) => (
              <CandidateWorkflowCard
                key={candidate.id}
                candidate={candidate}
                onCandidateClick={handleCandidateClick}
                onUpdateStatus={handleUpdateStatus}
                onAttachDocument={handleAttachDocument}
                workflowStages={workflowStages}
                showJobTitle={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls - Bottom */}
      {filteredCandidates.length > itemsPerPage && (
        <div className="mt-8 flex justify-center">
          <InteractivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            size="md"
          />
        </div>
      )}

      {/* Candidate Summary Sidebar */}
      <CandidateSummaryS2
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onUpdateStatus={handleUpdateStatus}
        onAttachDocument={handleAttachDocument}
        workflowStages={workflowStages}
      />
    </div>
  )
}

const CandidateWorkflowCard = ({ 
  candidate, 
  onCandidateClick, 
  onUpdateStatus, 
  onAttachDocument, 
  workflowStages,
  showJobTitle = false,
  compact = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStage) => {
    setIsUpdating(true)
    try {
      await onUpdateStatus(candidate.id, newStage)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStage = workflowStages.find(s => s.id === candidate.application.stage)

  return (
    <div className={`${compact ? 'border border-gray-200 rounded-lg p-4' : 'card p-6'} hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div 
          className="flex items-start space-x-4 flex-1"
          onClick={() => onCandidateClick(candidate)}
        >
          <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-gray-200 rounded-full flex items-center justify-center`}>
            <span className={`${compact ? 'text-sm' : 'text-lg'} font-medium text-gray-600`}>
              {candidate.name?.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-gray-900`}>
                {candidate.name}
              </h3>
              {currentStage && (
                <span className="chip chip-blue text-xs">
                  {currentStage.label}
                </span>
              )}
            </div>
            
            {showJobTitle && candidate.job_title && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Briefcase className="w-4 h-4 mr-1" />
                <span className="font-medium">{candidate.job_title}</span>
              </div>
            )}
            
            <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-2 text-sm text-gray-600`}>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                <span>{candidate.phone}</span>
              </div>
              {candidate.passport_number && (
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  <span>Passport: {candidate.passport_number}</span>
                </div>
              )}
            </div>
            
            {candidate.interviewed_at && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-medium">Interviewed:</span> 
                <span className="ml-1">{format(new Date(candidate.interviewed_at), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            )}
            
            {candidate.interview_remarks && !compact && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Remarks:</span> 
                <span className="ml-1">{candidate.interview_remarks.substring(0, 100)}{candidate.interview_remarks.length > 100 ? '...' : ''}</span>
              </div>
            )}
            
            {candidate.documents && candidate.documents.length > 0 && (
              <div className="mt-2 flex items-center">
                <Paperclip className="w-4 h-4 mr-1 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {candidate.documents.length} document{candidate.documents.length !== 1 ? 's' : ''} attached
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle document attachment - could open a modal or file picker
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
              input.onchange = (event) => {
                const files = Array.from(event.target.files)
                files.forEach(file => {
                  onAttachDocument(candidate.id, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    stage: candidate.application?.stage,
                    uploaded_at: new Date().toISOString()
                  })
                })
              }
              input.click()
            }}
            className="btn-secondary text-xs px-3 py-1"
            title="Attach documents"
          >
            <Upload className="w-3 h-3 mr-1" />
            {compact ? '' : 'Attach'}
          </button>
          
          <select
            value={candidate.application?.stage || ''}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={isUpdating}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            onClick={(e) => e.stopPropagation()}
            title="Update candidate status"
          >
            {workflowStages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default Workflow