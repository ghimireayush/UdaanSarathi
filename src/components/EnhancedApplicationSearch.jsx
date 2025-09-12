import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, X, Users, Briefcase, MapPin } from 'lucide-react'
import { InteractiveSearch, InteractiveDropdown, InteractiveButton } from './InteractiveUI'
import searchService from '../services/searchService'

const EnhancedApplicationSearch = ({ 
  applications = [],
  jobs = [],
  onFilteredResults,
  onFilterChange,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState({
    stage: '',
    country: '',
    jobId: '',
    skills: []
  })
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Create search index for applications
  const searchIndex = useMemo(() => {
    if (applications.length === 0) return null

    const searchData = applications.map(app => ({
      ...app,
      candidateName: app.candidate?.name || '',
      candidateEmail: app.candidate?.email || '',
      candidatePhone: app.candidate?.phone || '',
      candidateSkills: app.candidate?.skills || [],
      jobTitle: app.job?.title || '',
      jobCompany: app.job?.company || '',
      jobCountry: app.job?.country || ''
    }))

    return searchService.createSearchIndex('applications', searchData, {
      keys: [
        { name: 'candidateName', weight: 0.3 },
        { name: 'candidateEmail', weight: 0.2 },
        { name: 'candidatePhone', weight: 0.2 },
        { name: 'candidateSkills', weight: 0.15 },
        { name: 'jobTitle', weight: 0.1 },
        { name: 'jobCompany', weight: 0.05 }
      ],
      threshold: 0.4
    })
  }, [applications])

  // Perform search when query or filters change
  useEffect(() => {
    if (!searchIndex) return

    const performSearch = async () => {
      setIsSearching(true)
      
      try {
        const results = searchService.search('applications', searchQuery, {
          filters: {
            custom: {
              stage: (item) => !activeFilters.stage || item.stage === activeFilters.stage,
              country: (item) => !activeFilters.country || item.jobCountry === activeFilters.country,
              job: (item) => !activeFilters.jobId || item.job_id === activeFilters.jobId,
              skills: (item) => {
                if (activeFilters.skills.length === 0) return true
                const candidateSkills = item.candidateSkills || []
                return activeFilters.skills.some(skill => 
                  candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
                )
              }
            }
          },
          sort: {
            field: 'applied_at',
            direction: 'desc',
            type: 'date'
          },
          pagination: {
            page: 1,
            limit: 100
          }
        })

        setSearchResults(results.results.map(r => r.item))
        onFilteredResults?.(results.results.map(r => r.item))
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults(applications)
        onFilteredResults?.(applications)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [searchQuery, activeFilters, searchIndex, applications, onFilteredResults])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    onFilterChange?.('search', query)
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(key, value)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setActiveFilters({
      stage: '',
      country: '',
      jobId: '',
      skills: []
    })
    onFilterChange?.('clear', null)
  }

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const stages = [...new Set(applications.map(app => app.stage))].filter(Boolean)
    const countries = [...new Set(jobs.map(job => job.country))].filter(Boolean)
    const skills = [...new Set(applications.flatMap(app => app.candidate?.skills || []))].filter(Boolean)

    return {
      stages: stages.map(stage => ({ value: stage, label: stage.charAt(0).toUpperCase() + stage.slice(1) })),
      countries: countries.map(country => ({ value: country, label: country })),
      jobs: jobs.map(job => ({ value: job.id, label: `${job.title} - ${job.company}` })),
      skills: skills.map(skill => ({ value: skill, label: skill }))
    }
  }, [applications, jobs])

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions = []
    
    // Add popular candidate names
    const candidateNames = applications
      .map(app => app.candidate?.name)
      .filter(Boolean)
      .slice(0, 5)
    
    candidateNames.forEach(name => {
      suggestions.push({
        text: name,
        description: 'Candidate name',
        icon: Users
      })
    })

    // Add popular job titles
    const jobTitles = [...new Set(jobs.map(job => job.title))].slice(0, 3)
    jobTitles.forEach(title => {
      suggestions.push({
        text: title,
        description: 'Job title',
        icon: Briefcase
      })
    })

    // Add popular countries
    const popularCountries = [...new Set(jobs.map(job => job.country))].slice(0, 3)
    popularCountries.forEach(country => {
      suggestions.push({
        text: country,
        description: 'Country',
        icon: MapPin
      })
    })

    return suggestions
  }, [applications, jobs])

  const hasActiveFilters = Object.values(activeFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  ) || searchQuery !== ''

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Search & Filter Applications</h3>
            {isSearching && (
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          
          {hasActiveFilters && (
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              icon={X}
            >
              Clear All
            </InteractiveButton>
          )}
        </div>

        {/* Main Search */}
        <InteractiveSearch
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearchChange}
          placeholder="Search by candidate name, email, phone, skills, or job..."
          suggestions={searchSuggestions}
          showSuggestions={true}
          debounceMs={300}
        />
      </div>

      {/* Advanced Filters */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Stage
          </label>
          <InteractiveDropdown
            options={filterOptions.stages}
            value={activeFilters.stage}
            onChange={(value) => handleFilterChange('stage', value)}
            placeholder="All Stages"
            size="sm"
          />
        </div>

        {/* Country Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <InteractiveDropdown
            options={filterOptions.countries}
            value={activeFilters.country}
            onChange={(value) => handleFilterChange('country', value)}
            placeholder="All Countries"
            size="sm"
          />
        </div>

        {/* Job Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Position
          </label>
          <InteractiveDropdown
            options={filterOptions.jobs}
            value={activeFilters.jobId}
            onChange={(value) => handleFilterChange('jobId', value)}
            placeholder="All Jobs"
            searchable={true}
            size="sm"
          />
        </div>

        {/* Skills Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills
          </label>
          <InteractiveDropdown
            options={filterOptions.skills}
            value={activeFilters.skills}
            onChange={(value) => handleFilterChange('skills', value)}
            placeholder="Any Skills"
            multiple={true}
            searchable={true}
            size="sm"
          />
        </div>
      </div>

      {/* Search Results Summary */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          {isSearching ? (
            'Searching...'
          ) : (
            `Found ${searchResults.length} application${searchResults.length !== 1 ? 's' : ''}`
          )}
          {searchQuery && (
            <span className="ml-2">
              for "<strong>{searchQuery}</strong>"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedApplicationSearch