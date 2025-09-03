// Performance optimization service for handling large datasets
class PerformanceService {
  constructor() {
    this.cache = new Map()
    // Implemented caching with specified TTLs:
    // - Constants: 1 hour (3600000ms)
    // - Analytics: 30 seconds (30000ms) 
    // - Jobs: 5 minutes (300000ms)
    // - Search: 2 minutes (120000ms)
    this.cacheTimeouts = {
      'constants': 3600000,    // 1 hour
      'analytics': 30000,      // 30 seconds
      'jobs': 300000,          // 5 minutes
      'search': 120000,        // 2 minutes
      'default': 300000        // 5 minutes (default)
    }
  }

  /**
   * Get cached data or fetch new data
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {string} cacheType - Type of cache (constants, analytics, jobs, search)
   * @returns {Promise<any>} Cached or fresh data
   */
  async getCachedData(key, fetchFn, cacheType = 'default') {
    const cached = this.cache.get(key)
    const timeout = this.cacheTimeouts[cacheType] || this.cacheTimeouts.default
    
    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.data
    }
    
    const data = await fetchFn()
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    return data
  }

  /**
   * Clear cache for specific key or all cache
   * @param {string} key - Optional specific key to clear
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Debounce function calls to reduce API requests
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Throttle function calls to limit execution frequency
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * Virtual scrolling helper for large lists
   * @param {Array} items - All items
   * @param {number} containerHeight - Container height in pixels
   * @param {number} itemHeight - Individual item height in pixels
   * @param {number} scrollTop - Current scroll position
   * @returns {Object} Visible items and scroll info
   */
  getVirtualScrollItems(items, containerHeight, itemHeight, scrollTop) {
    const totalHeight = items.length * itemHeight
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length)
    
    const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }))
    
    return {
      visibleItems,
      totalHeight,
      startIndex,
      endIndex
    }
  }

  /**
   * Optimize large dataset operations with chunking
   * @param {Array} items - Items to process
   * @param {Function} processor - Processing function
   * @param {number} chunkSize - Chunk size
   * @returns {Promise<Array>} Processed results
   */
  async processInChunks(items, processor, chunkSize = 100) {
    const results = []
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize)
      const chunkResults = await processor(chunk)
      results.push(...chunkResults)
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return results
  }

  /**
   * Measure performance of operations
   * @param {string} name - Operation name
   * @param {Function} operation - Operation to measure
   * @returns {Promise<any>} Operation result
   */
  async measurePerformance(name, operation) {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const endTime = performance.now()
      
      console.log(`Performance: ${name} took ${(endTime - startTime).toFixed(2)}ms`)
      
      // Log slow operations
      if (endTime - startTime > 1000) {
        console.warn(`Slow operation detected: ${name} took ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      console.error(`Performance: ${name} failed after ${(endTime - startTime).toFixed(2)}ms`, error)
      throw error
    }
  }

  /**
   * Preload data for better user experience
   * @param {Array} urls - URLs to preload
   * @returns {Promise<void>}
   */
  async preloadData(urls) {
    const preloadPromises = urls.map(url => 
      fetch(url, { method: 'HEAD' }).catch(() => {
        // Ignore preload failures
      })
    )
    
    await Promise.allSettled(preloadPromises)
  }

  /**
   * Memory usage monitoring
   * @returns {Object} Memory usage info
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  }

  /**
   * Server-side pagination for large datasets
   * @param {Object} params - Pagination parameters
   * @param {number} params.page - Current page (1-based)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search query
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort order (asc/desc)
   * @param {Function} fetchFn - Function to fetch paginated data
   * @returns {Promise<Object>} Paginated results
   */
  async getPaginatedData({ page = 1, limit = 50, search = '', sortBy = 'id', sortOrder = 'asc' }, fetchFn) {
    const cacheKey = `paginated_${page}_${limit}_${search}_${sortBy}_${sortOrder}`
    // Use search cache type for paginated data with search
    const cacheType = search ? 'search' : 'default'
    
    return this.measurePerformance(`Pagination Load (Page ${page})`, async () => {
      return this.getCachedData(cacheKey, () => fetchFn({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        offset: (page - 1) * limit
      }), cacheType)
    })
  }

  /**
   * Optimize list rendering for 10k+ items
   * @param {Array} items - Large dataset
   * @param {Object} options - Rendering options
   * @returns {Object} Optimized rendering data
   */
  optimizeListRendering(items, options = {}) {
    const {
      pageSize = 50,
      virtualScrolling = true,
      lazyLoading = true
    } = options

    if (virtualScrolling && items.length > 1000) {
      return {
        renderingMode: 'virtual',
        totalItems: items.length,
        pageSize,
        recommendation: 'Use virtual scrolling for optimal performance'
      }
    }

    if (lazyLoading && items.length > 100) {
      return {
        renderingMode: 'lazy',
        totalItems: items.length,
        pageSize,
        recommendation: 'Use lazy loading with pagination'
      }
    }

    return {
      renderingMode: 'standard',
      totalItems: items.length,
      pageSize: Math.min(pageSize, items.length)
    }
  }

  /**
   * Clean up resources and optimize memory
   */
  cleanup() {
    this.clearCache()
    
    // Force garbage collection if available (dev tools)
    if (window.gc) {
      window.gc()
    }
  }
}

// Create and export singleton instance
const performanceService = new PerformanceService()
export default performanceService