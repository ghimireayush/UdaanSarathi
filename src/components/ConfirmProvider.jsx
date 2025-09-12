// Confirmation Dialog Component
import { useState, createContext, useContext } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'

const ConfirmContext = createContext()

export const useConfirm = () => {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null)

  const confirm = (options) => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        onConfirm: () => {
          setDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setDialog(null)
          resolve(false)
        }
      })
    })
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialog {...dialog} />}
    </ConfirmContext.Provider>
  )
}

const ConfirmDialog = ({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info'
  onConfirm,
  onCancel
}) => {
  const getTypeConfig = (type) => {
    const configs = {
      warning: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        confirmBtn: 'btn-primary'
      },
      danger: {
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
      },
      info: {
        icon: Check,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        confirmBtn: 'btn-primary'
      }
    }
    return configs[type] || configs.warning
  }

  const config = getTypeConfig(type)
  const Icon = config.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} aria-hidden="true" />
            </div>
            <div className="ml-4 flex-1">
              <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p id="dialog-description" className="text-sm text-gray-600">
                {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary btn-mobile"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${config.confirmBtn} btn-mobile`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmProvider