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
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  
  // Mock mutation object for publish functionality
  const publishMutation = {
    isLoading: isPublishing
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
          <button className="btn-secondary flex items-center">
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
              <button className="text-sm text-gray-600 hover:text-gray-900">
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
                  <button className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                  <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Draft</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Draft creation functionality will be implemented here.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-primary"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Drafts