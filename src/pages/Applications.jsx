import React, { useState, useEffect } from 'react'
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
  ChevronRight
} from 'lucide-react'
import { applicationService, jobService, constantsService } from '../services/index.js'
import { format } from 'date-fns'

const Applications = () => {
  const [filters, setFilters] = useState({
    search: '',
    stage: '',
    country: '',
    jobId: ''
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 12 })
  const [selectedApplications, setSelectedApplications] = useState(new Set())
  const [showSummary, setShowSummary] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [applicationStages, setApplicationStages] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch applications data using service
  useEffect(() => {
    const fetchApplicationsData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [applicationsData, jobsData, stagesData] = await Promise.all([
          applicationService.getApplicationsWithDetails(filters),
          jobService.getJobs({ status: 'published' }),
          constantsService.getApplicationStages()
        ])
        
        setApplications(applicationsData)
        setJobs(jobsData)
        setApplicationStages(stagesData)
      } catch (err) {
        console.error('Failed to fetch applications data:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplicationsData()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleApplicationSelect = (applicationId) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId)
    } else {
      newSelected.add(applicationId)
    }
    setSelectedApplications(newSelected)
  }

  const handleUpdateStage = async (applicationId, newStage) => {
    try {
      setIsUpdating(true)
      await applicationService.updateApplicationStage(applicationId, newStage)
      
      // Refresh data
      const updatedApplications = await applicationService.getApplicationsWithDetails(filters)
      setApplications(updatedApplications)
    } catch (error) {
      console.error('Failed to update application stage:', error)
    } finally {
      setIsUpdating(false)
    }
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

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  {application.stage === applicationStages.APPLIED && (
                    <button
                      onClick={() => handleUpdateStage(application.id, applicationStages.SHORTLISTED)}
                      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                      disabled={isUpdating}
                    >
                      Shortlist
                    </button>
                  )}
                  
                  {(application.stage === applicationStages.SHORTLISTED || application.stage === applicationStages.APPLIED) && (
                    <button
                      onClick={() => handleUpdateStage(application.id, applicationStages.SCHEDULED)}
                      className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                      disabled={isUpdating}
                    >
                      Schedule
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedCandidate(application.candidate)
                    setShowSummary(true)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  <Eye className="w-4 h-4 mr-1 inline" />
                  View
                </button>
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

      {/* Candidate Summary Modal */}
      {showSummary && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Candidate Summary</h2>
              <button
                onClick={() => {
                  setShowSummary(false)
                  setSelectedCandidate(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-600">
                    {selectedCandidate.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.age} years, {selectedCandidate.gender}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Skills */}
              {selectedCandidate.skills && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Experience */}
              {selectedCandidate.experience && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                  <p className="text-gray-600">{selectedCandidate.experience}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSummary(false)
                  setSelectedCandidate(null)
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Applications