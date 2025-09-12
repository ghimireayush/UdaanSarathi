import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Grid3X3, 
  List, 
  Calendar,
  User,
  Info,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  MoreVertical,
  Plus,
  Send,
  AlertCircle,
  X,
  Save
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { jobService } from '../services/index.js'

const DraftListManagement = ({ onEdit, onPreview, onPublish, onDelete }) => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [drafts, setDrafts] = useState([])
  const [filteredDrafts, setFilteredDrafts] = useState([])
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_date')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [jobToPublish, setJobToPublish] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  // Fetch draft jobs
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setIsLoading(true)
        const draftJobs = await jobService.getDraftJobs()
        setDrafts(draftJobs)
        setFilteredDrafts(draftJobs)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrafts()
  }, [])

  // Filter and sort drafts
  useEffect(() => {
    let filtered = [...drafts]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(draft => 
        draft.title.toLowerCase().includes(term) ||
        draft.company.toLowerCase().includes(term) ||
        draft.id.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_date':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'company':
          return a.company.localeCompare(b.company)
        default:
          return 0
      }
    })

    setFilteredDrafts(filtered)
  }, [drafts, searchTerm, sortBy])

  // Handle draft selection
  const handleDraftSelect = (draftId) => {
    const newSelected = new Set(selectedDrafts)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedDrafts(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedDrafts.size === filteredDrafts.length) {
      setSelectedDrafts(new Set())
    } else {
      setSelectedDrafts(new Set(filteredDrafts.map(draft => draft.id)))
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDrafts.size === 0) return
    
    try {
      await jobService.deleteJobs(Array.from(selectedDrafts))
      setDrafts(prev => prev.filter(draft => !selectedDrafts.has(draft.id)))
      setSelectedDrafts(new Set())
    } catch (err) {
      setError('Failed to delete drafts')
    }
  }

  // Handle single delete
  const handleDelete = async (draftId) => {
    try {
      if (typeof onDelete === 'function') {
        await onDelete(draftId)
      } else {
        await jobService.deleteJob(draftId)
      }
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setFilteredDrafts(updatedDrafts)
    } catch (err) {
      setError('Failed to delete draft')
    }
  }

  // Validate draft before publishing
  const validateDraftForPublishing = (draft) => {
    const errors = []
    const requiredFields = [
      { field: 'title', label: 'Job Title' },
      { field: 'company', label: 'Company Name' },
      { field: 'description', label: 'Job Description' },
      { field: 'country', label: 'Country' },
      { field: 'category', label: 'Job Category' },
      { field: 'salary_amount', label: 'Salary Amount' },
      { field: 'salary_currency', label: 'Salary Currency' }
    ]

    requiredFields.forEach(({ field, label }) => {
      if (!draft[field] || (typeof draft[field] === 'string' && draft[field].trim() === '')) {
        errors.push(`${label} is required`)
      }
    })

    // Additional validations
    if (draft.salary_amount && draft.salary_amount <= 0) {
      errors.push('Salary amount must be greater than 0')
    }

    if (draft.description && draft.description.length < 50) {
      errors.push('Job description must be at least 50 characters long')
    }

    return errors
  }

  // Handle publish with validation
  const handlePublish = async (draftId) => {
    const draft = drafts.find(d => d.id === draftId)
    if (!draft) return

    const errors = validateDraftForPublishing(draft)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      setJobToPublish(draft)
      setShowValidationModal(true)
      return
    }

    try {
      if (typeof onPublish === 'function') {
        await onPublish(draftId)
      } else {
        await jobService.publishJob(draftId)
      }
      // Refresh drafts list after publishing
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setFilteredDrafts(updatedDrafts)
      setError(null)
    } catch (err) {
      setError('Failed to publish draft')
    }
  }

  // Handle bulk publish
  const handleBulkPublish = async () => {
    if (selectedDrafts.size === 0) return
    
    const draftsToPublish = drafts.filter(draft => selectedDrafts.has(draft.id))
    const allErrors = []
    
    draftsToPublish.forEach(draft => {
      const errors = validateDraftForPublishing(draft)
      if (errors.length > 0) {
        allErrors.push({ draft: draft.title, errors })
      }
    })

    if (allErrors.length > 0) {
      setValidationErrors(allErrors.flatMap(item => 
        item.errors.map(error => `${item.draft}: ${error}`)
      ))
      setShowValidationModal(true)
      return
    }

    try {
      const publishPromises = Array.from(selectedDrafts).map(draftId => 
        jobService.publishJob(draftId)
      )
      await Promise.all(publishPromises)
      // Refresh drafts list after bulk publishing
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setFilteredDrafts(updatedDrafts)
      setSelectedDrafts(new Set())
      setError(null)
    } catch (err) {
      setError('Failed to publish some drafts')
    }
  }

  // Get user display name (placeholder)
  const getUserName = () => "Current User"

  // Get Nepali date format with proper weekday names
  const getNepaliDate = (date) => {
    const jsDate = new Date(date)
    const weekdays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार']
    const weekday = weekdays[jsDate.getDay()]
    // For now using Gregorian date with Nepali weekday names
    // In production, you'd integrate with a proper Nepali calendar library
    return `${format(jsDate, 'MMM d, yyyy')} (${weekday})`
  }

  // Show info tooltip for date
  const showDateInfo = (draft) => {
    const jsDate = new Date(draft.created_at)
    const nepaliDate = getNepaliDate(draft.created_at)
    const relativeTime = formatDistanceToNow(jsDate, { addSuffix: true })
    
    alert(`Created: ${nepaliDate}\nRelative: ${relativeTime}\nBy: ${getUserName()}`)
  }

  // Handle edit job
  const handleEdit = (draft) => {
    // Trigger the JobCreationWizard in edit mode
    if (typeof onEdit === 'function') {
      onEdit(draft)
    }
    setEditingJob(null)
    setEditFormData({
      category: draft.category || '',
      salary_amount: draft.salary_amount || '',
      salary_currency: draft.salary_currency || draft.currency || '',
      employment_type: draft.employment_type || '',
      working_hours: draft.working_hours || '',
      accommodation: draft.accommodation || '',
      food: draft.food || '',
      visa_status: draft.visa_status || '',
      contract_duration: draft.contract_duration || '',
      requirements: Array.isArray(draft.requirements) ? draft.requirements.join('\n') : ''
    });

  }

  // Handle save draft
  const handleSave = async (draftId) => {
    try {
      const updatedData = {
        ...editFormData,
        requirements: editFormData.requirements.split('\n').filter(req => req.trim() !== ''),
        updated_at: new Date().toISOString()
      }
      
      await jobService.updateJob(draftId, updatedData)
      
      // Update local state
      setDrafts(prev => prev.map(draft => 
        draft.id === draftId ? { ...draft, ...updatedData } : draft
      ))
      
      setEditingJob(null)
      setEditFormData({})
      setError(null)
    } catch (err) {
      setError('Failed to save draft')
    }
  }

  // Handle preview job
  const handlePreview = (draft) => {
    // For now, show an alert with job details
    // In a real app, you'd open a preview modal or navigate to a preview page
    const preview = `
Job Title: ${draft.title || 'Not specified'}
Company: ${draft.company || 'Not specified'}
Country: ${draft.country || 'Not specified'}
Salary: ${draft.salary_amount ? `${draft.salary_amount} ${draft.currency || ''}` : 'Not specified'}
Description: ${draft.description || 'Not specified'}
    `.trim()
    
    alert(`Job Preview:\n\n${preview}`)
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingJob(null)
    setEditFormData({})
  }

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
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
          <h1 className="text-2xl font-bold text-gray-900">Draft Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your draft job postings before publishing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="btn-secondary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Draft
          </button>
          {selectedDrafts.size > 0 && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleBulkPublish}
                className="btn-primary flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Publish Selected ({selectedDrafts.size})
              </button>
              <button 
                onClick={handleBulkDelete}
                className="btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedDrafts.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, title, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* Sort */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="created_date">Created Date</option>
              <option value="title">Job Title</option>
              <option value="company">Company</option>
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {filteredDrafts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Grid3X3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first draft job posting'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="card overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center">
                <button
                  onClick={handleSelectAll}
                  className="mr-4"
                >
                  {selectedDrafts.size === filteredDrafts.length ? (
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <h2 className="text-lg font-medium text-gray-900">
                  Draft Jobs ({filteredDrafts.length})
                </h2>
              </div>
            </div>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 draft-grid">
              {filteredDrafts.map(draft => (
                <DraftCard 
                  key={draft.id}
                  draft={draft}
                  isSelected={selectedDrafts.has(draft.id)}
                  onSelect={() => handleDraftSelect(draft.id)}
                  onDelete={() => handleDelete(draft.id)}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onPublish={() => handlePublish(draft.id)}
                  getUserName={getUserName}
                  getNepaliDate={getNepaliDate}
                  showDateInfo={showDateInfo}
                  isEditing={editingJob === draft.id}
                  editFormData={editFormData}
                  onFormChange={handleFormChange}
                  onSave={handleSave}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center"
                        >
                          {selectedDrafts.size === filteredDrafts.length ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrafts.map(draft => (
                      <DraftRow 
                        key={draft.id}
                        draft={draft}
                        isSelected={selectedDrafts.has(draft.id)}
                        onSelect={() => handleDraftSelect(draft.id)}
                        onDelete={() => handleDelete(draft.id)}
                        onEdit={handleEdit}
                        onPreview={handlePreview}
                        getUserName={getUserName}
                        getNepaliDate={getNepaliDate}
                        showDateInfo={showDateInfo}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Validation Required
                </h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                The following fields are required before publishing:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              {jobToPublish && (
                <button
                  onClick={() => {
                    setShowValidationModal(false)
                    // Navigate to edit job (you'd implement this based on your routing)
                    console.log('Navigate to edit job:', jobToPublish.id)
                  }}
                  className="btn-primary text-sm"
                >
                  Edit Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Draft Card Component for Grid View
const DraftCard = ({ draft, isSelected, onSelect, onDelete, onEdit, onPreview, getUserName, getNepaliDate, showDateInfo, isEditing, editFormData, onFormChange, onSave, onCancelEdit, onPublish }) => {
  const [showMenu, setShowMenu] = useState(false)
  
  if (isEditing) {
    return (
      <div className="card p-6 relative draft-card bg-blue-50 border-blue-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Job</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => onFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter job title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                value={editFormData.company}
                onChange={(e) => onFormChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter company name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <select
                  value={editFormData.country}
                  onChange={(e) => onFormChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Country</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Oman">Oman</option>
                  <option value="Bahrain">Bahrain</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => onFormChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Category</option>
                  <option value="Cook">Cook</option>
                  <option value="Chef">Chef</option>
                  <option value="Driver">Driver</option>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Electrician">Electrician</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount *</label>
                <input
                  type="number"
                  value={editFormData.salary_amount}
                  onChange={(e) => onFormChange('salary_amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                <select
                  value={editFormData.salary_currency}
                  onChange={(e) => onFormChange('salary_currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Currency</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="QAR">QAR</option>
                  <option value="KWD">KWD</option>
                  <option value="OMR">OMR</option>
                  <option value="BHD">BHD</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => onFormChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
                placeholder="Enter job description (minimum 50 characters)"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft.id)}
              className="btn-secondary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={() => onPublish(draft.id)}
              className="btn-primary text-sm flex items-center"
            >
              <Send className="w-4 h-4 mr-1" />
              Publish
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`card p-6 relative draft-card ${isSelected ? 'selected' : ''}`}>
      {/* Selection Checkbox */}
      <button
        onClick={onSelect}
        className="absolute top-4 left-4"
      >
        {isSelected ? (
          <CheckSquare className="w-5 h-5 text-primary-600" />
        ) : (
          <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>

      {/* Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
            <div className="py-1">
              <button
                onClick={() => {
                  onPreview(draft)
                  setShowMenu(false)
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <button
                onClick={() => {
                  onEdit(draft)
                  setShowMenu(false)
                }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete()
                  setShowMenu(false)
                }}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{draft.title || 'Untitled Job'}</h3>
        <p className="text-sm text-gray-600 mb-1">{draft.company || 'No company specified'}</p>
        <p className="text-sm text-gray-500 mb-4">{draft.country || 'No country specified'}</p>
        
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <User className="w-3 h-3 mr-1" />
          <span>Created by {getUserName()}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}</span>
          <button 
            onClick={() => showDateInfo(draft)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            title="Show detailed date information"
          >
            <Info className="w-3 h-3" />
          </button>
        </div>
        
        <div className="text-xs text-gray-400 mb-4">
          {getNepaliDate(draft.created_at)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={() => onPreview(draft)}
            className="flex items-center px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </button>
          <button
            onClick={() => onEdit(draft)}
            className="flex items-center px-3 py-1 text-xs text-primary-600 hover:text-primary-800 border border-primary-300 rounded-md hover:bg-primary-50"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// Draft Row Component for List View
const DraftRow = ({ draft, isSelected, onSelect, onDelete, onEdit, onPreview, getUserName, getNepaliDate, showDateInfo }) => {
  return (
    <tr className={`draft-row ${isSelected ? 'selected' : ''}`}>
      <td className="px-6 py-4">
        <button onClick={onSelect}>
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">{draft.title || 'Untitled Job'}</div>
          <div className="text-sm text-gray-500">{draft.company || 'No company'} • {draft.country || 'No country'}</div>
          <div className="text-xs text-gray-400 font-mono">ID: {draft.id}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">
          <div className="flex items-center mb-1">
            <User className="w-3 h-3 mr-1" />
            <span>Created by {getUserName()}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            <span>{formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}</span>
            <button 
              onClick={() => showDateInfo(draft)}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Show detailed date information"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getNepaliDate(draft.created_at)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPreview(draft)}
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </button>
          <button
            onClick={() => onEdit(draft)}
            className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

export default DraftListManagement