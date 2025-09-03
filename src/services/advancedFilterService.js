// Advanced Filtering, Saved Views, and Export Service with Search Integration
import { getCurrentNepalTime, formatInNepalTz } from '../utils/nepaliDate'
import searchService from './searchService'

/**
 * Advanced filtering service with saved views and export capabilities
 */
export class AdvancedFilterService {
  constructor() {
    this.savedViews = this.loadSavedViews()
    this.filterHistory = this.loadFilterHistory()
  }

  /**
   * Apply advanced filters to dataset
   * @param {Array} data - Dataset to filter
   * @param {Object} filters - Filter configuration
   * @returns {Object} Filtered results with metadata
   */
  applyFilters(data = [], filters = {}) {
    let filteredData = [...data]
    const appliedFilters = []
    const filterStats = {}

    // Advanced text search using search service
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim()
      const searchFields = filters.searchFields || ['name', 'email', 'skills', 'experience']
      
      // Create temporary search index for this dataset
      const indexName = `temp_filter_${Date.now()}`
      searchService.createSearchIndex(indexName, filteredData, {
        keys: searchFields.map(field => ({ name: field, weight: 1 / searchFields.length })),
        threshold: 0.4 // More lenient for filtering
      })
      
      // Perform search
      const searchResults = searchService.search(indexName, searchTerm, {
        limit: filteredData.length // Get all results
      })
      
      // Extract items from search results
      filteredData = searchResults.results.map(result => result.item)
      
      // Clean up temporary index
      searchService.clearIndex(indexName)
      
      appliedFilters.push({
        type: 'search',
        value: filters.search,
        fields: searchFields,
        resultCount: filteredData.length,
        searchStrategy: searchResults.strategy,
        searchTime: searchResults.searchTime
      })
    }

    // Date range filters
    if (filters.dateRange) {
      const { field, start, end, type } = filters.dateRange
      
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(this.getNestedValue(item, field))
        if (!itemDate || isNaN(itemDate)) return false
        
        const startDate = start ? new Date(start) : null
        const endDate = end ? new Date(end) : null
        
        if (startDate && itemDate < startDate) return false
        if (endDate && itemDate > endDate) return false
        
        return true
      })
      
      appliedFilters.push({
        type: 'dateRange',
        field,
        start,
        end,
        resultCount: filteredData.length
      })
    }

    // Numeric range filters
    if (filters.numericRanges) {
      Object.entries(filters.numericRanges).forEach(([field, range]) => {
        if (range.min !== undefined || range.max !== undefined) {
          filteredData = filteredData.filter(item => {
            const value = parseFloat(this.getNestedValue(item, field))
            if (isNaN(value)) return false
            
            if (range.min !== undefined && value < range.min) return false
            if (range.max !== undefined && value > range.max) return false
            
            return true
          })
          
          appliedFilters.push({
            type: 'numericRange',
            field,
            range,
            resultCount: filteredData.length
          })
        }
      })
    }

    // Multi-select filters
    if (filters.multiSelect) {
      Object.entries(filters.multiSelect).forEach(([field, selectedValues]) => {
        if (selectedValues && selectedValues.length > 0) {
          filteredData = filteredData.filter(item => {
            const itemValue = this.getNestedValue(item, field)
            
            if (Array.isArray(itemValue)) {
              return itemValue.some(v => selectedValues.includes(v))
            }
            
            return selectedValues.includes(itemValue)
          })
          
          appliedFilters.push({
            type: 'multiSelect',
            field,
            values: selectedValues,
            resultCount: filteredData.length
          })
        }
      })
    }

    // Boolean filters
    if (filters.boolean) {
      Object.entries(filters.boolean).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          filteredData = filteredData.filter(item => {
            return Boolean(this.getNestedValue(item, field)) === Boolean(value)
          })
          
          appliedFilters.push({
            type: 'boolean',
            field,
            value,
            resultCount: filteredData.length
          })
        }
      })
    }

    // Custom filters (functions)
    if (filters.custom) {
      Object.entries(filters.custom).forEach(([name, filterFn]) => {
        if (typeof filterFn === 'function') {
          const beforeCount = filteredData.length
          filteredData = filteredData.filter(filterFn)
          
          appliedFilters.push({
            type: 'custom',
            name,
            resultCount: filteredData.length,
            filtered: beforeCount - filteredData.length
          })
        }
      })
    }

    // Skill-based filters
    if (filters.skills) {
      const { required, optional, matchType } = filters.skills
      
      if (required && required.length > 0) {
        filteredData = filteredData.filter(item => {
          const itemSkills = this.getNestedValue(item, 'skills') || []
          const skillNames = itemSkills.map(s => 
            typeof s === 'string' ? s.toLowerCase() : s.name?.toLowerCase()
          )
          
          if (matchType === 'all') {
            return required.every(skill => 
              skillNames.some(itemSkill => itemSkill.includes(skill.toLowerCase()))
            )
          } else {
            return required.some(skill => 
              skillNames.some(itemSkill => itemSkill.includes(skill.toLowerCase()))
            )
          }
        })
        
        appliedFilters.push({
          type: 'skills',
          required,
          matchType,
          resultCount: filteredData.length
        })
      }
    }

    // Location-based filters
    if (filters.location) {
      const { countries, cities, radius, coordinates } = filters.location
      
      if (countries && countries.length > 0) {
        filteredData = filteredData.filter(item => {
          const itemCountry = this.getNestedValue(item, 'location.country') || 
                             this.getNestedValue(item, 'country')
          return countries.includes(itemCountry)
        })
      }
      
      if (cities && cities.length > 0) {
        filteredData = filteredData.filter(item => {
          const itemCity = this.getNestedValue(item, 'location.city') || 
                          this.getNestedValue(item, 'city')
          return cities.includes(itemCity)
        })
      }
      
      appliedFilters.push({
        type: 'location',
        countries,
        cities,
        resultCount: filteredData.length
      })
    }

    // Sorting
    if (filters.sort) {
      const { field, direction, type } = filters.sort
      
      filteredData.sort((a, b) => {
        let aVal = this.getNestedValue(a, field)
        let bVal = this.getNestedValue(b, field)
        
        // Handle different data types
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
      })
    }

    // Pagination
    let paginatedData = filteredData
    let pagination = null
    
    if (filters.pagination) {
      const { page, limit } = filters.pagination
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      
      paginatedData = filteredData.slice(startIndex, endIndex)
      
      pagination = {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        hasNext: endIndex < filteredData.length,
        hasPrev: page > 1
      }
    }

    // Generate filter statistics
    filterStats.originalCount = data.length
    filterStats.filteredCount = filteredData.length
    filterStats.paginatedCount = paginatedData.length
    filterStats.filterEfficiency = data.length > 0 ? 
      ((data.length - filteredData.length) / data.length * 100).toFixed(1) : 0

    // Save to filter history
    this.addToFilterHistory(filters, filterStats)

    return {
      data: paginatedData,
      totalCount: filteredData.length,
      appliedFilters,
      filterStats,
      pagination,
      metadata: {
        appliedAt: getCurrentNepalTime(),
        processingTime: Date.now() - (filters._startTime || Date.now())
      }
    }
  }

  /**
   * Generate filter suggestions based on data
   * @param {Array} data - Dataset to analyze
   * @param {Object} currentFilters - Current filter state
   * @returns {Object} Filter suggestions
   */
  generateFilterSuggestions(data = [], currentFilters = {}) {
    const suggestions = {
      quickFilters: [],
      smartFilters: [],
      popularFilters: []
    }

    if (data.length === 0) return suggestions

    // Analyze data for quick filter suggestions
    const fieldAnalysis = this.analyzeDataFields(data)

    // Quick filters for common fields
    Object.entries(fieldAnalysis).forEach(([field, analysis]) => {
      if (analysis.type === 'categorical' && analysis.uniqueValues.length <= 20) {
        suggestions.quickFilters.push({
          field,
          type: 'multiSelect',
          label: this.formatFieldLabel(field),
          options: analysis.uniqueValues.map(value => ({
            value,
            count: analysis.valueCounts[value],
            percentage: ((analysis.valueCounts[value] / data.length) * 100).toFixed(1)
          }))
        })
      }
      
      if (analysis.type === 'numeric') {
        suggestions.quickFilters.push({
          field,
          type: 'range',
          label: this.formatFieldLabel(field),
          min: analysis.min,
          max: analysis.max,
          average: analysis.average
        })
      }
      
      if (analysis.type === 'date') {
        suggestions.quickFilters.push({
          field,
          type: 'dateRange',
          label: this.formatFieldLabel(field),
          earliest: analysis.earliest,
          latest: analysis.latest
        })
      }
    })

    // Smart filters based on data patterns
    this.generateSmartFilters(data, fieldAnalysis, suggestions)

    // Popular filters from history
    suggestions.popularFilters = this.getPopularFilters()

    return suggestions
  }

  /**
   * Save a filter view
   * @param {string} name - View name
   * @param {Object} filters - Filter configuration
   * @param {Object} options - Additional options
   * @returns {Object} Saved view
   */
  saveView(name, filters, options = {}) {
    const view = {
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      filters,
      createdAt: getCurrentNepalTime(),
      updatedAt: getCurrentNepalTime(),
      isPublic: options.isPublic || false,
      description: options.description || '',
      tags: options.tags || [],
      createdBy: options.userId || 'anonymous',
      usageCount: 0
    }

    this.savedViews.push(view)
    this.saveSavedViews()

    return view
  }

  /**
   * Load a saved view
   * @param {string} viewId - View identifier
   * @returns {Object|null} Saved view
   */
  loadView(viewId) {
    const view = this.savedViews.find(v => v.id === viewId)
    if (view) {
      view.usageCount = (view.usageCount || 0) + 1
      view.lastUsed = getCurrentNepalTime()
      this.saveSavedViews()
    }
    return view || null
  }

  /**
   * Get all saved views
   * @param {Object} options - Filter options
   * @returns {Array} Saved views
   */
  getSavedViews(options = {}) {
    let views = [...this.savedViews]

    if (options.userId) {
      views = views.filter(v => v.createdBy === options.userId || v.isPublic)
    }

    if (options.tags && options.tags.length > 0) {
      views = views.filter(v => 
        options.tags.some(tag => v.tags.includes(tag))
      )
    }

    if (options.search) {
      const search = options.search.toLowerCase()
      views = views.filter(v => 
        v.name.toLowerCase().includes(search) ||
        v.description.toLowerCase().includes(search)
      )
    }

    // Sort by usage and recency
    views.sort((a, b) => {
      const aScore = (a.usageCount || 0) * 0.7 + 
                    (new Date(a.lastUsed || a.createdAt).getTime() / 1000000) * 0.3
      const bScore = (b.usageCount || 0) * 0.7 + 
                    (new Date(b.lastUsed || b.createdAt).getTime() / 1000000) * 0.3
      return bScore - aScore
    })

    return views
  }

  /**
   * Export filtered data
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportData(data, options = {}) {
    const {
      format = 'csv',
      filename,
      fields,
      includeHeaders = true,
      dateFormat = 'yyyy-MM-dd HH:mm:ss'
    } = options

    const exportData = this.prepareExportData(data, fields, dateFormat)
    
    let content = ''
    let mimeType = 'text/plain'
    let extension = 'txt'

    switch (format.toLowerCase()) {
      case 'csv':
        content = this.generateCSV(exportData, includeHeaders)
        mimeType = 'text/csv'
        extension = 'csv'
        break
        
      case 'json':
        content = JSON.stringify(exportData, null, 2)
        mimeType = 'application/json'
        extension = 'json'
        break
        
      case 'excel':
        // For Excel export, you'd typically use a library like xlsx
        content = this.generateExcelData(exportData, includeHeaders)
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'xlsx'
        break
        
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }

    const finalFilename = filename || 
      `export_${formatInNepalTz(getCurrentNepalTime(), 'yyyy-MM-dd_HH-mm-ss')}.${extension}`

    return {
      content,
      filename: finalFilename,
      mimeType,
      size: content.length,
      recordCount: exportData.length,
      exportedAt: getCurrentNepalTime()
    }
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  analyzeDataFields(data) {
    const analysis = {}
    
    if (data.length === 0) return analysis

    // Get all possible field paths
    const fieldPaths = this.extractFieldPaths(data[0])
    
    fieldPaths.forEach(field => {
      const values = data.map(item => this.getNestedValue(item, field))
        .filter(val => val !== null && val !== undefined)
      
      if (values.length === 0) return

      const fieldAnalysis = {
        field,
        totalValues: values.length,
        nullCount: data.length - values.length,
        uniqueValues: [...new Set(values)],
        valueCounts: {}
      }

      // Count value occurrences
      values.forEach(val => {
        fieldAnalysis.valueCounts[val] = (fieldAnalysis.valueCounts[val] || 0) + 1
      })

      // Determine field type
      const firstValue = values[0]
      if (typeof firstValue === 'number') {
        fieldAnalysis.type = 'numeric'
        fieldAnalysis.min = Math.min(...values)
        fieldAnalysis.max = Math.max(...values)
        fieldAnalysis.average = values.reduce((sum, val) => sum + val, 0) / values.length
      } else if (firstValue instanceof Date || this.isDateString(firstValue)) {
        fieldAnalysis.type = 'date'
        const dates = values.map(val => new Date(val)).filter(d => !isNaN(d))
        if (dates.length > 0) {
          fieldAnalysis.earliest = new Date(Math.min(...dates))
          fieldAnalysis.latest = new Date(Math.max(...dates))
        }
      } else if (typeof firstValue === 'boolean') {
        fieldAnalysis.type = 'boolean'
      } else {
        fieldAnalysis.type = 'categorical'
      }

      analysis[field] = fieldAnalysis
    })

    return analysis
  }

  extractFieldPaths(obj, prefix = '') {
    const paths = []
    
    Object.keys(obj).forEach(key => {
      const fullPath = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        paths.push(...this.extractFieldPaths(value, fullPath))
      } else {
        paths.push(fullPath)
      }
    })
    
    return paths
  }

  isDateString(str) {
    if (typeof str !== 'string') return false
    const date = new Date(str)
    return !isNaN(date) && str.match(/\d{4}-\d{2}-\d{2}/)
  }

  formatFieldLabel(field) {
    return field.split('.').pop()
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  generateSmartFilters(data, fieldAnalysis, suggestions) {
    // Recent items filter
    const dateFields = Object.entries(fieldAnalysis)
      .filter(([_, analysis]) => analysis.type === 'date')
      .map(([field]) => field)

    if (dateFields.length > 0) {
      suggestions.smartFilters.push({
        name: 'Recent Items',
        type: 'dateRange',
        field: dateFields[0],
        preset: 'last_7_days',
        description: 'Items from the last 7 days'
      })
    }

    // High-value items (if numeric fields exist)
    const numericFields = Object.entries(fieldAnalysis)
      .filter(([_, analysis]) => analysis.type === 'numeric')
      .map(([field, analysis]) => ({ field, ...analysis }))

    if (numericFields.length > 0) {
      const topField = numericFields.sort((a, b) => b.max - a.max)[0]
      suggestions.smartFilters.push({
        name: 'High Value Items',
        type: 'numericRange',
        field: topField.field,
        min: topField.average,
        description: `Items above average ${this.formatFieldLabel(topField.field)}`
      })
    }
  }

  getPopularFilters() {
    const filterCounts = {}
    
    this.filterHistory.forEach(entry => {
      Object.keys(entry.filters).forEach(filterType => {
        filterCounts[filterType] = (filterCounts[filterType] || 0) + 1
      })
    })

    return Object.entries(filterCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([filterType, count]) => ({
        type: filterType,
        usageCount: count,
        label: this.formatFieldLabel(filterType)
      }))
  }

  prepareExportData(data, fields, dateFormat) {
    return data.map(item => {
      const exportItem = {}
      
      if (fields && fields.length > 0) {
        fields.forEach(field => {
          const value = this.getNestedValue(item, field)
          exportItem[field] = this.formatExportValue(value, dateFormat)
        })
      } else {
        // Export all fields
        Object.keys(item).forEach(key => {
          exportItem[key] = this.formatExportValue(item[key], dateFormat)
        })
      }
      
      return exportItem
    })
  }

  formatExportValue(value, dateFormat) {
    if (value instanceof Date) {
      return formatInNepalTz(value, dateFormat)
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value)
    }
    return value
  }

  generateCSV(data, includeHeaders) {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    let csv = ''
    
    if (includeHeaders) {
      csv += headers.map(h => `"${h}"`).join(',') + '\n'
    }
    
    data.forEach(row => {
      csv += headers.map(header => {
        const value = row[header] || ''
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',') + '\n'
    })
    
    return csv
  }

  generateExcelData(data, includeHeaders) {
    // Simplified Excel generation - in production, use xlsx library
    return this.generateCSV(data, includeHeaders)
  }

  addToFilterHistory(filters, stats) {
    this.filterHistory.unshift({
      filters,
      stats,
      timestamp: getCurrentNepalTime()
    })
    
    // Keep only last 100 entries
    this.filterHistory = this.filterHistory.slice(0, 100)
    this.saveFilterHistory()
  }

  loadSavedViews() {
    try {
      const saved = localStorage.getItem('udaan_saved_views')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  saveSavedViews() {
    try {
      localStorage.setItem('udaan_saved_views', JSON.stringify(this.savedViews))
    } catch (error) {
      console.error('Failed to save views:', error)
    }
  }

  loadFilterHistory() {
    try {
      const history = localStorage.getItem('udaan_filter_history')
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }

  saveFilterHistory() {
    try {
      localStorage.setItem('udaan_filter_history', JSON.stringify(this.filterHistory))
    } catch (error) {
      console.error('Failed to save filter history:', error)
    }
  }
}

export default new AdvancedFilterService()