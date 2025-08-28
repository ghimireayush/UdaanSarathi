// Nepali Calendar Component for Udaan Sarathi Portal
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { 
  englishToNepali, 
  nepaliToEnglish, 
  formatNepaliDate, 
  generateCalendarData,
  getCurrentNepalTime,
  NEPALI_MONTHS_EN,
  NEPALI_DAYS_EN
} from '../utils/nepaliDate.js'

const NepaliCalendar = ({ 
  selectedDate = null, 
  onDateSelect = () => {}, 
  showBothCalendars = true,
  defaultToNepali = true,
  minDate = null,
  maxDate = null,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(getCurrentNepalTime())
  const [viewType, setViewType] = useState(defaultToNepali ? 'nepali' : 'english')
  const [nepaliViewDate, setNepaliViewDate] = useState(() => {
    const today = englishToNepali(getCurrentNepalTime())
    return { year: today.year, month: today.month }
  })
  const [englishViewDate, setEnglishViewDate] = useState(() => {
    const today = getCurrentNepalTime()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })

  const today = englishToNepali(getCurrentNepalTime())
  const selectedNepali = selectedDate ? englishToNepali(selectedDate) : null

  // Generate calendar data based on view type
  const calendarData = viewType === 'nepali' 
    ? generateCalendarData(nepaliViewDate.year, nepaliViewDate.month, true)
    : generateCalendarData(englishViewDate.year, englishViewDate.month, false)

  const handlePrevMonth = () => {
    if (viewType === 'nepali') {
      setNepaliViewDate(prev => {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 }
        }
        return { ...prev, month: prev.month - 1 }
      })
    } else {
      setEnglishViewDate(prev => {
        if (prev.month === 1) {
          return { year: prev.year - 1, month: 12 }
        }
        return { ...prev, month: prev.month - 1 }
      })
    }
  }

  const handleNextMonth = () => {
    if (viewType === 'nepali') {
      setNepaliViewDate(prev => {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 }
        }
        return { ...prev, month: prev.month + 1 }
      })
    } else {
      setEnglishViewDate(prev => {
        if (prev.month === 12) {
          return { year: prev.year + 1, month: 1 }
        }
        return { ...prev, month: prev.month + 1 }
      })
    }
  }

  const handleDateClick = (day) => {
    let selectedDate
    
    if (viewType === 'nepali') {
      selectedDate = nepaliToEnglish(nepaliViewDate.year, nepaliViewDate.month, day)
    } else {
      selectedDate = new Date(englishViewDate.year, englishViewDate.month - 1, day)
    }
    
    if (selectedDate) {
      onDateSelect(selectedDate)
    }
  }

  const isDateDisabled = (day) => {
    let date
    
    if (viewType === 'nepali') {
      date = nepaliToEnglish(nepaliViewDate.year, nepaliViewDate.month, day)
    } else {
      date = new Date(englishViewDate.year, englishViewDate.month - 1, day)
    }
    
    if (!date) return true
    
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    
    return false
  }

  const isDateSelected = (day) => {
    if (!selectedDate) return false
    
    if (viewType === 'nepali') {
      return selectedNepali && 
             selectedNepali.year === nepaliViewDate.year &&
             selectedNepali.month === nepaliViewDate.month &&
             selectedNepali.day === day
    } else {
      return selectedDate.getFullYear() === englishViewDate.year &&
             selectedDate.getMonth() + 1 === englishViewDate.month &&
             selectedDate.getDate() === day
    }
  }

  const isToday = (day) => {
    if (viewType === 'nepali') {
      return today.year === nepaliViewDate.year &&
             today.month === nepaliViewDate.month &&
             today.day === day
    } else {
      const todayEnglish = getCurrentNepalTime()
      return todayEnglish.getFullYear() === englishViewDate.year &&
             todayEnglish.getMonth() + 1 === englishViewDate.month &&
             todayEnglish.getDate() === day
    }
  }

  const renderCalendarGrid = () => {
    if (!calendarData) return null

    const { daysInMonth, firstDay } = calendarData
    const days = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const disabled = isDateDisabled(day)
      const selected = isDateSelected(day)
      const todayDate = isToday(day)
      
      days.push(
        <button
          key={day}
          onClick={() => !disabled && handleDateClick(day)}
          disabled={disabled}
          className={`
            h-8 w-8 rounded text-sm font-medium transition-colors
            ${disabled 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
            }
            ${selected 
              ? 'bg-primary-600 text-white hover:bg-primary-700' 
              : ''
            }
            ${todayDate && !selected 
              ? 'bg-primary-100 text-primary-700 font-semibold' 
              : ''
            }
          `}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Calendar Type Toggle */}
      {showBothCalendars && (
        <div className="flex items-center justify-center mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewType('nepali')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'nepali'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nepali Calendar
            </button>
            <button
              onClick={() => setViewType('english')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewType === 'english'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              English Calendar
            </button>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {calendarData?.monthName} {calendarData?.year}
          </h3>
          {viewType === 'nepali' && (
            <p className="text-sm text-gray-500">
              {calendarData?.monthNameNepali} {calendarData?.year}
            </p>
          )}
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {NEPALI_DAYS_EN.map(day => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500">
              {day.substring(0, 3)}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarGrid()}
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Selected Date:</span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="font-medium text-gray-900">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              {selectedNepali && (
                <div className="text-gray-600">
                  {formatNepaliDate(selectedNepali, 'long', true)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NepaliCalendar