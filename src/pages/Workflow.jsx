import React, { useState, useEffect } from 'react'
import { 
  Search,
  Briefcase,
  User,
  Calendar,
  FileText,
  Upload,
  Check,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Paperclip
} from 'lucide-react'
import { workflowService, constantsService } from '../services/index.js'
import { format } from 'date-fns'

const Workflow = () => {
  const [activeTab, setActiveTab] = useState('by-job') // 'by-job' or 'by-applicant'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [workflows, setWorkflows] = useState([])
  const [workflowStages, setWorkflowStages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  
  // Derived state for different data views
  const candidatesByJob = workflows.filter(w => w.stage === 'ready_to_fly')
  const candidatesBySearch = searchQuery.length >= 3 ? searchResults : []

  // Fetch workflow data using service
  useEffect(() => {
    const fetchWorkflowData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [workflowsData, stagesData] = await Promise.all([
          workflowService.getWorkflowsWithDetails(),
          workflowService.getWorkflowStages()
        ])
        
        setWorkflows(workflowsData)
        setWorkflowStages(stagesData)
      } catch (err) {
        console.error('Failed to fetch workflow data:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkflowData()
  }, [])

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        try {
          const results = await workflowService.getWorkflowsWithDetails({ search: searchQuery })
          setSearchResults(results)
        } catch (err) {
          console.error('Search failed:', err)
        }
      } else {
        setSearchResults([])
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleDocumentUpload = async (candidateId, stage) => {
    try {
      await workflowService.addDocument(candidateId, {
        name: stage,
        status: 'received',
        received_at: new Date().toISOString()
      })
      
      // Refresh workflow data
      const updatedWorkflows = await workflowService.getWorkflowsWithDetails()
      setWorkflows(updatedWorkflows)
      
      console.log('Document uploaded for candidate:', candidateId, 'stage:', stage)
    } catch (error) {
      console.error('Failed to upload document:', error)
    }
  }

  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      const workflow = workflows.find(w => w.candidate_id === candidateId)
      if (workflow) {
        await workflowService.moveToNextStage(workflow.id, newStatus)
        
        // Refresh workflow data
        const updatedWorkflows = await workflowService.getWorkflowsWithDetails()
        setWorkflows(updatedWorkflows)
      }
      
      console.log('Status updated for candidate:', candidateId, 'to:', newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getStageColor = (stage) => {
    const stageInfo = workflowStages.find(s => s.id === stage)
    return stageInfo ? stageInfo.color : 'gray'
  }

  const getStageLabel = (stage) => {
    const stageInfo = workflowStages.find(s => s.id === stage)
    return stageInfo ? stageInfo.name : stage
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load workflow data</h2>
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
          <h1 className="text-2xl font-bold text-gray-900">Workflow</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track candidate journey from application to final deployment
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add to Workflow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('by-job')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'by-job'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4 mr-2 inline" />
            By Job
          </button>
          <button
            onClick={() => setActiveTab('by-applicant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'by-applicant'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4 mr-2 inline" />
            By Applicant
          </button>
        </nav>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search candidates by name, job, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'by-job' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidatesByJob.map(workflow => (
            <div key={workflow.id} className="card p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {workflow.candidate?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {workflow.candidate?.name || 'Unknown Candidate'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {workflow.job?.title || 'Unknown Job'} - {workflow.job?.company}
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{workflow.candidate?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{workflow.job?.country || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className={`chip chip-${getStageColor(workflow.stage)} text-xs`}>
                  {getStageLabel(workflow.stage)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setSelectedCandidate(workflow.candidate)
                    setShowSummary(true)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  <Eye className="w-4 h-4 mr-1 inline" />
                  View Details
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDocumentUpload(workflow.candidate_id, 'medical')}
                    className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    <Upload className="w-3 h-3 mr-1 inline" />
                    Upload
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(workflow.candidate_id, 'next_stage')}
                    className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    <Check className="w-3 h-3 mr-1 inline" />
                    Next
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'by-applicant' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Applicant Workflow Status</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map(workflow => (
                  <tr key={workflow.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-600">
                            {workflow.candidate?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workflow.candidate?.name || 'Unknown Candidate'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {workflow.candidate?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {workflow.job?.title || 'Unknown Job'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workflow.job?.company} - {workflow.job?.country}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`chip chip-${getStageColor(workflow.stage)} text-xs`}>
                        {getStageLabel(workflow.stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {workflow.updated_at ? format(new Date(workflow.updated_at), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedCandidate(workflow.candidate)
                          setShowSummary(true)
                        }}
                        className="text-primary-600 hover:text-primary-800 text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {workflows.length === 0 && (
        <div className="card p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates in workflow</h3>
          <p className="text-gray-600 mb-4">
            Candidates will appear here once they progress through the interview stage.
          </p>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate to Workflow
          </button>
        </div>
      )}

      {/* Candidate Summary Modal */}
      {showSummary && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Workflow Summary</h2>
              <button
                onClick={() => {
                  setShowSummary(false)
                  setSelectedCandidate(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-600">
                    {selectedCandidate.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.age} years, {selectedCandidate.gender}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{selectedCandidate.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Skills */}
              {selectedCandidate.skills && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Experience */}
              {selectedCandidate.experience && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                  <p className="text-gray-600">{selectedCandidate.experience}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSummary(false)
                  setSelectedCandidate(null)
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workflow