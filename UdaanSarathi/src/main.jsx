import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import './styles/ui-utilities.css'
import { AuthProvider } from './contexts/AuthContext'
// Demo components for testing new UI components and performance hooks
import ComponentDemo from './components/ui/ComponentDemo.jsx'
import PerformanceDemo from './components/PerformanceDemo.jsx'
import ValidationDemo from './components/ValidationDemo.jsx'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            <Route path="/component-demo" element={<ComponentDemo />} />
            <Route path="/performance-demo" element={<PerformanceDemo />} />
            <Route path="/validation-demo" element={<ValidationDemo />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
)


