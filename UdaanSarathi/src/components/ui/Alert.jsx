import { cva } from 'class-variance-authority'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle, 
  X 
} from 'lucide-react'

const alertVariants = cva(
  "rounded-lg border p-4 backdrop-blur-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-white/80 border-gray-200/50 text-gray-800",
        success: "bg-green-50/80 border-green-200/50 text-green-800",
        warning: "bg-yellow-50/80 border-yellow-200/50 text-yellow-800",
        error: "bg-red-50/80 border-red-200/50 text-red-800",
        info: "bg-blue-50/80 border-blue-200/50 text-blue-800"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const iconMap = {
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info
}

const Alert = ({ 
  children, 
  variant = "default", 
  title, 
  className = "", 
  onClose,
  ...props 
}) => {
  const Icon = iconMap[variant] || Info

  return (
    <div
      role="alert"
      className={alertVariants({ variant, className })}
      {...props}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${
            variant === 'success' ? 'text-green-500' :
            variant === 'warning' ? 'text-yellow-500' :
            variant === 'error' ? 'text-red-500' :
            variant === 'info' ? 'text-blue-500' :
            'text-gray-500'
          }`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${
              variant === 'success' ? 'text-green-800' :
              variant === 'warning' ? 'text-yellow-800' :
              variant === 'error' ? 'text-red-800' :
              variant === 'info' ? 'text-blue-800' :
              'text-gray-800'
            }`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${
            variant === 'success' ? 'text-green-700' :
            variant === 'warning' ? 'text-yellow-700' :
            variant === 'error' ? 'text-red-700' :
            variant === 'info' ? 'text-blue-700' :
            'text-gray-700'
          }`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${
                variant === 'success' ? 'text-green-500 hover:text-green-700' :
                variant === 'warning' ? 'text-yellow-500 hover:text-yellow-700' :
                variant === 'error' ? 'text-red-500 hover:text-red-700' :
                variant === 'info' ? 'text-blue-500 hover:text-blue-700' :
                'text-gray-500 hover:text-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                variant === 'success' ? 'focus:ring-green-500' :
                variant === 'warning' ? 'focus:ring-yellow-500' :
                variant === 'error' ? 'focus:ring-red-500' :
                variant === 'info' ? 'focus:ring-blue-500' :
                'focus:ring-gray-500'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export { Alert, alertVariants }