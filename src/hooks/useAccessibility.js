// React hook for accessibility features
import { useEffect, useRef, useCallback } from 'react'
import accessibilityService from '../services/accessibilityService'

/**
 * Custom hook for accessibility features
 * @param {Object} options - Accessibility options
 * @returns {Object} Accessibility utilities
 */
export const useAccessibility = (options = {}) => {
  const containerRef = useRef(null)
  const cleanupRef = useRef(null)

  // Setup keyboard navigation for right-pane summary
  const setupRightPaneNavigation = useCallback((customOptions = {}) => {
    if (!containerRef.current) return

    const mergedOptions = { ...options, ...customOptions }
    
    // Cleanup previous setup
    if (cleanupRef.current) {
      cleanupRef.current()
    }

    cleanupRef.current = accessibilityService.setupRightPaneNavigation(
      containerRef.current,
      mergedOptions
    )
  }, [options])

  // Announce to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    accessibilityService.announceToScreenReader(message, priority)
  }, [])

  // Create accessible summary
  const createAccessibleSummary = useCallback((data, summaryOptions = {}) => {
    return accessibilityService.createAccessibleSummary(data, summaryOptions)
  }, [])

  // Enhance form accessibility
  const enhanceFormAccessibility = useCallback((form) => {
    if (form) {
      accessibilityService.enhanceFormAccessibility(form)
    }
  }, [])

  // Focus management
  const focusElement = useCallback((selector) => {
    const element = containerRef.current?.querySelector(selector) || 
                   document.querySelector(selector)
    if (element) {
      element.focus()
    }
  }, [])

  // Trap focus within container
  const trapFocus = useCallback((enable = true) => {
    if (!containerRef.current) return

    if (enable) {
      setupRightPaneNavigation({ trapFocus: true })
    } else if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
  }, [setupRightPaneNavigation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return {
    containerRef,
    setupRightPaneNavigation,
    announce,
    createAccessibleSummary,
    enhanceFormAccessibility,
    focusElement,
    trapFocus
  }
}

/**
 * Hook for keyboard navigation
 * @param {Object} keyHandlers - Key handler functions
 * @param {Array} dependencies - Dependencies for handlers
 * @returns {Object} Keyboard navigation utilities
 */
export const useKeyboardNavigation = (keyHandlers = {}, dependencies = []) => {
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleKeyDown = (event) => {
      const handler = keyHandlers[event.key]
      if (handler) {
        handler(event)
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [keyHandlers, ...dependencies])

  return { elementRef }
}

/**
 * Hook for focus management
 * @param {boolean} autoFocus - Whether to auto-focus on mount
 * @returns {Object} Focus management utilities
 */
export const useFocusManagement = (autoFocus = false) => {
  const focusRef = useRef(null)

  useEffect(() => {
    if (autoFocus && focusRef.current) {
      focusRef.current.focus()
    }
  }, [autoFocus])

  const focusElement = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [])

  const blurElement = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.blur()
    }
  }, [])

  return {
    focusRef,
    focusElement,
    blurElement
  }
}

/**
 * Hook for ARIA live regions
 * @returns {Object} Live region utilities
 */
export const useLiveRegion = () => {
  const liveRegionRef = useRef(null)

  const announce = useCallback((message, priority = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return {
    liveRegionRef,
    announce
  }
}

export default useAccessibility