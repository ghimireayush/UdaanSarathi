import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, X, Users, Zap, FileText, User, GraduationCap, Camera, Clipboard, Plus } from 'lucide-react'
import { interviewService, candidateService } from '../services/index.js'
import { format, addMinutes, isSameMinute, parseISO, addDays, startOfDay } from 'date-fns'

const EnhancedInterviewScheduling = ({ candidates, jobId, onScheduled }) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [schedulingMode, setSchedulingMode] = useState('individual') // 'individual', 'batch', 'suggested', 'ai'
  const [schedulingData, setSchedulingData] = useState({
    date: '',
    time: '',
    duration: 60,
    interviewer: '',
    location: 'Office',
    notes: ''
  })
  const [batchScheduling, setBatchScheduling] = useState([])
  const [suggestedScheduling, setSuggestedScheduling] = useState({
    duration: '2 weeks',
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    interviewsPerDay: 3
  })
  const [requirements, setRequirements] = useState([
    { id: 'cv', label: 'CV', icon: FileText, selected: true },
    { id: 'citizenship', label: 'Citizenship', icon: User, selected: true },
    { id: 'education', label: 'Education Certificate', icon: GraduationCap, selected: true },
    { id: 'photo', label: 'PP Photo', icon: Camera, selected: true },
    { id: 'hardcopy', label: 'Hardcopy Requirements', icon: Clipboard, selected: true }
  ])
  const [conflicts, setConflicts] = useState([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [existingInterviews, setExistingInterviews] = useState([])
  const [candidateStatuses, setCandidateStatuses] = useState({})

  useEffect(() => {
    loadExistingInterviews()
    loadCandidateStatuses()
  }, [])

  const loadExistingInterviews = async () => {
    try {
      const interviews = await interviewService.getAllInterviews()
      setExistingInterviews(interviews)
    } catch (error) {
      console.error('Failed to load existing interviews:', error)
    }
  }

  const loadCandidateStatuses = async () => {
    try {
      const statuses = {}
      for (const candidate of candidates) {
        const candidateInterviews = await interviewService.getInterviewsByCandidate(candidate.id)
        const jobInterview = candidateInterviews.find(interview => interview.job_id === jobId)
        statuses[candidate.id] = jobInterview ? jobInterview.status : 'not_scheduled'
      }
      setCandidateStatuses(statuses)
    } catch (error) {
      console.error('Failed to load candidate statuses:', error)
    }
  }

  const toggleRequirement = (requirementId) => {
    setRequirements(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, selected: !req.selected }
          : req
      )
    )
  }

  const generateSuggestedSchedule = () => {
    const startDate = parseISO(suggestedScheduling.startDate)
    const durationInDays = suggestedScheduling.duration === '2 weeks' ? 14 : 2
    const interviewsPerDay = suggestedScheduling.interviewsPerDay
    
    const schedule = []
    let currentDate = startDate
    let candidateIndex = 0
    
    while (candidateIndex < candidates.length && schedule.length < durationInDays) {
      const daySchedule = {
        date: format(currentDate, 'yyyy-MM-dd'),
        candidates: []
      }
      
      for (let i = 0; i < interviewsPerDay && candidateIndex < candidates.length; i++) {
        const timeSlot = format(addMinutes(startOfDay(currentDate).setHours(9), i * 60), 'HH:mm')
        daySchedule.candidates.push({
          candidate: candidates[candidateIndex],
          time: timeSlot
        })
        candidateIndex++
      }
      
      if (daySchedule.candidates.length > 0) {
        schedule.push(daySchedule)
      }
      
      currentDate = addDays(currentDate, 1)
    }
    
    return schedule
  }

  const generateAISchedule = () => {
    // AI-assisted scheduling for top 5 candidates
    const topCandidates = candidates
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 5)
    
    const aiSchedule = topCandidates.map((candidate, index) => ({
      candidate,
      suggestedDate: format(addDays(new Date(), index + 1), 'yyyy-MM-dd'),
      suggestedTime: format(addMinutes(startOfDay(new Date()).setHours(10), index * 90), 'HH:mm'),
      priority: 'high',
      reasoning: `Top ${index + 1} candidate based on skill match (${candidate.priority_score}% match)`
    }))
    
    return aiSchedule
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_scheduled': { class: 'bg-gray-100 text-gray-800', label: 'Not Scheduled' },
      'scheduled': { class: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      'completed': { class: 'bg-green-100 text-green-800', label: 'Completed' },
      'cancelled': { class: 'bg-red-100 text-red-800', label: 'Cancelled' },
      'rescheduled': { class: 'bg-yellow-100 text-yellow-800', label: 'Rescheduled' }
    }
    const config = statusConfig[status] || statusConfig['not_scheduled']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800">Interview Scheduling</h3>
        <p className="text-sm text-blue-700 mt-1">
          Review shortlisted candidates and create interview schedules with multiple scheduling options.
        </p>
      </div>

      {/* Requirements Checklist */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">Requirements Checklist</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">Auto-selected requirements for interviews:</p>
          <div className="flex flex-wrap gap-2">
            {requirements.map(requirement => {
              const IconComponent = requirement.icon
              return (
                <div
                  key={requirement.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    requirement.selected
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {requirement.label}
                  {requirement.selected && (
                    <button
                      onClick={() => toggleRequirement(requirement.id)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click X to remove requirements. Selected requirements will be communicated to candidates.
          </p>
        </div>
      </div>

      {/* Scheduling Mode Selection */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">Scheduling Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSchedulingMode('individual')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'individual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Individual</div>
            <div className="text-xs text-gray-500">Schedule one by one</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('batch')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'batch'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Batch</div>
            <div className="text-xs text-gray-500">Schedule N on date1, M on date2</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('suggested')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'suggested'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Suggested</div>
            <div className="text-xs text-gray-500">Auto-schedule over 2 weeks/days</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('ai')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'ai'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">AI-Assisted</div>
            <div className="text-xs text-gray-500">Smart scheduling for top 5</div>
          </button>
        </div>
      </div>

      {/* Shortlisted Candidates with Interview Status */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">
          Shortlisted Candidates ({candidates.length})
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {candidates.map(candidate => (
            <div
              key={candidate.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedCandidates.has(candidate.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {schedulingMode !== 'suggested' && schedulingMode !== 'ai' && (
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => handleCandidateSelect(candidate.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {candidate.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{candidate.name}</h5>
                      {candidate.priority_score && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-yellow-600">★</span>
                          <span className="text-xs font-medium text-gray-700">{candidate.priority_score}%</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <div>{candidate.phone}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {candidate.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="text-xs text-gray-500">+{candidate.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(candidateStatuses[candidate.id] || 'not_scheduled')}
                        {conflicts.some(c => c.candidateId === candidate.id) && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Scheduling Form */}
      {schedulingMode === 'individual' && selectedCandidates.size > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Individual Schedule Details</h4>
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

      {/* Batch Scheduling */}
      {schedulingMode === 'batch' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Batch Scheduling</h4>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              Create multiple scheduling slots. Example: "Schedule 3 candidates on March 15th, 2 candidates on March 16th"
            </p>
          </div>
          
          <div className="space-y-4">
            {batchScheduling.map((batch, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Batch {index + 1}</h5>
                  <button
                    onClick={() => setBatchScheduling(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="date"
                    value={batch.date}
                    onChange={(e) => {
                      const newBatches = [...batchScheduling]
                      newBatches[index].date = e.target.value
                      setBatchScheduling(newBatches)
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="time"
                    value={batch.startTime}
                    onChange={(e) => {
                      const newBatches = [...batchScheduling]
                      newBatches[index].startTime = e.target.value
                      setBatchScheduling(newBatches)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={batch.candidateCount}
                    onChange={(e) => {
                      const newBatches = [...batchScheduling]
                      newBatches[index].candidateCount = parseInt(e.target.value)
                      setBatchScheduling(newBatches)
                    }}
                    placeholder="Number of candidates"
                    min="1"
                    max={candidates.length}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setBatchScheduling(prev => [...prev, { date: '', startTime: '09:00', candidateCount: 1 }])}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Batch
            </button>
          </div>
        </div>
      )}

      {/* Suggested Scheduling */}
      {schedulingMode === 'suggested' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Suggested Scheduling</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Duration</label>
                <select
                  value={suggestedScheduling.duration}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="2 weeks">2 weeks</option>
                  <option value="2 days">2 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Start Date</label>
                <input
                  type="date"
                  value={suggestedScheduling.startDate}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, startDate: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-800 mb-1">Interviews per Day</label>
                <select
                  value={suggestedScheduling.interviewsPerDay}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, interviewsPerDay: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value={1}>1 per day</option>
                  <option value={2}>2 per day</option>
                  <option value={3}>3 per day</option>
                  <option value={4}>4 per day</option>
                  <option value={5}>5 per day</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Generated Schedule Preview</h5>
            <div className="space-y-3">
              {generateSuggestedSchedule().map((day, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900 mb-2">
                    {format(parseISO(day.date), 'EEEE, MMM dd, yyyy')}
                  </div>
                  <div className="space-y-1">
                    {day.candidates.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center justify-between text-sm">
                        <span>{slot.time} - {slot.candidate.name}</span>
                        <span className="text-gray-500">Priority: {slot.candidate.priority_score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI-Assisted Scheduling */}
      {schedulingMode === 'ai' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">AI-Assisted Scheduling</h4>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-purple-800">Smart Scheduling for Top Candidates</h5>
                <p className="text-sm text-purple-700 mt-1">
                  AI has analyzed candidate profiles and suggests optimal scheduling for your top 5 candidates.
                  Please review and approve the suggestions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {generateAISchedule().map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700">#{index + 1}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{suggestion.candidate.name}</h5>
                      <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-700">
                          📅 {format(parseISO(suggestion.suggestedDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-gray-700">
                          🕒 {suggestion.suggestedTime}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-700">{suggestion.candidate.priority_score}%</div>
                    <div className="text-xs text-gray-500">Match Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-800">Review Required</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  AI suggestions need thorough review. Please verify candidate availability and interviewer schedules before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Alerts */}
      {conflicts.length > 0 && <ConflictAlert conflicts={conflicts} />}

      {/* Schedule Button */}
      {((schedulingMode === 'individual' && selectedCandidates.size > 0) ||
        (schedulingMode === 'batch' && batchScheduling.length > 0) ||
        (schedulingMode === 'suggested') ||
        (schedulingMode === 'ai')) && (
        <div className="flex justify-end space-x-3">
          {schedulingMode === 'suggested' && (
            <button
              onClick={() => {
                const schedule = generateSuggestedSchedule()
                // Handle suggested schedule implementation
                console.log('Implementing suggested schedule:', schedule)
              }}
              disabled={isScheduling}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : 'Apply Suggested Schedule'}
            </button>
          )}
          
          {schedulingMode === 'ai' && (
            <button
              onClick={() => {
                const aiSchedule = generateAISchedule()
                // Handle AI schedule implementation
                console.log('Implementing AI schedule:', aiSchedule)
              }}
              disabled={isScheduling}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : 'Apply AI Schedule'}
            </button>
          )}
          
          {schedulingMode === 'batch' && (
            <button
              onClick={() => {
                // Handle batch scheduling implementation
                console.log('Implementing batch schedule:', batchScheduling)
              }}
              disabled={isScheduling || batchScheduling.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : `Schedule ${batchScheduling.length} Batch${batchScheduling.length !== 1 ? 'es' : ''}`}
            </button>
          )}
          
          {schedulingMode === 'individual' && (
            <button
              onClick={handleScheduleInterviews}
              disabled={isScheduling || conflicts.length > 0 || !schedulingData.date || !schedulingData.time}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : `Schedule ${selectedCandidates.size} Interview${selectedCandidates.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedInterviewScheduling