import { useState, useEffect } from 'react'
import { Calendar, Filter, TrendingUp, Users, Briefcase, Clock, AlertCircle } from 'lucide-react'
import { analyticsService, constantsService } from '../services/index.js'
import DateDisplay, { TimeDisplay } from '../components/DateDisplay.jsx'
import { getToday, formatInNepalTz } from '../utils/nepaliDate.js'

const Dashboard = () => {
  const [filters, setFilters] = useState({
    timeWindow: 'Week',
    job: 'All Jobs',
    country: 'All Countries'
  })
  const [analytics, setAnalytics] = useState({})
  const [countries, setCountries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch analytics data using service
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [analyticsData, countriesData] = await Promise.all([
          analyticsService.getDashboardAnalytics(filters),
          constantsService.getCountries()
        ])
        
        setAnalytics(analyticsData)
        setCountries(countriesData)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [filters])

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load dashboard</h2>
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

  const MetricCard = ({ title, icon: Icon, metrics, className = "" }) => (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.label}</span>
            <span className={`font-semibold ${metric.highlight ? 'text-primary-600 text-lg' : 'text-gray-900'}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const jobMetrics = [
    { label: 'Total jobs', value: analytics.jobs?.total?.toLocaleString() || '0', highlight: true },
    { label: 'Open jobs', value: analytics.jobs?.open || '0' },
    { label: 'Recent jobs (28 days)', value: analytics.jobs?.recent || '0' },
    { label: 'Drafts', value: analytics.jobs?.drafts || '0' }
  ]

  const applicationMetrics = [
    { 
      label: 'Applicants', 
      value: `${analytics.applications?.applicants || 0} candidates applied to ${analytics.applications?.jobsApplied || 0} jobs`,
      highlight: true 
    },
    { label: 'Shortlisted', value: analytics.applications?.shortlisted || '0' },
    { label: 'Selected', value: `${analytics.applications?.selected || 0}/${analytics.applications?.shortlisted || 0} selected` }
  ]

  const interviewMetrics = [
    { 
      label: 'Weekly (Nepali week)', 
      value: `${analytics.interviews?.weeklyPending || 0} of ${analytics.interviews?.weeklyTotal || 0} pending interviews scheduled`,
      highlight: true 
    },
    { label: 'Today', value: `${analytics.interviews?.todayCompleted || 0}/${analytics.interviews?.todayTotal || 0} completed` },
    { label: 'Monthly', value: `${analytics.interviews?.monthlyInterviewed || 0} candidates interviewed` },
    { label: 'Pass/Fail', value: `${analytics.interviews?.monthlyPass || 0} pass, ${analytics.interviews?.monthlyFail || 0} fail` }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your recruitment pipeline and key metrics
          </p>
          <div className="mt-2">
            <DateDisplay 
              date={new Date()} 
              showNepali={true} 
              showTime={true} 
              className="text-xs" 
              iconClassName="w-3 h-3"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          <select 
            value={filters.timeWindow}
            onChange={(e) => setFilters(prev => ({ ...prev, timeWindow: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option>Today</option>
            <option>Week</option>
            <option>Month</option>
            <option>Custom</option>
          </select>
          
          <select 
            value={filters.job}
            onChange={(e) => setFilters(prev => ({ ...prev, job: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option>All Jobs</option>
            <option>Cook - UAE</option>
            <option>Driver - Malaysia</option>
            <option>Cleaner - Qatar</option>
          </select>
          
          <select 
            value={filters.country}
            onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option>All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Jobs" 
          icon={Briefcase} 
          metrics={jobMetrics}
          className="lg:col-span-1"
        />
        
        <MetricCard 
          title="Applications" 
          icon={Users} 
          metrics={applicationMetrics}
          className="lg:col-span-1"
        />
        
        <MetricCard 
          title="Interviews" 
          icon={Calendar} 
          metrics={interviewMetrics}
          className="lg:col-span-1"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="card p-4 hover:shadow-lg transition-shadow duration-200 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Job</p>
              <p className="text-sm text-gray-600">Post new position</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-lg transition-shadow duration-200 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Review Applications</p>
              <p className="text-sm text-gray-600">{analytics.applications?.applicants || 0} pending</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-lg transition-shadow duration-200 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Schedule Interviews</p>
              <p className="text-sm text-gray-600">{analytics.interviews?.weeklyPending || 0} pending</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-lg transition-shadow duration-200 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Detailed insights</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default Dashboard