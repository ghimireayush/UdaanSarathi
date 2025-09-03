import React from 'react'
import { Loader2 } from 'lucide-react'

const InteractiveLoader = ({ 
  type = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
  className = ''
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colors = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    white: 'text-white'
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const SpinnerLoader = () => (
    <Loader2 className={`${sizes[size]} ${colors[color]} animate-spin`} />
  )

  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`${sizes[size]} ${colors[color].replace('text-', 'bg-')} rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )

  const PulseLoader = () => (
    <div className={`${sizes[size]} ${colors[color].replace('text-', 'bg-')} rounded-full animate-ping`} />
  )

  const BarsLoader = () => (
    <div className="flex space-x-1 items-end">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`w-1 ${colors[color].replace('text-', 'bg-')} animate-pulse`}
          style={{
            height: `${12 + (i % 2) * 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  )

  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  )

  const RippleLoader = () => (
    <div className="relative">
      {[0, 1].map(i => (
        <div
          key={i}
          className={`absolute border-2 ${colors[color].replace('text-', 'border-')} rounded-full animate-ping`}
          style={{
            width: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px',
            height: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px',
            animationDelay: `${i * 0.5}s`,
            animationDuration: '2s'
          }}
        />
      ))}
    </div>
  )

  const loaderComponents = {
    spinner: SpinnerLoader,
    dots: DotsLoader,
    pulse: PulseLoader,
    bars: BarsLoader,
    skeleton: SkeletonLoader,
    ripple: RippleLoader
  }

  const LoaderComponent = loaderComponents[type] || SpinnerLoader

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <LoaderComponent />
      {text && (
        <p className={`${textSizes[size]} ${colors[color]} font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          {content}
        </div>
      </div>
    )
  }

  return content
}

// Loading states for different scenarios
export const LoadingStates = {
  // Page loading
  PageLoader: ({ text = "Loading..." }) => (
    <div className="min-h-screen flex items-center justify-center">
      <InteractiveLoader type="spinner" size="lg" text={text} />
    </div>
  ),

  // Card loading
  CardLoader: () => (
    <div className="p-6 space-y-4">
      <InteractiveLoader type="skeleton" />
    </div>
  ),

  // Button loading
  ButtonLoader: ({ size = 'sm' }) => (
    <InteractiveLoader type="spinner" size={size} color="white" />
  ),

  // Table loading
  TableLoader: ({ rows = 5 }) => (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  ),

  // Form loading
  FormLoader: () => (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default InteractiveLoader