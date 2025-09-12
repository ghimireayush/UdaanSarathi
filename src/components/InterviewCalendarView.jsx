import React, { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  X
} from 'lucide-react'
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMinutes,
  isPast
} from 'date-fns'

const InterviewCalendarView = ({ interviews, selectedDate, timeRange, onDateChange }) => {
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  const navigateDate = (direction) => {
    if (timeRange === 'day') {
      onDateChange(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1))
    } else {
      onDateChange(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1))
    }
  }

  const getDateRange = () => {
    if (timeRange === 'day') {
      return [selectedDate]
    } else {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate),
        end: endOfWeek(selectedDate)
      })
    }
  }

  const getInterviewsForDate = (date) => {
    return interviews.filter(interview => 
      isSameDay(parseISO(interview.scheduled_at), date)
    ).sort((a, b) => 
      new Date(a.scheduled_at) - new Date(b.scheduled_at)
    )
  }

  const getStatusColor = (interview) => {
    const interviewEnd = addMinutes(parseISO(interview.scheduled_at), interview.duration + 30) // 30 min grace
    const isUnattended = isPast(interviewEnd) && interview.status === 'scheduled'

    if (isUnattended) return 'bg-red-100 border-red-300 text-red-800'
    
    switch (interview.status) {
      case 'scheduled':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'completed':
        if (interview.result === 'pass') return 'bg-green-100 border-green-300 text-green-800'
        if (interview.result === 'fail') return 'bg-red-100 border-red-300 text-red-800'
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 border-gray-300 text-gray-800'
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800'
    }
  }

  const getLocationIcon = (location) => {
    if (location?.toLowerCase().includes('video') || location?.toLowerCase().includes('zoom') || location?.toLowerCase().includes('teams')) {
      return <Video className="w-4 h-4" />
    }
    if (location?.toLowerCase().includes('phone') || location?.toLowerCase().includes('call')) {
      return <Phone className="w-4 h-4" />
    }
    return <MapPin className="w-4 h-4" />
  }

  const getStatusIcon = (interview) => {
    const interviewEnd = addMinutes(parseISO(interview.scheduled_at), interview.duration + 30)
    const isUnattended = isPast(interviewEnd) && interview.status === 'scheduled'

    if (isUnattended) return <AlertCircle className="w-4 h-4" />
    
    switch (interview.status) {
      case 'completed':
        if (interview.result === 'pass') return <CheckCircle className="w-4 h-4" />
        if (interview.result === 'fail') return <XCircle className="w-4 h-4" />
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const dateRange = getDateRange()

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-900">
            {timeRange === 'day' 
              ? format(selectedDate, 'EEEE, MMMM dd, yyyy')
              : `${format(startOfWeek(selectedDate), 'MMM dd')} - ${format(endOfWeek(selectedDate), 'MMM dd, yyyy')}`
            }
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => onDateChange(new Date())}
          className="btn-secondary text-sm"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`grid gap-4 ${timeRange === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
        {dateRange.map(date => {
          const dayInterviews = getInterviewsForDate(date)
          const isToday = isSameDay(date, new Date())
          
          return (
            <div
              key={date.toISOString()}
              className={`border rounded-lg p-4 min-h-[200px] ${
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {format(date, timeRange === 'day' ? 'EEEE' : 'EEE')}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                    {format(date, 'dd')}
                  </div>
                </div>
                {dayInterviews.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {dayInterviews.length}
                  </span>
                )}
              </div>

              {/* Interviews for the day */}
              <div className="space-y-2">
                {dayInterviews.length > 0 ? (
                  dayInterviews.map(interview => (
                    <div
                      key={interview.id}
                      className={`border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(interview)}`}
                      onClick={() => {
                        setSelectedInterview(interview)
                        setShowDetails(true)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(interview)}
                          <span className="text-sm font-medium">
                            {format(parseISO(interview.scheduled_at), 'HH:mm')}
                          </span>
                        </div>
                        <span className="text-xs">
                          {interview.duration || 60}min
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium mb-1">
                        {interview.candidate_name || 'Unknown Candidate'}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600 mb-1">
                        <User className="w-3 h-3 mr-1" />
                        {interview.interviewer || 'TBD'}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-600">
                        {getLocationIcon(interview.location)}
                        <span className="ml-1 truncate">{interview.location || 'TBD'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No interviews</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Interview Details Modal */}
      {showDetails && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Interview Details</h2>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setSelectedInterview(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Interview Status */}
              <div className={`rounded-lg p-4 ${getStatusColor(selectedInterview)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedInterview)}
                    <span className="font-medium">
                      {selectedInterview.status === 'scheduled' && isPast(addMinutes(parseISO(selectedInterview.scheduled_at), selectedInterview.duration + 30))
                        ? 'Unattended'
                        : selectedInterview.status.charAt(0).toUpperCase() + selectedInterview.status.slice(1)
                      }
                    </span>
                  </div>
                  {selectedInterview.result && (
                    <span className="text-sm">
                      Result: {selectedInterview.result.charAt(0).toUpperCase() + selectedInterview.result.slice(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Candidate</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{selectedInterview.candidate_name || 'Unknown'}</span>
                    </div>
                    {selectedInterview.candidate_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedInterview.candidate_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{format(parseISO(selectedInterview.scheduled_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(parseISO(selectedInterview.scheduled_at), 'HH:mm')} 
                        ({selectedInterview.duration || 60} minutes)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getLocationIcon(selectedInterview.location)}
                      <span>{selectedInterview.location || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interviewer */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Interviewer</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedInterview.interviewer || 'To be assigned'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInterview.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Notes
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedInterview.notes}</p>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedInterview.rejection_reason && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Rejection Reason</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{selectedInterview.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Scheduled: {format(parseISO(selectedInterview.created_at || selectedInterview.scheduled_at), 'MMM dd, yyyy HH:mm')}</div>
                  {selectedInterview.updated_at && (
                    <div>Last updated: {format(parseISO(selectedInterview.updated_at), 'MMM dd, yyyy HH:mm')}</div>
                  )}
                  {selectedInterview.completed_at && (
                    <div>Completed: {format(parseISO(selectedInterview.completed_at), 'MMM dd, yyyy HH:mm')}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDetails(false)
                    setSelectedInterview(null)
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Completed/Passed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Failed/Unattended</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Completed (No Result)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewCalendarView