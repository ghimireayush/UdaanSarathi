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
  Heart,
  List,
  Grid3X3,
  CheckSquare,
  Square
} from 'lucide-react'
import { applicationService, jobService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import performanceService from '../services/performanceService'
import { useAccessibility } from '../hooks/useAccessibility'
import { useI18n } from '../hooks/useI18n'
import { InteractiveFilter, InteractiveButton, InteractiveCard, InteractivePagination, PaginationInfo } from '../components/InteractiveUI'
import { useNotificationContext } from '../contexts/NotificationContext'

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
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Accessibility and i18n hooks
  const { containerRef, setupRightPaneNavigation, announce } = useAccessibility()
  const { t, formatDate, formatNumber } = useI18n()
  const { success, error: notifyError, info } = useNotificationContext()

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
          stage: filters.stage,
          country: filters.country,
          jobId: filters.jobId,
          sortBy: 'applied_at',
          sortOrder: 'desc'
        }

        console.log('Fetching applications with filters:', paginationParams);

        // Use the applicationService directly for better filtering
        const applicationsResult = await applicationService.getApplicationsPaginated(paginationParams)
        console.log('Applications result:', applicationsResult)
        const [jobsData, stagesData] = await Promise.all([
          jobService.getJobs({ status: 'published' }),
          constantsService.getApplicationStages()
        ])

        const applications = applicationsResult.data || applicationsResult
        const total = applicationsResult.total || applications.length

        setApplications(applications)
        setPagination(prevPagination => ({
          ...prevPagination,
          total: total,
          totalPages: Math.ceil(total / prevPagination.limit)
        }))

        console.log('Pagination updated:', { total, totalPages: Math.ceil(total / pagination.limit), limit: pagination.limit })
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
        success('Application Rejected', 'The application has been successfully rejected.')
      } else {
        await applicationService.updateApplicationStage(applicationId, targetStage)
        success('Stage Updated', `Application stage has been updated to ${getStageLabel(targetStage)}.`)
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

    } catch (err) {
      console.error('Failed to update application stage:', err)
      notifyError('Update Failed', 'Failed to update application stage. Please try again.')
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
        success('Bulk Shortlist', `${applicationIds.length} applications have been shortlisted.`)
      } else if (action === 'reject') {
        for (const appId of applicationIds) {
          await applicationService.rejectApplication(appId, 'Bulk rejection')
        }
        success('Bulk Rejection', `${applicationIds.length} applications have been rejected.`)
      }

      // Refresh data
      const updatedApplications = await applicationService.getApplicationsWithDetails(filters)
      setApplications(updatedApplications)
      setSelectedApplications(new Set())
    } catch (err) {
      console.error('Failed to perform bulk action:', err)
      notifyError('Bulk Action Failed', 'Failed to perform bulk action. Please try again.')
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

  // Handle select all applications
  const handleSelectAll = () => {
    if (selectedApplications.size === applications.length) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(new Set(applications.map(application => application.id)))
    }
  }

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {applications.length > 0 ? (
        applications.map(application => (
          <InteractiveCard key={application.id} hoverable clickable className="p-8 border-l-4 border-primary-500">
            <div className="flex items-start justify-between mb-4">
              <span className={`chip ${getStageColor(application.stage)} text-xs`}>
                {getStageLabel(application.stage)}
              </span>
            </div>

            <div className="flex items-start space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-primary-600">
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

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-primary-400" />
                    <span>{application.candidate?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-primary-400" />
                    <span>{application.candidate?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                    <span>{application.job?.country || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs font-medium mb-4 flex items-center">
              <Calendar className="w-3 h-3 mr-1 text-gray-500" />
              <span className="text-gray-600">Applied {application.applied_at ? format(new Date(application.applied_at), 'MMM dd, yyyy') : 'Unknown date'}</span>
            </div>

            {/* Skills */}
            {application.candidate?.skills && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {application.candidate.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                      {skill}
                    </span>
                  ))}
                  {application.candidate.skills.length > 3 && (
                    <span className="text-xs text-primary-500 font-medium">+{application.candidate.skills.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {/* Shortlist Toggle */}
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleShortlist(application)
                  }}
                  variant={application.stage === applicationStages.SHORTLISTED ? 'warning' : 'secondary'}
                  size="sm"
                  disabled={isUpdating}
                  loading={isUpdating}
                  icon={UserCheck}
                >
                  {application.stage === applicationStages.SHORTLISTED ? 'Shortlisted' : 'Shortlist'}
                </InteractiveButton>

                {/* Stage Actions */}
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleOpenStageModal(application, null)
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={isUpdating}
                  icon={ArrowRight}
                >
                  Move Stage
                </InteractiveButton>
              </div>

              <div className="flex space-x-2">
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedCandidate(application.candidate)
                    setSelectedApplication(application)
                    setShowSummary(true)
                  }}
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                >
                  Summary
                </InteractiveButton>

                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleOpenStageModal(application, applicationStages.REJECTED)
                  }}
                  variant="ghost"
                  size="sm"
                  disabled={isUpdating}
                  icon={X}
                  className="text-red-600 hover:text-red-800"
                >
                  Reject
                </InteractiveButton>
              </div>
            </div>
          </InteractiveCard>
        ))
      ) : (
        <div className="col-span-2 text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">
            {Object.values(filters).some(v => v) ? 'No applications match your current filters.' : 'Applications will appear here when candidates apply for jobs.'}
          </p>
        </div>
      )}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Candidate
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stage
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.length > 0 ? (
            applications.map(application => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedApplications.has(application.id)}
                    onChange={() => handleApplicationSelect(application.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary-600">
                          {application.candidate?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {application.candidate?.name || 'Unknown Candidate'}
                      </div>
                      {application.candidate?.skills && (
                        <div className="text-sm text-gray-500">
                          {application.candidate.skills.slice(0, 2).join(', ')}
                          {application.candidate.skills.length > 2 && ` +${application.candidate.skills.length - 2} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <Link to={`/jobs/${application.job?.id}`} className="text-primary-600 hover:text-primary-800">
                      {application.job?.title || 'Unknown Job'}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">
                    {application.job?.company || 'Unknown Company'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{application.candidate?.phone || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{application.candidate?.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {application.applied_at ? format(new Date(application.applied_at), 'MMM dd, yyyy') : 'Unknown date'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`chip ${getStageColor(application.stage)} text-xs`}>
                    {getStageLabel(application.stage)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleToggleShortlist(application)}
                    className={`mr-2 ${application.stage === applicationStages.SHORTLISTED ? 'text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}
                    disabled={isUpdating}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCandidate(application.candidate)
                      setSelectedApplication(application)
                      setShowSummary(true)
                    }}
                    className="text-primary-600 hover:text-primary-900 mr-2"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenStageModal(application, applicationStages.REJECTED)}
                    className="text-red-600 hover:text-red-900"
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {Object.values(filters).some(v => v) ? 'No applications match your current filters.' : 'Applications will appear here when candidates apply for jobs.'}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

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

        <div className="mt-4 sm:mt-0 flex space-x-2">
          <InteractiveButton
            onClick={(e) => {
              e.preventDefault()
              handleSelectAll()
            }}
            variant="secondary"
            size="sm"
            icon={selectedApplications.size === applications.length ? CheckSquare : Square}
          >
            Select All
          </InteractiveButton>
          
          {selectedApplications.size > 0 && (
            <>
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault()
                  handleBulkAction('shortlist')
                }}
                variant="primary"
                size="sm"
                disabled={isUpdating}
                loading={isUpdating}
                icon={UserCheck}
              >
                Shortlist ({selectedApplications.size})
              </InteractiveButton>
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault()
                  handleBulkAction('reject')
                }}
                variant="danger"
                size="sm"
                disabled={isUpdating}
                loading={isUpdating}
                icon={X}
              >
                Reject ({selectedApplications.size})
              </InteractiveButton>
            </>
          )}

          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('grid')
              }}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              icon={Grid3X3}
              className="rounded-r-none border-r-0"
            />
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('list')
              }}
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              icon={List}
              className="rounded-l-none"
            />
          </div>
        </div>
      </div>

      {/* Interactive Filters */}
      <InteractiveFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, phone, email, or skills..."
        filterOptions={{
          search: true,
          stage: {
            type: 'select',
            label: 'Application Stage',
            placeholder: 'All Stages',
            options: [
              { value: 'applied', label: 'Applied' },
              { value: 'shortlisted', label: 'Shortlisted' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'interviewed', label: 'Interviewed' },
              { value: 'selected', label: 'Selected' },
              { value: 'rejected', label: 'Rejected' }
            ]
          },
          country: {
            type: 'select',
            label: 'Country',
            placeholder: 'All Countries',
            options: countries.map(country => ({ value: country, label: country }))
          },
          jobId: {
            type: 'select',
            label: 'Job Position',
            placeholder: 'All Jobs',
            options: jobs.map(job => ({ value: job.id, label: `${job.title} - ${job.company}` }))
          }
        }}
        className="mb-6"
      />

      {/* Performance Indicator */}
      <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
        <span>
          Showing {applications.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </span>
        {loadTime && (
          <span>
            Loaded in {Math.round(loadTime)}ms
            {loadTime > 1500 && (
              <span className="ml-2 text-yellow-600">⚠️ Slow load</span>
            )}
          </span>
        )}
      </div>

      {/* Applications View */}
      <div className="grid grid-cols-1 gap-6" ref={containerRef}>


        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>


      {/* Interactive Pagination */}
      {applications.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white p-4 rounded-lg border border-gray-200">
          <PaginationInfo
            currentPage={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />

          {pagination.totalPages > 1 && (
            <InteractivePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              size="md"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Applications