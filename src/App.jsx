import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import Applications from './pages/Applications'
import Interviews from './pages/Interviews'
import Workflow from './pages/Workflow'
import Drafts from './pages/Drafts'
import AgencySettings from './pages/AgencySettings'
import Login from './pages/Login'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/jobs" element={<PrivateRoute requiredRole="recruiter"><Jobs /></PrivateRoute>} />
                  <Route path="/jobs/:id" element={<PrivateRoute requiredRole="recruiter"><JobDetails /></PrivateRoute>} />
                  <Route path="/applications" element={<PrivateRoute requiredRole="recruiter"><Applications /></PrivateRoute>} />
                  <Route path="/interviews" element={<PrivateRoute requiredRole="recruiter"><Interviews /></PrivateRoute>} />
                  <Route path="/workflow" element={<PrivateRoute requiredRole="coordinator"><Workflow /></PrivateRoute>} />
                  <Route path="/drafts" element={<PrivateRoute requiredRole="recruiter"><Drafts /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><AgencySettings /></PrivateRoute>} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App