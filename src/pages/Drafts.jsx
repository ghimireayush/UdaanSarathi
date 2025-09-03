import React, { useState, useEffect } from 'react'
import { 
  Plus,
  Search,
  Grid3X3,
  List,
  Edit,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  X,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react'
import { jobService } from '../services/index.js'
import { format } from 'date-fns'

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
  const [draftMode, setDraftMode] = useState('newspaper') // 'newspaper', 'manual'
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
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
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load drafts</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
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
            <div key={draft.id} className={`card p-6 hover:shadow-lg transition-shadow duration-200 ${
              viewMode === 'list' ? 'flex items-center justify-between' : ''
            }`}>
              <div className={`${viewMode === 'list' ? 'flex items-center space-x-4 flex-1' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedDrafts.has(draft.id)}
                  onChange={() => handleDraftSelect(draft.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                
                <div className={`${viewMode === 'list' ? 'flex-1' : 'mt-4'}`}>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{draft.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{draft.company}</p>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{draft.country}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>{draft.salary_range}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{format(new Date(draft.created_at), 'MMM dd')}</span>
                    </div>
                  </div>
                  
                  {draft.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {draft.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`${viewMode === 'list' ? 'flex space-x-2' : 'flex justify-between items-center'}`}>
                <div className="flex space-x-2">
                  <button 
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
                    onClick={() => {
                      // In a real app, we would show a preview modal
                      alert(`Previewing draft: ${draft.title}`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                  <button 
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
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
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                
                <button
                  onClick={() => handlePublish(draft.id)}
                  className="btn-primary text-sm"
                  disabled={publishMutation.isLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Publish
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No drafts match your search criteria.' : 'Start creating job drafts to manage them here.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Draft
            </button>
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
                    draftMode === 'newspaper'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setDraftMode('newspaper')}
                >
                  From Newspaper
                </button>
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
              </div>
            </div>

            {draftMode === 'newspaper' ? (
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
                {/* Manual Entry Form */}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Create Drafts</h2>
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country-based bulk creation
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="12"
                      min="1"
                      value="12"
                    />
                    <span>jobs from</span>
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Malaysia">Malaysia</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="3"
                      min="1"
                      value="3"
                    />
                    <span>jobs from</span>
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="Malaysia">Malaysia</option>
                      <option value="UAE">UAE</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="Cook">Cook</option>
                  <option value="Driver">Driver</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Construction Worker">Construction Worker</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Mode
                </label>
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    Grid
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBulkCreateModal(false)
                  // In a real app, we would create the bulk drafts here
                }}
                className="btn-primary"
              >
                Create Drafts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Drafts