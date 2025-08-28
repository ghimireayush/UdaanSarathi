import React, { useState, useEffect } from 'react'
import { 
  Calendar,
  List,
  Plus,
  Filter,
  Clock,
  User,
  MapPin,
  Video,
  Phone,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users
} from 'lucide-react'
import { interviewService, candidateService, jobService, constantsService } from '../services/index.js'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isToday, startOfDay, endOfDay } from 'date-fns'
import DateDisplay, { TimeDisplay, CompactDateDisplay } from '../components/DateDisplay.jsx'
import { formatInNepalTz, getCurrentNepalTime, isToday as isNepaliToday } from '../utils/nepaliDate.js'

// Define interview status constants
const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed', 
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
}

const Interviews = () => {
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'
  const [selectedDate, setSelectedDate] = useState(getCurrentNepalTime())
  const [currentWeek, setCurrentWeek] = useState(getCurrentNepalTime())
  const [filters, setFilters] = useState({
    status: '',
    interviewer: '',
    type: ''
  })
  const [showBatchSchedule, setShowBatchSchedule] = useState(false)
  
  // State for service layer data
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [interviewStatuses, setInterviewStatuses] = useState({})
  
  // Mock mutation objects for interview updates
  const updateInterviewMutation = {
    mutate: async ({ interviewId, updateData }) => {
      try {
        await interviewService.updateInterview(interviewId, updateData)
        await loadInterviews() // Reload data
      } catch (error) {
        console.error('Failed to update interview:', error)
        setError(error)
      }
    },
    isLoading: false
  }
  
  const batchScheduleMutation = {
    isLoading: false
  }
  
  // Load data on mount and when filters change
  useEffect(() => {
    loadInterviews()
    loadConstants()
  }, [filters])
  
  const loadConstants = async () => {
    try {
      const statuses = await constantsService.getInterviewStatuses()
      setInterviewStatuses(statuses)
    } catch (err) {
      console.error('Failed to load constants:', err)
    }
  }
  
  const loadInterviews = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await interviewService.getInterviews(filters)
      setInterviews(data)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleWeekChange = (direction) => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction * 7))
    setCurrentWeek(newWeek)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      [interviewStatuses.SCHEDULED]: { class: 'chip-blue', label: 'Scheduled' },
      [interviewStatuses.COMPLETED]: { class: 'chip-green', label: 'Completed' },
      [interviewStatuses.CANCELLED]: { class: 'chip-red', label: 'Cancelled' },
      [interviewStatuses.NO_SHOW]: { class: 'chip-red', label: 'No Show' }
    }
    const config = statusConfig[status] || statusConfig[interviewStatuses.SCHEDULED] || { class: 'chip-gray', label: status }
    return (
      <span className={`chip ${config.class} text-xs`}>
        {config.label}
      </span>
    )
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getInterviewsForDate = (date) => {
    return interviews.filter(interview => 
      isSameDay(new Date(interview.scheduled_at), date)
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="card p-6">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load interviews</h2>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-1 text-sm text-gray-600">
            Schedule and manage candidate interviews with integrated calendar
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowBatchSchedule(true)}
            className="btn-secondary flex items-center"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Batch Schedule
          </button>
          <button className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </button>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-3">
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value={interviewStatuses.SCHEDULED}>Scheduled</option>
            <option value={interviewStatuses.COMPLETED}>Completed</option>
            <option value={interviewStatuses.CANCELLED}>Cancelled</option>
          </select>
          
          <select 
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Types</option>
            <option value="in-person">In-person</option>
            <option value="video">Video</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Week of {format(startOfWeek(currentWeek), 'MMM dd, yyyy')}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleWeekChange(-1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentWeek(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => handleWeekChange(1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(startOfWeek(currentWeek), i)
              const dayInterviews = getInterviewsForDate(date)
              const isCurrentDay = isToday(date)
              
              return (
                <div
                  key={i}
                  className={`p-3 border rounded-lg min-h-[120px] ${
                    isCurrentDay ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentDay ? 'text-primary-700' : 'text-gray-900'
                  }`}>
                    {format(date, 'EEE dd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayInterviews.slice(0, 3).map(interview => (
                      <div key={interview.id} className="text-xs p-1 bg-blue-100 text-blue-800 rounded">
                        <div className="font-medium truncate">
                          {interview.candidate?.name || 'Unknown'}
                        </div>
                        <div className="text-blue-600">
                          {format(new Date(interview.scheduled_at), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayInterviews.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayInterviews.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Interview Schedule</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map(interview => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {interview.candidate?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {interview.candidate?.name || 'Unknown Candidate'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {interview.candidate?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {interview.job?.title || 'Unknown Job'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {interview.job?.company}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(interview.scheduled_at), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(interview.scheduled_at), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        {getTypeIcon(interview.type)}
                        <span className="ml-2 capitalize">{interview.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(interview.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {interview.status === interviewStatuses.SCHEDULED && (
                          <>
                            <button
                              onClick={() => updateInterviewMutation.mutate({
                                interviewId: interview.id,
                                updateData: { status: interviewStatuses.COMPLETED }
                              })}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateInterviewMutation.mutate({
                                interviewId: interview.id,
                                updateData: { status: interviewStatuses.CANCELLED }
                              })}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {interviews.length === 0 && (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
          <p className="text-gray-600 mb-4">
            Start scheduling interviews with candidates to see them here.
          </p>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Schedule First Interview
          </button>
        </div>
      )}
    </div>
  )
}

export default Interviews