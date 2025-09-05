import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { InteractiveButton, InteractiveCard, InteractivePagination, PaginationInfo } from '../components/InteractiveUI'
import { useNotificationContext } from '../contexts/NotificationContext'
import CandidateSummaryS2 from '../components/CandidateSummaryS2.jsx'

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
  const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'
  const headerCheckboxRef = useRef(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      const selectable = applications.filter(app => app.stage !== applicationStages.REJECTED)
      headerCheckboxRef.current.indeterminate = selectedApplications.size > 0 && selectedApplications.size < selectable.length
    }
  }, [selectedApplications, applications, applicationStages])

  // Toast notification states
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success') // 'success', 'error', 'info'

  // Additional state for bulk rejection modal
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false)
  const [bulkRejectionReason, setBulkRejectionReason] = useState('')

  // Individual action loading states
  const [shortlistingApps, setShortlistingApps] = useState(new Set())
  const [rejectingApps, setRejectingApps] = useState(new Set())
  const [movingStageApps, setMovingStageApps] = useState(new Set())

  // Accessibility and i18n hooks
  const { containerRef, setupRightPaneNavigation, announce } = useAccessibility()
  const { t, formatDate, formatNumber } = useI18n()
  const { success, error: notifyError, info } = useNotificationContext()

  // Toast notification function
  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)

    // Auto-hide after 4 seconds for success, 5 seconds for error
    const delay = type === 'error' ? 5000 : 4000
    setTimeout(() => {
      setShowToast(false)
    }, delay)
  }

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
    // Find the application to check if it's rejected
    const application = applications.find(app => app.id === applicationId)
    if (application && application.stage === applicationStages.REJECTED) {
      // Don't allow selection of rejected applications
      return
    }

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
      // Set the appropriate loading state
      if (targetStage === applicationStages.REJECTED) {
        setRejectingApps(prev => new Set([...prev, applicationId]))
      } else {
        setMovingStageApps(prev => new Set([...prev, applicationId]))
      }

      // Perform the actual API call first
      if (targetStage === applicationStages.REJECTED && reason) {
        await applicationService.rejectApplication(applicationId, reason)
        showToastNotification('❌ Application rejected successfully!', 'success')
      } else {
        await applicationService.updateApplicationStage(applicationId, targetStage)
        const stageLabel = getStageLabel(targetStage)
        showToastNotification(`✅ Application moved to ${stageLabel} successfully!`, 'success')
      }

      // Only update UI after successful API call
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId
            ? { ...app, stage: targetStage, updated_at: new Date().toISOString() }
            : app
        )
      )

      // Close modals
      setShowStageModal(false)
      setShowRejectModal(false)
      setSelectedApplication(null)
      setRejectionReason('')
      setNewStage('')

    } catch (err) {
      console.error('Failed to update application stage:', err)
      showToastNotification('❌ Failed to update application stage. Please try again.', 'error')
    } finally {
      // Clear the appropriate loading state
      if (targetStage === applicationStages.REJECTED) {
        setRejectingApps(prev => {
          const newSet = new Set(prev)
          newSet.delete(applicationId)
          return newSet
        })
      } else {
        setMovingStageApps(prev => {
          const newSet = new Set(prev)
          newSet.delete(applicationId)
          return newSet
        })
      }
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
    try {
      setShortlistingApps(prev => new Set([...prev, application.id]))

      const isCurrentlyShortlisted = application.stage === applicationStages.SHORTLISTED
      const targetStage = isCurrentlyShortlisted ? applicationStages.APPLIED : applicationStages.SHORTLISTED

      // Perform the actual API call first
      await applicationService.updateApplicationStage(application.id, targetStage)

      // Update UI after successful API call
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === application.id
            ? { ...app, stage: targetStage, updated_at: new Date().toISOString() }
            : app
        )
      )

      // Show success notification
      if (isCurrentlyShortlisted) {
        showToastNotification('✅ Candidate removed from shortlist!', 'success')
      } else {
        showToastNotification('✅ Candidate shortlisted successfully!', 'success')
      }

    } catch (err) {
      console.error('Failed to toggle shortlist:', err)
      showToastNotification('❌ Failed to update shortlist status. Please try again.', 'error')
    } finally {
      setShortlistingApps(prev => {
        const newSet = new Set(prev)
        newSet.delete(application.id)
        return newSet
      })
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedApplications.size === 0) return

    // For bulk rejection, show modal to get reason
    if (action === 'reject') {
      setShowBulkRejectModal(true)
      return
    }

    try {
      setIsUpdating(true)
      const applicationIds = Array.from(selectedApplications)

      if (action === 'shortlist') {
        // Process each application individually for better tracking
        for (const appId of applicationIds) {
          await applicationService.updateApplicationStage(appId, applicationStages.SHORTLISTED)
        }

        // Update UI after successful API calls
        setApplications(prevApplications =>
          prevApplications.map(app =>
            applicationIds.includes(app.id)
              ? { ...app, stage: applicationStages.SHORTLISTED, updated_at: new Date().toISOString() }
              : app
          )
        )

        showToastNotification(`✅ ${applicationIds.length} applications shortlisted successfully!`, 'success')
      }

      setSelectedApplications(new Set())
    } catch (err) {
      console.error('Failed to perform bulk action:', err)
      showToastNotification('❌ Failed to perform bulk action. Please try again.', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedApplications.size === 0 || !bulkRejectionReason.trim()) return

    try {
      setIsUpdating(true)
      const applicationIds = Array.from(selectedApplications)

      // Process each rejection individually with the reason
      for (const appId of applicationIds) {
        await applicationService.rejectApplication(appId, bulkRejectionReason)
      }

      // Update UI after successful API calls
      setApplications(prevApplications =>
        prevApplications.map(app =>
          applicationIds.includes(app.id)
            ? { ...app, stage: applicationStages.REJECTED, updated_at: new Date().toISOString() }
            : app
        )
      )

      showToastNotification(`❌ ${applicationIds.length} applications rejected successfully!`, 'success')
      setSelectedApplications(new Set())

      // Close modal and reset
      setShowBulkRejectModal(false)
      setBulkRejectionReason('')
    } catch (err) {
      console.error('Failed to perform bulk rejection:', err)
      showToastNotification('❌ Failed to perform bulk rejection. Please try again.', 'error')
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

  // Handle select all applications (excluding rejected ones)
  const handleSelectAll = () => {
    const selectableApplications = applications.filter(app => app.stage !== applicationStages.REJECTED)

    if (selectedApplications.size === selectableApplications.length) {
      setSelectedApplications(new Set())
    } else {
      setSelectedApplications(new Set(selectableApplications.map(application => application.id)))
    }
  }

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.length > 0 ? (
        applications.map(application => (
          <InteractiveCard key={application.id} hoverable clickable className="p-6 border-l-4 border-primary-500">
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
            <div className="pt-4">
              {application.stage === applicationStages.REJECTED ? (
                // Show disabled state for rejected applications
                <div className="flex flex-col space-y-2">
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg border border-gray-200 text-center font-medium">
                    Application Rejected
                  </div>
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
                    className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200"
                  >
                    View Summary
                  </InteractiveButton>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {/* Left column */}
                  <div className="flex flex-col space-y-2">
                    {/* Shortlist Toggle */}
                    <InteractiveButton
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleShortlist(application)
                      }}
                      variant={application.stage === applicationStages.SHORTLISTED ? 'warning' : 'secondary'}
                      size="sm"
                      disabled={shortlistingApps.has(application.id)}
                      loading={shortlistingApps.has(application.id)}
                      icon={UserCheck}
                      className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
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
                      disabled={movingStageApps.has(application.id)}
                      loading={movingStageApps.has(application.id)}
                      icon={ArrowRight}
                      className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      Move Stage
                    </InteractiveButton>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col space-y-2">
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
                      className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200"
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
                      disabled={rejectingApps.has(application.id)}
                      loading={rejectingApps.has(application.id)}
                      icon={X}
                      className="w-full text-red-600 hover:text-red-800 shadow-sm hover:shadow-md transition-shadow duration-200 border border-red-200 hover:border-red-300"
                    >
                      Reject
                    </InteractiveButton>
                  </div>
                </div>
              )}
            </div>
          </InteractiveCard>
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
  )

  // Render list view
  const renderListView = () => (
    <div className="card overflow-visible">
      <div className="overflow-visible">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={applications.filter(app => app.stage !== applicationStages.REJECTED).length > 0 && selectedApplications.size === applications.filter(app => app.stage !== applicationStages.REJECTED).length}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th scope="col" className="w-[24%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidate
              </th>
              <th scope="col" className="w-[16%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job
              </th>
              <th scope="col" className="w-[16%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th scope="col" className="w-[28%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.length > 0 ? (
              applications.map(application => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedApplications.has(application.id)}
                      onChange={() => handleApplicationSelect(application.id)}
                      disabled={application.stage === applicationStages.REJECTED}
                      className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${application.stage === applicationStages.REJECTED
                        ? 'opacity-30 cursor-not-allowed'
                        : ''
                        }`}
                      title={application.stage === applicationStages.REJECTED ? 'Rejected applications cannot be selected' : ''}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {application.candidate?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {application.candidate?.name || 'Unknown'}
                        </div>
                        {application.candidate?.skills && (
                          <div className="text-xs text-gray-500 truncate">
                            {application.candidate.skills.slice(0, 1).join(', ')}
                            {application.candidate.skills.length > 1 && ` +${application.candidate.skills.length - 1}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-sm text-gray-900 truncate">
                      <Link to={`/jobs/${application.job?.id}`} className="text-primary-600 hover:text-primary-800">
                        {application.job?.title || 'Unknown Job'}
                      </Link>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {application.job?.company || 'Unknown Company'}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-xs text-gray-900 truncate">{application.candidate?.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500 truncate">{application.candidate?.email || 'N/A'}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-500">
                    {application.applied_at ? format(new Date(application.applied_at), 'MMM dd') : 'N/A'}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`chip ${getStageColor(application.stage)} text-xs px-2 py-1`}>
                      {getStageLabel(application.stage)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-sm font-medium">
                    {application.stage === applicationStages.REJECTED ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border">Rejected</span>
                        <button
                          onClick={() => {
                            setSelectedCandidate(application.candidate)
                            setSelectedApplication(application)
                            setShowSummary(true)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-700 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200"
                          title="View Summary"
                        >
                          <Eye className="w-3 h-3" /> Summary
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleShortlist(application)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${application.stage === applicationStages.SHORTLISTED
                              ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                              : 'text-gray-700 bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          disabled={shortlistingApps.has(application.id)}
                          title={shortlistingApps.has(application.id) ? 'Updating...' : 'Toggle Shortlist'}
                        >
                          {shortlistingApps.has(application.id) ? (
                            <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          {application.stage === applicationStages.SHORTLISTED ? 'Shortlisted' : 'Shortlist'}
                        </button>

                        <button
                          onClick={() => handleOpenStageModal(application, null)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                          disabled={movingStageApps.has(application.id)}
                          title={movingStageApps.has(application.id) ? 'Moving...' : 'Move Stage'}
                        >
                          {movingStageApps.has(application.id) ? (
                            <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                          Move
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCandidate(application.candidate)
                            setSelectedApplication(application)
                            setShowSummary(true)
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-white hover:bg-gray-50 rounded border border-gray-200"
                          title="View Summary"
                        >
                          <Eye className="w-3 h-3" /> Summary
                        </button>

                        <button
                          onClick={() => handleOpenStageModal(application, applicationStages.REJECTED)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200"
                          disabled={rejectingApps.has(application.id)}
                          title={rejectingApps.has(application.id) ? 'Rejecting...' : 'Reject'}
                        >
                          {rejectingApps.has(application.id) ? (
                            <div className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    )}
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
    </div>
  )

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-1 text-sm text-gray-600">
            Centralized view of all candidate applications across jobs
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-2">
          {/* Select All button removed */}

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

      {/* Minimal Filters (like Jobs/Drafts) */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or skills..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Stages</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="scheduled">Scheduled</option>
              <option value="interviewed">Interviewed</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={filters.jobId}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`
            ${toastType === 'success' ? 'bg-green-500' : toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'} 
            text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 min-w-[300px]
            animate-fade-in
          `}>
            <span className="flex-1">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Candidate Summary Modal */}
      {showSummary && selectedCandidate && (
        <CandidateSummaryS2
          candidate={selectedCandidate}
          application={selectedApplication}
          isOpen={showSummary}
          onClose={() => {
            setShowSummary(false)
            setSelectedCandidate(null)
            setSelectedApplication(null)
          }}
          onUpdateStatus={async (candidateId, newStage) => {
            try {
              if (selectedApplication) {
                await handleUpdateStage(selectedApplication.id, newStage)
                // Close modal after successful update
                setShowSummary(false)
                setSelectedCandidate(null)
                setSelectedApplication(null)
              }
            } catch (error) {
              console.error('Failed to update status from summary:', error)
            }
          }}
          onAttachDocument={(candidateId, document) => {
            // Handle document attachment if needed
            console.log('Document attached:', document)
          }}
          workflowStages={[
            { id: applicationStages.APPLIED, label: 'Applied' },
            { id: applicationStages.SHORTLISTED, label: 'Shortlisted' },
            { id: applicationStages.SCHEDULED, label: 'Scheduled' },
            { id: applicationStages.INTERVIEWED, label: 'Interviewed' },
            { id: applicationStages.SELECTED, label: 'Selected' },
            { id: applicationStages.REJECTED, label: 'Rejected' }
          ]}
        />
      )}

      {/* Stage Selection Modal */}
      {showStageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Application Stage</h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Choose a stage...</option>
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newStage && selectedApplication) {
                      handleUpdateStage(selectedApplication.id, newStage)
                    }
                  }}
                  disabled={!newStage || movingStageApps.has(selectedApplication.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {movingStageApps.has(selectedApplication.id) ? 'Updating...' : 'Update Stage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedApplication(null)
                    setRejectionReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedApplication) {
                      handleUpdateStage(selectedApplication.id, applicationStages.REJECTED, rejectionReason)
                    }
                  }}
                  disabled={rejectingApps.has(selectedApplication.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectingApps.has(selectedApplication.id) ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Reject {selectedApplications.size} Applications
              </h3>
              <button
                onClick={() => {
                  setShowBulkRejectModal(false)
                  setBulkRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Required)
                </label>
                <textarea
                  value={bulkRejectionReason}
                  onChange={(e) => setBulkRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for rejecting these applications..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This action will reject {selectedApplications.size} selected applications. This cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkRejectModal(false)
                    setBulkRejectionReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={!bulkRejectionReason.trim() || isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Rejecting...' : `Reject ${selectedApplications.size} Applications`}
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