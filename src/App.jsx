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
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/workflow" element={<Workflow />} />
              <Route path="/drafts" element={<Drafts />} />
              <Route path="/settings" element={<AgencySettings />} />
            </Routes>
          </Layout>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App