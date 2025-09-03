import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Calendar,
  Eye,
  UserCheck,
  X,
  ChevronDown,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Star,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowRight,
  Download,
  GraduationCap,
  Briefcase,
  Home,
  Heart
} from 'lucide-react'
import { applicationService, jobService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import performanceService from '../services/performanceService'
import { useAccessibility } from '../hooks/useAccessibility'
import { useI18n } from '../hooks/useI18n'

const Applications = () => {
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    country: '',
    jobId: ''
  })
  const [pagination, setPagination] = useState({ 
    page: 1, 
    limit: 50, // Optimized for 10k+ records
    total: 0,
    totalPages: 0
  })
  const [selectedApplications, setSelectedApplications] = useState(new Set())
  const [showSummary, setShowSummary] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showStageModal, setShowStageModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [newStage, setNewStage] = useState('')
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [applicationStages, setApplicationStages] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [loadTime, setLoadTime] = useState(null)

  // Accessibility and i18n hooks
  const { containerRef, setupRightPaneNavigation, announce } = useAccessibility()
  const { t, formatDate, formatNumber } = useI18n()

  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () => performanceService.debounce((searchTerm) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300),
    []
  )

  // Fetch applications data using service with performance optimization
  useEffect(() => {
    const fetchApplicationsData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const startTime = performance.now()
        
        // Use performance service for paginated data
        const paginationParams = {
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          sortBy: 'applied_at',
          sortOrder: 'desc'
        }

        const [applicationsResult, jobsData, stagesData] = await Promise.all([
          performanceService.getPaginatedData(
            { ...paginationParams, ...filters },
            (params) => applicationService.getApplicationsWithDetails(params)
          ),
          jobService.getJobs({ status: 'published' }),
          constantsService.getApplicationStages()
        ])
        
        setApplications(applicationsResult.data || applicationsResult)
        setPagination(prev => ({
          ...prev,
          total: applicationsResult.total || applicationsResult.length,
          totalPages: Math.ceil((applicationsResult.total || applicationsResult.length) / prev.limit)
        }))
        setJobs(jobsData)
        setApplicationStages(stagesData)

        const endTime = performance.now()
        const loadTime = endTime - startTime
        setLoadTime(loadTime)
        
        // Announce load completion for screen readers
        announce(t('applications.loaded', { 
          count: applicationsResult.data?.length || applicationsResult.length,
          time: Math.round(loadTime)
        }))
        
      } catch (err) {
        console.error('Failed to fetch applications data:', err)
        setError(err)
        announce(t('common.error'), 'assertive')
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplicationsData()
  }, [filters, pagination.page, pagination.limit, announce, t])

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'search') {
      debouncedSearch(value)
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    }
  }, [debouncedSearch])

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleApplicationSelect = (applicationId) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId)
    } else {
      newSelected.add(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  const handleUpdateStage = async (applicationId, targetStage, reason = null) => {
    try {
      setIsUpdating(true)
      
      if (targetStage === applicationStages.REJECTED && reason) {
        await applicationService.rejectApplication(applicationId, reason)
      } else {
        await applicationService.updateApplicationStage(applicationId, targetStage)
      }
      
      // Refresh data to reflect changes immediately
      const updatedApplications = await applicationService.getApplicationsWithDetails(filters)
      setApplications(updatedApplications)
      
      // Close modals
      setShowStageModal(false)
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectionReason('')
      setNewStage('')
      
    } catch (error) {
      console.error('Failed to update application stage:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOpenStageModal = (application, stage) => {
    setSelectedApplication(application)
    setNewStage(stage)
    if (stage === applicationStages.REJECTED) {
      setShowRejectModal(true)
    } else {
      setShowStageModal(true)
    }
  }

  const handleToggleShortlist = async (application) => {
    const isCurrentlyShortlisted = application.stage === applicationStages.SHORTLISTED
    const targetStage = isCurrentlyShortlisted ? applicationStages.APPLIED : applicationStages.SHORTLISTED
    await handleUpdateStage(application.id, targetStage)
  }

  const handleBulkAction = async (action) => {
    if (selectedApplications.size === 0) return
    
    try {
      setIsUpdating(true)
      const applicationIds = Array.from(selectedApplications)
      
      if (action === 'shortlist') {
        await applicationService.bulkUpdateStage(applicationIds, applicationStages.SHORTLISTED)
      } else if (action === 'reject') {
        for (const appId of applicationIds) {
          await applicationService.rejectApplication(appId, 'Bulk rejection')
        }
      }
      
      // Refresh data
      const updatedApplications = await applicationService.getApplicationsWithDetails(filters)
      setApplications(updatedApplications)
      setSelectedApplications(new Set())
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStageColor = (stage) => {
    const stageColors = {
      [applicationStages.APPLIED]: 'chip-blue',
      [applicationStages.SHORTLISTED]: 'chip-yellow',
      [applicationStages.SCHEDULED]: 'chip-purple',
      [applicationStages.INTERVIEWED]: 'chip-green',
      [applicationStages.SELECTED]: 'chip-green',
      [applicationStages.REJECTED]: 'chip-red'
    }
    return stageColors[stage] || 'chip-blue'
  }

  const getStageLabel = (stage) => {
    return constantsService.getApplicationStageLabel(stage)
  }

  const countries = [...new Set(jobs.map(job => job.country))]

  // Loading state
  if (isLoading && applications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load applications</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Centralized view of all candidate applications across jobs
          </p>
        </div>
        
        {selectedApplications.size > 0 && (
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => handleBulkAction('shortlist')}
              className="btn-primary text-sm"
              disabled={isUpdating}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Shortlist ({selectedApplications.size})
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
              disabled={isUpdating}
            >
              <X className="w-4 h-4 mr-2" />
              Reject ({selectedApplications.size})
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, phone, or skills..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Stage Filter */}
          <div>
            <select 
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Stages</option>
              <option value={applicationStages.APPLIED}>Applied</option>
              <option value={applicationStages.SHORTLISTED}>Shortlisted</option>
              <option value={applicationStages.SCHEDULED}>Scheduled</option>
              <option value={applicationStages.INTERVIEWED}>Interviewed</option>
              <option value={applicationStages.SELECTED}>Selected</option>
              <option value={applicationStages.REJECTED}>Rejected</option>
            </select>
          </div>
          
          {/* Country Filter */}
          <div>
            <select 
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          {/* Job Filter */}
          <div>
            <select 
              value={filters.jobId}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title} - {job.company}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Indicator */}
      {loadTime && (
        <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
          <span>
            {t('applications.showing', { 
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: formatNumber(pagination.total)
            })}
          </span>
          <span>
            {t('applications.loadTime', { time: Math.round(loadTime) })} 
            {loadTime > 1500 && (
              <span className="ml-2 text-yellow-600">⚠️ {t('applications.slowLoad')}</span>
            )}
          </span>
        </div>
      )}

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={containerRef}>
        {applications.length > 0 ? (
          applications.map(application => (
            <div key={application.id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <input
                  type="checkbox"
                  checked={selectedApplications.has(application.id)}
                  onChange={() => handleApplicationSelect(application.id)}
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className={`chip ${getStageColor(application.stage)} text-xs`}>
                  {getStageLabel(application.stage)}
                </span>
              </div>
              
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {application.candidate?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {application.candidate?.name || 'Unknown Candidate'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Applied for <Link to={`/jobs/${application.job?.id}`} className="text-primary-600 hover:text-primary-800">
                      {application.job?.title || 'Unknown Job'}
                    </Link>
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{application.candidate?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{application.candidate?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{application.job?.country || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                Applied {application.applied_at ? format(new Date(application.applied_at), 'MMM dd, yyyy') : 'Unknown date'}
              </div>
              
              {/* Skills */}
              {application.candidate?.skills && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {application.candidate.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                    {application.candidate.skills.length > 3 && (
                      <span className="text-xs text-gray-500">+{application.candidate.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {/* Shortlist Toggle */}
                  <button
                    onClick={() => handleToggleShortlist(application)}
                    className={`text-sm px-3 py-1 rounded transition-colors ${
                      application.stage === applicationStages.SHORTLISTED
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={isUpdating}
                  >
                    <UserCheck className="w-3 h-3 mr-1 inline" />
                    {application.stage === applicationStages.SHORTLISTED ? 'Shortlisted' : 'Shortlist'}
                  </button>
                  
                  {/* Stage Actions Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => handleOpenStageModal(application, null)}
                      className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors flex items-center"
                      disabled={isUpdating}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Move Stage
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCandidate(application.candidate)
                      setSelectedApplication(application)
                      setShowSummary(true)
                    }}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    <Eye className="w-4 h-4 mr-1 inline" />
                    Summary
                  </button>
                  
                  <button
                    onClick={() => handleOpenStageModal(application, applicationStages.REJECTED)}
                    className="text-sm text-red-600 hover:text-red-800"
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4 mr-1 inline" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(v => v) ? 'No applications match your current filters.' : 'Applications will appear here when candidates apply for jobs.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t('applications.pagination.info', {
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: formatNumber(pagination.total)
            })}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('common.previous')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pagination.page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-label={t('applications.pagination.page', { page: pageNum })}
                  aria-current={pagination.page === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('common.next')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Candidate Summary Modal with Accessibility */}
      {showSummary && selectedCandidate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
        >
          <div 
            className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto"
            ref={(el) => {
              if (el && showSummary) {
                setupRightPaneNavigation({
                  onEscape: () => {
                    setShowSummary(false)
                    setSelectedCandidate(null)
                    setSelectedApplication(null)
                  },
                  onEnter: (target) => {
                    if (target.tagName === 'BUTTON') {
                      target.click()
                    }
                  }
                })
              }
            }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="summary-title" className="text-xl font-semibold text-gray-900">
                {t('applications.summary')}
              </h2>
              <button
                onClick={() => {
                  setShowSummary(false)
                  setSelectedCandidate(null)
                  setSelectedApplication(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Section */}
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">
                    {selectedCandidate.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedCandidate.name}</h3>
                  {selectedCandidate.priority_score && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-lg font-medium text-gray-700">Priority Score: {selectedCandidate.priority_score}%</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    Applied {selectedApplication?.applied_at ? format(new Date(selectedApplication.applied_at), 'MMM dd, yyyy') : 'Unknown date'}
                  </div>
                </div>
                <div className="text-right">
                  {selectedApplication && (
                    <span className={`chip ${getStageColor(selectedApplication.stage)}`}>
                      {getStageLabel(selectedApplication.stage)}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Phone</div>
                    <div className="text-sm text-gray-600">{selectedCandidate.phone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">{selectedCandidate.email}</div>
                  </div>
                </div>
              </div>

              {/* Job Application Details */}
              {selectedApplication && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Application Details
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Job Title</div>
                        <div className="text-sm text-gray-600">{selectedApplication.job?.title}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Company</div>
                        <div className="text-sm text-gray-600">{selectedApplication.job?.company}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Location</div>
                        <div className="text-sm text-gray-600">{selectedApplication.job?.country}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Application Status</div>
                        <div className="text-sm text-gray-600">{getStageLabel(selectedApplication.stage)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Address
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedCandidate.address}</p>
                </div>
              </div>

              {/* Skills */}
              {selectedCandidate.skills && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="chip chip-blue">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Education
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedCandidate.education || 'Not specified'}</p>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Experience
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{selectedCandidate.experience}</p>
                </div>
              </div>

              {/* CV Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">CV</h4>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedCandidate.name}_CV.pdf
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
            
            {/* Actions Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-between">
                <div className="flex space-x-3">
                  {selectedApplication && (
                    <>
                      <button
                        onClick={() => handleToggleShortlist(selectedApplication)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                          selectedApplication.stage === applicationStages.SHORTLISTED
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <UserCheck className="w-4 h-4 mr-2 inline" />
                        {selectedApplication.stage === applicationStages.SHORTLISTED ? 'Remove from Shortlist' : 'Add to Shortlist'}
                      </button>
                      
                      <button
                        onClick={() => handleOpenStageModal(selectedApplication, null)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 mr-2 inline" />
                        Move to Stage
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setShowSummary(false)
                    setSelectedCandidate(null)
                    setSelectedApplication(null)
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Change Modal */}
      {showStageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Move to Stage</h3>
              <button
                onClick={() => {
                  setShowStageModal(false)
                  setSelectedApplication(null)
                  setNewStage('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Stage
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a stage...</option>
                  <option value={applicationStages.APPLIED}>Applied</option>
                  <option value={applicationStages.SHORTLISTED}>Shortlisted</option>
                  <option value={applicationStages.SCHEDULED}>Scheduled</option>
                  <option value={applicationStages.INTERVIEWED}>Interviewed</option>
                  <option value={applicationStages.SELECTED}>Selected</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStageModal(false)
                    setSelectedApplication(null)
                    setNewStage('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStage(selectedApplication.id, newStage)}
                  disabled={!newStage || isUpdating}
                  className="btn-primary disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Move to Stage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reject Application</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedApplication(null)
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This action cannot be undone. The candidate will be notified of the rejection.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedApplication(null)
                    setRejectionReason('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStage(selectedApplication.id, applicationStages.REJECTED, rejectionReason)}
                  disabled={!rejectionReason.trim() || isUpdating}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Applications