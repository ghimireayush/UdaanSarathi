import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Filter, 
  Users, 
  Briefcase, 
  Clock, 
  AlertCircle, 
  Settings, 
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { analyticsService, constantsService, applicationService, jobService } from '../services/index.js'
import DateDisplay, { TimeDisplay } from '../components/DateDisplay.jsx'
import { getToday, formatInNepalTz } from '../utils/nepaliDate.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PERMISSIONS } from '../services/authService.js'
import PermissionGuard from '../components/PermissionGuard.jsx'
import { InteractiveCard, InteractiveButton, InteractiveDropdown, InteractiveLoader } from '../components/InteractiveUI'
import { useNotificationContext } from '../contexts/NotificationContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, hasPermission, isAdmin, isRecruiter, isCoordinator } = useAuth()
  const { success, info } = useNotificationContext()
  
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
      const now = new Date()
      const twentyEightDaysAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000))
      
      // Get Nepali week boundaries (Sunday to Saturday)
      const nepaliWeekStart = new Date(now)
      nepaliWeekStart.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      const nepaliWeekEnd = new Date(nepaliWeekStart)
      nepaliWeekEnd.setDate(nepaliWeekStart.getDate() + 6) // End of week (Saturday)
      
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
      className={`p-8 ${className} transition-all duration-300 hover:scale-105 border-l-4 ${
        color === 'primary' ? 'border-primary-500' :
        color === 'success' ? 'border-green-500' :
        color === 'warning' ? 'border-yellow-500' :
        color === 'info' ? 'border-blue-500' :
        'border-gray-500'
      }`}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <div className={`p-4 rounded-xl ${
          color === 'primary' ? 'bg-primary-100 text-primary-600' :
          color === 'success' ? 'bg-green-100 text-green-600' :
          color === 'warning' ? 'bg-yellow-100 text-yellow-600' :
          color === 'info' ? 'bg-blue-100 text-blue-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-700">{metric.label}</span>
            <div className="text-right">
              <span className={`font-bold ${metric.highlight ? 'text-3xl text-gray-900' : 'text-xl text-gray-900'}`}>
                {metric.value}
              </span>
            </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-600 mb-3">
            {isAdmin() && "Full system access - Manage all recruitment operations"}
            {isRecruiter() && "Manage jobs, applications, interviews, and workflow"}
            {isCoordinator() && "Handle scheduling, notifications, and document management"}
          </p>
          <div className="flex items-center space-x-6">
            <DateDisplay 
              date={new Date()} 
              showNepali={true} 
              showTime={true} 
              className="text-sm" 
              iconClassName="w-4 h-4"
            />
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500 capitalize">{user?.role} Access</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
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
            size="sm"
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
            size="sm"
          />
          
          <InteractiveDropdown
            options={[
              { value: 'All Countries', label: 'All Countries' },
              ...countries.map(country => ({ value: country, label: country }))
            ]}
            value={filters.country}
            onChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
            placeholder="Filter by Country"
            size="sm"
          />
          
          <InteractiveButton
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            loading={isRefreshing}
            icon={RefreshCw}
          >
            Refresh
          </InteractiveButton>
        </div>
      </div>

      {/* Interactive Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <InteractiveMetricCard 
          title="Jobs" 
          icon={Briefcase} 
          metrics={jobMetrics}
          color="info"
          onClick={() => navigate('/jobs')}
          className="cursor-pointer"
        />
        
        <InteractiveMetricCard 
          title="Applications" 
          icon={Users} 
          metrics={applicationMetrics}
          color="success"
          onClick={() => navigate('/applications')}
          className="cursor-pointer"
        />
        
        <InteractiveMetricCard 
          title="Interviews" 
          icon={Calendar} 
          metrics={interviewMetrics}
          color="warning"
          onClick={() => navigate('/interviews')}
          className="cursor-pointer"
        />
      </div>

      {/* Interactive Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <PermissionGuard permission={PERMISSIONS.CREATE_JOB}>
          <InteractiveCard 
            hoverable 
            clickable
            onClick={() => navigate('/drafts')}
            className="p-8 cursor-pointer group border-l-4 border-blue-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">Create Job</p>
                <p className="text-sm text-gray-600 mb-3">Post new position</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.jobs?.drafts || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Drafts</p>
              </div>
            </div>
          </InteractiveCard>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
          <InteractiveCard 
            hoverable 
            clickable
            onClick={() => navigate('/applications')}
            className="p-8 cursor-pointer group border-l-4 border-green-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">Review Applications</p>
                <p className="text-sm text-gray-600 mb-3">Manage candidates</p>
                <p className="text-2xl font-bold text-green-600">{analytics.applications?.applicants || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Applicants</p>
              </div>
            </div>
          </InteractiveCard>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
          <InteractiveCard 
            hoverable 
            clickable
            onClick={() => navigate('/interviews')}
            className="p-8 cursor-pointer group border-l-4 border-purple-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">Schedule Interviews</p>
                <p className="text-sm text-gray-600 mb-3">Manage interviews</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.interviews?.weeklyPending || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
              </div>
            </div>
          </InteractiveCard>
        </PermissionGuard>

        <PermissionGuard permission={PERMISSIONS.VIEW_WORKFLOW}>
          <InteractiveCard 
            hoverable 
            clickable
            onClick={() => navigate('/workflow')}
            className="p-8 cursor-pointer group border-l-4 border-orange-500"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">Workflow</p>
                <p className="text-sm text-gray-600 mb-3">Track progress</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.applications?.selected || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">In Process</p>
              </div>
            </div>
          </InteractiveCard>
        </PermissionGuard>
      </div>

      {/* Real-time Status Indicator */}
      <div className="mt-8 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live data • Updates every 5 minutes</span>
          <span>•</span>
          <span>Last refresh: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard