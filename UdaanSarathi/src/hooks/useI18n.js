// React hook for internationalization
import { useState, useEffect, useCallback } from 'react'
import i18nService from '../services/i18nService'

/**
 * Custom hook for internationalization
 * @returns {Object} i18n utilities and state
 */
export const useI18n = () => {
  const [locale, setLocaleState] = useState(i18nService.getLocale())
  const [isLoading, setIsLoading] = useState(false)

  // Update locale state when service locale changes
  useEffect(() => {
    const handleLocaleChange = (event) => {
      setLocaleState(event.detail.locale)
    }

    window.addEventListener('localeChanged', handleLocaleChange)
    return () => window.removeEventListener('localeChanged', handleLocaleChange)
  }, [])

  // Translation function
  const t = useCallback((key, params = {}) => {
    return i18nService.t(key, params)
  }, [locale]) // Re-create when locale changes

  // Change locale
  const setLocale = useCallback(async (newLocale) => {
    setIsLoading(true)
    try {
      i18nService.setLocale(newLocale)
      i18nService.saveLocalePreference(newLocale)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Format date
  const formatDate = useCallback((date, options = {}) => {
    return i18nService.formatDate(date, options)
  }, [locale])

  // Format number
  const formatNumber = useCallback((number, options = {}) => {
    return i18nService.formatNumber(number, options)
  }, [locale])

  // Format currency
  const formatCurrency = useCallback((amount, currency) => {
    return i18nService.formatCurrency(amount, currency)
  }, [locale])

  return {
    locale,
    setLocale,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
    isLoading,
    availableLocales: i18nService.getAvailableLocales(),
    getLocaleDisplayName: i18nService.getLocaleDisplayName.bind(i18nService),
    isRTL: i18nService.isRTL(locale)
  }
}

export default useI18n