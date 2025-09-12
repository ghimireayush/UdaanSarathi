import React, { useState, useEffect, useCallback } from 'react'
import aiSchedulingService from '../services/aiSchedulingService'
import { formatInNepalTz } from '../utils/nepaliDate'

const AISchedulingAssistant = ({
  existingMeetings = [],
  participants = [],
  onScheduleSelect,
  constraints = {},
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [autoScheduleMode, setAutoScheduleMode] = useState(false)
  const [schedulingConstraints, setSchedulingConstraints] = useState({
    duration: 60,
    priority: 'medium',
    meetingType: 'interview',
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    ...constraints
  })

  // Generate AI scheduling suggestions
  const generateSuggestions = useCallback(async () => {
    if (participants.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const result = await aiSchedulingService.generateSchedulingSuggestions(
        existingMeetings,
        participants,
        schedulingConstraints
      )

      setSuggestions(result.suggestions)
      setRecommendations(result.recommendations)
      setAnalytics(result.analytics)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [existingMeetings, participants, schedulingConstraints])

  // Auto-schedule multiple meetings
  const handleAutoSchedule = useCallback(async (meetings) => {
    setLoading(true)
    setError(null)

    try {
      const result = await aiSchedulingService.autoScheduleMeetings(
        meetings,
        { existingMeetings, ...schedulingConstraints }
      )

      // Handle results
      if (result.scheduled.length > 0) {
        result.scheduled.forEach(meeting => {
          onScheduleSelect?.(meeting)
        })
      }

      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [existingMeetings, schedulingConstraints, onScheduleSelect])

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    onScheduleSelect?.(slot)
  }

  // Update constraints
  const updateConstraints = (newConstraints) => {
    setSchedulingConstraints(prev => ({ ...prev, ...newConstraints }))
  }

  // Generate suggestions when dependencies change
  useEffect(() => {
    generateSuggestions()
  }, [generateSuggestions])

  const ScoreIndicator = ({ score, factors }) => (
    <div className="score-indicator">
      <div className="score-circle" data-score={Math.round(score / 10)}>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-factors">
        {Object.entries(factors).map(([factor, value]) => (
          <div key={factor} className="factor">
            <span className="factor-name">{factor.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            <div className="factor-bar">
              <div
                className="factor-fill"
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const TimeSlotCard = ({ slot, isSelected, onSelect }) => (
    <div
      className={`time-slot-card ${isSelected ? 'selected' : ''} ${slot.score >= 80 ? 'excellent' : slot.score >= 60 ? 'good' : 'fair'}`}
      onClick={() => onSelect(slot)}
    >
      <div className="slot-header">
        <div className="slot-time">
          <div className="date">{formatInNepalTz(slot.start, 'EEEE, MMM dd')}</div>
          <div className="time">{slot.time} - {formatInNepalTz(slot.end, 'HH:mm')}</div>
        </div>
        <div className="slot-score">
          <span className="score">{slot.score}</span>
          <span className="score-label">Score</span>
        </div>
      </div>

      <div className="slot-details">
        <div className="recommendation">{slot.recommendation}</div>

        {slot.availability && (
          <div className="availability">
            <span className="available-count">
              {slot.availability.filter(p => p.available).length}/{slot.availability.length} available
            </span>
            <div className="participant-list">
              {slot.availability.map(participant => (
                <span
                  key={participant.id}
                  className={`participant ${participant.available ? 'available' : 'unavailable'}`}
                >
                  {participant.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScoreIndicator score={slot.score} factors={slot.factors} />
    </div>
  )

  const RecommendationCard = ({ recommendation }) => (
    <div className={`recommendation-card ${recommendation.type}`}>
      <div className="recommendation-header">
        <h4>{recommendation.title}</h4>
        {recommendation.type === 'warning' && <span className="warning-icon">⚠️</span>}
        {recommendation.type === 'optimal' && <span className="optimal-icon">⭐</span>}
      </div>
      <p>{recommendation.description}</p>
      {recommendation.reason && (
        <div className="recommendation-reason">{recommendation.reason}</div>
      )}
      {recommendation.slots && (
        <div className="alternative-slots">
          {recommendation.slots.map((slot, index) => (
            <button
              key={index}
              className="alternative-slot"
              onClick={() => handleSlotSelect(slot)}
            >
              {formatInNepalTz(slot.start, 'MMM dd, HH:mm')} (Score: {slot.score})
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const ConstraintsPanel = () => (
    <div className="constraints-panel">
      <h3>Scheduling Preferences</h3>

      <div className="constraint-group">
        <label>Meeting Duration</label>
        <select
          value={schedulingConstraints.duration}
          onChange={(e) => updateConstraints({ duration: parseInt(e.target.value) })}
        >
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      <div className="constraint-group">
        <label>Priority</label>
        <select
          value={schedulingConstraints.priority}
          onChange={(e) => updateConstraints({ priority: e.target.value })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="constraint-group">
        <label>Meeting Type</label>
        <select
          value={schedulingConstraints.meetingType}
          onChange={(e) => updateConstraints({ meetingType: e.target.value })}
        >
          <option value="interview">Interview</option>
          <option value="meeting">Meeting</option>
          <option value="presentation">Presentation</option>
          <option value="review">Review</option>
        </select>
      </div>

      <div className="constraint-group">
        <label>Date Range</label>
        <div className="date-range">
          <input
            type="date"
            value={schedulingConstraints.dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => updateConstraints({
              dateRange: {
                ...schedulingConstraints.dateRange,
                start: new Date(e.target.value)
              }
            })}
          />
          <span>to</span>
          <input
            type="date"
            value={schedulingConstraints.dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => updateConstraints({
              dateRange: {
                ...schedulingConstraints.dateRange,
                end: new Date(e.target.value)
              }
            })}
          />
        </div>
      </div>

      <button
        className="refresh-suggestions"
        onClick={generateSuggestions}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Refresh Suggestions'}
      </button>
    </div>
  )

  const AnalyticsPanel = () => analytics && (
    <div className="analytics-panel">
      <h3>Scheduling Analytics</h3>
      <div className="analytics-grid">
        <div className="metric">
          <span className="metric-value">{analytics.totalSlotsAnalyzed}</span>
          <span className="metric-label">Slots Analyzed</span>
        </div>
        <div className="metric">
          <span className="metric-value">{Math.round(analytics.averageScore)}</span>
          <span className="metric-label">Avg Score</span>
        </div>
        <div className="metric">
          <span className="metric-value">{analytics.bestTimeOfDay}</span>
          <span className="metric-label">Best Time</span>
        </div>
        <div className="metric">
          <span className="metric-value">{analytics.bestDayOfWeek}</span>
          <span className="metric-label">Best Day</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`ai-scheduling-assistant ${className}`}>
      <div className="assistant-header">
        <h2>AI Scheduling Assistant</h2>
        <div className="assistant-controls">
          <label className="auto-schedule-toggle">
            <input
              type="checkbox"
              checked={autoScheduleMode}
              onChange={(e) => setAutoScheduleMode(e.target.checked)}
            />
            Auto-schedule mode
          </label>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      <div className="assistant-content">
        <div className="left-panel">
          <ConstraintsPanel />
          <AnalyticsPanel />
        </div>

        <div className="main-panel">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Analyzing optimal scheduling options...</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <h3>AI Recommendations</h3>
              <div className="recommendations-list">
                {recommendations
                  .sort((a, b) => a.priority - b.priority)
                  .map((rec, index) => (
                    <RecommendationCard key={index} recommendation={rec} />
                  ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="suggestions-section">
              <h3>Suggested Time Slots</h3>
              <div className="suggestions-list">
                {suggestions.map((slot, index) => (
                  <TimeSlotCard
                    key={index}
                    slot={slot}
                    isSelected={selectedSlot === slot}
                    onSelect={handleSlotSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && suggestions.length === 0 && participants.length > 0 && (
            <div className="no-suggestions">
              <p>No suitable time slots found with current constraints.</p>
              <p>Try adjusting the date range or meeting duration.</p>
            </div>
          )}

          {participants.length === 0 && (
            <div className="no-participants">
              <p>Add participants to get AI scheduling suggestions.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ai-scheduling-assistant {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .assistant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .assistant-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .auto-schedule-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .assistant-content {
          display: flex;
          min-height: 600px;
        }

        .left-panel {
          width: 300px;
          border-right: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .main-panel {
          flex: 1;
          padding: 1.5rem;
        }

        .constraints-panel {
          padding: 1.5rem;
        }

        .constraints-panel h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .constraint-group {
          margin-bottom: 1rem;
        }

        .constraint-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .constraint-group select,
        .constraint-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-range input {
          flex: 1;
        }

        .refresh-suggestions {
          width: 100%;
          padding: 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .refresh-suggestions:hover {
          background: #2563eb;
        }

        .refresh-suggestions:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .analytics-panel {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .analytics-panel h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .metric-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #6b7280;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .recommendations-section,
        .suggestions-section {
          margin-bottom: 2rem;
        }

        .recommendations-section h3,
        .suggestions-section h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-card {
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .recommendation-card.optimal {
          background: #f0f9ff;
          border-left-color: #10b981;
        }

        .recommendation-card.warning {
          background: #fef3c7;
          border-left-color: #f59e0b;
        }

        .recommendation-card.insight {
          background: #ede9fe;
          border-left-color: #8b5cf6;
        }

        .recommendation-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .recommendation-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .recommendation-reason {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .alternative-slots {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .alternative-slot {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .alternative-slot:hover {
          background: #f3f4f6;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .time-slot-card {
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-slot-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .time-slot-card.selected {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .time-slot-card.excellent {
          border-left: 4px solid #10b981;
        }

        .time-slot-card.good {
          border-left: 4px solid #3b82f6;
        }

        .time-slot-card.fair {
          border-left: 4px solid #f59e0b;
        }

        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .slot-time .date {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .slot-time .time {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .slot-score {
          text-align: center;
        }

        .slot-score .score {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .slot-score .score-label {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .slot-details {
          margin-bottom: 1rem;
        }

        .recommendation {
          font-size: 0.875rem;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .availability {
          font-size: 0.875rem;
        }

        .available-count {
          color: #6b7280;
          margin-bottom: 0.5rem;
          display: block;
        }

        .participant-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .participant {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .participant.available {
          background: #d1fae5;
          color: #065f46;
        }

        .participant.unavailable {
          background: #fee2e2;
          color: #991b1b;
        }

        .score-indicator {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .score-factors {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .factor {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .factor-name {
          font-size: 0.75rem;
          color: #6b7280;
          width: 120px;
          text-transform: capitalize;
        }

        .factor-bar {
          flex: 1;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .factor-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-left: 4px solid #dc2626;
          margin: 1rem;
        }

        .no-suggestions,
        .no-participants {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .auto-schedule-panel {
          padding: 1.5rem;
          margin: 1rem 0;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
        }

        .auto-schedule-panel h3 {
          margin: 0 0 0.5rem 0;
          color: #0c4a6e;
        }

        .auto-schedule-panel p {
          margin: 0 0 1rem 0;
          color: #075985;
          font-size: 0.875rem;
        }

        .auto-schedule-btn {
          padding: 0.75rem 1.5rem;
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .auto-schedule-btn:hover {
          background: #0284c7;
        }

        .auto-schedule-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default AISchedulingAssistant