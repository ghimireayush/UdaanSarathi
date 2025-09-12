import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  Briefcase, 
  AlertCircle, 
  Shield,
  FileText,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { constantsService, applicationService, jobService } from '../services/index.js'
import DateDisplay from '../components/DateDisplay.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PERMISSIONS } from '../services/authService.js'
import PermissionGuard from '../components/PermissionGuard.jsx'
import { InteractiveCard, InteractiveButton, InteractiveDropdown, InteractiveLoader } from '../components/InteractiveUI'
import { useNotificationContext } from '../contexts/NotificationContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isAdmin, isRecruiter, isCoordinator } = useAuth()
  const { success } = useNotificationContext()
  
  const [filters, setFilters] = useState({
    timeWindow: 'Week',
    job: 'All Jobs',
    country: 'All Countries'
  })
  const [analytics, setAnalytics] = useState({})
  const [countries, setCountries] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Fetch real-time analytics data
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      // Fetch real data from services
      const [applicationsData, jobsData, countriesData] = await Promise.all([
        applicationService.getApplicationStatistics(),
        jobService.getJobStatistics(),
        constantsService.getCountries()
      ])
      
      // Calculate analytics based on real data
      
      const calculatedAnalytics = {
        jobs: {
          total: jobsData.total || 0,
          open: jobsData.byStatus?.published || 0,
          recent: jobsData.recentCount || 0,
          drafts: jobsData.byStatus?.draft || 0
        },
        applications: {
          applicants: applicationsData.total || 0,
          jobsApplied: Object.keys(applicationsData.byJob || {}).length,
          shortlisted: applicationsData.byStage?.shortlisted || 0,
          selected: applicationsData.byStage?.selected || 0,
          interviewed: applicationsData.byStage?.interviewed || 0
        },
        interviews: {
          weeklyPending: 6, // Mock data - would come from interview service
          weeklyTotal: 6,
          todayCompleted: 0,
          todayTotal: 3,
          monthlyInterviewed: 9,
          monthlyPass: 3,
          monthlyFail: 6
        },
        stageCounts: {
          applied: applicationsData.byStage?.applied || 3,
          shortlisted: applicationsData.byStage?.shortlisted || 0,
          'interview-scheduled': applicationsData.byStage?.['interview-scheduled'] || 0,
          'interview-passed': applicationsData.byStage?.['interview-passed'] || 0
        }
      }
      
      setAnalytics(calculatedAnalytics)
      setCountries(countriesData)
      setJobs(jobsData.jobs || [])
      setLastUpdated(new Date())
      
      if (showRefreshIndicator) {
        success('Dashboard Updated', 'Analytics data has been refreshed successfully.')
      }
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [filters])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [filters])

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InteractiveLoader 
          type="skeleton" 
          text="Loading dashboard analytics..." 
          className="min-h-screen flex items-center justify-center"
        />
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

  const InteractiveMetricCard = ({ title, icon: Icon, metrics, className = "", color = "primary", onClick }) => (
    <InteractiveCard 
      hoverable 
      clickable={!!onClick}
      onClick={onClick}
      className={`p-5 ${className} transition-all duration-300 hover:scale-105 ${
        color === 'info' ? 'border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100' :
        color === 'success' ? 'border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100' :
        color === 'warning' ? 'border-l-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100' :
        'border-l-4 border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100'
      }`}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl shadow-sm ${
            color === 'info' ? 'bg-blue-500 text-white' :
            color === 'success' ? 'bg-green-500 text-white' :
            color === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
      </div>
      
      {/* Main Metric */}
      <div className="mb-4">
        {metrics.filter(m => m.highlight).map((metric, index) => (
          <div key={index} className="text-center">
            <div className={`text-4xl font-black mb-1 ${
              color === 'info' ? 'text-blue-700' :
              color === 'success' ? 'text-green-700' :
              color === 'warning' ? 'text-yellow-700' :
              'text-gray-700'
            }`}>
              {metric.value}
            </div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Secondary Metrics */}
      <div className="space-y-2 border-t border-gray-200 pt-3">
        {metrics.filter(m => !m.highlight).map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">{metric.label}</span>
            <span className="text-sm font-bold text-gray-900">{metric.value}</span>
          </div>
        ))}
      </div>
    </InteractiveCard>
  )

  const jobMetrics = [
    { 
      label: 'Total jobs', 
      value: analytics.jobs?.total?.toLocaleString() || '0', 
      highlight: true
    },
    { label: 'Open jobs', value: analytics.jobs?.open || '0' },
    { label: 'Recent jobs (28 days)', value: analytics.jobs?.recent || '0' },
    { label: 'Drafts', value: analytics.jobs?.drafts || '0' }
  ]

  const applicationMetrics = [
    { 
      label: 'Applicants', 
      value: `${analytics.applications?.applicants || 0}`,
      highlight: true
    },
    { 
      label: 'Applied to jobs', 
      value: `${analytics.applications?.jobsApplied || 0} jobs`
    },
    { label: 'Shortlisted', value: analytics.applications?.shortlisted || '0' },
    { 
      label: 'Selected', 
      value: `${analytics.applications?.selected || 0}/${analytics.applications?.shortlisted || 0}`
    }
  ]

  const interviewMetrics = [
    { 
      label: 'Weekly (Nepali week)', 
      value: `${analytics.interviews?.weeklyPending || 0} of ${analytics.interviews?.weeklyTotal || 0} pending`,
      highlight: true
    },
    { 
      label: 'Today completed', 
      value: `${analytics.interviews?.todayCompleted || 0}/${analytics.interviews?.todayTotal || 0}`
    },
    { 
      label: 'Monthly interviewed', 
      value: `${analytics.interviews?.monthlyInterviewed || 0} candidates`
    },
    { 
      label: 'Pass rate', 
      value: `${analytics.interviews?.monthlyPass || 0} pass, ${analytics.interviews?.monthlyFail || 0} fail`
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            {/* Left Side - Welcome & Info */}
            <div className="flex-1 mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-600 mb-4 text-lg">
                {isAdmin() && "Full system access - Manage all recruitment operations"}
                {isRecruiter() && "Manage jobs, applications, interviews, and workflow"}
                {isCoordinator() && "Handle scheduling, notifications, and document management"}
              </p>
              
              {/* Status Info */}
              <div className="flex flex-wrap items-center gap-6">
                <DateDisplay 
                  date={new Date()} 
                  showNepali={true} 
                  showTime={true} 
                  className="text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200" 
                  iconClassName="w-4 h-4"
                />
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium capitalize">{user?.role} Access</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <Activity className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right Side - Controls */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters & Controls</h3>
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <InteractiveDropdown
                      options={[
                        { value: 'Today', label: 'Today' },
                        { value: 'Week', label: 'This Week' },
                        { value: 'Month', label: 'This Month' },
                        { value: 'Custom', label: 'Custom Range' }
                      ]}
                      value={filters.timeWindow}
                      onChange={(value) => setFilters(prev => ({ ...prev, timeWindow: value }))}
                      placeholder="Time Window"
                      size="md"
                      className="w-full min-w-[150px]"
                    />
                    
                    <InteractiveDropdown
                      options={[
                        { value: 'All Jobs', label: 'All Jobs' },
                        ...jobs.slice(0, 5).map(job => ({ 
                          value: job.id, 
                          label: `${job.title} - ${job.company}` 
                        }))
                      ]}
                      value={filters.job}
                      onChange={(value) => setFilters(prev => ({ ...prev, job: value }))}
                      placeholder="Filter by Job"
                      searchable={true}
                      size="md"
                      className="w-full min-w-[200px]"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <InteractiveDropdown
                      options={[
                        { value: 'All Countries', label: 'All Countries' },
                        ...countries.map(country => ({ value: country, label: country }))
                      ]}
                      value={filters.country}
                      onChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
                      placeholder="Filter by Country"
                      size="md"
                      className="w-full min-w-[150px]"
                    />
                    
                    <InteractiveButton
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      loading={isRefreshing}
                      icon={RefreshCw}
                      className="w-full sm:w-auto px-3 py-1 text-sm"
                    >
                      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                    </InteractiveButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <InteractiveMetricCard 
            title="Jobs" 
            icon={Briefcase} 
            metrics={jobMetrics}
            color="info"
            onClick={() => navigate('/jobs')}
            className="cursor-pointer hover:shadow-lg"
          />
          
          <InteractiveMetricCard 
            title="Applications" 
            icon={Users} 
            metrics={applicationMetrics}
            color="success"
            onClick={() => navigate('/applications')}
            className="cursor-pointer hover:shadow-lg"
          />
          
          <InteractiveMetricCard 
            title="Interviews" 
            icon={Calendar} 
            metrics={interviewMetrics}
            color="warning"
            onClick={() => navigate('/interviews')}
            className="cursor-pointer hover:shadow-lg"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PermissionGuard permission={PERMISSIONS.CREATE_JOB}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => navigate('/drafts')}
                className="p-4 cursor-pointer group border border-gray-200 hover:border-blue-300 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">Create Job</p>
                    <div className="bg-blue-50 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-blue-600">{analytics.jobs?.drafts || 0}</p>
                      <p className="text-xs text-blue-500 uppercase tracking-wide">Drafts</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => navigate('/applications')}
                className="p-4 cursor-pointer group border border-gray-200 hover:border-green-300 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-1">Applications</p>
                    <div className="bg-green-50 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-green-600">{analytics.applications?.applicants || 0}</p>
                      <p className="text-xs text-green-500 uppercase tracking-wide">Applicants</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => navigate('/interviews')}
                className="p-4 cursor-pointer group border border-gray-200 hover:border-purple-300 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">Interviews</p>
                    <div className="bg-purple-50 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-purple-600">{analytics.interviews?.weeklyPending || 0}</p>
                      <p className="text-xs text-purple-500 uppercase tracking-wide">Pending</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.VIEW_WORKFLOW}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => navigate('/workflow')}
                className="p-4 cursor-pointer group border border-gray-200 hover:border-orange-300 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">Workflow</p>
                    <div className="bg-orange-50 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-orange-600">{analytics.applications?.selected || 0}</p>
                      <p className="text-xs text-orange-500 uppercase tracking-wide">In Process</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>
          </div>
        </div>

        {/* Status Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Data</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>Updates every 5 minutes</span>
              <span className="text-gray-300">•</span>
              <span>Last refresh: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard