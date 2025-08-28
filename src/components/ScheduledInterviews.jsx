import { useState, useEffect } from 'react'
import { 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Check,
  X,
  RotateCcw,
  Send,
  Phone,
  Video,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { interviewService, candidateService, jobService, constantsService } from '../services/index.js'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

const ScheduledInterviews = ({ candidates, jobId }) => {
  const [filter, setFilter] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [notes, setNotes] = useState('')
  const [actionType, setActionType] = useState('')

  const updateInterviewMutation = useInterviews.update()

  // Filter candidates based on selected filter
  const filteredCandidates = candidates.filter(candidate => {
    if (!candidate.interview) return false
    
    const interviewDate = new Date(candidate.interview.scheduled_at)
    
    switch (filter) {
      case 'today':
        return isToday(interviewDate)
      case 'tomorrow':
        return isTomorrow(interviewDate)
      case 'unattended':
        return candidate.interview.status === INTERVIEW_STATUS.NO_SHOW || 
               (isPast(interviewDate) && candidate.interview.status === INTERVIEW_STATUS.SCHEDULED)
      case 'all':
      default:
        return true
    }
  })

  const handleAction = async (candidate, action, result = null) => {
    try {
      let updateData = {
        notes: notes,
        updated_at: new Date()
      }

      switch (action) {
        case 'send_reminder':
          // In a real app, this would trigger an SMS/email
          updateData.reminder_sent = true
          break
        case 'mark_interviewed':
          updateData.status = INTERVIEW_STATUS.COMPLETED
          break
        case 'mark_pass':
          updateData.status = INTERVIEW_STATUS.COMPLETED
          updateData.result = 'pass'
          break
        case 'mark_fail':
          updateData.status = INTERVIEW_STATUS.COMPLETED
          updateData.result = 'fail'
          break
        case 'reject':
          updateData.status = INTERVIEW_STATUS.CANCELLED
          updateData.result = 'rejected'
          updateData.rejection_reason = result
          break
        case 'reschedule':
          updateData.status = INTERVIEW_STATUS.SCHEDULED
          updateData.scheduled_at = result // result would be the new date
          break
      }

      await updateInterviewMutation.mutateAsync({
        interviewId: candidate.interview.id,
        updateData
      })

      setSelectedCandidate(null)
      setNotes('')
      setActionType('')
    } catch (error) {
      console.error('Failed to update interview:', error)
    }
  }

  const getStatusBadge = (interview) => {
    const interviewDate = new Date(interview.scheduled_at)
    const isUnattended = isPast(interviewDate) && interview.status === INTERVIEW_STATUS.SCHEDULED

    if (isUnattended) {
      return <span className="chip chip-red">Unattended</span>
    }

    switch (interview.status) {
      case INTERVIEW_STATUS.SCHEDULED:
        return <span className="chip chip-blue">Scheduled</span>
      case INTERVIEW_STATUS.COMPLETED:
        if (interview.result === 'pass') {
          return <span className="chip chip-green">Passed</span>
        } else if (interview.result === 'fail') {
          return <span className="chip chip-red">Failed</span>
        }
        return <span className="chip chip-yellow">Completed</span>
      case INTERVIEW_STATUS.CANCELLED:
        return <span className="chip chip-red">Cancelled</span>
      default:
        return <span className="chip chip-blue">Scheduled</span>
    }
  }

  const getActionButtons = (candidate) => {
    const interview = candidate.interview
    const interviewDate = new Date(interview.scheduled_at)
    const isUpcoming = isToday(interviewDate) || isTomorrow(interviewDate)
    const isUnattended = isPast(interviewDate) && interview.status === INTERVIEW_STATUS.SCHEDULED

    if (interview.status === INTERVIEW_STATUS.COMPLETED) {
      return (
        <div className="text-sm text-gray-600">
          Interview completed - {interview.result || 'No result recorded'}
        </div>
      )
    }

    if (isUpcoming && interview.status === INTERVIEW_STATUS.SCHEDULED) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction(candidate, 'send_reminder')}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            <Send className="w-3 h-3 mr-1 inline" />
            Send Reminder
          </button>
          <button
            onClick={() => {
              setSelectedCandidate(candidate)
              setActionType('take_notes')
            }}
            className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            <MessageSquare className="w-3 h-3 mr-1 inline" />
            Take Notes
          </button>
          <button
            onClick={() => handleAction(candidate, 'mark_interviewed')}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <Check className="w-3 h-3 mr-1 inline" />
            Mark Interviewed
          </button>
          <button
            onClick={() => handleAction(candidate, 'mark_pass')}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Pass
          </button>
          <button
            onClick={() => handleAction(candidate, 'mark_fail')}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Fail
          </button>
          <button
            onClick={() => {
              setSelectedCandidate(candidate)
              setActionType('reject')
            }}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <X className="w-3 h-3 mr-1 inline" />
            Reject
          </button>
        </div>
      )
    }

    if (isUnattended) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction(candidate, 'mark_pass')}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Mark Pass
          </button>
          <button
            onClick={() => handleAction(candidate, 'mark_fail')}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Mark Fail
          </button>
          <button
            onClick={() => {
              setSelectedCandidate(candidate)
              setActionType('reject')
            }}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <X className="w-3 h-3 mr-1 inline" />
            Reject
          </button>
          <button
            onClick={() => {
              setSelectedCandidate(candidate)
              setActionType('reschedule')
            }}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1 inline" />
            Reschedule
          </button>
        </div>
      )
    }

    return (
      <div className="text-sm text-gray-600">
        Scheduled for {format(interviewDate, 'MMM dd, yyyy')}
      </div>
    )
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All', count: candidates.length },
          { id: 'today', label: 'Today', count: candidates.filter(c => c.interview && isToday(new Date(c.interview.scheduled_at))).length },
          { id: 'tomorrow', label: 'Tomorrow', count: candidates.filter(c => c.interview && isTomorrow(new Date(c.interview.scheduled_at))).length },
          { id: 'unattended', label: 'Un-attended', count: candidates.filter(c => c.interview && (c.interview.status === INTERVIEW_STATUS.NO_SHOW || (isPast(new Date(c.interview.scheduled_at)) && c.interview.status === INTERVIEW_STATUS.SCHEDULED))).length }
        ].map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id)}
            className={`chip cursor-pointer transition-colors ${
              filter === filterOption.id ? 'chip-blue' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterOption.label}
            {filterOption.count > 0 && (
              <span className="ml-1 bg-white bg-opacity-30 rounded-full px-2 py-0.5 text-xs">
                {filterOption.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map(candidate => {
            const interview = candidate.interview
            const interviewDate = new Date(interview.scheduled_at)
            
            return (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600">
                        {candidate.name.charAt(0)}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{candidate.name}</h3>
                        {getStatusBadge(interview)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{format(interviewDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{format(interviewDate, 'h:mm a')} ({interview.duration} min)</span>
                        </div>
                        <div className="flex items-center">
                          {getLocationIcon(interview.type)}
                          <span className="ml-2">{interview.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        <span>Interviewer: {interview.interviewer}</span>
                      </div>
                      
                      {interview.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                          <p className="text-sm text-yellow-800">{interview.notes}</p>
                        </div>
                      )}
                      
                      {getActionButtons(candidate)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled interviews</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No interviews have been scheduled yet.' 
                : `No interviews match the "${filter}" filter.`}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedCandidate.name}
              </h3>
              <button
                onClick={() => {
                  setSelectedCandidate(null)
                  setActionType('')
                  setNotes('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {actionType === 'take_notes' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      placeholder="Record notes about the interview..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedCandidate(null)
                        setActionType('')
                        setNotes('')
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedCandidate, 'mark_interviewed')}
                      className="btn-primary"
                    >
                      Save Notes
                    </button>
                  </div>
                </>
              )}
              
              {actionType === 'reject' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="Reason for rejection..."
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedCandidate(null)
                        setActionType('')
                        setNotes('')
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedCandidate, 'reject', notes)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </>
              )}
              
              {actionType === 'reschedule' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <input
                        type="time"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedCandidate(null)
                        setActionType('')
                        setNotes('')
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(selectedCandidate, 'reschedule', new Date())}
                      className="btn-primary"
                    >
                      Reschedule
                    </button>
                  </div>
                </>
              )}
              
              {!actionType && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
                    <p><strong>Experience:</strong> {selectedCandidate.experience}</p>
                    <p><strong>Skills:</strong> {selectedCandidate.skills.join(', ')}</p>
                  </div>
                  
                  {selectedCandidate.interview && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p><strong>Interview:</strong> {format(new Date(selectedCandidate.interview.scheduled_at), 'MMM dd, yyyy h:mm a')}</p>
                      <p><strong>Duration:</strong> {selectedCandidate.interview.duration} minutes</p>
                      <p><strong>Location:</strong> {selectedCandidate.interview.location}</p>
                      <p><strong>Interviewer:</strong> {selectedCandidate.interview.interviewer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews