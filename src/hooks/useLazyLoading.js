import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for lazy loading data with intersection observer
 * @param {Function} loadFunction - Function to load data
 * @param {Object} options - Intersection observer options
 * @returns {Object} Object containing loading state and ref
 */
export const useLazyLoading = (loadFunction, options = {}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef(null)

  // Default options
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px',
    ...options
  }

  // Load data when element becomes visible
  const loadData = useCallback(async () => {
    if (!hasLoaded && isVisible && !isLoading) {
      setIsLoading(true)
      try {
        await loadFunction()
        setHasLoaded(true)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [hasLoaded, isVisible, isLoading, loadFunction])

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      defaultOptions
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [defaultOptions])

  // Load data when visible
  useEffect(() => {
    loadData()
  }, [isVisible, loadData])

  return {
    elementRef,
    isLoading,
    hasLoaded,
    isVisible
  }
}

export default useLazyLoading