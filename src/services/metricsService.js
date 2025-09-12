// Metrics Service - Handles all metrics calculations with proper timezone and Nepali calendar support
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, isWithinInterval, parseISO, isToday } from 'date-fns'
import NepaliDate from 'nepali-date-converter'

// Utility function to simulate API delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms))

// Nepal timezone offset: UTC+5:45 (345 minutes)
const NEPAL_TIMEZONE_OFFSET = 345 // minutes
const NEPAL_TIMEZONE = 'Asia/Kathmandu'

// Nepali week starts on Sunday (0) and ends on Saturday (6)
const NEPALI_WEEK_START = 0 // Sunday

class MetricsService {
  /**
   * Get current Nepal time
   * @returns {Date} Current date in Nepal timezone
   */
  getNepaliTime() {
    const now = new Date()
    // Add Nepal timezone offset (UTC+5:45)
    return new Date(now.getTime() + (NEPAL_TIMEZONE_OFFSET * 60 * 1000))
  }

  /**
   * Convert UTC date to Nepal time
   * @param {Date} date - UTC date
   * @returns {Date} Date in Nepal timezone
   */
  toNepaliTime(date) {
    return new Date(date.getTime() + (NEPAL_TIMEZONE_OFFSET * 60 * 1000))
  }

  /**
   * Get start and end of current Nepali week
   * @returns {Object} { start, end } dates in Nepal timezone
   */
  getCurrentNepaliWeek() {
    const now = this.getNepaliTime()
    const start = startOfWeek(now, { weekStartsOn: NEPALI_WEEK_START })
    const end = endOfWeek(now, { weekStartsOn: NEPALI_WEEK_START })
    
    return { start, end }
  }

  /**
   * Get start and end of today in Nepal timezone
   * @returns {Object} { start, end } dates in Nepal timezone
   */
  getTodayNepali() {
    const now = this.getNepaliTime()
    return {
      start: startOfDay(now),
      end: endOfDay(now)
    }
  }

  /**
   * Check if a date is within the last 28 days (recent)
   * @param {string|Date} date - Date to check
   * @returns {boolean} True if date is recent
   */
  isRecent(date) {
    const nepaliNow = this.getNepaliTime()
    const checkDate = typeof date === 'string' ? parseISO(date) : date
    const nepaliCheckDate = this.toNepaliTime(checkDate)
    const twentyEightDaysAgo = subDays(nepaliNow, 28)
    
    return isWithinInterval(nepaliCheckDate, {
      start: twentyEightDaysAgo,
      end: nepaliNow
    })
  }

  /**
   * Check if a date is in current Nepali week
   * @param {string|Date} date - Date to check
   * @returns {boolean} True if date is in current week
   */
  isThisWeekNepali(date) {
    const checkDate = typeof date === 'string' ? parseISO(date) : date
    const nepaliCheckDate = this.toNepaliTime(checkDate)
    const { start, end } = this.getCurrentNepaliWeek()
    
    return isWithinInterval(nepaliCheckDate, { start, end })
  }

  /**
   * Check if a date is today in Nepal timezone
   * @param {string|Date} date - Date to check
   * @returns {boolean} True if date is today
   */
  isTodayNepali(date) {
    const checkDate = typeof date === 'string' ? parseISO(date) : date
    const nepaliCheckDate = this.toNepaliTime(checkDate)
    const nepaliNow = this.getNepaliTime()
    
    return format(nepaliCheckDate, 'yyyy-MM-dd') === format(nepaliNow, 'yyyy-MM-dd')
  }

  /**
   * Get job metrics
   * @param {Array} jobs - Array of job objects
   * @returns {Promise<Object>} Job metrics
   */
  async getJobMetrics(jobs = []) {
    await delay()
    
    const metrics = {
      total: jobs.length,
      recent: 0,
      thisWeek: 0,
      today: 0,
      byStatus: {},
      byCountry: {},
      recentJobs: []
    }

    jobs.forEach(job => {
      // Count by status
      const status = job.status || 'draft'
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1

      // Count by country
      const country = job.country || 'Unknown'
      metrics.byCountry[country] = (metrics.byCountry[country] || 0) + 1

      // Time-based metrics
      if (job.created_at) {
        if (this.isRecent(job.created_at)) {
          metrics.recent++
          metrics.recentJobs.push(job)
        }
        
        if (this.isThisWeekNepali(job.created_at)) {
          metrics.thisWeek++
        }
        
        if (this.isTodayNepali(job.created_at)) {
          metrics.today++
        }
      }
    })

    // Sort recent jobs by creation date
    metrics.recentJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    return metrics
  }

  /**
   * Get interview metrics
   * @param {Array} interviews - Array of interview objects
   * @returns {Promise<Object>} Interview metrics
   */
  async getInterviewMetrics(interviews = []) {
    await delay()
    
    const metrics = {
      total: interviews.length,
      pendingThisWeek: 0,
      completedToday: 0,
      byStatus: {},
      byOutcome: {},
      pendingInterviews: [],
      completedTodayInterviews: []
    }

    const pendingStatuses = ['scheduled', 'confirmed', 'in_progress']
    const completedStatuses = ['completed', 'passed', 'failed', 'rejected']

    interviews.forEach(interview => {
      // Count by status
      const status = interview.status || 'scheduled'
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1

      // Count by outcome
      if (interview.outcome) {
        metrics.byOutcome[interview.outcome] = (metrics.byOutcome[interview.outcome] || 0) + 1
      }

      // Pending this week: scheduled in current week and not completed
      if (interview.scheduled_at && 
          this.isThisWeekNepali(interview.scheduled_at) && 
          pendingStatuses.includes(status)) {
        metrics.pendingThisWeek++
        metrics.pendingInterviews.push(interview)
      }

      // Completed today: interviews with outcome set today
      if (interview.completed_at && 
          this.isTodayNepali(interview.completed_at) &&
          completedStatuses.includes(status)) {
        metrics.completedToday++
        metrics.completedTodayInterviews.push(interview)
      }
    })

    return metrics
  }

  /**
   * Get application metrics
   * @param {Array} applications - Array of application objects
   * @returns {Promise<Object>} Application metrics
   */
  async getApplicationMetrics(applications = []) {
    await delay()
    
    const metrics = {
      total: applications.length,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
      byStage: {},
      byStatus: {},
      conversionRates: {},
      shortlistedApplications: [],
      selectedApplications: []
    }

    // Define stage mappings
    const shortlistedStages = ['shortlisted', 'interview-scheduled', 'interviewed']
    const selectedStages = ['interview-passed', 'selected', 'hired', 'ready-to-fly', 'departed']
    const rejectedStages = ['rejected', 'withdrawn', 'cancelled']

    applications.forEach(application => {
      const stage = application.stage || 'applied'
      const status = application.status || 'active'

      // Count by stage
      metrics.byStage[stage] = (metrics.byStage[stage] || 0) + 1

      // Count by status
      metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1

      // Canonical status-based counting (idempotent)
      if (shortlistedStages.includes(stage)) {
        metrics.shortlisted++
        metrics.shortlistedApplications.push(application)
      }

      if (selectedStages.includes(stage)) {
        metrics.selected++
        metrics.selectedApplications.push(application)
      }

      if (rejectedStages.includes(stage)) {
        metrics.rejected++
      }
    })

    // Calculate conversion rates
    if (metrics.total > 0) {
      metrics.conversionRates = {
        applicationToShortlist: ((metrics.shortlisted / metrics.total) * 100).toFixed(1),
        applicationToSelection: ((metrics.selected / metrics.total) * 100).toFixed(1),
        shortlistToSelection: metrics.shortlisted > 0 ? 
          ((metrics.selected / metrics.shortlisted) * 100).toFixed(1) : '0.0'
      }
    }

    return metrics
  }

  /**
   * Get candidate metrics
   * @param {Array} candidates - Array of candidate objects
   * @returns {Promise<Object>} Candidate metrics
   */
  async getCandidateMetrics(candidates = []) {
    await delay()
    
    const metrics = {
      total: candidates.length,
      recent: 0,
      thisWeek: 0,
      today: 0,
      byStage: {},
      byGender: {},
      byEducation: {},
      byCountry: {},
      averageAge: 0,
      averagePriorityScore: 0
    }

    let totalAge = 0
    let totalPriorityScore = 0
    let candidatesWithAge = 0
    let candidatesWithScore = 0

    candidates.forEach(candidate => {
      // Count by stage
      const stage = candidate.stage || 'applied'
      metrics.byStage[stage] = (metrics.byStage[stage] || 0) + 1

      // Count by gender
      const gender = candidate.gender || 'Not specified'
      metrics.byGender[gender] = (metrics.byGender[gender] || 0) + 1

      // Count by education
      const education = candidate.education || 'Not specified'
      metrics.byEducation[education] = (metrics.byEducation[education] || 0) + 1

      // Count by country (from address)
      const country = candidate.nationality || 'Unknown'
      metrics.byCountry[country] = (metrics.byCountry[country] || 0) + 1

      // Age calculation
      if (candidate.age) {
        totalAge += candidate.age
        candidatesWithAge++
      }

      // Priority score calculation
      if (candidate.priority_score !== undefined) {
        totalPriorityScore += candidate.priority_score
        candidatesWithScore++
      }

      // Time-based metrics
      if (candidate.applied_at || candidate.created_at) {
        const dateToCheck = candidate.applied_at || candidate.created_at
        
        if (this.isRecent(dateToCheck)) {
          metrics.recent++
        }
        
        if (this.isThisWeekNepali(dateToCheck)) {
          metrics.thisWeek++
        }
        
        if (this.isTodayNepali(dateToCheck)) {
          metrics.today++
        }
      }
    })

    // Calculate averages
    metrics.averageAge = candidatesWithAge > 0 ? 
      Math.round(totalAge / candidatesWithAge) : 0
    metrics.averagePriorityScore = candidatesWithScore > 0 ? 
      Math.round((totalPriorityScore / candidatesWithScore) * 10) / 10 : 0

    return metrics
  }

  /**
   * Get comprehensive dashboard metrics
   * @param {Object} data - Object containing jobs, interviews, applications, candidates
   * @returns {Promise<Object>} Complete dashboard metrics
   */
  async getDashboardMetrics(data = {}) {
    await delay(300)
    
    const {
      jobs = [],
      interviews = [],
      applications = [],
      candidates = []
    } = data

    // Get individual metrics
    const [jobMetrics, interviewMetrics, applicationMetrics, candidateMetrics] = await Promise.all([
      this.getJobMetrics(jobs),
      this.getInterviewMetrics(interviews),
      this.getApplicationMetrics(applications),
      this.getCandidateMetrics(candidates)
    ])

    // Calculate summary metrics
    const summary = {
      totalJobs: jobMetrics.total,
      totalCandidates: candidateMetrics.total,
      totalApplications: applicationMetrics.total,
      totalInterviews: interviewMetrics.total,
      
      // Key performance indicators
      recentJobs: jobMetrics.recent,
      pendingInterviews: interviewMetrics.pendingThisWeek,
      shortlistedCandidates: applicationMetrics.shortlisted,
      selectedCandidates: applicationMetrics.selected,
      
      // Today's activity
      jobsCreatedToday: jobMetrics.today,
      interviewsCompletedToday: interviewMetrics.completedToday,
      candidatesAppliedToday: candidateMetrics.today,
      
      // This week's activity (Nepali week)
      jobsThisWeek: jobMetrics.thisWeek,
      candidatesThisWeek: candidateMetrics.thisWeek,
      
      // Conversion rates
      conversionRates: applicationMetrics.conversionRates,
      
      // Current Nepal time info
      currentNepaliTime: this.getNepaliTime(),
      nepaliWeek: this.getCurrentNepaliWeek(),
      todayNepali: this.getTodayNepali()
    }

    return {
      summary,
      jobs: jobMetrics,
      interviews: interviewMetrics,
      applications: applicationMetrics,
      candidates: candidateMetrics,
      timestamp: new Date().toISOString(),
      timezone: NEPAL_TIMEZONE
    }
  }

  /**
   * Get time-based activity metrics
   * @param {Array} items - Array of items with timestamps
   * @param {string} dateField - Field name containing the date
   * @returns {Promise<Object>} Time-based metrics
   */
  async getTimeBasedMetrics(items = [], dateField = 'created_at') {
    await delay()
    
    const metrics = {
      today: 0,
      thisWeek: 0,
      recent: 0,
      byDay: {},
      byWeek: {},
      byMonth: {}
    }

    items.forEach(item => {
      const date = item[dateField]
      if (!date) return

      const nepaliDate = this.toNepaliTime(parseISO(date))
      
      // Time-based counting
      if (this.isTodayNepali(date)) metrics.today++
      if (this.isThisWeekNepali(date)) metrics.thisWeek++
      if (this.isRecent(date)) metrics.recent++

      // Group by day
      const dayKey = format(nepaliDate, 'yyyy-MM-dd')
      metrics.byDay[dayKey] = (metrics.byDay[dayKey] || 0) + 1

      // Group by week
      const weekKey = format(startOfWeek(nepaliDate, { weekStartsOn: NEPALI_WEEK_START }), 'yyyy-MM-dd')
      metrics.byWeek[weekKey] = (metrics.byWeek[weekKey] || 0) + 1

      // Group by month
      const monthKey = format(nepaliDate, 'yyyy-MM')
      metrics.byMonth[monthKey] = (metrics.byMonth[monthKey] || 0) + 1
    })

    return metrics
  }

  /**
   * Get Nepali date information
   * @param {Date} date - Date to convert (defaults to current Nepal time)
   * @returns {Object} Nepali date information
   */
  getNepaliDateInfo(date = null) {
    const targetDate = date || this.getNepaliTime()
    const nepaliDate = new NepaliDate(targetDate)
    
    return {
      english: {
        date: targetDate,
        formatted: format(targetDate, 'yyyy-MM-dd'),
        display: format(targetDate, 'MMMM dd, yyyy'),
        time: format(targetDate, 'HH:mm:ss')
      },
      nepali: {
        year: nepaliDate.getYear(),
        month: nepaliDate.getMonth(),
        date: nepaliDate.getDate(),
        formatted: nepaliDate.format('YYYY-MM-DD'),
        display: nepaliDate.format('MMMM DD, YYYY')
      },
      timezone: NEPAL_TIMEZONE
    }
  }
}

// Create and export singleton instance
const metricsService = new MetricsService()
export default metricsService

// Named exports for convenience
export const {
  getNepaliTime,
  getCurrentNepaliWeek,
  getTodayNepali,
  isRecent,
  isThisWeekNepali,
  isTodayNepali,
  getJobMetrics,
  getInterviewMetrics,
  getApplicationMetrics,
  getCandidateMetrics,
  getDashboardMetrics,
  getTimeBasedMetrics,
  getNepaliDateInfo
} = metricsService