import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  Calendar, 
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { InteractiveCard, InteractiveButton, InteractiveLoader } from './InteractiveUI'

const InteractiveDashboard = ({ 
  data = {},
  loading = false,
  onRefresh,
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Mock data structure - replace with actual data
  const dashboardData = {
    overview: {
      totalApplications: data.totalApplications || 0,
      activeJobs: data.activeJobs || 0,
      scheduledInterviews: data.scheduledInterviews || 0,
      completedPlacements: data.completedPlacements || 0
    },
    trends: {
      applicationsGrowth: data.applicationsGrowth || 0,
      jobsGrowth: data.jobsGrowth || 0,
      interviewsGrowth: data.interviewsGrowth || 0,
      placementsGrowth: data.placementsGrowth || 0
    },
    recentActivity: data.recentActivity || []
  }

  const MetricCard = ({ title, value, trend, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100',
      purple: 'text-purple-600 bg-purple-100'
    }

    return (
      <InteractiveCard hoverable className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                ) : (
                  <Activity className="w-4 h-4 text-gray-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </InteractiveCard>
    )
  }

  const ActivityItem = ({ activity }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${
        activity.type === 'application' ? 'bg-blue-100 text-blue-600' :
        activity.type === 'interview' ? 'bg-green-100 text-green-600' :
        activity.type === 'placement' ? 'bg-purple-100 text-purple-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        {activity.type === 'application' && <Users className="w-4 h-4" />}
        {activity.type === 'interview' && <Calendar className="w-4 h-4" />}
        {activity.type === 'placement' && <CheckCircle className="w-4 h-4" />}
        {activity.type === 'job' && <Briefcase className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
        <p className="text-sm text-gray-500">{activity.description}</p>
        <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <InteractiveLoader type="skeleton" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of your recruitment activities</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <InteractiveButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={Activity}
          >
            Refresh
          </InteractiveButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Applications"
          value={dashboardData.overview.totalApplications}
          trend={dashboardData.trends.applicationsGrowth}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Jobs"
          value={dashboardData.overview.activeJobs}
          trend={dashboardData.trends.jobsGrowth}
          icon={Briefcase}
          color="green"
        />
        <MetricCard
          title="Scheduled Interviews"
          value={dashboardData.overview.scheduledInterviews}
          trend={dashboardData.trends.interviewsGrowth}
          icon={Calendar}
          color="yellow"
        />
        <MetricCard
          title="Completed Placements"
          value={dashboardData.overview.completedPlacements}
          trend={dashboardData.trends.placementsGrowth}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2">
          <InteractiveCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <div className="flex space-x-2">
                <InteractiveButton
                  variant={selectedMetric === 'overview' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMetric('overview')}
                  icon={BarChart3}
                >
                  Overview
                </InteractiveButton>
                <InteractiveButton
                  variant={selectedMetric === 'trends' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMetric('trends')}
                  icon={PieChart}
                >
                  Trends
                </InteractiveButton>
              </div>
            </div>
            
            {/* Placeholder for charts */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Chart visualization would go here</p>
                <p className="text-sm text-gray-400">Showing {selectedMetric} data for {timeRange}</p>
              </div>
            </div>
          </InteractiveCard>
        </div>

        {/* Recent Activity */}
        <div>
          <InteractiveCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>
      </div>

      {/* Quick Actions */}
      <InteractiveCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InteractiveButton
            variant="outline"
            className="justify-start p-4 h-auto"
            icon={Users}
          >
            <div className="text-left">
              <div className="font-medium">Review Applications</div>
              <div className="text-sm text-gray-500">Check new candidate applications</div>
            </div>
          </InteractiveButton>
          
          <InteractiveButton
            variant="outline"
            className="justify-start p-4 h-auto"
            icon={Calendar}
          >
            <div className="text-left">
              <div className="font-medium">Schedule Interviews</div>
              <div className="text-sm text-gray-500">Set up candidate interviews</div>
            </div>
          </InteractiveButton>
          
          <InteractiveButton
            variant="outline"
            className="justify-start p-4 h-auto"
            icon={Briefcase}
          >
            <div className="text-left">
              <div className="font-medium">Post New Job</div>
              <div className="text-sm text-gray-500">Create a new job posting</div>
            </div>
          </InteractiveButton>
        </div>
      </InteractiveCard>
    </div>
  )
}

export default InteractiveDashboard