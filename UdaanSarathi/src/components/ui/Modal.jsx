import { Fragment } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  }

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEscKey = (e) => {
    if (closeOnEsc && e.key === 'Escape') {
      onClose()
    }
  }

  return createPortal(
    <Fragment>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        onClick={handleOverlayClick}
        onKeyDown={handleEscKey}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div 
            className={`
              glass-effect-strong rounded-xl shadow-xl transform transition-all duration-300
              w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col
              animate-fade-in
            `}
          >
            {title && (
              <CardHeader className="flex items-center justify-between">
                <CardTitle id="modal-title" className="text-lg">
                  {title}
                </CardTitle>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded-full p-1 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </CardHeader>
            )}
            
            <CardContent className="flex-grow overflow-y-auto max-h-[70vh]">
              {children}
            </CardContent>
            
            {footer && (
              <CardFooter className="flex justify-end space-x-3">
                {footer}
              </CardFooter>
            )}
          </div>
        </div>
      </div>
    </Fragment>,
    document.body
  )
}

export { Modal }