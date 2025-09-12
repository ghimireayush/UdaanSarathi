// Enhanced Loading Component with Skeleton States
import { Loader2 } from 'lucide-react'

const Loading = ({ 
  size = 'default', 
  text = 'Loading...', 
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  const textSizes = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg'
  }

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mb-2`} />
      <p className={`${textSizes[size]} text-gray-600 animate-pulse`}>
        {text}
      </p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingContent />
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <LoadingContent />
      </div>
    )
  }

  return <LoadingContent />
}

// Skeleton Loading Components
export const SkeletonCard = ({ lines = 3, className = '' }) => (
  <div className={`card-responsive ${className}`}>
    <div className="loading-skeleton h-6 w-3/4 mb-4"></div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`loading-skeleton h-4 mb-2 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`}></div>
    ))}
  </div>
)

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`card ${className}`}>
    <div className="overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="loading-skeleton h-4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="loading-skeleton h-4"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export const SkeletonList = ({ items = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
        <div className="loading-skeleton w-12 h-12 rounded-full"></div>
        <div className="flex-1">
          <div className="loading-skeleton h-4 w-3/4 mb-2"></div>
          <div className="loading-skeleton h-3 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
)

export const SkeletonGrid = ({ items = 6, columns = 3, className = '' }) => (
  <div className={`grid-responsive-${columns} ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} lines={2} />
    ))}
  </div>
)

export default Loading