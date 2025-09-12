import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  UserCheck,
  MapPin,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { metricsService } from '../services/index.js'

const DashboardMetrics = ({ 
  jobs = [], 
  interviews = [], 
  applications = [], 
  candidates = [],
  refreshTrigger = 0 
}) => {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [jobs, interviews, applications, candidates, refreshTrigger])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const metricsData = await metricsService.getDashboardMetrics({
        jobs,
        interviews,
        applications,
        candidates
      })
      
      setMetrics(metricsData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load metrics:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-12 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">Failed to load metrics</span>
          </div>
          <button
            onClick={loadMetrics}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const { summary } = metrics

  const metricCards = [
    {
      title: 'Total Jobs',
      value: summary.totalJobs,
      subtitle: `${summary.recentJobs} recent (28 days)`,
      icon: Briefcase,
      color: 'blue',
      trend: summary.jobsThisWeek > 0 ? `+${summary.jobsThisWeek} this week` : 'No new jobs this week'
    },
    {
      title: 'Total Candidates',
      value: summary.totalCandidates,
      subtitle: `${summary.candidatesThisWeek} this week`,
      icon: Users,
      color: 'green',
      trend: summary.candidatesAppliedToday > 0 ? `+${summary.candidatesAppliedToday} today` : 'No applications today'
    },
    {
      title: 'Pending Interviews',
      value: summary.pendingInterviews,
      subtitle: 'This week (Nepali)',
      icon: Calendar,
      color: 'orange',
      trend: summary.interviewsCompletedToday > 0 ? `${summary.interviewsCompletedToday} completed today` : 'None completed today'
    },
    {
      title: 'Shortlisted',
      value: summary.shortlistedCandidates,
      subtitle: 'Ready for interview',
      icon: UserCheck,
      color: 'purple',
      trend: `${summary.conversionRates?.applicationToShortlist || 0}% conversion rate`
    },
    {
      title: 'Selected',
      value: summary.selectedCandidates,
      subtitle: 'Passed interviews',
      icon: CheckCircle,
      color: 'emerald',
      trend: `${summary.conversionRates?.applicationToSelection || 0}% from applications`
    },
    {
      title: 'Total Applications',
      value: summary.totalApplications,
      subtitle: 'All time',
      icon: TrendingUp,
      color: 'indigo',
      trend: `${summary.conversionRates?.shortlistToSelection || 0}% shortlist to selection`
    },
    {
      title: 'Today\'s Activity',
      value: summary.jobsCreatedToday + summary.candidatesAppliedToday,
      subtitle: 'Jobs + Applications',
      icon: Activity,
      color: 'pink',
      trend: 'Nepal time zone'
    },
    {
      title: 'Total Interviews',
      value: summary.totalInterviews,
      subtitle: 'All time',
      icon: Clock,
      color: 'cyan',
      trend: `${summary.pendingInterviews} pending`
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
      green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
      orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
      purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
      emerald: 'from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50',
      indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50',
      pink: 'from-pink-500 to-pink-600 text-pink-600 bg-pink-50',
      cyan: 'from-cyan-500 to-cyan-600 text-cyan-600 bg-cyan-50'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Time Zone Info */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Nepal Time Zone</h3>
              <p className="text-sm text-primary-700">
                {format(summary.currentNepaliTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')} (Asia/Kathmandu)
              </p>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-right">
              <p className="text-xs text-primary-600 font-medium">Last Updated</p>
              <p className="text-sm text-primary-800">
                {format(lastUpdated, 'HH:mm:ss')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => {
          const Icon = card.icon
          const colorClasses = getColorClasses(card.color)
          const [gradientClass, textColorClass, bgColorClass] = colorClasses.split(' ')

          return (
            <div
              key={index}
              className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`px-2 py-1 ${bgColorClass} rounded-lg`}>
                    <BarChart3 className={`w-4 h-4 ${textColorClass}`} />
                  </div>
                </div>

                {/* Main Value */}
                <div className="mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                    {card.value.toLocaleString()}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                </div>

                {/* Subtitle */}
                <p className="text-sm text-gray-500 mb-3">{card.subtitle}</p>

                {/* Trend */}
                <div className={`text-xs font-medium ${textColorClass} bg-opacity-10 ${bgColorClass} px-2 py-1 rounded-md`}>
                  {card.trend}
                </div>
              </div>

              {/* Hover Effect */}
              <div className={`h-1 bg-gradient-to-r ${gradientClass} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Week Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary-600" />
            Current Nepali Week
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Start:</span> {format(summary.nepaliWeek.start, 'MMM dd, yyyy')}
            </p>
            <p>
              <span className="font-medium">End:</span> {format(summary.nepaliWeek.end, 'MMM dd, yyyy')}
            </p>
            <p className="text-primary-600 font-medium">
              {summary.jobsThisWeek} jobs, {summary.candidatesThisWeek} candidates this week
            </p>
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Conversion Rates
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Application → Shortlist:</span>
              <span className="font-semibold text-green-600">
                {summary.conversionRates?.applicationToShortlist || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Application → Selection:</span>
              <span className="font-semibold text-blue-600">
                {summary.conversionRates?.applicationToSelection || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shortlist → Selection:</span>
              <span className="font-semibold text-purple-600">
                {summary.conversionRates?.shortlistToSelection || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-600" />
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button
              onClick={loadMetrics}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Metrics
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Report
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardMetrics