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
  XCircle,
  FileText,
  Mail,
  GraduationCap,
  Briefcase,
  Home,
  Star,
  Download,
  Eye
} from 'lucide-react'
import { interviewService } from '../services/index.js'
import { format, isToday, isTomorrow, isPast, addMinutes, parseISO } from 'date-fns'

const ScheduledInterviews = ({ candidates, jobId, interviews: propInterviews }) => {
  const [activeSubtab, setActiveSubtab] = useState('today')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionType, setActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [interviews, setInterviews] = useState([])
  const [gracePeriod] = useState(30) // 30 minutes grace period

  useEffect(() => {
    if (propInterviews) {
      // Use interviews passed as props (from calendar view)
      setInterviews(propInterviews.map(interview => ({
        id: interview.candidate_id,
        name: interview.candidate_name,
        phone: interview.candidate_phone,
        email: interview.candidate_email,
        interview: interview
      })))
    } else {
      // Load interviews from candidates
      loadInterviews()
    }
  }, [candidates, jobId, propInterviews])

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        handleCloseSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  const loadInterviews = async () => {
    try {
      const interviewData = []
      for (const candidate of candidates) {
        const candidateInterviews = await interviewService.getInterviewsByCandidateId(candidate.id)
        const jobInterview = candidateInterviews.find(interview => interview.job_id === jobId)
        if (jobInterview) {
          interviewData.push({
            ...candidate,
            interview: jobInterview
          })
        }
      }
      setInterviews(interviewData)
    } catch (error) {
      console.error('Failed to load interviews:', error)
    }
  }

  // Filter candidates based on active subtab
  const filteredCandidates = interviews.filter(candidate => {
    if (!candidate.interview) return false

    const interviewDate = parseISO(candidate.interview.scheduled_at)

    switch (activeSubtab) {
      case 'today':
        return isToday(interviewDate) && !isUnattended(candidate.interview)
      case 'tomorrow':
        return isTomorrow(interviewDate)
      case 'unattended':
        return isUnattended(candidate.interview)
      case 'all':
      default:
        return true
    }
  })





  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
    setNotes('')
    setActionType('')
    setRejectionReason('')
    setRescheduleData({ date: '', time: '' })
  }

  const handleAction = async (candidate, action, additionalData = null) => {
    try {
      setIsProcessing(true)
      let updateData = {
        notes: notes,
        updated_at: new Date().toISOString()
      }

      switch (action) {
        case 'send_reminder':
          // In a real app, this would trigger an SMS/email
          updateData.reminder_sent = true
          updateData.reminder_sent_at = new Date().toISOString()
          break
        case 'take_notes':
          // Just update notes
          break
        case 'mark_interviewed':
          updateData.status = 'completed'
          updateData.completed_at = new Date().toISOString()
          break
        case 'mark_pass':
          updateData.status = 'completed'
          updateData.result = 'pass'
          updateData.completed_at = new Date().toISOString()
          break
        case 'mark_fail':
          updateData.status = 'completed'
          updateData.result = 'fail'
          updateData.completed_at = new Date().toISOString()
          break
        case 'reject':
          updateData.status = 'cancelled'
          updateData.result = 'rejected'
          updateData.rejection_reason = rejectionReason
          updateData.cancelled_at = new Date().toISOString()
          break
        case 'reschedule':
          updateData.status = 'scheduled'
          updateData.scheduled_at = `${rescheduleData.date}T${rescheduleData.time}:00`
          updateData.rescheduled_at = new Date().toISOString()
          break
      }

      await interviewService.updateInterview(candidate.interview.id, updateData)

      // Reload interviews
      await loadInterviews()

      // Close sidebar and reset state
      handleCloseSidebar()
    } catch (error) {
      console.error('Failed to update interview:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (interview) => {
    const interviewDate = parseISO(interview.scheduled_at)
    const isUnattendedInterview = isUnattended(interview)

    if (isUnattendedInterview) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Unattended</span>
    }

    switch (interview.status) {
      case 'scheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>
      case 'completed':
        if (interview.result === 'pass') {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Passed</span>
        } else if (interview.result === 'fail') {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Completed</span>
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>
      case 'rescheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Rescheduled</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>
    }
  }

  const getActionButtons = (candidate) => {
    const interview = candidate.interview
    const interviewDate = parseISO(interview.scheduled_at)
    const isUpcoming = isToday(interviewDate) || isTomorrow(interviewDate)
    const isUnattendedCandidate = isUnattended(interview)

    if (interview.status === 'completed') {
      return (
        <div className="text-sm text-gray-600">
          Interview completed - {interview.result || 'No result recorded'}
        </div>
      )
    }

    // Today, Tomorrow: Send reminder, Take notes during interview, Mark Interviewed, Mark pass, Mark fail, Reject with reason
    if (isUpcoming && interview.status === 'scheduled' && !isUnattendedCandidate) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'send_reminder')
            }}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
          >
            <Send className="w-3 h-3 mr-1 inline" />
            Send Reminder
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_interviewed')
            }}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <Check className="w-3 h-3 mr-1 inline" />
            Mark Interviewed
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_pass')
            }}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Mark Pass
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Mark Fail
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
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

    // Unattended, All: Mark Pass | Fail | Reject with reason (removes from shortlisted list) | Reschedule (future date)
    if (isUnattendedCandidate || activeSubtab === 'all' || activeSubtab === 'unattended') {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_pass')
            }}
            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            Mark Pass
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Mark Fail
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedCandidate(candidate)
              setActionType('reject')
            }}
            className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            <X className="w-3 h-3 mr-1 inline" />
            Reject
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
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

  const getLocationIcon = (location) => {
    if (location?.toLowerCase().includes('video') || location?.toLowerCase().includes('zoom') || location?.toLowerCase().includes('teams')) {
      return <Video className="w-4 h-4" />
    }
    if (location?.toLowerCase().includes('phone') || location?.toLowerCase().includes('call')) {
      return <Phone className="w-4 h-4" />
    }
    return <MapPin className="w-4 h-4" />
  }

  const CandidateSidebar = ({ candidate, isOpen, onClose }) => {
    if (!isOpen || !candidate) return null

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Applicant Summary</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Section */}
              <div className="mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600">
                      {candidate.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{candidate.name}</h3>
                    {candidate.priority_score && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-medium text-gray-700">Priority Score: {candidate.priority_score}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Applied {format(new Date(candidate.applied_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Phone</div>
                      <div className="text-sm text-gray-600">{candidate.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email</div>
                      <div className="text-sm text-gray-600">{candidate.email}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interview Details */}
              {candidate.interview && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Interview Details
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Date & Time</div>
                        <div className="text-sm text-gray-600">
                          {format(parseISO(candidate.interview.scheduled_at), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Duration</div>
                        <div className="text-sm text-gray-600">{candidate.interview.duration} minutes</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Location</div>
                        <div className="text-sm text-gray-600">{candidate.interview.location}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Interviewer</div>
                        <div className="text-sm text-gray-600">{candidate.interview.interviewer}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Field */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Interview Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the interview..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => handleAction(candidate, 'take_notes')}
                  disabled={isProcessing}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Additional Details */}
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Address
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{candidate.address}</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, index) => (
                      <span key={index} className="chip chip-blue">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{candidate.education || 'Not specified'}</p>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Experience
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{candidate.experience}</p>
                  </div>
                </div>

                {/* CV Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">CV</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.name}_CV.pdf
                          </div>
                          <div className="text-xs text-gray-500">PDF • 2.3 MB</div>
                        </div>
                      </div>
                      <button className="btn-secondary text-sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Candidate Sidebar */}
      <CandidateSidebar
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Subtabs/Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'today', label: 'Today', count: getSubtabCounts().today },
          { id: 'tomorrow', label: 'Tomorrow', count: getSubtabCounts().tomorrow },
          { id: 'unattended', label: 'Unattended', count: getSubtabCounts().unattended },
          { id: 'all', label: 'All', count: getSubtabCounts().all }
        ].map(subtab => (
          <button
            key={subtab.id}
            onClick={() => setActiveSubtab(subtab.id)}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSubtab === subtab.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {subtab.label}
            {subtab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeSubtab === subtab.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
                }`}>
                {subtab.count}
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
            const interviewDate = parseISO(interview.scheduled_at)
            const isUnattendedCandidate = isUnattended(interview)

            return (
              <div
                key={candidate.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleCandidateClick(candidate)}
              >
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
                          <span>{format(interviewDate, 'h:mm a')} ({interview.duration || 60} min)</span>
                        </div>
                        <div className="flex items-center">
                          {getLocationIcon(interview.location)}
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

                      {/* Unattended Flag */}
                      {isUnattendedCandidate && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                            <p className="text-sm text-red-800">
                              Automatically flagged as unattended (grace period expired)
                            </p>
                          </div>
                        </div>
                      )}

                      <div onClick={(e) => e.stopPropagation()}>
                        {getActionButtons(candidate)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCandidateClick(candidate)
                    }}
                    className="text-sm text-primary-600 hover:text-primary-800 transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
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
              {activeSubtab === 'all'
                ? 'No interviews have been scheduled yet.'
                : `No interviews match the "${activeSubtab}" filter.`}
            </p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {actionType === 'reject' && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reject Candidate</h3>
              <button
                onClick={() => {
                  setActionType('')
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will remove the candidate from the shortlisted list and cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionType('')
                    setRejectionReason('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedCandidate, 'reject')}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionType === 'reschedule' && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reschedule Interview</h3>
              <button
                onClick={() => {
                  setActionType('')
                  setRescheduleData({ date: '', time: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionType('')
                    setRescheduleData({ date: '', time: '' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedCandidate, 'reschedule')}
                  disabled={!rescheduleData.date || !rescheduleData.time || isProcessing}
                  className="btn-primary disabled:opacity-50"
                >
                  {isProcessing ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews