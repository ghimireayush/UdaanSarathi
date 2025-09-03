import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

const InteractiveSearch = ({ 
  value = '',
  onChange,
  onSearch,
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  showSuggestions = true,
  debounceMs = 300,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onChange?.(localValue)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localValue, onChange, debounceMs])

  const handleInputChange = (e) => {
    setLocalValue(e.target.value)
    setShowDropdown(true)
    setHighlightedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    if (showSuggestions) {
      setShowDropdown(true)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 150)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return

    const allSuggestions = [
      ...suggestions,
      ...recentSearches.map(s => ({ text: s, type: 'recent' })),
      ...popularSearches.map(s => ({ text: s, type: 'popular' }))
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSuggestionClick(allSuggestions[highlightedIndex].text)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowDropdown(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSearch = () => {
    onSearch?.(localValue)
    setShowDropdown(false)
  }

  const handleSuggestionClick = (suggestion) => {
    setLocalValue(suggestion)
    onChange?.(suggestion)
    onSearch?.(suggestion)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setLocalValue('')
    onChange?.('')
    inputRef.current?.focus()
  }

  const allSuggestions = [
    ...suggestions.map(s => ({ ...s, type: s.type || 'suggestion' })),
    ...recentSearches.map(s => ({ text: s, type: 'recent' })),
    ...popularSearches.map(s => ({ text: s, type: 'popular' }))
  ]

  const filteredSuggestions = localValue
    ? allSuggestions.filter(s => 
        s.text.toLowerCase().includes(localValue.toLowerCase())
      )
    : allSuggestions.slice(0, 8)

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`
        relative flex items-center bg-white border rounded-lg transition-all duration-200
        ${isFocused ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300'}
        ${showDropdown ? 'rounded-b-none' : ''}
      `}>
        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-transparent focus:outline-none"
        />

        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border border-t-0 border-gray-300 rounded-b-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.text}-${index}`}
              onClick={() => handleSuggestionClick(suggestion.text)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3
                ${index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}
              `}
            >
              {suggestion.type === 'recent' && (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
              {suggestion.type === 'popular' && (
                <TrendingUp className="w-4 h-4 text-gray-400" />
              )}
              {suggestion.type === 'suggestion' && suggestion.icon && (
                <suggestion.icon className="w-4 h-4 text-gray-400" />
              )}
              
              <div className="flex-1">
                <div className="font-medium">{suggestion.text}</div>
                {suggestion.description && (
                  <div className="text-sm text-gray-500">{suggestion.description}</div>
                )}
              </div>

              {suggestion.type === 'recent' && (
                <span className="text-xs text-gray-400">Recent</span>
              )}
              {suggestion.type === 'popular' && (
                <span className="text-xs text-gray-400">Popular</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default InteractiveSearch