import React, { useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatInNepalTz, getCurrentNepalTime, englishToNepali, formatNepaliDate } from '../utils/nepaliDate'
import { Calendar, Clock, MapPin, Users, Filter, Download, Plus } from 'lucide-react'

const EnhancedCalendar = ({
  events = [],
  onEventClick,
  onDateSelect,
  onEventDrop,
  onEventResize,
  className = '',
  showNepaliDates = true,
  allowEditing = true,
  filters = {},
  onFiltersChange,
  viewMode = 'month'
}) => {
  const [currentView, setCurrentView] = useState(viewMode)
  const [selectedDate, setSelectedDate] = useState(null)
  const [filteredEvents, setFilteredEvents] = useState(events)
  const [calendarApi, setCalendarApi] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [nepaliDateInfo, setNepaliDateInfo] = useState(null)

  // Calendar configuration
  const calendarConfig = useMemo(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: currentView === 'month' ? 'dayGridMonth' : 
                currentView === 'week' ? 'timeGridWeek' : 'timeGridDay',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    editable: allowEditing,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    nowIndicator: true,
    eventDisplay: 'block',
    displayEventTime: true,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    // Nepal timezone
    timeZone: 'Asia/Kathmandu',
    locale: 'en',
    firstDay: 0, // Sunday
    businessHours: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Sunday to Saturday
      startTime: '09:00',
      endTime: '18:00'
    }
  }), [currentView, allowEditing])

  // Filter events based on current filters
  useEffect(() => {
    let filtered = [...events]

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(event => filters.status.includes(event.status))
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(event => filters.type.includes(event.type))
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start)
        return (!start || eventDate >= new Date(start)) && 
               (!end || eventDate <= new Date(end))
      })
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.location?.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredEvents(filtered)
  }, [events, filters])

  // Update Nepali date info when date changes
  useEffect(() => {
    if (selectedDate) {
      const nepaliDate = englishToNepali(selectedDate)
      setNepaliDateInfo(nepaliDate)
    }
  }, [selectedDate])

  // Calendar event handlers
  const handleDateSelect = useCallback((selectInfo) => {
    setSelectedDate(selectInfo.start)
    onDateSelect?.(selectInfo)
  }, [onDateSelect])

  const handleEventClick = useCallback((clickInfo) => {
    onEventClick?.(clickInfo.event, clickInfo)
  }, [onEventClick])

  const handleEventDrop = useCallback((dropInfo) => {
    onEventDrop?.(dropInfo.event, dropInfo)
  }, [onEventDrop])

  const handleEventResize = useCallback((resizeInfo) => {
    onEventResize?.(resizeInfo.event, resizeInfo)
  }, [onEventResize])

  const handleViewChange = useCallback((view) => {
    setCurrentView(view.type.replace('dayGrid', '').replace('timeGrid', '').toLowerCase())
  }, [])

  // Transform events for FullCalendar
  const calendarEvents = useMemo(() => {
    return filteredEvents.map(event => ({
      ...event,
      id: event.id || `event_${Date.now()}_${Math.random()}`,
      className: `event-${event.type || 'default'} event-status-${event.status || 'scheduled'}`,
      extendedProps: {
        ...event.extendedProps,
        type: event.type,
        status: event.status,
        participants: event.participants,
        location: event.location,
        description: event.description
      }
    }))
  }, [filteredEvents])

  // Export calendar data
  const handleExport = useCallback(() => {
    const exportData = filteredEvents.map(event => ({
      title: event.title,
      start: formatInNepalTz(event.start, 'yyyy-MM-dd HH:mm:ss'),
      end: event.end ? formatInNepalTz(event.end, 'yyyy-MM-dd HH:mm:ss') : '',
      type: event.type,
      status: event.status,
      location: event.location,
      description: event.description,
      participants: Array.isArray(event.participants) ? event.participants.join(', ') : event.participants
    }))

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(val => `"${val || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendar_export_${formatInNepalTz(getCurrentNepalTime(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredEvents])

  // Custom event content renderer
  const renderEventContent = useCallback((eventInfo) => {
    const { event } = eventInfo
    const { extendedProps } = event
    
    return (
      <div className="custom-event-content">
        <div className="event-time">
          {formatInNepalTz(event.start, 'HH:mm')}
        </div>
        <div className="event-title">{event.title}</div>
        {extendedProps.location && (
          <div className="event-location">
            <MapPin size={12} />
            {extendedProps.location}
          </div>
        )}
        {extendedProps.participants && (
          <div className="event-participants">
            <Users size={12} />
            {Array.isArray(extendedProps.participants) 
              ? extendedProps.participants.length 
              : extendedProps.participants}
          </div>
        )}
      </div>
    )
  }, [])

  // Day cell content renderer for Nepali dates
  const renderDayCellContent = useCallback((dayInfo) => {
    if (!showNepaliDates) return null

    const nepaliDate = englishToNepali(dayInfo.date)
    if (!nepaliDate) return null

    return (
      <div className="nepali-date-overlay">
        <div className="english-date">{dayInfo.dayNumberText}</div>
        <div className="nepali-date">{nepaliDate.day}</div>
      </div>
    )
  }, [showNepaliDates])

  const FilterPanel = () => (
    <div className="calendar-filters">
      <div className="filter-group">
        <label>Search Events</label>
        <input
          type="text"
          placeholder="Search by title, description, or location..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange?.({ ...filters, search: e.target.value })}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label>Event Type</label>
        <select
          multiple
          value={filters.type || []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value)
            onFiltersChange?.({ ...filters, type: values })
          }}
          className="filter-select"
        >
          <option value="interview">Interview</option>
          <option value="meeting">Meeting</option>
          <option value="presentation">Presentation</option>
          <option value="review">Review</option>
          <option value="training">Training</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Status</label>
        <select
          multiple
          value={filters.status || []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value)
            onFiltersChange?.({ ...filters, status: values })
          }}
          className="filter-select"
        >
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Date Range</label>
        <div className="date-range-inputs">
          <input
            type="date"
            value={filters.dateRange?.start || ''}
            onChange={(e) => onFiltersChange?.({
              ...filters,
              dateRange: { ...filters.dateRange, start: e.target.value }
            })}
            className="filter-input"
          />
          <span>to</span>
          <input
            type="date"
            value={filters.dateRange?.end || ''}
            onChange={(e) => onFiltersChange?.({
              ...filters,
              dateRange: { ...filters.dateRange, end: e.target.value }
            })}
            className="filter-input"
          />
        </div>
      </div>

      <div className="filter-actions">
        <button
          onClick={() => onFiltersChange?.({})}
          className="clear-filters-btn"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )

  return (
    <div className={`enhanced-calendar ${className}`}>
      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar size={24} />
          <h2>Calendar</h2>
          {showNepaliDates && nepaliDateInfo && (
            <div className="nepali-date-display">
              <span className="nepali-date-text">
                {formatNepaliDate(nepaliDateInfo, 'long', true)}
              </span>
            </div>
          )}
        </div>

        <div className="calendar-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>
          
          <button onClick={handleExport} className="export-btn">
            <Download size={16} />
            Export
          </button>

          <button
            onClick={() => onDateSelect?.(getCurrentNepalTime())}
            className="add-event-btn"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {showFilters && <FilterPanel />}

      <div className="calendar-stats">
        <div className="stat">
          <span className="stat-value">{filteredEvents.length}</span>
          <span className="stat-label">Total Events</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {filteredEvents.filter(e => e.status === 'scheduled').length}
          </span>
          <span className="stat-label">Scheduled</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {filteredEvents.filter(e => e.status === 'completed').length}
          </span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <div className="calendar-container">
        <FullCalendar
          {...calendarConfig}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          viewDidMount={(info) => setCalendarApi(info.view.calendar)}
          datesSet={handleViewChange}
          eventContent={renderEventContent}
          dayCellContent={renderDayCellContent}
        />
      </div>

      <style jsx>{`
        .enhanced-calendar {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .calendar-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .calendar-title h2 {
          margin: 0;
          color: #1f2937;
        }

        .nepali-date-display {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .calendar-actions {
          display: flex;
          gap: 0.5rem;
        }

        .filter-toggle,
        .export-btn,
        .add-event-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .filter-toggle:hover,
        .export-btn:hover,
        .add-event-btn:hover {
          background: #f3f4f6;
        }

        .filter-toggle.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .add-event-btn {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .add-event-btn:hover {
          background: #059669;
        }

        .calendar-filters {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .filter-group {
          margin-bottom: 1rem;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .filter-input,
        .filter-select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .filter-select {
          height: auto;
          min-height: 2.5rem;
        }

        .date-range-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .date-range-inputs input {
          flex: 1;
        }

        .filter-actions {
          margin-top: 1rem;
        }

        .clear-filters-btn {
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .clear-filters-btn:hover {
          background: #dc2626;
        }

        .calendar-stats {
          display: flex;
          gap: 2rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #3b82f6;
        }

        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .calendar-container {
          padding: 1.5rem;
        }

        /* Custom event styles */
        :global(.fc-event.event-interview) {
          background-color: #3b82f6;
          border-color: #2563eb;
        }

        :global(.fc-event.event-meeting) {
          background-color: #10b981;
          border-color: #059669;
        }

        :global(.fc-event.event-presentation) {
          background-color: #f59e0b;
          border-color: #d97706;
        }

        :global(.fc-event.event-review) {
          background-color: #8b5cf6;
          border-color: #7c3aed;
        }

        :global(.fc-event.event-status-cancelled) {
          opacity: 0.6;
          text-decoration: line-through;
        }

        :global(.fc-event.event-status-completed) {
          background-color: #6b7280;
          border-color: #4b5563;
        }

        .custom-event-content {
          padding: 0.25rem;
          font-size: 0.75rem;
        }

        .event-time {
          font-weight: bold;
          margin-bottom: 0.125rem;
        }

        .event-title {
          margin-bottom: 0.125rem;
        }

        .event-location,
        .event-participants {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.625rem;
        }

        .nepali-date-overlay {
          position: relative;
        }

        .english-date {
          font-size: 1rem;
          font-weight: bold;
        }

        .nepali-date {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.125rem;
        }

        /* FullCalendar customizations */
        :global(.fc-toolbar-title) {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
        }

        :global(.fc-button) {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }

        :global(.fc-button:hover) {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }

        :global(.fc-today-button) {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }

        :global(.fc-today-button:hover) {
          background-color: #059669 !important;
          border-color: #059669 !important;
        }

        :global(.fc-daygrid-day.fc-day-today) {
          background-color: #eff6ff !important;
        }

        :global(.fc-timegrid-slot-minor) {
          border-top-style: dotted !important;
        }

        :global(.fc-event-draggable) {
          cursor: move;
        }

        :global(.fc-event-resizable) {
          cursor: ns-resize;
        }
      `}</style>
    </div>
  )
}

export default EnhancedCalendar