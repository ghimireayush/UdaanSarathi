import { Button } from './Button'

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-gray-200/50 transition-all duration-300 hover:shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 border-b border-gray-200/50 bg-white/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg font-bold text-gray-900 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 py-4 bg-gray-50/50 border-t border-gray-200/50 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Button }