import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  MapPin, 
  Users, 
  Calendar,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { jobService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import DateDisplay, { CompactDateDisplay } from '../components/DateDisplay.jsx'

const Jobs = () => {
  const [filters, setFilters] = useState({
    search: '',
    country: 'All Countries',
    status: 'published',
    sortBy: 'newest'
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [jobs, setJobs] = useState([])
  const [countries, setCountries] = useState([])
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
        
        const [jobsData, countriesData, statusesData, statsData] = await Promise.all([
          jobService.getJobs(filters),
          constantsService.getCountries(),
          constantsService.getJobStatuses(),
          jobService.getJobStatistics()
        ])
        
        setJobs(jobsData)
        setCountries(countriesData)
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      [jobStatuses.PUBLISHED]: { class: 'chip-green', label: 'Published' },
      [jobStatuses.DRAFT]: { class: 'chip-yellow', label: 'Draft' },
      [jobStatuses.CLOSED]: { class: 'chip-red', label: 'Closed' },
      [jobStatuses.PAUSED]: { class: 'chip-blue', label: 'Paused' }
    }
    const config = statusConfig[status] || { class: 'chip-gray', label: status }
    return (
      <span className={`chip ${config.class}`}>
        {config.label}
      </span>
    )
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
          <button className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </button>
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="applications">Most Applications</option>
                  <option value="closing">Closing Soon</option>
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
                      Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <Link 
                            to={`/jobs/${job.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                          >
                            {job.title}
                          </Link>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{job.country}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900">{job.applications_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <CompactDateDisplay date={job.created_at} />
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          to={`/jobs/${job.id}`}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1 inline" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Jobs by Country</h3>
            <div className="space-y-3">
              {Object.entries(countryDistribution).map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{country}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Jobs