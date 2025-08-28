// Toast Notification System
import { useState, useEffect, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (message, duration) => addToast(message, 'success', duration)
  const error = (message, duration) => addToast(message, 'error', duration)
  const warning = (message, duration) => addToast(message, 'warning', duration)
  const info = (message, duration) => addToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{ success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300) // Animation duration
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove()
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.duration])

  const getToastConfig = (type) => {
    const configs = {
      success: {
        icon: CheckCircle,
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        iconColor: 'text-white'
      },
      error: {
        icon: XCircle,
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        iconColor: 'text-white'
      },
      warning: {
        icon: AlertCircle,
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        iconColor: 'text-white'
      },
      info: {
        icon: Info,
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        iconColor: 'text-white'
      }
    }
    return configs[type] || configs.info
  }

  const config = getToastConfig(toast.type)
  const Icon = config.icon

  return (
    <div
      className={`
        ${config.bgColor} ${config.textColor}
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {toast.message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={handleRemove}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default ToastProvider