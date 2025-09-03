import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'

const InteractiveButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState([])

  const baseClasses = 'relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 shadow-md hover:shadow-lg',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-lg hover:shadow-xl',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const handleClick = (e) => {
    if (disabled || loading) return

    // Stop event propagation to prevent parent elements from capturing the click
    e.stopPropagation()

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    }

    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    // Call the onClick handler passed as prop
    if (onClick) {
      onClick(e)
    }
  }

  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseLeave = () => setIsPressed(false)

  return (
    <button
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${isPressed ? 'scale-95' : 'scale-100'}
        ${className}
      `}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white opacity-30 rounded-full animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '600ms'
          }}
        />
      ))}

      {/* Content */}
      <span className="relative flex items-center justify-center space-x-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4" />
        ) : null}
        <span>{children}</span>
      </span>
    </button>
  )
}

export default InteractiveButton