import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  Check,
  ChevronDown,
  Users,
  CheckSquare,
  User,
  CalendarDays,
  AlertCircle
} from 'lucide-react'
import { interviewService, constantsService } from '../services/index.js'
import { format, addDays } from 'date-fns'
import NepaliCalendar from './NepaliCalendar.jsx'
import DateDisplay from './DateDisplay.jsx'
import { formatInNepalTz, getCurrentNepalTime } from '../utils/nepaliDate.js'

const InterviewScheduling = ({ candidates, jobId, onScheduled }) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [scheduleMode, setScheduleMode] = useState('individual') // 'individual', 'batch', 'suggested'
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarForCandidate, setCalendarForCandidate] = useState(null)
  const [scheduleData, setScheduleData] = useState({
    date: formatInNepalTz(getCurrentNepalTime(), 'yyyy-MM-dd'),
    time: '10:00',
    duration: 30,
    interviewer: 'Ahmed Al Mansouri',
    location: 'Office - Conference Room A',
    type: 'in-person',
    notes: ''
  })
  const [batchSchedule, setBatchSchedule] = useState([
    { date: formatInNepalTz(getCurrentNepalTime(), 'yyyy-MM-dd'), count: 0 },
    { date: formatInNepalTz(addDays(getCurrentNepalTime(), 1), 'yyyy-MM-dd'), count: 0 }
  ])
  const [requirements, setRequirements] = useState([
    { id: 'cv', label: 'CV', selected: true },
    { id: 'citizenship', label: 'Citizenship', selected: true },
    { id: 'education', label: 'Education Certificate', selected: true },
    { id: 'photo', label: 'PP Photo', selected: true },
    { id: 'hardcopy', label: 'Hardcopy Documents', selected: false }
  ])

  const scheduleInterviewMutation = useInterviews.schedule()
  const batchScheduleMutation = useInterviews.batchSchedule()

  const handleCandidateSelect = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }

  const handleRequirementToggle = (requirementId) => {
    setRequirements(prev => prev.map(req => 
      req.id === requirementId ? { ...req, selected: !req.selected } : req
    ))
  }

  const handleIndividualSchedule = async (candidateId) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId)
      await scheduleInterviewMutation.mutateAsync({
        candidate_id: candidateId,
        job_id: jobId,
        scheduled_at: new Date(`${scheduleData.date}T${scheduleData.time}`),
        duration: scheduleData.duration,
        interviewer: scheduleData.interviewer,
        location: scheduleData.location,
        type: scheduleData.type,
        notes: scheduleData.notes,
        requirements: requirements.filter(r => r.selected).map(r => r.id)
      })
      
      if (onScheduled) onScheduled()
    } catch (error) {
      console.error('Failed to schedule interview:', error)
    }
  }

  const handleBatchSchedule = async () => {
    if (selectedCandidates.size === 0) return

    try {
      const scheduleItems = []
      let candidateIndex = 0
      const candidateArray = Array.from(selectedCandidates)

      batchSchedule.forEach(batch => {
        for (let i = 0; i < batch.count && candidateIndex < candidateArray.length; i++) {
          scheduleItems.push({
            candidate_id: candidateArray[candidateIndex],
            job_id: jobId,
            scheduled_at: new Date(`${batch.date}T${scheduleData.time}`),
            duration: scheduleData.duration,
            interviewer: scheduleData.interviewer,
            location: scheduleData.location,
            type: scheduleData.type,
            notes: scheduleData.notes,
            requirements: requirements.filter(r => r.selected).map(r => r.id)
          })
          candidateIndex++
        }
      })

      await batchScheduleMutation.mutateAsync(scheduleItems)
      setSelectedCandidates(new Set())
      if (onScheduled) onScheduled()
    } catch (error) {
      console.error('Failed to batch schedule interviews:', error)
    }
  }

  const handleSuggestedSchedule = async () => {
    // AI-assisted scheduling logic would go here
    // For now, we'll implement a simple suggested schedule
    const totalCandidates = selectedCandidates.size
    const candidatesPerDay = Math.ceil(totalCandidates / 14) // Spread over 2 weeks
    
    const suggestedSchedule = []
    const candidateArray = Array.from(selectedCandidates)
    let candidateIndex = 0

    for (let day = 0; day < 14 && candidateIndex < totalCandidates; day++) {
      const scheduleDate = format(addDays(new Date(), day + 1), 'yyyy-MM-dd')
      
      for (let slot = 0; slot < candidatesPerDay && candidateIndex < totalCandidates; slot++) {
        const timeSlot = `${9 + Math.floor(slot * 1.5)}:${(slot % 2) * 30}`
        
        suggestedSchedule.push({
          candidate_id: candidateArray[candidateIndex],
          job_id: jobId,
          scheduled_at: new Date(`${scheduleDate}T${timeSlot.padStart(5, '0')}`),
          duration: scheduleData.duration,
          interviewer: scheduleData.interviewer,
          location: scheduleData.location,
          type: scheduleData.type,
          notes: 'Auto-scheduled',
          requirements: requirements.filter(r => r.selected).map(r => r.id)
        })
        candidateIndex++
      }
    }

    try {
      await batchScheduleMutation.mutateAsync(suggestedSchedule)
      setSelectedCandidates(new Set())
      if (onScheduled) onScheduled()
    } catch (error) {
      console.error('Failed to create suggested schedule:', error)
    }
  }

  const handleDateSelect = (selectedDate, candidateId) => {
    const formattedDate = formatInNepalTz(selectedDate, 'yyyy-MM-dd')
    setScheduleData(prev => ({ ...prev, date: formattedDate }))
    if (candidateId) {
      setCalendarForCandidate(candidateId)
    }
    setShowCalendar(false)
  }

  const updateBatchCount = (index, count) => {
    setBatchSchedule(prev => prev.map((batch, i) => 
      i === index ? { ...batch, count: Math.max(0, count) } : batch
    ))
  }

  const openCalendarForCandidate = (candidateId) => {
    setCalendarForCandidate(candidateId)
    setShowCalendar(true)
  }

  return (
    <div className="space-y-6">
      {/* Requirements Checklist */}
      <div className="card p-4">
        <h4 className="font-medium text-gray-900 mb-3">Required Documents</h4>
        <div className="flex flex-wrap gap-2">
          {requirements.map(requirement => (
            <div key={requirement.id} className="flex items-center">
              <label className={`chip cursor-pointer transition-colors ${
                requirement.selected ? 'chip-blue' : 'bg-gray-100 text-gray-600'
              }`}>
                <input
                  type="checkbox"
                  checked={requirement.selected}
                  onChange={() => handleRequirementToggle(requirement.id)}
                  className="sr-only"
                />
                <span className="flex items-center">
                  {requirement.selected && <Check className="w-3 h-3 mr-1" />}
                  {requirement.label}
                  {requirement.selected && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleRequirementToggle(requirement.id)
                      }}
                      className="ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduling Options */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setScheduleMode('individual')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              scheduleMode === 'individual' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Individual Scheduling
          </button>
          <button
            onClick={() => setScheduleMode('batch')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              scheduleMode === 'batch' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Batch Scheduling
          </button>
          <button
            onClick={() => setScheduleMode('suggested')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              scheduleMode === 'suggested' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI Suggested
          </button>
        </div>

        {/* Common Schedule Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
            <select
              value={scheduleData.interviewer}
              onChange={(e) => setScheduleData(prev => ({ ...prev, interviewer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option>Ahmed Al Mansouri</option>
              <option>Sarah Johnson</option>
              <option>Michael Chen</option>
              <option>Priya Sharma</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <select
              value={scheduleData.duration}
              onChange={(e) => setScheduleData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={scheduleData.type}
              onChange={(e) => setScheduleData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="in-person">In-person</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={scheduleData.location}
              onChange={(e) => setScheduleData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Meeting location"
            />
          </div>
        </div>

        {/* Schedule Mode Specific UI */}
        {scheduleMode === 'batch' && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Batch Schedule Setup</h5>
            <p className="text-sm text-gray-600">
              Selected candidates: {selectedCandidates.size}
            </p>
            {batchSchedule.map((batch, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="date"
                  value={batch.date}
                  onChange={(e) => setBatchSchedule(prev => prev.map((b, i) => 
                    i === index ? { ...b, date: e.target.value } : b
                  ))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <input
                  type="number"
                  value={batch.count}
                  onChange={(e) => updateBatchCount(index, Number(e.target.value))}
                  min="0"
                  max={selectedCandidates.size}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Count"
                />
                <span className="text-sm text-gray-600">candidates</span>
              </div>
            ))}
            
            <button
              onClick={handleBatchSchedule}
              disabled={selectedCandidates.size === 0 || batchScheduleMutation.isLoading}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Schedule Batch ({selectedCandidates.size} candidates)
            </button>
          </div>
        )}

        {scheduleMode === 'suggested' && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-900">AI-Assisted Scheduling</h5>
                  <p className="text-sm text-blue-700 mt-1">
                    Automatically schedule {selectedCandidates.size} candidates over 2 weeks, 
                    starting tomorrow. Interviews will be distributed to avoid conflicts.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSuggestedSchedule}
              disabled={selectedCandidates.size === 0 || batchScheduleMutation.isLoading}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="w-4 h-4 mr-2" />
              Create Suggested Schedule ({selectedCandidates.size} candidates)
            </button>
          </div>
        )}
      </div>

      {/* Candidate List with Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            Shortlisted Candidates ({candidates.length})
          </h4>
          {scheduleMode !== 'individual' && (
            <button
              onClick={() => {
                if (selectedCandidates.size === candidates.length) {
                  setSelectedCandidates(new Set())
                } else {
                  setSelectedCandidates(new Set(candidates.map(c => c.id)))
                }
              }}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              {selectedCandidates.size === candidates.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {candidates.map(candidate => (
          <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                {scheduleMode !== 'individual' && (
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={() => handleCandidateSelect(candidate.id)}
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                )}
                
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {candidate.name.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{candidate.name}</h5>
                  <p className="text-sm text-gray-600">{candidate.experience} experience</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="chip chip-blue text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {scheduleMode === 'individual' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openCalendarForCandidate(candidate.id)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <DateDisplay 
                      date={scheduleData.date} 
                      showNepali={false} 
                      format="short" 
                      showIcon={false}
                      className="text-xs"
                    />
                  </button>
                  <input
                    type="time"
                    value={scheduleData.time}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    onClick={() => handleIndividualSchedule(candidate.id)}
                    disabled={scheduleInterviewMutation.isLoading}
                    className="btn-primary text-xs px-3 py-1 disabled:opacity-50"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Nepali Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Interview Date
              </h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NepaliCalendar
              selectedDate={scheduleData.date ? new Date(scheduleData.date) : null}
              onDateSelect={(date) => handleDateSelect(date, calendarForCandidate)}
              showBothCalendars={true}
              defaultToNepali={true}
              minDate={getCurrentNepalTime()}
              className=""
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewScheduling