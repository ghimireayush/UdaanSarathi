// Nepali Date and Timezone Utilities for Udaan Sarathi Portal
import NepaliDate from 'nepali-date-converter'
import { format, parseISO, isValid } from 'date-fns'

// Simple timezone offset calculation for Nepal (UTC+5:45)
const NEPAL_OFFSET_MINUTES = 5 * 60 + 45

// Nepal timezone
export const NEPAL_TIMEZONE = 'Asia/Kathmandu'

// Helper function to convert UTC to Nepal time
const convertUtcToNepalTime = (date) => {
  const utcTime = new Date(date.getTime())
  // Add Nepal offset (UTC+5:45)
  utcTime.setMinutes(utcTime.getMinutes() + NEPAL_OFFSET_MINUTES)
  return utcTime
}

// Nepali month names
export const NEPALI_MONTHS = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
]

export const NEPALI_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
]

// Nepali day names
export const NEPALI_DAYS = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
]

export const NEPALI_DAYS_EN = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

/**
 * Convert English date to Nepali date
 * @param {Date|string} englishDate - English date to convert
 * @returns {Object} Nepali date object with year, month, day
 */
export const englishToNepali = (englishDate) => {
  try {
    const date = typeof englishDate === 'string' ? parseISO(englishDate) : englishDate
    if (!isValid(date)) {
      throw new Error('Invalid date provided')
    }
    
    // Convert to Nepal timezone first
    const nepalTime = convertUtcToNepalTime(date)
    const nepaliDate = new NepaliDate(nepalTime)
    
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth() + 1, // NepaliDate uses 0-based months
      day: nepaliDate.getDate(),
      dayOfWeek: nepaliDate.getDay(),
      monthName: NEPALI_MONTHS[nepaliDate.getMonth()],
      monthNameEn: NEPALI_MONTHS_EN[nepaliDate.getMonth()],
      dayName: NEPALI_DAYS[nepaliDate.getDay()],
      dayNameEn: NEPALI_DAYS_EN[nepaliDate.getDay()]
    }
  } catch (error) {
    console.error('Error converting English to Nepali date:', error)
    return null
  }
}

/**
 * Convert Nepali date to English date
 * @param {number} year - Nepali year
 * @param {number} month - Nepali month (1-12)
 * @param {number} day - Nepali day
 * @returns {Date} English date
 */
export const nepaliToEnglish = (year, month, day) => {
  try {
    const nepaliDate = new NepaliDate(year, month - 1, day) // NepaliDate uses 0-based months
    return nepaliDate.toJSDate()
  } catch (error) {
    console.error('Error converting Nepali to English date:', error)
    return null
  }
}

/**
 * Format date in Nepal timezone
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (date-fns format)
 * @returns {string} Formatted date string
 */
export const formatInNepalTz = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(parsedDate)) {
      return 'Invalid Date'
    }
    
    const nepalDate = convertUtcToNepalTime(parsedDate)
    return format(nepalDate, formatStr)
  } catch (error) {
    console.error('Error formatting date in Nepal timezone:', error)
    return 'Invalid Date'
  }
}

/**
 * Format Nepali date string
 * @param {Object} nepaliDate - Nepali date object
 * @param {string} format - Format type ('short', 'long', 'medium')
 * @param {boolean} useEnglish - Use English month names
 * @returns {string} Formatted Nepali date string
 */
export const formatNepaliDate = (nepaliDate, format = 'medium', useEnglish = false) => {
  if (!nepaliDate || !nepaliDate.year) {
    return 'Invalid Date'
  }
  
  const { year, month, day, monthName, monthNameEn, dayName, dayNameEn } = nepaliDate
  
  switch (format) {
    case 'short':
      return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
    case 'long':
      return useEnglish 
        ? `${dayNameEn}, ${monthNameEn} ${day}, ${year}`
        : `${dayName}, ${monthName} ${day}, ${year}`
    case 'medium':
    default:
      return useEnglish
        ? `${monthNameEn} ${day}, ${year}`
        : `${monthName} ${day}, ${year}`
  }
}

/**
 * Get current Nepal time
 * @returns {Date} Current date in Nepal timezone
 */
export const getCurrentNepalTime = () => {
  return convertUtcToNepalTime(new Date())
}

/**
 * Convert UTC time to Nepal time
 * @param {Date|string} utcDate - UTC date
 * @returns {Date} Date in Nepal timezone
 */
export const utcToNepalTime = (utcDate) => {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate
  return convertUtcToNepalTime(date)
}

/**
 * Convert Nepal time to UTC
 * @param {Date} nepalDate - Date in Nepal timezone
 * @returns {Date} UTC date
 */
export const nepalTimeToUtc = (nepalDate) => {
  const utcTime = new Date(nepalDate.getTime())
  // Subtract Nepal offset to get UTC
  utcTime.setMinutes(utcTime.getMinutes() - NEPAL_OFFSET_MINUTES)
  return utcTime
}

/**
 * Get today's date in both English and Nepali
 * @returns {Object} Object containing both English and Nepali dates
 */
export const getToday = () => {
  const englishDate = getCurrentNepalTime()
  const nepaliDate = englishToNepali(englishDate)
  
  return {
    english: englishDate,
    nepali: nepaliDate,
    formatted: {
      english: formatInNepalTz(englishDate, 'yyyy-MM-dd'),
      nepali: formatNepaliDate(nepaliDate, 'medium', true)
    }
  }
}

/**
 * Check if a date is today (in Nepal timezone)
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = getCurrentNepalTime()
  const checkDate = typeof date === 'string' ? parseISO(date) : date
  const nepalCheckDate = convertUtcToNepalTime(checkDate)
  
  return format(today, 'yyyy-MM-dd') === format(nepalCheckDate, 'yyyy-MM-dd')
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @param {boolean} useNepali - Use Nepali labels
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date, useNepali = false) => {
  const now = getCurrentNepalTime()
  const targetDate = typeof date === 'string' ? parseISO(date) : date
  const nepalTargetDate = convertUtcToNepalTime(targetDate)
  
  const diffMs = nepalTargetDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  const labels = useNepali ? {
    ago: 'अगाडि',
    in: 'मा',
    minutes: 'मिनेट',
    hours: 'घण्टा',
    days: 'दिन',
    just_now: 'अहिले',
    today: 'आज',
    yesterday: 'हिजो',
    tomorrow: 'भोलि'
  } : {
    ago: 'ago',
    in: 'in',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    just_now: 'just now',
    today: 'today',
    yesterday: 'yesterday',
    tomorrow: 'tomorrow'
  }
  
  if (Math.abs(diffMinutes) < 1) {
    return labels.just_now
  } else if (Math.abs(diffDays) === 0) {
    return labels.today
  } else if (diffDays === -1) {
    return labels.yesterday
  } else if (diffDays === 1) {
    return labels.tomorrow
  } else if (Math.abs(diffDays) < 1) {
    const hours = Math.abs(diffHours)
    if (hours < 1) {
      const minutes = Math.abs(diffMinutes)
      return diffMs > 0 
        ? `${labels.in} ${minutes} ${labels.minutes}`
        : `${minutes} ${labels.minutes} ${labels.ago}`
    }
    return diffMs > 0 
      ? `${labels.in} ${hours} ${labels.hours}`
      : `${hours} ${labels.hours} ${labels.ago}`
  } else {
    const days = Math.abs(diffDays)
    return diffMs > 0 
      ? `${labels.in} ${days} ${labels.days}`
      : `${days} ${labels.days} ${labels.ago}`
  }
}

/**
 * Generate calendar data for a given month (Nepali or English)
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {boolean} isNepali - Whether to generate Nepali calendar
 * @returns {Object} Calendar data
 */
export const generateCalendarData = (year, month, isNepali = false) => {
  try {
    if (isNepali) {
      // Generate Nepali calendar
      const firstDay = nepaliToEnglish(year, month, 1)
      const nepaliDate = new NepaliDate(year, month - 1, 1)
      const daysInMonth = nepaliDate.getDaysInMonth()
      
      return {
        year,
        month,
        monthName: NEPALI_MONTHS_EN[month - 1],
        monthNameNepali: NEPALI_MONTHS[month - 1],
        daysInMonth,
        firstDay: firstDay ? firstDay.getDay() : 0,
        isNepali: true
      }
    } else {
      // Generate English calendar
      const firstDay = new Date(year, month - 1, 1)
      const daysInMonth = new Date(year, month, 0).getDate()
      
      return {
        year,
        month,
        monthName: format(firstDay, 'MMMM'),
        daysInMonth,
        firstDay: firstDay.getDay(),
        isNepali: false
      }
    }
  } catch (error) {
    console.error('Error generating calendar data:', error)
    return null
  }
}

export default {
  englishToNepali,
  nepaliToEnglish,
  formatInNepalTz,
  formatNepaliDate,
  getCurrentNepalTime,
  utcToNepalTime,
  nepalTimeToUtc,
  getToday,
  isToday,
  getRelativeTime,
  generateCalendarData,
  NEPAL_TIMEZONE,
  NEPALI_MONTHS,
  NEPALI_MONTHS_EN,
  NEPALI_DAYS,
  NEPALI_DAYS_EN
}