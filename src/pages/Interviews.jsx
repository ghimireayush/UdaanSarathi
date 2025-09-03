import React, { useState, useEffect } from 'react'
import { Calendar, List, Clock, Users, Zap, Plus, Filter, Search, AlertTriangle, CheckCircle, Bot } from 'lucide-react'
import ScheduledInterviews from '../components/ScheduledInterviews'
import EnhancedInterviewScheduling from '../components/EnhancedInterviewScheduling'
import InterviewCalendarView from '../components/InterviewCalendarView'
import AISchedulingAssistant from '../components/AISchedulingAssistant'
import { candidateService, jobService, interviewService } from '../services/index.js'
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, addMinutes, isPast } from 'date-fns'

const Interviews = () => {
  const [activeTab, setActiveTab] = useState('scheduled') // 'scheduled', 'schedule', 'calendar', 'ai-assistant'
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar'
  const [timeRange, setTimeRange] = useState('week') // 'day', 'week'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedJob, setSelectedJob] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [batchScheduleMode, setBatchScheduleMode] = useState(false)
  const [selectedCandidatesForBatch, setSelectedCandidatesForBatch] = useState(new Set())
  const [batchScheduleData, setBatchScheduleData] = useState([])
  const [gracePeriod] = useState(30) // 30 minutes grace period for unattended flagging

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [jobsData, interviewsData] = await Promise.all([
        jobService.getJobs({ status: 'published' }),
        interviewService.getAllInterviews()
      ])
      
      setJobs(jobsData)
      setInterviews(interviewsData)
      
      // Load candidates for the selected job if any
      if (selectedJob) {
        const candidatesData = await candidateService.getCandidatesByJobId(selectedJob)
        setCandidates(candidatesData)
      }
    } catch (error) {
      console.error('Failed to load interviews data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJobSelect = async (jobId) => {
    setSelectedJob(jobId)
    if (jobId) {
      try {
        const candidatesData = await candidateService.getCandidatesByJobId(jobId)
        setCandidates(candidatesData)
      } catch (error) {
        console.error('Failed to load candidates:', error)
      }
    } else {
      setCandidates([])
    }
  }

  const handleInterviewScheduled = () => {
    loadData() // Refresh data after scheduling
    setActiveTab('scheduled') // Switch to scheduled view
  }

  const getFilteredInterviews = () => {
    let filtered = interviews

    // Filter by job if selected
    if (selectedJob) {
      filtered = filtered.filter(interview => interview.job_id === selectedJob)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(interview => 
        interview.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.interviewer?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by date range
    const startDate = timeRange === 'day' 
      ? startOfDay(selectedDate)
      : startOfWeek(selectedDate)
    const endDate = timeRange === 'day'
      ? endOfDay(selectedDate)
      : endOfWeek(selectedDate)

    filtered = filtered.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      return interviewDate >= startDate && interviewDate <= endDate
    })

    return filtered
  }

  const getTabCounts = () => {
    const today = new Date()
    const todayInterviews = interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_at)
      return format(interviewDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    })

    // Check for unattended interviews (past scheduled time + grace period)
    const unattendedInterviews = interviews.filter(interview => {
      if (interview.status !== 'scheduled') return false
      const interviewEnd = addMinutes(new Date(interview.scheduled_at), (interview.duration || 60) + gracePeriod)
      return isPast(interviewEnd)
    })

    return {
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      today: todayInterviews.length,
      unattended: unattendedInterviews.length,
      completed: interviews.filter(i => i.status === 'completed').length
    }
  }

  const handleBatchSchedule = async (scheduleData) => {
    try {
      setIsLoading(true)
      const results = []
      
      for (const batch of scheduleData) {
        const candidatesToSchedule = Array.from(selectedCandidatesForBatch).slice(0, batch.candidateCount)
        
        for (let i = 0; i < candidatesToSchedule.length; i++) {
          const candidateId = candidatesToSchedule[i]
          const timeSlot = new Date(`${batch.date}T${batch.startTime}:00`)
          timeSlot.setMinutes(timeSlot.getMinutes() + (i * (batch.duration || 60)))
          
          const result = await interviewService.scheduleInterview({
            candidate_id: candidateId,
            job_id: selectedJob,
            scheduled_at: timeSlot.toISOString(),
            duration: batch.duration || 60,
            interviewer: batch.interviewer || '',
            location: batch.location || 'Office',
            notes: `Batch scheduled - ${batch.notes || ''}`,
            status: 'scheduled'
          })
          
          results.push(result)
        }
      }
      
      // Reset batch mode and reload data
      setBatchScheduleMode(false)
      setSelectedCandidatesForBatch(new Set())
      setBatchScheduleData([])
      await loadData()
      
      return results
    } catch (error) {
      console.error('Failed to batch schedule interviews:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const checkForDoubleBooking = (candidateId, proposedDateTime, duration) => {
    const proposedStart = new Date(proposedDateTime)
    const proposedEnd = addMinutes(proposedStart, duration)
    
    return interviews.some(interview => {
      if (interview.candidate_id !== candidateId || interview.status === 'cancelled') return false
      
      const existingStart = new Date(interview.scheduled_at)
      const existingEnd = addMinutes(existingStart, interview.duration || 60)
      
      // Check for time overlap
      return (proposedStart < existingEnd && proposedEnd > existingStart)
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const tabCounts = getTabCounts()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage interview schedules, track attendance, and capture outcomes
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* View Mode Toggle */}
          {activeTab === 'scheduled' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Calendar
              </button>
            </div>
          )}

          {/* Time Range Toggle */}
          {activeTab === 'scheduled' && viewMode === 'calendar' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Job Filter */}
          <div className="flex-1">
            <select
              value={selectedJob}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates or interviewers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Picker for Calendar View */}
          {activeTab === 'scheduled' && viewMode === 'calendar' && (
            <div>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Scheduled Interviews
              {tabCounts.scheduled > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {tabCounts.scheduled}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Schedule New
            </button>

            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ai-assistant'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="w-4 h-4 mr-2 inline" />
              AI Assistant
              <span className="ml-2 bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs">
                Phase 2
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'scheduled' && (
          <>
            {viewMode === 'list' ? (
              <ScheduledInterviews 
                candidates={candidates}
                jobId={selectedJob}
                interviews={getFilteredInterviews()}
              />
            ) : (
              <InterviewCalendarView
                interviews={getFilteredInterviews()}
                selectedDate={selectedDate}
                timeRange={timeRange}
                onDateChange={setSelectedDate}
              />
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {!selectedJob ? (
              <div className="card p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job to Schedule Interviews</h3>
                <p className="text-gray-600 mb-4">
                  Choose a job from the filter above to view shortlisted candidates and schedule interviews.
                </p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Shortlisted Candidates</h3>
                <p className="text-gray-600">
                  No candidates have been shortlisted for this job yet. 
                  Visit the Applications page to shortlist candidates first.
                </p>
              </div>
            ) : (
              <EnhancedInterviewScheduling
                candidates={candidates}
                jobId={selectedJob}
                onScheduled={handleInterviewScheduled}
                onBatchSchedule={handleBatchSchedule}
                checkForDoubleBooking={checkForDoubleBooking}
              />
            )}
          </div>
        )}

        {activeTab === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-purple-600" />
                    AI Scheduling Assistant
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Intelligent scheduling suggestions for optimal interview coverage
                  </p>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Phase 2 Feature
                </span>
              </div>
              
              {selectedJob && candidates.length > 0 ? (
                <AISchedulingAssistant
                  existingMeetings={interviews}
                  participants={candidates.map(c => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    availability: [] // Would be populated from candidate availability data
                  }))}
                  onScheduleSelect={(slot) => {
                    // Handle AI-suggested schedule selection
                    console.log('AI suggested slot:', slot)
                  }}
                  constraints={{
                    duration: 60,
                    priority: 'high',
                    meetingType: 'interview',
                    dateRange: {
                      start: new Date(),
                      end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
                    }
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">AI Assistant Ready</h4>
                  <p className="text-gray-600">
                    Select a job with shortlisted candidates to get AI-powered scheduling suggestions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Today's Interviews</div>
              <div className="text-2xl font-bold text-gray-900">{tabCounts.today}</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Scheduled</div>
              <div className="text-2xl font-bold text-gray-900">{tabCounts.scheduled}</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Unattended</div>
              <div className="text-2xl font-bold text-gray-900">{tabCounts.unattended}</div>
              <div className="text-xs text-red-600 mt-1">Auto-flagged after {gracePeriod}min grace</div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-gray-900">{tabCounts.completed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interviews