/**
 * Form validation utilities
 */

/**
 * Validate required field
 * @param {*} value - Field value
 * @returns {string|null} Error message or null if valid
 */
export const required = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required'
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'This field is required'
  }
  if (Array.isArray(value) && value.length === 0) {
  }
  return null
}

/**
 * Validate email format
 * @param {string} value - Email value
 * @returns {string|null} Error message or null if valid
 */
export const email = (value) => {
  if (!value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value) ? null : 'Please enter a valid email address'
}

/**
 * Validate minimum length
 * @param {number} min - Minimum length
 * @returns {Function} Validation function
 */
export const minLength = (min) => (value) => {
  if (!value) return null
  return value.length >= min ? null : `Must be at least ${min} characters`
}

/**
 * Validate maximum length
 * @param {number} max - Maximum length
 * @returns {Function} Validation function
 */
export const maxLength = (max) => (value) => {
  if (!value) return null
  return value.length <= max ? null : `Must be no more than ${max} characters`
}

/**
 * Validate exact length
 * @param {number} length - Exact length
 * @returns {Function} Validation function
 */
export const exactLength = (length) => (value) => {
  if (!value) return null
  return value.length === length ? null : `Must be exactly ${length} characters`
}

/**
 * Validate minimum number
 * @param {number} min - Minimum value
 * @returns {Function} Validation function
 */
export const min = (min) => (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return isNaN(num) || num >= min ? null : `Must be at least ${min}`
}

/**
 * Validate maximum number
 * @param {number} max - Maximum value
 * @returns {Function} Validation function
 */
export const max = (max) => (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return isNaN(num) || num <= max ? null : `Must be no more than ${max}`
}

/**
 * Validate phone number format
 * @param {string} value - Phone number value
 * @returns {string|null} Error message or null if valid
 */
export const phone = (value) => {
  if (!value) return null
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(value) ? null : 'Please enter a valid phone number'
}

/**
 * Validate URL format
 * @param {string} value - URL value
 * @returns {string|null} Error message or null if valid
 */
export const url = (value) => {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return 'Please enter a valid URL'
  }
}

/**
 * Validate that value matches another field
 * @param {string} fieldName - Name of field to match
 * @param {string} fieldLabel - Label of field to match (for error message)
 * @returns {Function} Validation function
 */
export const matches = (fieldName, fieldLabel) => (value, allValues) => {
  if (!value) return null
  return value === allValues[fieldName] ? null : `Must match ${fieldLabel}`
}

/**
 * Create a validator that combines multiple validators
 * @param {...Function} validators - Validation functions
 * @returns {Function} Combined validation function
 */
export const combine = (...validators) => (value, allValues) => {
  for (const validator of validators) {
    const error = validator(value, allValues)
    if (error) return error
  }
  return null
}

/**
 * Validate form fields
 * @param {Object} values - Form values
 * @param {Object} validators - Validators for each field
 * @returns {Object} Validation errors
 */
export const validateForm = (values, validators) => {
  const errors = {}
  
  for (const [field, validator] of Object.entries(validators)) {
    const error = validator(values[field], values)
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

/**
 * Check if form is valid
 * @param {Object} errors - Validation errors
 * @returns {boolean} True if form is valid
 */
export const isFormValid = (errors) => {
  return Object.keys(errors).length === 0
}

/**
 * Get first error message
 * @param {Object} errors - Validation errors
 * @returns {string|null} First error message or null
 */
export const getFirstError = (errors) => {
  const keys = Object.keys(errors)
  return keys.length > 0 ? errors[keys[0]] : null
}

export default {
  required,
  email,
  minLength,
  maxLength,
  exactLength,
  min,
  max,
  phone,
  url,
  matches,
  combine,
  validateForm,
  isFormValid,
  getFirstError
}