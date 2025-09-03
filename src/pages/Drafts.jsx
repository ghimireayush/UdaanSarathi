import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Copy, 
  Check, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Eye, 
  Edit, 
  X, 
  FileText,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail
} from 'lucide-react'
import { format } from 'date-fns'
import { jobService } from '../services/index.js'
import DraftListManagement from '../components/DraftListManagement'

const Drafts = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [draftMode, setDraftMode] = useState('manual') // 'manual', 'newspaper'
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    country: '',
    city: '',
    salary: '',
    currency: 'AED',
    description: '',
    requirements: '',
    tags: [],
    employment_type: 'Full-time',
    working_hours: '8 hours/day',
    accommodation: 'Provided',
    food: 'Provided',
    visa_status: 'Company will provide',
    contract_duration: '2 years',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    expenses: [],
    notes: '',
    ocrText: '',
    imageUrl: '',
    phoneNumberChunks: ['', '', '', ''],
    jobTitleTag: ''
  })
  const [companies, setCompanies] = useState([
    { name: 'Al Manara Restaurant', address: 'Dubai, UAE' },
    { name: 'Emirates Logistics', address: 'Abu Dhabi, UAE' },
    { name: 'Clean Pro Services', address: 'Doha, Qatar' },
    { name: 'SecureMax', address: 'Riyadh, Saudi Arabia' },
    { name: 'Royal Hotel', address: 'Sharjah, UAE' },
    { name: 'BuildTech UAE', address: 'Dubai, UAE' }
  ])
  const [jobTitles, setJobTitles] = useState([
    'Cook', 'Driver', 'Cleaner', 'Security Guard', 'Waiter', 
    'Construction Worker', 'Electrician', 'Plumber', 'Welder', 'Mechanic'
  ])
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false)
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [bulkCreateCountries, setBulkCreateCountries] = useState([{ country: 'UAE', jobCount: 3 }])
  const [bulkCreateJobType, setBulkCreateJobType] = useState('Cook')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)
  
  // Mock mutation object for publish functionality
  const publishMutation = {
    isLoading: isPublishing
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhoneNumberChange = (index, value) => {
    const newChunks = [...formData.phoneNumberChunks]
    newChunks[index] = value
    setFormData(prev => ({
      ...prev,
      phoneNumberChunks: newChunks
    }))
  }

  const handleCompanySelect = (company) => {
    setFormData(prev => ({
      ...prev,
      company: company.name,
      city: company.address.split(',')[0],
      country: company.address.split(',')[1].trim()
    }))
    setShowCompanyDropdown(false)
  }

  const handleJobTitleSelect = (title) => {
    setFormData(prev => ({
      ...prev,
      title: title,
      jobTitleTag: title
    }))
    setShowJobTitleDropdown(false)
  }

  const addExpense = () => {
    const newExpense = {
      description: '',
      amount: '',
      currency: 'AED'
    }
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }))
  }

  const updateExpense = (index, field, value) => {
    const updatedExpenses = [...formData.expenses]
    updatedExpenses[index][field] = value
    setFormData(prev => ({
      ...prev,
      expenses: updatedExpenses
    }))
  }

  const removeExpense = (index) => {
    const updatedExpenses = [...formData.expenses]
    updatedExpenses.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      expenses: updatedExpenses
    }))
  }

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const simulateOCRExtraction = () => {
    // Simulate OCR extraction with sample data
    const sampleOCRText = `Job Title: Cook
Company: Al Manara Restaurant
Location: Dubai, UAE
Salary: 2500 AED
Contact: John Smith, 0501234567, john@almanara.com
Requirements:
- 2 years experience
- Arabic speaking
- Valid food handling certificate`;
    
    setFormData(prev => ({
      ...prev,
      ocrText: sampleOCRText,
      title: 'Cook',
      company: 'Al Manara Restaurant',
      city: 'Dubai',
      country: 'UAE',
      salary: '2500',
      currency: 'AED',
      contact_person: 'John Smith',
      contact_phone: '0501234567',
      contact_email: 'john@almanara.com',
      requirements: '- 2 years experience\n- Arabic speaking\n- Valid food handling certificate'
    }));
  }

  const handleCreateDraft = async () => {
    try {
      const newDraft = {
        title: formData.title,
        company: formData.company,
        country: formData.country,
        city: formData.city,
        published_at: null,
        salary: `${formData.salary} ${formData.currency}`,
        currency: formData.currency,
        salary_amount: parseInt(formData.salary) || 0,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        description: formData.description,
        tags: formData.tags,
        category: formData.title,
        employment_type: formData.employment_type,
        working_hours: formData.working_hours,
        accommodation: formData.accommodation,
        food: formData.food,
        visa_status: formData.visa_status,
        contract_duration: formData.contract_duration,
        contact_person: formData.contact_person,
        contact_phone: formData.phoneNumberChunks.join('') || formData.contact_phone,
        contact_email: formData.contact_email,
        expenses: formData.expenses,
        notes: formData.notes
      }

      await jobService.createDraftJob(newDraft)
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setShowCreateModal(false)
      
      // Reset form
      setFormData({
        title: '',
        company: '',
        country: '',
        city: '',
        salary: '',
        currency: 'AED',
        description: '',
        requirements: '',
        tags: [],
        employment_type: 'Full-time',
        working_hours: '8 hours/day',
        accommodation: 'Provided',
        food: 'Provided',
        visa_status: 'Company will provide',
        contract_duration: '2 years',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        expenses: [],
        notes: '',
        ocrText: '',
        imageUrl: '',
        phoneNumberChunks: ['', '', '', ''],
        jobTitleTag: ''
      })
    } catch (error) {
      console.error('Failed to create draft:', error)
    }
  }

  // Fetch drafts data using service
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const draftsData = await jobService.getDraftJobs()
        setDrafts(draftsData)
      } catch (err) {
        console.error('Failed to fetch drafts:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrafts()
  }, [])

  const handleDraftSelect = (draftId) => {
    const newSelected = new Set(selectedDrafts)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedDrafts(newSelected)
  }

  const handlePublish = async (draftId) => {
    try {
      setIsPublishing(true)
      await jobService.publishJob(draftId)
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
    } catch (error) {
      console.error('Failed to publish draft:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const filteredDrafts = drafts.filter(draft => 
    draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-28"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Search and Controls Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 rounded w-80"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Status bar */}
                <div className="h-1 bg-gray-200"></div>
                
                <div className="p-6 pt-12">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-12"></div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <div className="h-7 bg-gray-200 rounded w-16"></div>
                      <div className="h-7 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Failed to load drafts</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We encountered an issue while loading your drafts. Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Try Again
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Draft
              </button>
            </div>
            {error.message && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-mono">{error.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage job draft postings before publishing
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            className="btn-secondary flex items-center"
            onClick={() => setShowBulkCreateModal(true)}
          >
            <Copy className="w-4 h-4 mr-2" />
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Draft
          </button>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search drafts by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDrafts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedDrafts.size} draft{selectedDrafts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  selectedDrafts.forEach(draftId => handlePublish(draftId))
                  setSelectedDrafts(new Set())
                }}
                className="btn-primary text-sm"
                disabled={publishMutation.isLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                Publish Selected
              </button>
              <button 
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={async () => {
                  try {
                    // Delete all selected drafts
                    const deletePromises = Array.from(selectedDrafts).map(draftId => 
                      jobService.deleteJob(draftId)
                    )
                    await Promise.all(deletePromises)
                    
                    // Refresh drafts data
                    const updatedDrafts = await jobService.getDraftJobs()
                    setDrafts(updatedDrafts)
                    setSelectedDrafts(new Set())
                  } catch (error) {
                    console.error('Failed to delete drafts:', error)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2 inline" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Cards */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {filteredDrafts.length > 0 ? (
          filteredDrafts.map(draft => (
            <div key={draft.id} className={`group relative bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden ${
              viewMode === 'list' ? 'flex items-center' : ''
            }`}>
              {/* Status Indicator */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-500"></div>
              
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedDrafts.has(draft.id)}
                  onChange={() => handleDraftSelect(draft.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
                />
              </div>

              <div className={`${viewMode === 'list' ? 'flex items-center flex-1 p-6' : 'p-6 pt-12'}`}>
                {/* Card Header */}
                <div className={`${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                        {draft.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-semibold">
                            {draft.company?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <span className="font-medium">{draft.company}</span>
                      </div>
                    </div>
                    
                    {/* Draft Status Badge */}
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1.5"></div>
                        Draft
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{draft.city || draft.country}</span>
                      {draft.city && draft.country && (
                        <span className="text-gray-400 mx-1">•</span>
                      )}
                      {draft.city && <span>{draft.country}</span>}
                    </div>
                    
                    {draft.salary_range && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-semibold text-green-600">{draft.salary_range}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Created {format(new Date(draft.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {draft.tags && draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {draft.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {draft.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          +{draft.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {draft.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {draft.description}
                    </p>
                  )}

                  {/* Requirements Preview */}
                  {draft.requirements && Array.isArray(draft.requirements) && draft.requirements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Requirements:</p>
                      <div className="text-xs text-gray-600 space-y-1">
                        {draft.requirements.slice(0, 2).map((req, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                            <span className="line-clamp-1">{req}</span>
                          </div>
                        ))}
                        {draft.requirements.length > 2 && (
                          <span className="text-gray-500 text-xs">+{draft.requirements.length - 2} more requirements</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className={`${viewMode === 'list' ? 'flex items-center space-x-3 ml-6' : 'flex items-center justify-between pt-4 border-t border-gray-100'}`}>
                  <div className="flex items-center space-x-2">
                    <button 
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setPreviewDraft(draft)
                        setShowPreviewModal(true)
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </button>
                    <button 
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        // Set form data to draft values and open modal
                        setFormData({
                          title: draft.title,
                          company: draft.company,
                          country: draft.country,
                          city: draft.city,
                          salary: draft.salary_amount || '',
                          currency: draft.currency || 'AED',
                          description: draft.description || '',
                          requirements: Array.isArray(draft.requirements) ? draft.requirements.join('\n') : '',
                          tags: Array.isArray(draft.tags) ? draft.tags : [],
                          employment_type: draft.employment_type || 'Full-time',
                          working_hours: draft.working_hours || '8 hours/day',
                          accommodation: draft.accommodation || 'Provided',
                          food: draft.food || 'Provided',
                          visa_status: draft.visa_status || 'Company will provide',
                          contract_duration: draft.contract_duration || '2 years',
                          contact_person: draft.contact_person || '',
                          contact_phone: draft.contact_phone || '',
                          contact_email: draft.contact_email || '',
                          expenses: Array.isArray(draft.expenses) ? draft.expenses : [],
                          notes: draft.notes || '',
                          ocrText: '',
                          imageUrl: '',
                          phoneNumberChunks: ['', '', '', ''],
                          jobTitleTag: ''
                        })
                        setShowCreateModal(true)
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handlePublish(draft.id)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={publishMutation.isLoading}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    {publishMutation.isLoading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))
        ) : (
          <div className="col-span-3">
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchQuery ? 'No matching drafts' : 'No drafts yet'}
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {searchQuery 
                    ? 'Try adjusting your search criteria or create a new draft that matches your needs.' 
                    : 'Create your first job draft to get started. You can build from scratch or extract from newspaper ads.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Draft
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Draft Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Draft</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Draft Creation Mode Selector */}
            <div className="mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    draftMode === 'manual'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setDraftMode('manual')}
                >
                  Manual Entry
                </button>
                <button
                  className={`py-2 px-4 font-medium text-sm ${
                    draftMode === 'newspaper'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setDraftMode('newspaper')}
                >
                  From Newspaper
                </button>
              </div>
            </div>

            {draftMode === 'manual' ? (
              <div className="space-y-6">
                {/* Newspaper Integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image/URL
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload an image</span>
                          <input type="file" className="sr-only" accept="image/*" />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">or paste image URL below</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Paste image URL"
                        className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={formData.imageUrl}
                        onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OCR Extracted Text
                    </label>
                    <textarea
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="OCR text will appear here..."
                      value={formData.ocrText}
                      onChange={(e) => handleInputChange('ocrText', e.target.value)}
                    />
                    <button 
                      className="mt-2 btn-secondary text-sm"
                      onClick={simulateOCRExtraction}
                    >
                      Simulate OCR Extraction
                    </button>
                  </div>
                </div>
                
                {/* Auto-suggest Company Names */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Start typing company name..."
                      value={formData.company}
                      onChange={(e) => {
                        handleInputChange('company', e.target.value);
                        setShowCompanyDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                    />
                    {showCompanyDropdown && formData.company && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                        {companies
                          .filter(company => 
                            company.name.toLowerCase().includes(formData.company.toLowerCase())
                          )
                          .map((company, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => handleCompanySelect(company)}
                            >
                              <div className="font-medium">{company.name}</div>
                              <div className="text-sm text-gray-600">{company.address}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Newspaper Integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter job title"
                        value={formData.title}
                        onChange={(e) => {
                          handleInputChange('title', e.target.value);
                          setShowJobTitleDropdown(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowJobTitleDropdown(true)}
                        onBlur={() => setTimeout(() => setShowJobTitleDropdown(false), 200)}
                      />
                      {showJobTitleDropdown && formData.title && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                          {jobTitles
                            .filter(title => 
                              title.toLowerCase().includes(formData.title.toLowerCase())
                            )
                            .map((title, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleJobTitleSelect(title)}
                              >
                                {title}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    {formData.jobTitleTag && (
                      <div className="mt-2 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formData.jobTitleTag}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter company name"
                        value={formData.company}
                        onChange={(e) => {
                          handleInputChange('company', e.target.value);
                          setShowCompanyDropdown(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                      />
                      {showCompanyDropdown && formData.company && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                          {companies
                            .filter(company => 
                              company.name.toLowerCase().includes(formData.company.toLowerCase())
                            )
                            .map((company, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onMouseDown={() => handleCompanySelect(company)}
                              >
                                <div className="font-medium">{company.name}</div>
                                <div className="text-sm text-gray-600">{company.address}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    >
                      <option value="">Select country</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                      <option value="Bahrain">Bahrain</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary *
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Amount"
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                      />
                      <select
                        className="border-t border-b border-r border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                      >
                        <option value="AED">AED</option>
                        <option value="SAR">SAR</option>
                        <option value="QAR">QAR</option>
                        <option value="KWD">KWD</option>
                        <option value="OMR">OMR</option>
                        <option value="BHD">BHD</option>
                        <option value="MYR">MYR</option>
                        <option value="SGD">SGD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter contact person name"
                      value={formData.contact_person}
                      onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter contact email"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone (4-digit chunks)
                    </label>
                    <div className="flex space-x-2">
                      {[0, 1, 2, 3].map(index => (
                        <input
                          key={index}
                          type="text"
                          maxLength="4"
                          className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center"
                          placeholder="0000"
                          value={formData.phoneNumberChunks[index]}
                          onChange={(e) => handlePhoneNumberChange(index, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter job description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements (one per line)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter job requirements, one per line"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                  />
                </div>
                
                {/* Expense Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expenses
                  </label>
                  <div className="space-y-2">
                    {formData.expenses.map((expense, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Expense description"
                          value={expense.description}
                          onChange={(e) => updateExpense(index, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Amount"
                          value={expense.amount}
                          onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                        />
                        <select 
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={expense.currency}
                          onChange={(e) => updateExpense(index, 'currency', e.target.value)}
                        >
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                          <option value="QAR">QAR</option>
                          <option value="KWD">KWD</option>
                          <option value="OMR">OMR</option>
                          <option value="BHD">BHD</option>
                          <option value="MYR">MYR</option>
                          <option value="SGD">SGD</option>
                        </select>
                        <button 
                          className="btn-secondary p-2"
                          onClick={() => removeExpense(index)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      className="btn-secondary text-sm flex items-center"
                      onClick={addExpense}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Expense
                    </button>
                  </div>
                </div>
                
                {/* Template-based Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter additional notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      onClick={() => addTag('Visa processing time: 2 weeks')}
                    >
                      Visa processing time: 2 weeks
                    </button>
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      onClick={() => addTag('Medical check required')}
                    >
                      Medical check required
                    </button>
                    <button 
                      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      onClick={() => addTag('Accommodation provided')}
                    >
                      Accommodation provided
                    </button>
                  </div>
                </div>
                
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button 
                          type="button" 
                          className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDraft}
                className="btn-primary"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Create Modal */}
      {showBulkCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Create Drafts</h2>
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Countries Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Countries & Job Count
                  </label>
                  <button
                    onClick={() => {
                      setBulkCreateCountries([...bulkCreateCountries, { country: 'UAE', jobCount: 3 }])
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Country
                  </button>
                </div>
                
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {bulkCreateCountries.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="number"
                        className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="3"
                        min="1"
                        max="50"
                        value={item.jobCount}
                        onChange={(e) => {
                          const newCountries = [...bulkCreateCountries]
                          newCountries[index].jobCount = parseInt(e.target.value) || 1
                          setBulkCreateCountries(newCountries)
                        }}
                      />
                      <span className="text-sm text-gray-600">jobs from</span>
                      <select 
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={item.country}
                        onChange={(e) => {
                          const newCountries = [...bulkCreateCountries]
                          newCountries[index].country = e.target.value
                          setBulkCreateCountries(newCountries)
                        }}
                      >
                        <option value="UAE">UAE</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Oman">Oman</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Singapore">Singapore</option>
                      </select>
                      {bulkCreateCountries.length > 1 && (
                        <button
                          onClick={() => {
                            const newCountries = bulkCreateCountries.filter((_, i) => i !== index)
                            setBulkCreateCountries(newCountries)
                          }}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Summary */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 font-medium">
                      Total: {bulkCreateCountries.reduce((sum, item) => sum + item.jobCount, 0)} jobs
                    </span>
                    <span className="text-blue-600">
                      across {bulkCreateCountries.length} {bulkCreateCountries.length === 1 ? 'country' : 'countries'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={bulkCreateJobType}
                  onChange={(e) => setBulkCreateJobType(e.target.value)}
                >
                  <option value="Cook">Cook</option>
                  <option value="Driver">Driver</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Construction Worker">Construction Worker</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Nanny">Nanny</option>
                </select>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Salary Range
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="1000-1500">1000-1500 AED</option>
                    <option value="1500-2000">1500-2000 AED</option>
                    <option value="2000-2500">2000-2500 AED</option>
                    <option value="2500-3000">2500-3000 AED</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowBulkCreateModal(false)
                  // Reset to default
                  setBulkCreateCountries([{ country: 'UAE', jobCount: 3 }])
                  setBulkCreateJobType('Cook')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const totalJobs = bulkCreateCountries.reduce((sum, item) => sum + item.jobCount, 0)
                  
                  // In a real app, we would create the bulk drafts here
                  console.log('Creating bulk drafts:', {
                    countries: bulkCreateCountries,
                    jobType: bulkCreateJobType,
                    totalJobs
                  })
                  
                  setShowBulkCreateModal(false)
                  
                  // Show success message (you could add a toast notification here)
                  alert(`Creating ${totalJobs} ${bulkCreateJobType} job drafts across ${bulkCreateCountries.length} countries`)
                }}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Create {bulkCreateCountries.reduce((sum, item) => sum + item.jobCount, 0)} Drafts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Job Preview</h2>
                <p className="text-sm text-gray-600 mt-1">Preview how this job will appear when published</p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDraft(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Job Preview Content */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{previewDraft.title}</h1>
                    <div className="flex items-center text-lg text-gray-700 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-semibold">
                          {previewDraft.company?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <span className="font-semibold">{previewDraft.company}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-2">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {previewDraft.salary_range || 'Negotiable'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Posted {format(new Date(previewDraft.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                    <span>{previewDraft.city || previewDraft.country}</span>
                    {previewDraft.city && previewDraft.country && (
                      <span>, {previewDraft.country}</span>
                    )}
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                    <span>{previewDraft.employment_type || 'Full-time'}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-2 text-primary-600" />
                    <span>{previewDraft.working_hours || '8 hours/day'}</span>
                  </div>
                </div>

                {previewDraft.tags && previewDraft.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewDraft.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-primary-700 border border-primary-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {previewDraft.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <p className="whitespace-pre-wrap">{previewDraft.description}</p>
                      </div>
                    </div>
                  )}

                  {previewDraft.requirements && Array.isArray(previewDraft.requirements) && previewDraft.requirements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {previewDraft.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-gray-700">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Employment Type</span>
                        <p className="text-gray-900">{previewDraft.employment_type || 'Full-time'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Working Hours</span>
                        <p className="text-gray-900">{previewDraft.working_hours || '8 hours/day'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contract Duration</span>
                        <p className="text-gray-900">{previewDraft.contract_duration || '2 years'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Accommodation</span>
                        <p className="text-gray-900">{previewDraft.accommodation || 'Provided'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Food</span>
                        <p className="text-gray-900">{previewDraft.food || 'Provided'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Visa Status</span>
                        <p className="text-gray-900">{previewDraft.visa_status || 'Company will provide'}</p>
                      </div>
                    </div>
                  </div>

                  {(previewDraft.contact_person || previewDraft.contact_phone || previewDraft.contact_email) && (
                    <div className="bg-primary-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                      <div className="space-y-2">
                        {previewDraft.contact_person && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-primary-600" />
                            <span className="text-gray-700">{previewDraft.contact_person}</span>
                          </div>
                        )}
                        {previewDraft.contact_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-primary-600" />
                            <span className="text-gray-700">{previewDraft.contact_phone}</span>
                          </div>
                        )}
                        {previewDraft.contact_email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-primary-600" />
                            <span className="text-gray-700">{previewDraft.contact_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                This is how your job posting will appear to candidates
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handlePublish(previewDraft.id)
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={publishMutation.isLoading}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Publish Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Drafts