import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './contexts/UserContext'

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
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </UserProvider>
  </React.StrictMode>,
)