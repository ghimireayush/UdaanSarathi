// Dual Format Date Display Component for Udaan Sarathi Portal
import { Calendar, Clock } from 'lucide-react'
import { 
  englishToNepali, 
  formatNepaliDate, 
  formatInNepalTz,
  getRelativeTime,
  isToday
} from '../utils/nepaliDate.js'

const DateDisplay = ({ 
  date, 
  showNepali = true, 
  showTime = false, 
  showRelative = false,
  format = 'medium',
  className = '',
  iconClassName = 'w-4 h-4',
  showIcon = true
}) => {
  if (!date) {
    return <span className={`text-gray-400 ${className}`}>No date</span>
  }

  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const nepaliDate = englishToNepali(parsedDate)
  const isTodayDate = isToday(parsedDate)

  const formatEnglishDate = () => {
    if (showTime) {
      return formatInNepalTz(parsedDate, 'MMM dd, yyyy HH:mm')
    }
    
    switch (format) {
      case 'short':
        return formatInNepalTz(parsedDate, 'MM/dd/yyyy')
      case 'long':
        return formatInNepalTz(parsedDate, 'EEEE, MMMM dd, yyyy')
      case 'medium':
      default:
        return formatInNepalTz(parsedDate, 'MMM dd, yyyy')
    }
  }

  const englishFormatted = formatEnglishDate()
  const nepaliFormatted = nepaliDate ? formatNepaliDate(nepaliDate, format, true) : null
  const relativeTime = showRelative ? getRelativeTime(parsedDate) : null

  return (
    <div className={`flex items-start space-x-2 ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 mt-0.5">
          {showTime ? (
            <Clock className={`text-gray-400 ${iconClassName}`} />
          ) : (
            <Calendar className={`text-gray-400 ${iconClassName}`} />
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col space-y-1">
          {/* English Date */}
          <div className={`text-sm ${isTodayDate ? 'font-medium text-primary-700' : 'text-gray-900'}`}>
            {englishFormatted}
            {isTodayDate && (
              <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </div>
          
          {/* Nepali Date */}
          {showNepali && nepaliFormatted && (
            <div className="text-xs text-gray-600">
              {nepaliFormatted}
            </div>
          )}
          
          {/* Relative Time */}
          {showRelative && relativeTime && (
            <div className="text-xs text-gray-500">
              {relativeTime}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Time Display Component
export const TimeDisplay = ({ 
  date, 
  showNepali = true, 
  showSeconds = false,
  className = ''
}) => {
  if (!date) {
    return <span className={`text-gray-400 ${className}`}>--:--</span>
  }

  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const timeFormat = showSeconds ? 'HH:mm:ss' : 'HH:mm'
  const formattedTime = formatInNepalTz(parsedDate, timeFormat)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-gray-400" />
      <div>
        <span className="text-sm font-medium text-gray-900">
          {formattedTime}
        </span>
        <span className="text-xs text-gray-500 ml-1">
          NPT
        </span>
      </div>
    </div>
  )
}

// Date Range Display Component
export const DateRangeDisplay = ({ 
  startDate, 
  endDate, 
  showNepali = true,
  className = ''
}) => {
  if (!startDate || !endDate) {
    return <span className={`text-gray-400 ${className}`}>No date range</span>
  }

  const startNepali = englishToNepali(startDate)
  const endNepali = englishToNepali(endDate)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Calendar className="w-4 h-4 text-gray-400" />
      <div className="flex flex-col space-y-1">
        <div className="text-sm text-gray-900">
          {formatInNepalTz(startDate, 'MMM dd')} - {formatInNepalTz(endDate, 'MMM dd, yyyy')}
        </div>
        {showNepali && startNepali && endNepali && (
          <div className="text-xs text-gray-600">
            {formatNepaliDate(startNepali, 'short', true)} - {formatNepaliDate(endNepali, 'short', true)}
          </div>
        )}
      </div>
    </div>
  )
}

// Compact Date Display (for tables, cards)
export const CompactDateDisplay = ({ 
  date, 
  showNepali = false,
  showRelative = true,
  className = ''
}) => {
  if (!date) {
    return <span className={`text-gray-400 text-xs ${className}`}>--</span>
  }

  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const nepaliDate = showNepali ? englishToNepali(parsedDate) : null
  const relativeTime = showRelative ? getRelativeTime(parsedDate) : null

  return (
    <div className={`text-xs ${className}`}>
      <div className="text-gray-900">
        {formatInNepalTz(parsedDate, 'MMM dd, yyyy')}
      </div>
      {showNepali && nepaliDate && (
        <div className="text-gray-500">
          {formatNepaliDate(nepaliDate, 'short', true)}
        </div>
      )}
      {showRelative && relativeTime && (
        <div className="text-gray-500 mt-0.5">
          {relativeTime}
        </div>
      )}
    </div>
  )
}

export default DateDisplay