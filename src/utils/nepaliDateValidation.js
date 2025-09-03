// Nepali Date Validation Utilities
import NepaliDate from 'nepali-date-converter'
import { englishToNepali, nepaliToEnglish, formatNepaliDate } from './nepaliDate'

/**
 * Comprehensive Nepali date validation utilities
 */
export class NepaliDateValidator {
  constructor() {
    // Nepali calendar constraints
    this.MIN_NEPALI_YEAR = 1970
    this.MAX_NEPALI_YEAR = 2100
    
    // Days in each Nepali month (varies by year)
    this.nepaliMonthDays = {
      // Standard days, but can vary
      1: 31, 2: 32, 3: 31, 4: 32, 5: 31, 6: 30,
      7: 30, 8: 30, 9: 29, 10: 30, 11: 29, 12: 30
    }
  }

  /**
   * Validate Nepali date components
   * @param {number} year - Nepali year
   * @param {number} month - Nepali month (1-12)
   * @param {number} day - Nepali day
   * @returns {Object} Validation result
   */
  validateNepaliDate(year, month, day) {
    const errors = []
    const warnings = []

    // Year validation
    if (!year || !Number.isInteger(year)) {
      errors.push('Year must be a valid integer')
    } else if (year < this.MIN_NEPALI_YEAR) {
      errors.push(`Year must be ${this.MIN_NEPALI_YEAR} or later`)
    } else if (year > this.MAX_NEPALI_YEAR) {
      warnings.push(`Year ${year} is beyond typical range (${this.MAX_NEPALI_YEAR})`)
    }

    // Month validation
    if (!month || !Number.isInteger(month)) {
      errors.push('Month must be a valid integer')
    } else if (month < 1 || month > 12) {
      errors.push('Month must be between 1 and 12')
    }

    // Day validation
    if (!day || !Number.isInteger(day)) {
      errors.push('Day must be a valid integer')
    } else if (day < 1) {
      errors.push('Day must be 1 or greater')
    } else if (month >= 1 && month <= 12) {
      // Check maximum days for the month
      const maxDays = this.getDaysInNepaliMonth(year, month)
      if (day > maxDays) {
        errors.push(`Day cannot exceed ${maxDays} for month ${month} in year ${year}`)
      }
    }

    // Try to create actual NepaliDate to verify
    let isValidDate = false
    let convertedEnglishDate = null
    
    if (errors.length === 0) {
      try {
        const nepaliDate = new NepaliDate(year, month - 1, day) // NepaliDate uses 0-based months
        convertedEnglishDate = nepaliDate.toJsDate()
        isValidDate = true
      } catch (error) {
        errors.push('Invalid Nepali date combination')
        isValidDate = false
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isValidDate,
      convertedEnglishDate,
      formattedNepali: isValidDate ? formatNepaliDate({ year, month, day }, 'long', true) : null
    }
  }

  /**
   * Validate English date for Nepali conversion
   * @param {Date|string} englishDate - English date
   * @returns {Object} Validation result
   */
  validateEnglishDate(englishDate) {
    const errors = []
    const warnings = []

    let date
    try {
      date = typeof englishDate === 'string' ? new Date(englishDate) : englishDate
    } catch (error) {
      errors.push('Invalid date format')
      return { isValid: false, errors, warnings }
    }

    if (!date || isNaN(date.getTime())) {
      errors.push('Invalid date')
      return { isValid: false, errors, warnings }
    }

    // Check if date is too far in the past or future
    const minDate = new Date('1900-01-01')
    const maxDate = new Date('2100-12-31')

    if (date < minDate) {
      errors.push('Date is too far in the past for reliable Nepali conversion')
    }

    if (date > maxDate) {
      warnings.push('Date is far in the future, conversion may be less accurate')
    }

    // Try Nepali conversion
    let nepaliDate = null
    let conversionError = null

    try {
      nepaliDate = englishToNepali(date)
      if (!nepaliDate) {
        conversionError = 'Failed to convert to Nepali date'
      }
    } catch (error) {
      conversionError = error.message
    }

    if (conversionError) {
      errors.push(conversionError)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      englishDate: date,
      nepaliDate,
      formattedEnglish: date.toISOString().split('T')[0],
      formattedNepali: nepaliDate ? formatNepaliDate(nepaliDate, 'long', true) : null
    }
  }

  /**
   * Get number of days in a Nepali month
   * @param {number} year - Nepali year
   * @param {number} month - Nepali month (1-12)
   * @returns {number} Number of days
   */
  getDaysInNepaliMonth(year, month) {
    try {
      // Create NepaliDate for the first day of the month
      const nepaliDate = new NepaliDate(year, month - 1, 1)
      
      // Get the actual number of days in this month
      // This accounts for variations in Nepali calendar
      return nepaliDate.getDaysInMonth()
    } catch (error) {
      // Fallback to standard days
      return this.nepaliMonthDays[month] || 30
    }
  }

  /**
   * Validate date range in Nepali calendar
   * @param {Object} startDate - Start date {year, month, day}
   * @param {Object} endDate - End date {year, month, day}
   * @returns {Object} Validation result
   */
  validateNepaliDateRange(startDate, endDate) {
    const errors = []
    const warnings = []

    // Validate individual dates
    const startValidation = this.validateNepaliDate(startDate.year, startDate.month, startDate.day)
    const endValidation = this.validateNepaliDate(endDate.year, endDate.month, endDate.day)

    if (!startValidation.isValid) {
      errors.push(`Start date invalid: ${startValidation.errors.join(', ')}`)
    }

    if (!endValidation.isValid) {
      errors.push(`End date invalid: ${endValidation.errors.join(', ')}`)
    }

    // Check date order if both dates are valid
    if (startValidation.isValid && endValidation.isValid) {
      const startEnglish = startValidation.convertedEnglishDate
      const endEnglish = endValidation.convertedEnglishDate

      if (startEnglish >= endEnglish) {
        errors.push('Start date must be before end date')
      }

      // Check for reasonable range
      const daysDiff = Math.ceil((endEnglish - startEnglish) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365 * 5) {
        warnings.push('Date range spans more than 5 years')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      startValidation,
      endValidation,
      daysDifference: startValidation.convertedEnglishDate && endValidation.convertedEnglishDate
        ? Math.ceil((endValidation.convertedEnglishDate - startValidation.convertedEnglishDate) / (1000 * 60 * 60 * 24))
        : null
    }
  }

  /**
   * Validate and normalize date string input
   * @param {string} dateString - Date string in various formats
   * @param {string} format - Expected format ('nepali' or 'english')
   * @returns {Object} Validation and normalization result
   */
  validateAndNormalizeDateString(dateString, format = 'auto') {
    const errors = []
    const warnings = []

    if (!dateString || typeof dateString !== 'string') {
      errors.push('Date string is required')
      return { isValid: false, errors, warnings }
    }

    const trimmed = dateString.trim()
    
    // Common date patterns
    const patterns = {
      nepali: [
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
      ],
      english: [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // ISO format YYYY-MM-DD
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      ]
    }

    let detectedFormat = format
    let matches = null

    // Auto-detect format if needed
    if (format === 'auto') {
      // Try English patterns first
      for (const pattern of patterns.english) {
        matches = trimmed.match(pattern)
        if (matches) {
          detectedFormat = 'english'
          break
        }
      }

      // Try Nepali patterns if English didn't match
      if (!matches) {
        for (const pattern of patterns.nepali) {
          matches = trimmed.match(pattern)
          if (matches) {
            detectedFormat = 'nepali'
            break
          }
        }
      }
    } else {
      // Use specified format
      const formatPatterns = patterns[detectedFormat] || patterns.english
      for (const pattern of formatPatterns) {
        matches = trimmed.match(pattern)
        if (matches) break
      }
    }

    if (!matches) {
      errors.push(`Invalid date format. Expected formats: YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY`)
      return { isValid: false, errors, warnings, detectedFormat }
    }

    // Parse components based on detected format and pattern
    let year, month, day
    
    if (matches[1].length === 4) {
      // YYYY-MM-DD format
      year = parseInt(matches[1])
      month = parseInt(matches[2])
      day = parseInt(matches[3])
    } else {
      // MM/DD/YYYY or DD/MM/YYYY format
      // Assume MM/DD/YYYY for English, DD/MM/YYYY for Nepali
      if (detectedFormat === 'english') {
        month = parseInt(matches[1])
        day = parseInt(matches[2])
        year = parseInt(matches[3])
      } else {
        day = parseInt(matches[1])
        month = parseInt(matches[2])
        year = parseInt(matches[3])
      }
    }

    // Validate parsed components
    let validation
    if (detectedFormat === 'nepali') {
      validation = this.validateNepaliDate(year, month, day)
    } else {
      // Create English date and validate
      const englishDate = new Date(year, month - 1, day)
      validation = this.validateEnglishDate(englishDate)
    }

    return {
      isValid: validation.isValid && errors.length === 0,
      errors: [...errors, ...validation.errors],
      warnings: [...warnings, ...validation.warnings],
      detectedFormat,
      parsed: { year, month, day },
      normalized: {
        english: validation.englishDate || validation.convertedEnglishDate,
        nepali: validation.nepaliDate,
        formatted: {
          english: validation.formattedEnglish,
          nepali: validation.formattedNepali
        }
      }
    }
  }

  /**
   * Check if a date falls on a weekend or holiday
   * @param {Object} nepaliDate - Nepali date {year, month, day}
   * @returns {Object} Weekend/holiday information
   */
  checkWeekendAndHolidays(nepaliDate) {
    const validation = this.validateNepaliDate(nepaliDate.year, nepaliDate.month, nepaliDate.day)
    
    if (!validation.isValid) {
      return { isWeekend: false, isHoliday: false, errors: validation.errors }
    }

    const englishDate = validation.convertedEnglishDate
    const dayOfWeek = englishDate.getDay() // 0 = Sunday, 6 = Saturday

    // In Nepal, Saturday is the main weekend day
    const isWeekend = dayOfWeek === 6 // Saturday

    // Basic holiday checking (can be extended with actual holiday data)
    const isHoliday = this.checkNepaliHolidays(nepaliDate)

    return {
      isWeekend,
      isHoliday,
      dayOfWeek,
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      isWorkingDay: !isWeekend && !isHoliday
    }
  }

  /**
   * Basic Nepali holiday checking
   * @param {Object} nepaliDate - Nepali date {year, month, day}
   * @returns {boolean} True if it's a known holiday
   */
  checkNepaliHolidays(nepaliDate) {
    // Basic holidays - in production, this would use a comprehensive holiday database
    const commonHolidays = [
      { month: 1, day: 1 }, // Nepali New Year
      { month: 1, day: 11 }, // Democracy Day
      { month: 4, day: 15 }, // Constitution Day
      // Add more holidays as needed
    ]

    return commonHolidays.some(holiday => 
      holiday.month === nepaliDate.month && holiday.day === nepaliDate.day
    )
  }

  /**
   * Get validation summary for multiple dates
   * @param {Array} dates - Array of date objects or strings
   * @param {string} format - Date format
   * @returns {Object} Validation summary
   */
  validateMultipleDates(dates, format = 'auto') {
    const results = dates.map((date, index) => {
      let validation
      
      if (typeof date === 'string') {
        validation = this.validateAndNormalizeDateString(date, format)
      } else if (date.year && date.month && date.day) {
        validation = this.validateNepaliDate(date.year, date.month, date.day)
      } else {
        validation = this.validateEnglishDate(date)
      }

      return {
        index,
        originalDate: date,
        validation
      }
    })

    const validCount = results.filter(r => r.validation.isValid).length
    const invalidCount = results.length - validCount
    const allErrors = results.flatMap(r => r.validation.errors)
    const allWarnings = results.flatMap(r => r.validation.warnings)

    return {
      totalDates: dates.length,
      validCount,
      invalidCount,
      validationRate: (validCount / dates.length * 100).toFixed(1),
      results,
      summary: {
        allValid: invalidCount === 0,
        hasErrors: allErrors.length > 0,
        hasWarnings: allWarnings.length > 0,
        commonErrors: this.getCommonErrors(allErrors),
        commonWarnings: this.getCommonWarnings(allWarnings)
      }
    }
  }

  // Helper methods
  getCommonErrors(errors) {
    const errorCounts = {}
    errors.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1
    })
    
    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }))
  }

  getCommonWarnings(warnings) {
    const warningCounts = {}
    warnings.forEach(warning => {
      warningCounts[warning] = (warningCounts[warning] || 0) + 1
    })
    
    return Object.entries(warningCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([warning, count]) => ({ warning, count }))
  }
}

// Create singleton instance
const nepaliDateValidator = new NepaliDateValidator()

// Export convenience functions
export const validateNepaliDate = (year, month, day) => 
  nepaliDateValidator.validateNepaliDate(year, month, day)

export const validateEnglishDate = (date) => 
  nepaliDateValidator.validateEnglishDate(date)

export const validateDateString = (dateString, format = 'auto') => 
  nepaliDateValidator.validateAndNormalizeDateString(dateString, format)

export const validateDateRange = (startDate, endDate) => 
  nepaliDateValidator.validateNepaliDateRange(startDate, endDate)

export const checkWeekendHoliday = (nepaliDate) => 
  nepaliDateValidator.checkWeekendAndHolidays(nepaliDate)

export const validateMultipleDates = (dates, format = 'auto') => 
  nepaliDateValidator.validateMultipleDates(dates, format)

export default nepaliDateValidator