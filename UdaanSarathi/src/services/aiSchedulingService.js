// AI-Assisted Scheduling Service
import { getCurrentNepalTime, formatInNepalTz, nepaliToEnglish } from '../utils/nepaliDate'

/**
 * AI-powered scheduling optimization service
 */
export class AISchedulingService {
  constructor() {
    this.preferences = {
      workingHours: { start: '09:00', end: '17:00' },
      timeZone: 'Asia/Kathmandu',
      bufferTime: 15, // minutes between meetings
      maxMeetingsPerDay: 8,
      preferredDuration: 60, // minutes
      breakTime: { start: '12:00', end: '13:00' }
    }
  }

  /**
   * Analyze scheduling patterns and suggest optimal times
   * @param {Array} existingMeetings - Current scheduled meetings
   * @param {Array} participants - Meeting participants with preferences
   * @param {Object} constraints - Scheduling constraints
   * @returns {Object} AI scheduling recommendations
   */
  async generateSchedulingSuggestions(existingMeetings = [], participants = [], constraints = {}) {
    const {
      duration = 60,
      dateRange = { start: new Date(), end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      priority = 'medium',
      meetingType = 'interview',
      requiredAttendees = [],
      optionalAttendees = []
    } = constraints

    // Analyze existing patterns
    const patterns = this.analyzeSchedulingPatterns(existingMeetings)
    
    // Generate time slots
    const availableSlots = this.generateAvailableSlots(
      existingMeetings, 
      dateRange, 
      duration,
      participants
    )

    // Score and rank slots using AI logic
    const rankedSlots = this.rankTimeSlots(availableSlots, patterns, participants, constraints)

    // Generate recommendations
    const recommendations = this.generateRecommendations(rankedSlots, patterns, constraints)

    return {
      suggestions: rankedSlots.slice(0, 10), // Top 10 suggestions
      patterns,
      recommendations,
      analytics: {
        totalSlotsAnalyzed: availableSlots.length,
        averageScore: rankedSlots.reduce((sum, slot) => sum + slot.score, 0) / rankedSlots.length,
        bestTimeOfDay: this.findBestTimeOfDay(rankedSlots),
        bestDayOfWeek: this.findBestDayOfWeek(rankedSlots)
      }
    }
  }

  /**
   * Analyze historical scheduling patterns
   * @param {Array} meetings - Historical meetings data
   * @returns {Object} Pattern analysis
   */
  analyzeSchedulingPatterns(meetings) {
    const patterns = {
      timeOfDay: {},
      dayOfWeek: {},
      duration: {},
      successRate: {},
      participantPreferences: {}
    }

    meetings.forEach(meeting => {
      const date = new Date(meeting.scheduledAt)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      const duration = meeting.duration || 60

      // Time of day patterns
      const timeSlot = this.getTimeSlot(hour)
      patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1

      // Day of week patterns
      patterns.dayOfWeek[dayOfWeek] = (patterns.dayOfWeek[dayOfWeek] || 0) + 1

      // Duration patterns
      patterns.duration[duration] = (patterns.duration[duration] || 0) + 1

      // Success rate tracking
      if (meeting.status) {
        if (!patterns.successRate[timeSlot]) {
          patterns.successRate[timeSlot] = { total: 0, successful: 0 }
        }
        patterns.successRate[timeSlot].total++
        if (meeting.status === 'completed') {
          patterns.successRate[timeSlot].successful++
        }
      }
    })

    // Calculate success rates
    Object.keys(patterns.successRate).forEach(timeSlot => {
      const data = patterns.successRate[timeSlot]
      data.rate = data.total > 0 ? (data.successful / data.total) * 100 : 0
    })

    return patterns
  }

  /**
   * Generate available time slots
   * @param {Array} existingMeetings - Current meetings
   * @param {Object} dateRange - Date range to search
   * @param {number} duration - Meeting duration in minutes
   * @param {Array} participants - Meeting participants
   * @returns {Array} Available time slots
   */
  generateAvailableSlots(existingMeetings, dateRange, duration, participants) {
    const slots = []
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)

    // Generate slots for each day in range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip weekends for business meetings
      if (date.getDay() === 0 || date.getDay() === 6) continue

      const daySlots = this.generateDaySlots(date, duration, existingMeetings, participants)
      slots.push(...daySlots)
    }

    return slots
  }

  /**
   * Generate time slots for a specific day
   * @param {Date} date - Target date
   * @param {number} duration - Meeting duration
   * @param {Array} existingMeetings - Existing meetings
   * @param {Array} participants - Participants
   * @returns {Array} Day's available slots
   */
  generateDaySlots(date, duration, existingMeetings, participants) {
    const slots = []
    const workStart = this.parseTime(this.preferences.workingHours.start)
    const workEnd = this.parseTime(this.preferences.workingHours.end)
    const breakStart = this.parseTime(this.preferences.breakTime.start)
    const breakEnd = this.parseTime(this.preferences.breakTime.end)

    // Generate 30-minute intervals
    for (let hour = workStart.hour; hour < workEnd.hour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(date)
        slotStart.setHours(hour, minute, 0, 0)
        
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + duration)

        // Skip if slot extends beyond working hours
        if (slotEnd.getHours() > workEnd.hour || 
           (slotEnd.getHours() === workEnd.hour && slotEnd.getMinutes() > workEnd.minute)) {
          continue
        }

        // Skip lunch break
        if (this.isInBreakTime(slotStart, slotEnd, breakStart, breakEnd)) {
          continue
        }

        // Check for conflicts
        if (!this.hasConflict(slotStart, slotEnd, existingMeetings)) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            duration,
            date: formatInNepalTz(slotStart, 'yyyy-MM-dd'),
            time: formatInNepalTz(slotStart, 'HH:mm'),
            dayOfWeek: slotStart.getDay(),
            timeSlot: this.getTimeSlot(slotStart.getHours()),
            availability: this.checkParticipantAvailability(slotStart, slotEnd, participants)
          })
        }
      }
    }

    return slots
  }

  /**
   * Rank time slots using AI scoring
   * @param {Array} slots - Available time slots
   * @param {Object} patterns - Historical patterns
   * @param {Array} participants - Meeting participants
   * @param {Object} constraints - Scheduling constraints
   * @returns {Array} Ranked time slots
   */
  rankTimeSlots(slots, patterns, participants, constraints) {
    return slots.map(slot => {
      let score = 0
      const factors = {}

      // Historical success rate (30% weight)
      const successRate = patterns.successRate[slot.timeSlot]?.rate || 50
      factors.historicalSuccess = successRate * 0.3
      score += factors.historicalSuccess

      // Time of day preference (25% weight)
      const timePreference = this.getTimePreferenceScore(slot.timeSlot)
      factors.timePreference = timePreference * 0.25
      score += factors.timePreference

      // Participant availability (20% weight)
      const availabilityScore = this.calculateAvailabilityScore(slot.availability)
      factors.availability = availabilityScore * 0.2
      score += factors.availability

      // Day of week preference (15% weight)
      const dayPreference = this.getDayPreferenceScore(slot.dayOfWeek, patterns)
      factors.dayPreference = dayPreference * 0.15
      score += factors.dayPreference

      // Buffer time optimization (10% weight)
      const bufferScore = this.calculateBufferScore(slot, slots)
      factors.bufferOptimization = bufferScore * 0.1
      score += factors.bufferOptimization

      return {
        ...slot,
        score: Math.round(score * 100) / 100,
        factors,
        recommendation: this.getSlotRecommendation(score, factors)
      }
    }).sort((a, b) => b.score - a.score)
  }

  /**
   * Generate scheduling recommendations
   * @param {Array} rankedSlots - Ranked time slots
   * @param {Object} patterns - Historical patterns
   * @param {Object} constraints - Constraints
   * @returns {Array} Recommendations
   */
  generateRecommendations(rankedSlots, patterns, constraints) {
    const recommendations = []

    // Best time recommendation
    if (rankedSlots.length > 0) {
      const bestSlot = rankedSlots[0]
      recommendations.push({
        type: 'optimal',
        title: 'Optimal Time Slot',
        description: `${formatInNepalTz(bestSlot.start, 'EEEE, MMMM dd')} at ${bestSlot.time}`,
        reason: `Score: ${bestSlot.score}/100 - High success rate and good availability`,
        slot: bestSlot,
        priority: 1
      })
    }

    // Alternative times
    const alternatives = rankedSlots.slice(1, 4)
    if (alternatives.length > 0) {
      recommendations.push({
        type: 'alternatives',
        title: 'Alternative Time Slots',
        description: `${alternatives.length} other good options available`,
        slots: alternatives,
        priority: 2
      })
    }

    // Pattern-based insights
    const bestTimeOfDay = this.findBestTimeOfDay(rankedSlots)
    if (bestTimeOfDay) {
      recommendations.push({
        type: 'insight',
        title: 'Best Time of Day',
        description: `${bestTimeOfDay} typically has the highest success rate`,
        priority: 3
      })
    }

    // Availability warnings
    const lowAvailabilitySlots = rankedSlots.filter(slot => 
      this.calculateAvailabilityScore(slot.availability) < 70
    )
    if (lowAvailabilitySlots.length > rankedSlots.length * 0.5) {
      recommendations.push({
        type: 'warning',
        title: 'Limited Availability',
        description: 'Many participants have scheduling conflicts. Consider extending the date range.',
        priority: 4
      })
    }

    return recommendations
  }

  /**
   * Auto-schedule meetings based on AI recommendations
   * @param {Array} meetings - Meetings to schedule
   * @param {Object} constraints - Global constraints
   * @returns {Object} Scheduling results
   */
  async autoScheduleMeetings(meetings, constraints = {}) {
    const results = {
      scheduled: [],
      conflicts: [],
      suggestions: []
    }

    const existingMeetings = constraints.existingMeetings || []
    
    for (const meeting of meetings) {
      try {
        const suggestions = await this.generateSchedulingSuggestions(
          existingMeetings,
          meeting.participants || [],
          { ...constraints, ...meeting.constraints }
        )

        if (suggestions.suggestions.length > 0) {
          const bestSlot = suggestions.suggestions[0]
          
          // Auto-schedule if score is high enough
          if (bestSlot.score >= 80) {
            results.scheduled.push({
              ...meeting,
              scheduledAt: bestSlot.start,
              endTime: bestSlot.end,
              score: bestSlot.score,
              autoScheduled: true
            })
            
            // Add to existing meetings for next iteration
            existingMeetings.push({
              scheduledAt: bestSlot.start,
              endTime: bestSlot.end,
              duration: bestSlot.duration
            })
          } else {
            results.suggestions.push({
              meeting,
              suggestions: suggestions.suggestions.slice(0, 3)
            })
          }
        } else {
          results.conflicts.push({
            meeting,
            reason: 'No available time slots found'
          })
        }
      } catch (error) {
        results.conflicts.push({
          meeting,
          reason: error.message
        })
      }
    }

    return results
  }

  // Helper methods
  getTimeSlot(hour) {
    if (hour < 10) return 'early-morning'
    if (hour < 12) return 'morning'
    if (hour < 14) return 'early-afternoon'
    if (hour < 16) return 'afternoon'
    return 'late-afternoon'
  }

  parseTime(timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number)
    return { hour, minute }
  }

  isInBreakTime(slotStart, slotEnd, breakStart, breakEnd) {
    const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes()
    const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes()
    const breakStartMinutes = breakStart.hour * 60 + breakStart.minute
    const breakEndMinutes = breakEnd.hour * 60 + breakEnd.minute

    return (slotStartMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes)
  }

  hasConflict(slotStart, slotEnd, existingMeetings) {
    return existingMeetings.some(meeting => {
      const meetingStart = new Date(meeting.scheduledAt)
      const meetingEnd = new Date(meeting.endTime || meeting.scheduledAt)
      if (!meeting.duration && !meeting.endTime) {
        meetingEnd.setMinutes(meetingEnd.getMinutes() + 60) // Default 1 hour
      } else if (meeting.duration && !meeting.endTime) {
        meetingEnd.setMinutes(meetingEnd.getMinutes() + meeting.duration)
      }

      return (slotStart < meetingEnd && slotEnd > meetingStart)
    })
  }

  checkParticipantAvailability(slotStart, slotEnd, participants) {
    // Simplified availability check - in real implementation, 
    // this would check against participant calendars
    return participants.map(participant => ({
      id: participant.id,
      name: participant.name,
      available: Math.random() > 0.3, // 70% availability simulation
      conflicts: []
    }))
  }

  getTimePreferenceScore(timeSlot) {
    const preferences = {
      'early-morning': 60,
      'morning': 90,
      'early-afternoon': 85,
      'afternoon': 75,
      'late-afternoon': 65
    }
    return preferences[timeSlot] || 50
  }

  calculateAvailabilityScore(availability) {
    if (!availability || availability.length === 0) return 100
    
    const availableCount = availability.filter(p => p.available).length
    return (availableCount / availability.length) * 100
  }

  getDayPreferenceScore(dayOfWeek, patterns) {
    const dayCount = patterns.dayOfWeek[dayOfWeek] || 0
    const totalMeetings = Object.values(patterns.dayOfWeek).reduce((sum, count) => sum + count, 0)
    
    if (totalMeetings === 0) return 70 // Default score
    
    return (dayCount / totalMeetings) * 100
  }

  calculateBufferScore(slot, allSlots) {
    // Check if slot has adequate buffer time before and after
    const bufferBefore = allSlots.some(s => 
      Math.abs(new Date(s.end) - new Date(slot.start)) < this.preferences.bufferTime * 60 * 1000
    )
    const bufferAfter = allSlots.some(s => 
      Math.abs(new Date(slot.end) - new Date(s.start)) < this.preferences.bufferTime * 60 * 1000
    )

    if (!bufferBefore && !bufferAfter) return 100
    if (!bufferBefore || !bufferAfter) return 75
    return 50
  }

  getSlotRecommendation(score, factors) {
    if (score >= 90) return 'Excellent - Highly recommended'
    if (score >= 80) return 'Very Good - Strong candidate'
    if (score >= 70) return 'Good - Suitable option'
    if (score >= 60) return 'Fair - Consider alternatives'
    return 'Poor - Not recommended'
  }

  findBestTimeOfDay(rankedSlots) {
    const timeSlotScores = {}
    
    rankedSlots.forEach(slot => {
      if (!timeSlotScores[slot.timeSlot]) {
        timeSlotScores[slot.timeSlot] = { total: 0, count: 0 }
      }
      timeSlotScores[slot.timeSlot].total += slot.score
      timeSlotScores[slot.timeSlot].count++
    })

    let bestTimeSlot = null
    let bestAverage = 0

    Object.entries(timeSlotScores).forEach(([timeSlot, data]) => {
      const average = data.total / data.count
      if (average > bestAverage) {
        bestAverage = average
        bestTimeSlot = timeSlot
      }
    })

    const timeSlotNames = {
      'early-morning': 'Early Morning (8-10 AM)',
      'morning': 'Morning (10 AM-12 PM)',
      'early-afternoon': 'Early Afternoon (12-2 PM)',
      'afternoon': 'Afternoon (2-4 PM)',
      'late-afternoon': 'Late Afternoon (4-6 PM)'
    }

    return timeSlotNames[bestTimeSlot] || bestTimeSlot
  }

  findBestDayOfWeek(rankedSlots) {
    const dayScores = {}
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    rankedSlots.forEach(slot => {
      if (!dayScores[slot.dayOfWeek]) {
        dayScores[slot.dayOfWeek] = { total: 0, count: 0 }
      }
      dayScores[slot.dayOfWeek].total += slot.score
      dayScores[slot.dayOfWeek].count++
    })

    let bestDay = null
    let bestAverage = 0

    Object.entries(dayScores).forEach(([day, data]) => {
      const average = data.total / data.count
      if (average > bestAverage) {
        bestAverage = average
        bestDay = parseInt(day)
      }
    })

    return bestDay !== null ? dayNames[bestDay] : null
  }
}

export default new AISchedulingService()