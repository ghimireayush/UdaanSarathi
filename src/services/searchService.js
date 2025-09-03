// Advanced Search Service with Postgres-like functionality using Fuse.js
import Fuse from 'fuse.js'

/**
 * Advanced search service that mimics Postgres trigram/GIN index functionality
 * Uses Fuse.js for fuzzy search with configurable options
 */
export class SearchService {
  constructor() {
    this.searchInstances = new Map()
    this.searchHistory = []
    this.popularSearches = new Map()
  }

  /**
   * Create or get a search index for a dataset
   * @param {string} indexName - Unique name for the search index
   * @param {Array} data - Dataset to index
   * @param {Object} options - Search configuration options
   * @returns {Fuse} Fuse.js search instance
   */
  createSearchIndex(indexName, data, options = {}) {
    const defaultOptions = {
      // Trigram-like fuzzy matching
      threshold: 0.3, // Lower = more strict matching
      distance: 100, // Maximum distance for fuzzy matching
      minMatchCharLength: 2, // Minimum characters to match
      includeScore: true,
      includeMatches: true,
      
      // Search keys - similar to GIN index fields
      keys: options.keys || [
        { name: 'name', weight: 0.3 },
        { name: 'email', weight: 0.2 },
        { name: 'skills', weight: 0.2 },
        { name: 'experience', weight: 0.1 },
        { name: 'location', weight: 0.1 },
        { name: 'description', weight: 0.1 }
      ],
      
      // Advanced options
      ignoreLocation: false,
      ignoreFieldNorm: false,
      fieldNormWeight: 1,
      
      // Custom functions for better matching
      getFn: (obj, path) => {
        const value = Fuse.config.getFn(obj, path)
        if (Array.isArray(value)) {
          return value.join(' ')
        }
        return value
      }
    }

    const fuseOptions = { ...defaultOptions, ...options }
    const fuse = new Fuse(data, fuseOptions)
    
    this.searchInstances.set(indexName, {
      fuse,
      data,
      options: fuseOptions,
      createdAt: new Date(),
      lastUsed: new Date()
    })

    return fuse
  }

  /**
   * Perform advanced search with multiple strategies
   * @param {string} indexName - Search index name
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results with metadata
   */
  search(indexName, query, options = {}) {
    const searchInstance = this.searchInstances.get(indexName)
    if (!searchInstance) {
      throw new Error(`Search index '${indexName}' not found`)
    }

    const startTime = Date.now()
    const { fuse, data } = searchInstance
    
    // Update usage tracking
    searchInstance.lastUsed = new Date()
    this.trackSearch(query, indexName)

    // Handle empty query
    if (!query || query.trim().length === 0) {
      return {
        results: data.map((item, index) => ({
          item,
          refIndex: index,
          score: 1
        })),
        totalResults: data.length,
        query: '',
        searchTime: Date.now() - startTime,
        strategy: 'all'
      }
    }

    const searchOptions = {
      limit: options.limit || 50,
      ...options
    }

    // Primary fuzzy search
    let results = fuse.search(query, searchOptions)
    let strategy = 'fuzzy'

    // If fuzzy search yields poor results, try exact matching
    if (results.length === 0 || (results[0] && results[0].score > 0.7)) {
      results = this.exactSearch(data, query, searchInstance.options.keys)
      strategy = 'exact'
    }

    // If still no good results, try partial matching
    if (results.length === 0) {
      results = this.partialSearch(data, query, searchInstance.options.keys)
      strategy = 'partial'
    }

    // Apply additional filters if provided
    if (options.filters) {
      results = this.applyFilters(results, options.filters)
    }

    // Sort results by relevance and additional criteria
    results = this.sortResults(results, options.sort)

    // Apply pagination
    const paginatedResults = this.paginateResults(results, options.pagination)

    return {
      results: paginatedResults.data,
      totalResults: results.length,
      query,
      searchTime: Date.now() - startTime,
      strategy,
      pagination: paginatedResults.pagination,
      suggestions: this.generateSearchSuggestions(query, results),
      metadata: {
        indexName,
        searchedAt: new Date(),
        resultQuality: this.assessResultQuality(results, query)
      }
    }
  }

  /**
   * Exact search implementation
   * @param {Array} data - Dataset to search
   * @param {string} query - Search query
   * @param {Array} keys - Fields to search
   * @returns {Array} Search results
   */
  exactSearch(data, query, keys) {
    const queryLower = query.toLowerCase()
    const results = []

    data.forEach((item, index) => {
      let score = 0
      let matches = []

      keys.forEach(key => {
        const keyName = typeof key === 'string' ? key : key.name
        const weight = typeof key === 'string' ? 1 : key.weight
        const value = this.getNestedValue(item, keyName)
        
        if (value) {
          const valueStr = Array.isArray(value) ? value.join(' ') : String(value)
          const valueLower = valueStr.toLowerCase()
          
          if (valueLower === queryLower) {
            score += weight * 1.0 // Perfect match
            matches.push({ key: keyName, value: valueStr, type: 'exact' })
          } else if (valueLower.includes(queryLower)) {
            score += weight * 0.8 // Contains match
            matches.push({ key: keyName, value: valueStr, type: 'contains' })
          }
        }
      })

      if (score > 0) {
        results.push({
          item,
          refIndex: index,
          score: 1 - score, // Invert score to match Fuse.js convention (lower is better)
          matches
        })
      }
    })

    return results.sort((a, b) => a.score - b.score)
  }

  /**
   * Partial search implementation
   * @param {Array} data - Dataset to search
   * @param {string} query - Search query
   * @param {Array} keys - Fields to search
   * @returns {Array} Search results
   */
  partialSearch(data, query, keys) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1)
    const results = []

    data.forEach((item, index) => {
      let score = 0
      let matches = []

      keys.forEach(key => {
        const keyName = typeof key === 'string' ? key : key.name
        const weight = typeof key === 'string' ? 1 : key.weight
        const value = this.getNestedValue(item, keyName)
        
        if (value) {
          const valueStr = Array.isArray(value) ? value.join(' ') : String(value)
          const valueLower = valueStr.toLowerCase()
          
          queryWords.forEach(word => {
            if (valueLower.includes(word)) {
              score += weight * (word.length / query.length)
              matches.push({ key: keyName, value: valueStr, type: 'partial', word })
            }
          })
        }
      })

      if (score > 0) {
        results.push({
          item,
          refIndex: index,
          score: 1 - score,
          matches
        })
      }
    })

    return results.sort((a, b) => a.score - b.score)
  }

  /**
   * Apply additional filters to search results
   * @param {Array} results - Search results
   * @param {Object} filters - Filter configuration
   * @returns {Array} Filtered results
   */
  applyFilters(results, filters) {
    return results.filter(result => {
      const item = result.item

      // Date filters
      if (filters.dateRange) {
        const { field, start, end } = filters.dateRange
        const itemDate = new Date(this.getNestedValue(item, field))
        if (start && itemDate < new Date(start)) return false
        if (end && itemDate > new Date(end)) return false
      }

      // Category filters
      if (filters.categories && filters.categories.length > 0) {
        const itemCategory = this.getNestedValue(item, 'category')
        if (!filters.categories.includes(itemCategory)) return false
      }

      // Status filters
      if (filters.status && filters.status.length > 0) {
        const itemStatus = this.getNestedValue(item, 'status')
        if (!filters.status.includes(itemStatus)) return false
      }

      // Custom filter functions
      if (filters.custom) {
        for (const [name, filterFn] of Object.entries(filters.custom)) {
          if (typeof filterFn === 'function' && !filterFn(item)) {
            return false
          }
        }
      }

      return true
    })
  }

  /**
   * Sort search results
   * @param {Array} results - Search results
   * @param {Object} sortOptions - Sort configuration
   * @returns {Array} Sorted results
   */
  sortResults(results, sortOptions) {
    if (!sortOptions) return results

    const { field, direction = 'asc', type = 'string' } = sortOptions

    return results.sort((a, b) => {
      // Primary sort by relevance score
      const scoreDiff = a.score - b.score
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff

      // Secondary sort by specified field
      if (field) {
        let aVal = this.getNestedValue(a.item, field)
        let bVal = this.getNestedValue(b.item, field)

        if (type === 'number') {
          aVal = parseFloat(aVal) || 0
          bVal = parseFloat(bVal) || 0
        } else if (type === 'date') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        } else {
          aVal = String(aVal || '').toLowerCase()
          bVal = String(bVal || '').toLowerCase()
        }

        let comparison = 0
        if (aVal > bVal) comparison = 1
        if (aVal < bVal) comparison = -1

        return direction === 'desc' ? -comparison : comparison
      }

      return 0
    })
  }

  /**
   * Paginate search results
   * @param {Array} results - Search results
   * @param {Object} paginationOptions - Pagination configuration
   * @returns {Object} Paginated results with metadata
   */
  paginateResults(results, paginationOptions) {
    if (!paginationOptions) {
      return { data: results, pagination: null }
    }

    const { page = 1, limit = 20 } = paginationOptions
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = results.slice(startIndex, endIndex)

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: results.length,
        totalPages: Math.ceil(results.length / limit),
        hasNext: endIndex < results.length,
        hasPrev: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, results.length)
      }
    }
  }

  /**
   * Generate search suggestions
   * @param {string} query - Original query
   * @param {Array} results - Search results
   * @returns {Array} Search suggestions
   */
  generateSearchSuggestions(query, results) {
    const suggestions = []

    // Suggest corrections for typos
    if (results.length === 0 && query.length > 3) {
      suggestions.push({
        type: 'correction',
        text: `Did you mean "${this.suggestCorrection(query)}"?`,
        query: this.suggestCorrection(query)
      })
    }

    // Suggest related searches from popular searches
    const relatedSearches = this.getRelatedSearches(query)
    relatedSearches.forEach(search => {
      suggestions.push({
        type: 'related',
        text: `Try searching for "${search}"`,
        query: search
      })
    })

    // Suggest broader searches if results are limited
    if (results.length < 5 && query.includes(' ')) {
      const broaderQuery = query.split(' ')[0]
      suggestions.push({
        type: 'broader',
        text: `Try broader search: "${broaderQuery}"`,
        query: broaderQuery
      })
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  /**
   * Assess result quality
   * @param {Array} results - Search results
   * @param {string} query - Search query
   * @returns {Object} Quality assessment
   */
  assessResultQuality(results, query) {
    if (results.length === 0) {
      return { score: 0, quality: 'poor', reason: 'No results found' }
    }

    const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    const topScore = results[0]?.score || 1

    let quality = 'excellent'
    let reason = 'High relevance matches found'

    if (topScore > 0.7) {
      quality = 'poor'
      reason = 'Low relevance matches'
    } else if (topScore > 0.4) {
      quality = 'fair'
      reason = 'Moderate relevance matches'
    } else if (topScore > 0.2) {
      quality = 'good'
      reason = 'Good relevance matches'
    }

    return {
      score: Math.round((1 - avgScore) * 100),
      quality,
      reason,
      resultCount: results.length,
      avgScore: Math.round(avgScore * 100) / 100
    }
  }

  /**
   * Track search queries for analytics
   * @param {string} query - Search query
   * @param {string} indexName - Index name
   */
  trackSearch(query, indexName) {
    this.searchHistory.unshift({
      query,
      indexName,
      timestamp: new Date()
    })

    // Keep only last 100 searches
    this.searchHistory = this.searchHistory.slice(0, 100)

    // Update popular searches
    const key = query.toLowerCase().trim()
    this.popularSearches.set(key, (this.popularSearches.get(key) || 0) + 1)
  }

  /**
   * Get search analytics
   * @param {string} indexName - Optional index name filter
   * @returns {Object} Search analytics
   */
  getSearchAnalytics(indexName = null) {
    const filteredHistory = indexName 
      ? this.searchHistory.filter(h => h.indexName === indexName)
      : this.searchHistory

    const queryFrequency = new Map()
    filteredHistory.forEach(h => {
      const key = h.query.toLowerCase().trim()
      queryFrequency.set(key, (queryFrequency.get(key) || 0) + 1)
    })

    const topQueries = Array.from(queryFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    return {
      totalSearches: filteredHistory.length,
      uniqueQueries: queryFrequency.size,
      topQueries,
      recentSearches: filteredHistory.slice(0, 10).map(h => h.query),
      searchTrends: this.calculateSearchTrends(filteredHistory)
    }
  }

  /**
   * Get popular searches
   * @param {number} limit - Number of results to return
   * @returns {Array} Popular search queries
   */
  getPopularSearches(limit = 10) {
    return Array.from(this.popularSearches.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }))
  }

  /**
   * Clear search index
   * @param {string} indexName - Index name to clear
   */
  clearIndex(indexName) {
    this.searchInstances.delete(indexName)
  }

  /**
   * Update search index with new data
   * @param {string} indexName - Index name
   * @param {Array} newData - New dataset
   */
  updateIndex(indexName, newData) {
    const instance = this.searchInstances.get(indexName)
    if (instance) {
      instance.fuse.setCollection(newData)
      instance.data = newData
      instance.lastUsed = new Date()
    }
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  suggestCorrection(query) {
    // Simple correction suggestion - in production, use a proper spell checker
    return query.replace(/(.)\1+/g, '$1') // Remove repeated characters
  }

  getRelatedSearches(query) {
    const related = []
    const queryWords = query.toLowerCase().split(/\s+/)
    
    // Find searches with similar words
    for (const [popularQuery] of this.popularSearches.entries()) {
      const popularWords = popularQuery.split(/\s+/)
      const commonWords = queryWords.filter(word => popularWords.includes(word))
      
      if (commonWords.length > 0 && popularQuery !== query.toLowerCase()) {
        related.push(popularQuery)
      }
    }

    return related.slice(0, 3)
  }

  calculateSearchTrends(history) {
    const trends = new Map()
    const now = new Date()
    
    history.forEach(search => {
      const dayKey = search.timestamp.toISOString().split('T')[0]
      trends.set(dayKey, (trends.get(dayKey) || 0) + 1)
    })

    return Array.from(trends.entries())
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 7)
      .map(([date, count]) => ({ date, count }))
  }
}

export default new SearchService()