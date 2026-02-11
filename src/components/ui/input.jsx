import * as React from "react"
import { cn } from "@/lib/utils.js"
import { useTheme } from "@/lib/theme.js"

const Input = React.forwardRef(
  ({ 
    className, 
    type, 
    variant = 'glass',
    size = 'default',
    icon,
    iconPosition = 'left',
    error = false,
    success = false,
    ...props 
  }, ref) => {
    const { theme } = useTheme()

    return (
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 pointer-events-none transition-colors duration-500">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            // Base styles - professional glassmorphism with improved touch targets
            "flex w-full rounded-lg border text-sm transition-all duration-500 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] px-3 py-2.5",
            
            // Variants - professional sober aesthetic
            {
              // Glass variant - default glassmorphism with enhanced focus
              'backdrop-blur-xl bg-white/8 border-white/15 text-foreground hover:bg-white/12 hover:border-white/20 focus-visible:bg-white/12 focus-visible:border-white/30 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-400/50': variant === 'glass' || variant === 'default',
              
              // Outline variant - strong border with better feedback
              'bg-white/5 border-white/20 text-foreground hover:bg-white/8 hover:border-white/25 focus-visible:bg-white/12 focus-visible:border-white/30 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-400/50': variant === 'outline',
              
              // Filled variant - heavier background with clear focus
              'backdrop-blur-sm bg-white/10 border-white/10 text-foreground hover:bg-white/15 hover:border-white/20 focus-visible:bg-white/15 focus-visible:border-white/30 focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-cyan-400/50': variant === 'filled',
              
              // Ghost variant - minimal styling with accessible focus
              'bg-transparent border-transparent text-foreground hover:bg-white/5 hover:border-white/10 focus-visible:bg-white/8 focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-cyan-400/50': variant === 'ghost',
              
              // Error state styling
              'border-red-500/50 bg-red-500/5 hover:border-red-500/70 focus-visible:border-red-500 focus-visible:ring-red-500/50': error,
              
              // Success state styling
              'border-green-500/50 bg-green-500/5 hover:border-green-500/70 focus-visible:border-green-500 focus-visible:ring-green-500/50': success,
            },
            
            // Sizes with better proportions
            {
              'h-8 px-3 py-1 text-xs': size === 'sm',
              'h-10 px-3 py-2': size === 'default',
              'h-12 px-4 py-3 text-base': size === 'lg',
            },
            
            // Icon padding
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            
            // State colors with glassmorphism
            error && 'backdrop-blur-xl bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 focus-visible:border-red-500/30 focus-visible:bg-red-500/15',
            success && 'backdrop-blur-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 focus-visible:border-emerald-500/30 focus-visible:bg-emerald-500/15',
            
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 pointer-events-none transition-colors duration-500">
            {icon}
          </div>
        )}
        
        {/* Focus ring animation - subtle glow */}
        <div className="absolute inset-0 rounded-lg transition-all duration-500 pointer-events-none opacity-0 focus-within:opacity-60 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }