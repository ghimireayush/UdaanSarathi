import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Calendar,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'
import { jobService, constantsService, PERMISSIONS } from '../services/index.js'
import { format, formatDistanceToNow } from 'date-fns'
import PermissionGuard, { PermissionButton, usePermissions } from '../components/PermissionGuard.jsx'


const Jobs = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    search: '',
    country: 'All Countries',
    status: 'published',
    sortBy: 'published_date'
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [jobs, setJobs] = useState([])

  const [jobStatuses, setJobStatuses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countryDistribution, setCountryDistribution] = useState({})

  // Fetch jobs data using service
  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [jobsData, statusesData, statsData] = await Promise.all([
          jobService.getJobs(filters),
          constantsService.getJobStatuses(),
          jobService.getJobStatistics()
        ])
        
        setJobs(jobsData)
        setJobStatuses(statusesData)
        setCountryDistribution(statsData.byCountry || {})
      } catch (err) {
        console.error('Failed to fetch jobs data:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobsData()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }



  // Loading state
  if (isLoading && jobs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between py-4 border-b">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load jobs</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage job postings, applications, and candidate pipeline
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <PermissionGuard permission={PERMISSIONS.CREATE_JOB}>
            <button 
              onClick={() => navigate('/drafts')}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Filters and Search */}
          <div className="card p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by reference ID, title, company..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={jobStatuses.PUBLISHED}>Published</option>
                  <option value={jobStatuses.DRAFT}>Draft</option>
                  <option value={jobStatuses.CLOSED}>Closed</option>
                  <option value={jobStatuses.PAUSED}>Paused</option>
                </select>
                
                <select 
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option>All Countries</option>
                  {Object.keys(countryDistribution).map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                
                <select 
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="published_date">Published Date</option>
                  <option value="applications">Candidate Count</option>
                  <option value="shortlisted">Shortlist Count</option>
                  <option value="interviews">Today's Interviews</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Job Listings</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      JOB DETAILS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      APPLICATION STATUS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      POSTED
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map(job => {
                    const publishedDate = job.published_at || job.created_at
                    const relativeDate = formatDistanceToNow(new Date(publishedDate), { addSuffix: true })
                    const absoluteDate = format(new Date(publishedDate), 'MMM d, yyyy HH:mm')
                    
                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500 font-mono">Ref: {job.id}</div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{job.country}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center text-gray-900 mb-1">
                              <Users className="w-4 h-4 mr-1" />
                              <span className="font-medium">Applicants ({job.applications_count || 0})</span>
                            </div>
                            <div className="flex items-center text-gray-600 mb-1">
                              <UserCheck className="w-4 h-4 mr-1" />
                              <span>Shortlisted: {job.shortlisted_count || 0}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Interviews: {job.interviews_today || 0} of {job.total_interviews || 0} today</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div title={absoluteDate}>
                            <div className="font-medium">{relativeDate.replace(' ago', 'd ago').replace('about ', '')}</div>
                            <div className="text-xs text-gray-400">{format(new Date(publishedDate), 'MMM d, yyyy')}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col space-y-1">
                            <PermissionGuard permission={PERMISSIONS.VIEW_JOBS}>
                              <Link 
                                to={`/jobs/${job.id}`}
                                className="text-primary-600 hover:text-primary-800 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                              <Link 
                                to={`/jobs/${job.id}/shortlist`}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                View Shortlist
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                              <Link 
                                to={`/jobs/${job.id}?tab=applied`}
                                className="text-gray-600 hover:text-gray-800 flex items-center"
                              >
                                <Users className="w-4 h-4 mr-1" />
                                Manage Candidates
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
                              <Link 
                                to={`/jobs/${job.id}?tab=shortlisted`}
                                className="text-gray-600 hover:text-gray-800 flex items-center"
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                Schedule
                              </Link>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {jobs.length > 0 && Math.ceil(jobs.length / pagination.limit) > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, jobs.length)} of {jobs.length} jobs
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= Math.ceil(jobs.length / pagination.limit)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Country Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Open job distribution by country</h3>
            <div className="space-y-3">
              {Object.entries(countryDistribution)
                .filter(([country, count]) => count > 0)
                .map(([country, count]) => (
                  <button 
                    key={country} 
                    className="flex justify-between items-center w-full text-left hover:bg-gray-50 p-2 rounded"
                    onClick={() => handleFilterChange('country', country)}
                  >
                    <span className="text-sm text-gray-600">{country}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Jobs