// Analytics Service - Handles dashboard analytics and metrics
import analyticsData from '../data/analytics.json'
import jobService from './jobService.js'
import candidateService from './candidateService.js'
import applicationService from './applicationService.js'
import interviewService from './interviewService.js'

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (5% chance)
const shouldSimulateError = () => Math.random() < 0.05

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

class AnalyticsService {
  /**
   * Get dashboard analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Dashboard analytics data
   */
  async getDashboardAnalytics(filters = {}) {
    await delay()
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch analytics data')
    }

    let analytics = deepClone(analyticsData)

    // Apply real-time calculations if needed
    if (filters.realTime) {
      const [jobs, candidates, applications, interviews] = await Promise.all([
        jobService.getJobs(),
        candidateService.getCandidates(),
        applicationService.getApplications(),
        interviewService.getInterviews()
      ])

      // Update with real data
      analytics.jobs.total = jobs.length
      analytics.candidates.total = candidates.length
      analytics.applications.total = applications.length
      analytics.interviews.weeklyTotal = interviews.length
    }

    // Apply country filter
    if (filters.country && filters.country !== 'All Countries') {
      const jobs = await jobService.getJobsByCountry(filters.country)
      analytics.jobs.total = jobs.length
      analytics.jobs.open = jobs.filter(job => job.status === 'published').length
    }

    // Apply time window filter
    if (filters.timeWindow) {
      analytics = await this.applyTimeWindowFilter(analytics, filters.timeWindow)
    }

    return analytics
  }

  /**
   * Apply time window filter to analytics
   * @param {Object} analytics - Analytics data
   * @param {string} timeWindow - Time window (today, week, month, year)
   * @returns {Promise<Object>} Filtered analytics
   */
  async applyTimeWindowFilter(analytics, timeWindow) {
    await delay(100)
    const now = new Date()
    let startDate = new Date()

    switch (timeWindow) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setDate(now.getDate() - 30)
        break
      case 'year':
        startDate.setDate(now.getDate() - 365)
        break
      default:
        return analytics
    }

    // Filter data based on time window
    // This would typically involve filtering the source data
    // For now, we'll return the analytics as-is since we're using mock data

    return analytics
  }

  /**
   * Get job analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Job analytics
   */
  async getJobAnalytics(filters = {}) {
    await delay(200)
    const jobStats = await jobService.getJobStatistics()
    
    return {
      ...analyticsData.jobs,
      ...jobStats,
      trends: analyticsData.jobs.monthlyTrend
    }
  }

  /**
   * Get application analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Application analytics
   */
  async getApplicationAnalytics(filters = {}) {
    await delay(200)
    const appStats = await applicationService.getApplicationStatistics()
    
    return {
      ...analyticsData.applications,
      ...appStats,
      trends: analyticsData.applications.monthlyTrend
    }
  }

  /**
   * Get interview analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Interview analytics
   */
  async getInterviewAnalytics(filters = {}) {
    await delay(200)
    const interviewStats = await interviewService.getInterviewStatistics()
    
    return {
      ...analyticsData.interviews,
      ...interviewStats,
      trends: analyticsData.interviews.monthlyTrend
    }
  }

  /**
   * Get candidate analytics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Candidate analytics
   */
  async getCandidateAnalytics(filters = {}) {
    await delay(200)
    const candidateStats = await candidateService.getCandidateStatistics()
    
    return {
      ...analyticsData.candidates,
      ...candidateStats
    }
  }

  /**
   * Get agency performance metrics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Agency performance data
   */
  async getAgencyPerformance(filters = {}) {
    await delay(200)
    return deepClone(analyticsData.agency)
  }

  /**
   * Get performance insights
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Performance insights and recommendations
   */
  async getPerformanceInsights(filters = {}) {
    await delay(300)
    const analytics = await this.getDashboardAnalytics(filters)
    
    const insights = {
      highlights: [],
      concerns: [],
      recommendations: [],
      trends: {
        jobs: 'increasing',
        applications: 'stable',
        interviews: 'increasing'
      }
    }

    // Generate insights based on data
    if (analytics.applications.conversionRate.applicationToShortlist > 30) {
      insights.highlights.push('High application to shortlist conversion rate')
    }

    if (analytics.interviews.successRate > 80) {
      insights.highlights.push('Excellent interview success rate')
    }

    if (analytics.jobs.drafts > analytics.jobs.open * 0.5) {
      insights.concerns.push('Many jobs remain in draft status')
      insights.recommendations.push('Review and publish pending job drafts')
    }

    if (analytics.applications.conversionRate.applicationToShortlist < 20) {
      insights.concerns.push('Low application conversion rate')
      insights.recommendations.push('Review job requirements and screening criteria')
    }

    return insights
  }

  /**
   * Get monthly trends data
   * @param {string} metric - Metric to get trends for (jobs, applications, interviews)
   * @param {number} months - Number of months to include (default: 12)
   * @returns {Promise<Array>} Monthly trend data
   */
  async getMonthlyTrends(metric, months = 12) {
    await delay(200)
    
    const trendData = {
      jobs: analyticsData.jobs.monthlyTrend,
      applications: analyticsData.applications.monthlyTrend,
      interviews: analyticsData.interviews.monthlyTrend
    }

    return trendData[metric]?.slice(-months) || []
  }

  /**
   * Get real-time metrics
   * @returns {Promise<Object>} Real-time metrics
   */
  async getRealTimeMetrics() {
    await delay(150)
    
    const [todayInterviews, recentApplications, pendingActions] = await Promise.all([
      interviewService.getTodaysInterviews(),
      applicationService.getRecentApplications(1),
      applicationService.getApplicationsRequiringAction()
    ])

    return {
      todayInterviews: todayInterviews.length,
      newApplicationsToday: recentApplications.length,
      pendingActions: pendingActions.length,
      activeRecruiters: analyticsData.agency.activeRecruiters,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Get conversion funnel data
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Conversion funnel data
   */
  async getConversionFunnel(filters = {}) {
    await delay(200)
    const appStats = await applicationService.getApplicationStatistics()
    
    return {
      stages: [
        {
          name: 'Applications',
          count: appStats.total,
          percentage: 100
        },
        {
          name: 'Shortlisted',
          count: appStats.byStage.shortlisted || 0,
          percentage: appStats.conversionRates.applicationToShortlist || 0
        },
        {
          name: 'Interviewed',
          count: appStats.byStage.interviewed || 0,
          percentage: appStats.conversionRates.applicationToInterview || 0
        },
        {
          name: 'Selected',
          count: appStats.byStage.selected || 0,
          percentage: appStats.conversionRates.applicationToSelection || 0
        }
      ]
    }
  }

  /**
   * Get top performing metrics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Top performing data
   */
  async getTopPerformers(filters = {}) {
    await delay(200)
    
    const [topJobs, topCandidates] = await Promise.all([
      jobService.getPopularJobs(20),
      candidateService.getTopCandidates(10)
    ])

    return {
      jobs: topJobs.slice(0, 5).map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        applications: job.applications_count,
        conversionRate: job.shortlisted_count > 0 
          ? (job.shortlisted_count / job.applications_count * 100).toFixed(1)
          : 0
      })),
      candidates: topCandidates.slice(0, 5).map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        score: candidate.priority_score,
        stage: candidate.stage,
        appliedJobs: candidate.applied_jobs?.length || 0
      })),
      recruiters: analyticsData.performance.topPerformingRecruiters
    }
  }

  /**
   * Generate analytics report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Analytics report
   */
  async generateReport(options = {}) {
    await delay(500)
    
    const [
      dashboard,
      jobAnalytics,
      applicationAnalytics,
      interviewAnalytics,
      insights,
      topPerformers
    ] = await Promise.all([
      this.getDashboardAnalytics(options.filters),
      this.getJobAnalytics(options.filters),
      this.getApplicationAnalytics(options.filters),
      this.getInterviewAnalytics(options.filters),
      this.getPerformanceInsights(options.filters),
      this.getTopPerformers(options.filters)
    ])

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: options.period || 'monthly',
        filters: options.filters || {}
      },
      summary: dashboard,
      jobs: jobAnalytics,
      applications: applicationAnalytics,
      interviews: interviewAnalytics,
      insights,
      topPerformers,
      recommendations: insights.recommendations
    }
  }

  /**
   * Get KPI (Key Performance Indicators) data
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} KPI data
   */
  async getKPIs(filters = {}) {
    await delay(200)
    const analytics = await this.getDashboardAnalytics(filters)
    
    return {
      applicationSuccessRate: analytics.applications.conversionRate?.applicationToSelection || 0,
      interviewAttendanceRate: analytics.interviews.completionRate || 0,
      averageTimeToHire: analytics.applications.averageProcessingTime?.interviewToDecision || 0,
      candidateSatisfaction: analytics.agency.clientSatisfaction || 0,
      monthlyPlacementTarget: analytics.agency.monthlyTarget || 0,
      monthlyPlacementAchieved: analytics.agency.monthlyAchieved || 0,
      revenuePerPlacement: 2500, // Calculated based on agency standards
      costPerHire: 500 // Calculated based on operational costs
    }
  }

  /**
   * Get export data for reports
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export-ready data
   */
  async getExportData(options = {}) {
    await delay(300)
    const report = await this.generateReport(options)
    
    // Format data for CSV/Excel export
    return {
      summary: Object.entries(report.summary).map(([key, value]) => ({
        metric: key,
        value: typeof value === 'object' ? JSON.stringify(value) : value
      })),
      trends: report.jobs.trends || [],
      topJobs: report.topPerformers.jobs || [],
      topCandidates: report.topPerformers.candidates || []
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService()
export default analyticsService