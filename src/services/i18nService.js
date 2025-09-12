// Internationalization service for multi-language support
class I18nService {
  constructor() {
    this.currentLocale = 'en'
    this.translations = new Map()
    this.dateFormatters = new Map()
    this.numberFormatters = new Map()
    this.fallbackLocale = 'en'
    
    // Initialize with default English translations
    this.loadTranslations('en', {
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        next: 'Next',
        previous: 'Previous',
        page: 'Page',
        of: 'of',
        items: 'items',
        selected: 'selected'
      },
      dashboard: {
        title: 'Dashboard',
        metrics: 'Metrics',
        overview: 'Overview'
      },
      applications: {
        title: 'Applications',
        candidate: 'Candidate',
        position: 'Position',
        status: 'Status',
        dateApplied: 'Date Applied',
        summary: 'Application Summary',
        loaded: 'Loaded {{count}} applications in {{time}}ms',
        showing: 'Showing {{start}}-{{end}} of {{total}} applications',
        loadTime: 'Loaded in {{time}}ms',
        slowLoad: 'Loading slower than expected',
        pagination: {
          info: 'Showing {{start}} to {{end}} of {{total}} results',
          page: 'Go to page {{page}}'
        }
      },
      interviews: {
        title: 'Interviews',
        scheduled: 'Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        dateTime: 'Date & Time',
        interviewer: 'Interviewer'
      }
    })
    
    // Nepali translations (Phase 2)
    this.loadTranslations('ne', {
      common: {
        loading: 'लोड हुँदै...',
        error: 'त्रुटि',
        success: 'सफल',
        cancel: 'रद्द गर्नुहोस्',
        save: 'सुरक्षित गर्नुहोस्',
        delete: 'मेटाउनुहोस्',
        edit: 'सम्पादन गर्नुहोस्',
        view: 'हेर्नुहोस्',
        search: 'खोज्नुहोस्',
        filter: 'फिल्टर',
        sort: 'क्रमबद्ध गर्नुहोस्',
        next: 'अर्को',
        previous: 'अघिल्लो',
        page: 'पृष्ठ',
        of: 'को',
        items: 'वस्तुहरू',
        selected: 'चयन गरिएको'
      },
      dashboard: {
        title: 'ड्यासबोर्ड',
        metrics: 'मेट्रिक्स',
        overview: 'सिंहावलोकन'
      },
      applications: {
        title: 'आवेदनहरू',
        candidate: 'उम्मेदवार',
        position: 'पद',
        status: 'स्थिति',
        dateApplied: 'आवेदन मिति',
        summary: 'आवेदन सारांश',
        loaded: '{{count}} आवेदनहरू {{time}}ms मा लोड भयो',
        showing: '{{total}} मध्ये {{start}}-{{end}} आवेदनहरू देखाइँदै',
        loadTime: '{{time}}ms मा लोड भयो',
        slowLoad: 'अपेक्षा भन्दा ढिलो लोड हुँदै',
        pagination: {
          info: '{{total}} परिणामहरू मध्ये {{start}} देखि {{end}} सम्म देखाइँदै',
          page: 'पृष्ठ {{page}} मा जानुहोस्'
        }
      },
      interviews: {
        title: 'अन्तर्वार्ताहरू',
        scheduled: 'निर्धारित',
        completed: 'पूरा भएको',
        cancelled: 'रद्द गरिएको',
        dateTime: 'मिति र समय',
        interviewer: 'अन्तर्वार्ता लिने व्यक्ति'
      }
    })
  }

  /**
   * Load translations for a locale
   * @param {string} locale - Locale code (e.g., 'en', 'ne')
   * @param {Object} translations - Translation object
   */
  loadTranslations(locale, translations) {
    this.translations.set(locale, translations)
  }

  /**
   * Set current locale
   * @param {string} locale - Locale code
   */
  setLocale(locale) {
    this.currentLocale = locale
    
    // Update document language
    document.documentElement.lang = locale
    
    // Update direction for RTL languages if needed
    if (this.isRTL(locale)) {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
    
    // Trigger locale change event
    window.dispatchEvent(new CustomEvent('localeChanged', { 
      detail: { locale, previousLocale: this.currentLocale } 
    }))
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this.currentLocale
  }

  /**
   * Translate a key
   * @param {string} key - Translation key (e.g., 'common.loading')
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    const translations = this.translations.get(this.currentLocale) || 
                        this.translations.get(this.fallbackLocale) || {}
    
    const value = this.getNestedValue(translations, key)
    
    if (!value) {
      console.warn(`Translation missing for key: ${key} in locale: ${this.currentLocale}`)
      return key
    }
    
    // Simple parameter interpolation
    return this.interpolate(value, params)
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Found value or null
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Interpolate parameters in translation string
   * @param {string} str - String with placeholders
   * @param {Object} params - Parameters to interpolate
   * @returns {string} Interpolated string
   */
  interpolate(str, params) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * Format date according to locale
   * @param {Date|string} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!this.dateFormatters.has(this.currentLocale)) {
      this.dateFormatters.set(this.currentLocale, new Intl.DateTimeFormat(this.currentLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
      }))
    }
    
    const formatter = this.dateFormatters.get(this.currentLocale)
    
    // For Nepali dates, we might need special handling
    if (this.currentLocale === 'ne') {
      return this.formatNepaliDate(dateObj, options)
    }
    
    return formatter.format(dateObj)
  }

  /**
   * Format Nepali date (Bikram Sambat)
   * @param {Date} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted Nepali date
   */
  formatNepaliDate(date, options = {}) {
    // This is a simplified implementation
    // In a real application, you'd use a proper Nepali calendar library
    const nepaliMonths = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ]
    
    // Convert to Bikram Sambat (simplified - add ~57 years)
    const bsYear = date.getFullYear() + 57
    const month = nepaliMonths[date.getMonth()]
    const day = date.getDate()
    
    if (options.short) {
      return `${bsYear}/${date.getMonth() + 1}/${day}`
    }
    
    return `${day} ${month} ${bsYear}`
  }

  /**
   * Format number according to locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    if (!this.numberFormatters.has(this.currentLocale)) {
      this.numberFormatters.set(this.currentLocale, new Intl.NumberFormat(this.currentLocale, options))
    }
    
    const formatter = this.numberFormatters.get(this.currentLocale)
    return formatter.format(number)
  }

  /**
   * Format currency according to locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (e.g., 'USD', 'NPR')
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = 'USD') {
    // For Nepali locale, use NPR
    if (this.currentLocale === 'ne') {
      currency = 'NPR'
    }
    
    return this.formatNumber(amount, {
      style: 'currency',
      currency: currency
    })
  }

  /**
   * Check if locale is right-to-left
   * @param {string} locale - Locale code
   * @returns {boolean} True if RTL
   */
  isRTL(locale) {
    const rtlLocales = ['ar', 'he', 'fa', 'ur']
    return rtlLocales.includes(locale.split('-')[0])
  }

  /**
   * Get available locales
   * @returns {Array} Array of available locale codes
   */
  getAvailableLocales() {
    return Array.from(this.translations.keys())
  }

  /**
   * Get locale display name
   * @param {string} locale - Locale code
   * @returns {string} Display name
   */
  getLocaleDisplayName(locale) {
    const displayNames = {
      'en': 'English',
      'ne': 'नेपाली'
    }
    
    return displayNames[locale] || locale
  }

  /**
   * Detect user's preferred locale
   * @returns {string} Detected locale
   */
  detectLocale() {
    // Check localStorage first
    const stored = localStorage.getItem('preferred-locale')
    if (stored && this.translations.has(stored)) {
      return stored
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0]
    if (this.translations.has(browserLang)) {
      return browserLang
    }
    
    return this.fallbackLocale
  }

  /**
   * Save locale preference
   * @param {string} locale - Locale to save
   */
  saveLocalePreference(locale) {
    localStorage.setItem('preferred-locale', locale)
  }

  /**
   * Initialize i18n service
   */
  init() {
    const detectedLocale = this.detectLocale()
    this.setLocale(detectedLocale)
  }
}

// Create and export singleton instance
const i18nService = new I18nService()
export default i18nService