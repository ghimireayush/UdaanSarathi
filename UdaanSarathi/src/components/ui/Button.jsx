import { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-brand-navy to-brand-blue-bright text-white",
          "hover:from-brand-navy/90 hover:to-brand-blue-bright/90",
          "focus:ring-brand-blue-bright",
          "shadow-md hover:shadow-lg"
        ],
        secondary: [
          "bg-white/80 backdrop-blur-sm text-gray-800 border border-gray-200/50",
          "hover:bg-white/90 hover:border-gray-300/50",
          "focus:ring-brand-blue-bright"
        ],
        success: [
          "bg-gradient-to-r from-brand-green-vibrant to-green-500 text-white",
          "hover:from-brand-green-vibrant/90 hover:to-green-500/90",
          "focus:ring-brand-green-vibrant"
        ],
        danger: [
          "bg-gradient-to-r from-red-500 to-red-600 text-white",
          "hover:from-red-500/90 hover:to-red-600/90",
          "focus:ring-red-500"
        ],
        outline: [
          "bg-transparent border border-brand-blue-bright text-brand-navy",
          "hover:bg-brand-blue-bright/10",
          "focus:ring-brand-blue-bright"
        ],
        ghost: [
          "bg-transparent text-gray-700 hover:text-brand-navy",
          "hover:bg-gray-100/50",
          "focus:ring-brand-blue-bright"
        ]
      },
      size: {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-6 py-3",
        xl: "text-lg px-8 py-4"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

const Button = forwardRef(({ 
  children, 
  variant = "primary", 
  size = "md", 
  fullWidth = false, 
  loading = false, 
  disabled = false, 
  className = "", 
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className={`mr-2 animate-spin ${size === 'sm' ? 'w-3 h-3' : size === 'lg' || size === 'xl' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      )}
      {leftIcon && !loading && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }