import { useState, useCallback, useEffect } from 'react'
import * as validators from '../utils/formValidation'

/**
 * Custom hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and validation functions
 */
export const useValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {*} value - Field value
   * @returns {string|null} Error message or null if valid
   */
  const validateField = useCallback((name, value) => {
    const validator = validationRules[name]
    if (!validator) return null
    
    return validator(value, values)
  }, [validationRules, values])

  /**
   * Validate all fields
   * @param {Object} formValues - Form values to validate
   * @returns {Object} Validation errors
   */
  const validateForm = useCallback((formValues = values) => {
    const newErrors = {}
    
    for (const [name, validator] of Object.entries(validationRules)) {
      const error = validator(formValues[name], formValues)
      if (error) {
        newErrors[name] = error
      }
    }
    
    return newErrors
  }, [validationRules, values])

  /**
   * Handle field change
   * @param {string} name - Field name
   * @param {*} value - Field value
   */
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Validate field if it has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  /**
   * Handle field blur (mark as touched and validate)
   * @param {string} name - Field name
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [values, validateField])

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  /**
   * Set form values
   * @param {Object} newValues - New form values
   */
  const setFormValues = useCallback((newValues) => {
    setValues(newValues)
  }, [])

  /**
   * Set field error
   * @param {string} name - Field name
   * @param {string} error - Error message
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  /**
   * Check if form is valid
   */
  const isValid = useCallback(() => {
    return Object.keys(validateForm()).length === 0
  }, [validateForm])

  /**
   * Submit form with validation
   * @param {Function} onSubmit - Submit handler function
   */
  const submitForm = useCallback(async (onSubmit) => {
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)
    
    // Validate form
    const formErrors = validateForm()
    setErrors(formErrors)
    
    // If no errors, submit form
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [validateForm, validationRules, values])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid: isValid(),
    handleChange,
    handleBlur,
    reset,
    setFormValues,
    setFieldError,
    submitForm
  }
}

export default useValidation