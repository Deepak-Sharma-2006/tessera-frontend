import * as React from "react"
import { cn } from "@/lib/utils.js"
import { useTheme } from "@/lib/theme.js"

const Textarea = React.forwardRef(
  ({ 
    className, 
    variant = 'glass',
    size = 'default',
    error = false,
    success = false,
    resize = true,
    ...props 
  }, ref) => {
    return (
      <div className="relative">
        <textarea
          className={cn(
            // Base styles - professional glassmorphism
            "flex w-full rounded-lg border text-sm transition-all duration-500 placeholder:text-cyan-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            
            // Variants - professional sober aesthetic
            {
              // Glass variant - default glassmorphism with cyan theme
              'backdrop-blur-xl bg-cyan-950/20 border-cyan-400/30 text-cyan-50 hover:bg-cyan-950/30 hover:border-cyan-400/40 focus-visible:bg-cyan-950/30 focus-visible:border-cyan-400/50 focus-visible:shadow-md shadow-cyan-400/10': variant === 'glass' || variant === 'default',
              
              // Outline variant - strong border
              'bg-cyan-950/15 border-cyan-400/40 text-cyan-50 hover:bg-cyan-950/25 hover:border-cyan-400/50 focus-visible:bg-cyan-950/30 focus-visible:border-cyan-400/60 focus-visible:shadow-md': variant === 'outline',
              
              // Filled variant - heavier background
              'backdrop-blur-sm bg-cyan-950/30 border-cyan-400/40 text-cyan-50 hover:bg-cyan-950/40 hover:border-cyan-400/50 focus-visible:bg-cyan-950/40 focus-visible:border-cyan-400/60 focus-visible:shadow-md': variant === 'filled',
              
              // Ghost variant - minimal styling
              'bg-transparent border-transparent text-cyan-50 hover:bg-cyan-950/15 hover:border-cyan-400/30 focus-visible:bg-cyan-950/25 focus-visible:border-cyan-400/40': variant === 'ghost',
            },
            
            // Sizes with better proportions
            {
              'min-h-[60px] px-3 py-2 text-xs': size === 'sm',
              'min-h-[80px] px-3 py-2': size === 'default',
              'min-h-[100px] px-4 py-3 text-base': size === 'lg',
            },
            
            // Resize behavior
            resize ? 'resize-y' : 'resize-none',
            
            // State colors with glassmorphism
            error && 'backdrop-blur-xl bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 focus-visible:border-red-500/30 focus-visible:bg-red-500/15',
            success && 'backdrop-blur-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 focus-visible:border-emerald-500/30 focus-visible:bg-emerald-500/15',
            
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Focus ring animation - subtle glow */}
        <div className="absolute inset-0 rounded-lg transition-all duration-500 pointer-events-none opacity-0 focus-within:opacity-60 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }