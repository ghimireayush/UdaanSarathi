import React, { useState, useEffect } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import InteractiveButton from './InteractiveButton'

const InteractiveFilter = ({ 
  filters = {},
  onFilterChange,
  searchPlaceholder = "Search...",
  filterOptions = {},
  className = '',
  showClearAll = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange?.(key, value)
  }

  const handleClearAll = () => {
    const clearedFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    setLocalFilters(clearedFilters)
    Object.keys(clearedFilters).forEach(key => {
      onFilterChange?.(key, '')
    })
  }

  const hasActiveFilters = Object.values(localFilters).some(value => value && value !== '')

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                {Object.values(localFilters).filter(v => v && v !== '').length} active
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showClearAll && hasActiveFilters && (
              <InteractiveButton
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                icon={X}
              >
                Clear All
              </InteractiveButton>
            )}
            
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              icon={ChevronDown}
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </InteractiveButton>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 space-y-4">
          {/* Search Filter */}
          {filterOptions.search && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={localFilters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Dynamic Filter Options */}
          {Object.entries(filterOptions).map(([key, config]) => {
            if (key === 'search') return null

            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {config.label || key}
                </label>
                
                {config.type === 'select' && (
                  <select
                    value={localFilters[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="">{config.placeholder || `All ${config.label || key}`}</option>
                    {config.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {config.type === 'multiselect' && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {config.options?.map(option => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={(localFilters[key] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = localFilters[key] || []
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value)
                            handleFilterChange(key, newValues)
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {config.type === 'range' && (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={config.min || 0}
                      max={config.max || 100}
                      value={localFilters[key] || config.min || 0}
                      onChange={(e) => handleFilterChange(key, e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{config.min || 0}</span>
                      <span className="font-medium">{localFilters[key] || config.min || 0}</span>
                      <span>{config.max || 100}</span>
                    </div>
                  </div>
                )}

                {config.type === 'date' && (
                  <input
                    type="date"
                    value={localFilters[key] || ''}
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InteractiveFilter