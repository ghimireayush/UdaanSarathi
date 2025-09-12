import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Users, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { metricsService } from '../services/index.js'
import { formatNepaliTime, getNepaliDateInfo } from '../utils/nepaliDate.js'

const MetricsExample = () => {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nepaliDateInfo, setNepaliDateInfo] = useState(null)

  // Sample data for demonstration
  const sampleJobs = [
    { id: 1, title: 'Cook', status: 'published', country: 'UAE', created_at: '2025-01-15T10:00:00Z' },
    { id: 2, title: 'Driver', status: 'published', country: 'Qatar', created_at: '2025-01-10T14:30:00Z' },
    { id: 3, title: 'Cleaner', status: 'draft', country: 'Saudi Arabia', created_at: '2025-01-08T09:15:00Z' }
  ]

  const sampleInterviews = [
    { 
      id: 1, 
      candidate_id: 1, 
      job_id: 1, 
      status: 'scheduled', 
      scheduled_at: '2025-01-16T11:00:00Z',
      outcome: null
    },
    { 
      id: 2, 
      candidate_id: 2, 
      job_id: 2, 
      status: 'completed', 
      scheduled_at: '2025-01-14T15:00:00Z',
      completed_at: '2025-01-15T15:30:00Z',
      outcome: 'passed'
    }
  ]

  const sampleApplications = [
    { id: 1, candidate_id: 1, job_id: 1, stage: 'shortlisted', status: 'active', applied_at: '2025-01-12T08:00:00Z' },
    { id: 2, candidate_id: 2, job_id: 2, stage: 'interview-passed', status: 'active', applied_at: '2025-01-10T12:00:00Z' },
    { id: 3, candidate_id: 3, job_id: 1, stage: 'applied', status: 'active', applied_at: '2025-01-15T16:00:00Z' },
    { id: 4, candidate_id: 4, job_id: 3, stage: 'rejected', status: 'inactive', applied_at: '2025-01-08T10:00:00Z' }
  ]

  const sampleCandidates = [
    { 
      id: 1, 
      name: 'Ram Bahadur', 
      stage: 'shortlisted', 
      age: 28, 
      gender: 'Male', 
      education: 'SLC Passed',
      nationality: 'Nepali',
      priority_score: 85,
      applied_at: '2025-01-12T08:00:00Z'
    },
    { 
      id: 2, 
      name: 'Sita Kumari', 
      stage: 'interview-passed', 
      age: 25, 
      gender: 'Female', 
      education: '+2 Passed',
      nationality: 'Nepali',
      priority_score: 92,
      applied_at: '2025-01-10T12:00:00Z'
    },
    { 
      id: 3, 
      name: 'Arjun Singh', 
      stage: 'applied', 
      age: 32, 
      gender: 'Male', 
      education: 'Bachelor Degree',
      nationality: 'Nepali',
      priority_score: 78,
      applied_at: '2025-01-15T16:00:00Z'
    }
  ]

  useEffect(() => {
    loadMetrics()
    loadNepaliDateInfo()
  }, [])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const metricsData = await metricsService.getDashboardMetrics({
        jobs: sampleJobs,
        interviews: sampleInterviews,
        applications: sampleApplications,
        candidates: sampleCandidates
      })
      
      setMetrics(metricsData)
    } catch (err) {
      console.error('Failed to load metrics:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNepaliDateInfo = () => {
    const dateInfo = getNepaliDateInfo()
    setNepaliDateInfo(dateInfo)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Failed to load metrics</span>
          </div>
          <button
            onClick={loadMetrics}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const { summary, jobs, interviews, applications, candidates } = metrics

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Metrics Service Demo
        </h1>
        <p className="text-gray-600">
          Demonstrating Nepal timezone-aware metrics with proper date handling
        </p>
      </div>

      {/* Nepal Time Info */}
      {nepaliDateInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Current Nepal Time
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">English Calendar</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p><span className="font-medium">Date:</span> {nepaliDateInfo.english.display}</p>
                <p><span className="font-medium">Time:</span> {nepaliDateInfo.english.time}</p>
                <p><span className="font-medium">Day:</span> {nepaliDateInfo.english.dayOfWeek}</p>
                <p><span className="font-medium">Timezone:</span> {nepaliDateInfo.timezone}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Nepali Calendar</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p><span className="font-medium">Date:</span> {nepaliDateInfo.nepali.display}</p>
                <p><span className="font-medium">Year:</span> {nepaliDateInfo.nepali.year}</p>
                <p><span className="font-medium">Month:</span> {nepaliDateInfo.nepali.month}</p>
                <p><span className="font-medium">Day:</span> {nepaliDateInfo.nepali.dayOfWeek}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{summary.totalJobs}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Jobs</h3>
          <p className="text-sm text-gray-600">{summary.recentJobs} recent (28 days)</p>
          <p className="text-xs text-blue-600 mt-2">{summary.jobsThisWeek} this Nepali week</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{summary.totalCandidates}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Total Candidates</h3>
          <p className="text-sm text-gray-600">Average age: {candidates.averageAge}</p>
          <p className="text-xs text-green-600 mt-2">{summary.candidatesThisWeek} this Nepali week</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{summary.pendingInterviews}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Pending Interviews</h3>
          <p className="text-sm text-gray-600">This Nepali week</p>
          <p className="text-xs text-orange-600 mt-2">{summary.interviewsCompletedToday} completed today</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{summary.selectedCandidates}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Selected</h3>
          <p className="text-sm text-gray-600">{summary.shortlistedCandidates} shortlisted</p>
          <p className="text-xs text-purple-600 mt-2">
            {summary.conversionRates?.applicationToSelection || 0}% conversion
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
            Job Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Jobs:</span>
              <span className="font-semibold">{jobs.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Recent (28 days):</span>
              <span className="font-semibold text-blue-600">{jobs.recent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Nepali Week:</span>
              <span className="font-semibold text-green-600">{jobs.thisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Today (Nepal):</span>
              <span className="font-semibold text-orange-600">{jobs.today}</span>
            </div>
          </div>
          
          {Object.keys(jobs.byStatus).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">By Status</h4>
              <div className="space-y-1">
                {Object.entries(jobs.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Application Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Applications:</span>
              <span className="font-semibold">{applications.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shortlisted:</span>
              <span className="font-semibold text-blue-600">{applications.shortlisted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Selected:</span>
              <span className="font-semibold text-green-600">{applications.selected}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rejected:</span>
              <span className="font-semibold text-red-600">{applications.rejected}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Conversion Rates</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">App → Shortlist:</span>
                <span className="font-semibold text-blue-600">
                  {applications.conversionRates?.applicationToShortlist || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">App → Selection:</span>
                <span className="font-semibold text-green-600">
                  {applications.conversionRates?.applicationToSelection || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shortlist → Selection:</span>
                <span className="font-semibold text-purple-600">
                  {applications.conversionRates?.shortlistToSelection || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadMetrics}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Metrics
        </button>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Metrics Timestamp</h4>
            <p className="text-gray-600 font-mono">{metrics.timestamp}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Timezone</h4>
            <p className="text-gray-600 font-mono">{metrics.timezone}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Current Nepal Time</h4>
            <p className="text-gray-600 font-mono">
              {formatNepaliTime(summary.currentNepaliTime)}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Nepali Week</h4>
            <p className="text-gray-600 font-mono text-xs">
              {formatNepaliTime(summary.nepaliWeek.start, 'MMM dd')} - {formatNepaliTime(summary.nepaliWeek.end, 'MMM dd')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsExample