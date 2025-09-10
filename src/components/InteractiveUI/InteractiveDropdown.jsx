import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const InteractiveDropdown = ({ 
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  multiple = false,
  searchable = false,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setHighlightedIndex(-1)
    }
  }

  const handleOptionClick = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value]
      onChange?.(newValues)
    } else {
      onChange?.(option.value)
      setIsOpen(false)
    }
    setSearchTerm('')
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleToggle()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleOptionClick(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  const getDisplayValue = () => {
    if (multiple) {
      const selectedOptions = options.filter(opt => 
        Array.isArray(value) && value.includes(opt.value)
      )
      if (selectedOptions.length === 0) return placeholder
      if (selectedOptions.length === 1) return selectedOptions[0].label
      return `${selectedOptions.length} selected`
    } else {
      const selectedOption = options.find(opt => opt.value === value)
      return selectedOption ? selectedOption.label : placeholder
    }
  }

  const isSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(option.value)
    }
    return value === option.value
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          transition-all duration-200
          ${sizes[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-200' : ''}
        `}
      >
        <span className={`truncate ${!value || (Array.isArray(value) && value.length === 0) ? 'text-gray-500' : 'text-gray-900'}`}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-primary-300 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center bg-gray-50">
                {searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`
                    w-full px-4 py-3 text-left text-sm flex items-center justify-between
                    transition-colors duration-150 border-b border-gray-100 last:border-b-0
                    ${index === highlightedIndex ? 'bg-primary-100 text-primary-800 font-medium' : 'hover:bg-gray-100'}
                    ${isSelected(option) ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-gray-900'}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected(option) && (
                    <Check className="w-4 h-4 text-primary-600 font-bold" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveDropdown