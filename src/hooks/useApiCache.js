import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for caching API responses to optimize calls
 * @param {string} cacheKey - Unique key for caching
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 * @returns {Object} Object containing cache functions and state
 */
export const useApiCache = (cacheKey, ttl = 5 * 60 * 1000) => {
  const [cache, setCache] = useState(() => {
    // Initialize cache from localStorage if available
    try {
      const cached = localStorage.getItem(`api_cache_${cacheKey}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < ttl) {
          return new Map(Object.entries(parsed.data))
        }
      }
    } catch (e) {
      console.warn('Failed to parse cache:', e)
    }
    return new Map()
  })

  // Save cache to localStorage
  useEffect(() => {
    try {
      const cacheData = Object.fromEntries(cache)
      localStorage.setItem(
        `api_cache_${cacheKey}`,
        JSON.stringify({
          data: cacheData,
          timestamp: Date.now()
        })
      )
    } catch (e) {
      console.warn('Failed to save cache:', e)
    }
  }, [cache, cacheKey])

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*} Cached data or null if not found/expired
   */
  const get = useCallback((key) => {
    const item = cache.get(key)
    if (item) {
      // Check if item is still valid
      if (Date.now() - item.timestamp < ttl) {
        return item.data
      } else {
        // Remove expired item
        setCache(prev => {
          const newCache = new Map(prev)
          newCache.delete(key)
          return newCache
        })
      }
    }
    return null
  }, [cache, ttl])

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  const set = useCallback((key, data) => {
    setCache(prev => {
      const newCache = new Map(prev)
      newCache.set(key, {
        data,
        timestamp: Date.now()
      })
      return newCache
    })
  }, [])

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  const clear = useCallback((key) => {
    setCache(prev => {
      const newCache = new Map(prev)
      newCache.delete(key)
      return newCache
    })
  }, [])

  /**
   * Clear all cache entries
   */
  const clearAll = useCallback(() => {
    setCache(new Map())
    try {
      localStorage.removeItem(`api_cache_${cacheKey}`)
    } catch (e) {
      console.warn('Failed to clear cache:', e)
    }
  }, [cacheKey])

  return {
    get,
    set,
    clear,
    clearAll,
    cacheSize: cache.size
  }
}

export default useApiCache