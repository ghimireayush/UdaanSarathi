import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import InteractiveButton from './InteractiveButton'

const InteractiveNotification = ({ 
  type = 'info',
  title,
  message,
  isVisible = true,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  position = 'top-right',
  className = ''
}) => {
  const [show, setShow] = useState(isVisible)
  const [isAnimating, setIsAnimating] = useState(false)

  const types = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500',
      titleColor: 'text-green-800',
      messageColor: 'text-green-700'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      messageColor: 'text-yellow-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  const config = types[type]
  const Icon = config.icon

  useEffect(() => {
    if (isVisible) {
      setShow(true)
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  useEffect(() => {
    if (autoClose && show && isAnimating) {
      const timer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, show, isAnimating])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setShow(false)
      onClose?.()
    }, 300)
  }

  if (!show) return null

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full
        ${positions[position]}
        transition-all duration-300 transform
        ${isAnimating ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'}
        ${className}
      `}
    >
      <div
        className={`
          ${config.bgColor} ${config.borderColor}
          border rounded-lg shadow-lg p-4
        `}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-sm ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <InteractiveButton
            variant="ghost"
            size="sm"
            onClick={handleClose}
            icon={X}
            className="flex-shrink-0 -mt-1 -mr-1"
          />
        </div>

        {/* Progress Bar for Auto Close */}
        {autoClose && isAnimating && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-current h-1 rounded-full transition-all ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${autoCloseDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Notification Manager Hook
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const success = (title, message, options = {}) => 
    addNotification({ type: 'success', title, message, ...options })

  const error = (title, message, options = {}) => 
    addNotification({ type: 'error', title, message, ...options })

  const warning = (title, message, options = {}) => 
    addNotification({ type: 'warning', title, message, ...options })

  const info = (title, message, options = {}) => 
    addNotification({ type: 'info', title, message, ...options })

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}

export default InteractiveNotification