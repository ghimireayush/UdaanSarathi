import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { auditService } from '../services/index.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import Loading from '../components/Loading.jsx'
import { InteractivePagination, PaginationInfo, ItemsPerPageSelector } from '../components/InteractiveUI'

const AuditLogPage = () => {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    user_id: '',
    resource_type: '',
    action: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  })
  const [expandedLogs, setExpandedLogs] = useState(new Set())
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true)
        const logsResponse = await auditService.getAuditLogs(filters)
        setAuditLogs(logsResponse.logs)
        setTotal(logsResponse.total)
        setTotalPages(logsResponse.total_pages)
      } catch (err) {
        setError('Failed to load audit logs')
        console.error('Audit log fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [filters])

  // Prepare downloadable PDF with jsPDF + html2canvas via dynamic import
  const logsContainerRef = useRef(null)
  const exportPDF = async () => {
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import('https://esm.sh/jspdf@2.5.1'),
        import('https://esm.sh/html2canvas@1.4.1')
      ])
      // Make html2canvas available for jsPDF.html
      // @ts-ignore
      window.html2canvas = html2canvas.default || html2canvas

      const now = new Date()
      // Build a lightweight container for export
      const wrapper = document.createElement('div')
      wrapper.style.width = '800px'
      wrapper.style.padding = '24px'
      wrapper.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial'
      wrapper.innerHTML = `
        <h1 style="font-size:20px;margin:0 0 12px;">Audit Log</h1>
        <div style="font-size:12px;color:#4B5563;margin-bottom:16px;">Exported: ${now.toLocaleString()} | Page ${filters.page} | Limit ${filters.limit}</div>
        ${filteredLogs.map(l => `
          <div style="border:1px solid #E5E7EB;border-radius:8px;margin:10px 0;page-break-inside:avoid;">
            <div style="padding:10px 12px;background:#F9FAFB;display:flex;align-items:center;justify-content:space-between;">
              <div style="font-weight:600;">${auditService.getActionLabel(l.action)} <span style="color:#6B7280;font-weight:400;">by ${l.user_name}</span></div>
              <div style="display:inline-block;padding:2px 8px;border-radius:9999px;background:#EEF2FF;color:#3730A3;font-size:10px;">${auditService.getResourceLabel(l.resource_type)}</div>
            </div>
            <div style="padding:12px;font-size:12px;">
              <div style="display:flex;gap:16px;color:#4B5563;"><div><strong>Timestamp:</strong> ${new Date(l.timestamp).toLocaleString()}</div><div><strong>User:</strong> ${l.user_id}</div></div>
              ${l.changes && Object.keys(l.changes).length ? `<div style="margin-top:8px;"><strong>Changes:</strong> ${Object.keys(l.changes).length} field(s)</div>` : ''}
              <div style="margin-top:8px;color:#6B7280;">Session: ${l.session_id || 'unknown_session'} | IP: ${l.ip_address || 'N/A'}</div>
            </div>
          </div>
        `).join('')}
      `
      document.body.appendChild(wrapper)

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      await doc.html(wrapper, {
        margin: [24, 24, 24, 24],
        autoPaging: 'text',
        x: 0,
        y: 0,
        html2canvas: { scale: 0.72, useCORS: true },
        callback: (doc) => {
          const file = `audit_logs_page${filters.page}_limit${filters.limit}.pdf`
          doc.save(file)
          document.body.removeChild(wrapper)
        }
      })
    } catch (e) {
      console.error('PDF export failed', e)
    }
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

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return auditLogs
    const q = search.toLowerCase()
    return auditLogs.filter(log => {
      return (
        log.user_name?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.resource_type?.toLowerCase().includes(q) ||
        auditService.getActionLabel(log.action)?.toLowerCase().includes(q) ||
        auditService.getResourceLabel(log.resource_type)?.toLowerCase().includes(q)
      )
    })
  }, [auditLogs, search])

  const exportCSV = () => {
    const headers = ['id','timestamp','user_id','user_name','action','resource_type','resource_id','ip_address','session_id']
    const rows = filteredLogs.map(l => headers.map(h => JSON.stringify(l[h] ?? (h==='timestamp'? new Date(l.timestamp).toISOString(): ''))).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_page${filters.page}_limit${filters.limit}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      user_id: '',
      resource_type: '',
      action: '',
      date_from: '',
      date_to: '',
      page: 1,
      limit: 20
    })
  }

  // Refresh logs
  const refreshLogs = () => {
    setFilters(prev => ({ ...prev }))
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        </div>
        <Loading />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <History className="w-6 h-6 mr-2" />
          Audit Log
        </h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs (user, action, resource)"
            className="input w-64"
          />
          <button 
            onClick={refreshLogs}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
          <button className="btn-outline" onClick={exportCSV}>Export CSV</button>
          <button className="btn-outline" onClick={exportPDF}>Download PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Users</option>
              <option value="user_1">System Administrator</option>
              <option value="user_2">Senior Recruiter</option>
              <option value="user_3">Interview Coordinator</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Types</option>
              <option value="AGENCY_PROFILE">Agency Profile</option>
              <option value="AGENCY_MEDIA">Agency Media</option>
              <option value="JOB_POSTING">Job Posting</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="APPLICATION">Application</option>
              <option value="USER">User</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Actions</option>
              <option value="UPDATE">Update</option>
              <option value="CREATE">Create</option>
              <option value="DELETE">Delete</option>
              <option value="FILE_UPLOAD">File Upload</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          
          <div className="flex items-end space-x-2">
            <button 
              onClick={resetFilters}
              className="btn-secondary w-full"
            >
              Reset
            </button>
          </div>
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

      {/* Audit Logs */}
      <div className="card p-6" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">Changes will appear here once they are made.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map(log => {
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
                            {log.metadata?.role && (
                              <span className="chip chip-purple text-xs">{log.metadata.role}</span>
                            )}
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
                            
                            {log.resource_type && (
                              <div className="chip chip-blue text-xs">
                                {auditService.getResourceLabel(log.resource_type)}
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
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500 mb-1">From:</div>
                                    <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-red-800 max-h-32 overflow-auto">
                                      {typeof change.from === 'object' 
                                        ? JSON.stringify(change.from, null, 2)
                                        : (change.from !== null && change.from !== undefined 
                                          ? change.from.toString() 
                                          : 'Empty')
                                      }
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-gray-500 mb-1">To:</div>
                                    <div className="bg-green-50 border border-green-200 rounded px-2 py-1 text-green-800 max-h-32 overflow-auto">
                                      {typeof change.to === 'object' 
                                        ? JSON.stringify(change.to, null, 2)
                                        : (change.to !== null && change.to !== undefined 
                                          ? change.to.toString() 
                                          : 'Empty')
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
                            {(log.metadata.browser || log.user_agent) && (
                              <div>Browser: {log.metadata.browser || log.user_agent}</div>
                            )}
                            {log.metadata.section && (
                              <div>Section: {log.metadata.section}</div>
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

      {/* Footer controls: Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <PaginationInfo
          currentPage={filters.page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={filters.limit}
        />
        <div className="flex items-center gap-4">
          <ItemsPerPageSelector
            value={filters.limit}
            onChange={(val) => setFilters(prev => ({ ...prev, limit: val, page: 1 }))}
            options={[10,20,50,100]}
          />
          <InteractivePagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

export default AuditLogPage