import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, X, Users } from 'lucide-react'
import { interviewService, candidateService } from '../services/index.js'
import { format, addMinutes, isSameMinute, parseISO } from 'date-fns'

const EnhancedInterviewScheduling = ({ candidates, jobId, onScheduled }) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [schedulingData, setSchedulingData] = useState({
    date: '',
    time: '',
    duration: 60,
    interviewer: '',
    location: 'Office',
    notes: ''
  })
  const [conflicts, setConflicts] = useState([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [existingInterviews, setExistingInterviews] = useState([])

  useEffect(() => {
    loadExistingInterviews()
  }, [])

  const loadExistingInterviews = async () => {
    try {
      const interviews = await interviewService.getAllInterviews()
      setExistingInterviews(interviews)
    } catch (error) {
      console.error('Failed to load existing interviews:', error)
    }
  }

  const checkForConflicts = (candidateId, proposedDateTime, duration) => {
    const proposedStart = parseISO(proposedDateTime)
    const proposedEnd = addMinutes(proposedStart, duration)
    
    const candidateConflicts = existingInterviews.filter(interview => {
      if (interview.candidate_id !== candidateId) return false
      
      const existingStart = parseISO(interview.scheduled_at)
      const existingEnd = addMinutes(existingStart, interview.duration || 60)
      
      // Check for time overlap
      return (proposedStart < existingEnd && proposedEnd > existingStart)
    })

    return candidateConflicts
  }

  const handleCandidateSelect = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
    
    // Check for conflicts when candidates are selected
    if (schedulingData.date && schedulingData.time) {
      checkAllConflicts(newSelected)
    }
  }

  const checkAllConflicts = (candidateIds) => {
    if (!schedulingData.date || !schedulingData.time) return

    const proposedDateTime = `${schedulingData.date}T${schedulingData.time}:00`
    const allConflicts = []

    candidateIds.forEach(candidateId => {
      const candidateConflicts = checkForConflicts(candidateId, proposedDateTime, schedulingData.duration)
      if (candidateConflicts.length > 0) {
        const candidate = candidates.find(c => c.id === candidateId)
        allConflicts.push({
          candidateId,
          candidateName: candidate?.name || 'Unknown',
          conflicts: candidateConflicts
        })
      }
    })

    setConflicts(allConflicts)
  }

  const handleSchedulingDataChange = (field, value) => {
    const newData = { ...schedulingData, [field]: value }
    setSchedulingData(newData)
    
    // Check for conflicts when date/time changes
    if (field === 'date' || field === 'time' || field === 'duration') {
      checkAllConflicts(selectedCandidates)
    }
  }

  const handleScheduleInterviews = async () => {
    if (selectedCandidates.size === 0 || conflicts.length > 0) return

    try {
      setIsScheduling(true)
      const proposedDateTime = `${schedulingData.date}T${schedulingData.time}:00`
      
      const schedulePromises = Array.from(selectedCandidates).map(async (candidateId) => {
        const candidate = candidates.find(c => c.id === candidateId)
        if (!candidate) return null

        return await interviewService.scheduleInterview({
          candidate_id: candidateId,
          job_id: jobId,
          scheduled_at: proposedDateTime,
          duration: schedulingData.duration,
          interviewer: schedulingData.interviewer,
          location: schedulingData.location,
          notes: schedulingData.notes,
          status: 'scheduled'
        })
      })

      await Promise.all(schedulePromises)
      
      // Reset form
      setSelectedCandidates(new Set())
      setSchedulingData({
        date: '',
        time: '',
        duration: 60,
        interviewer: '',
        location: 'Office',
        notes: ''
      })
      setConflicts([])
      
      // Reload existing interviews
      await loadExistingInterviews()
      
      // Notify parent component
      if (onScheduled) {
        onScheduled()
      }

    } catch (error) {
      console.error('Failed to schedule interviews:', error)
    } finally {
      setIsScheduling(false)
    }
  }

  const ConflictAlert = ({ conflicts }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Scheduling Conflicts Detected</h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>{conflict.candidateName}</strong> has {conflict.conflicts.length} conflicting interview(s):
                <ul className="ml-4 mt-1">
                  {conflict.conflicts.map((existingInterview, idx) => (
                    <li key={idx} className="text-xs">
                      • {format(parseISO(existingInterview.scheduled_at), 'MMM dd, yyyy HH:mm')} 
                      ({existingInterview.duration || 60} min)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-2">
            Please choose a different time slot or deselect conflicting candidates.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800">Interview Scheduling</h3>
        <p className="text-sm text-blue-700 mt-1">
          Select candidates and schedule interviews. The system will automatically check for conflicts.
        </p>
      </div>

      {/* Candidate Selection */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">Select Candidates</h4>
        <div className="grid grid-cols-1 gap-3">
          {candidates.map(candidate => (
            <div
              key={candidate.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedCandidates.has(candidate.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleCandidateSelect(candidate.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={() => handleCandidateSelect(candidate.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <h5 className="font-medium text-gray-900">{candidate.name}</h5>
                    <p className="text-sm text-gray-600">{candidate.phone}</p>
                  </div>
                </div>
                {conflicts.some(c => c.candidateId === candidate.id) && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduling Form */}
      {selectedCandidates.size > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Schedule Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={schedulingData.date}
                onChange={(e) => handleSchedulingDataChange('date', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={schedulingData.time}
                onChange={(e) => handleSchedulingDataChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select
                value={schedulingData.duration}
                onChange={(e) => handleSchedulingDataChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
              <input
                type="text"
                value={schedulingData.interviewer}
                onChange={(e) => handleSchedulingDataChange('interviewer', e.target.value)}
                placeholder="Enter interviewer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={schedulingData.location}
                onChange={(e) => handleSchedulingDataChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Office">Office</option>
                <option value="Video Call">Video Call</option>
                <option value="Phone">Phone</option>
                <option value="Client Site">Client Site</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={schedulingData.notes}
                onChange={(e) => handleSchedulingDataChange('notes', e.target.value)}
                placeholder="Additional notes for the interview..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conflict Alerts */}
      {conflicts.length > 0 && <ConflictAlert conflicts={conflicts} />}

      {/* Schedule Button */}
      {selectedCandidates.size > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleScheduleInterviews}
            disabled={isScheduling || conflicts.length > 0 || !schedulingData.date || !schedulingData.time}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {isScheduling ? 'Scheduling...' : `Schedule ${selectedCandidates.size} Interview${selectedCandidates.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}

export default EnhancedInterviewScheduling