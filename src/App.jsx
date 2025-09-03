import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import JobShortlist from './pages/JobShortlist'

import Applications from './pages/Applications'
import Interviews from './pages/Interviews'
import Workflow from './pages/Workflow'
import Drafts from './pages/Drafts'
import AgencySettings from './pages/AgencySettings'
import Login from './pages/Login'
import AuditLogPage from './pages/AuditLog'

import MVPTestingDashboard from './components/MVPTestingDashboard.jsx'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'
import { NotificationProvider } from './contexts/NotificationContext'
import { PERMISSIONS } from './services/authService.js'
import i18nService from './services/i18nService'
import accessibilityService from './services/accessibilityService'

function App() {
  // Initialize i18n service
  useEffect(() => {
    i18nService.init()
    
    // Cleanup on unmount
    return () => {
      accessibilityService.cleanup()
    }
  }, [])

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ToastProvider>
          <ConfirmProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/jobs" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_JOBS}><Jobs /></PrivateRoute>} />
                  <Route path="/jobs/:id" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_JOBS}><JobDetails /></PrivateRoute>} />
                  <Route path="/jobs/:jobId/shortlist" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}><JobShortlist /></PrivateRoute>} />
                  <Route path="/applications" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}><Applications /></PrivateRoute>} />
                  <Route path="/interviews" element={<PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_INTERVIEWS, PERMISSIONS.SCHEDULE_INTERVIEW]}><Interviews /></PrivateRoute>} />
                  <Route path="/workflow" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_WORKFLOW}><Workflow /></PrivateRoute>} />
                  <Route path="/drafts" element={<PrivateRoute requiredPermissions={[PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB]}><Drafts /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}><AgencySettings /></PrivateRoute>} />
                  <Route path="/auditlog" element={<PrivateRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_LOGS}><AuditLogPage /></PrivateRoute>} />

                  <Route path="/mvp-testing" element={<PrivateRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}><MVPTestingDashboard /></PrivateRoute>} />
                </Routes>
              </Layout>
            } />
          </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </NotificationProvider>
    </ErrorBoundary>
  )
}

export default App