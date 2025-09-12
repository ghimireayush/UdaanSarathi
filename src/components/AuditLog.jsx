import React, { useState, useEffect } from 'react'
import {
  History,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Settings,
  Upload,
  Edit,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { auditService } from '../services/index.js'

const AuditLog = ({ resourceType = 'AGENCY_PROFILE', resourceId = 'agency_001' }) => {
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    resource_type: resourceType,
    resource_id: resourceId,
    page: 1,
    limit: 20
  })
  const [expandedLogs, setExpandedLogs] = useState(new Set())
  const [auditSummary, setAuditSummary] = useState(null)

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true)
        const [logsResponse, summary] = await Promise.all([
          auditService.getAuditLogs(filters),
          auditService.getAuditSummary(resourceType, resourceId)
        ])
        
        setAuditLogs(logsResponse.logs)
        setAuditSummary(summary)
      } catch (err) {
        setError('Failed to load audit logs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [filters, resourceType, resourceId])

  // Toggle expanded log details
  const toggleExpanded = (logId) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  // Get icon for action type
  const getActionIcon = (action) => {
    const icons = {
      'UPDATE': Edit,
      'CREATE': FileText,
      'DELETE': AlertCircle,
      'FILE_UPLOAD': Upload,
      'LOGIN': User,
      'LOGOUT': User
    }
    return icons[action] || Settings
  }

  // Get color for action type
  const getActionColor = (action) => {
    const colors = {
      'UPDATE': 'text-blue-600 bg-blue-100',
      'CREATE': 'text-green-600 bg-green-100',
      'DELETE': 'text-red-600 bg-red-100',
      'FILE_UPLOAD': 'text-purple-600 bg-purple-100',
      'LOGIN': 'text-gray-600 bg-gray-100',
      'LOGOUT': 'text-gray-600 bg-gray-100'
    }
    return colors[action] || 'text-gray-600 bg-gray-100'
  }

  // Format changes for display
  const formatChanges = (changes) => {
    return Object.entries(changes).map(([field, change]) => ({
      field,
      from: change.from,
      to: change.to
    }))
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Audit Summary */}
      {auditSummary && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="w-5 h-5 mr-2" />
            Audit Summary
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{auditSummary.total_changes}</div>
              <div className="text-sm text-gray-600">Total Changes</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{auditSummary.unique_users}</div>
              <div className="text-sm text-gray-600">Users Involved</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {auditSummary.first_change ? format(new Date(auditSummary.first_change), 'MMM d, yyyy') : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">First Change</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {auditSummary.last_change ? format(new Date(auditSummary.last_change), 'MMM d, yyyy') : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Last Change</div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Change History
          </h2>
          
          <div className="flex items-center space-x-2">
            <button className="btn-secondary text-sm flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {auditLogs.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">Changes will appear here once they are made.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map(log => {
              const ActionIcon = getActionIcon(log.action)
              const isExpanded = expandedLogs.has(log.id)
              const changes = formatChanges(log.changes)
              
              return (
                <div key={log.id} className="border border-gray-200 rounded-lg">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                          <ActionIcon className="w-4 h-4" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {auditService.getActionLabel(log.action)}
                            </span>
                            <span className="text-sm text-gray-500">
                              by {log.user_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(log.timestamp), 'PPp')}
                            </div>
                            
                            {changes.length > 0 && (
                              <div>
                                {changes.length} field{changes.length !== 1 ? 's' : ''} changed
                              </div>
                            )}
                            
                            {log.metadata?.section && (
                              <div className="chip chip-blue text-xs">
                                {log.metadata.section}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {changes.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Changes Made:</h4>
                          <div className="space-y-3">
                            {changes.map((change, index) => (
                              <div key={index} className="bg-white rounded-md p-3 border">
                                <div className="font-medium text-sm text-gray-700 mb-2">
                                  {change.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500 mb-1">From:</div>
                                    <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-red-800">
                                      {typeof change.from === 'object' 
                                        ? JSON.stringify(change.from, null, 2)
                                        : (change.from || 'Empty')
                                      }
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-gray-500 mb-1">To:</div>
                                    <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-green-800">
                                      {typeof change.to === 'object' 
                                        ? JSON.stringify(change.to, null, 2)
                                        : (change.to || 'Empty')
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600">No detailed changes recorded.</p>
                      )}
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-2">Additional Information:</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            {log.metadata.file_name && (
                              <div>File: {log.metadata.file_name}</div>
                            )}
                            {log.metadata.file_size && (
                              <div>Size: {(log.metadata.file_size / 1024).toFixed(1)} KB</div>
                            )}
                            {log.metadata.browser && (
                              <div>Browser: {log.metadata.browser}</div>
                            )}
                            <div>Session: {log.session_id}</div>
                            <div>IP: {log.ip_address}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLog