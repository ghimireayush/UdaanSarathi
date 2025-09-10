import React, { useState } from 'react'

const InteractiveCard = ({ 
  children, 
  onClick,
  hoverable = true,
  clickable = false,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'bg-white rounded-lg border transition-all duration-200'
  
  const variants = {
    default: 'border-gray-200 shadow-sm',
    elevated: 'border-gray-200 shadow-lg',
    outlined: 'border-2 border-gray-300',
    primary: 'border-primary-200 bg-primary-50',
    success: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  }

  const hoverClasses = hoverable ? 'hover:shadow-lg hover:-translate-y-1' : ''
  const clickableClasses = clickable ? 'cursor-pointer active:scale-98' : ''

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
  }
  const handleMouseDown = () => clickable && setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)

  return (
    <div
      className={`
        relative
        ${baseClasses}
        ${variants[variant]}
        ${hoverClasses}
        ${clickableClasses}
        ${isPressed ? 'scale-98' : 'scale-100'}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {/* Animated border on hover */}
      {isHovered && hoverable && (
        <div className="absolute inset-0 rounded-lg border-2 border-primary-300 opacity-50" />
      )}
      
      {children}
    </div>
  )
}

export default InteractiveCard